export interface SpectralBandInfo {
  band: string;
  name: string;
  wavelengthNm: number;
  spatialResolutionM: number;
  spectralRole: string;
}

export const SENTINEL2_8_CHANNELS: SpectralBandInfo[] = [
  { band: 'B2', name: 'Blue', wavelengthNm: 490, spatialResolutionM: 10, spectralRole: 'Atmospheric scattering correction & soil discrimination' },
  { band: 'B3', name: 'Green', wavelengthNm: 560, spatialResolutionM: 10, spectralRole: 'Peak green reflectance & chlorophyll absorption' },
  { band: 'B4', name: 'Red', wavelengthNm: 665, spatialResolutionM: 10, spectralRole: 'Primary chlorophyll absorption band (photosynthetic vigor)' },
  { band: 'B8', name: 'Near Infrared (NIR)', wavelengthNm: 842, spatialResolutionM: 10, spectralRole: 'Cellular leaf structure reflectance & canopy biomass' },
  { band: 'B11', name: 'Shortwave Infrared-1 (SWIR-1)', wavelengthNm: 1610, spatialResolutionM: 20, spectralRole: 'Canopy water content, moisture stress & flood standing water' },
  { band: 'B12', name: 'Shortwave Infrared-2 (SWIR-2)', wavelengthNm: 2190, spatialResolutionM: 20, spectralRole: 'Soil background moisture & dry cellulose detection' },
  { band: 'NDVI', name: 'Normalized Difference Veg. Index', wavelengthNm: 0, spatialResolutionM: 10, spectralRole: '(B8 - B4) / (B8 + B4) — Photosynthetic green biomass index' },
  { band: 'NDWI', name: 'Normalized Difference Water Index', wavelengthNm: 0, spatialResolutionM: 10, spectralRole: '(B8 - B11) / (B8 + B11) — Canopy liquid water content & paddy puddle depth' },
];

export const TENSOR_SPEC = {
  spatialTensorShape: '[B, 6, 8, 32, 32]',
  dimensions: {
    B: 'Batch size (district-years per training mini-batch)',
    T: '6 timesteps (bi-weekly intervals across June 1 – August 31 Early Warning window)',
    C: '8 channels (B2, B3, B4, B8, B11, B12, NDVI, NDWI)',
    H: '32 pixels height (at 10m GSD = 320 meters ground extent)',
    W: '32 pixels width (at 10m GSD = 320 meters ground extent)',
  },
  exogenousVectorShape: '[B, 6, 4]',
  exogenousFeatures: [
    'Bi-weekly rainfall accumulation (mm)',
    'Rainfall departure anomaly (%) relative to district LPA',
    'NOAA CPC Oceanic Niño Index (ONI) 3-month running mean SST anomaly (°C)',
    'El Niño event binary indicator (1 if ONI >= +0.5°C, else 0)',
  ],
  croplandMaskSpec: {
    source: 'ESA WorldCover 10m v200',
    targetClassCode: 40,
    targetClassLabel: 'Cropland',
    mandatoryLimitationStatement:
      'ESA WorldCover Class 40 identifies cropland, not rice specifically. Satellite patches represent agricultural cropland within verified rice-growing districts.',
    samplingMethodology:
      'Candidate 32x32 patches are extracted from district agricultural zones where cropland purity >= 70%, sampled within verified Kharif rice-growing talukas.',
  },
  modelNomenclature: {
    task: 'Mid-Season Kharif Rice Crop Failure Early Warning',
    predictionWindow: 'June 1 – August 31 (In-Season)',
    targetWindow: 'October – November (Harvest outcome)',
    predictionOutputLabel: 'Predicted crop-failure probability',
    pipelineDescription:
      'Reproducible local PyTorch training and inference pipeline configured for Windows 11 with AMD Radeon RX 9060 XT (DirectML / ROCm) and Ryzen 7 5700X',
  },
};
