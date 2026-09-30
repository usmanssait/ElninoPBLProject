# Project Ingestion & Extension Plan: Lightweight Zip & Spatiotemporal Pipeline

A structured plan to unpack and audit your uploaded lightweight project zip, verify exact schemas against our Steps 1–4 baseline engine, absorb visual and theming cues from your existing Streamlit project, and proceed through Steps 5–10 of the Spatiotemporal CNN-LSTM framework.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following parameters govern the ingestion of your project zip:

- **Upload Format**: Lightweight ZIP file containing scripts (`Python/`), processed rainfall (`Output/imd_district_kharif_rainfall_2015_2022.csv`), DES rice statistics (`InputData/...`), `Maharashtra.Districts.geojson`, and theming assets (`ImageElements/`). Raw NetCDF files (`RF25_*.nc`) are excluded to keep the upload instantaneous.
- **DES Historical Scope Confirmed**: Years cover 2015–2016 through 2022–2023 (8 crop years, ending in 2022/23 with no standalone 2023 data). This confirms our audit findings: **72 strict 5-year prior rolling baseline samples (2020–2022)** or **120 expanding prior baseline samples (2018–2022)**.
- **Frontend Integration Strategy**: Do not transfer over or overwrite with the raw Streamlit code; rather, extract visual, styling, and color palette cues from your theme assets (`AdobeColor-My Color Theme.jpeg`, `ImageElements/`) to elevate the web platform, while preserving your Python scripts for local Windows execution (`run_app.bat`).

---

### 1. Ingestion & Schema Alignment (Immediate Next Turn)

When you upload the zip:
1. **Unpack & Structure**: Unzip into `/project_source/` and inspect directory layout.
2. **Schema Verification**:
   - Compare `des_rice_maharashtra_kharif_final.csv` columns against `DesRiceRecord`.
   - Compare `imd_district_kharif_rainfall_2015_2022.csv` against our canonical 36-district registry.
   - Load `Maharashtra.Districts.geojson` to render authentic polygon boundaries in our GIS map.
3. **Theming Synthesis**:
   - Sample hex colors from your `ImageElements` / `AdobeColor` theme (earthy paddy greens, harvest gold, deep terrain slate).
   - Apply these visual accents to the web console's cards, charts, and choropleth polygons.

```
       [ Uploaded Lightweight Zip ]
                    │
                    ▼
     ┌──────────────────────────────┐
     │ Unpack to /project_source/   │
     └──────────────┬───────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────────┐   ┌───────────────────────────┐
│ Actual File Audit │   │ Theming & GeoJSON Intake  │
│  - DES CSV schema │   │  - Maharashtra.Districts  │
│  - IMD Rain CSV   │   │  - Rice Paddy & Palettes  │
│  - Python scripts │   │  - Streamlit design hints │
└─────────┬─────────┘   └─────────────┬─────────────┘
          │                           │
          └─────────────►─────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│ Re-run Ground-Truth Baseline on your exact uploaded CSVs  │
│ Display verified sample counts and district matches       │
└───────────────────────────────────────────────────────────┘
```

---

### 2. Subsequent Implementation Phases

- **Phase 2 (Steps 5–7)**: 
  - Sentinel-2 multi-spectral pipeline specification (8 channels: B2, B3, B4, B8, B11, B12, NDVI, NDWI).
  - Spatial sampling restricted to agricultural areas via **ESA WorldCover Class 40 (Cropland)**.
  - NOAA CPC Oceanic Niño Index (ONI) monthly anomalous SST series alignment during June–August early warning months.
  - Unified 5D tensor generation: $\mathbf{X}_{\text{spatial}} \in [B, 6, 8, 32, 32]$ + $\mathbf{X}_{\text{exog}} \in [B, 6, 4]$.
- **Phase 3 (Steps 8–10)**:
  - PyTorch 2.x `CNN_LSTM_CropEarlyWarning` module with `TimeDistributed(Conv2D)` spatial encoder and `nn.LSTM` temporal aggregator.
  - Year-grouped cross-validation scripts and evaluation metrics.
  - In-season early warning inference engine computing predicted crop-failure probabilities ($P \in [0, 1]$).
  - Exportable local scripts for Windows 11 / AMD Radeon RX 9060 XT.
