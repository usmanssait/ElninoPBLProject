#!/usr/bin/env python3
"""Regenerate Maharashtra Crop Failure CNN-LSTM predictions from the latest checkpoint.

Runs inference using the latest trained PyTorch checkpoint in CropFailureProject/crop_model_output,
verifies output integrity, enriches with canonical district identifiers and model provenance,
and writes the integrated artifact to ElninoPBLProject-main/data/crop_failure_predictions.csv.
"""

from __future__ import annotations
import os, sys, subprocess
from pathlib import Path
import pandas as pd

def main():
    script_dir = Path(__file__).resolve().parent
    dashboard_root = script_dir.parent
    candidate_dirs = [
        dashboard_root / "CNN_LSTM_Training" / "CropFailureProject",
        dashboard_root.parent / "CNN_LSTM_Training" / "CropFailureProject",
        dashboard_root / "CropFailureProject",
        dashboard_root.parent / "CropFailureProject",
        dashboard_root.parent.parent / "CropFailureProject",
        dashboard_root.parent.parent.parent / "CropFailureProject",
    ]
    crop_proj = None
    for p in candidate_dirs:
        if p.exists() and (p / "predict_crop_failure.py").exists():
            crop_proj = p
            break
    if not crop_proj:
        raise FileNotFoundError(f"CropFailureProject not found in candidates: {candidate_dirs}")

    predict_script = crop_proj / "predict_crop_failure.py"
    latest_model = crop_proj / "crop_model_output" / "crop_failure_model.pt"
    if not latest_model.exists() and (crop_proj / "crop_failure_model.pt").exists():
        latest_model = crop_proj / "crop_failure_model.pt"

    if not latest_model.exists():
        raise FileNotFoundError(f"Latest model checkpoint not found at {latest_model}")
    if not predict_script.exists():
        raise FileNotFoundError(f"Inference script not found at {predict_script}")

    print(f"=== Maharashtra Crop Failure CNN-LSTM Prediction Pipeline ===")
    print(f"Inference script: {predict_script}")
    print(f"Model checkpoint: {latest_model}")

    output_csv = dashboard_root / "data" / "crop_failure_predictions.csv"
    raw_tmp_csv = crop_proj / "crop_failure_predictions.csv"

    cmd = [
        sys.executable,
        str(predict_script),
        "--data-dir", str(crop_proj),
        "--model", str(latest_model),
        "--years", "2019,2020,2021,2022",
        "--output", str(raw_tmp_csv)
    ]

    print(f"Running inference: {' '.join(cmd)}")
    res = subprocess.run(cmd, check=True)

    df = pd.read_csv(raw_tmp_csv)
    print(f"Read {len(df)} raw predictions across {df['district'].nunique()} districts and years {sorted(df['satellite_year'].unique())}")

    # Canonical mapping dictionary matching canonicalDistricts.ts
    name_to_id = {
        'ahilyanagar': 'ahilyanagar',
        'beed': 'beed',
        'bhandara': 'bhandara',
        'chandrapur': 'chandrapur',
        'chhatrapati sambhajinagar': 'chhatrapati_sambhajinagar',
        'dhule': 'dhule',
        'gadchiroli': 'gadchiroli',
        'gondia': 'gondia',
        'nagpur': 'nagpur',
        'nanded': 'nanded',
        'nandurbar': 'nandurbar',
        'nashik': 'nashik',
        'palghar': 'palghar',
        'pune': 'pune',
        'raigad': 'raigad',
        'ratnagiri': 'ratnagiri',
        'sangli': 'sangli',
        'satara': 'satara',
        'solapur': 'solapur',
        'thane': 'thane'
    }

    df['district_id'] = df['district'].str.strip().str.lower().map(name_to_id)
    df['model_checkpoint'] = 'crop_model_output/crop_failure_model.pt'
    df['model_architecture'] = 'CropFailureCNNLSTM_11081params'
    df['model_provenance'] = 'Trained on 2019-2022 S2+IMD+DES, 322 patch-rows, pos_weight=6.5'

    # Validation checks
    assert not df['mean_crop_failure_risk_score'].isna().any(), "Error: NaN risk scores detected!"
    assert (df['mean_crop_failure_risk_score'] >= 0.0).all() and (df['mean_crop_failure_risk_score'] <= 1.0).all(), "Scores out of [0, 1]!"
    assert not df['district_id'].isna().any(), f"Error: Unmapped districts in {df[df['district_id'].isna()]['district'].tolist()}"

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_csv, index=False)
    print(f"Successfully generated and validated {len(df)} predictions.")
    print(f"Saved integration artifact to: {output_csv}")

if __name__ == '__main__':
    main()
