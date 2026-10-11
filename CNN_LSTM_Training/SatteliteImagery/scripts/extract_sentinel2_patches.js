/******************************************************************************
 * Maharashtra Kharif Rice — Sentinel-2 patch extraction (Google Earth Engine)
 *
 * Output: one GeoJSON table per selected satellite year. Each row is one
 * sampling location and contains 6 time windows x 8 channels, with each
 * channel stored as a 32 x 32 array (20 m grid; 640 m x 640 m footprint).
 *
 * CHANNEL ORDER per timestep:
 *   B2, B3, B4, B8, B11, B12, NDVI, NDWI
 * where NDWI is the NIR-SWIR index (B8 - B11) / (B8 + B11), also often called
 * NDMI. We preserve the project's existing NDWI channel name for consistency.
 *
 * IMPORTANT:
 * - Pilot mode defaults to 2020 ONLY. Validate one export before adding years.
 * - Sentinel-2 SR Harmonized does not provide 2015/2016 SR observations.
 * - The rice_fraction column is passed through as provenance; this script does
 *   not turn the Winter rice mask into model input or ground-truth labels.
 * - Missing/cloud-masked pixels are exported as FILL_VALUE, never fabricated.
 ******************************************************************************/

// ------------------------------ USER SETTINGS -------------------------------
// Upload the current rice_sample_locations_2020.csv to Earth Engine Assets as a
// TABLE. During upload, use longitude as X, latitude as Y, CRS EPSG:4326 if the
// upload wizard asks for geometry columns. Then paste the exact asset ID here.
var LOCATIONS_ASSET = 'projects/gen-lang-client-0292873450/assets/rice_sample_locations_2020';

// Start with one year (2020). Once the export + Python validation succeed, use:
// [2017, 2018, 2019, 2020, 2021, 2022]
var YEARS_TO_EXPORT = [2020];

// Use a unique Drive folder name to avoid the similarly named folders from the
// earlier pilot. Earth Engine creates it if it does not exist.
var DRIVE_FOLDER = 'ELNINO_S2_PATCHES_V1';

// The current project design: 32 x 32 at 20 m = 640 m square patches.
var PATCH_SIZE = 32;
var PIXEL_SIZE_M = 20;
var HALF_PATCH_M = PATCH_SIZE * PIXEL_SIZE_M / 2;
var OUTPUT_CRS = 'EPSG:32643';  // common metric grid for the Maharashtra pilot
var FILL_VALUE = -9999;
var REFLECTANCE_SCALE = 0.0001;

// ------------------------------ FIXED SCHEMA --------------------------------
var SOURCE_BANDS = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12'];
var CHANNELS = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI', 'NDWI'];
var S2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');

// Half-open windows [start, end); together they cover June 1 through August 31.
var WINDOWS = [
  {name: 't01', label: 'Jun 01-15', sm: 6, sd: 1,  em: 6,  ed: 16},
  {name: 't02', label: 'Jun 16-30', sm: 6, sd: 16, em: 7,  ed: 1},
  {name: 't03', label: 'Jul 01-15', sm: 7, sd: 1,  em: 7,  ed: 16},
  {name: 't04', label: 'Jul 16-31', sm: 7, sd: 16, em: 8,  ed: 1},
  {name: 't05', label: 'Aug 01-15', sm: 8, sd: 1,  em: 8,  ed: 16},
  {name: 't06', label: 'Aug 16-31', sm: 8, sd: 16, em: 9,  ed: 1}
];

// All-masked fallback guarantees a stable band schema even when a window has
// no scenes. It does not create valid pixel values.
var EMPTY_IMAGE = ee.Image.constant([0, 0, 0, 0, 0, 0])
  .rename(SOURCE_BANDS)
  .updateMask(ee.Image.constant(0));

// ------------------------------ LOCATIONS -----------------------------------

var rawLocations = ee.FeatureCollection(LOCATIONS_ASSET);

// Filter valid features and ensure Point geometries are populated
var locations = rawLocations.filter(
  ee.Filter.notNull(['location_id', 'district', 'rice_fraction'])
);

print('Loaded sampling locations', locations.size());
print(
  'Locations with rice_fraction >= 0.20',
  locations.filter(ee.Filter.gte('rice_fraction', 0.20)).size()
);
print('First location', locations.first());
print('Output patch size', PATCH_SIZE + ' x ' + PATCH_SIZE + ' @ ' + PIXEL_SIZE_M + ' m');
Map.addLayer(locations, {color: '00ffff'}, 'Rice sampling locations');
Map.centerObject(locations, 6);

// ------------------------------ PROCESSING ----------------------------------
function maskS2Clouds(image) {
  var scl = image.select('SCL');
  // Same SCL class policy used in the original pilot.
  var clear = scl.neq(0)
    .and(scl.neq(1))
    .and(scl.neq(3))
    .and(scl.neq(8))
    .and(scl.neq(9))
    .and(scl.neq(10))
    .and(scl.neq(11));

  return image.select(SOURCE_BANDS)
    .updateMask(clear)
    .copyProperties(image, ['system:time_start', 'system:index']);
}

function twoDigits(value) { return (value < 10 ? '0' : '') + value; }

function makeWindow(year, window, index) {
  var start = ee.Date.fromYMD(year, window.sm, window.sd);
  var end = ee.Date.fromYMD(year, window.em, window.ed);
  var startText = year + '-' + twoDigits(window.sm) + '-' + twoDigits(window.sd);
  var endText = (window.em < window.sm ? year + 1 : year) + '-' + twoDigits(window.em) + '-' + twoDigits(window.ed);
  var source = S2
    .filterBounds(locations.geometry())
    .filterDate(start, end);
  var sceneCount = source.size();
  var masked = source.map(maskS2Clouds);

  // Add a completely masked fallback image so median always has the six
  // expected source bands. When no observations exist the output stays masked.
  var median = masked.merge(ee.ImageCollection([EMPTY_IMAGE]))
    .median()
    .select(SOURCE_BANDS);

  // Normalize Sentinel-2 SR DN to reflectance. All channels are placed on the
  // same 20 m grid before indices are derived, avoiding mixed 10/20 m shapes.
  var reflectance20 = median
    .multiply(REFLECTANCE_SCALE)
    .resample('bilinear')
    .reproject({crs: OUTPUT_CRS, scale: PIXEL_SIZE_M});

  var ndvi = reflectance20.normalizedDifference(['B8', 'B4']).rename('NDVI');
  var ndwi = reflectance20.normalizedDifference(['B8', 'B11']).rename('NDWI');
  var channelImage = reflectance20.addBands(ndvi).addBands(ndwi).select(CHANNELS);

  var prefix = window.name + '_';
  var outputNames = CHANNELS.map(function (band) { return prefix + band; });
  channelImage = channelImage.rename(outputNames);

  // Pixel validity is diagnostic only. A valid pixel requires the composite's
  // B2 band to retain a clear-observation mask. This band is explicitly
  // unmasked to zero so reduceRegion measures the full patch area.
  var valid = median.select('B2').mask()
    .rename('valid')
    .unmask(0)
    .reproject({crs: OUTPUT_CRS, scale: PIXEL_SIZE_M});

  return {
    name: window.name,
    label: window.label,
    startString: startText,
    endString: endText,
    sceneCount: sceneCount,
    image: channelImage,
    valid: valid,
    bandNames: outputNames
  };
}

function makePatchRectangle(pointFeature) {
  // Snap the centre to the common 20 m grid, then create exactly 640 m square.
  var projectedPoint = pointFeature.geometry().transform(OUTPUT_CRS, 1);
  var xy = ee.List(projectedPoint.coordinates());
  var centerX = ee.Number(xy.get(0)).divide(PIXEL_SIZE_M).round().multiply(PIXEL_SIZE_M);
  var centerY = ee.Number(xy.get(1)).divide(PIXEL_SIZE_M).round().multiply(PIXEL_SIZE_M);
  return ee.Geometry.Rectangle([
    centerX.subtract(HALF_PATCH_M),
    centerY.subtract(HALF_PATCH_M),
    centerX.add(HALF_PATCH_M),
    centerY.add(HALF_PATCH_M)
  ], OUTPUT_CRS, false);
}

function makeYearExportTable(year) {
  var windows = WINDOWS.map(function (window, index) {
    return makeWindow(year, window, index);
  });

  print('Satellite year', year, '| DES crop season key', year + '-' + (year + 1));
  windows.forEach(function (window) {
    print(year + ' ' + window.label + ' [' + window.startString + ', ' + window.endString + ') scenes', window.sceneCount);
  });

  var stack = ee.Image.cat(windows.map(function (window) { return window.image; }))
    .reproject({crs: OUTPUT_CRS, scale: PIXEL_SIZE_M});
  var outputBandNames = [];
  windows.forEach(function (window) {
    window.bandNames.forEach(function (name) { outputBandNames.push(name); });
  });
  stack = stack.select(outputBandNames);

  return locations.map(function (location) {
    var patchRegion = makePatchRectangle(location);
    var sampled = stack.sampleRectangle({
      region: patchRegion,
      defaultValue: FILL_VALUE
    });

    var properties = location.toDictionary().combine(ee.Dictionary({
      satellite_year: year,
      crop_year: String(year) + '-' + String(year + 1),
      patch_crs: OUTPUT_CRS,
      patch_pixel_size_m: PIXEL_SIZE_M,
      patch_width_pixels: PATCH_SIZE,
      patch_height_pixels: PATCH_SIZE,
      patch_fill_value: FILL_VALUE,
      source_collection: 'COPERNICUS/S2_SR_HARMONIZED',
      cloud_mask: 'SCL exclude classes 0,1,3,8,9,10,11',
      composite_method: 'per-window median',
      ndwi_formula: '(B8-B11)/(B8+B11)'
    }), true).combine(sampled.toDictionary(outputBandNames), true);

    windows.forEach(function (window) {
      var stats = window.valid.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: patchRegion,
        crs: OUTPUT_CRS,
        scale: PIXEL_SIZE_M,
        maxPixels: 5000,
        bestEffort: false
      });
      var pct = ee.Number(stats.get('valid', 0)).multiply(100);
      properties = properties
        .set('coverage_pct_' + window.name, pct)
        .set('scene_count_' + window.name, window.sceneCount)
        .set('window_start_' + window.name, window.startString)
        .set('window_end_exclusive_' + window.name, window.endString);
    });

    // Null geometry keeps the GeoJSON table compact; location coords remain in
    // properties and are not confused with the snapped patch rectangle.
    return ee.Feature(null, properties);
  });
}

// ------------------------------- EXPORTS ------------------------------------
YEARS_TO_EXPORT.forEach(function (year) {
  var rows = makeYearExportTable(year);
  Export.table.toDrive({
    collection: rows,
    description: 'MH_Rice_S2_Patches_' + year,
    fileNamePrefix: 'MH_Rice_S2_Patches_' + year,
    folder: DRIVE_FOLDER,
    fileFormat: 'GeoJSON'
  });
});

print('Export tasks created. Run the task for 2020 first; inspect the GeoJSON and quality audit before adding more years.');
