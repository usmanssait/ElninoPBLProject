#!/usr/bin/env python3
"""Validate Earth Engine GeoJSON patch exports and create raw NumPy tensors.

Expected GEE export: one Feature per location-year, containing 48 properties
named t01_B2 ... t06_NDWI. Each property should hold a 32x32 array; masked
pixels use -9999. This script preserves missing pixels as NaN and does not
silently fill/invent reflectance values.

Example:
  py scripts/prepare_sentinel2_dataset.py \
    --input-dir data/gee_exports --output-dir data/processed --min-coverage 70
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

PATCH_SIZE = 32
TIMESTEPS = 6
CHANNELS = ["B2", "B3", "B4", "B8", "B11", "B12", "NDVI", "NDWI"]
TIMESTEP_NAMES = ["t01", "t02", "t03", "t04", "t05", "t06"]
FILL_VALUE = -9999.0


def parse_json_array(value: Any) -> np.ndarray:
    """Convert GeoJSON property values (possibly JSON strings) to 32x32 arrays."""
    if isinstance(value, str):
        value = value.strip()
        if value.startswith("["):
            value = json.loads(value)
        else:
            raise ValueError(f"Expected array property; got string {value[:40]!r}")
    arr = np.asarray(value, dtype=np.float32)
    arr = np.squeeze(arr)
    if arr.shape == (PATCH_SIZE, PATCH_SIZE):
        return arr
    if arr.size == PATCH_SIZE * PATCH_SIZE:
        return arr.reshape(PATCH_SIZE, PATCH_SIZE)
    raise ValueError(f"Expected 32x32 (1024 values), received shape={arr.shape}, size={arr.size}")


def number_or_nan(value: Any) -> float:
    try:
        if value is None or value == "":
            return float("nan")
        return float(value)
    except (TypeError, ValueError):
        return float("nan")


def load_export(path: Path, fill_value: float) -> tuple[list[dict[str, Any]], list[np.ndarray], list[dict[str, Any]]]:
    with path.open("r", encoding="utf-8") as handle:
        document = json.load(handle)

    if document.get("type") != "FeatureCollection":
        raise ValueError(f"{path.name} is not a GeoJSON FeatureCollection")

    features = document.get("features", [])
    if not features:
        raise ValueError(f"{path.name} has no features")

    year_match = re.search(r"(20\d{2})", path.stem)
    filename_year = int(year_match.group(1)) if year_match else None
    tensors: list[np.ndarray] = []
    metadata_rows: list[dict[str, Any]] = []
    audit_rows: list[dict[str, Any]] = []

    for feature_index, feature in enumerate(features):
        props = feature.get("properties") or {}
        raw_year = props.get("satellite_year", filename_year)
        if raw_year is None:
            raise ValueError(f"Cannot infer satellite year for feature {feature_index} in {path.name}")
        year = int(float(raw_year))

        tensor = np.empty((TIMESTEPS, PATCH_SIZE, PATCH_SIZE, len(CHANNELS)), dtype=np.float32)
        missing_bands: list[str] = []
        for t_index, t_name in enumerate(TIMESTEP_NAMES):
            for c_index, channel in enumerate(CHANNELS):
                key = f"{t_name}_{channel}"
                if key not in props:
                    missing_bands.append(key)
                    tensor[t_index, :, :, c_index] = np.nan
                    continue
                try:
                    arr = parse_json_array(props[key])
                except Exception as exc:
                    raise ValueError(
                        f"{path.name}, feature {feature_index}, property {key}: {exc}"
                    ) from exc
                arr = arr.astype(np.float32, copy=False)
                invalid = (~np.isfinite(arr)) | np.isclose(arr, fill_value, atol=0.1)
                arr = arr.copy()
                arr[invalid] = np.nan
                tensor[t_index, :, :, c_index] = arr

        # Pixel is considered usable only if every channel is finite.
        pixel_valid = np.isfinite(tensor).all(axis=-1)
        measured_valid_pct = pixel_valid.mean(axis=(1, 2)) * 100.0
        reported_coverage_pct = np.array([
            number_or_nan(props.get(f"coverage_pct_{t_name}"))
            for t_name in TIMESTEP_NAMES
        ], dtype=np.float32)
        scene_counts = np.array([
            number_or_nan(props.get(f"scene_count_{t_name}"))
            for t_name in TIMESTEP_NAMES
        ], dtype=np.float32)

        # Crop-year is the DES season beginning in the satellite year, e.g. 2020-2021.
        crop_year = str(props.get("crop_year") or f"{year}-{year + 1}")
        location_id = str(props.get("location_id", f"feature_{feature_index:04d}"))
        district = str(props.get("district", "UNKNOWN"))

        metadata = {
            "location_id": location_id,
            "district": district,
            "longitude": number_or_nan(props.get("longitude")),
            "latitude": number_or_nan(props.get("latitude")),
            "rice_fraction": number_or_nan(props.get("rice_fraction")),
            "satellite_year": year,
            "crop_year": crop_year,
            "source_file": path.name,
        }
        audit = dict(metadata)
        audit.update({
            f"coverage_pct_{t_name}": float(reported_coverage_pct[i])
            for i, t_name in enumerate(TIMESTEP_NAMES)
        })
        audit.update({
            f"measured_valid_pct_{t_name}": float(measured_valid_pct[i])
            for i, t_name in enumerate(TIMESTEP_NAMES)
        })
        audit.update({
            f"scene_count_{t_name}": float(scene_counts[i])
            for i, t_name in enumerate(TIMESTEP_NAMES)
        })
        audit["minimum_reported_coverage_pct"] = (
            float(np.nanmin(reported_coverage_pct)) if np.isfinite(reported_coverage_pct).any() else np.nan
        )
        audit["minimum_measured_valid_pct"] = float(np.min(measured_valid_pct))
        audit["missing_channel_properties"] = ";".join(missing_bands)
        audit["has_missing_pixel_values"] = bool(np.isnan(tensor).any())
        audit["empty_scene_window"] = bool(np.any(scene_counts == 0)) if np.isfinite(scene_counts).any() else True
        audit["coverage_ge_minimum_all_windows"] = bool(
            np.isfinite(reported_coverage_pct).all()
            and np.all(reported_coverage_pct >= 0)
        )

        tensors.append(tensor)
        metadata_rows.append(metadata)
        audit_rows.append(audit)

    return metadata_rows, tensors, audit_rows


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", type=Path, required=True,
                        help="Folder containing MH_Rice_S2_Patches_YYYY.geojson exports")
    parser.add_argument("--output-dir", type=Path, required=True,
                        help="Folder for raw NPZ tensors and the quality audit CSV")
    parser.add_argument("--min-coverage", type=float, default=70.0,
                        help="Coverage threshold to flag coverage-eligible location-years (default: 70%% per window)")
    args = parser.parse_args()

    if not args.input_dir.exists():
        print(f"ERROR: input folder does not exist: {args.input_dir}", file=sys.stderr)
        return 2
    geojson_files = sorted(args.input_dir.glob("MH_Rice_S2_Patches_*.geojson"))
    if not geojson_files:
        # Permit upper/lower case or a manually renamed downloaded file.
        geojson_files = sorted(args.input_dir.glob("*.geojson"))
    if not geojson_files:
        print(f"ERROR: no GeoJSON exports found in {args.input_dir}", file=sys.stderr)
        return 2

    all_meta: list[dict[str, Any]] = []
    all_tensors: list[np.ndarray] = []
    all_audit: list[dict[str, Any]] = []

    for path in geojson_files:
        print(f"Reading {path.name} ...")
        meta, tensors, audit = load_export(path, FILL_VALUE)
        all_meta.extend(meta)
        all_tensors.extend(tensors)
        all_audit.extend(audit)
        print(f"  loaded {len(tensors)} location-year patches")

    X = np.stack(all_tensors, axis=0).astype(np.float32)
    meta_df = pd.DataFrame(all_meta)
    audit_df = pd.DataFrame(all_audit)

    coverage_cols = [f"coverage_pct_{t}" for t in TIMESTEP_NAMES]
    measured_cols = [f"measured_valid_pct_{t}" for t in TIMESTEP_NAMES]
    # A reported coverage threshold is distinct from full pixel completeness.
    if all(col in audit_df.columns for col in coverage_cols):
        coverage = audit_df[coverage_cols].to_numpy(dtype=np.float32)
        audit_df["coverage_eligible"] = np.isfinite(coverage).all(axis=1) & (coverage >= args.min_coverage).all(axis=1)
    else:
        audit_df["coverage_eligible"] = False
    audit_df["all_windows_have_some_valid_pixels"] = (audit_df[measured_cols].fillna(0).to_numpy() > 0).all(axis=1)
    audit_df["strict_complete_tensor"] = ~audit_df["has_missing_pixel_values"].astype(bool)
    audit_df["ready_for_training_without_imputation"] = (
        audit_df["coverage_eligible"]
        & audit_df["all_windows_have_some_valid_pixels"]
        & audit_df["strict_complete_tensor"]
        & (audit_df["missing_channel_properties"].fillna("") == "")
    )
    audit_df["coverage_threshold_pct"] = args.min_coverage

    args.output_dir.mkdir(parents=True, exist_ok=True)
    tensor_path = args.output_dir / "sentinel2_patches_raw.npz"
    audit_path = args.output_dir / "sentinel2_export_quality_audit.csv"

    np.savez_compressed(
        tensor_path,
        X_satellite_raw=X,
        location_id=meta_df["location_id"].to_numpy(dtype=str),
        district=meta_df["district"].to_numpy(dtype=str),
        longitude=meta_df["longitude"].to_numpy(dtype=np.float32),
        latitude=meta_df["latitude"].to_numpy(dtype=np.float32),
        rice_fraction=meta_df["rice_fraction"].to_numpy(dtype=np.float32),
        satellite_year=meta_df["satellite_year"].to_numpy(dtype=np.int16),
        crop_year=meta_df["crop_year"].to_numpy(dtype=str),
        source_file=meta_df["source_file"].to_numpy(dtype=str),
        channel_order=np.asarray(CHANNELS, dtype=str),
        timestep_order=np.asarray(TIMESTEP_NAMES, dtype=str),
        fill_value=np.asarray(np.nan, dtype=np.float32),
    )
    audit_df.to_csv(audit_path, index=False)

    print("\n================ QUALITY SUMMARY ================")
    print(f"Raw tensor shape: {X.shape} (N, 6, 32, 32, 8)")
    print(f"Location-year rows: {len(X)}")
    print(f"Years: {sorted(meta_df['satellite_year'].unique().tolist())}")
    print(f"Rows passing >= {args.min_coverage:.1f}% reported coverage in all six windows: "
          f"{int(audit_df['coverage_eligible'].sum())}")
    print(f"Rows with no missing pixels in all six windows: {int(audit_df['strict_complete_tensor'].sum())}")
    print(f"Rows ready for training without imputation: {int(audit_df['ready_for_training_without_imputation'].sum())}")
    print("Masked pixels were preserved as NaN; no replacement values were invented.")
    print(f"Tensor saved: {tensor_path}")
    print(f"Audit saved : {audit_path}")
    print("==================================================")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
