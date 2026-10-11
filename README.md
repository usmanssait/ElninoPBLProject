# Spatiotemporal CNN-LSTM Crop Failure Prediction — Maharashtra Kharif Rice

## Project Workspace Structure

The project has been reorganized into modular workspaces:

```
ElninoPBLProject-main/
├── CNN_LSTM_Training/
│   ├── CropFailureProject/                 # Model training & inference workspace
│   │   ├── crop_failure_model.pt           # Trained PyTorch checkpoint
│   │   ├── crop_model_output/              # Output bundle & evaluation reports
│   │   ├── MH_Rice_S2_Patches_*.geojson   # Sentinel-2 multi-spectral patches (2019-2022)
│   │   ├── des_rice_maharashtra_*.csv      # DES Kharif rice ground truth
│   │   ├── imd_district_kharif_*.csv       # IMD district rainfall
│   │   ├── predict_crop_failure.py         # PyTorch inference engine
│   │   ├── train_crop_failure_model.py     # Compact CNN-LSTM training pipeline
│   │   └── requirements.txt                # Python dependencies
│   └── SatteliteImagery/                   # Satellite imagery & sampling workspace
│       ├── classified-10m-India-2020-*.tif # Rice classification raster mask (local)
│       ├── Maharashtra.Districts.geojson   # District boundary GeoJSON
│       ├── make_rice_sampling_locations.py # Variable-allocation sampling generator
│       └── scripts/                        # GEE export & validation scripts
├── data/                                   # Dashboard data & integrated prediction artifacts
│   ├── crop_failure_predictions.csv        # Integrated predictions for UI
│   ├── des_rice_maharashtra_kharif_final.csv
│   ├── imd_district_kharif_rainfall_2015_2022.csv
│   ├── evaluation_metrics.json
│   └── training_report.json
├── scripts/
│   ├── generate_predictions.py             # Bridge script to run model & refresh dashboard CSV
│   └── prepare_sentinel2_dataset.py        # Local validation for GEE patch exports
├── src/                                    # React + TypeScript dashboard application
├── public/                                 # Static assets & PWA manifest
├── package.json                            # Dashboard dependencies & scripts
└── tsconfig.json                           # TypeScript configuration
```

---

## Windows PowerShell Quickstart

### 1. Dashboard Web Application

From the project root (`ElninoPBLProject-main`):

```powershell
# Install Node dependencies
npm install

# Start local development server (port 3000)
npm run dev

# Typecheck and production build
npm run lint
npm run build
```

Open your browser to: `http://localhost:3000`

---

### 2. Regenerate Predictions for Dashboard

To run inference using the trained PyTorch checkpoint and refresh `data/crop_failure_predictions.csv`:

```powershell
# From project root:
py scripts\generate_predictions.py
```

This automatically locates `CNN_LSTM_Training\CropFailureProject`, executes `predict_crop_failure.py`, maps district identifiers to canonical dashboard keys, validates risk scores, and writes the updated CSV to `data/crop_failure_predictions.csv`.

---

### 3. Model Training & Standalone Inference

From `CNN_LSTM_Training\CropFailureProject`:

```powershell
cd CNN_LSTM_Training\CropFailureProject

# Install Python requirements
py -m pip install -r requirements.txt

# Run inference across all supported satellite seasons (2019-2022)
py predict_crop_failure.py --years 2019,2020,2021,2022

# Run single season inference (e.g. 2022)
py predict_crop_failure.py --years 2022

# Retrain model (optional; preserves current checkpoint in crop_model_output)
py train_crop_failure_model.py --epochs 16
```

---

### 4. Satellite Sampling Plan Generator

From `CNN_LSTM_Training\SatteliteImagery`:

```powershell
cd CNN_LSTM_Training\SatteliteImagery

# Install geospatial dependencies (if running raster extraction)
py -m pip install -r requirements.txt

# Generate variable-allocation rice sampling locations
py make_rice_sampling_locations.py
```

---

## Application Structure & Views

1. **1–4. Baseline Audit (`/audit`)**:
   - Zero-leakage ground-truth baseline engine comparing prior 5-year rolling vs. prior expanding historical yields.
   - Evaluates sample size sufficiency (72 strict vs. 120 expanding observations).
2. **Geospatial Districts & Events Map (`/map`)**:
   - Vector choropleth map of all 36 Maharashtra districts using the `#232A20` dashboard theme.
   - Live toggling between **Crop Failure Events Map** (`create_event_map`), **IMD Rainfall Map** (`create_rainfall_map`), and **DES Rice Yield Map** (`create_yield_map`).
   - Tri-modal comparative view inspecting Rainfall, Yield, and Events side-by-side for any Kharif season (2015–2022).
3. **Spatiotemporal Data (`/data`)**:
   - Data integrity ledger and ESA WorldCover Class 40 cropland purity specifications.
   - 8-spectral channel tensor layout ($[B, 6, 8, 32, 32]$) and NOAA ONI Pacific SST anomalies.
4. **CNN-LSTM Architecture (`/model`)**:
   - Network diagram fusing `TimeDistributed(Conv2D)` spatial feature extraction with a 2-layer `BiLSTM` temporal core.
5. **Early Warning Simulator (`/simulator`)**:
   - Mid-season (August 31) parameter evaluation workbench for crop harvest failure risk with model checkpoint attachment interface.
6. **User Scripts (Python) (`/scripts`)**:
   - Inspection and export of Python preprocessing (`process_all_rainfall.py`), mapping (`visualize_results.py`), and Streamlit console (`app.py`).
7. **PyTorch Pipeline (`/code`)**:
   - Complete, executable PyTorch scripts: `model.py`, `dataset.py`, `train.py`, and `audit_baseline.py`.

---

## Offline & Standalone Guarantee

- **No External AI API dependencies**: Runs 100% locally with offline JavaScript/TypeScript and Web Standards.
- **No Fabricated External Data**: Uses verified historical DES rice data (2015–2022), IMD rainfall series (2015–2022), and NOAA CPC ONI records.
- **Model Checkpoints**: Compact CNN-LSTM weights saved as `crop_failure_model.pt` (11,081 trainable parameters), evaluated on 322 patch-year records.

