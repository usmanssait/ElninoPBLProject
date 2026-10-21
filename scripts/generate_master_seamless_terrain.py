import rasterio
from rasterio.enums import Resampling
import numpy as np
from PIL import Image
import os

CANVAS_W = 3840
CANVAS_H = 2976

print("Reading regional seamless 500m GeoTIFF...")
with rasterio.open('data/regional_seamless_satellite_terrain_500m.tif') as src:
    arr = src.read(out_shape=(3, CANVAS_H, CANVAS_W), resampling=Resampling.bilinear)
    arr = np.transpose(arr, (1, 2, 0)).astype(np.float32)

# Heal any missing ocean pixels in the far southwest (outside India)
ocean_missing = np.all(arr <= 1.0, axis=2) | np.isnan(np.mean(arr, axis=2))
if np.any(ocean_missing):
    ocean_sample = np.median(arr[2200:2600, 400:800], axis=(0, 1))
    arr[ocean_missing] = ocean_sample

# Normalize to 0..1
arr_norm = arr / 255.0
R = arr_norm[..., 0]
G = arr_norm[..., 1]
B = arr_norm[..., 2]

# Water detection (deep ocean & inland reservoirs)
is_deep_water = (R < 0.10) & (B >= R * 0.85) & (G >= R * 0.85)
water_proxy = np.clip((B - R * 0.82) / 0.14, 0, 1)
water_proxy[is_deep_water] = 1.0

# 1. Natural, Neutral Satellite Land Processing
# Authentic surface reflectance without blanket green tinting
R_land = R * 0.92
G_land = G * 0.98
B_land = B * 0.95

# Mild contrast curve to reveal Western Ghats topography and rivers with clarity
def mild_contrast(x, amount=1.06):
    return np.clip(0.5 + (x - 0.5) * amount, 0, 1)

R_land = mild_contrast(R_land, 1.06)
G_land = mild_contrast(G_land, 1.06)
B_land = mild_contrast(B_land, 1.05)

# 2. Oceanic Water Processing
# Deep sapphire / muted marine teal (#081C26 to #0D303D)
R_water = np.clip(R * 0.65, 0, 0.12)
G_water = np.clip(G * 0.85, 0, 0.28)
B_water = np.clip(B * 1.10 + 0.015, 0, 0.40)

water_rgb = np.stack([R_water, G_water, B_water], axis=-1)
land_rgb = np.stack([R_land, G_land, B_land], axis=-1)
wp_3d = np.expand_dims(water_proxy, axis=-1)

final_comp = land_rgb * (1.0 - wp_3d) + water_rgb * wp_3d
final_comp = np.clip(final_comp, 0, 1)

final_uint8 = (final_comp * 255).astype(np.uint8)
final_img = Image.fromarray(final_uint8)

# Output paths
out_webp = 'public/images/maharashtra_satellite_terrain_sentinel2_dem.webp'
out_png = 'public/images/maharashtra_satellite_terrain_sentinel2_dem.png'

print(f"Saving natural master WebP: {out_webp}...")
final_img.save(out_webp, format='WEBP', quality=90, method=6)
print(f"WebP size: {os.path.getsize(out_webp)/(1024*1024):.2f} MB")

print(f"Saving natural master PNG: {out_png}...")
final_img.save(out_png, format='PNG', optimize=True)
print(f"PNG size: {os.path.getsize(out_png)/(1024*1024):.2f} MB")
print("Authentic natural master satellite terrain successfully generated!")
