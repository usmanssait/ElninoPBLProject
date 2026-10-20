import rasterio
from rasterio.enums import Resampling
from PIL import Image
import numpy as np
import os

tif_path = 'data/maharashtra_satellite_terrain_sentinel2_dem.tif'
out_png = 'public/images/maharashtra_satellite_terrain_sentinel2_dem.png'
out_webp = 'public/images/maharashtra_satellite_terrain_sentinel2_dem.webp'

print(f"Reading {tif_path}...")
with rasterio.open(tif_path) as src:
    orig_h, orig_w = src.shape
    print(f"Original shape: {orig_w}x{orig_h}, Bands: {src.count}, Dtype: {src.dtypes[0]}")
    
    # Calculate target dimensions: ~2560 width for ultra-sharp crisp display
    target_w = 2560
    target_h = int(orig_h * (target_w / orig_w))
    print(f"Downsampling to {target_w}x{target_h} using high-quality Bilinear resampling...")
    
    # Read and resample in memory
    data = src.read(
        out_shape=(src.count, target_h, target_w),
        resampling=Resampling.bilinear
    )

print(f"Resampled data shape: {data.shape}")
print(f"Channel min: {[data[i].min() for i in range(3)]}, max: {[data[i].max() for i in range(3)]}")

# Stack as (H, W, 3) uint8 image
rgb_array = np.transpose(data, (1, 2, 0))

img = Image.fromarray(rgb_array)

# Ensure public/images directory exists
os.makedirs('public/images', exist_ok=True)

# Save as PNG
print(f"Saving {out_png}...")
img.save(out_png, format='PNG', optimize=True)
png_size = os.path.getsize(out_png)
print(f"Saved {out_png} ({png_size / (1024*1024):.2f} MB)")

# Save as high-quality WebP
print(f"Saving {out_webp}...")
img.save(out_webp, format='WEBP', quality=92, method=6)
webp_size = os.path.getsize(out_webp)
print(f"Saved {out_webp} ({webp_size / (1024*1024):.2f} MB)")
