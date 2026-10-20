import numpy as np
import rasterio
from rasterio.enums import Resampling
from PIL import Image, ImageFilter
import cv2
import json

print("=== Building Dual-Resolution Master Satellite Terrain ===")

# 1. Target canvas dimensions (2560 x 1978 for crystal-clear high-DPI display)
canvas_w = 2560
canvas_h = 1978

# Coordinate bounds matching SVG ViewBox:
# x="-164.8", y="-98.0", width="1133.0", height="925.2"
# Georeferenced: Lon [71.0, 82.0], Lat [14.5, 23.0]
lon_min, lon_max = 71.0, 82.0
lat_min, lat_max = 14.5, 23.0

cols, rows = np.meshgrid(np.arange(canvas_w), np.arange(canvas_h))
lon_grid = lon_min + (cols / canvas_w) * (lon_max - lon_min)
lat_grid = lat_max - (rows / canvas_h) * (lat_max - lat_min)

# 2. Read High-Quality Sentinel-2 + Copernicus DEM (60m resolution)
tif_path = 'data/maharashtra_satellite_terrain_sentinel2_dem.tif'
print(f"Reading High-Res GeoTIFF: {tif_path}...")
with rasterio.open(tif_path) as src:
    tif_data = src.read(
        out_shape=(3, canvas_h, canvas_w),
        resampling=Resampling.bilinear
    )

tif_arr = np.transpose(tif_data, (1, 2, 0)).astype(np.float32)

# Determine valid Sentinel-2 + DEM pixels vs nodata / black holes:
# Pixels with reflectance/brightness > 12 are valid high-res data
tif_brightness = np.mean(tif_arr, axis=2)
# Any pixel where all 3 channels are <= 10 is missing / nodata
is_valid_high_res = tif_brightness > 10.0

# 3. Read Regional Outside Terrain
# Provides gapless coverage for the Arabian Sea, Konkan coast, and outer buffer
prev_img = Image.open('public/images/western_india_satellite_terrain.png').convert('RGB')
prev_arr = np.array(prev_img)

# Project regional imagery onto canvas grid:
svg_x = -164.8 + (cols / canvas_w) * 1133.0
svg_y = -98.0 + (rows / canvas_h) * 925.2

prev_cols = ((svg_x - (-485.5)) / 2025.7 * 1672).astype(np.float32)
prev_rows = ((svg_y - (-225.9)) / 1140.4 * 941).astype(np.float32)

regional_resampled = cv2.remap(
    prev_arr,
    prev_cols,
    prev_rows,
    interpolation=cv2.INTER_LINEAR,
    borderMode=cv2.BORDER_REFLECT
).astype(np.float32)

# 4. Load Maharashtra State Boundary to create precision interior mask
with open('CNN_LSTM_Training/SatteliteImagery/Maharashtra.Districts.geojson', 'r', encoding='utf-8') as f:
    gj = json.load(f)

# Create binary raster mask of Maharashtra polygon
mask_mh = np.zeros((canvas_h, canvas_w), dtype=np.uint8)

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
        # convert (lon, lat) to (canvas_col, canvas_row)
        c_x = ((pts[:, 0] - lon_min) / (lon_max - lon_min) * canvas_w).astype(np.int32)
        c_y = ((lat_max - pts[:, 1]) / (lat_max - lat_min) * canvas_h).astype(np.int32)
        poly_pts = np.column_stack([c_x, c_y])
        cv2.fillPoly(mask_mh, [poly_pts], 255)

print("Constructed Maharashtra state polygon raster mask.")

# 5. Dual-Resolution Alpha Blending:
# Priority 1: Inside Maharashtra state, use High-Res GeoTIFF where valid.
# Priority 2: In missing coastal swaths (e.g. Mumbai/Konkan coastal strip), seamlessly use the coastal regional imagery.
# Priority 3: Outside Maharashtra state, use regional surrounding terrain.
# Priority 1: Inside Maharashtra state, use High-Res GeoTIFF where valid.
# Priority 2: In missing coastal swaths (e.g. Mumbai/Konkan coastal strip), seamlessly use the coastal regional imagery.
# Priority 3: Outside Maharashtra state, use regional surrounding terrain.
alpha_high_res = np.zeros((canvas_h, canvas_w), dtype=np.float32)

# Color match tif_arr to regional_resampled so there is zero brightness/hue jump
mean_reg = np.mean(regional_resampled[(mask_mh == 255)], axis=0)
mean_tif = np.mean(tif_arr[(mask_mh == 255) & is_valid_high_res], axis=0)
scale_color = mean_reg / np.maximum(mean_tif, 1.0)
tif_color_matched = tif_arr * np.clip(scale_color, 0.85, 1.25)

# High-res inside Maharashtra
alpha_high_res[(mask_mh == 255) & is_valid_high_res] = 1.0

# Cross-fade smoothly across the western tile seam (around col 460 to 520)
col_73 = int((73.05 - lon_min) / (lon_max - lon_min) * canvas_w)
fade_west = np.clip((cols - (col_73 - 20)) / 60.0, 0.0, 1.0)
alpha_high_res = alpha_high_res * fade_west

# Smooth the alpha mask with Gaussian Blur (radius = 16px) for invisible transitions
alpha_img = Image.fromarray((alpha_high_res * 255).astype(np.uint8))
alpha_blurred = np.array(alpha_img.filter(ImageFilter.GaussianBlur(radius=16))).astype(np.float32) / 255.0
alpha_3d = np.expand_dims(alpha_blurred, axis=2)

# Seamless blend:
master_terrain = tif_color_matched * alpha_3d + regional_resampled * (1.0 - alpha_3d)

# 6. Deep Teal Ocean Styling:
# Ensure open Arabian Sea (west of 72.5°E) matches the dashboard theme (#071E26 to #092832)
is_deep_sea = (lon_grid < 72.6) & (np.mean(master_terrain, axis=2) < 45)
master_terrain[is_deep_sea, 0] = 7.0
master_terrain[is_deep_sea, 1] = 30.0
master_terrain[is_deep_sea, 2] = 42.0

final_uint8 = np.clip(master_terrain, 0, 255).astype(np.uint8)
final_img = Image.fromarray(final_uint8)

# 7. Save Web Assets
out_png = 'public/images/maharashtra_satellite_terrain_sentinel2_dem.png'
out_webp = 'public/images/maharashtra_satellite_terrain_sentinel2_dem.webp'

print(f"Saving high-efficiency WebP: {out_webp}...")
final_img.save(out_webp, format='WEBP', quality=92, method=6)
print(f"WebP file size: {Image.open(out_webp).size}, size on disk: {Image.open(out_webp).fp.seek(0, 2)} bytes")

print(f"Saving PNG fallback: {out_png}...")
final_img.save(out_png, format='PNG', optimize=True)

print("=== Dual-Resolution Composite Complete! ===")
