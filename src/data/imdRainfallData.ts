/**
 * Authoritative IMD Kharif Rainfall Dataset (2015–2022)
 *
 * Sourced directly from data/imd_district_kharif_rainfall_2015_2022.csv
 * via authoritativeData.ts.
 * Eliminates redundant hardcoded copies while maintaining full backwards compatibility.
 */

import { AUTHORITATIVE_IMD_RECORDS } from './authoritativeData';

export interface ImdDistrictRainfallRecord {
  district: string;
  districtId: string;
  year: string; // e.g. "2015-16"
  yearInt: number; // e.g. 2015
  kharifRainfallMm: number;
  gridPointsUsed: number;
}

export type ImdRainfallRecord = ImdDistrictRainfallRecord;

export const IMD_DISTRICT_KHARIF_RAINFALL: ImdDistrictRainfallRecord[] = AUTHORITATIVE_IMD_RECORDS.map(r => ({
  district: r.districtName,
  districtId: r.districtId,
  year: r.year,
  yearInt: r.yearInt,
  kharifRainfallMm: r.kharifRainfallMm,
  gridPointsUsed: r.gridPointsUsed,
}));

export const IMD_RAINFALL_2015_2022: ImdDistrictRainfallRecord[] = IMD_DISTRICT_KHARIF_RAINFALL;
