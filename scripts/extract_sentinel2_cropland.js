/**
 * Google Earth Engine (GEE) JavaScript Extraction Script
 * Project: Spatiotemporal CNN-LSTM Framework for Kharif Rice Crop Failure Early Warning
 * Region: 24 Primary Rice-Producing Districts of Maharashtra, India
 * Spatial Mask: ESA WorldCover 10m v100 Class 40 (Cropland)
 * Target Tensor per District-Year: [T=6, H=32, W=32, C=8]
 * Channels: B2 (Blue), B3 (Green), B4 (Red), B8 (NIR), B11 (SWIR1), B12 (SWIR2), NDVI, NDWI
 *
 * Instructions for B.Tech PBL Execution:
 * 1. Open https://code.earthengine.google.com/
 * 2. Paste this entire script into the code editor.
 * 3. Click 'Run'. Inspect the console diagnostics and the map layer.
 * 4. In the 'Tasks' tab on the right, click 'Run' next to the export tasks to save the
 *    compact multi-spectral arrays / GeoTIFF chips directly to your Google Drive folder:
 *    "Maharashtra_Sentinel2_PBL".
 */

// 1. Define Primary Rice Districts in Maharashtra with Canonical Centroids
var DISTRICTS = [
  { id: 'bhandara', name: 'Bhandara', division: 'Nagpur', lon: 79.65, lat: 21.17 },
  { id: 'gondia', name: 'Gondia', division: 'Nagpur', lon: 80.20, lat: 21.46 },
  { id: 'chandrapur', name: 'Chandrapur', division: 'Nagpur', lon: 79.30, lat: 19.95 },
  { id: 'gadchiroli', name: 'Gadchiroli', division: 'Nagpur', lon: 80.00, lat: 20.18 },
  { id: 'nagpur', name: 'Nagpur', division: 'Nagpur', lon: 79.08, lat: 21.15 },
  { id: 'wardha', name: 'Wardha', division: 'Nagpur', lon: 78.60, lat: 20.74 },
  { id: 'thane', name: 'Thane', division: 'Konkan', lon: 72.98, lat: 19.22 },
  { id: 'palghar', name: 'Palghar', division: 'Konkan', lon: 72.77, lat: 19.70 },
  { id: 'raigad', name: 'Raigad', division: 'Konkan', lon: 73.10, lat: 18.52 },
  { id: 'ratnagiri', name: 'Ratnagiri', division: 'Konkan', lon: 73.30, lat: 16.99 },
  { id: 'sindhudurg', name: 'Sindhudurg', division: 'Konkan', lon: 73.70, lat: 16.12 },
  { id: 'kolhapur', name: 'Kolhapur', division: 'Pune', lon: 74.24, lat: 16.70 },
  { id: 'pune', name: 'Pune', division: 'Pune', lon: 73.85, lat: 18.52 },
  { id: 'satara', name: 'Satara', division: 'Pune', lon: 73.99, lat: 17.68 },
  { id: 'sangli', name: 'Sangli', division: 'Pune', lon: 74.57, lat: 16.85 },
  { id: 'nashik', name: 'Nashik', division: 'Nashik', lon: 73.79, lat: 20.00 },
  { id: 'ahilyanagar', name: 'Ahilyanagar', division: 'Nashik', lon: 74.74, lat: 19.10 },
  { id: 'dhule', name: 'Dhule', division: 'Nashik', lon: 74.77, lat: 20.90 },
  { id: 'nandurbar', name: 'Nandurbar', division: 'Nashik', lon: 74.24, lat: 21.37 },
  { id: 'amravati', name: 'Amravati', division: 'Amravati', lon: 77.75, lat: 20.93 },
  { id: 'yavatmal', name: 'Yavatmal', division: 'Amravati', lon: 78.13, lat: 20.40 },
  { id: 'nanded', name: 'Nanded', division: 'Marathwada', lon: 77.31, lat: 19.15 },
  { id: 'parbhani', name: 'Parbhani', division: 'Marathwada', lon: 76.77, lat: 19.26 },
  { id: 'hingoli', name: 'Hingoli', division: 'Marathwada', lon: 77.15, lat: 19.72 }
];

// 2. Six Bi-Weekly Intervals in June 1 - August 31 In-Season Window (MM-DD)
var TIME_WINDOWS = [
  { step: 1, name: 'T1_Jun01_Jun15', start: '-06-01', end: '-06-15' },
  { step: 2, name: 'T2_Jun16_Jun30', start: '-06-16', end: '-06-30' },
  { step: 3, name: 'T3_Jul01_Jul15', start: '-07-01', end: '-07-15' },
  { step: 4, name: 'T4_Jul16_Jul31', start: '-07-16', end: '-07-31' },
  { step: 5, name: 'T5_Aug01_Aug15', start: '-08-01', end: '-08-15' },
  { step: 6, name: 'T6_Aug16_Aug31', start: '-08-16', end: '-08-31' }
];

// 3. Load ESA WorldCover 10m v100 (2020) and create general Cropland Mask (Class 40)
var worldCover = ee.Image('ESA/WorldCover/v100/2020');
var croplandMask = worldCover.select('Map').eq(40); // 40 = Cropland (General, non-crop specific)

// 4. Cloud Masking Function for Sentinel-2 Level-2A (Bottom of Atmosphere)
function maskS2sr(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
    .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  
  // Also filter using SCL (Scene Classification Layer) if present
  var scl = image.select('SCL');
  var validLand = scl.neq(3) // Cloud shadows
    .and(scl.neq(8)) // Cloud medium probability
    .and(scl.neq(9)) // Cloud high probability
    .and(scl.neq(10)) // Thin cirrus
    .and(scl.neq(11)); // Snow
  
  return image.updateMask(mask).updateMask(validLand);
}

// 5. Function to calculate 8 channels: [B2, B3, B4, B8, B11, B12, NDVI, NDWI]
function addSpectralIndices(image) {
  // Scale surface reflectance values to 0.0 - 1.0 range
  var optical = image.select(['B2', 'B3', 'B4', 'B8', 'B11', 'B12']).divide(10000.0);
  
  var b4 = optical.select('B4');
  var b8 = optical.select('B8');
  var b11 = optical.select('B11');
  
  // NDVI = (B8 - B4) / (B8 + B4)
  var ndvi = b8.subtract(b4).divide(b8.add(b4).max(0.0001)).rename('NDVI');
  
  // NDWI = (B8 - B11) / (B8 + B11)
  var ndwi = b8.subtract(b11).divide(b8.add(b11).max(0.0001)).rename('NDWI');
  
  return optical.addBands(ndvi).addBands(ndwi);
}

// 6. Extraction Pipeline for Target Year (e.g. 2015 El Niño Benchmark or 2016 Resilient)
var TARGET_YEAR = 2015; // Set to year to export: 2015, 2016, 2017, ..., 2022
print('Configured Sentinel-2 Extraction for Kharif Year:', TARGET_YEAR);

// Process benchmark districts to produce 32x32 patches at 10m GSD (320m x 320m parcel)
DISTRICTS.forEach(function(district) {
  var point = ee.Geometry.Point([district.lon, district.lat]);
  // 320m x 320m bounding box (matches exactly 32 x 32 pixels at 10m GSD)
  var parcelBBox = point.buffer(160).bounds();
  
  var timeBandsList = [];
  
  TIME_WINDOWS.forEach(function(tw) {
    var startDate = TARGET_YEAR + tw.start;
    var endDate = TARGET_YEAR + tw.end;
    
    var s2Collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(parcelBBox)
      .filterDate(startDate, endDate)
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 60))
      .map(maskS2sr);
    
    // Median composite over 15-day window
    var composite = s2Collection.median();
    var indexed = addSpectralIndices(composite);
    
    // Apply ESA WorldCover Class 40 cropland mask
    var maskedCropland = indexed.updateMask(croplandMask);
    
    // Rename bands with timestep prefix: T1_B2, T1_B3, ..., T1_NDVI, T1_NDWI
    var renamed = maskedCropland.select(
      ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI', 'NDWI'],
      [
        tw.name + '_B2', tw.name + '_B3', tw.name + '_B4', tw.name + '_B8',
        tw.name + '_B11', tw.name + '_B12', tw.name + '_NDVI', tw.name + '_NDWI'
      ]
    );
    
    timeBandsList.push(renamed);
  });
  
  // Stack all 6 timesteps into a single 48-band composite (6 timesteps x 8 bands = 48 bands)
  var stackedImage = ee.Image(timeBandsList);
  
  // Set export task to Google Drive: Generates a 32x32 pixel GeoTIFF patch (< 500 KB per district)
  Export.image.toDrive({
    image: stackedImage.clip(parcelBBox),
    description: 'S2_' + district.name + '_' + TARGET_YEAR + '_32x32_Patch',
    folder: 'Maharashtra_Sentinel2_PBL',
    fileNamePrefix: 's2_' + district.id + '_' + TARGET_YEAR + '_cropland_patch',
    region: parcelBBox,
    scale: 10, // 10 meter GSD -> exactly 32 x 32 pixels
    crs: 'EPSG:4326',
    maxPixels: 1e8
  });
});

print('Scheduled 24 district export tasks in Tasks tab.');
print('Cropland Filter: ESA WorldCover Class 40 (General Cropland).');
