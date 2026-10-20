MAHARASHTRA RICE CROP-FAILURE CNN-LSTM PROTOTYPE
=================================================

Files:
- crop_failure_model.pt: trained PyTorch checkpoint + normalization parameters
- evaluation_metrics.json: grouped-by-district holdout metrics
- heldout_district_predictions.csv: test results for unseen districts
- matched_training_manifest.csv: joined sample/label/climate metadata
- in_sample_demo_predictions.csv: training-set scores for app wiring only (NOT validation)

Target: DES crop_failure_initial, used as provided. Satellite patches inherit the label for their district-season.
Inputs: 6 x 8 satellite arrays, district-season IMD rainfall, district-relative rainfall departure, ONI anomaly, and pixel coverage.
Missing satellite pixels marked -9999 are ignored when estimating channel statistics and imputed to standardized zero.

Important limitation: this dataset does not contain a June-August mean ONI >= +0.5 C for 2019-2022.
The file is a working prototype and cannot establish performance specifically during true El Niño conditions.
Small district-season sample count and repeated district labels also limit generalization.
