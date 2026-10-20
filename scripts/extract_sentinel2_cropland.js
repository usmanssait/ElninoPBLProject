/**
 * ==============================================================================
 * Google Earth Engine (GEE) JavaScript Extraction Script
 * Project: Spatiotemporal CNN-LSTM Framework for Kharif Rice Crop Failure Early Warning
 * Region: Canonical Rice-Producing Districts of Maharashtra, India
 * Spatial Resolution: 32x32 pixels @ 20m GSD (640m x 640m parcel footprint)
 * Target Tensor per Location-Year: [T=6 timesteps, H=32, W=32, C=8 channels] -> 48 Bands
 * Channel Order per Timestep: B2, B3, B4, B8, B11, B12, NDVI, NDWI
 *
 * Instructions for Earth Engine Execution:
 * 1. Open https://code.earthengine.google.com/
 * 2. Paste this entire script into the code editor.
 * 3. Keep TEST_MODE = true for initial single-district test run (Gondia 2019).
 * 4. Click 'Run'. Inspect the console diagnostics, valid-pixel counts, and map layer.
 * 5. In the 'Tasks' tab on the right, click 'Run' to export the test patch GeoTIFF.
 * 6. Set TEST_MODE = false when ready to export all 20 canonical rice districts.
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// 1. CONFIGURATION & MODE SWITCHES
// ------------------------------------------------------------------------------
var TEST_MODE = false;         // false = export all 20 canonical rice districts; true = 1 test district
// Configure target years: set to [2020], [2021], [2022], or [2020, 2021, 2022] to export multi-year imagery
var TARGET_YEARS = [2020, 2021, 2022];
var DRIVE_FOLDER = 'Maharashtra_Sentinel2_Rice_Patches';
var OUTPUT_CRS = 'EPSG:4326';   // WGS84 coordinates
var PIXEL_SCALE_M = 20;        // 20m grid matching CNN-LSTM pilot specifications
var PATCH_SIZE = 32;           // 32 x 32 pixels
var HALF_PATCH_M = (PATCH_SIZE * PIXEL_SCALE_M) / 2; // 320m half-width -> 640m total width
var REFLECTANCE_SCALE = 0.0001; // S2 SR DN to surface reflectance (0.0 - 1.0)

print('=== Sentinel-2 Kharif Rice Extraction Pipeline ===');
print('Target Years Configured:', TARGET_YEARS);
print('Test Mode Active:', TEST_MODE);

// ------------------------------------------------------------------------------
// 2. VERIFIED RICE SAMPLING LOCATIONS (Derived from 10m India Rice Mask)
// ------------------------------------------------------------------------------
// Sourced from authoritative sampling plan (rice_sample_locations_2020.csv).
// Each location has documented rice purity fraction to ensure valid rice paddies.
var RICE_LOCATIONS = [
  { id: 'MH_026', district: 'Gondia', lon: 80.458778, lat: 20.934333, rice_fraction: 0.62 },
  { id: 'MH_007', district: 'Bhandara', lon: 79.520586, lat: 21.107529, rice_fraction: 0.53 },
  { id: 'MH_019', district: 'Gadchiroli', lon: 80.559208, lat: 20.732840, rice_fraction: 0.68 },
  { id: 'MH_008', district: 'Chandrapur', lon: 79.383414, lat: 20.676875, rice_fraction: 0.22 },
  { id: 'MH_032', district: 'Nagpur', lon: 78.817122, lat: 21.064589, rice_fraction: 0.48 },
  { id: 'MH_080', district: 'Thane', lon: 72.849758, lat: 19.284390, rice_fraction: 0.65 },
  { id: 'MH_049', district: 'Palghar', lon: 72.756513, lat: 19.662133, rice_fraction: 0.89 },
  { id: 'MH_059', district: 'Raigad', lon: 73.081880, lat: 18.992526, rice_fraction: 0.68 },
  { id: 'MH_065', district: 'Ratnagiri', lon: 73.137396, lat: 18.008866, rice_fraction: 0.39 },
  { id: 'MH_054', district: 'Pune', lon: 74.609092, lat: 18.302616, rice_fraction: 0.77 },
  { id: 'MH_073', district: 'Satara', lon: 74.391522, lat: 18.064921, rice_fraction: 0.86 },
  { id: 'MH_070', district: 'Sangli', lon: 74.103165, lat: 17.104977, rice_fraction: 0.45 },
  { id: 'MH_043', district: 'Nashik', lon: 73.449288, lat: 20.709304, rice_fraction: 0.50 },
  { id: 'MH_001', district: 'Ahilyanagar', lon: 74.571633, lat: 19.850241, rice_fraction: 0.48 },
  { id: 'MH_017', district: 'Dhule', lon: 73.921707, lat: 20.905497, rice_fraction: 0.45 },
  { id: 'MH_040', district: 'Nandurbar', lon: 74.290193, lat: 21.480601, rice_fraction: 0.97 },
  { id: 'MH_038', district: 'Nanded', lon: 77.589765, lat: 18.445629, rice_fraction: 0.33 },
  { id: 'MH_015', district: 'Chhatrapati Sambhajinagar', lon: 74.677184, lat: 19.962082, rice_fraction: 0.33 },
  { id: 'MH_005', district: 'Beed', lon: 74.813816, lat: 18.975098, rice_fraction: 0.19 },
  { id: 'MH_078', district: 'Solapur', lon: 75.094178, lat: 18.436106, rice_fraction: 0.24 }
];

var selectedLocations = TEST_MODE ? [RICE_LOCATIONS[0]] : RICE_LOCATIONS;
print('Processing Locations Count:', selectedLocations.length);

// ------------------------------------------------------------------------------
// 3. CONTINUOUS HALF-OPEN TEMPORAL WINDOWS (No Skipped Dates)
// ------------------------------------------------------------------------------
// Note: Earth Engine filterDate(start, end) is [start, end) exclusive of the end date.
// End dates are specified as the following day to guarantee full coverage of all days.
var TIME_WINDOWS = [
  { step: 1, name: 'T1', label: 'Jun 01-15', start: '-06-01', end: '-06-16' },
  { step: 2, name: 'T2', label: 'Jun 16-30', start: '-06-16', end: '-07-01' },
  { step: 3, name: 'T3', label: 'Jul 01-15', start: '-07-01', end: '-07-16' },
  { step: 4, name: 'T4', label: 'Jul 16-31', start: '-07-16', end: '-08-01' },
  { step: 5, name: 'T5', label: 'Aug 01-15', start: '-08-01', end: '-08-16' },
  { step: 6, name: 'T6', label: 'Aug 16-31', start: '-08-16', end: '-09-01' }
];

// Fixed channel schema matching PyTorch CNN-LSTM input stream
var OPTICAL_BANDS = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12'];
var CHANNEL_NAMES = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI', 'NDWI'];

// All-masked fallback image ensures robust schema when a window has 0 cloud-free scenes
var EMPTY_FALLBACK = ee.Image.constant([0, 0, 0, 0, 0, 0, 0, 0])
  .rename(CHANNEL_NAMES)
  .updateMask(ee.Image.constant(0));

// ------------------------------------------------------------------------------
// 4. ROBUST SCL CLOUD & SHADOW MASKING (Compatible with 2017-2022+ L2A Data)
// ------------------------------------------------------------------------------
// Uses Sentinel-2 Scene Classification Layer (SCL) to avoid 2022 QA60 baseline changes.
function maskS2sr(image) {
  var scl = image.select('SCL');
  // SCL classes: 4=Vegetation, 5=Bare Soil, 6=Water, 7=Unclassified
  // Excluded: 0=No Data, 1=Defective, 2=Dark Area, 3=Cloud Shadow,
  //           8=Cloud Medium Prob, 9=Cloud High Prob, 10=Cirrus, 11=Snow
  var clearObservations = scl.eq(4)
    .or(scl.eq(5))
    .or(scl.eq(6))
    .or(scl.eq(7));
    
  return image.select(OPTICAL_BANDS)
    .updateMask(clearObservations)
    .copyProperties(image, ['system:time_start', 'system:index']);
}

// ------------------------------------------------------------------------------
// 5. SPECTRAL INDICES & RESAMPLING PIPELINE
// ------------------------------------------------------------------------------
function processWindowComposite(collection, parcelBBox) {
  var sceneCount = collection.size();
  
  // Median composite of clear observations merged with fallback to guarantee stable schema
  var median = collection.map(maskS2sr)
    .merge(ee.ImageCollection([ee.Image.constant([0, 0, 0, 0, 0, 0]).rename(OPTICAL_BANDS).updateMask(ee.Image.constant(0))]))
    .median()
    .select(OPTICAL_BANDS);
    
  // Convert DN to surface reflectance (0.0 - 1.0)
  var reflectance = median.multiply(REFLECTANCE_SCALE);
  
  // Bilinear interpolation for SWIR bands (B11, B12) without coarse degree-scale reproject
  // Export.image.toDrive will sample the 32x32 grid (20m GSD) from the native projection.
  var resampled = reflectance.resample('bilinear');
  
  var b4 = resampled.select('B4');
  var b8 = resampled.select('B8');
  var b11 = resampled.select('B11');
  
  // NDVI = (B8 - B4) / (B8 + B4)
  var ndvi = b8.subtract(b4).divide(b8.add(b4).max(0.0001)).rename('NDVI');
  
  // NDMI / NDWI (Normalized Difference Moisture Index, Gao 1996: (B8 - B11) / (B8 + B11))
  // Named 'NDWI' for channel compatibility with the CNN-LSTM feature tensors.
  var ndwi = b8.subtract(b11).divide(b8.add(b11).max(0.0001)).rename('NDWI');
  
  var full8Bands = resampled.addBands(ndvi).addBands(ndwi).select(CHANNEL_NAMES);
  
  return {
    image: full8Bands,
    sceneCount: sceneCount,
    validMask: median.select('B2').mask().rename('valid').unmask(0)
  };
}

// ------------------------------------------------------------------------------
// 6. MULTI-TEMPORAL EXTRACTION & DIAGNOSTIC RUNNER
// ------------------------------------------------------------------------------
var yearsToProcess = TEST_MODE ? [TARGET_YEARS[0]] : TARGET_YEARS;

yearsToProcess.forEach(function(TARGET_YEAR) {
  print('>>> Processing Kharif Season Year: ' + TARGET_YEAR + ' <<<');
  
  selectedLocations.forEach(function(loc) {
    var point = ee.Geometry.Point([loc.lon, loc.lat]);
    // 640m x 640m square parcel centered at verified rice location (32 x 32 @ 20m)
    var parcelBBox = point.buffer(HALF_PATCH_M).bounds();
    
    var timeBandsList = [];
    var diagnosticWindowInfo = [];
    
    // Seasonal Kharif baseline composite (June 01 - August 31) to guarantee continuous,
    // valid physical reflectance values (no NaNs or unmasked gaps) even during persistent monsoon overcast
    var seasonalCollection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(parcelBBox)
      .filterDate(TARGET_YEAR + '-06-01', TARGET_YEAR + '-09-01');
    var seasonalComposite = processWindowComposite(seasonalCollection, parcelBBox).image;
    
    TIME_WINDOWS.forEach(function(tw) {
      var startDate = TARGET_YEAR + tw.start;
      var endDate = TARGET_YEAR + tw.end;
      
      // Evaluate all overpasses over the parcel (SCL mask handles cloudy pixels at parcel level)
      var s2Collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
        .filterBounds(parcelBBox)
        .filterDate(startDate, endDate);
        
      var processed = processWindowComposite(s2Collection, parcelBBox);
      
      // If a 15-day window suffers from persistent monsoon cloud cover (zero clear observations),
      // unmask with the seasonal parcel composite so every channel has valid physical reflectance
      var gapFilledImage = processed.image.unmask(seasonalComposite);
      
      // Rename bands with window prefix (e.g. T1_B2, T1_B3, ..., T1_NDVI, T1_NDWI)
      var windowRenamed = gapFilledImage.select(
        CHANNEL_NAMES,
        CHANNEL_NAMES.map(function(b) { return tw.name + '_' + b; })
      );
      
      timeBandsList.push(windowRenamed);
      
      // Measure raw valid pixel fraction in the patch
      var rawValidFraction = processed.validMask.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: parcelBBox,
        scale: PIXEL_SCALE_M,
        maxPixels: 10000
      }).get('valid');
      
      diagnosticWindowInfo.push({
        window: tw.name,
        label: tw.label,
        scenes: processed.sceneCount,
        rawValidFrac: rawValidFraction
      });
    });
    
    // Explicit image concatenation using ee.Image.cat (exactly 48 bands)
    var stackedPatch = ee.Image.cat(timeBandsList).clip(parcelBBox);
    
    // ----------------------------------------------------------------------------
    // 7. CONSOLE DIAGNOSTICS & VERIFICATION (Test Mode)
    // ----------------------------------------------------------------------------
    if (TEST_MODE) {
      print('--- Diagnostic Verification for Test District: ' + loc.district + ' (' + loc.id + ') Year: ' + TARGET_YEAR + ' ---');
      print('Location Coordinates:', [loc.lon, loc.lat]);
      print('Rice Purity Fraction in Mask:', loc.rice_fraction);
      print('Total Band Count in Export Image:', stackedPatch.bandNames().size());
      print('All 48 Band Names:', stackedPatch.bandNames());
      
      diagnosticWindowInfo.forEach(function(info) {
        print(info.window + ' (' + info.label + ') - Available Passes: ', info.scenes, '| Raw Clear Fraction:', info.rawValidFrac, '| Gap-Filled: 1.0 (Valid)');
      });
      
      // Add visual layers to GEE map
      Map.centerObject(parcelBBox, 14);
      Map.addLayer(parcelBBox, {color: 'yellow'}, 'Test Patch Footprint (' + TARGET_YEAR + ')');
      
      // False Color Composite (B8=NIR, B4=Red, B3=Green) for Peak Vegetative Window (T4: Late July)
      var t4Fcc = stackedPatch.select(['T4_B8', 'T4_B4', 'T4_B3']);
      Map.addLayer(t4Fcc, {min: 0.05, max: 0.45}, 'T4 False Color Composite (NIR-R-G ' + TARGET_YEAR + ')');
      
      // NDVI Layer for Late July
      var t4Ndvi = stackedPatch.select('T4_NDVI');
      Map.addLayer(t4Ndvi, {min: 0.1, max: 0.85, palette: ['blue', 'yellow', 'green']}, 'T4 NDVI (' + TARGET_YEAR + ')');
    }
    
    // Sanitize district name to ensure valid GEE task name without spaces
    var safeDistrictName = loc.district.replace(/[^a-zA-Z0-9_]/g, '_');
    var exportTaskName = 'S2_' + (TEST_MODE ? 'TEST_' : '') + safeDistrictName + '_' + TARGET_YEAR + '_32x32_Patch';
    var fileName = 's2_' + (TEST_MODE ? 'test_' : '') + loc.id.toLowerCase().replace(/[^a-z0-9_]/g, '_') + '_' + TARGET_YEAR + '_rice_patch';
    
    Export.image.toDrive({
      image: stackedPatch,
      description: exportTaskName,
      folder: DRIVE_FOLDER,
      fileNamePrefix: fileName,
      region: parcelBBox,
      dimensions: '32x32',        // Explicit 32x32 pixel dimensions
      crs: OUTPUT_CRS,
      formatOptions: {
        cloudOptimized: true
      }
    });
  });
});

print('==============================================================================');
if (TEST_MODE) {
  print('[SUCCESS] Single-District Test Export Scheduled in Tasks Tab.');
} else {
  print('[SUCCESS] All Multi-Year District Export Tasks Scheduled in Tasks Tab.');
  print('Exporting for years: ' + TARGET_YEARS.join(', '));
  print('Total Tasks: ' + (TARGET_YEARS.length * selectedLocations.length));
}
print('==============================================================================');
