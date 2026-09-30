# Implementation Plan: Rigorous Spatiotemporal CNN-LSTM Architecture & Data Pipeline (Finalized)

This plan governs the implementation of the authentic **Spatiotemporal CNN-LSTM Framework for Kharif Rice Crop Failure Early Warning in Maharashtra**. It enforces strict scientific integrity, zero target leakage, authoritative runtime parameter calculation, and explicit handling of satellite data availability.

---

## 1. Sentinel-2 Spatial Tensor & Cropland Mask Specification

The satellite data pipeline ingests multi-spectral rasters sampled strictly over verified agricultural areas:

- **Cropland Mask (Non-Crop Exclusion)**: Masked using **ESA WorldCover 10m Class 40 (Cropland)**.
  - *Clarification:* ESA Class 40 is a general cropland mask, not a crop-specific rice classification. Districts are defined as rice-growing administrative units based on Directorate of Economics and Statistics (DES) agricultural statistics, while pixels within Class 40 represent general agricultural cropland.
- **Temporal Horizon ($T=6$)**: Six bi-weekly composite intervals across the in-season early warning window (June 1 to August 31):
  1. $t_1$: June 01 – June 15 (Sowing / nursery preparation)
  2. $t_2$: June 16 – June 30 (Transplanting & seedling emergence)
  3. $t_3$: July 01 – July 15 (Early tillering)
  4. $t_4$: July 16 – July 31 (Active tillering)
  5. $t_5$: August 01 – August 15 (Panicle initiation)
  6. $t_6$: August 16 – August 31 (Booting & heading stage)
- **Spectral Channels ($C=8$)**:
  - `B2`: Blue (490 nm, atmospheric baseline)
  - `B3`: Green (560 nm, green canopy reflectance)
  - `B4`: Red (665 nm, chlorophyll absorption)
  - `B8`: NIR (842 nm, leaf biomass & structural vigor)
  - `B11`: SWIR-1 (1610 nm, canopy moisture content)
  - `B12`: SWIR-2 (2190 nm, soil moisture & drought stress)
  - `NDVI`: $\frac{B8 - B4}{B8 + B4}$ (vegetative vigor)
  - `NDWI`: $\frac{B8 - B11}{B8 + B11}$ (canopy water content)
- **Spatial Patch Dimensions ($H \times W$)**:
  - $32 \times 32$ pixels per parcel sampled at 10m ground sampling distance (GSD), representing a $320\text{m} \times 320\text{m}$ contiguous cropland parcel.
- **Tensor Shape (Channels-Last for TensorFlow.js)**:
  $$\mathbf{X}_{\text{spatial}} \in \mathbb{R}^{B \times 6 \times 32 \times 32 \times 8}$$

---

## 2. Conv2D Spatial Feature Encoder Architecture

A 2D Convolutional Neural Network processes the spatial patch at each timestep $t$ independently (via `TimeDistributed` in TensorFlow.js) to extract spatial canopy textures, vegetative uniformity, and moisture gradients:

```
Input per timestep: [B, 32, 32, 8]
│
├── Conv2D(16 filters, kernel=(3, 3), padding='same', activation='relu')
├── BatchNormalization()
├── MaxPooling2D(pool_size=(2, 2))                    ──> [B, 16, 16, 16]
│
├── Conv2D(32 filters, kernel=(3, 3), padding='same', activation='relu')
├── BatchNormalization()
├── MaxPooling2D(pool_size=(2, 2))                    ──> [B, 8, 8, 32]
│
├── Conv2D(64 filters, kernel=(3, 3), padding='same', activation='relu')
├── BatchNormalization()
├── GlobalAveragePooling2D()                          ──> [B, 64]
│
├── Dense(64 units, activation='relu')
├── Dropout(rate=0.2)                                 ──> [B, 64]
```

- **CNN Output Embedding Size**:
  - Spatial feature embedding: $\mathbf{e}_{\text{spatial}, t} \in \mathbb{R}^{64}$ per timestep.
  - Across sequence $T=6$: $\mathbf{E}_{\text{spatial}} \in \mathbb{R}^{B \times 6 \times 64}$.

---

## 3. Exogenous Climate Features & Exact Feature Fusion

- **Climate Tensor Shape**: $\mathbf{X}_{\text{climate}} \in \mathbb{R}^{B \times 6 \times 3}$
  - $c_1$: Bi-weekly cumulative rainfall (mm) from IMD gridded series (normalized).
  - $c_2$: Cumulative rainfall percentage departure from normal ($\frac{R_{\text{obs}} - R_{\text{normal}}}{R_{\text{normal}}} \times 100$).
  - $c_3$: NOAA CPC ONI SST anomaly ($^\circ\text{C}$) in the Niño 3.4 region.
- **Exact Fusion**:
  - Concatenation along the feature dimension at each timestep $t \in \{1..6\}$:
    $$\mathbf{f}_t = [\mathbf{e}_{\text{spatial}, t} \,\|\, \mathbf{x}_{\text{climate}, t}] \in \mathbb{R}^{64 + 3} = \mathbb{R}^{67}$$
  - Full fused sequence shape: $\mathbf{F}_{\text{fused}} \in \mathbb{R}^{B \times 6 \times 67}$.

---

## 4. Recurrent Core & Final Classification Head

- **Bidirectional LSTM Core**:
  - Input shape: $[B, 6, 67]$
  - `tf.layers.bidirectional({ layer: tf.layers.lstm({ units: 32, returnSequences: false }) })`
  - Output shape: $[B, 64]$ (concatenated 32-dim forward + 32-dim backward states).
- **Classification Head**:
  - `Dense(32, activation='relu')` $\to$ `Dropout(rate=0.3)` $\to$ `Dense(1, activation='sigmoid')`
  - Output: Predicted crop-failure probability $\hat{P} \in [0.0, 1.0]$.
  - Decision threshold: $\hat{P} \ge 0.50 \implies \text{Predicted Failure}$; $< 0.50 \implies \text{Resilient}$.

---

## 5. Authoritative Runtime Parameter Count Rule

- **No Hardcoding**: The application will NEVER hardcode the parameter count.
- **Authoritative Source**: The parameter count is dynamically queried at runtime using:
  ```ts
  const actualTrainableParams = model.countParams();
  ```
- *Theoretical reference:* Approximately 56,625 parameters across all layers, but the compiled TensorFlow.js graph count is treated as the sole authoritative truth.

---

## 6. Real Data Availability & Scientific Integrity Protocols

### A. Zero Fabrication Rule
- **No synthetic, randomized, or fake pixel arrays** will ever be created to simulate Sentinel-2 data.
- Until real Sentinel-2 $[B, 6, 32, 32, 8]$ rasters are exported from GEE and ingested:
  1. The complete CNN-LSTM architecture is fully constructed, compiled, and shape-verified in TensorFlow.js.
  2. The CNN spatial branch is explicitly marked in the code and UI as:  
     `Status: Pending Real GEE Cropland Rasters`.
  3. The model status is explicitly marked as:  
     `Status: Compiled Architecture (Untrained / Awaiting GEE Satellite Rasters)`.
  4. No fabricated weights, fake loss curves, or fake training epochs will be displayed.

### B. Google Earth Engine Real Extraction Deliverable
- Provide `scripts/extract_sentinel2_cropland.js` (for the Google Earth Engine Web Code Editor) and `scripts/extract_sentinel2_cropland.py`.
- The script uses `COPERNICUS/S2_SR_HARMONIZED`, masks pixels via `QA60` and `ESA/WorldCover/v100/2020` Class 40 (Cropland), and exports the exact $[B, 6, 32, 32, 8]$ tensor cubes per district to Google Drive.
- Provide `src/data/sentinel2Ingestion.ts` with a ready-to-ingest parser for the GEE output files.

### C. Sample Size & Generalization Transparency
- The developer diagnostic section will clearly document the true sample limitation:
  - 24 rice districts $\times$ 8 seasons (2015–2022) $= 192$ district-year observations.
  - With $\approx 56,625$ parameters, training from scratch on 192 samples presents a severe academic sample-size constraint and high overfitting risk.
  - The project does not claim "production readiness" or broad generalizability from this small sample, documenting this limitation transparently for examiners.

---

## 7. Complete Separation of Modes (No Shortcuts, No Analytical Fallbacks)

- **Historical Mode**:
  - Displays exclusively the Directorate of Economics and Statistics (DES) official ground truth (`des_observed_failure_status`).
- **Model Prediction Mode**:
  - Completely removes the `metric.failureEvent === 1` shortcut.
  - Executes the actual compiled neural network graph via `model.predict()`.
- **Future El Niño Mode**:
  - Evaluates the compiled neural network on future climate scenario inputs.
  - Eliminates the hand-tuned logistic substitute formula.

---

## Verification Plan

1. **TensorFlow.js Model Compilation**: Instantiate and compile the dual-input model (`spatial_input` $[B, 6, 32, 32, 8]$ + `climate_input` $[B, 6, 3]$).
2. **Tensor Shape Verification**: Run a forward pass test script verifying that each layer produces the expected dimensional output ($[B, 6, 32, 32, 8] \to [B, 6, 64]$ and $[B, 6, 67] \to [B, 64] \to [B, 1]$).
3. **Runtime Parameter Inspection**: Query `model.countParams()` directly and confirm it dynamically populates the diagnostics.
4. **Shortcut Removal Confirmation**: Inspect `src/components/GeospatialMapView.tsx` to verify zero references to `metric.failureEvent` in the prediction branch.
5. **GEE Script Validation**: Verify syntax and operational parameters of `scripts/extract_sentinel2_cropland.js`.
6. **Build & Lint Verification**: Run `compile_applet` and `lint_applet` to confirm clean compilation.
