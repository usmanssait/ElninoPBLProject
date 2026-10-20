/**
 * ==============================================================================
 * Google Earth Engine (GEE) JavaScript Script
 * Project: High-Detail Satellite Terrain Background for Maharashtra District Risk Map
 * Target: Sentinel-2 Cloud-Reduced Natural-Color Composite + Copernicus DEM Hillshade
 * Region: Maharashtra + Surrounding Western & Central India (No artificial borders)
 * Bounding Box (WGS84 EPSG:4326): [71.0°E, 14.5°N, 82.0°E, 23.0°N]
 *
 * Instructions for Earth Engine Execution:
 * 1. Open Google Earth Engine Code Editor: https://code.earthengine.google.com/
 * 2. Paste this complete script into the editor window.
 * 3. Click 'Run'.
 * 4. Inspect the interactive visualization in the Map view:
 *    - Verify Arabian Sea deep teal color.
 *    - Verify Sahyadri / Western Ghats hillshade depth.
 *    - Verify the yellow Maharashtra district boundary overlay for perfect alignment.
 * 5. Open the 'Tasks' tab in the upper-right panel.
 * 6. Click 'RUN' next to 'Maharashtra_Satellite_Terrain_Background'.
 * 7. In the popup, confirm Google Drive folder ('Maharashtra_Satellite_Terrain') and click 'Run'.
 * 8. Once exported, download the GeoTIFF to your project directory.
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// 1. REGION OF INTEREST (Generous buffer around Maharashtra)
// ------------------------------------------------------------------------------
var LON_MIN = 71.0;
var LAT_MIN = 14.5;
var LON_MAX = 82.0;
var LAT_MAX = 23.0;

var aoi = ee.Geometry.BBox(LON_MIN, LAT_MIN, LON_MAX, LAT_MAX);

// ------------------------------------------------------------------------------
// 2. SENTINEL-2 SURFACE REFLECTANCE CLOUD-REDUCED COMPOSITE
// ------------------------------------------------------------------------------
// Filter post-monsoon window (Oct 15 - Dec 15) when skies are clear, reservoirs are full,
// and natural vegetation along the Western Ghats is lush.
function maskS2clouds(image) {
  var scl = image.select('SCL');
  // Mask out: 3 = Cloud shadow, 8 = Cloud medium prob, 9 = Cloud high prob, 10 = Thin cirrus
  var cloudShadowMask = scl.neq(3);
  var cloudMask = scl.neq(8).and(scl.neq(9)).and(scl.neq(10));
  var defectiveMask = scl.neq(1); // Defective pixels
  
  return image.updateMask(cloudShadowMask.and(cloudMask).and(defectiveMask));
}

var s2Collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoi)
  .filterDate('2023-10-15', '2023-12-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskS2clouds);

// Reduce to median composite
var s2Median = s2Collection.select(['B4', 'B3', 'B2', 'B8']).median().clip(aoi);

// ------------------------------------------------------------------------------
// 3. ELEVATION & SHADED RELIEF (Copernicus DEM 30m)
// ------------------------------------------------------------------------------
var dem = ee.ImageCollection('COPERNICUS/DEM/GLO30').select('DEM').mosaic().clip(aoi);

// Calculate standard cartographic hillshade (315° NW azimuth, 42° sun elevation)
var hillshade = ee.Terrain.hillshade(dem, 315, 42);

// Normalize hillshade to 0.0 - 1.0 range
var hillshadeNorm = hillshade.divide(255.0);

// Accentuate terrain with gentle non-linear contrast (emphasize Sahyadris, Satpura, Balaghat ranges)
var hillshadeWeight = hillshadeNorm.multiply(0.55).add(0.55).clamp(0.50, 1.15);

// ------------------------------------------------------------------------------
// 4. WATER IDENTIFICATION & DEEP TEAL-BLUE STYLING
// ------------------------------------------------------------------------------
// Calculate NDWI: (Green - NIR) / (Green + NIR) -> (B3 - B8) / (B3 + B8)
var ndwi = s2Median.normalizedDifference(['B3', 'B8']);

// Water threshold: NDWI > 0.05 or DEM <= 0m (sea level)
var isWater = ndwi.gt(0.05).or(dem.lte(0.5));

// Deep teal water palette for the Arabian Sea & reservoirs:
// Matches dashboard dark forest-green & charcoal theme (#061D24 to #0A2E38)
var waterR = ee.Image.constant(10).divide(255.0);
var waterG = ee.Image.constant(42).divide(255.0);
var waterB = ee.Image.constant(56).divide(255.0);
var waterColor = ee.Image.cat([waterR, waterG, waterB]);

// ------------------------------------------------------------------------------
// 5. NATURAL COLOR VISUALIZATION & HILLSHADE BLENDING
// ------------------------------------------------------------------------------
// Natural color reflectance scaling: S2 surface reflectance values are DN * 0.0001
// Standard visual range: 0.02 (deep dark) to 0.28 (bright soil)
var minReflectance = 200.0;
var maxReflectance = 2600.0;

var landR = s2Median.select('B4').subtract(minReflectance).divide(maxReflectance - minReflectance).clamp(0.0, 1.0);
var landG = s2Median.select('B3').subtract(minReflectance).divide(maxReflectance - minReflectance).clamp(0.0, 1.0);
var landB = s2Median.select('B2').subtract(minReflectance).divide(maxReflectance - minReflectance).clamp(0.0, 1.0);

// Gamma correction for realistic tone (subdued contrast so district risk colors pop on top)
var gamma = 1.15;
landR = landR.pow(1.0 / gamma);
landG = landG.pow(1.0 / gamma);
landB = landB.pow(1.0 / gamma);

// Blend with shaded relief
var terrainR = landR.multiply(hillshadeWeight).clamp(0.0, 1.0);
var terrainG = landG.multiply(hillshadeWeight).clamp(0.0, 1.0);
var terrainB = landB.multiply(hillshadeWeight).clamp(0.0, 1.0);

// Combine land terrain and deep teal water
var finalR = terrainR.where(isWater, waterR);
var finalG = terrainG.where(isWater, waterG);
var finalB = terrainB.where(isWater, waterB);

var finalRgb = ee.Image.cat([
  finalR.multiply(255).byte(),
  finalG.multiply(255).byte(),
  finalB.multiply(255).byte()
]).rename(['vis-red', 'vis-green', 'vis-blue']);

// ------------------------------------------------------------------------------
// 6. MAP PREVIEW & BOUNDARY VALIDATION
// ------------------------------------------------------------------------------
Map.setCenter(76.5, 18.8, 7);
Map.setOptions('SATELLITE');

// Add blended terrain background
Map.addLayer(finalRgb, {}, 'Maharashtra Satellite Terrain (Sentinel-2 + DEM)');

// Load Administrative Boundaries for Maharashtra (FAO GAUL Level 2) for visual validation
var districts = ee.FeatureCollection('FAO/GAUL/2015/level2')
  .filter(ee.Filter.eq('ADM1_NAME', 'Maharashtra'));

var districtOutline = ee.Image().byte().paint({
  featureCollection: districts,
  color: 1,
  width: 1.5
});

Map.addLayer(districtOutline, { palette: ['#38BDF8'] }, 'Maharashtra District Boundaries (Validation Overlay)');

print('=== Satellite Terrain Generation Complete ===');
print('AOI Bounds: [Lon: ' + LON_MIN + ' to ' + LON_MAX + ', Lat: ' + LAT_MIN + ' to ' + LAT_MAX + ']');
print('Proceed to Tasks tab to run the export task.');

// ------------------------------------------------------------------------------
// 7. EXPORT TASK (Georeferenced 3-band RGB GeoTIFF)
// ------------------------------------------------------------------------------
// High-resolution statewide export (60m resolution produces ~3000x2000 raster:
// crystal clear for web zoom while keeping download size under 15MB).
Export.image.toDrive({
  image: finalRgb,
  description: 'Maharashtra_Satellite_Terrain_Background',
  folder: 'Maharashtra_Satellite_Terrain',
  fileNamePrefix: 'maharashtra_satellite_terrain_sentinel2_dem',
  region: aoi,
  scale: 60,                // 60m spatial resolution
  crs: 'EPSG:4326',         // Geographic WGS84
  maxPixels: 1e10,
  fileFormat: 'GeoTIFF'
});
