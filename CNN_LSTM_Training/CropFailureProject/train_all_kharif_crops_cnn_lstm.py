#!/usr/bin/env python3
"""
=============================================================================
Unified Multi-Crop Spatiotemporal CNN-LSTM Model for Maharashtra Kharif Crops
Project: Spatiotemporal CNN-LSTM Framework for Kharif Crop Failure Prediction
Supported Kharif Crops: Rice, Soybean, Cotton, Bajra, Jowar, Tur
=============================================================================
Combines:
1. Multi-spectral Sentinel-2 satellite patches [T=6, C=8, H=32, W=32]
2. Climate forcing vectors (cumulative rainfall, departure %, ONI SST anomaly, coverage)
3. Crop identity conditioning vector (6-dimensional one-hot encoding)
4. Audited DES ground-truth yield failure labels (>15% yield deficit)
Evaluated under Leave-One-Season-Out (LOSO) Cross-Validation across all test years.
=============================================================================
"""

import os
import sys
import json
import re
import random
from pathlib import Path
from collections import defaultdict
import numpy as np
import pandas as pd
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, precision_score,
    recall_score, f1_score, roc_auc_score, average_precision_score,
    brier_score_loss, confusion_matrix
)

# ---------------------------------------------------------------------------
# Constants & Configuration
# ---------------------------------------------------------------------------
YEARS = [2019, 2020, 2021, 2022]
WINDOWS = ['t01', 't02', 't03', 't04', 't05', 't06']
CHANNELS = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI', 'NDWI']
PATCH_SIZE = 32
FILL_VALUE = -9999.0

ALL_KHARIF_CROPS = ['Rice', 'Soybean', 'Cotton', 'Bajra', 'Jowar', 'Tur']
CROP_TO_IDX = {c: i for i, c in enumerate(ALL_KHARIF_CROPS)}

# NOAA CPC Seasonal ONI Summer Anomaly (Jun-Aug Mean)
ONI_MEAN_BY_YEAR = {2019: 0.30, 2020: -0.40, 2021: -0.43, 2022: -0.97}


def seed_everything(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.set_num_threads(max(1, min(4, torch.get_num_threads())))


def clean_name(val):
    if pd.isna(val):
        return ''
    return re.sub(r'[^a-z0-9]', '', str(val).lower())


# ---------------------------------------------------------------------------
# Data Loading: All Crops Ground-Truth & Climate Lookups
# ---------------------------------------------------------------------------
def load_all_crops_lookups(data_dir: Path):
    all_crops_path = data_dir / 'standardized_maharashtra_kharif_all_crops_1966_2024.csv'
    if not all_crops_path.exists():
        # Fallback to parent data directory
        all_crops_path = data_dir.parent.parent / 'data' / 'standardized_maharashtra_kharif_all_crops_1966_2024.csv'
    
    print(f"Loading ground-truth labels from: {all_crops_path.name}")
    df_crops = pd.read_csv(all_crops_path)
    df_crops['district_clean'] = df_crops['district'].map(clean_name)
    df_crops['crop_clean'] = df_crops['crop'].astype(str).str.strip()
    
    # Target failure label: 15% deficit threshold
    df_crops['failure_label'] = pd.to_numeric(df_crops['crop_failure_label_15pct'], errors='coerce')
    df_crops = df_crops.dropna(subset=['district_clean', 'year', 'crop_clean', 'failure_label'])
    df_crops['year'] = df_crops['year'].astype(int)
    df_crops['failure_label'] = df_crops['failure_label'].astype(int)
    
    # Key: (district_clean, crop_name, year) -> failure_label (0 or 1)
    labels_lookup = {}
    yield_lookup = {}
    for r in df_crops.itertuples(index=False):
        key = (r.district_clean, r.crop_clean.lower(), int(r.year))
        labels_lookup[key] = int(r.failure_label)
        yield_lookup[key] = {
            'yield_kg_ha': float(r.yield_kg_ha),
            'baseline_yield_kg_ha': float(r.baseline_yield_olympic_kg_ha),
            'anomaly_pct': float(r.yield_anomaly_pct)
        }
    
    # Load IMD Rainfall
    imd_path = data_dir / 'imd_district_kharif_rainfall_2015_2022.csv'
    if not imd_path.exists():
        imd_path = data_dir.parent.parent / 'data' / 'imd_district_kharif_rainfall_2015_2022.csv'
        
    print(f"Loading IMD rainfall from: {imd_path.name}")
    df_imd = pd.read_csv(imd_path)
    df_imd['district_clean'] = df_imd['district'].map(clean_name)
    
    # Extract year integer
    def parse_yr(y):
        m = re.search(r'(?:19|20)\d{2}', str(y))
        return int(m.group(0)) if m else None
    
    df_imd['year_int'] = df_imd['year'].map(parse_yr)
    df_imd['rainfall_mm'] = pd.to_numeric(df_imd['kharif_rainfall_mm'], errors='coerce')
    df_imd = df_imd.dropna(subset=['district_clean', 'year_int', 'rainfall_mm'])
    
    rainfall_lookup = {}
    for r in df_imd.itertuples(index=False):
        rainfall_lookup[(r.district_clean, int(r.year_int))] = float(r.rainfall_mm)
        
    rain_baseline = df_imd.groupby('district_clean')['rainfall_mm'].mean().to_dict()
    
    print(f"Total crop-district-season ground truth records: {len(labels_lookup)}")
    return labels_lookup, yield_lookup, rainfall_lookup, rain_baseline


# ---------------------------------------------------------------------------
# Multi-Crop Spatiotemporal Dataset Assembly
# ---------------------------------------------------------------------------
def build_multicrop_dataset(data_dir: Path, labels_lookup, yield_lookup, rainfall_lookup, rain_baseline):
    # Locate all satellite GeoJSONs and newly downloaded GeoTIFFs
    geotiff_dirs = [
        data_dir.parent / 'SatteliteImagery' / 'Maharashtra_Sentinel2_Rice_Patches_2019',
        data_dir.parent.parent / 'data' / 'Maharashtra_Sentinel2_Rice_Patches-20261020T184020Z-1-001' / 'Maharashtra_Sentinel2_Rice_Patches',
        data_dir.parent.parent / 'data' / 'gee_exports'
    ]
    geotiff_files = {}
    for gtd in geotiff_dirs:
        if gtd.exists():
            for tif in gtd.glob('*.tif'):
                m = re.search(r's2_(mh_\d+)_(\d{4})_rice_patch', tif.name.lower())
                if m:
                    loc_tag = m.group(1).upper()
                    yr_tag = int(m.group(2))
                    geotiff_files[(loc_tag, yr_tag)] = tif
                    
    sat_samples = []     # [patch_arr, loc_id, district, district_clean, year, cov]
    
    for year in YEARS:
        geojson_path = data_dir / f'MH_Rice_S2_Patches_{year}.geojson'
        if not geojson_path.exists():
            geojson_path = data_dir.parent / 'CropFailureProject' / f'MH_Rice_S2_Patches_{year}.geojson'
            
        print(f"Reading satellite features for {year}: {geojson_path.name}")
        with geojson_path.open('r', encoding='utf-8') as f:
            geo = json.load(f)
            
        for feature in geo.get('features', []):
            props = feature.get('properties') or {}
            district = str(props.get('district', '')).strip()
            district_clean = clean_name(district)
            loc_id = str(props.get('location_id', feature.get('id', 'unknown')))
            yr = int(props.get('satellite_year', year))
            
            # Check if rainfall and ONI exist
            if (district_clean, yr) not in rainfall_lookup or yr not in ONI_MEAN_BY_YEAR:
                continue
                
            patch = np.full((6, 8, PATCH_SIZE, PATCH_SIZE), np.nan, dtype=np.float32)
            cov = np.zeros(6, dtype=np.float32)
            valid_arrays = False
            
            # Try loading GeoTIFF if available
            gt_key = (loc_id.upper(), yr)
            if gt_key in geotiff_files:
                try:
                    import rasterio
                    with rasterio.open(geotiff_files[gt_key]) as src:
                        raw_arr = src.read()
                        if raw_arr.shape == (48, PATCH_SIZE, PATCH_SIZE):
                            patch = raw_arr.reshape(6, 8, PATCH_SIZE, PATCH_SIZE).astype(np.float32)
                            patch[(~np.isfinite(patch)) | (patch <= -9998.0)] = np.nan
                            patch[np.abs(patch) > 3.0] = np.nan
                            cov = np.ones(6, dtype=np.float32)
                            valid_arrays = True
                except Exception:
                    valid_arrays = False
                    
            if not valid_arrays:
                valid_arrays = True
                for ti, w in enumerate(WINDOWS):
                    for ci, band in enumerate(CHANNELS):
                        key = f'{w}_{band}'
                        value = props.get(key)
                        if not isinstance(value, list):
                            valid_arrays = False
                            continue
                        arr = np.asarray(value, dtype=np.float32)
                        if arr.shape != (PATCH_SIZE, PATCH_SIZE):
                            valid_arrays = False
                            continue
                        arr = arr.copy()
                        arr[(~np.isfinite(arr)) | (arr <= -9998.0)] = np.nan
                        arr[np.abs(arr) > 3.0] = np.nan
                        patch[ti, ci] = arr
                    b2 = patch[ti, 0]
                    cov[ti] = float(np.isfinite(b2).mean())
                    
            if not valid_arrays or float(cov.sum()) <= 0:
                continue
                
            sat_samples.append({
                'patch': patch,
                'loc_id': loc_id,
                'district': district,
                'district_clean': district_clean,
                'year': yr,
                'coverage': cov
            })

    print(f"Total valid spatiotemporal satellite patches extracted: {len(sat_samples)}")
    
    # Now, replicate patches across all Kharif crops that have verified ground truth
    all_sat = []
    all_climate = []
    all_y = []
    manifest_records = []
    
    for s in sat_samples:
        d_clean = s['district_clean']
        yr = s['year']
        rain = rainfall_lookup[(d_clean, yr)]
        base_rain = rain_baseline.get(d_clean, rain)
        rain_dep = ((rain - base_rain) / base_rain * 100.0) if base_rain > 0 else 0.0
        oni = ONI_MEAN_BY_YEAR[yr]
        cov = s['coverage']
        
        # Test each Kharif crop
        for crop_name in ALL_KHARIF_CROPS:
            crop_key = (d_clean, crop_name.lower(), yr)
            if crop_key in labels_lookup:
                target_label = labels_lookup[crop_key]
                yield_info = yield_lookup.get(crop_key, {})
                
                # Create one-hot encoding for crop
                crop_onehot = np.zeros(len(ALL_KHARIF_CROPS), dtype=np.float32)
                crop_onehot[CROP_TO_IDX[crop_name]] = 1.0
                
                # Base climate features: [rain, rain_dep, oni]
                # Combined with crop one-hot: [rain, rain_dep, oni, c0, c1, c2, c3, c4, c5] -> 9 features
                climate_static = np.concatenate([
                    np.array([rain, rain_dep, oni], dtype=np.float32),
                    crop_onehot
                ])
                
                all_sat.append(s['patch'])
                all_climate.append((climate_static, cov))
                all_y.append(target_label)
                
                manifest_records.append({
                    'location_id': s['loc_id'],
                    'district': s['district'],
                    'district_clean': d_clean,
                    'crop': crop_name,
                    'satellite_year': yr,
                    'crop_year': f'{yr}-{yr+1}',
                    'actual_failure': target_label,
                    'yield_kg_ha': yield_info.get('yield_kg_ha', np.nan),
                    'baseline_yield_kg_ha': yield_info.get('baseline_yield_kg_ha', np.nan),
                    'yield_anomaly_pct': yield_info.get('anomaly_pct', np.nan),
                    'rainfall_mm': rain,
                    'rainfall_departure_pct': rain_dep,
                    'oni_anomaly': oni,
                    'mean_valid_pixel_fraction': float(cov.mean())
                })
                
    X_sat = np.stack(all_sat).astype(np.float32)
    y = np.array(all_y, dtype=np.float32)
    df_manifest = pd.DataFrame(manifest_records)
    
    print(f"Total multi-crop training samples: {len(X_sat)}")
    print(f"Failure class distribution: {np.bincount(y.astype(int))}")
    print(df_manifest['crop'].value_counts())
    
    return X_sat, all_climate, y, df_manifest


# ---------------------------------------------------------------------------
# Multi-Crop CNN-LSTM PyTorch Neural Network
# ---------------------------------------------------------------------------
class MultiCropSpatiotemporalCNNLSTM(nn.Module):
    def __init__(self, n_sat_channels=8, n_climate_features=10, hidden_dim=24):
        """
        n_sat_channels: 8 (B2, B3, B4, B8, B11, B12, NDVI, NDWI)
        n_climate_features: 3 (rain, departure, ONI) + 1 (cov) + 6 (crop one-hot) = 10
        """
        super().__init__()
        # 2D Spatial Feature Extractor
        self.cnn = nn.Sequential(
            nn.Conv2d(n_sat_channels, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(16, 24, kernel_size=3, padding=1),
            nn.BatchNorm2d(24),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten()
        )
        
        # Temporal Recurrent Stage across 6 fortnightly windows
        lstm_input_dim = 24 + n_climate_features
        self.lstm = nn.LSTM(
            input_size=lstm_input_dim,
            hidden_size=hidden_dim,
            num_layers=1,
            batch_first=True,
            bidirectional=True
        )
        
        # Risk Classification Head
        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim * 2, 24),
            nn.ReLU(inplace=True),
            nn.Dropout(0.25),
            nn.Linear(24, 1)
        )
        
    def forward(self, satellite, climate_seq):
        """
        satellite: [batch, 6, 8, 32, 32]
        climate_seq: [batch, 6, 10]
        """
        b, t, c, h, w = satellite.shape
        cnn_in = satellite.reshape(b * t, c, h, w)
        spatial_features = self.cnn(cnn_in).reshape(b, t, -1) # [b, t, 24]
        
        combined_seq = torch.cat([spatial_features, climate_seq], dim=-1) # [b, t, 34]
        lstm_out, _ = self.lstm(combined_seq) # [b, t, hidden*2]
        
        # Pool temporal output: final Kharif timestep state
        final_state = lstm_out[:, -1, :]
        logits = self.classifier(final_state).squeeze(-1)
        return logits


# ---------------------------------------------------------------------------
# Normalization & Preprocessing
# ---------------------------------------------------------------------------
def fit_normalizer(X_sat, all_climate, train_idx):
    # Satellite mean & std per channel
    tr_sat = X_sat[train_idx]
    s_mean, s_std = [], []
    for c in range(tr_sat.shape[2]):
        vals = tr_sat[:, :, c]
        finite = np.isfinite(vals)
        mean_val = float(vals[finite].mean()) if finite.any() else 0.0
        std_val = float(vals[finite].std()) if finite.any() else 1.0
        if not np.isfinite(std_val) or std_val < 1e-5:
            std_val = 1.0
        s_mean.append(mean_val)
        s_std.append(std_val)
        
    # Climate mean & std for the first 3 continuous features
    clim_mat = np.array([c[0][:3] for c in all_climate])[train_idx]
    c_mean = np.mean(clim_mat, axis=0)
    c_std = np.std(clim_mat, axis=0)
    c_std[c_std < 1e-5] = 1.0
    
    return np.array(s_mean, np.float32), np.array(s_std, np.float32), c_mean.astype(np.float32), c_std.astype(np.float32)


def transform_data(X_sat, all_climate, s_mean, s_std, c_mean, c_std):
    # Standardize satellite
    norm_sat = np.zeros_like(X_sat)
    for c in range(X_sat.shape[2]):
        vals = X_sat[:, :, c]
        valid = np.isfinite(vals)
        norm = (vals - s_mean[c]) / s_std[c]
        norm = np.clip(norm, -4.0, 4.0)
        norm_sat[:, :, c] = np.where(valid, norm, 0.0)
        
    # Construct sequence [N, 6, 10]
    n_samples = len(all_climate)
    clim_seq = np.zeros((n_samples, 6, 10), dtype=np.float32)
    
    for i, (static_clim, cov) in enumerate(all_climate):
        # Continuous climate normalized
        c_norm = (static_clim[:3] - c_mean) / c_std
        c_norm = np.clip(c_norm, -4.0, 4.0)
        
        # Crop one-hot remains unscaled (0 or 1)
        crop_onehot = static_clim[3:]
        
        for t in range(6):
            # [norm_rain, norm_dep, norm_oni, cov_t, crop0..crop5]
            clim_seq[i, t, :3] = c_norm
            clim_seq[i, t, 3] = cov[t]
            clim_seq[i, t, 4:] = crop_onehot
            
    return norm_sat, clim_seq


# ---------------------------------------------------------------------------
# Training & LOSO Cross-Validation Loop
# ---------------------------------------------------------------------------
def run_loso_multicrop_training(output_dir: Path):
    data_dir = output_dir.parent.parent / 'data'
    if not data_dir.exists():
        data_dir = output_dir
        
    labels_lookup, yield_lookup, rainfall_lookup, rain_baseline = load_all_crops_lookups(data_dir)
    X_sat, all_climate, y, df_manifest = build_multicrop_dataset(output_dir, labels_lookup, yield_lookup, rainfall_lookup, rain_baseline)
    
    seed_everything(42)
    
    print("\n=======================================================")
    print("STARTING LEAVE-ONE-SEASON-OUT (LOSO) CROSS-VALIDATION")
    print(f"Years: {YEARS} | Crops: {ALL_KHARIF_CROPS}")
    print("=======================================================\n")
    
    loso_predictions = []
    fold_metrics = {}
    
    for test_year in YEARS:
        test_mask = (df_manifest['satellite_year'] == test_year).values
        train_mask = ~test_mask
        
        train_idx = np.where(train_mask)[0]
        test_idx = np.where(test_mask)[0]
        
        s_mean, s_std, c_mean, c_std = fit_normalizer(X_sat, all_climate, train_idx)
        norm_sat, clim_seq = transform_data(X_sat, all_climate, s_mean, s_std, c_mean, c_std)
        
        # Class weighting
        y_train = y[train_idx]
        pos = (y_train == 1).sum()
        neg = (y_train == 0).sum()
        pos_weight = torch.tensor(max(1.0, float(neg) / max(1.0, float(pos))), dtype=torch.float32)
        
        model = MultiCropSpatiotemporalCNNLSTM()
        optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-3)
        criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
        
        train_ds = TensorDataset(
            torch.from_numpy(norm_sat[train_idx]),
            torch.from_numpy(clim_seq[train_idx]),
            torch.from_numpy(y_train)
        )
        loader = DataLoader(train_ds, batch_size=32, shuffle=True)
        
        model.train()
        for epoch in range(1, 26):
            for xs, xc, yy in loader:
                optimizer.zero_grad()
                out = model(xs, xc)
                loss = criterion(out, yy)
                loss.backward()
                nn.utils.clip_grad_norm_(model.parameters(), 2.0)
                optimizer.step()
                
        # Inference on held-out test year
        model.eval()
        with torch.no_grad():
            test_xs = torch.from_numpy(norm_sat[test_idx])
            test_xc = torch.from_numpy(clim_seq[test_idx])
            logits = model(test_xs, test_xc)
            probs = torch.sigmoid(logits).cpu().numpy()
            
        y_test = y[test_idx]
        preds = (probs >= 0.5).astype(int)
        
        acc = accuracy_score(y_test, preds)
        bal_acc = balanced_accuracy_score(y_test, preds)
        f1 = f1_score(y_test, preds, zero_division=0)
        try:
            auc = roc_auc_score(y_test, probs)
        except Exception:
            auc = 0.5
            
        fold_metrics[test_year] = {
            'samples': len(test_idx),
            'accuracy': float(acc),
            'balanced_accuracy': float(bal_acc),
            'f1_score': float(f1),
            'roc_auc': float(auc)
        }
        print(f"Fold {test_year} -> Test Samples: {len(test_idx)}, Acc: {acc:.4f}, BalAcc: {bal_acc:.4f}, F1: {f1:.4f}, AUC: {auc:.4f}")
        
        # Record predictions
        for idx_pos, df_idx in enumerate(test_idx):
            row = df_manifest.iloc[df_idx].to_dict()
            row['predicted_probability'] = float(probs[idx_pos])
            row['predicted_failure'] = int(preds[idx_pos])
            loso_predictions.append(row)
            
    df_loso = pd.DataFrame(loso_predictions)
    
    # Train Full Operational Checkpoint on ALL years
    print("\n[*] Training Full Operational Checkpoint on All Available Seasons...")
    all_indices = np.arange(len(X_sat))
    s_mean, s_std, c_mean, c_std = fit_normalizer(X_sat, all_climate, all_indices)
    norm_sat, clim_seq = transform_data(X_sat, all_climate, s_mean, s_std, c_mean, c_std)
    
    pos = (y == 1).sum()
    neg = (y == 0).sum()
    pos_weight = torch.tensor(max(1.0, float(neg) / max(1.0, float(pos))), dtype=torch.float32)
    
    operational_model = MultiCropSpatiotemporalCNNLSTM()
    optimizer = torch.optim.AdamW(operational_model.parameters(), lr=1e-3, weight_decay=1e-3)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    
    full_ds = TensorDataset(torch.from_numpy(norm_sat), torch.from_numpy(clim_seq), torch.from_numpy(y))
    loader = DataLoader(full_ds, batch_size=32, shuffle=True)
    
    operational_model.train()
    for epoch in range(1, 30):
        for xs, xc, yy in loader:
            optimizer.zero_grad()
            out = operational_model(xs, xc)
            loss = criterion(out, yy)
            loss.backward()
            nn.utils.clip_grad_norm_(operational_model.parameters(), 2.0)
            optimizer.step()
            
    operational_model.eval()
    with torch.no_grad():
        all_logits = operational_model(torch.from_numpy(norm_sat), torch.from_numpy(clim_seq))
        all_in_sample_probs = torch.sigmoid(all_logits).cpu().numpy()
        
    df_manifest['in_sample_probability'] = all_in_sample_probs
    df_manifest['is_failure_predicted'] = (all_in_sample_probs >= 0.5).astype(int)
    
    # Save Model Checkpoint
    checkpoint_path = output_dir / 'crop_failure_model_all_crops.pt'
    torch.save({
        'model_state_dict': operational_model.state_dict(),
        's_mean': s_mean,
        's_std': s_std,
        'c_mean': c_mean,
        'c_std': c_std,
        'supported_crops': ALL_KHARIF_CROPS,
        'crop_to_idx': CROP_TO_IDX,
        'architecture': 'MultiCropSpatiotemporalCNNLSTM',
        'n_sat_channels': 8,
        'n_climate_features': 10,
        'hidden_dim': 24,
        'timestamp': pd.Timestamp.now().isoformat()
    }, checkpoint_path)
    print(f"[+] Saved PyTorch Model Checkpoint to: {checkpoint_path}")
    
    # Also copy to root data directory
    root_checkpoint = data_dir / 'crop_failure_model.pt'
    import shutil
    shutil.copyfile(checkpoint_path, root_checkpoint)
    print(f"[+] Synced Checkpoint to root data: {root_checkpoint}")
    
    # Aggregate Predictions to District-Crop-Year Level for Dashboard Ingestion
    district_preds = df_manifest.groupby(
        ['district_clean', 'district', 'crop', 'satellite_year', 'crop_year'],
        as_index=False
    ).agg(
        mean_probability=('in_sample_probability', 'mean'),
        median_probability=('in_sample_probability', 'median'),
        actual_failure=('actual_failure', 'first'),
        patches=('location_id', 'count'),
        rainfall_mm=('rainfall_mm', 'first'),
        rainfall_departure_pct=('rainfall_departure_pct', 'first'),
        oni_anomaly=('oni_anomaly', 'first'),
        mean_valid_pixel_fraction=('mean_valid_pixel_fraction', 'mean'),
        yield_kg_ha=('yield_kg_ha', 'first'),
        baseline_yield_kg_ha=('baseline_yield_kg_ha', 'first'),
        yield_anomaly_pct=('yield_anomaly_pct', 'first')
    )
    
    # Save All-Crops Prediction CSV
    preds_out_csv = data_dir / 'crop_failure_predictions.csv'
    district_preds.to_csv(preds_out_csv, index=False)
    print(f"[+] Saved All-Kharif District Predictions to: {preds_out_csv} ({len(district_preds)} records)")
    
    # Compute and Save Comprehensive Evaluation Metrics
    overall_y = df_loso['actual_failure'].values
    overall_probs = df_loso['predicted_probability'].values
    overall_preds = df_loso['predicted_failure'].values
    
    eval_summary = {
        'evaluation_mode': 'Leave-One-Season-Out (LOSO) Cross-Validation',
        'crops_evaluated': ALL_KHARIF_CROPS,
        'years_evaluated': YEARS,
        'total_evaluated_samples': len(df_loso),
        'overall_metrics': {
            'accuracy': float(accuracy_score(overall_y, overall_preds)),
            'balanced_accuracy': float(balanced_accuracy_score(overall_y, overall_preds)),
            'f1_score': float(f1_score(overall_y, overall_preds, zero_division=0)),
            'precision': float(precision_score(overall_y, overall_preds, zero_division=0)),
            'recall': float(recall_score(overall_y, overall_preds, zero_division=0)),
            'roc_auc': float(roc_auc_score(overall_y, overall_probs)),
            'pr_auc': float(average_precision_score(overall_y, overall_probs)),
            'brier_score': float(brier_score_loss(overall_y, overall_probs))
        },
        'fold_metrics_by_year': fold_metrics,
        'metrics_by_crop': {}
    }
    
    for c in ALL_KHARIF_CROPS:
        crop_sub = df_loso[df_loso['crop'] == c]
        if len(crop_sub) > 0 and len(np.unique(crop_sub['actual_failure'])) > 1:
            cy = crop_sub['actual_failure'].values
            cp = crop_sub['predicted_probability'].values
            cpred = crop_sub['predicted_failure'].values
            eval_summary['metrics_by_crop'][c] = {
                'samples': len(crop_sub),
                'accuracy': float(accuracy_score(cy, cpred)),
                'balanced_accuracy': float(balanced_accuracy_score(cy, cpred)),
                'f1_score': float(f1_score(cy, cpred, zero_division=0)),
                'roc_auc': float(roc_auc_score(cy, cp)),
                'pr_auc': float(average_precision_score(cy, cp))
            }
            
    eval_json_path = data_dir / 'evaluation_metrics.json'
    with open(eval_json_path, 'w', encoding='utf-8') as f:
        json.dump(eval_summary, f, indent=2)
    print(f"[+] Saved Evaluation Metrics JSON to: {eval_json_path}")
    
    return operational_model, eval_summary


if __name__ == '__main__':
    project_dir = Path(__file__).resolve().parent
    run_loso_multicrop_training(project_dir)
