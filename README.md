# Spatiotemporal CNN-LSTM Crop Failure Prediction — Maharashtra Kharif Rice

An offline, standalone React/Vite research and decision-support platform for Maharashtra Kharif rice crop failure prediction during El Niño events.

The application integrates empirical Directorate of Economics and Statistics (DES) agricultural statistics, India Meteorological Department (IMD) 0.25° gridded daily rainfall NetCDF data, NOAA CPC Oceanic Niño Index (ONI) records, and deep learning spatiotemporal CNN-LSTM model definitions across 36 Maharashtra districts.

---

## Quickstart

Setup is completely standalone. **No API key is required**, and there are no external AI or cloud dependencies.

```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev
```

Open your browser to:
```
http://localhost:3000
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

- **No Gemini or External AI API dependencies**: Runs 100% locally with offline JavaScript/TypeScript and Web Standards.
- **No Mock or Fabricated External Data**: Uses verified historical DES rice data (2015–2022), IMD rainfall series (2015–2022), and NOAA CPC ONI records.
- **Model Checkpoints**: PyTorch neural network specifications and dataset pipelines are ready for training via `python train.py`. Exported checkpoints can be attached directly in the simulator.
