#!/usr/bin/env python3
"""
=============================================================================
Step 2: Combine Wide Regional GEE Satellite Terrain with High-Res Maharashtra GeoTIFF
=============================================================================
Blends:
1. Inner High-Res Core (data/maharashtra_satellite_terrain_sentinel2_dem.tif, ~540MB)
   - 10m Sentinel-2 optical bands + Copernicus DEM hillshade covering Maharashtra
2. Outer Wide Regional Buffer (Google Earth Engine 250m export: Lon [62.0, 92.0], Lat [8.0, 30.0])
   - Full Arabian Sea ocean floor, Gujarat, MP, Karnataka, Goa, Telangana, Bay of Bengal
3. Output: Lightweight master WebP (quality 92, ~2-3 MB) and optimized PNG.
=============================================================================
"""

import os
import sys
import json
import argparse
import numpy as np
from PIL import Image, ImageFilter
import cv2
import rasterio
from rasterio.enums import Resampling

# Massive Bounding Box (Matches Step 1 GEE Script)
LON_MIN, LON_MAX = 62.0, 92.0
LAT_MIN, LAT_MAX = 8.0, 30.0

CANVAS_W = 3840  # 4K wide for pin-sharp display across all zoom levels
CANVAS_H = int(CANVAS_W * ((LAT_MAX - LAT_MIN) / (LON_MAX - LON_MIN)) * 1.057) # ~2970

def combine_layers(wide_surround_tif_path: str, output_webp: str, output_png: str):
    print(f"=== Combining Wide Regional Satellite Terrain with Maharashtra Core ===")
    print(f"Target Canvas: {CANVAS_W} x {CANVAS_H} (Lon [{LON_MIN}, {LON_MAX}], Lat [{LAT_MIN}, {LAT_MAX}])")
    
    # 1. Load Wide Regional Surround from Earth Engine
    print(f"Loading GEE Wide Surround: {wide_surround_tif_path}...")
    with rasterio.open(wide_surround_tif_path) as src_wide:
        # Read and resample to canvas dimensions
        wide_arr = src_wide.read(
            out_shape=(3, CANVAS_H, CANVAS_W),
            resampling=Resampling.bilinear
        )
        wide_composite = np.transpose(wide_arr, (1, 2, 0)).astype(np.float32)
        
    print(f"Wide regional composite resampled to canvas shape: {wide_composite.shape}")
    
    # Post-export fill: seamlessly heal any unrendered / black ocean pixels (e.g. southwest open-sea notch)
    ocean_missing = np.all(wide_composite <= 1.0, axis=2) | np.isnan(np.mean(wide_composite, axis=2))
    if np.any(ocean_missing):
        missing_count = int(np.sum(ocean_missing))
        # Sample neighboring deep ocean water
        ocean_sample = np.median(wide_composite[2200:2600, 400:800], axis=(0, 1))
        print(f"Healing {missing_count} unrendered ocean pixels with matching marine tone {ocean_sample}...")
        wide_composite[ocean_missing] = ocean_sample
    
    # 2. Load Maharashtra High-Resolution Core (~540MB GeoTIFF)
    mh_tif_path = 'data/maharashtra_satellite_terrain_sentinel2_dem.tif'
    print(f"Loading High-Resolution Maharashtra GeoTIFF: {mh_tif_path}...")
    
    cols, rows = np.meshgrid(np.arange(CANVAS_W), np.arange(CANVAS_H))
    lon_grid = LON_MIN + (cols / CANVAS_W) * (LON_MAX - LON_MIN)
    lat_grid = LAT_MAX - (rows / CANVAS_H) * (LAT_MAX - LAT_MIN)
    
    with rasterio.open(mh_tif_path) as src_mh:
        mh_bounds = src_mh.bounds
        mh_w, mh_h = src_mh.width, src_mh.height
        print(f"Maharashtra Core bounds: {mh_bounds}")
        
        # Intermediate downsample for memory-efficient bilinear interpolation
        inter_w = 4000
        inter_h = int(mh_h * (inter_w / mh_w))
        mh_inter = src_mh.read(out_shape=(3, inter_h, inter_w), resampling=Resampling.bilinear)
        mh_inter = np.transpose(mh_inter, (1, 2, 0)).astype(np.float32)
        
        # Calculate pixel coordinates on canvas
        gt_cols = ((lon_grid - mh_bounds.left) / (mh_bounds.right - mh_bounds.left) * inter_w).astype(np.float32)
        gt_rows = ((mh_bounds.top - lat_grid) / (mh_bounds.top - mh_bounds.bottom) * inter_h).astype(np.float32)
        
        mh_resampled = cv2.remap(
            mh_inter,
            gt_cols,
            gt_rows,
            interpolation=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=(0, 0, 0)
        )
        
    # 3. Create Maharashtra Raster Mask for Feathered Blending
    geojson_path = 'CNN_LSTM_Training/SatteliteImagery/Maharashtra.Districts.geojson'
    with open(geojson_path, 'r', encoding='utf-8') as f:
        gj = json.load(f)
        
    mask_mh = np.zeros((CANVAS_H, CANVAS_W), dtype=np.uint8)
    for feat in gj['features']:
        geom = feat.get('geometry') or {}
        coords = geom.get('coordinates') or []
        gtype = geom.get('type')
        if gtype == 'Polygon':
            rings = coords
        elif gtype == 'MultiPolygon':
            rings = [ring for poly in coords for ring in poly]
        else:
            rings = []
        for ring in rings:
            pts = np.array(ring)
            c_x = ((pts[:, 0] - LON_MIN) / (LON_MAX - LON_MIN) * CANVAS_W).astype(np.int32)
            c_y = ((LAT_MAX - pts[:, 1]) / (LAT_MAX - LAT_MIN) * CANVAS_H).astype(np.int32)
            poly_pts = np.column_stack([c_x, c_y])
            cv2.fillPoly(mask_mh, [poly_pts], 255)
            
    # 4. Soft Feathered Alpha Blending
    mh_valid = np.mean(mh_resampled, axis=2) > 12.0
    alpha = np.zeros((CANVAS_H, CANVAS_W), dtype=np.float32)
    alpha[(mask_mh == 255) & mh_valid] = 1.0
    
    # Feather boundary with Gaussian blur (radius=20)
    alpha_img = Image.fromarray((alpha * 255).astype(np.uint8))
    alpha_blurred = np.array(alpha_img.filter(ImageFilter.GaussianBlur(radius=20))).astype(np.float32) / 255.0
    alpha_3d = np.expand_dims(alpha_blurred, axis=2)
    
    # Color harmony balancing
    mean_sur = np.mean(wide_composite[mask_mh == 255], axis=0)
    mean_mh = np.mean(mh_resampled[(mask_mh == 255) & mh_valid], axis=0)
    color_ratio = np.clip(mean_sur / np.maximum(mean_mh, 1.0), 0.85, 1.18)
    mh_balanced = mh_resampled * color_ratio
    
    # Composite:
    final_composite = mh_balanced * alpha_3d + wide_composite * (1.0 - alpha_3d)
    final_uint8 = np.clip(final_composite, 0, 255).astype(np.uint8)
    final_img = Image.fromarray(final_uint8)
    
    # 5. Save Outputs
    os.makedirs(os.path.dirname(output_webp), exist_ok=True)
    print(f"Saving WebP: {output_webp}...")
    final_img.save(output_webp, format='WEBP', quality=92, method=6)
    print(f"WebP size: {os.path.getsize(output_webp)/(1024*1024):.2f} MB")
    
    print(f"Saving PNG: {output_png}...")
    final_img.save(output_png, format='PNG', optimize=True)
    print(f"PNG size: {os.path.getsize(output_png)/(1024*1024):.2f} MB")
    
    # 6. SVG Attributes
    scale_lon = (854.60 - 5.40) / (80.897784 - 72.652611)
    scale_lat = (706.80 - 7.60) / (22.030269 - 15.606360)
    svg_x0 = 5.40 - (72.652611 - LON_MIN) * scale_lon
    svg_x1 = 854.60 + (LON_MAX - 80.897784) * scale_lon
    svg_y0 = 7.60 - (LAT_MAX - 22.030269) * scale_lat
    svg_y1 = 706.80 + (15.606360 - LAT_MIN) * scale_lat
    
    print("\n=== STEP 3: SVG <image> ATTRIBUTES FOR DISTRICTCHOROPLETH.TSX ===")
    print(f'x="{svg_x0:.1f}"')
    print(f'y="{svg_y0:.1f}"')
    print(f'width="{svg_x1 - svg_x0:.1f}"')
    print(f'height="{svg_y1 - svg_y0:.1f}"')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Combine Wide GEE Surround with Maharashtra Core")
    parser.add_argument('--input-wide', '-i', type=str, required=True, help="Path to exported GEE GeoTIFF")
    parser.add_argument('--output-webp', '-w', type=str, default='public/images/maharashtra_satellite_terrain_sentinel2_dem.webp')
    parser.add_argument('--output-png', '-p', type=str, default='public/images/maharashtra_satellite_terrain_sentinel2_dem.png')
    args = parser.parse_args()
    combine_layers(args.input_wide, args.output_webp, args.output_png)
