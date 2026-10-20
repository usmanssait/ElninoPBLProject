import numpy as np
import rasterio
from rasterio.enums import Resampling
from PIL import Image, ImageFilter
import cv2
import json
import os

print("=== Combining High-Quality Maharashtra GeoTIFF with Real Satellite Surround ===")

# Canvas Dimensions: 2560 x 1978 for high-DPI display
canvas_w = 2560
canvas_h = 1978

# The canvas covers:
# Lon: [71.0, 82.0], Lat: [14.5, 23.0]
# But the user asked: "chunk of ocean should be included"!
# Let's see: In the SVG map, can we extend the background to the west so a wider chunk of the Arabian Sea is visible?
# In DistrictChoropleth.tsx:
# The SVG viewBox is 0 0 860 713.
# The container has `overflow: hidden`, so any background image that extends west (e.g. x="-350" instead of "-164.8")
# shows a wide chunk of the deep Arabian Sea ocean on the left when panning or zooming out!
# Let's make the canvas cover:
# Lon: [68.5°E to 82.5°E] (14.0 degrees wide, with 4.5 degrees of Arabian Sea ocean!)
# Lat: [14.0°N to 23.5°N] (9.5 degrees high)

lon_min, lon_max = 68.5, 82.5
lat_min, lat_max = 14.0, 23.5

cols, rows = np.meshgrid(np.arange(canvas_w), np.arange(canvas_h))
lon_grid = lon_min + (cols / canvas_w) * (lon_max - lon_min)
lat_grid = lat_max - (rows / canvas_h) * (lat_max - lat_min)

# 1. Project Real Satellite Surround onto Canvas
surround_img = Image.open('scratch/real_satellite_surround_raw.png').convert('RGB')
surround_arr = np.array(surround_img)

# Surround bounds: Lon [67.5000, 84.3750], Lat [12.5546, 24.5271]
# Note: Surround is in Web Mercator projection.
# Let's project each (lon, lat) pixel to surround pixel coordinates:
sur_w, sur_h = surround_img.size
sur_lon0, sur_lon1 = 67.5, 84.375

def lat_to_merc_y(lat_deg):
    import math
    lat_rad = np.radians(np.clip(lat_deg, -85.0, 85.0))
    return np.degrees(np.log(np.tan(np.pi / 4 + lat_rad / 2)))

sur_my_top = lat_to_merc_y(24.5271)
sur_my_bottom = lat_to_merc_y(12.5546)

my_grid = lat_to_merc_y(lat_grid)

sur_cols = ((lon_grid - sur_lon0) / (sur_lon1 - sur_lon0) * sur_w).astype(np.float32)
sur_rows = ((sur_my_top - my_grid) / (sur_my_top - sur_my_bottom) * sur_h).astype(np.float32)

surround_resampled = cv2.remap(
    surround_arr,
    sur_cols,
    sur_rows,
    interpolation=cv2.INTER_LINEAR,
    borderMode=cv2.BORDER_REFLECT
).astype(np.float32)

print("Projected real satellite surround with Arabian Sea chunk onto canvas.")

# 2. Read High-Quality Sentinel-2 + Copernicus DEM GeoTIFF (for Maharashtra)
tif_path = 'data/maharashtra_satellite_terrain_sentinel2_dem.tif'
print(f"Reading High-Res GeoTIFF: {tif_path}...")

with rasterio.open(tif_path) as src:
    tif_bounds = src.bounds
    tif_w, tif_h = src.width, src.height
    print(f"GeoTIFF bounds: {tif_bounds}")
    
    # Map GeoTIFF into canvas:
    # GeoTIFF is in EPSG:4326:
    # left=71.0, right=82.0, bottom=14.5, top=23.0
    gt_cols = ((lon_grid - tif_bounds.left) / (tif_bounds.right - tif_bounds.left) * tif_w).astype(np.float32)
    gt_rows = ((tif_bounds.top - lat_grid) / (tif_bounds.top - tif_bounds.bottom) * tif_h).astype(np.float32)
    
    # Downsample GeoTIFF first to intermediate ~3000x2300 for fast high-quality sampling
    intermediate_w = 3200
    intermediate_h = int(tif_h * (intermediate_w / tif_w))
    tif_intermediate = src.read(out_shape=(3, intermediate_h, intermediate_w), resampling=Resampling.bilinear)
    tif_intermediate = np.transpose(tif_intermediate, (1, 2, 0)).astype(np.float32)

# Resample into canvas grid
gt_cols_norm = (gt_cols / tif_w * intermediate_w).astype(np.float32)
gt_rows_norm = (gt_rows / tif_h * intermediate_h).astype(np.float32)

tif_resampled = cv2.remap(
    tif_intermediate,
    gt_cols_norm,
    gt_rows_norm,
    interpolation=cv2.INTER_LINEAR,
    borderMode=cv2.BORDER_CONSTANT,
    borderValue=(0, 0, 0)
)

# 3. Create Maharashtra State Raster Mask
with open('CNN_LSTM_Training/SatteliteImagery/Maharashtra.Districts.geojson', 'r', encoding='utf-8') as f:
    gj = json.load(f)

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
        c_x = ((pts[:, 0] - lon_min) / (lon_max - lon_min) * canvas_w).astype(np.int32)
        c_y = ((lat_max - pts[:, 1]) / (lat_max - lat_min) * canvas_h).astype(np.int32)
        poly_pts = np.column_stack([c_x, c_y])
        cv2.fillPoly(mask_mh, [poly_pts], 255)

print("Constructed Maharashtra state raster mask.")

# 4. Seamless Dual-Layer Composition:
# Check where GeoTIFF has valid data
tif_valid = np.mean(tif_resampled, axis=2) > 12.0

# Inside Maharashtra and valid GeoTIFF:
alpha_mh = np.zeros((canvas_h, canvas_w), dtype=np.float32)
alpha_mh[(mask_mh == 255) & tif_valid] = 1.0

# Along the western tile edge (longitude 73.0 to 73.5), apply a smooth cross-fade
col_73 = (73.1 - lon_min) / (lon_max - lon_min) * canvas_w
col_73_5 = (73.5 - lon_min) / (lon_max - lon_min) * canvas_w
fade_west = np.clip((cols - col_73) / (col_73_5 - col_73), 0.0, 1.0)
alpha_mh = alpha_mh * fade_west

# Gaussian blur for soft feathered transition
alpha_img = Image.fromarray((alpha_mh * 255).astype(np.uint8))
alpha_blurred = np.array(alpha_img.filter(ImageFilter.GaussianBlur(radius=15))).astype(np.float32) / 255.0
alpha_3d = np.expand_dims(alpha_blurred, axis=2)

# Color harmony: match color tones between GeoTIFF and real satellite surround
mean_sur = np.mean(surround_resampled[mask_mh == 255], axis=0)
mean_gt = np.mean(tif_resampled[(mask_mh == 255) & tif_valid], axis=0)
color_ratio = mean_sur / np.maximum(mean_gt, 1.0)
tif_balanced = tif_resampled * np.clip(color_ratio, 0.85, 1.20)

# Composite:
final_composite = tif_balanced * alpha_3d + surround_resampled * (1.0 - alpha_3d)

# Enhance ocean richness (deep teal blue styling for ocean pixels)
ocean_mask = (lon_grid < 72.8) & (np.mean(final_composite, axis=2) < 65)
# Deepen water tone slightly for dashboard theme
final_composite[ocean_mask, 0] = final_composite[ocean_mask, 0] * 0.70
final_composite[ocean_mask, 1] = final_composite[ocean_mask, 1] * 0.85
final_composite[ocean_mask, 2] = np.clip(final_composite[ocean_mask, 2] * 0.95 + 10, 0, 255)

final_uint8 = np.clip(final_composite, 0, 255).astype(np.uint8)
final_img = Image.fromarray(final_uint8)

# 5. Save Master Earth Engine Background Assets
out_webp = 'public/images/maharashtra_satellite_terrain_sentinel2_dem.webp'
out_png = 'public/images/maharashtra_satellite_terrain_sentinel2_dem.png'

print(f"Saving {out_webp}...")
final_img.save(out_webp, format='WEBP', quality=92, method=6)
webp_bytes = os.path.getsize(out_webp)
print(f"Master WebP saved: {webp_bytes / (1024*1024):.2f} MB")

print(f"Saving {out_png}...")
final_img.save(out_png, format='PNG', optimize=True)
png_bytes = os.path.getsize(out_png)
print(f"Master PNG saved: {png_bytes / (1024*1024):.2f} MB")

# 6. Calculate EXACT SVG Placement Attributes for this wider canvas
# In SVG:
# Lon 72.652611 -> SVG X 5.40, Lon 80.897784 -> SVG X 854.60
# Lat 22.030269 -> SVG Y 7.60, Lat 15.606360 -> SVG Y 706.80
scale_lon = (854.60 - 5.40) / (80.897784 - 72.652611) # 102.9936 px/deg
scale_lat = (706.80 - 7.60) / (22.030269 - 15.606360) # 108.8434 px/deg

svg_x0 = 5.40 - (72.652611 - lon_min) * scale_lon
svg_x1 = 854.60 + (lon_max - 80.897784) * scale_lon
svg_y0 = 7.60 - (lat_max - 22.030269) * scale_lat
svg_y1 = 706.80 + (15.606360 - lat_min) * scale_lat

svg_w = svg_x1 - svg_x0
svg_h = svg_y1 - svg_y0

print("\n=== UPDATED SVG <image> ATTRIBUTES (Including Chunk of Ocean) ===")
print(f'x="{svg_x0:.1f}"')
print(f'y="{svg_y0:.1f}"')
print(f'width="{svg_w:.1f}"')
print(f'height="{svg_h:.1f}"')
