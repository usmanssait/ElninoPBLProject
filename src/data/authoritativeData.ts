/**
 * Single Authoritative Data Loader for Maharashtra Kharif All Crops & IMD Rainfall Datasets
 *
 * Source of truth:
 * - data/des_kharif_maharashtra_all_crops.csv (DES yield statistics for Rice, Soybean, Cotton, Bajra, Jowar, Tur 2015–2022)
 * - data/des_rice_maharashtra_kharif_final.csv (DES Rice baseline validation)
 * - data/imd_district_kharif_rainfall_2015_2022.csv (IMD 0.25° gridded rainfall 2015–2022)
 */

import allKharifCsvText from '../../data/des_kharif_maharashtra_all_crops.csv?raw';
import imdCsvText from '../../data/imd_district_kharif_rainfall_2015_2022.csv?raw';
import { MAHARASHTRA_DISTRICTS, DistrictInfo } from './canonicalDistricts';

export type KharifCropType = 'ALL' | 'Rice' | 'Soybean' | 'Cotton' | 'Bajra' | 'Jowar' | 'Tur';

export const SUPPORTED_KHARIF_CROPS: { id: KharifCropType; label: string; icon: string }[] = [
  { id: 'ALL', label: 'All Kharif Crops (Composite)', icon: '🌾' },
  { id: 'Soybean', label: 'Soybean (Leading Oilseed)', icon: '🌱' },
  { id: 'Cotton', label: 'Cotton (Khandesh & Vidarbha)', icon: '🌿' },
  { id: 'Rice', label: 'Rice / Paddy (Konkan & East Vidarbha)', icon: '🌾' },
  { id: 'Bajra', label: 'Bajra / Pearl Millet (Drought Hardy)', icon: '🌾' },
  { id: 'Jowar', label: 'Jowar / Sorghum (Rain Shadow)', icon: '🌾' },
  { id: 'Tur', label: 'Tur / Arhar (Pulses)', icon: '🌱' },
];

export interface AuthoritativeDesRecord {
  state: string;
  districtName: string;
  districtId: string;
  crop: string;
  season: string;
  year: number; // e.g. 2015
  cropYearStr: string; // e.g. "2015-16"
  areaHa: number;
  productionTonnes: number;
  yieldTonnesHa: number;
  yieldKgHa: number;
  districtMeanYieldTonnesHa: number;
  yieldAnomalyPct: number;
  cropFailureInitial: 0 | 1;
}

export interface AuthoritativeImdRecord {
  districtName: string;
  districtId: string;
  year: string; // e.g. "2015-16"
  yearInt: number; // e.g. 2015
  kharifRainfallMm: number;
  gridPointsUsed: number;
}

export interface JoinedDistrictObservation {
  districtId: string;
  districtName: string;
  division: string;
  year: number;
  cropYearStr: string;
  crop: string;
  rainfallMm: number | null; // NULL if missing; NO SILENT DEFAULTS
  yieldTonnesHa: number | null; // NULL if missing; NO SILENT FABRICATIONS
  yieldKgHa: number | null;
  baselineYieldTonnesHa: number | null;
  yieldAnomalyPct: number | null;
  failureEvent: 0 | 1 | null; // NULL if no DES observation
  isRiceProducer: boolean;
  hasDesRecord: boolean;
  hasImdRecord: boolean;
  areaHa: number | null;
  productionTonnes: number | null;
  gridPointsUsed: number | null;
  cropsGrownHere?: string[];
}

// Canonical lookup helper
const canonicalMapByName = new Map<string, DistrictInfo>();
const canonicalMapById = new Map<string, DistrictInfo>();

for (const dist of MAHARASHTRA_DISTRICTS) {
  canonicalMapByName.set(dist.name.toLowerCase(), dist);
  canonicalMapById.set(dist.id.toLowerCase(), dist);
  if (dist.aliases) {
    for (const alias of dist.aliases) {
      canonicalMapByName.set(alias.toLowerCase(), dist);
    }
  }
}

function resolveDistrict(rawName: string): DistrictInfo | undefined {
  const cleaned = rawName.trim().toLowerCase();
  return canonicalMapByName.get(cleaned) || canonicalMapById.get(cleaned);
}

// Parse DES CSV directly
function parseDesCsv(raw: string): { records: AuthoritativeDesRecord[]; unmatched: string[]; issues: string[] } {
  const lines = raw.trim().split(/\r?\n/);
  const records: AuthoritativeDesRecord[] = [];
  const unmatched: string[] = [];
  const issues: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 11) {
      issues.push(`Line ${i + 1}: Malformed row, expected 11 columns, got ${parts.length}`);
      continue;
    }

    const state = parts[0].trim();
    const rawDistrict = parts[1].trim();
    const crop = parts[2].trim();
    const season = parts[3].trim();
    const rawYear = parts[4].trim(); // e.g. "2015 - 2016"
    const areaHa = parseFloat(parts[5].trim());
    const productionTonnes = parseFloat(parts[6].trim());
    const yieldTonnesHa = parseFloat(parts[7].trim());
    const districtMeanYieldTonnesHa = parseFloat(parts[8].trim());
    const yieldAnomalyPct = parseFloat(parts[9].trim());
    const rawFailure = parseInt(parts[10].trim(), 10);
    const cropFailureInitial: 0 | 1 = rawFailure === 1 ? 1 : 0;

    const distInfo = resolveDistrict(rawDistrict);
    if (!distInfo) {
      unmatched.push(rawDistrict);
      continue;
    }

    const yearMatch = rawYear.match(/(\d{4})/);
    const yearInt = yearMatch ? parseInt(yearMatch[1], 10) : 0;
    const cropYearStr = `${yearInt}-${String(yearInt + 1).slice(-2)}`;

    records.push({
      state,
      districtName: distInfo.name,
      districtId: distInfo.id,
      crop,
      season,
      year: yearInt,
      cropYearStr,
      areaHa,
      productionTonnes,
      yieldTonnesHa,
      yieldKgHa: Math.round(yieldTonnesHa * 1000),
      districtMeanYieldTonnesHa,
      yieldAnomalyPct,
      cropFailureInitial,
    });
  }

  return { records, unmatched: [...new Set(unmatched)], issues };
}

// Parse IMD CSV directly
function parseImdCsv(raw: string): { records: AuthoritativeImdRecord[]; unmatched: string[]; issues: string[] } {
  const lines = raw.trim().split(/\r?\n/);
  const records: AuthoritativeImdRecord[] = [];
  const unmatched: string[] = [];
  const issues: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 4) {
      issues.push(`Line ${i + 1}: Malformed IMD row, expected 4 columns, got ${parts.length}`);
      continue;
    }

    const rawDistrict = parts[0].trim();
    const yearStr = parts[1].trim(); // e.g. "2015-16"
    const rainfallMm = parseFloat(parts[2].trim());
    const gridPoints = parseInt(parts[3].trim(), 10);

    const distInfo = resolveDistrict(rawDistrict);
    if (!distInfo) {
      unmatched.push(rawDistrict);
      continue;
    }

    const yearMatch = yearStr.match(/(\d{4})/);
    const yearInt = yearMatch ? parseInt(yearMatch[1], 10) : 0;

    records.push({
      districtName: distInfo.name,
      districtId: distInfo.id,
      year: yearStr,
      yearInt,
      kharifRainfallMm: rainfallMm,
      gridPointsUsed: gridPoints,
    });
  }

  return { records, unmatched: [...new Set(unmatched)], issues };
}

const parsedDes = parseDesCsv(allKharifCsvText);
const parsedImd = parseImdCsv(imdCsvText);

export const AUTHORITATIVE_DES_RECORDS = parsedDes.records;
export const AUTHORITATIVE_IMD_RECORDS = parsedImd.records;

// Fast lookup indices
// Key: districtId_year_crop
const desIndexByCrop = new Map<string, AuthoritativeDesRecord>();
// Key: districtId_year (dominant / primary record or list)
const desRecordsByDistrictYear = new Map<string, AuthoritativeDesRecord[]>();

for (const r of AUTHORITATIVE_DES_RECORDS) {
  desIndexByCrop.set(`${r.districtId}_${r.year}_${r.crop.toLowerCase()}`, r);
  
  const dyKey = `${r.districtId}_${r.year}`;
  if (!desRecordsByDistrictYear.has(dyKey)) {
    desRecordsByDistrictYear.set(dyKey, []);
  }
  desRecordsByDistrictYear.get(dyKey)!.push(r);
}

const imdIndex = new Map<string, AuthoritativeImdRecord>();
for (const r of AUTHORITATIVE_IMD_RECORDS) {
  imdIndex.set(`${r.districtId}_${r.yearInt}`, r);
}

// Build Authoritative Joined Observation Ledger with Crop filter support
export function getJoinedObservation(
  districtId: string,
  year: number,
  cropFilter: KharifCropType = 'ALL'
): JoinedDistrictObservation {
  const dist = MAHARASHTRA_DISTRICTS.find(d => d.id === districtId);
  const imd = imdIndex.get(`${districtId}_${year}`);
  const cropYearStr = `${year}-${String(year + 1).slice(-2)}`;
  const dyKey = `${districtId}_${year}`;
  const allRecordsForDistrictYear = desRecordsByDistrictYear.get(dyKey) || [];

  const cropsGrownHere = [...new Set(allRecordsForDistrictYear.map(r => r.crop))];

  if (cropFilter !== 'ALL') {
    const des = desIndexByCrop.get(`${districtId}_${year}_${cropFilter.toLowerCase()}`);
    return {
      districtId,
      districtName: dist ? dist.name : districtId,
      division: dist ? dist.division : '',
      year,
      cropYearStr,
      crop: cropFilter,
      rainfallMm: imd ? imd.kharifRainfallMm : null,
      yieldTonnesHa: des ? des.yieldTonnesHa : null,
      yieldKgHa: des ? des.yieldKgHa : null,
      baselineYieldTonnesHa: des ? des.districtMeanYieldTonnesHa : null,
      yieldAnomalyPct: des ? des.yieldAnomalyPct : null,
      failureEvent: des ? des.cropFailureInitial : null,
      isRiceProducer: cropsGrownHere.includes('Rice'),
      hasDesRecord: des !== undefined,
      hasImdRecord: imd !== undefined,
      areaHa: des ? des.areaHa : null,
      productionTonnes: des ? des.productionTonnes : null,
      gridPointsUsed: imd ? imd.gridPointsUsed : null,
      cropsGrownHere,
    };
  }

  // ALL CROPS (Composite View):
  // If specific crop not selected, pick dominant crop by area or aggregate
  if (allRecordsForDistrictYear.length === 0) {
    return {
      districtId,
      districtName: dist ? dist.name : districtId,
      division: dist ? dist.division : '',
      year,
      cropYearStr,
      crop: 'All Kharif Crops',
      rainfallMm: imd ? imd.kharifRainfallMm : null,
      yieldTonnesHa: null,
      yieldKgHa: null,
      baselineYieldTonnesHa: null,
      yieldAnomalyPct: null,
      failureEvent: null,
      isRiceProducer: dist ? dist.isRiceProducer : false,
      hasDesRecord: false,
      hasImdRecord: imd !== undefined,
      areaHa: null,
      productionTonnes: null,
      gridPointsUsed: imd ? imd.gridPointsUsed : null,
      cropsGrownHere: [],
    };
  }

  // Sort by area descending to find the district's primary cash/food crop
  const sortedByArea = [...allRecordsForDistrictYear].sort((a, b) => b.areaHa - a.areaHa);
  const dominant = sortedByArea[0];

  // Weighted average anomaly across all crops grown in this district
  const totalArea = allRecordsForDistrictYear.reduce((acc, r) => acc + r.areaHa, 0);
  const totalProd = allRecordsForDistrictYear.reduce((acc, r) => acc + r.productionTonnes, 0);
  const weightedAnomaly = allRecordsForDistrictYear.reduce((acc, r) => acc + r.yieldAnomalyPct * (r.areaHa / totalArea), 0);
  const anyCropFailed = allRecordsForDistrictYear.some(r => r.cropFailureInitial === 1) ? 1 : 0;

  return {
    districtId,
    districtName: dist ? dist.name : districtId,
    division: dist ? dist.division : '',
    year,
    cropYearStr,
    crop: dominant.crop,
    rainfallMm: imd ? imd.kharifRainfallMm : null,
    yieldTonnesHa: Number((totalProd / totalArea).toFixed(2)),
    yieldKgHa: Math.round((totalProd / totalArea) * 1000),
    baselineYieldTonnesHa: dominant.districtMeanYieldTonnesHa,
    yieldAnomalyPct: Number(weightedAnomaly.toFixed(1)),
    failureEvent: anyCropFailed,
    isRiceProducer: cropsGrownHere.includes('Rice'),
    hasDesRecord: true,
    hasImdRecord: imd !== undefined,
    areaHa: Math.round(totalArea),
    productionTonnes: Math.round(totalProd),
    gridPointsUsed: imd ? imd.gridPointsUsed : null,
    cropsGrownHere,
  };
}

export function getAllJoinedObservationsForYear(
  year: number,
  cropFilter: KharifCropType = 'ALL'
): Record<string, JoinedDistrictObservation> {
  const result: Record<string, JoinedDistrictObservation> = {};
  for (const dist of MAHARASHTRA_DISTRICTS) {
    result[dist.id] = getJoinedObservation(dist.id, year, cropFilter);
  }
  return result;
}

export const DATA_AUDIT_REPORT = {
  desRowCount: AUTHORITATIVE_DES_RECORDS.length,
  desUnmatchedDistricts: parsedDes.unmatched,
  desIssues: parsedDes.issues,
  imdRowCount: AUTHORITATIVE_IMD_RECORDS.length,
  imdUnmatchedDistricts: parsedImd.unmatched,
  imdIssues: parsedImd.issues,
  yearsAvailable: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022],
  totalMonitoredDistricts: 28,
  cropsCovered: ['Rice', 'Soybean', 'Cotton', 'Bajra', 'Jowar', 'Tur'],
};
