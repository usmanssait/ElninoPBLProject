# Final Correction Pass: Spatiotemporal CNN-LSTM Crop Failure Prediction

A focused architectural and corrective blueprint addressing all 9 specific requirements: removing unnecessary navigation clutter, eliminating statistical inconsistencies, dynamically computing genuine Leave-One-Season-Out (LOSO) metrics from district data, clearly separating observed ground truth from model predictions, and eliminating all horizontal layout overflow for a clean B.Tech PBL presentation.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Summary of Confirmed Choices**:
> 1. **Baseline Audit Relocation**: Relocated from the top navigation into a dedicated section within the **Data Sources & Baseline** view, keeping the main navigation focused on 4 core tabs.
> 2. **Dynamic LOSO Validation**: All performance metrics (Accuracy, Precision, Recall, F1-Score, ROC-AUC) and confusion matrix values will be **dynamically computed** from real district DES ground truth and model predictions for each held-out year—zero static or hardcoded scores.
> 3. **Statistical Consistency**: All statewide metrics and failure counts are strictly filtered by the 24 modeled rice districts (`PRIMARY_RICE_DISTRICTS`), preventing any counts exceeding 24.
> 4. **Clear Separation of Truth vs Prediction**:
>    - **Historical Mode**: Displays *DES Observed Crop-Failure Status* based on verified yield deficit ($< -10\%$).
>    - **Future Mode**: Displays *Model-Predicted Crop-Failure Probability* ($P \in [0, 1]$).
>    - Legends and labels will never mix yield deficit percentages with probability scores.
> 5. **Objective Viva-Ready Terminology**: Removed exaggerated claims like "proving generalization" in favor of objective academic phrasing: "Evaluating Model Generalization on Unseen El Niño Seasons".
> 6. **Zero Overflow**: Fixed horizontal clipping in CNN-LSTM architecture cards, data tables, map containers, and header navigation.

---

## 1. Streamlined 4-Tab Navigation & Component Hierarchy

The top navigation is reduced to 4 crisp tabs:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ACADEMIC TOP NAVIGATION (4 TABS)                      │
│                                                                             │
│  [1. District Risk Map]        Interactive map with Historical & Future     │
│                                El Niño modes (centerpiece)                  │
│                                                                             │
│  [2. CNN-LSTM Network]         Visual tensor transformations:               │
│                                S2 → CNN → Fused Vector → BiLSTM → P(fail)   │
│                                                                             │
│  [3. LOSO Validation]          Dynamically computed evaluation metrics      │
│                                on held-out historical El Niño seasons       │
│                                                                             │
│  [4. Data Sources & Baseline]  Working portal links (NOAA, IMD, DES, ESA)   │
│                                + compact Baseline Yield Audit               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technical Architecture & Corrective Plan

### A. Dynamic LOSO Validation Engine (`src/data/futureElNinoForecast.ts`)
- Implement a pure, dynamic evaluation function `evaluateLosoHeldOutYear(heldOutYear: number)`:
  - Retrieves the 24 rice districts for that year.
  - Compares ground truth $Y_i = \mathbb{I}(\text{actualYield} < 0.90 \times \text{baselineYield})$ against model prediction $\hat{Y}_i = \mathbb{I}(P_i \ge 0.50)$.
  - Calculates true counts: $TP, FP, FN, TN$.
  - Computes exact derived metrics:
    $$\text{Accuracy} = \frac{TP + TN}{24} \times 100$$
    $$\text{Precision} = \frac{TP}{TP + FP} \times 100$$
    $$\text{Recall} = \frac{TP}{TP + FN} \times 100$$
    $$\text{F1-Score} = \frac{2 \cdot \text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$$
    $$\text{ROC-AUC} = \text{Rank-based Wilcoxon-Mann-Whitney metric on } P_i$$
- Replaces static hardcoded objects in `LosoValidationView.tsx` with live evaluations for 2015, 2018, and 2020.

### B. Map & Telemetry Consistency (`src/components/GeospatialMapView.tsx`)
- **Strict 24-District Filter**: All calculations (`failureCount`, `avgYield`, `avgRainfall`) evaluate strictly against `PRIMARY_RICE_DISTRICTS` ($N = 24$). The UI will consistently display `X / 24 rice districts`.
- **Distinct Legends & Indicators**:
  - In **Historical Mode**:
    - Legend: `Observed Failure (Yield < -10% vs baseline)` (Crimson) vs `Observed Resilient` (Green).
    - Status tag: `OBSERVED FAILURE` vs `OBSERVED RESILIENT`.
  - In **Future Mode**:
    - Legend: `High Failure Probability (P ≥ 65%)` (Crimson) vs `Moderate Watch (35–65%)` (Amber) vs `Low Probability / Resilient (P < 35%)` (Green).
    - Status tag: `HIGH FAILURE PROBABILITY` vs `MODERATE PROBABILITY` vs `LOW PROBABILITY`.
- **Simplified Controls**: Keep Future Mode clean—select a scenario preset or adjust ONI, rainfall deficit, and NDVI sliders; immediately see the resulting probability surface.

### C. Relocate Baseline Audit into Data Sources (`src/components/SpatiotemporalDataView.tsx`)
- Add a 5th sub-tab: **"Baseline Yield Audit"** inside `SpatiotemporalDataView.tsx`.
- Houses the zero-leakage prior rolling baseline explanation, the 2015–2022 sample counts (72 strict 5-year prior observations vs 120 expanding prior observations), and the filterable ground-truth table.

### D. Horizontal Overflow & Visual Cleanup
- **`ModelArchitectureView.tsx`**:
  - Replace overflow-prone layout with `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0`.
  - Remove fixed absolute arrow markers that breach container boundaries.
- **`Header.tsx`**:
  - Adjust container padding and remove unnecessary badges to ensure clean desktop rendering at 1024px, 1280px, and 1440px widths.
- **`GeospatialMapView.tsx`**:
  - Add `w-full max-w-full overflow-hidden` to SVG canvas wrapper to ensure the 36-district vector map fits perfectly without horizontal scrolling.

---

## 3. Implementation Steps

1. **Update `src/data/futureElNinoForecast.ts`**:
   - Implement `evaluateLosoHeldOutYear(year: number)` to dynamically calculate confusion matrix and evaluation metrics from real district records.
2. **Update `src/components/LosoValidationView.tsx`**:
   - Replace hardcoded values with dynamic evaluation from `evaluateLosoHeldOutYear`.
   - Update terminology to objective evaluation phrasing.
3. **Update `src/components/GeospatialMapView.tsx`**:
   - Enforce consistent 24-district failure counts.
   - Separate historical observed failure from model-predicted failure probability in legends, tooltips, and badges.
   - Verify zero horizontal overflow.
4. **Update `src/components/SpatiotemporalDataView.tsx`**:
   - Add the relocated Baseline Yield Audit tab with sample size metrics and ground truth table.
5. **Update `src/components/ModelArchitectureView.tsx`**:
   - Eliminate horizontal overflow and standardize B.Tech PBL viva terminology.
6. **Update `src/components/Header.tsx` and `src/App.tsx`**:
   - Reduce main navigation to 4 tabs.
7. **Build & Lint Verification**:
   - Run `compile_applet` and `lint_applet` to verify a zero-error final build.
