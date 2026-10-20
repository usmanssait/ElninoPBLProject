import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  MAHARASHTRA_DISTRICTS,
  PRIMARY_RICE_DISTRICTS,
  DistrictInfo,
} from '../data/canonicalDistricts';
import {
  buildDistrictYearMetrics,
  DistrictYearMetric,
} from '../data/maharashtraMapData';
import {
  KharifCropType,
  SUPPORTED_KHARIF_CROPS,
} from '../data/authoritativeData';
import { NOAA_CPC_ONI_RECORDS, OniRecord } from '../data/oniElNinoData';
import {
  getSeasonPredictions,
  DistrictModelPrediction,
} from '../ml/modelPipeline';

export interface DashboardContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedCrop: KharifCropType;
  setSelectedCrop: (crop: KharifCropType) => void;
  selectedDistrictId: string;
  setSelectedDistrictId: (id: string) => void;
  availableYears: number[];
  selectedDistrictInfo: DistrictInfo;
  currentYearMetrics: Record<string, DistrictYearMetric>;
  allYearMetrics: Record<number, Record<string, DistrictYearMetric>>;
  selectedDistrictMetric?: DistrictYearMetric;
  inSeasonModelPredictions: Record<string, DistrictModelPrediction>;
  selectedDistrictModelPred?: DistrictModelPrediction;
  oniInfo?: OniRecord;
  historicalTotalDistricts: number;
  historicalFailureCount: number;
  historicalResilientCount: number;
  stateMeanRainfallMm: number | null;
  stateMeanYieldTonnesHa: number | null;
  cropYearStr: string;
  monitoredDistrictsForCrop: DistrictInfo[];
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const AVAILABLE_KHARIF_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedYear, setSelectedYear] = useState<number>(2015);
  const [selectedCrop, setSelectedCrop] = useState<KharifCropType>('ALL');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('bhandara');

  const cropYearStr = useMemo(() => {
    return `${selectedYear}-${String(selectedYear + 1).slice(-2)}`;
  }, [selectedYear]);

  // Compute all metrics dynamically filtered by selected crop
  const allYearMetrics = useMemo(() => {
    return buildDistrictYearMetrics(selectedCrop);
  }, [selectedCrop]);

  const currentYearMetrics = useMemo(() => {
    return allYearMetrics[selectedYear] || {};
  }, [allYearMetrics, selectedYear]);

  // Districts that grow the currently selected crop
  const monitoredDistrictsForCrop = useMemo(() => {
    const list = MAHARASHTRA_DISTRICTS.filter(d => currentYearMetrics[d.id]?.hasDesRecord);
    return list.length > 0 ? list : PRIMARY_RICE_DISTRICTS;
  }, [currentYearMetrics]);

  const selectedDistrictInfo = useMemo(() => {
    return (
      MAHARASHTRA_DISTRICTS.find(d => d.id === selectedDistrictId) ||
      monitoredDistrictsForCrop[0] ||
      PRIMARY_RICE_DISTRICTS[0]
    );
  }, [selectedDistrictId, monitoredDistrictsForCrop]);

  const selectedDistrictMetric = useMemo(() => {
    return currentYearMetrics[selectedDistrictId];
  }, [currentYearMetrics, selectedDistrictId]);

  const inSeasonModelPredictions = useMemo(() => {
    return getSeasonPredictions(selectedYear, undefined, selectedCrop);
  }, [selectedYear, selectedCrop]);

  const selectedDistrictModelPred = useMemo(() => {
    return inSeasonModelPredictions[selectedDistrictId];
  }, [inSeasonModelPredictions, selectedDistrictId]);

  const oniInfo = useMemo(() => {
    return NOAA_CPC_ONI_RECORDS.find(r => r.year === selectedYear);
  }, [selectedYear]);

  const historicalTotalDistricts = monitoredDistrictsForCrop.length;

  const historicalFailureCount = useMemo(() => {
    return monitoredDistrictsForCrop.filter(
      d => currentYearMetrics[d.id]?.failureEvent === 1
    ).length;
  }, [monitoredDistrictsForCrop, currentYearMetrics]);

  const historicalResilientCount = useMemo(() => {
    return historicalTotalDistricts - historicalFailureCount;
  }, [historicalTotalDistricts, historicalFailureCount]);

  const validMetrics = useMemo(() => {
    return monitoredDistrictsForCrop.map(d => currentYearMetrics[d.id]).filter(Boolean);
  }, [monitoredDistrictsForCrop, currentYearMetrics]);

  const stateMeanRainfallMm = useMemo(() => {
    const withRain = validMetrics.filter(m => m.rainfallMm !== null);
    if (!withRain.length) return null;
    return Math.round(
      withRain.reduce((acc, m) => acc + (m.rainfallMm || 0), 0) / withRain.length
    );
  }, [validMetrics]);

  const stateMeanYieldTonnesHa = useMemo(() => {
    const withYield = validMetrics.filter(m => m.yieldTonnesHa !== null);
    if (!withYield.length) return null;
    return Number(
      (
        withYield.reduce((acc, m) => acc + (m.yieldTonnesHa || 0), 0) / withYield.length
      ).toFixed(2)
    );
  }, [validMetrics]);

  const value = {
    selectedYear,
    setSelectedYear,
    selectedCrop,
    setSelectedCrop,
    selectedDistrictId,
    setSelectedDistrictId,
    availableYears: AVAILABLE_KHARIF_YEARS,
    selectedDistrictInfo,
    currentYearMetrics,
    allYearMetrics,
    selectedDistrictMetric,
    inSeasonModelPredictions,
    selectedDistrictModelPred,
    oniInfo,
    historicalTotalDistricts,
    historicalFailureCount,
    historicalResilientCount,
    stateMeanRainfallMm,
    stateMeanYieldTonnesHa,
    cropYearStr,
    monitoredDistrictsForCrop,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return ctx;
};
