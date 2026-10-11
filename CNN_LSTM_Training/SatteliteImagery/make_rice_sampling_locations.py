"""
Maharashtra Kharif Rice sampling-location generator — variable allocation.

Purpose
-------
Create spatial sampling locations for Sentinel-2 patches using the 2020
Winter rice-distribution raster as a spatial rice mask. The number of
locations is NOT forced to five per district. Instead it is allocated from:
    75% long-run mean DES rice area
    25% district geographic area
with a smooth log-scaled score and a 2–7 location range per district.

The allocation uses DES area only to DESIGN the spatial sampling plan. It is
not written as a model feature and is never used as the CNN-LSTM target.

Each selected location represents a 640 m x 640 m footprint, matching the
planned 32 x 32 Sentinel-2 patch at 20 m resolution.

The 2020 Winter rice map is used ONLY as a sampling mask. It does not prove
that every sampled pixel is rice in every model year.

Dependencies:
    py -m pip install rasterio geopandas shapely pandas numpy

Run:
    py ".\\make_rice_sampling_locations.py"
"""

from pathlib import Path
import math
import sys

import geopandas as gpd
import numpy as np
import pandas as pd
import rasterio
from rasterio.features import geometry_mask
from rasterio.windows import from_bounds
from shapely.geometry import Point


# ============================================================
# PATHS
# ============================================================

SCRIPT_DIR = Path(__file__).resolve().parent

# Check for the satellite rice GeoTIFF raster in script folder or candidates
RICE_TIF_CANDIDATES = [
    SCRIPT_DIR / "classified-10m-India-2020-Winter_rice-WGS84.tif",
    SCRIPT_DIR.parent / "SatelliteImagery" / "classified-10m-India-2020-Winter_rice-WGS84.tif",
    SCRIPT_DIR.parent / "SatteliteImagery" / "classified-10m-India-2020-Winter_rice-WGS84.tif",
]
RICE_TIF = SCRIPT_DIR / "classified-10m-India-2020-Winter_rice-WGS84.tif"
for cand in RICE_TIF_CANDIDATES:
    if cand.exists():
        RICE_TIF = cand
        break

# The main project root (ElninoPBLProject-main)
PROJECT_CANDIDATES = [
    SCRIPT_DIR.parent.parent,
    SCRIPT_DIR.parent,
    Path.cwd(),
]
PROJECT = SCRIPT_DIR.parent.parent
for cand in PROJECT_CANDIDATES:
    if (cand / "data" / "des_rice_maharashtra_kharif_final.csv").exists():
        PROJECT = cand
        break

DES_CANDIDATES = [
    PROJECT / "data" / "des_rice_maharashtra_kharif_final.csv",
    SCRIPT_DIR.parent / "CropFailureProject" / "des_rice_maharashtra_kharif_final.csv",
]
DES_FILE = DES_CANDIDATES[0]
for cand in DES_CANDIDATES:
    if cand.exists():
        DES_FILE = cand
        break

IMD_CANDIDATES = [
    PROJECT / "data" / "imd_district_kharif_rainfall_2015_2022.csv",
    SCRIPT_DIR.parent / "CropFailureProject" / "imd_district_kharif_rainfall_2015_2022.csv",
]
IMD_FILE = IMD_CANDIDATES[0]
for cand in IMD_CANDIDATES:
    if cand.exists():
        IMD_FILE = cand
        break

BOUNDARY_CANDIDATES = [
    SCRIPT_DIR / "Maharashtra.Districts.geojson",
    SCRIPT_DIR / "Maharashtra.Districts(2).geojson",
    PROJECT / "Maharashtra.Districts.geojson",
    PROJECT / "InputData" / "District Bounds json" / "Maharashtra.Districts.geojson",
]

OUTPUT_CSV = SCRIPT_DIR / "rice_sample_locations_2020.csv"
DIAGNOSTIC_CSV = SCRIPT_DIR / "rice_sampling_diagnostics_2020.csv"
PLAN_CSV = SCRIPT_DIR / "rice_sampling_plan_2020.csv"


# ============================================================
# SETTINGS
# ============================================================

# Variable allocation: rice area dominates, district size is secondary.
RICE_AREA_WEIGHT = 0.75
DISTRICT_AREA_WEIGHT = 0.25

MIN_SAMPLES_PER_DISTRICT = 2
MAX_SAMPLES_PER_DISTRICT = 7

# Final model patch: 32 x 32 @ 20 m = 640 m x 640 m.
FINAL_WINDOW_PX = 64
FINAL_PIXEL_M = 10
FINAL_FOOTPRINT_M = FINAL_WINDOW_PX * FINAL_PIXEL_M

# Coarse screen. Area averaging is used, not nearest-neighbour.
SCREEN_PIXEL_M = 40
COARSE_WINDOW_M = FINAL_FOOTPRINT_M

# Final patch must be mostly inside the district.
MIN_FINAL_DISTRICT_COVERAGE = 0.95

# Native patch-quality ladder. Strongest quality that can support the
# requested number of locations is preferred.
QUALITY_THRESHOLDS = [0.80, 0.60, 0.40, 0.25, 0.10, 0.05, 0.00]

# Spatial separation fallback in km.
SEPARATION_LEVELS_KM = [2.0, 1.0, 0.5, 0.25]

# Bounded native checks for performance.
MAX_NATIVE_CHECKS = 2000

# Coarse candidate stride. 4 means candidates are deduplicated to roughly
# every 160 m at the nominal 40 m screen resolution.
CANDIDATE_STRIDE = 4
MAX_SCREEN_DIM = 2800


# ============================================================
# HELPERS
# ============================================================

def norm_name(value):
    s = str(value).strip().lower()
    for ch in [" ", "-", "_", ".", "'", '"', "(", ")", "/"]:
        s = s.replace(ch, "")
    aliases = {
        "gondiya": "gondia",
        "ahmednagar": "ahilyanagar",
        "ahilyanagardistrict": "ahilyanagar",
        "chhatrapatisambhajinagardistrict": "chhatrapatisambhajinagar",
    }
    return aliases.get(s, s)


def find_boundary_file():
    for p in BOUNDARY_CANDIDATES:
        if p.exists():
            return p
    raise FileNotFoundError(
        "Maharashtra.Districts.geojson was not found.\n"
        "Update BOUNDARY_CANDIDATES near the top of this script."
    )


def haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0088
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = (
        math.sin(dp / 2.0) ** 2
        + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0) ** 2
    )
    return 2 * r * math.asin(math.sqrt(a))


def sliding_mean(a, size):
    """Fast 2-D sliding mean using an integral image."""
    a = np.asarray(a, dtype=np.float32)
    ii = np.pad(a, ((1, 0), (1, 0)), mode="constant")
    ii = ii.cumsum(axis=0).cumsum(axis=1)
    sums = (
        ii[size:, size:]
        - ii[:-size, size:]
        - ii[size:, :-size]
        + ii[:-size, :-size]
    )
    return sums / float(size * size)


def load_matched_districts(boundary_file):
    """Load 28 DES+IMD districts and attach long-run rice area and area size."""
    des = pd.read_csv(DES_FILE)
    imd = pd.read_csv(IMD_FILE)

    for name, df in [("DES", des), ("IMD", imd)]:
        if "district" not in df.columns:
            raise ValueError(f"{name} missing district column: {list(df.columns)}")

    if "area_ha" not in des.columns:
        raise ValueError(
            "DES is missing area_ha. Variable sampling allocation requires "
            "the district rice area column."
        )

    des["district_key"] = des["district"].map(norm_name)
    imd["district_key"] = imd["district"].map(norm_name)

    des_names = {
        key: str(group["district"].iloc[0]).strip()
        for key, group in des.groupby("district_key")
    }
    keys = sorted(set(des["district_key"]) & set(imd["district_key"]))

    if len(keys) != 28:
        print(f"WARNING: DES/IMD overlap is {len(keys)}, expected 28.")

    # Long-run mean rice area is used only to create the spatial sampling plan.
    area_series = pd.to_numeric(des["area_ha"], errors="coerce")
    if area_series.isna().all():
        raise ValueError("DES area_ha contains no usable numeric values.")
    des["area_ha_numeric"] = area_series
    mean_rice_area = (
        des.groupby("district_key")["area_ha_numeric"]
        .mean()
        .rename("mean_rice_area_ha")
    )

    districts = gpd.read_file(boundary_file)

    if "name" not in districts.columns:
        raise ValueError(
            f"Boundary file has no 'name' field. Fields: {list(districts.columns)}"
        )
    if districts.crs is None:
        raise ValueError("District GeoJSON has no CRS.")

    districts = districts[
        districts.geometry.geom_type.isin(["Polygon", "MultiPolygon"])
    ].copy()

    try:
        districts["geometry"] = districts.geometry.make_valid()
    except AttributeError:
        districts["geometry"] = districts.geometry.buffer(0)

    districts["district_key"] = districts["name"].map(norm_name)
    districts = districts[districts["district_key"].isin(keys)].copy()

    # Merge multipart features for the same district.
    districts = districts.dissolve(by="district_key", as_index=False)
    districts["district"] = districts["district_key"].map(des_names)
    districts["mean_rice_area_ha"] = districts["district_key"].map(mean_rice_area)

    if districts["mean_rice_area_ha"].isna().any():
        missing = districts.loc[
            districts["mean_rice_area_ha"].isna(), "district"
        ].tolist()
        raise ValueError(f"Missing DES rice area for districts: {missing}")

    # Equal-area projection for district size; this is allocation metadata only.
    area_gdf = districts.to_crs("EPSG:6933")
    districts["district_area_km2"] = area_gdf.geometry.area / 1_000_000.0

    return districts.sort_values("district").reset_index(drop=True)


def make_sampling_plan(districts):
    """Allocate 2–7 locations using 75% rice area + 25% district size."""
    plan = districts[[
        "district_key",
        "district",
        "mean_rice_area_ha",
        "district_area_km2",
    ]].copy()

    # Log scaling prevents very large rice districts from consuming almost all
    # sample slots while still preserving the intended ranking.
    rice_ref = float(plan["mean_rice_area_ha"].median())
    size_ref = float(plan["district_area_km2"].median())
    rice_ref = max(rice_ref, 1.0)
    size_ref = max(size_ref, 1.0)

    rice_score = np.log1p(plan["mean_rice_area_ha"] / rice_ref)
    size_score = np.log1p(plan["district_area_km2"] / size_ref)
    combined = RICE_AREA_WEIGHT * rice_score + DISTRICT_AREA_WEIGHT * size_score

    # Normalize to 0–1 across the matched districts.
    cmin = float(combined.min())
    cmax = float(combined.max())
    if cmax > cmin:
        normalized = (combined - cmin) / (cmax - cmin)
    else:
        normalized = pd.Series(0.5, index=plan.index)

    plan["allocation_score"] = normalized.astype(float)
    raw = MIN_SAMPLES_PER_DISTRICT + normalized * (
        MAX_SAMPLES_PER_DISTRICT - MIN_SAMPLES_PER_DISTRICT
    )
    plan["target_locations"] = np.floor(raw + 0.5).astype(int)
    plan["target_locations"] = plan["target_locations"].clip(
        MIN_SAMPLES_PER_DISTRICT, MAX_SAMPLES_PER_DISTRICT
    )

    total = int(plan["target_locations"].sum())
    plan["rice_area_share_pct"] = (
        plan["mean_rice_area_ha"] / plan["mean_rice_area_ha"].sum() * 100.0
    )
    plan["allocation_basis"] = (
        f"{RICE_AREA_WEIGHT:.0%} log(mean DES rice area) + "
        f"{DISTRICT_AREA_WEIGHT:.0%} log(district area); "
        f"{MIN_SAMPLES_PER_DISTRICT}-{MAX_SAMPLES_PER_DISTRICT} locations"
    )

    return plan.sort_values(
        ["target_locations", "mean_rice_area_ha"], ascending=[False, False]
    ).reset_index(drop=True), total


def effective_screen_resolution(src, geom):
    """Choose a practical screen resolution while keeping RAM bounded."""
    minx, miny, maxx, maxy = geom.bounds
    lon_width = maxx - minx
    lat_height = maxy - miny
    lat = float(geom.centroid.y)
    mx_per_deg_lon = 111320.0 * max(math.cos(math.radians(lat)), 0.2)
    mx_per_deg_lat = 110540.0

    width_m = lon_width * mx_per_deg_lon
    height_m = lat_height * mx_per_deg_lat
    screen_m = float(SCREEN_PIXEL_M)

    out_w = max(1, math.ceil(width_m / screen_m))
    out_h = max(1, math.ceil(height_m / screen_m))
    largest = max(out_w, out_h)

    if largest > MAX_SCREEN_DIM:
        factor = largest / MAX_SCREEN_DIM
        screen_m *= factor
        out_w = max(1, math.ceil(width_m / screen_m))
        out_h = max(1, math.ceil(height_m / screen_m))

    return screen_m, out_w, out_h


def make_candidate_screen(src, geom):
    """Screen a district using area-averaged 0/1 raster values."""
    minx, miny, maxx, maxy = geom.bounds
    screen_m, out_w, out_h = effective_screen_resolution(src, geom)
    window = from_bounds(minx, miny, maxx, maxy, transform=src.transform)

    arr = src.read(
        1,
        window=window,
        out_shape=(out_h, out_w),
        resampling=rasterio.enums.Resampling.average,
    ).astype(np.float32)

    base_transform = rasterio.windows.transform(window, src.transform)
    sx = window.width / out_w
    sy = window.height / out_h
    from affine import Affine
    screen_transform = base_transform * Affine.scale(sx, sy)

    inside = geometry_mask(
        [geom],
        out_shape=(out_h, out_w),
        transform=screen_transform,
        invert=True,
        all_touched=False,
    )

    rice_cells = np.where(inside, np.clip(arr, 0.0, 1.0), 0.0)
    inside_f = inside.astype(np.float32)
    coarse_window_px = max(1, int(round(COARSE_WINDOW_M / screen_m)))

    if out_h < coarse_window_px or out_w < coarse_window_px:
        return []

    # Sliding mean of cells across the 640 m footprint.
    rice_fraction = sliding_mean(rice_cells, coarse_window_px)
    inside_fraction = sliding_mean(inside_f, coarse_window_px)
    good = inside_fraction >= 0.90

    rr, cc = np.where(good)
    candidates = []
    for r, c in zip(rr, cc):
        if (r % CANDIDATE_STRIDE) or (c % CANDIDATE_STRIDE):
            continue

        cr = r + coarse_window_px / 2.0
        cc2 = c + coarse_window_px / 2.0
        x, y = screen_transform * (cc2, cr)
        pt = Point(float(x), float(y))

        if not geom.covers(pt):
            continue

        candidates.append({
            "longitude": float(x),
            "latitude": float(y),
            "screen_rice_fraction": float(rice_fraction[r, c]),
            "screen_pixel_m": float(screen_m),
        })

    candidates.sort(
        key=lambda d: (-d["screen_rice_fraction"], d["latitude"], d["longitude"])
    )
    return candidates


def exact_native_fraction(src, lon, lat, geom):
    """Validate the 640 m patch at native 10 m and recenter if needed."""
    try:
        row, col = src.index(lon, lat)
    except Exception:
        return None

    def inspect_patch(center_row, center_col):
        half = FINAL_WINDOW_PX // 2
        r0 = int(center_row - half)
        c0 = int(center_col - half)

        if r0 < 0 or c0 < 0:
            return None
        if r0 + FINAL_WINDOW_PX > src.height or c0 + FINAL_WINDOW_PX > src.width:
            return None

        win = rasterio.windows.Window(c0, r0, FINAL_WINDOW_PX, FINAL_WINDOW_PX)
        try:
            arr = src.read(1, window=win)
        except Exception:
            return None

        if arr.shape != (FINAL_WINDOW_PX, FINAL_WINDOW_PX):
            return None

        patch_transform = src.window_transform(win)
        inside = geometry_mask(
            [geom],
            out_shape=arr.shape,
            transform=patch_transform,
            invert=True,
            all_touched=False,
        )
        district_coverage = float(np.mean(inside))
        if district_coverage < MIN_FINAL_DISTRICT_COVERAGE or not np.any(inside):
            return None

        rice_fraction = float(np.mean((arr == 1)[inside]))
        if rice_fraction <= 0.0:
            return None

        return rice_fraction, district_coverage, arr

    result = inspect_patch(row, col)
    if result is not None and result[2][FINAL_WINDOW_PX // 2, FINAL_WINDOW_PX // 2] == 1:
        return result[0], result[1], row, col

    # Recenter on a nearby actual rice pixel when the coarse centre misses it.
    search_half = 48
    sr0 = max(0, int(row - search_half))
    sc0 = max(0, int(col - search_half))
    sh = min(src.height - sr0, search_half * 2)
    sw = min(src.width - sc0, search_half * 2)
    if sh <= 0 or sw <= 0:
        return None

    try:
        search_arr = src.read(1, window=rasterio.windows.Window(sc0, sr0, sw, sh))
    except Exception:
        return None

    rice_pixels = np.argwhere(search_arr == 1)
    if rice_pixels.size == 0:
        return None

    global_r = rice_pixels[:, 0] + sr0
    global_c = rice_pixels[:, 1] + sc0
    dist2 = (global_r - row) ** 2 + (global_c - col) ** 2
    order = np.argsort(dist2)

    for idx in order[:100]:
        rr = int(global_r[idx])
        cc = int(global_c[idx])
        result = inspect_patch(rr, cc)
        if result is None:
            continue
        return result[0], result[1], rr, cc

    return None


def validate_candidates(src, geom, candidates):
    validated = []
    for cand in candidates[:MAX_NATIVE_CHECKS]:
        result = exact_native_fraction(
            src, cand["longitude"], cand["latitude"], geom
        )
        if result is None:
            continue

        rice_fraction, district_coverage, center_row, center_col = result
        item = dict(cand)
        lon, lat = src.transform * (center_col + 0.5, center_row + 0.5)
        item.update({
            "longitude": float(lon),
            "latitude": float(lat),
            "rice_fraction": rice_fraction,
            "district_coverage": district_coverage,
        })
        validated.append(item)

    validated.sort(
        key=lambda d: (-d["rice_fraction"], d["latitude"], d["longitude"])
    )
    return validated


def choose_separated(candidates, target, separation_km, min_fraction):
    pool = [c for c in candidates if c["rice_fraction"] >= min_fraction]
    chosen = []
    for cand in pool:
        if all(
            haversine_km(
                cand["latitude"], cand["longitude"],
                other["latitude"], other["longitude"],
            ) >= separation_km
            for other in chosen
        ):
            chosen.append(cand)
        if len(chosen) >= target:
            break
    return chosen


def select_locations(validated, target):
    """Use the strongest threshold and separation that can meet the target."""
    if not validated or target <= 0:
        return [], None, None

    for threshold in QUALITY_THRESHOLDS:
        eligible = [c for c in validated if c["rice_fraction"] >= threshold]
        if not eligible:
            continue
        for sep in SEPARATION_LEVELS_KM:
            chosen = choose_separated(eligible, target, sep, threshold)
            if len(chosen) >= target:
                return chosen, threshold, sep

    # If fewer than target exist, take the best available while retaining a
    # meaningful separation where possible.
    for sep in SEPARATION_LEVELS_KM:
        chosen = choose_separated(validated, target, sep, 0.0)
        if chosen:
            return chosen[:target], None, sep

    return [], None, None


def quality_label(frac):
    if frac >= 0.80:
        return "excellent_80pct_plus"
    if frac >= 0.60:
        return "high_60_79pct"
    if frac >= 0.40:
        return "good_40_59pct"
    if frac >= 0.25:
        return "moderate_25_39pct"
    if frac >= 0.10:
        return "low_10_24pct"
    if frac >= 0.05:
        return "very_low_5_9pct"
    return "minimal_1_4pct"


# ============================================================
# MAIN
# ============================================================

def main():
    for p in [RICE_TIF, DES_FILE, IMD_FILE]:
        if not p.exists():
            raise FileNotFoundError(f"Missing file: {p}")

    boundary_file = find_boundary_file()
    districts = load_matched_districts(boundary_file)
    plan, total_target = make_sampling_plan(districts)

    # Map plan fields back to district rows for deterministic lookup.
    plan_lookup = plan.set_index("district_key").to_dict("index")

    print("=" * 78)
    print("Maharashtra Rice Sampling Location Generator — VARIABLE ALLOCATION")
    print("=" * 78)
    print(f"Rice map : {RICE_TIF}")
    print(f"Boundary : {boundary_file}")
    print(f"DES      : {DES_FILE}")
    print(f"IMD      : {IMD_FILE}")
    print(f"Matched DES + IMD districts: {len(districts)}")
    print()
    print("Allocation rule:")
    print(f"  {RICE_AREA_WEIGHT:.0%} long-run mean DES rice area")
    print(f"  {DISTRICT_AREA_WEIGHT:.0%} district geographic area")
    print(f"  {MIN_SAMPLES_PER_DISTRICT}–{MAX_SAMPLES_PER_DISTRICT} locations/district")
    print(f"  Planned total: {total_target} locations")
    print()

    print("Planned locations by district:")
    print(
        plan[["district", "mean_rice_area_ha", "district_area_km2", "allocation_score", "target_locations"]]
        .sort_values("district")
        .to_string(index=False, formatters={
            "mean_rice_area_ha": "{:,.1f}".format,
            "district_area_km2": "{:,.1f}".format,
            "allocation_score": "{:.3f}".format,
        })
    )
    print()

    results = []
    diagnostics = []

    with rasterio.open(RICE_TIF) as src:
        print(f"Raster CRS  : {src.crs}")
        print(f"Raster size : {src.width} x {src.height}")
        print(f"Raster res  : {src.res}")
        print(f"Raster dtype: {src.dtypes[0]}")
        print(f"Raster nodata: {src.nodata}")
        print()

        if src.crs is None:
            raise ValueError("Rice raster has no CRS.")

        if districts.crs != src.crs:
            print(f"Reprojecting district boundaries from {districts.crs} to {src.crs}")
            districts = districts.to_crs(src.crs)
            print()

        for i, row in enumerate(districts.itertuples(index=False), start=1):
            district = row.district
            key = row.district_key
            geom = row.geometry
            info = plan_lookup[key]
            target = int(info["target_locations"])

            print(f"[{i:02d}/{len(districts):02d}] {district} | target={target} ...", flush=True)

            try:
                candidates = make_candidate_screen(src, geom)
                positive = [c for c in candidates if c["screen_rice_fraction"] > 0]
                max_screen = max((c["screen_rice_fraction"] for c in candidates), default=0.0)
                print(f"    coarse windows           : {len(candidates)}")
                print(f"    coarse windows with rice : {len(positive)}")
                print(f"    best coarse fraction     : {max_screen:.3f}")

                validated = validate_candidates(src, geom, positive)
                max_exact = max((c["rice_fraction"] for c in validated), default=0.0)
                print(f"    exact valid rice centres : {len(validated)}")
                print(f"    best exact fraction      : {max_exact:.3f}")

                chosen, threshold, separation = select_locations(validated, target)
                print(f"    selected                 : {len(chosen)}")
                if threshold is not None:
                    print(f"    quality tier             : >= {threshold:.0%}")
                else:
                    print("    quality tier             : adaptive fallback")
                if separation is not None:
                    print(f"    separation               : {separation:g} km")

                for x in chosen:
                    results.append({
                        "district": district,
                        "longitude": x["longitude"],
                        "latitude": x["latitude"],
                        "target_locations_for_district": target,
                        "mean_rice_area_ha": info["mean_rice_area_ha"],
                        "district_area_km2": info["district_area_km2"],
                        "allocation_score": info["allocation_score"],
                        "rice_area_share_pct": info["rice_area_share_pct"],
                        "rice_fraction": x["rice_fraction"],
                        "screen_rice_fraction": x["screen_rice_fraction"],
                        "district_coverage": x["district_coverage"],
                        "quality": quality_label(x["rice_fraction"]),
                        "screen_pixel_m": x["screen_pixel_m"],
                    })

                diagnostics.append({
                    "district": district,
                    "target_locations": target,
                    "selected_locations": len(chosen),
                    "mean_rice_area_ha": info["mean_rice_area_ha"],
                    "district_area_km2": info["district_area_km2"],
                    "allocation_score": info["allocation_score"],
                    "rice_area_share_pct": info["rice_area_share_pct"],
                    "coarse_windows": len(candidates),
                    "coarse_windows_with_rice": len(positive),
                    "best_coarse_rice_fraction": max_screen,
                    "exact_valid_rice_centres": len(validated),
                    "best_exact_rice_fraction": max_exact,
                    "quality_threshold_used": threshold,
                    "separation_km_used": separation,
                    "status": (
                        "target_met" if len(chosen) == target
                        else "partial" if chosen
                        else "no_valid_rice_centre"
                    ),
                })

            except Exception as exc:
                print(f"    ERROR: {type(exc).__name__}: {exc}")
                diagnostics.append({
                    "district": district,
                    "target_locations": target,
                    "selected_locations": 0,
                    "mean_rice_area_ha": info["mean_rice_area_ha"],
                    "district_area_km2": info["district_area_km2"],
                    "allocation_score": info["allocation_score"],
                    "rice_area_share_pct": info["rice_area_share_pct"],
                    "coarse_windows": np.nan,
                    "coarse_windows_with_rice": np.nan,
                    "best_coarse_rice_fraction": np.nan,
                    "exact_valid_rice_centres": np.nan,
                    "best_exact_rice_fraction": np.nan,
                    "quality_threshold_used": np.nan,
                    "separation_km_used": np.nan,
                    "status": f"ERROR_{type(exc).__name__}",
                })

    if not results:
        pd.DataFrame(diagnostics).to_csv(DIAGNOSTIC_CSV, index=False)
        plan.to_csv(PLAN_CSV, index=False)
        raise RuntimeError(
            "No sampling locations were generated. Diagnostics and sampling "
            f"plan were saved to:\n{DIAGNOSTIC_CSV}\n{PLAN_CSV}"
        )

    out = pd.DataFrame(results)
    out = out.sort_values(
        ["district", "rice_fraction", "latitude"],
        ascending=[True, False, True],
    ).reset_index(drop=True)
    out.insert(0, "location_id", [f"MH_{i:03d}" for i in range(1, len(out) + 1)])

    out["mask_source"] = "India rice distribution map"
    out["mask_year"] = 2020
    out["mask_season"] = "Winter"
    out["mask_class"] = 1
    out["mask_resolution_m"] = 10
    out["sentinel_patch"] = "32x32 @ 20m"
    out["patch_footprint_m"] = FINAL_FOOTPRINT_M
    out["selection_rule"] = (
        "variable district allocation; rice-mask-guided adaptive patch quality"
    )

    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(OUTPUT_CSV, index=False)
    pd.DataFrame(diagnostics).to_csv(DIAGNOSTIC_CSV, index=False)
    plan.to_csv(PLAN_CSV, index=False)

    counts = out.groupby("district").size().sort_values()

    print()
    print("=" * 78)
    print(f"SELECTED LOCATIONS: {len(out)}")
    print(f"PLANNED LOCATIONS : {total_target}")
    print("=" * 78)
    print()
    print("Actual locations by district:")
    print(counts.to_string())
    print()
    print(f"Saved locations  : {OUTPUT_CSV}")
    print(f"Saved diagnostics: {DIAGNOSTIC_CSV}")
    print(f"Saved plan       : {PLAN_CSV}")
    print()

    diag = pd.DataFrame(diagnostics)
    partial = diag[diag["selected_locations"] < diag["target_locations"]]
    if len(partial):
        print("Districts below their allocated target (no artificial points added):")
        print(
            partial[["district", "target_locations", "selected_locations", "best_exact_rice_fraction", "status"]]
            .to_string(index=False)
        )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"\nFAILED: {type(exc).__name__}: {exc}", file=sys.stderr)
        sys.exit(1)
