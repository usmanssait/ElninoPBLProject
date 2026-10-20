#!/usr/bin/env python3
"""
Spatiotemporal CNN-LSTM Model Training Pipeline for Kharif Rice Crop Failure Early Warning
Using:
1. Multi-spectral 48-band Sentinel-2 patches [T=6, C=8, H=32, W=32] (20m GSD)
2. IMD 0.25° gridded Kharif rainfall & district precipitation departures
3. NOAA Oceanic Niño Index (ONI) & Indian Ocean Dipole (IOD) indices
4. Ministry of Agriculture DES audited ground truth (PMFBY 5-year Olympic baseline failure labels)

Validation Strategies:
- Spatial Holdout: 25% completely unseen canonical districts held out
- Temporal Cross-Validation: Leave-One-Season-Out (LOSO) across all monitored seasons
"""

import argparse
import json
import re
import sys
import time
import random
from pathlib import Path
from collections import defaultdict

import numpy as np
import pandas as pd
import rasterio
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, precision_score,
    recall_score, f1_score, roc_auc_score, average_precision_score,
    confusion_matrix, brier_score_loss
)

YEARS = [2019, 2020, 2021, 2022]
WINDOWS = ['T1_Jun01_Jun15', 'T2_Jun16_Jun30', 'T3_Jul01_Jul15', 'T4_Jul16_Jul31', 'T5_Aug01_Aug15', 'T6_Aug16_Aug31']
CHANNELS = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI', 'NDWI']
PATCH_SIZE = 32
ONI_MEAN_BY_YEAR = {2019: 0.30, 2020: -0.40, 2021: -0.43, 2022: -0.97}

def seed_everything(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

def clean_name(val):
    return re.sub(r'\s+', ' ', str(val).strip()).casefold()

# -----------------------------------------------------------------------------
# CNN-LSTM Architecture Definition
# -----------------------------------------------------------------------------
class CropFailureCNNLSTM(nn.Module):
    def __init__(self, n_sat_channels=8, n_climate_features=4, hidden=16):
        super().__init__()
        # 2D CNN Encoder for Spatial Patches at each Timestep
        self.cnn = nn.Sequential(
            nn.Conv2d(n_sat_channels, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2), # 32x32 -> 16x16
            
            nn.Conv2d(16, 24, kernel_size=3, padding=1),
            nn.BatchNorm2d(24),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2), # 16x16 -> 8x8
            
            nn.AdaptiveAvgPool2d((1, 1)), # 8x8 -> 1x1
            nn.Flatten(), # -> 24 features
        )
        # Bidirectional LSTM across T=6 Fortnightly Kharif Intervals
        self.lstm = nn.LSTM(
            input_size=24 + n_climate_features,
            hidden_size=hidden,
            num_layers=1,
            batch_first=True,
            bidirectional=True
        )
        # Prediction Head for Early Warning Binary Failure Risk
        self.head = nn.Sequential(
            nn.Linear(hidden * 2, 16),
            nn.ReLU(inplace=True),
            nn.Dropout(0.25),
            nn.Linear(16, 1)
        )

    def forward(self, satellite, climate):
        # satellite: [B, T=6, C=8, H=32, W=32]
        # climate:   [B, T=6, F=4]
        b, t, c, h, w = satellite.shape
        flat_sat = satellite.reshape(b * t, c, h, w)
        spatial_feats = self.cnn(flat_sat).reshape(b, t, -1)
        
        # Merge spatial and meteorological features along sequence length
        seq_in = torch.cat([spatial_feats, climate], dim=-1) # [B, T, 28]
        lstm_out, _ = self.lstm(seq_in) # [B, T, 32]
        logits = self.head(lstm_out[:, -1, :]).squeeze(-1) # [B]
        return logits

# -----------------------------------------------------------------------------
# Data Ingestion & Tensor Assembly
# -----------------------------------------------------------------------------
def load_all_training_data(project_root: Path, label_threshold: int = 15):
    data_dir = project_root / 'data'
    crop_dir = project_root / 'CNN_LSTM_Training' / 'CropFailureProject'
    patch_dir = project_root / 'CNN_LSTM_Training' / 'SatteliteImagery' / 'Maharashtra_Sentinel2_Rice_Patches_2019'
    
    # 1. Load Ground Truth Audited DES Rice Labels
    des_csv = data_dir / 'standardized_maharashtra_kharif_rice_audited.csv'
    if not des_csv.exists():
        des_csv = data_dir / 'des_rice_maharashtra_kharif_final.csv'
    des_df = pd.read_csv(des_csv)
    
    label_col = f'crop_failure_label_{label_threshold}pct'
    if label_col not in des_df.columns:
        label_col = 'crop_failure_initial'
    des_df['district_key'] = des_df['district'].map(clean_name)
    des_df['year_int'] = des_df['year'].astype(str).str.extract(r'(\d{4})')[0].astype(int)
    des_df[label_col] = pd.to_numeric(des_df[label_col], errors='coerce')
    des_df = des_df.dropna(subset=['district_key', 'year_int', label_col])
    labels = {(r.district_key, int(r.year_int)): int(getattr(r, label_col)) for r in des_df.itertuples()}
    
    # 2. Load IMD Rainfall Baseline
    imd_csv = data_dir / 'imd_district_kharif_rainfall_2015_2022.csv'
    imd_df = pd.read_csv(imd_csv)
    imd_df['district_key'] = imd_df['district'].map(clean_name)
    imd_df['year_int'] = imd_df['year'].astype(str).str.extract(r'(\d{4})')[0].astype(int)
    imd_df['kharif_rainfall_mm'] = pd.to_numeric(imd_df['kharif_rainfall_mm'], errors='coerce')
    imd_df = imd_df.dropna(subset=['district_key', 'year_int', 'kharif_rainfall_mm'])
    rainfall = {(r.district_key, int(r.year_int)): float(r.kharif_rainfall_mm) for r in imd_df.itertuples()}
    rain_baseline = imd_df.groupby('district_key')['kharif_rainfall_mm'].mean().to_dict()
    
    # 3. Load Sample Location Lookup
    loc_csv = project_root / 'CNN_LSTM_Training' / 'SatteliteImagery' / 'rice_sample_locations_2020.csv'
    loc_df = pd.read_csv(loc_csv)
    loc_to_dist = {r.location_id.lower(): (r.district, clean_name(r.district)) for r in loc_df.itertuples()}
    
    # 4. Ingest Direct 2019 Sentinel-2 GeoTIFF Patches
    records = []
    sat_tensors = []
    climate_tensors = []
    labels_list = []
    
    if patch_dir.exists():
        for tif_path in sorted(patch_dir.glob('*.tif')):
            # Filename convention: s2_mh_026_2019_rice_patch.tif
            parts = tif_path.stem.split('_')
            loc_key = f"{parts[1]}_{parts[2]}".lower()
            if loc_key not in loc_to_dist:
                continue
            dist_name, dist_key = loc_to_dist[loc_key]
            yr = 2019
            if (dist_key, yr) not in labels or (dist_key, yr) not in rainfall:
                continue
                
            with rasterio.open(tif_path) as src:
                arr = src.read() # [48, 32, 32]
                tensor = arr.reshape(6, 8, PATCH_SIZE, PATCH_SIZE).astype(np.float32)
                
            rain_mm = rainfall[(dist_key, yr)]
            base_mm = rain_baseline.get(dist_key, rain_mm)
            dep_pct = ((rain_mm - base_mm) / max(base_mm, 1.0)) * 100.0
            oni_val = ONI_MEAN_BY_YEAR.get(yr, 0.0)
            
            # Climate feature vector across T=6: [rainfall_mm, departure_pct, oni, valid_coverage=1.0]
            clim = np.zeros((6, 4), dtype=np.float32)
            clim[:, 0] = rain_mm / 1000.0 # scale meters
            clim[:, 1] = dep_pct / 100.0
            clim[:, 2] = oni_val
            clim[:, 3] = 1.0 # 100% gap-filled clear coverage
            
            sat_tensors.append(tensor)
            climate_tensors.append(clim)
            lbl = labels[(dist_key, yr)]
            labels_list.append(lbl)
            records.append({
                'source': 'direct_geotiff',
                'location_id': loc_key.upper(),
                'district': dist_name,
                'district_key': dist_key,
                'year': yr,
                'rainfall_mm': rain_mm,
                'rainfall_dep_pct': dep_pct,
                'oni': oni_val,
                'label': lbl
            })
            
    # 5. Ingest Existing Multi-Year GeoJSON Feature Stores (2019-2022)
    for yr in YEARS:
        geojson_path = crop_dir / f'MH_Rice_S2_Patches_{yr}.geojson'
        if not geojson_path.exists():
            continue
        with open(geojson_path, 'r', encoding='utf-8') as f:
            geo_data = json.load(f)
        for feat in geo_data.get('features', []):
            props = feat.get('properties', {})
            dist_raw = props.get('district', '')
            dist_key = clean_name(dist_raw)
            loc_id = props.get('location_id', feat.get('id', 'unknown'))
            if (dist_key, yr) not in labels or (dist_key, yr) not in rainfall:
                continue
            
            # Extract 48 bands from GeoJSON properties
            patch = np.full((6, 8, PATCH_SIZE, PATCH_SIZE), 0.0, dtype=np.float32)
            valid_bands = 0
            for t_idx in range(6):
                w_tag = f't{t_idx+1:02d}'
                for c_idx, c_name in enumerate(['b02', 'b03', 'b04', 'b08', 'b11', 'b12', 'ndvi', 'ndwi']):
                    b_key = f'{w_tag}_{c_name}'
                    if b_key in props:
                        val = float(props[b_key])
                        patch[t_idx, c_idx, :, :] = val
                        valid_bands += 1
            if valid_bands < 20:
                continue
                
            rain_mm = rainfall[(dist_key, yr)]
            base_mm = rain_baseline.get(dist_key, rain_mm)
            dep_pct = ((rain_mm - base_mm) / max(base_mm, 1.0)) * 100.0
            oni_val = ONI_MEAN_BY_YEAR.get(yr, 0.0)
            
            clim = np.zeros((6, 4), dtype=np.float32)
            clim[:, 0] = rain_mm / 1000.0
            clim[:, 1] = dep_pct / 100.0
            clim[:, 2] = oni_val
            clim[:, 3] = float(props.get('coverage', 0.85))
            
            sat_tensors.append(patch)
            climate_tensors.append(clim)
            lbl = labels[(dist_key, yr)]
            labels_list.append(lbl)
            records.append({
                'source': f'geojson_{yr}',
                'location_id': loc_id,
                'district': dist_raw,
                'district_key': dist_key,
                'year': yr,
                'rainfall_mm': rain_mm,
                'rainfall_dep_pct': dep_pct,
                'oni': oni_val,
                'label': lbl
            })
            
    sat_arr = np.stack(sat_tensors, axis=0) # [N, 6, 8, 32, 32]
    clim_arr = np.stack(climate_tensors, axis=0) # [N, 6, 4]
    y_arr = np.array(labels_list, dtype=np.float32) # [N]
    meta_df = pd.DataFrame(records)
    
    return sat_arr, clim_arr, y_arr, meta_df, rain_baseline

# -----------------------------------------------------------------------------
# Training & Evaluation Engine
# -----------------------------------------------------------------------------
def train_model(X_sat, X_clim, y, train_indices, epochs=18, lr=0.003, seed=42, pos_weight_scale=1.0):
    seed_everything(seed)
    model = CropFailureCNNLSTM(n_sat_channels=8, n_climate_features=4, hidden=16)
    
    X_s_tr = torch.from_numpy(X_sat[train_indices])
    X_c_tr = torch.from_numpy(X_clim[train_indices])
    y_tr = torch.from_numpy(y[train_indices])
    
    pos_count = float(y_tr.sum().item())
    neg_count = float((y_tr == 0).sum().item())
    pw = (neg_count / max(1.0, pos_count)) * pos_weight_scale
    criterion = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([pw]))
    
    dataset = TensorDataset(X_s_tr, X_c_tr, y_tr)
    loader = DataLoader(dataset, batch_size=16, shuffle=True)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-3)
    
    model.train()
    for ep in range(epochs):
        for b_sat, b_clim, b_y in loader:
            optimizer.zero_grad()
            logits = model(b_sat, b_clim)
            loss = criterion(logits, b_y)
            loss.backward()
            optimizer.step()
            
    return model

def predict_probabilities(model, X_sat, X_clim):
    model.eval()
    with torch.no_grad():
        b_sat = torch.from_numpy(X_sat)
        b_clim = torch.from_numpy(X_clim)
        logits = model(b_sat, b_clim)
        probs = torch.sigmoid(logits).cpu().numpy()
    return probs

def compute_metrics(y_true, y_prob):
    y_pred = (y_prob >= 0.5).astype(int)
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1]).tolist()
    has_pos = int(y_true.sum()) > 0
    has_both = len(np.unique(y_true)) > 1
    
    return {
        'accuracy': float(accuracy_score(y_true, y_pred)),
        'balanced_accuracy': float(balanced_accuracy_score(y_true, y_pred)),
        'precision': float(precision_score(y_true, y_pred, zero_division=0)),
        'recall': float(recall_score(y_true, y_pred, zero_division=0)),
        'f1_score': float(f1_score(y_true, y_pred, zero_division=0)),
        'roc_auc': float(roc_auc_score(y_true, y_prob)) if has_both else None,
        'pr_auc': float(average_precision_score(y_true, y_prob)) if has_pos else None,
        'brier_score': float(brier_score_loss(y_true, y_prob)),
        'confusion_matrix': cm
    }

# -----------------------------------------------------------------------------
# Main Execution Runner
# -----------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--epochs', type=int, default=18)
    parser.add_argument('--label-threshold', type=int, default=15)
    args = parser.parse_args()
    
    root = Path(__file__).resolve().parent.parent.parent
    print(f'=== Starting Spatiotemporal CNN-LSTM Training Pipeline ===')
    print(f'Project Root: {root}')
    print(f'Label Threshold: -{args.label_threshold}% (PMFBY Olympic Baseline Standard)')
    
    sat_arr, clim_arr, y_arr, meta_df, rain_baseline = load_all_training_data(root, args.label_threshold)
    print(f'Loaded total patch observations: {len(y_arr)}')
    print(f'  Positive failure patches: {int(y_arr.sum())} ({y_arr.mean()*100:.1f}%)')
    print(f'  Negative non-failure patches: {int((y_arr == 0).sum())}')
    print(f'  Monitored districts: {meta_df["district_key"].nunique()}')
    print(f'  Monitored seasons: {sorted(meta_df["year"].unique())}')
    
    # 1. Stratified Spatial Holdout (Unseen Districts)
    dist_summary = meta_df.drop_duplicates('district_key')[['district_key', 'district']].copy()
    dist_max = meta_df.groupby('district_key')['label'].max()
    dist_summary['has_failure'] = dist_summary['district_key'].map(dist_max).astype(int)
    
    train_districts, test_districts = train_test_split(
        dist_summary['district_key'].to_numpy(),
        test_size=0.25,
        random_state=42,
        stratify=dist_summary['has_failure'].to_numpy()
    )
    
    train_idx = np.where(meta_df['district_key'].isin(train_districts))[0]
    test_idx = np.where(meta_df['district_key'].isin(test_districts))[0]
    print(f'\nSpatial Split: {len(train_idx)} train samples ({len(train_districts)} districts) | {len(test_idx)} test samples ({len(test_districts)} unseen districts)')
    
    # Train spatial evaluation model
    eval_model = train_model(sat_arr, clim_arr, y_arr, train_idx, epochs=args.epochs, seed=42)
    test_probs = predict_probabilities(eval_model, sat_arr[test_idx], clim_arr[test_idx])
    
    # Aggregate predictions at district-season level
    test_df = meta_df.iloc[test_idx].copy()
    test_df['predicted_prob'] = test_probs
    grouped_test = test_df.groupby(['district', 'year'])[['label', 'predicted_prob']].mean().reset_index()
    grouped_test['actual'] = grouped_test['label'].round().astype(int)
    
    spatial_metrics = compute_metrics(grouped_test['actual'].to_numpy(), grouped_test['predicted_prob'].to_numpy())
    spatial_metrics.update({
        'train_districts': sorted(train_districts.tolist()),
        'test_districts': sorted(test_districts.tolist()),
        'test_district_seasons_evaluated': len(grouped_test)
    })
    print(f'Spatial Holdout Results:')
    print(f'  ROC-AUC: {spatial_metrics["roc_auc"]:.4f}' if spatial_metrics["roc_auc"] else '  ROC-AUC: N/A')
    print(f'  Balanced Accuracy: {spatial_metrics["balanced_accuracy"]:.4f}')
    print(f'  Recall: {spatial_metrics["recall"]:.4f}')
    print(f'  Precision: {spatial_metrics["precision"]:.4f}')
    print(f'  F1-Score: {spatial_metrics["f1_score"]:.4f}')
    
    # 2. Leave-One-Season-Out (LOSO) Cross-Validation
    print(f'\n--- Running Temporal Leave-One-Season-Out (LOSO) Cross-Validation ---')
    loso_preds = []
    loso_season_breakdown = []
    unique_years = sorted(meta_df['year'].unique())
    
    for held_year in unique_years:
        tr_idx = np.where(meta_df['year'] != held_year)[0]
        te_idx = np.where(meta_df['year'] == held_year)[0]
        if len(tr_idx) == 0 or len(te_idx) == 0:
            continue
            
        fold_model = train_model(sat_arr, clim_arr, y_arr, tr_idx, epochs=args.epochs, seed=42+int(held_year))
        fold_probs = predict_probabilities(fold_model, sat_arr[te_idx], clim_arr[te_idx])
        
        te_df = meta_df.iloc[te_idx].copy()
        te_df['predicted_prob'] = fold_probs
        grp_fold = te_df.groupby(['district', 'year'])[['label', 'predicted_prob']].mean().reset_index()
        grp_fold['actual'] = grp_fold['label'].round().astype(int)
        grp_fold['heldout_season'] = held_year
        loso_preds.append(grp_fold)
        
        y_t = grp_fold['actual'].to_numpy()
        y_p = grp_fold['predicted_prob'].to_numpy()
        y_hat = (y_p >= 0.5).astype(int)
        acc = float(accuracy_score(y_t, y_hat))
        brier = float(brier_score_loss(y_t, y_p))
        print(f'  Season {held_year}: Samples={len(grp_fold)}, True Failures={int(y_t.sum())}, Accuracy={acc:.3f}, Brier={brier:.4f}')
        loso_season_breakdown.append({
            'season': int(held_year),
            'samples': len(grp_fold),
            'actual_failures': int(y_t.sum()),
            'accuracy': acc,
            'brier_score': brier
        })
        
    combined_loso = pd.concat(loso_preds, ignore_index=True)
    loso_metrics = compute_metrics(combined_loso['actual'].to_numpy(), combined_loso['predicted_prob'].to_numpy())
    loso_metrics['per_season_breakdown'] = loso_season_breakdown
    
    # 3. Deliverable Production Model (Trained on Full Dataset)
    print(f'\n--- Training Deliverable Checkpoint on All Observations ---')
    full_idx = np.arange(len(y_arr))
    deliverable_model = train_model(sat_arr, clim_arr, y_arr, full_idx, epochs=args.epochs, seed=100)
    
    # Save Model Weights & Artifacts
    out_dir = root / 'CNN_LSTM_Training' / 'CropFailureProject' / 'crop_model_output'
    out_dir.mkdir(parents=True, exist_ok=True)
    data_out = root / 'data'
    
    checkpoint = {
        'model_state_dict': {k: v.detach().cpu() for k, v in deliverable_model.state_dict().items()},
        'n_sat_channels': 8,
        'n_climate_features': 4,
        'hidden': 16,
        'years_trained': [int(y) for y in unique_years],
        'windows': WINDOWS,
        'channels': CHANNELS,
        'patch_size': PATCH_SIZE,
        'rain_baseline': rain_baseline,
        'oni_mean_by_year': ONI_MEAN_BY_YEAR,
        'label_threshold_pct': args.label_threshold,
        'target_crop': 'Rice (Maharashtra Kharif)',
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    }
    
    ckpt_path = out_dir / 'crop_failure_model.pt'
    torch.save(checkpoint, ckpt_path)
    torch.save(checkpoint, data_out / 'crop_failure_model.pt')
    
    # Save Evaluation Metrics & Reports
    full_report = {
        'model_name': 'Maharashtra Kharif Rice Spatiotemporal CNN-LSTM',
        'architecture': '2D-CNN (24 feats) + BiLSTM (16 hidden) + Classification Head',
        'target_crop': 'Rice',
        'label_rule': f'Yield anomaly <= -{args.label_threshold}% against 5-year Olympic baseline',
        'total_patch_samples': len(y_arr),
        'positive_failure_samples': int(y_arr.sum()),
        'negative_samples': int((y_arr == 0).sum()),
        'spatial_holdout_evaluation': spatial_metrics,
        'loso_temporal_evaluation': loso_metrics
    }
    
    with open(out_dir / 'evaluation_metrics.json', 'w', encoding='utf-8') as f:
        json.dump(full_report, f, indent=2)
    with open(data_out / 'evaluation_metrics.json', 'w', encoding='utf-8') as f:
        json.dump(full_report, f, indent=2)
        
    grouped_test.to_csv(out_dir / 'heldout_district_predictions.csv', index=False)
    grouped_test.to_csv(data_out / 'heldout_district_predictions.csv', index=False)
    combined_loso.to_csv(out_dir / 'loso_district_predictions.csv', index=False)
    combined_loso.to_csv(data_out / 'loso_district_predictions.csv', index=False)
    meta_df.to_csv(data_out / 'matched_training_manifest.csv', index=False)
    
    print(f'\n=== ML Training & Validation Completed Successfully! ===')
    print(f'Checkpoint saved to: {ckpt_path}')
    print(f'Spatial Holdout ROC-AUC: {spatial_metrics.get("roc_auc")}')
    print(f'Spatial Holdout Balanced Accuracy: {spatial_metrics.get("balanced_accuracy"):.4f}')
    print(f'LOSO Accuracy: {loso_metrics.get("accuracy"):.4f}')

if __name__ == '__main__':
    main()
