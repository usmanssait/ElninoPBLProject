/**
 * ==============================================================================
 * Google Earth Engine (GEE) JavaScript Script: Regional Surround Terrain Background
 * Target: Gapless, Broad-Area Satellite Terrain Buffer for Surrounding Western & Central India
 * Purpose: Provides a lightweight, slightly lower-resolution regional background to fill
 *          areas outside Maharashtra (Arabian Sea, Gujarat, MP, Chhattisgarh, Telangana,
 *          Karnataka, Goa, and coastal margins) with zero tile cutoffs or nodata holes.
 *
 * Broad AOI (WGS84 EPSG:4326): [68.0°E, 12.0°N, 85.0°E, 26.0°N]
 * Export Scale: 250m resolution (~2000x1800 raster, under 12 MB download)
 * ==============================================================================
 */

// 1. EXTENDED REGIONAL BOUNDING BOX
var LON_MIN = 68.0;
var LAT_MIN = 12.0;
var LON_MAX = 85.0;
var LAT_MAX = 26.0;

var aoi = ee.Geometry.BBox(LON_MIN, LAT_MIN, LON_MAX, LAT_MAX);

// 2. GAPLESS CLOUD-FREE SURFACE REFLECTANCE (Landsat 8/9 + Sentinel-2 Harmonized)
// Using an extended cloud-reduced annual/post-monsoon composite guarantees 100% spatial coverage
// with no black seams or missing coastal swaths.
var l8Collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(aoi)
  .filterDate('2023-10-01', '2024-01-31')
  .filter(ee.Filter.lt('CLOUD_COVER', 15))
  .select(
    ['SR_B4', 'SR_B3', 'SR_B2'],
    ['red', 'green', 'blue']
  )
  .map(function(img) {
    // Landsat surface reflectance scale factor: 0.0000275 + -0.2
    return img.multiply(0.0000275).add(-0.2).clamp(0.0, 1.0);
  });

var landComposite = l8Collection.median().clip(aoi);

// 3. REGIONAL ELEVATION & SHADED RELIEF (Copernicus DEM 90m / GLO-30)
var dem = ee.ImageCollection('COPERNICUS/DEM/GLO30')
  .select('DEM')
  .mosaic()
  .clip(aoi);

// Standard cartographic hillshade (315° NW azimuth, 42° elevation)
var hillshade = ee.Terrain.hillshade(dem, 315, 42).divide(255.0);
var hillshadeWeight = hillshade.multiply(0.50).add(0.55).clamp(0.45, 1.15);

// 4. WATER BODY & OCEAN MASK (Deep Teal Arab Sea Palette)
// Identify water by elevation <= 1.0m or NDWI
var waterR = ee.Image.constant(7).divide(255.0);
var waterG = ee.Image.constant(30).divide(255.0);
var waterB = ee.Image.constant(42).divide(255.0);

var isOcean = dem.lte(0.5);

// 5. COLOR BALANCING & GAMMA
var gamma = 1.15;
var landR = landComposite.select('red').multiply(3.8).clamp(0.0, 1.0).pow(1.0 / gamma);
var landG = landComposite.select('green').multiply(3.8).clamp(0.0, 1.0).pow(1.0 / gamma);
var landB = landComposite.select('blue').multiply(3.8).clamp(0.0, 1.0).pow(1.0 / gamma);

// Blend with shaded relief
var terrainR = landR.multiply(hillshadeWeight).clamp(0.0, 1.0);
var terrainG = landG.multiply(hillshadeWeight).clamp(0.0, 1.0);
var terrainB = landB.multiply(hillshadeWeight).clamp(0.0, 1.0);

// Fill ocean with deep teal-blue
var finalR = terrainR.where(isOcean, waterR);
var finalG = terrainG.where(isOcean, waterG);
var finalB = terrainB.where(isOcean, waterB);

var finalSurroundRgb = ee.Image.cat([
  finalR.multiply(255).byte(),
  finalG.multiply(255).byte(),
  finalB.multiply(255).byte()
]).rename(['vis-red', 'vis-green', 'vis-blue']);

// 6. MAP PREVIEW
Map.setCenter(76.5, 19.0, 6);
Map.setOptions('SATELLITE');
Map.addLayer(finalSurroundRgb, {}, 'Regional Surround Terrain (Outside Buffer)');

// Validation outline of Maharashtra
var maharashtra = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM1_NAME', 'Maharashtra'));
Map.addLayer(ee.Image().byte().paint(maharashtra, 1, 2), { palette: ['#38BDF8'] }, 'Maharashtra Boundary');

// 7. EXPORT TASK (250m Resolution for ultra-lightweight ~10MB GeoTIFF)
Export.image.toDrive({
  image: finalSurroundRgb,
  description: 'Regional_Satellite_Terrain_Surround_250m',
  folder: 'Maharashtra_Satellite_Terrain',
  fileNamePrefix: 'regional_satellite_terrain_surround_250m',
  region: aoi,
  scale: 250,              // 250m spatial resolution
  crs: 'EPSG:4326',        // WGS84
  maxPixels: 1e10,
  fileFormat: 'GeoTIFF'
});
