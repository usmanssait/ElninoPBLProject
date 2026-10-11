# Maharashtra Rice Crop-Failure CNN-LSTM (Prototype)

This bundle contains a trained PyTorch CNN-LSTM and scripts to retrain it or run inference on Sentinel-2 patch GeoJSONs.

## Included files

- `crop_failure_model.pt` — trained checkpoint, model weights, and preprocessing statistics.
- `train_crop_failure_model.py` — rebuilds the matched dataset and trains a model.
- `predict_crop_failure.py` — generates location and district-season risk scores without requiring DES target labels.
- `training_report.json` / `evaluation_metrics.json` — dataset counts and holdout results.
- `heldout_district_predictions.csv` — district-season predictions from the held-out-district evaluation.
- `matched_training_manifest.csv` — joined satellite/DES/IMD/ONI metadata for the 322 usable patch-year rows.
- `in_sample_demo_predictions.csv` — scores on training data for a simple app/demo wiring test only.
- `demo_predictions_2022.csv` — output smoke-tested from the predictor script on the 2022 patch file.
- `requirements.txt` — Python dependencies.

## Use on Windows

Put these files in a folder alongside the four satellite GeoJSON files:

- `MH_Rice_S2_Patches_2019.geojson`
- `MH_Rice_S2_Patches_2020.geojson`
- `MH_Rice_S2_Patches_2021.geojson`
- `MH_Rice_S2_Patches_2022.geojson`

Also place your DES and IMD CSVs in the folder. The scripts find files matching `des_rice_maharashtra_kharif_final*.csv` and `imd_district_kharif_rainfall_2015_2022*.csv` automatically, or you can pass explicit paths.

Open PowerShell in that folder:

```powershell
py -m pip install -r requirements.txt
py predict_crop_failure.py --data-dir . --model crop_failure_model.pt --years 2022 --output crop_failure_predictions.csv
```

For inference on more than one year, use e.g. `--years 2019,2020,2021,2022`.

For a new year, you need a GeoJSON patch file for that year and an IMD rainfall CSV containing that district-season. Supply its June-August ONI mean anomaly too, for example:

```powershell
py predict_crop_failure.py --data-dir . --model crop_failure_model.pt --years 2025 --oni-values 2025=0.8 --output crop_failure_predictions_2025.csv
```

Replace `0.8` with the actual ONI anomaly value for the chosen period. The score categories are provisional, and risk scores are not calibrated probabilities.

## Retrain

```powershell
py train_crop_failure_model.py --data-dir . --output-dir crop_model_output --epochs 16
```

The trained model will be saved as `crop_model_output\crop_failure_model.pt`.

## Important limitations

- Target: the DES `crop_failure_initial` field is used as provided. It is a district-season target repeated across the sampled locations in that district-season.
- 322 patch-year rows correspond to only 75 distinct district-season labels: 10 positive and 65 negative. Those rows are not all independent observations.
- The evaluation holds out whole districts, but evaluates only 20 district-season groups and only 2 positive labels. Its 90% accuracy is equal to a majority-class baseline of 90%, so it is not evidence of strong predictive performance.
- In the supplied ENSO data, the 2019–2022 June-August mean ONI values are 0.30, -0.40, -0.43 and -0.97 °C. None is at or above +0.5 °C. As a result, this model is a working crop-failure prototype with an ONI feature, **not a validated model of crop failure during El Niño**.
- The IMD file has seasonal rainfall totals, not six biweekly rainfall values, so seasonal rainfall, district-relative rainfall departure, and ONI are repeated across the six satellite time steps; per-window pixel coverage varies by timestep.
- Do not interpret the generated 0–1 score or Low/Moderate/High category as a calibrated probability or an operational agricultural advisory.
