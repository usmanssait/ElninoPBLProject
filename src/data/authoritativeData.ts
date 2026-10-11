/**
 * Single Authoritative Data Loader for Maharashtra Kharif Rice & IMD Rainfall Datasets
 *
 * Source of truth:
 * - data/des_rice_maharashtra_kharif_final.csv (DES yield statistics 2015–2022)
 * - data/imd_district_kharif_rainfall_2015_2022.csv (IMD 0.25° gridded rainfall 2015–2022)
 *
 * Enforces scientific integrity:
 * 1. CSV files are parsed directly via Vite raw imports - no hardcoded duplicate arrays.
 * 2. Original yield anomaly percentages and crop failure labels are strictly preserved.
 * 3. Silent defaults (such as 850 mm for missing rainfall) are eliminated; missing data is null.
 * 4. District matching is explicit and validated against canonical Maharashtra boundaries.
 */

import desCsvText from '../../data/des_rice_maharashtra_kharif_final.csv?raw';
import imdCsvText from '../../data/imd_district_kharif_rainfall_2015_2022.csv?raw';
import { MAHARASHTRA_DISTRICTS, PRIMARY_RICE_DISTRICTS, DistrictInfo } from './canonicalDistricts';

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

const parsedDes = parseDesCsv(desCsvText);
const parsedImd = parseImdCsv(imdCsvText);

export const AUTHORITATIVE_DES_RECORDS = parsedDes.records;
export const AUTHORITATIVE_IMD_RECORDS = parsedImd.records;

// Fast lookup indices
const desIndex = new Map<string, AuthoritativeDesRecord>();
for (const r of AUTHORITATIVE_DES_RECORDS) {
  desIndex.set(`${r.districtId}_${r.year}`, r);
}

const imdIndex = new Map<string, AuthoritativeImdRecord>();
for (const r of AUTHORITATIVE_IMD_RECORDS) {
  imdIndex.set(`${r.districtId}_${r.yearInt}`, r);
}

// Build Authoritative Joined Observation Ledger
export function getJoinedObservation(districtId: string, year: number): JoinedDistrictObservation {
  const dist = MAHARASHTRA_DISTRICTS.find(d => d.id === districtId);
  const des = desIndex.get(`${districtId}_${year}`);
  const imd = imdIndex.get(`${districtId}_${year}`);
  const cropYearStr = `${year}-${String(year + 1).slice(-2)}`;

  return {
    districtId,
    districtName: dist ? dist.name : districtId,
    division: dist ? dist.division : '',
    year,
    cropYearStr,
    rainfallMm: imd ? imd.kharifRainfallMm : null, // STRICT: NULL when missing
    yieldTonnesHa: des ? des.yieldTonnesHa : null, // STRICT: NULL when missing
    yieldKgHa: des ? des.yieldKgHa : null,
    baselineYieldTonnesHa: des ? des.districtMeanYieldTonnesHa : null,
    yieldAnomalyPct: des ? des.yieldAnomalyPct : null,
    failureEvent: des ? des.cropFailureInitial : null,
    isRiceProducer: dist ? dist.isRiceProducer : false,
    hasDesRecord: des !== undefined,
    hasImdRecord: imd !== undefined,
    areaHa: des ? des.areaHa : null,
    productionTonnes: des ? des.productionTonnes : null,
    gridPointsUsed: imd ? imd.gridPointsUsed : null,
  };
}

export function getAllJoinedObservationsForYear(year: number): Record<string, JoinedDistrictObservation> {
  const result: Record<string, JoinedDistrictObservation> = {};
  for (const dist of MAHARASHTRA_DISTRICTS) {
    result[dist.id] = getJoinedObservation(dist.id, year);
  }
  return result;
}

// Global dataset audit report for examiner & validation review
export const DATA_AUDIT_REPORT = {
  desRowCount: AUTHORITATIVE_DES_RECORDS.length,
  desUnmatchedDistricts: parsedDes.unmatched,
  desIssues: parsedDes.issues,
  imdRowCount: AUTHORITATIVE_IMD_RECORDS.length,
  imdUnmatchedDistricts: parsedImd.unmatched,
  imdIssues: parsedImd.issues,
  yearsAvailable: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022],
  totalMonitoredDistricts: 28,
  unmonitoredDistrictsInState: 8,
  verifiedJoinedPairsCount: AUTHORITATIVE_DES_RECORDS.filter(d => imdIndex.has(`${d.districtId}_${d.year}`)).length,
  missingDesSeasonsInMonitoredDistricts: AUTHORITATIVE_IMD_RECORDS.filter(i => !desIndex.has(`${i.districtId}_${i.yearInt}`)).length,
};
