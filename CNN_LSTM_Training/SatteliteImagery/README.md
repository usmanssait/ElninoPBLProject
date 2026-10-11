# Sentinel-2 extraction starter — Maharashtra Kharif rice project

This is the first implementation stage: export small Sentinel-2 arrays from Earth Engine, then validate the exported arrays locally. It does not yet train the CNN-LSTM or claim model accuracy.

## Data contract

- Collection: `COPERNICUS/S2_SR_HARMONIZED`
- Pilot export year: 2020 only
- Years the collection supports for this plan: 2017–2022. Do not manufacture Sentinel-2 SR patches for 2015–2016.
- Six half-open windows per season: June 1–16, June 16–July 1, July 1–16, July 16–August 1, August 1–16, August 16–September 1.
- Eight channels in order: B2, B3, B4, B8, B11, B12, NDVI, NDWI.
- Patch: 32 × 32 cells at 20 m = 640 m × 640 m.
- NDVI = (B8 − B4)/(B8 + B4). The project's `NDWI` name is retained for (B8 − B11)/(B8 + B11), a NIR–SWIR moisture index often termed NDMI.
- SCL mask excludes classes 0, 1, 3, 8, 9, 10, 11, matching the prior pilot policy.
- Masked pixels use -9999 in the GEE export and are converted to NaN locally. They are never silently filled.

## Step 1 — Upload your locations table to Earth Engine

1. Use the latest `rice_sample_locations_2020.csv` produced by the variable-allocation sampler on your PC (the latest run reported 83 locations). Do not use an older 96-row CSV if it is not the current sampler output.
2. Open the Earth Engine Code Editor: https://code.earthengine.google.com/
3. Open **Assets → NEW → Table upload** and select that CSV.
4. If the upload wizard asks for geometry columns, set X = `longitude`, Y = `latitude`, CRS = `EPSG:4326`.
5. After ingestion completes, copy the exact asset ID shown by Earth Engine.

## Step 2 — Run the 2020 pilot export

1. Open `scripts/extract_sentinel2_patches.js` from this starter kit in the Code Editor.
2. Replace `projects/YOUR_PROJECT/assets/rice_sample_locations_2020` with the exact asset ID from Step 1.
3. Leave `YEARS_TO_EXPORT = [2020]` for the first run.
4. Click **Run**. The Console should show the locations and scene counts. The Tasks tab should contain one table export.
5. Start that task. Wait for completion and check the Drive folder `ELNINO_S2_PATCHES_V1` for `MH_Rice_S2_Patches_2020.geojson`.

The exported row contains 48 32×32 arrays (6 windows × 8 channels), per-window image-scene counts, and per-window valid-pixel coverage. GeoJSON is used so the array properties stay structured. The output is a large table compared with an ordinary CSV, but far smaller than exporting whole-district imagery.

## Step 3 — Validate locally

Copy this kit’s `scripts` folder into the project root (merge it with an existing `scripts` folder if one exists). Create `data\gee_exports` in the project and put the downloaded GeoJSON file(s) there. In PowerShell, from the project root:

```powershell
py -m pip install numpy pandas
py scripts\prepare_sentinel2_dataset.py --input-dir data\gee_exports --output-dir data\processed --min-coverage 70
```

The script creates:

- `data/processed/sentinel2_patches_raw.npz` — tensor shape `[N, 6, 32, 32, 8]`, with cloud-masked values preserved as NaN.
- `data/processed/sentinel2_export_quality_audit.csv` — per location-year window coverage, scene counts, missing-pixel measures and eligibility flags.

`coverage_eligible` means each of the six GEE coverage percentages meets the chosen threshold. It does **not** mean the tensor is ready to train. `ready_for_training_without_imputation` is stricter and will be false if any masked pixel remains. We will use the actual audit to choose a documented missing-data strategy instead of inventing reflectance values.

## Step 4 — Scale out only after the pilot is valid

After confirming the 2020 output has the correct schema and patch dimensions, change:

```javascript
var YEARS_TO_EXPORT = [2017, 2018, 2019, 2020, 2021, 2022];
```

Run the script again and start the six table exports. Keep 2015 and 2016 explicitly marked as satellite-unavailable for this surface-reflectance source. Crop-year keys are `2017-2018` through `2022-2023`, matching the DES crop-season convention in the current manifest.

## Important research cautions

- The point table was sampled from a rice-distribution product labelled 2020/Winter. Its rice fractions and season/product interpretation must remain attached to every patch. It is a sampling aid, not the outcome label.
- The current sampler output is only a candidate set; it does not yet cover every matched DES/IMD district and some points have low rice fractions. This pilot tests the extraction pipeline, not district representativeness.
- Historical DES failure labels are supervised targets only, never inputs to the imagery or climate feature tensor.
- Do not random-split points from the same district-year across train/test. Validation must group related patches by district-year (and report the small effective number of labeled district-year units).
