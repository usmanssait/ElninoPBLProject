"""
Google Earth Engine (GEE) Python Automated Extraction Script
Project: Spatiotemporal CNN-LSTM Framework for Kharif Rice Crop Failure Early Warning
State: Maharashtra, India
Dataset: COPERNICUS/S2_SR_HARMONIZED
Cropland Mask: ESA WorldCover 10m v100 Class 40 (General Cropland)
Patch Size: 32x32 pixels at 10m GSD (320m x 320m parcel)
Output Tensor per District-Year: [T=6, H=32, W=32, C=8]

Usage:
  pip install earthengine-api geemap
  python scripts/extract_sentinel2_cropland.py --year 2015 --output_dir ./data/sentinel2_patches
"""

import argparse
import os
import ee

DISTRICTS = [
    {"id": "bhandara", "name": "Bhandara", "lon": 79.65, "lat": 21.17},
    {"id": "gondia", "name": "Gondia", "lon": 80.20, "lat": 21.46},
    {"id": "chandrapur", "name": "Chandrapur", "lon": 79.30, "lat": 19.95},
    {"id": "gadchiroli", "name": "Gadchiroli", "lon": 80.00, "lat": 20.18},
    {"id": "nagpur", "name": "Nagpur", "lon": 79.08, "lat": 21.15},
    {"id": "wardha", "name": "Wardha", "lon": 78.60, "lat": 20.74},
    {"id": "thane", "name": "Thane", "lon": 72.98, "lat": 19.22},
    {"id": "palghar", "name": "Palghar", "lon": 72.77, "lat": 19.70},
    {"id": "raigad", "name": "Raigad", "lon": 73.10, "lat": 18.52},
    {"id": "ratnagiri", "name": "Ratnagiri", "lon": 73.30, "lat": 16.99},
    {"id": "sindhudurg", "name": "Sindhudurg", "lon": 73.70, "lat": 16.12},
    {"id": "kolhapur", "name": "Kolhapur", "lon": 74.24, "lat": 16.70},
    {"id": "pune", "name": "Pune", "lon": 73.85, "lat": 18.52},
    {"id": "satara", "name": "Satara", "lon": 73.99, "lat": 17.68},
    {"id": "sangli", "name": "Sangli", "lon": 74.57, "lat": 16.85},
    {"id": "nashik", "name": "Nashik", "lon": 73.79, "lat": 20.00},
    {"id": "ahilyanagar", "name": "Ahilyanagar", "lon": 74.74, "lat": 19.10},
    {"id": "dhule", "name": "Dhule", "lon": 74.77, "lat": 20.90},
    {"id": "nandurbar", "name": "Nandurbar", "lon": 74.24, "lat": 21.37},
    {"id": "amravati", "name": "Amravati", "lon": 77.75, "lat": 20.93},
    {"id": "yavatmal", "name": "Yavatmal", "lon": 78.13, "lat": 20.40},
    {"id": "nanded", "name": "Nanded", "lon": 77.31, "lat": 19.15},
    {"id": "parbhani", "name": "Parbhani", "lon": 76.77, "lat": 19.26},
    {"id": "hingoli", "name": "Hingoli", "lon": 77.15, "lat": 19.72}
]

TIME_WINDOWS = [
    {"step": 1, "name": "T1", "start": "-06-01", "end": "-06-15"},
    {"step": 2, "name": "T2", "start": "-06-16", "end": "-06-30"},
    {"step": 3, "name": "T3", "start": "-07-01", "end": "-07-15"},
    {"step": 4, "name": "T4", "start": "-07-16", "end": "-07-31"},
    {"step": 5, "name": "T5", "start": "-08-01", "end": "-08-15"},
    {"step": 6, "name": "T6", "start": "-08-16", "end": "-08-31"},
]

def mask_s2_sr(image):
    qa = image.select('QA60')
    cloud_mask = qa.bitwiseAnd(1 << 10).eq(0).And(qa.bitwiseAnd(1 << 11).eq(0))
    scl = image.select('SCL')
    valid_land = scl.neq(3).And(scl.neq(8)).And(scl.neq(9)).And(scl.neq(10)).And(scl.neq(11))
    return image.updateMask(cloud_mask).updateMask(valid_land)

def add_indices(image):
    optical = image.select(['B2', 'B3', 'B4', 'B8', 'B11', 'B12']).divide(10000.0)
    b4 = optical.select('B4')
    b8 = optical.select('B8')
    b11 = optical.select('B11')
    ndvi = b8.subtract(b4).divide(b8.add(b4).max(0.0001)).rename('NDVI')
    ndwi = b8.subtract(b11).divide(b8.add(b11).max(0.0001)).rename('NDWI')
    return optical.addBands(ndvi).addBands(ndwi)

def main():
    parser = argparse.ArgumentParser(description="Extract Sentinel-2 cropland patches for Maharashtra Kharif rice districts")
    parser.add_argument("--year", type=int, default=2015, help="Kharif target year (e.g. 2015, 2016, 2020)")
    parser.add_argument("--output_dir", type=str, default="./data/sentinel2_patches", help="Destination folder")
    args = parser.parse_args()

    ee.Initialize()
    os.makedirs(args.output_dir, exist_ok=True)
    cropland_mask = ee.Image('ESA/WorldCover/v100/2020').select('Map').eq(40)

    print(f"[*] Starting extraction for year {args.year} across {len(DISTRICTS)} districts...")
    for dist in DISTRICTS:
        point = ee.Geometry.Point([dist["lon"], dist["lat"]])
        bbox = point.buffer(160).bounds()
        time_bands = []
        for tw in TIME_WINDOWS:
            s2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterBounds(bbox)
                  .filterDate(f"{args.year}{tw['start']}", f"{args.year}{tw['end']}")
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 60))
                  .map(mask_s2_sr))
            comp = s2.median()
            indexed = add_indices(comp).updateMask(cropland_mask)
            renamed = indexed.select(
                ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI', 'NDWI'],
                [f"{tw['name']}_{b}" for b in ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI', 'NDWI']]
            )
            time_bands.append(renamed)

        stacked = ee.Image(time_bands)
        task = ee.batch.Export.image.toDrive(
            image=stacked.clip(bbox),
            description=f"S2_{dist['name']}_{args.year}_32x32_Patch",
            folder="Maharashtra_Sentinel2_PBL",
            fileNamePrefix=f"s2_{dist['id']}_{args.year}_cropland_patch",
            region=bbox,
            scale=10,
            crs='EPSG:4326',
            maxPixels=1e8
        )
        task.start()
        print(f" -> Queued task for {dist['name']} ({dist['id']})")

    print("[+] All export tasks submitted successfully. Check https://code.earthengine.google.com/tasks")

if __name__ == "__main__":
    main()
