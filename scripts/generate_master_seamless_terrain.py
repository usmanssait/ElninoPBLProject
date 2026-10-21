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

# Fill southwest missing ocean tile if any
ocean_missing = np.all(arr <= 1.0, axis=2) | np.isnan(np.mean(arr, axis=2))
if np.any(ocean_missing):
    ocean_sample = np.median(arr[2200:2600, 400:800], axis=(0, 1))
    arr[ocean_missing] = ocean_sample

arr_norm = arr / 255.0
R = arr_norm[..., 0]
G = arr_norm[..., 1]
B = arr_norm[..., 2]

# Water factor: detects ocean & deep reservoirs
water_factor = np.clip((B - R * 0.85) / 0.12, 0, 1)
water_factor[R < 0.08] = 1.0

# Land color grading:
# Balanced vibrant lush: converts dry yellow into lush emerald vegetation while retaining topographical contrast
R_land = np.clip(0.75 * R + 0.09 * G, 0, 1)
G_land = np.clip(0.14 * R + 1.18 * G + 0.02 * B, 0, 1)
B_land = np.clip(0.00 * R + 0.05 * G + 1.06 * B, 0, 1)

def contrast(x, c=1.09):
    return np.clip(0.5 + (x - 0.5) * c, 0, 1)

R_land = contrast(R_land, 1.08)
G_land = contrast(G_land, 1.13)
B_land = contrast(B_land, 1.06)

# Ocean / Water grading: Deep sapphire-teal marine tones
R_water = np.clip(R * 0.70, 0, 0.15)
G_water = np.clip(G * 0.88, 0, 0.35)
B_water = np.clip(B * 1.15 + 0.02, 0, 0.45)

water_rgb = np.stack([R_water, G_water, B_water], axis=-1)
wf_3d = np.expand_dims(water_factor, axis=-1)

final_composite = np.stack([R_land, G_land, B_land], axis=-1) * (1.0 - wf_3d) + water_rgb * wf_3d
final_composite = np.clip(final_composite, 0, 1)

final_uint8 = (final_composite * 255).astype(np.uint8)
final_img = Image.fromarray(final_uint8)

# Output paths
out_webp = 'public/images/maharashtra_satellite_terrain_sentinel2_dem.webp'
out_png = 'public/images/maharashtra_satellite_terrain_sentinel2_dem.png'

print(f"Saving {out_webp}...")
final_img.save(out_webp, format='WEBP', quality=88, method=6)
print(f"WebP size: {os.path.getsize(out_webp)/(1024*1024):.2f} MB")

print(f"Saving {out_png}...")
final_img.save(out_png, format='PNG', optimize=True)
print(f"PNG size: {os.path.getsize(out_png)/(1024*1024):.2f} MB")
print("Seamless master satellite terrain successfully generated!")
