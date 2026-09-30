export interface OniRecord {
  year: number;
  mjjSstAnomaly: number;  // May-Jun-Jul 3-month running mean SST anomaly (°C)
  jjaSstAnomaly: number;  // Jun-Jul-Aug (peak in-season early warning window)
  jasSstAnomaly: number;  // Jul-Aug-Sep
  meanEarlyWarningSstAnomaly: number; // Mean during June 1 - August 31 window
  ensoPhase: 'Very Strong El Niño' | 'Weak El Niño' | 'Neutral' | 'La Niña';
  elNinoIndicator: 0 | 1; // 1 if SST anomaly >= +0.5°C
  notes: string;
}

/**
 * NOAA Climate Prediction Center (CPC) Oceanic Niño Index (ONI) records (2015–2022).
 * Sourced from NOAA ERSST.v5 3-month running mean Sea Surface Temperature (SST) anomalies
 * in the Niño 3.4 region (5°N - 5°S, 120°W - 170°W).
 * Documented as PUBLISHED REFERENCE DATA.
 */
export const NOAA_CPC_ONI_RECORDS: OniRecord[] = [
  {
    year: 2015,
    mjjSstAnomaly: 1.2,
    jjaSstAnomaly: 1.5,
    jasSstAnomaly: 1.8,
    meanEarlyWarningSstAnomaly: 1.50,
    ensoPhase: 'Very Strong El Niño',
    elNinoIndicator: 1,
    notes: 'Historic 2015-16 Godzilla El Niño; severe monsoon suppression across central India and Maharashtra.',
  },
  {
    year: 2016,
    mjjSstAnomaly: 0.4,
    jjaSstAnomaly: -0.3,
    jasSstAnomaly: -0.6,
    meanEarlyWarningSstAnomaly: -0.17,
    ensoPhase: 'Neutral',
    elNinoIndicator: 0,
    notes: 'Rapid dissipation of 2015 El Niño transitioning to cool neutral / weak La Niña; abundant Kharif monsoon.',
  },
  {
    year: 2017,
    mjjSstAnomaly: 0.4,
    jjaSstAnomaly: -0.1,
    jasSstAnomaly: -0.4,
    meanEarlyWarningSstAnomaly: -0.03,
    ensoPhase: 'Neutral',
    elNinoIndicator: 0,
    notes: 'ENSO neutral conditions; normal monsoon rainfall distribution.',
  },
  {
    year: 2018,
    mjjSstAnomaly: 0.1,
    jjaSstAnomaly: 0.1,
    jasSstAnomaly: 0.4,
    meanEarlyWarningSstAnomaly: 0.20,
    ensoPhase: 'Weak El Niño',
    elNinoIndicator: 0, // In-season mean below 0.5 threshold, though late Kharif exceeded
    notes: 'Weak El Niño development; prolonged dry spell in August affecting Vidarbha & Marathwada.',
  },
  {
    year: 2019,
    mjjSstAnomaly: 0.5,
    jjaSstAnomaly: 0.3,
    jasSstAnomaly: 0.1,
    meanEarlyWarningSstAnomaly: 0.30,
    ensoPhase: 'Weak El Niño',
    elNinoIndicator: 0,
    notes: 'Decaying weak El Niño; Indian Ocean Dipole (+IOD) offset Pacific drying, causing extreme August rains.',
  },
  {
    year: 2020,
    mjjSstAnomaly: -0.2,
    jjaSstAnomaly: -0.4,
    jasSstAnomaly: -0.6,
    meanEarlyWarningSstAnomaly: -0.40,
    ensoPhase: 'La Niña',
    elNinoIndicator: 0,
    notes: 'La Niña emergence; above-normal monsoon rainfall across Maharashtra.',
  },
  {
    year: 2021,
    mjjSstAnomaly: -0.4,
    jjaSstAnomaly: -0.4,
    jasSstAnomaly: -0.5,
    meanEarlyWarningSstAnomaly: -0.43,
    ensoPhase: 'La Niña',
    elNinoIndicator: 0,
    notes: 'Consecutive La Niña year; favorable vegetative condition across paddy belts.',
  },
  {
    year: 2022,
    mjjSstAnomaly: -1.0,
    jjaSstAnomaly: -0.9,
    jasSstAnomaly: -1.0,
    meanEarlyWarningSstAnomaly: -0.97,
    ensoPhase: 'La Niña',
    elNinoIndicator: 0,
    notes: 'Rare triple-dip La Niña; robust Kharif rice productivity state-wide.',
  },
];
