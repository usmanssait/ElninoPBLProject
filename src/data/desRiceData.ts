/**
 * Authoritative DES Maharashtra Kharif Rice Agricultural Dataset (2015–2022)
 *
 * Sourced directly from data/des_rice_maharashtra_kharif_final.csv
 * via authoritativeData.ts.
 * Eliminates redundant hardcoded copies while maintaining full backwards compatibility.
 */

import { AUTHORITATIVE_DES_RECORDS, AuthoritativeDesRecord } from './authoritativeData';

export type DesRiceRecord = AuthoritativeDesRecord;

export const DES_RICE_RECORDS_2015_2022: DesRiceRecord[] = AUTHORITATIVE_DES_RECORDS;
