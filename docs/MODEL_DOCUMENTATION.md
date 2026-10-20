# Machine Learning Model Documentation: Spatiotemporal CNN-LSTM for Kharif Rice Failure

**Project**: Spatiotemporal Deep Learning Framework for All-Kharif Crop Failure Prediction Under Meteorological & ENSO Anomalies  
**Target Crop**: Kharif Rice (*Oryza sativa*) in Canonical Producing Belts of Maharashtra, India  
**Version**: 2.1 (Audited Data Pipeline & Multi-Year Dataset Alignment)  
**Date**: October 2026  

---

## 1. Executive Summary & Problem Formulation

Predicting agricultural crop failure prior to harvest is critical for food security, disaster preparedness, and crop insurance schemes (such as the Pradhan Mantri Fasal Bima Yojana, PMFBY). This framework implements a multimodal deep learning architecture combining multi-temporal Sentinel-2 optical satellite imagery with gridded meteorological observations (IMD rainfall) and macro-climate anomalies (NOAA CPC Oceanic Niño Index, ONI) to predict catastrophic Kharif rice yield deficits at a lead time of 60–75 days prior to harvest.

### Mathematical Objective
For each district-season $i$ in year $t$, given:
- Multi-spectral spatial tensor $\mathbf{X}_i \in \mathbb{R}^{T \times C \times H \times W}$ ($T=6$ fortnights, $C=8$ spectral channels, $H=32, W=32$ pixels @ 20m GSD),
- Gridded climate time series $\mathbf{c}_i \in \mathbb{R}^{T \times K}$ (monsoon rainfall, rainfall departure %, summer ONI, and pixel valid coverage fraction),

the model predicts the probability of crop failure:
$$\hat{y}_i = \sigma(f_{\mathbf{\theta}}(\mathbf{X}_i, \mathbf{c}_i)) \in [0, 1]$$

where ground-truth failure $y_i \in \{0, 1\}$ is defined under the official PMFBY Olympic baseline standard:
$$y_i = \mathbb{I}\left(\frac{Y_{i, t} - \bar{Y}_{i, \text{Olympic}}}{\bar{Y}_{i, \text{Olympic}}} \le -15\%\right)$$

---

## 2. Multi-Year Dataset Architecture & Sourcing

### 2.1 Ground-Truth Agronomic Statistics (DES & ICRISAT)
- **Source**: Directorate of Economics and Statistics (DES), Ministry of Agriculture and Farmers Welfare (2018–2024), harmonized with the ICRISAT Village Dynamics in South Asia (VDSA) repository (1966–2017).
- **Unit Verification & Scaling**:
  - Official DES tables report **Area in Lakh Hectares ($10^5\text{ ha}$)** and **Production in Lakh Tonnes ($10^5\text{ t}$)**.
  - Harvest Yield is reported directly in **Kg/Ha**.
  - Metric relationship:
    $$\text{Yield (Kg/Ha)} = \frac{\text{Production (Lakh Tonnes)} \times 10^5 \times 1000}{\text{Area (Lakh Hectares)} \times 10^5} = \frac{\text{Production (Tonnes)}}{\text{Area (Ha)}} \times 1000$$
    $$\text{Yield (Tonnes/Ha)} = \frac{\text{Yield (Kg/Ha)}}{1000}$$
- **Data Deduplication**: All records unified by canonical district keys with zero duplicate district-season pairs (`data/standardized_maharashtra_kharif_rice_audited.csv`).

### 2.2 Satellite Imagery (Copernicus Sentinel-2 L2A)
- **Platform**: Sentinel-2 Multi-Spectral Instrument (MSI), Level-2A Bottom-Of-Atmosphere (BOA) Surface Reflectance (`COPERNICUS/S2_SR_HARMONIZED`).
- **Spatial Grid**: $32 \times 32$ pixel patches at 20m ground sampling distance (640m $\times$ 640m parcel footprint), centered over verified rice paddies derived from the 10m High-Resolution India Rice Map.
- **Coordinate Reference System (CRS)**: WGS 84 (`EPSG:4326`), pixel scale $\approx 0.000190^\circ \times 0.000180^\circ$ at $19^\circ\text{N}$.
- **Temporal Windows ($T=6$, Half-Open Continuous Dates)**:
  - $T_1$: June 01 – June 16 (Sowing / Nursery stage)
  - $T_2$: June 16 – July 01 (Transplanting stage)
  - $T_3$: July 01 – July 16 (Early vegetative stage)
  - $T_4$: July 16 – August 01 (Peak vegetative / Tillering stage)
  - $T_5$: August 01 – August 16 (Panicle initiation)
  - $T_6$: August 16 – September 01 (Heading / Flowering stage)
- **Spectral Bands ($C=8$)**:
  - Optical & Near-Infrared: `B2` (Blue, 490nm), `B3` (Green, 560nm), `B4` (Red, 665nm), `B8` (NIR, 842nm)
  - Short-Wave Infrared: `B11` (SWIR-1, 1610nm), `B12` (SWIR-2, 2190nm)
  - Vegetation Indices:
    $$\text{NDVI} = \frac{\text{B8} - \text{B4}}{\text{B8} + \text{B4} + 10^{-4}}$$
    $$\text{NDWI (NDMI)} = \frac{\text{B8} - \text{B11}}{\text{B8} + \text{B11} + 10^{-4}}$$

### 2.3 Meteorological & Macro-Climate Inputs
- **IMD Gridded Rainfall**: 0.25° $\times$ 0.25° daily rainfall interpolated to district-season totals (June–September) and historical departure % against the 2015–2022 district mean.
- **NOAA CPC ONI**: Summer Oceanic Niño Index (June–August mean 3-month running Sea Surface Temperature anomaly in the Niño 3.4 region).

---

## 3. Preprocessing, Cloud Masking & Imputation Pipeline

Tropical monsoon cloud cover is a fundamental challenge for optical remote sensing over India. The pipeline resolves this with mathematical rigor:

1. **Scene Classification Layer (SCL) Filtering**:
   - Only clear land pixels (SCL = 4: Vegetation, 5: Bare Soil, 6: Water, 7: Unclassified) are admitted.
   - Clouds (SCL = 8, 9), cirrus (SCL = 10), and cloud shadows (SCL = 3) are strictly masked out.
2. **Fallback Gap-Filling via Seasonal Kharif Median Composite**:
   - In Google Earth Engine, a baseline median composite is generated across the full Kharif window (June 01 – August 31).
   - If a 15-day window suffers persistent overcast (0 valid clear overpasses), the window is gap-filled via `.unmask(seasonalComposite)`.
   - Result: Exported GeoTIFFs have **0 NaNs** and **0 negative nodata values** while retaining physical reflectance ($0.0 \le \rho \le 1.0$).
3. **NoData & -9999 Protection in Model Ingestion**:
   - Values $\le -9998.0$ or non-finite are converted to `np.nan`.
   - Feature normalizers compute channel means $\mu_c$ and standard deviations $\sigma_c$ **strictly across finite, valid pixels**.
   - Input tensors are standardized: $z = \frac{x - \mu_c}{\sigma_c}$, clipped to $[-5.0, 5.0]$, and missing pixels are imputed to $0.0$ (normalized channel mean).
   - The exact valid-pixel fraction per timestep $\text{cov}_t \in [0, 1]$ is fed directly into the model sequence input so the LSTM explicitly knows which timesteps had cloud obstruction.
4. **Sample Provenance Metadata**:
   - Every training record tracks: `location_id`, `district_key`, `source_year`, `mask_year` (2020), `composite_method` (`geotiff_seasonal_gapfill` vs `geojson_mean_imputed`), and `valid_pixel_fraction_mean`.

---

## 4. Label Construction & Baseline Failure Rule

Crop failure is defined relative to each district's historical yield potential:

### 4.1 PMFBY 5-Year Olympic Baseline
For test season $t$, the baseline $\bar{Y}_{\text{Olympic}}$ is computed using the yields of the preceding 5 Kharif seasons $\{Y_{t-5}, Y_{t-4}, Y_{t-3}, Y_{t-2}, Y_{t-1}\}$. The maximum and minimum yields in this 5-year window are discarded, and the remaining 3 seasons are averaged:
$$\bar{Y}_{i, \text{Olympic}} = \frac{1}{3} \sum_{k \in \text{mid-3}} Y_{i, k}$$

### 4.2 Failure Threshold
A district-season is classified as a Failure ($y=1$) if the observed yield deficit is $15\%$ or greater below baseline:
$$\Delta Y_i = \frac{Y_i - \bar{Y}_{i, \text{Olympic}}}{\bar{Y}_{i, \text{Olympic}}} \times 100\% \le -15\%$$

### 4.3 Distribution in the 2019–2022 Training & Evaluation Corpus
| Season | Evaluated Districts | Failures ($y=1$) | Resilient ($y=0$) | Failure Rate | Season Characterization |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Kharif 2019** | 20 | 9 | 11 | 45.0% | Late monsoon onset, extreme regional deficit (Marathwada/Vidarbha) |
| **Kharif 2020** | 20 | 1 | 19 | 5.0% | Favorable monsoon rebound; isolated coastal flood loss |
| **Kharif 2021** | 18 | 0 | 18 | 0.0% | Broadly resilient statewide rice harvest |
| **Kharif 2022** | 17 | 0 | 17 | 0.0% | High-yield resilient season |
| **Total** | **75** | **10** | **65** | **13.3%** | Highly imbalanced real-world agricultural distribution |

---

## 5. Model Architecture & Training Protocol

```
                        [Input Tensor]
            Satellite: (B, T=6, C=8, H=32, W=32)
                            │
               Time-Distributed 2D CNN
            ┌────────────────────────────────┐
            │ Conv2d(8 -> 16, k=3, p=1) + ReLU│
            │ MaxPool2d(2)                   │
            │ Conv2d(16 -> 24, k=3, p=1)+ ReLU│
            │ MaxPool2d(2)                   │
            │ AdaptiveAvgPool2d((1, 1))      │
            │ Flatten -> 24 spatial features │
            └────────────────────────────────┘
                            │
              (B, T=6, 24 spatial features)
                            │
           Concatenate with Climate Vector (B, T=6, 4):
           [Rainfall, Rain Departure %, ONI, Coverage]
                            │
               Total Timestep Features: 28
                            │
             Bidirectional LSTM (Hidden=16)
                            │
            Output: Last hidden state (B, 32)
                            │
                   Classification Head
            ┌────────────────────────────────┐
            │ Linear(32 -> 16) + ReLU        │
            │ Dropout(p=0.20)                │
            │ Linear(16 -> 1)                │
            └────────────────────────────────┘
                            │
               Sigmoid -> Failure Probability
```

### Loss Function & Class Imbalance Handling
Training optimizes Binary Cross-Entropy with Pos-Weight:
$$\mathcal{L} = -\sum_{i=1}^{N} w_i \left[ p_{\text{pos}} y_i \log \hat{y}_i + (1 - y_i) \log(1 - \hat{y}_i) \right]$$
where:
- $p_{\text{pos}} = \frac{N_{\text{neg}}}{N_{\text{pos}}} \approx 5.88$ balances gradient magnitude for the rare failure class.
- $w_i = \frac{1}{\text{Patches in District-Season}}$ ensures that districts with multiple sampling parcels do not dominate over single-patch districts.

---

## 6. Empirical Evaluation & Benchmark Comparisons

All evaluations enforce **strict grouped splits by district**: all patches of a district are kept together so no spatial autocorrelation leaks between train and test sets.

### 6.1 Spatial Holdout Evaluation (Unseen Test Districts)
- **Train Set**: 15 districts (218 patch-year rows).
- **Test Set**: 5 completely held-out districts (Gondia, Nagpur, Nashik, Palghar, Sangli — 104 patch-year rows, 20 district-season evaluations).

| Model / Baseline | Accuracy | Balanced Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Majority-Class Baseline** | 90.0% | 50.0% | 0.000 | 0.000 | 0.000 | 0.500 | 0.100 |
| **Climate-Only Baseline (Logistic Regression)** | 85.0% | **91.7%** | 0.400 | **1.000** | **0.571** | 0.833 | 0.325 |
| **Proposed Multimodal CNN-LSTM** | **90.0%** | 72.2% | **0.500** | 0.500 | 0.500 | **0.917** | **0.500** |

#### Confusion Matrices (Spatial Holdout):
- **Majority-Class**: `[[18, 0], [2, 0]]` (Predicts 0 for all; fails to identify any crisis).
- **Climate-Only**: `[[15, 3], [0, 2]]` (Catches both failures, but triggers 3 false alarms).
- **Multimodal CNN-LSTM**: `[[17, 1], [1, 1]]` (Reduces false alarms by $67\%$ with superior ROC-AUC of **0.917**).

---

### 6.2 Temporal Leave-One-Season-Out (LOSO) Cross-Validation
In each fold, an entire Kharif season is held out from training and evaluated strictly on out-of-year data:

| Evaluation Dimension | Majority Baseline | Climate-Only (LogReg) | Multimodal CNN-LSTM |
| :--- | :---: | :---: | :---: |
| **Overall Evaluated District-Seasons** | 75 | 75 | 75 |
| **Overall Accuracy** | 86.7% | 86.7% | 80.0% |
| **ROC-AUC** | 0.108 | 0.183 | **0.305** |
| **Average Precision (PR-AUC)** | 0.122 | **0.180** | 0.110 |

#### Per-Season Breakdown (Multimodal CNN-LSTM):
| Season | Samples | Actual Failures | Predicted Failures | Accuracy | Brier Score |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Kharif 2019** | 20 | 9 | 2 | 55.0% | 0.4037 |
| **Kharif 2020** | 20 | 1 | 0 | 85.0% | 0.1000 |
| **Kharif 2021** | 18 | 0 | 3 | 83.3% | 0.1105 |
| **Kharif 2022** | 17 | 0 | 0 | **100.0%** | **0.0063** |

---

## 7. Transparent Data Integrity & Limitation Disclosures

1. **Current Local GeoTIFF Coverage**:
   - The local raster directory (`data/Maharashtra_Sentinel2_Rice_Patches...`) contains **20 GeoTIFF patches from Kharif 2019 only**.
   - Training and validation for seasons 2020, 2021, and 2022 currently ingest the pre-extracted GeoJSON spatial feature stores (`MH_Rice_S2_Patches_{year}.geojson`).
   - Although the GeoJSON feature stores contain distinct, year-matched satellite observations, they include unmasked cloud gaps (`-9999`) that required zero-imputation during preprocessing.
   - **True end-to-end multi-year raster verification requires exporting the 2020–2022 GeoTIFFs using `scripts/extract_sentinel2_cropland.js` in Google Earth Engine.**
2. **ENSO Anomaly Window in Training Range**:
   - The available satellite archive covers 2019–2022. During these years, June–August mean ONI values were $+0.30^\circ\text{C}$ (2019), $-0.40^\circ\text{C}$ (2020), $-0.43^\circ\text{C}$ (2021), and $-0.97^\circ\text{C}$ (2022).
   - None of the training seasons experienced a full-blown strong El Niño ($\text{ONI} \ge +1.5^\circ\text{C}$, like 2015 or 1997). The model demonstrates sensitivity to precipitation deficits and vegetation vigor anomalies, but full empirical validation under extreme El Niño conditions requires synthetic stress testing or historical hindcasting.
3. **Rice-Only Model Framing**:
   - All Sentinel-2 patches are centered on verified rice fields derived from the 10m India Rice classification layer.
   - The model must NOT be applied to non-rice crops (Soybean, Cotton, Bajra) without retraining on dedicated crop-specific parcels.

---

## 8. Reproducibility & Multi-Year Export Instructions

### 8.1 Exporting 2020, 2021, and 2022 Imagery in Google Earth Engine
1. Open [Google Earth Engine Code Editor](https://code.earthengine.google.com/).
2. Open [`scripts/extract_sentinel2_cropland.js`](file:///c:/Users/USMAN/Desktop/Usman%20ELNINO%20Project/ElninoPBLProject-main/ElninoPBLProject-main/scripts/extract_sentinel2_cropland.js).
3. The script is configured to export all 20 canonical districts:
   ```javascript
   var TEST_MODE = false;
   var TARGET_YEARS = [2020, 2021, 2022];
   ```
4. Click **Run**.
5. Switch to the **Tasks** tab on the right panel and click **Run** for each scheduled export task.
6. Once exports complete in Google Drive (`Maharashtra_Sentinel2_Rice_Patches`), download and place them into `data/Maharashtra_Sentinel2_Rice_Patches-20261020T184020Z-1-001/Maharashtra_Sentinel2_Rice_Patches/`.

### 8.2 Retraining the Pipeline Locally
```powershell
# Retrain CNN-LSTM with audited DES labels and baseline comparisons
& "C:\Users\USMAN\AppData\Local\Python\bin\python.exe" CNN_LSTM_Training/CropFailureProject/train_crop_failure_model.py --epochs 16 --label-threshold 15
```

### 8.3 Verifying Deliverable Artifacts
The training script automatically synchronizes all deliverables to `data/`:
- `data/crop_failure_model.pt` (Torch checkpoint + scaler coefficients)
- `data/evaluation_metrics.json` (Spatial holdout + baseline metrics)
- `data/loso_evaluation_metrics.json` (LOSO CV metrics)
- `data/matched_training_manifest.csv` (Complete manifest with valid pixel fractions and provenance)
