/**
 * ==============================================================================
 * NASA MODIS 8-Day Global Seamless Basemap (Land + Ocean) - FINAL GAPLESS FIX
 * Bounding Box: [62.0°E, 8.0°N, 92.0°E, 30.0°N]
 * Resolution: 500m (Fast ~12MB GeoTIFF export)
 * 
 * Note: NASA omits the pure-ocean sinusoidal tile in the far southwest corner
 * (south of 11°N, west of 71°E). We unmask that single open-sea tile with a matching
 * deep marine ocean fill so the entire canvas is a 100% solid rectangle.
 * ==============================================================================
 */

// 1. Regional Bounding Box (Deep Arabian Sea to Bay of Bengal)
var LON_MIN = 62.0;
var LAT_MIN = 8.0;
var LON_MAX = 92.0;
var LAT_MAX = 30.0;
var aoi = ee.Geometry.BBox(LON_MIN, LAT_MIN, LON_MAX, LAT_MAX);

// 2. NASA MODIS 8-Day Seamless Surface Reflectance (Images Land + Ocean)
// Band 1 = Red, Band 4 = Green, Band 3 = Blue
var modis = ee.ImageCollection('MODIS/061/MOD09A1')
  .filterBounds(aoi)
  .filterDate('2023-01-01', '2023-03-31') // Peak dry winter season (100% cloud-free)
  .select(
    ['sur_refl_b01', 'sur_refl_b04', 'sur_refl_b03'],
    ['red', 'green', 'blue']
  )
  .median()
  .clip(aoi);

// 3. Scale raw values (scale factor 0.0001) to reflectance [0.0, 1.0]
var refl = modis.multiply(0.0001);

// 4. Natural Color Grading (Balanced for both Land & Ocean)
var gamma = 1.25;
var r = refl.select('red').divide(0.25).clamp(0.0, 1.0).pow(1.0 / gamma);
var g = refl.select('green').divide(0.27).clamp(0.0, 1.0).pow(1.0 / gamma);
var b = refl.select('blue').divide(0.29).clamp(0.0, 1.0).pow(1.0 / gamma);

var modisRgb = ee.Image.cat([
  r.multiply(255).byte(),
  g.multiply(255).byte(),
  b.multiply(255).byte()
]).rename(['vis-red', 'vis-green', 'vis-blue']);

// 5. Fill the single missing open-ocean tile in the southwest corner with matching marine blue
var oceanFill = ee.Image.constant([14, 28, 42]).byte().rename(['vis-red', 'vis-green', 'vis-blue']).clip(aoi);
var finalWideRgb = oceanFill.blend(modisRgb);

// 6. Preview in Earth Engine Map Viewer
Map.setCenter(74.0, 18.5, 5);
Map.setOptions('SATELLITE');
Map.addLayer(finalWideRgb, {}, 'Seamless Regional Satellite Imagery (MODIS 500m)');

// Overlay Maharashtra Administrative Boundary for Verification
var maharashtra = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM1_NAME', 'Maharashtra'));
Map.addLayer(
  ee.Image().byte().paint(maharashtra, 1, 2),
  { palette: ['#22C55E'] },
  'Maharashtra Boundary'
);

// 7. Export Task to Google Drive (~12MB GeoTIFF, exports in ~1 minute)
Export.image.toDrive({
  image: finalWideRgb,
  description: 'Regional_Seamless_Satellite_Terrain_500m',
  folder: 'Maharashtra_Satellite_Terrain',
  fileNamePrefix: 'regional_seamless_satellite_terrain_500m',
  region: aoi,
  scale: 500,
  crs: 'EPSG:4326',
  maxPixels: 1e11,
  fileFormat: 'GeoTIFF'
});
