#!/usr/bin/env python3
"""Train a compact CNN-LSTM crop-failure prototype from Sentinel-2 GeoJSON patches.

Expected files in --data-dir:
  MH_Rice_S2_Patches_2019.geojson
  MH_Rice_S2_Patches_2020.geojson
  MH_Rice_S2_Patches_2021.geojson
  MH_Rice_S2_Patches_2022.geojson
  des_rice_maharashtra_kharif_final*.csv
  imd_district_kharif_rainfall_2015_2022*.csv

The supplied DES target `crop_failure_initial` is used as-is. Satellite rows inherit
that district-season label. Therefore multiple sampling locations within a district
share a label; the evaluation split is grouped by district to reduce leakage.
"""
from __future__ import annotations
import argparse, json, re, sys, time, random
from pathlib import Path
from collections import Counter, defaultdict
import numpy as np
import pandas as pd
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.model_selection import train_test_split
from sklearn.metrics import (accuracy_score, balanced_accuracy_score, precision_score,
                             recall_score, f1_score, roc_auc_score, average_precision_score,
                             confusion_matrix)

YEARS = [2019, 2020, 2021, 2022]
WINDOWS = ['t01', 't02', 't03', 't04', 't05', 't06']
CHANNELS = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI', 'NDWI']
PATCH_SIZE = 32
FILL_VALUE = -9999.0
# Values copied from the project's oniElNinoData.ts seasonal early-warning series.
# These are continuous anomaly features; all selected years have summer mean < +0.5 C.
ONI_MEAN_BY_YEAR = {2019: 0.30, 2020: -0.40, 2021: -0.43, 2022: -0.97}


def seed_everything(seed=42):
    random.seed(seed); np.random.seed(seed); torch.manual_seed(seed)
    torch.set_num_threads(max(1, min(4, torch.get_num_threads())))


def clean_name(value):
    return re.sub(r'\s+', ' ', str(value).strip()).casefold()


def year_start(value):
    match = re.search(r'(?:19|20)\d{2}', str(value))
    return int(match.group(0)) if match else None


def find_csv(data_dir: Path, explicit: str | None, patterns: list[str], label: str) -> Path:
    if explicit:
        p = Path(explicit)
        if not p.is_absolute(): p = data_dir / p
        if not p.exists(): raise FileNotFoundError(f'{label} CSV not found: {p}')
        return p
    matches=[]
    for pat in patterns: matches.extend(data_dir.glob(pat))
    if not matches:
        for fallback_dir in [data_dir.parent.parent / 'data', data_dir.parent / 'data']:
            if fallback_dir.exists():
                for pat in patterns: matches.extend(fallback_dir.glob(pat))
            if matches:
                break
    # Unique and deterministic; ignore similarly named backups where the plain file is present.
    matches=sorted(set(matches), key=lambda p: (('(1)' in p.name), len(p.name), p.name))
    if not matches: raise FileNotFoundError(f'Could not find {label} CSV in {data_dir}; patterns={patterns}')
    return matches[0]


def load_lookup_tables(data_dir: Path, des_file: str | None = None, imd_file: str | None = None):
    des_path = find_csv(data_dir, des_file,
                        ['des_rice_maharashtra_kharif_final*.csv', '*des*rice*.csv'], 'DES')
    imd_path = find_csv(data_dir, imd_file,
                        ['imd_district_kharif_rainfall_2015_2022*.csv', '*imd*rainfall*.csv'], 'IMD')
    des = pd.read_csv(des_path)
    required_des = {'district', 'year', 'crop_failure_initial'}
    if not required_des.issubset(des.columns):
        raise ValueError(f'DES file needs columns {sorted(required_des)}; found {list(des.columns)}')
    des['district_key'] = des['district'].map(clean_name)
    des['year_start'] = des['year'].map(year_start)
    des['crop_failure_initial'] = pd.to_numeric(des['crop_failure_initial'], errors='coerce')
    des = des.dropna(subset=['district_key', 'year_start', 'crop_failure_initial'])
    des['year_start'] = des['year_start'].astype(int)
    des['crop_failure_initial'] = des['crop_failure_initial'].astype(int)
    # Keep first unique row; dataset should have one rice/Kharif label per district/season.
    des = des.drop_duplicates(['district_key', 'year_start'], keep='first')
    labels = {(r.district_key, int(r.year_start)): int(r.crop_failure_initial)
              for r in des.itertuples(index=False)}

    imd = pd.read_csv(imd_path)
    required_imd = {'district', 'year', 'kharif_rainfall_mm'}
    if not required_imd.issubset(imd.columns):
        raise ValueError(f'IMD file needs columns {sorted(required_imd)}; found {list(imd.columns)}')
    imd['district_key'] = imd['district'].map(clean_name)
    imd['year_start'] = imd['year'].map(year_start)
    imd['kharif_rainfall_mm'] = pd.to_numeric(imd['kharif_rainfall_mm'], errors='coerce')
    imd = imd.dropna(subset=['district_key', 'year_start', 'kharif_rainfall_mm'])
    imd['year_start'] = imd['year_start'].astype(int)
    imd = imd.drop_duplicates(['district_key', 'year_start'], keep='first')
    rainfall = {(r.district_key, int(r.year_start)): float(r.kharif_rainfall_mm)
                for r in imd.itertuples(index=False)}
    # Use each district's average across the available IMD period as a simple baseline.
    rain_baseline = imd.groupby('district_key')['kharif_rainfall_mm'].mean().to_dict()
    return labels, rainfall, rain_baseline, des_path, imd_path


def load_satellite_rows(data_dir: Path, labels, rainfall, rain_baseline, years=YEARS):
    sat_rows=[]; climate_rows=[]; coverage_rows=[]; records=[]; missing_label=[]; shape_errors=[]
    for year in years:
        path = data_dir / f'MH_Rice_S2_Patches_{year}.geojson'
        if not path.exists():
            raise FileNotFoundError(f'Missing satellite file: {path}')
        print(f'Reading {path.name} ({path.stat().st_size/1024/1024:.1f} MB)...', flush=True)
        with path.open('r', encoding='utf-8') as f:
            geo = json.load(f)
        feats = geo.get('features', [])
        print(f'  GeoJSON features: {len(feats)}', flush=True)
        for feature in feats:
            props = feature.get('properties') or {}
            district = str(props.get('district', '')).strip()
            district_key = clean_name(district)
            loc_id = str(props.get('location_id', feature.get('id', 'unknown')))
            yr = int(props.get('satellite_year', year))
            label_key = (district_key, yr)
            if label_key not in labels:
                missing_label.append((loc_id, district, yr))
                continue
            imd_key = (district_key, yr)
            if imd_key not in rainfall:
                continue
            if yr not in ONI_MEAN_BY_YEAR:
                continue

            # [time, channel, row, col]. The GeoJSON has empty geometries; pixels and
            # district/location properties are sufficient for the model.
            patch = np.full((6, 8, PATCH_SIZE, PATCH_SIZE), np.nan, dtype=np.float32)
            cov = np.zeros(6, dtype=np.float32)
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
                        shape_errors.append((path.name, loc_id, key, tuple(arr.shape)))
                        valid_arrays = False
                        continue
                    arr = arr.copy()
                    arr[(~np.isfinite(arr)) | (arr <= -9998.0)] = np.nan
                    # Spectral reflectance / indices should not have extreme values.
                    arr[np.abs(arr) > 3.0] = np.nan
                    patch[ti, ci] = arr
                b2 = patch[ti, 0]
                cov[ti] = float(np.isfinite(b2).mean())
            if not valid_arrays:
                continue
            if float(cov.sum()) <= 0:
                # Keep fully clouded patches only if a different timestep is valid; this
                # condition means no B2 data exists anywhere in the sample.
                continue

            rain = float(rainfall[imd_key])
            baseline = float(rain_baseline.get(district_key, np.nan))
            rain_departure = ((rain - baseline) / baseline * 100.0) if np.isfinite(baseline) and baseline > 0 else 0.0
            oni = float(ONI_MEAN_BY_YEAR[yr])
            climate3 = np.array([rain, rain_departure, oni], dtype=np.float32)
            sat_rows.append(patch)
            climate_rows.append(climate3)
            coverage_rows.append(cov)
            records.append({
                'location_id': loc_id, 'district': district, 'district_key': district_key,
                'satellite_year': yr, 'crop_year': f'{yr}-{yr+1}',
                'crop_failure_initial': int(labels[label_key]),
                'kharif_rainfall_mm': rain, 'rainfall_departure_pct_vs_district_mean': rain_departure,
                'oni_mean_jun_aug': oni, 'valid_pixel_fraction_mean': float(cov.mean()),
                'valid_pixel_fraction_t01': float(cov[0]), 'valid_pixel_fraction_t02': float(cov[1]),
                'valid_pixel_fraction_t03': float(cov[2]), 'valid_pixel_fraction_t04': float(cov[3]),
                'valid_pixel_fraction_t05': float(cov[4]), 'valid_pixel_fraction_t06': float(cov[5]),
            })
        del geo
    if shape_errors:
        print(f'WARNING: {len(shape_errors)} arrays had unexpected dimensions; first: {shape_errors[0]}', flush=True)
    print(f'Rows with matching DES + IMD labels: {len(records)}', flush=True)
    if missing_label:
        print(f'Rows skipped because DES district-season label was unavailable: {len(missing_label)}', flush=True)
    if not records:
        raise RuntimeError('No training examples matched between satellite patches, DES, and IMD.')
    Xsat = np.stack(sat_rows).astype(np.float32)
    C3 = np.stack(climate_rows).astype(np.float32)
    coverage = np.stack(coverage_rows).astype(np.float32)
    y = np.array([r['crop_failure_initial'] for r in records], dtype=np.float32)
    return Xsat, C3, coverage, y, pd.DataFrame(records)


class CropFailureCNNLSTM(nn.Module):
    def __init__(self, n_sat_channels=8, n_climate_features=4, hidden=16):
        super().__init__()
        self.cnn = nn.Sequential(
            nn.Conv2d(n_sat_channels, 16, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(16, 24, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
        )
        self.lstm = nn.LSTM(input_size=24+n_climate_features, hidden_size=hidden,
                            num_layers=1, batch_first=True, bidirectional=True)
        self.head = nn.Sequential(
            nn.Linear(hidden*2, 16), nn.ReLU(inplace=True), nn.Dropout(0.20), nn.Linear(16, 1)
        )

    def forward(self, satellite, climate):
        # satellite [batch,time,channels,height,width], climate [batch,time,features]
        b, t, c, h, w = satellite.shape
        features = self.cnn(satellite.reshape(b*t, c, h, w)).reshape(b, t, -1)
        seq = torch.cat([features, climate], dim=-1)
        out, _ = self.lstm(seq)
        return self.head(out[:, -1, :]).squeeze(-1)


def fit_normalizers(sat, climate3, coverage, indices):
    # Sat shape [N,T,C,H,W]; ignore missing pixels (NaN) when estimating scaler.
    s_mean=[]; s_std=[]
    tr = sat[indices]
    for c in range(tr.shape[2]):
        values = tr[:, :, c]
        finite = np.isfinite(values)
        vals = values[finite]
        mean = float(vals.mean()) if vals.size else 0.0
        std = float(vals.std()) if vals.size else 1.0
        if not np.isfinite(std) or std < 1e-5: std = 1.0
        s_mean.append(mean); s_std.append(std)
    climate3_seq = np.repeat(climate3[:, None, :], coverage.shape[1], axis=1)
    climate_raw = np.concatenate([climate3_seq, coverage[:, :, None]], axis=2)
    c_train = climate_raw[indices]
    c_mean = np.nanmean(c_train, axis=(0, 1))
    c_std = np.nanstd(c_train, axis=(0, 1))
    c_std[~np.isfinite(c_std) | (c_std < 1e-5)] = 1.0
    c_mean[~np.isfinite(c_mean)] = 0.0
    return np.array(s_mean, np.float32), np.array(s_std, np.float32), c_mean.astype(np.float32), c_std.astype(np.float32)


def transform_inputs(sat, climate3, coverage, scaler):
    sm, ss, cm, cs = scaler
    out = np.zeros(sat.shape, dtype=np.float32)
    for c in range(sat.shape[2]):
        values = sat[:, :, c]
        valid = np.isfinite(values)
        norm = (values - sm[c]) / ss[c]
        norm = np.clip(norm, -5.0, 5.0)
        out[:, :, c] = np.where(valid, norm, 0.0)
    climate3_seq = np.repeat(climate3[:, None, :], coverage.shape[1], axis=1)
    climate = np.concatenate([climate3_seq, coverage[:, :, None]], axis=2)
    climate = (climate - cm[None, None, :]) / cs[None, None, :]
    climate = np.clip(climate, -5.0, 5.0).astype(np.float32)
    return out, climate


def per_group_weights(records: pd.DataFrame, indices: np.ndarray):
    train = records.iloc[indices]
    counts = train.groupby(['district_key', 'satellite_year']).size().to_dict()
    w = np.array([1.0 / counts[(records.iloc[i].district_key, int(records.iloc[i].satellite_year))]
                  for i in indices], dtype=np.float32)
    # Compute pos_weight from the number of unique district-season labels, not patch count.
    groups = train.drop_duplicates(['district_key', 'satellite_year'])
    pos = int((groups['crop_failure_initial'] == 1).sum())
    neg = int((groups['crop_failure_initial'] == 0).sum())
    pos_weight = float(np.clip(neg / max(pos, 1), 1.0, 10.0))
    return w, pos_weight, pos, neg


def train_model(Xsat, Xclimate, y, records, train_idx, epochs=40, seed=42, verbose=False):
    seed_everything(seed)
    model = CropFailureCNNLSTM()
    optimizer = torch.optim.AdamW(model.parameters(), lr=8e-4, weight_decay=3e-3)
    w_np, pos_weight, npos, nneg = per_group_weights(records, train_idx)
    pos_weight_t = torch.tensor(pos_weight, dtype=torch.float32)
    ds = TensorDataset(torch.from_numpy(Xsat[train_idx]), torch.from_numpy(Xclimate[train_idx]),
                       torch.from_numpy(y[train_idx]), torch.from_numpy(w_np))
    generator = torch.Generator().manual_seed(seed)
    loader = DataLoader(ds, batch_size=32, shuffle=True, generator=generator)
    model.train()
    history=[]
    for epoch in range(1, epochs+1):
        losses=[]
        for xs, xc, yy, ww in loader:
            optimizer.zero_grad(set_to_none=True)
            logits = model(xs, xc)
            per_loss = nn.functional.binary_cross_entropy_with_logits(
                logits, yy, pos_weight=pos_weight_t, reduction='none')
            loss = (per_loss * ww).sum() / ww.sum().clamp_min(1e-6)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 2.0)
            optimizer.step()
            losses.append(float(loss.detach()))
        history.append(float(np.mean(losses)))
        if verbose and (epoch == 1 or epoch % 10 == 0 or epoch == epochs):
            print(f'  epoch {epoch:03d}/{epochs}: weighted_loss={history[-1]:.4f}', flush=True)
    return model, history, {'pos_weight': pos_weight, 'positive_district_seasons_train': npos,
                            'negative_district_seasons_train': nneg}


def predict_probabilities(model, xs, xc, batch_size=16):
    model.eval(); pred=[]
    with torch.no_grad():
        for i in range(0, len(xs), batch_size):
            logits = model(torch.from_numpy(xs[i:i+batch_size]), torch.from_numpy(xc[i:i+batch_size]))
            pred.extend(torch.sigmoid(logits).cpu().numpy().tolist())
    return np.array(pred, dtype=np.float32)


def aggregate_group_predictions(records: pd.DataFrame, y: np.ndarray, prob: np.ndarray, indices: np.ndarray):
    df = records.iloc[indices][['district', 'district_key', 'satellite_year', 'crop_year', 'crop_failure_initial']].copy()
    df['probability'] = prob
    g = df.groupby(['district_key', 'satellite_year'], as_index=False).agg(
        district=('district','first'), crop_year=('crop_year','first'),
        actual=('crop_failure_initial','first'), probability=('probability','mean'), patches=('probability','size'))
    return g


def metrics_from_group_predictions(group_df: pd.DataFrame):
    yt = group_df['actual'].astype(int).to_numpy()
    yp = group_df['probability'].to_numpy()
    yhat = (yp >= 0.5).astype(int)
    out = {
        'district_seasons_evaluated': int(len(group_df)),
        'positive_district_seasons': int(yt.sum()),
        'negative_district_seasons': int((yt == 0).sum()),
        'accuracy_threshold_0_5': float(accuracy_score(yt, yhat)),
        'balanced_accuracy_threshold_0_5': float(balanced_accuracy_score(yt, yhat)),
        'precision_threshold_0_5': float(precision_score(yt, yhat, zero_division=0)),
        'recall_threshold_0_5': float(recall_score(yt, yhat, zero_division=0)),
        'f1_threshold_0_5': float(f1_score(yt, yhat, zero_division=0)),
        'confusion_matrix_labels_0_1': confusion_matrix(yt, yhat, labels=[0,1]).tolist(),
        'roc_auc': float(roc_auc_score(yt, yp)) if len(np.unique(yt)) == 2 else None,
        'average_precision': float(average_precision_score(yt, yp)) if int(yt.sum()) > 0 else None,
        'baseline_majority_accuracy': float(max(np.mean(yt==0), np.mean(yt==1))) if len(yt) else None,
        'note': 'Exploratory district-grouped holdout; small data and district-level labels repeated across sampled patches.'
    }
    return out


def main():
    script_dir = Path(__file__).resolve().parent
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--data-dir', default=str(script_dir), help='Directory containing the four GeoJSON files and DES/IMD CSVs.')
    ap.add_argument('--des-file', default=None, help='Optional DES CSV filename/path.')
    ap.add_argument('--imd-file', default=None, help='Optional IMD CSV filename/path.')
    ap.add_argument('--output-dir', default='crop_model_output', help='Folder for model and reports.')
    ap.add_argument('--epochs', type=int, default=16, help='Training epochs per fit (default: 16).')
    args = ap.parse_args()
    start=time.time(); seed_everything(42)
    data_dir=Path(args.data_dir).resolve()
    outdir=Path(args.output_dir)
    if not outdir.is_absolute():
        outdir = data_dir / outdir
    outdir.mkdir(parents=True, exist_ok=True)
    labels, rainfall, rain_baseline, des_path, imd_path = load_lookup_tables(data_dir, args.des_file, args.imd_file)
    print(f'DES: {des_path.name}; IMD: {imd_path.name}', flush=True)
    Xraw, C3, coverage, y, records = load_satellite_rows(data_dir, labels, rainfall, rain_baseline)
    print(f'Usable patch-year samples: {len(y)}; positive patches: {int(y.sum())}; negative patches: {int((y==0).sum())}', flush=True)
    grp = records.drop_duplicates(['district_key'])[['district_key','district']].copy()
    ever_pos = records.groupby('district_key')['crop_failure_initial'].max()
    grp['ever_positive'] = grp['district_key'].map(ever_pos).astype(int)
    train_districts, test_districts = train_test_split(
        grp['district_key'].to_numpy(), test_size=0.25, random_state=42,
        stratify=grp['ever_positive'].to_numpy())
    train_idx=np.where(records['district_key'].isin(train_districts).to_numpy())[0]
    test_idx=np.where(records['district_key'].isin(test_districts).to_numpy())[0]
    scaler=fit_normalizers(Xraw, C3, coverage, train_idx)
    Xnorm, Cnorm = transform_inputs(Xraw, C3, coverage, scaler)
    print(f'District-grouped split: train {len(train_idx)} patch rows / {len(train_districts)} districts; '
          f'test {len(test_idx)} rows / {len(test_districts)} unseen districts.', flush=True)

    # Evaluation fit: completely held-out districts do not contribute labels or model weights.
    eval_model, eval_history, eval_weight_info = train_model(
        Xnorm, Cnorm, y, records, train_idx, epochs=args.epochs, seed=42, verbose=True)
    test_probs = predict_probabilities(eval_model, Xnorm[test_idx], Cnorm[test_idx])
    test_groups = aggregate_group_predictions(records, y, test_probs, test_idx)
    metrics = metrics_from_group_predictions(test_groups)
    metrics.update({
        'train_patch_rows': int(len(train_idx)), 'test_patch_rows': int(len(test_idx)),
        'train_districts': sorted(map(str, train_districts)),
        'test_districts': sorted(map(str, test_districts)),
        'train_weighting': eval_weight_info,
    })
    test_groups.to_csv(outdir / 'heldout_district_predictions.csv', index=False)
    (outdir / 'evaluation_metrics.json').write_text(json.dumps(metrics, indent=2), encoding='utf-8')

    # Train the deliverable model on all joined rows. Save scalers inside checkpoint.
    final_scaler=fit_normalizers(Xraw, C3, coverage, np.arange(len(y)))
    Xfull, Cfull=transform_inputs(Xraw, C3, coverage, final_scaler)
    final_model, final_history, final_weight_info = train_model(
        Xfull, Cfull, y, records, np.arange(len(y)), epochs=args.epochs, seed=43, verbose=True)
    checkpoint={
        'model_state_dict': {k:v.detach().cpu() for k,v in final_model.state_dict().items()},
        'sat_mean': final_scaler[0].tolist(), 'sat_std': final_scaler[1].tolist(),
        'climate_mean': final_scaler[2].tolist(), 'climate_std': final_scaler[3].tolist(),
        'years_trained': YEARS, 'windows': WINDOWS, 'channels': CHANNELS,
        'patch_size': PATCH_SIZE, 'output_crs': 'EPSG:32643',
        'model_config': {'n_sat_channels':8, 'n_climate_features':4, 'hidden':16},
        'climate_features': ['kharif_rainfall_mm', 'rainfall_departure_pct_vs_2015_2022_district_mean',
                             'oni_mean_jun_aug_project_series', 'valid_pixel_fraction'],
        'target': 'crop_failure_initial',
        'training_note': 'Prototype trained on 2019-2022. Label is district-season level and repeated across locations.',
        'oni_mean_by_year': ONI_MEAN_BY_YEAR,
        'rain_baseline_by_district': {str(k): float(v) for k, v in rain_baseline.items()},
    }
    torch.save(checkpoint, outdir / 'crop_failure_model.pt')

    # Scores on the training data are saved only as a demonstration, not performance evaluation.
    all_prob=predict_probabilities(final_model, Xfull, Cfull)
    all_groups=aggregate_group_predictions(records, y, all_prob, np.arange(len(y)))
    all_groups.rename(columns={'probability':'in_sample_probability','actual':'known_label'}).to_csv(
        outdir / 'in_sample_demo_predictions.csv', index=False)
    records.to_csv(outdir / 'matched_training_manifest.csv', index=False)

    report={
        'status':'trained', 'model_file':'crop_failure_model.pt', 'years':YEARS,
        'des_source':str(des_path), 'imd_source':str(imd_path),
        'patch_year_rows':int(len(y)), 'district_count':int(records['district_key'].nunique()),
        'district_season_count':int(records.drop_duplicates(['district_key','satellite_year']).shape[0]),
        'label_counts_patch_rows':{'crop_failure':int(y.sum()), 'no_crop_failure':int((y==0).sum())},
        'label_counts_unique_district_seasons':{
            'crop_failure':int(records.drop_duplicates(['district_key','satellite_year'])['crop_failure_initial'].sum()),
            'no_crop_failure':int((records.drop_duplicates(['district_key','satellite_year'])['crop_failure_initial']==0).sum())},
        'valid_pixel_fraction_mean_by_window':{WINDOWS[i]:float(coverage[:,i].mean()) for i in range(6)},
        'oni_mean_by_year':ONI_MEAN_BY_YEAR,
        'any_selected_year_with_jun_aug_mean_oni_ge_0_5':bool(any(v>=0.5 for v in ONI_MEAN_BY_YEAR.values())),
        'evaluation':metrics, 'final_training_weighting':final_weight_info,
        'final_training_loss_first_last':[final_history[0], final_history[-1]],
        'warning':'This is a working prototype, not validated El Niño-specific forecasting: the selected 2019-2022 June-August mean ONI values are all below +0.5 C, and there are few independent district-season labels. Holdout metrics are district-grouped and should be interpreted cautiously.',
        'elapsed_seconds':round(time.time()-start,1),
    }
    (outdir/'training_report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    # Human-readable model card.
    with (outdir/'README_MODEL.txt').open('w', encoding='utf-8') as f:
        f.write('MAHARASHTRA RICE CROP-FAILURE CNN-LSTM PROTOTYPE\n')
        f.write('=================================================\n\n')
        f.write('Files:\n- crop_failure_model.pt: trained PyTorch checkpoint + normalization parameters\n')
        f.write('- evaluation_metrics.json: grouped-by-district holdout metrics\n')
        f.write('- heldout_district_predictions.csv: test results for unseen districts\n')
        f.write('- matched_training_manifest.csv: joined sample/label/climate metadata\n')
        f.write('- in_sample_demo_predictions.csv: training-set scores for app wiring only (NOT validation)\n\n')
        f.write('Target: DES crop_failure_initial, used as provided. Satellite patches inherit the label for their district-season.\n')
        f.write('Inputs: 6 x 8 satellite arrays, district-season IMD rainfall, district-relative rainfall departure, ONI anomaly, and pixel coverage.\n')
        f.write('Missing satellite pixels marked -9999 are ignored when estimating channel statistics and imputed to standardized zero.\n\n')
        f.write('Important limitation: this dataset does not contain a June-August mean ONI >= +0.5 C for 2019-2022.\n')
        f.write('The file is a working prototype and cannot establish performance specifically during true El Niño conditions.\n')
        f.write('Small district-season sample count and repeated district labels also limit generalization.\n')
    print('\n=== TRAINING COMPLETE ===', flush=True)
    print(f'Model: {outdir / "crop_failure_model.pt"}', flush=True)
    print(f'Report: {outdir / "training_report.json"}', flush=True)
    print('Holdout metrics:', json.dumps(metrics, indent=2), flush=True)
    print(f'Elapsed: {time.time()-start:.1f}s', flush=True)

if __name__ == '__main__':
    main()
