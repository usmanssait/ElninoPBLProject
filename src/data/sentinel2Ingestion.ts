/**
 * Sentinel-2 Multi-Spectral Cropland Patch Ingestion & Verification Interface
 *
 * Tensor Specification per District-Year:
 * Shape: [T=6, H=32, W=32, C=8]
 * - T=6: Six bi-weekly composite intervals across Kharif early warning window (June 1 - Aug 31)
 * - H=32, W=32: Spatial patch sampled at 10m GSD (320m x 320m cropland parcel)
 * - C=8: [B2 (Blue), B3 (Green), B4 (Red), B8 (NIR), B11 (SWIR1), B12 (SWIR2), NDVI, NDWI]
 * - Spatial Mask: ESA WorldCover 10m v100 Class 40 (General Cropland)
 *
 * SCIENTIFIC INTEGRITY ENFORCEMENT:
 * - NO synthetic or randomized pixel values are ever generated.
 * - When real GEE export files have not yet been placed into the project,
 *   the spatial branch is strictly marked as PENDING_GEE_EXPORT.
 */

export interface Sentinel2PatchMetadata {
  districtId: string;
  year: number;
  spatialMask: 'ESA WorldCover Class 40 (Cropland)';
  resolutionMeters: 10;
  patchDimensions: [32, 32];
  numTimesteps: 6;
  numChannels: 8;
  channels: ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI', 'NDWI'];
  isAvailable: boolean;
  status: 'INGESTED' | 'PENDING_GEE_EXPORT';
  exportScriptPath: 'scripts/extract_sentinel2_cropland.js';
}

export interface Sentinel2IngestionState {
  totalDistrictsModeled: number;
  seasonsConfigured: number[];
  ingestedPatchesCount: number;
  status: 'PENDING_GEE_EXPORT' | 'READY';
  statusMessage: string;
  extractionScript: string;
}

// In-memory registry for uploaded/provided GEE patches
const INGESTED_GEE_PATCHES: Record<string, Float32Array> = {};

/**
 * Returns current ingestion status for Sentinel-2 multi-spectral rasters
 */
export function getSentinel2IngestionState(): Sentinel2IngestionState {
  const patchKeys = Object.keys(INGESTED_GEE_PATCHES);
  const isReady = patchKeys.length >= 24;

  return {
    totalDistrictsModeled: 24,
    seasonsConfigured: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022],
    ingestedPatchesCount: patchKeys.length,
    status: isReady ? 'READY' : 'PENDING_GEE_EXPORT',
    statusMessage: isReady
      ? `Successfully ingested ${patchKeys.length} verified Sentinel-2 cropland patches.`
      : 'Awaiting Google Earth Engine Cropland Export Run. Run scripts/extract_sentinel2_cropland.js in GEE Code Editor to generate verified [T=6, 32, 32, 8] rasters.',
    extractionScript: 'scripts/extract_sentinel2_cropland.js',
  };
}

/**
 * Retrieves a verified Sentinel-2 patch for a given district-year observation.
 * Strictly returns null if real data has not been ingested (Zero Fabrication Rule).
 */
export function getDistrictCroplandPatch(districtId: string, year: number): {
  data: Float32Array | null;
  metadata: Sentinel2PatchMetadata;
} {
  const key = `${districtId}_${year}`;
  const data = INGESTED_GEE_PATCHES[key] || null;

  return {
    data,
    metadata: {
      districtId,
      year,
      spatialMask: 'ESA WorldCover Class 40 (Cropland)',
      resolutionMeters: 10,
      patchDimensions: [32, 32],
      numTimesteps: 6,
      numChannels: 8,
      channels: ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI', 'NDWI'],
      isAvailable: data !== null,
      status: data !== null ? 'INGESTED' : 'PENDING_GEE_EXPORT',
      exportScriptPath: 'scripts/extract_sentinel2_cropland.js',
    },
  };
}

/**
 * Register real GEE exported patch buffer (for future ingestion)
 */
export function registerGeeCroplandPatch(districtId: string, year: number, patchArray: Float32Array): boolean {
  // Validate tensor element count: 6 * 32 * 32 * 8 = 49,152 floats
  const expectedLength = 6 * 32 * 32 * 8;
  if (patchArray.length !== expectedLength) {
    console.error(`Invalid patch dimensions. Expected ${expectedLength} floats, received ${patchArray.length}`);
    return false;
  }
  const key = `${districtId}_${year}`;
  INGESTED_GEE_PATCHES[key] = patchArray;
  return true;
}
