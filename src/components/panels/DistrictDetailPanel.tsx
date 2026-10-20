import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Collapsible } from '../common/Collapsible';
import {
  TrendingUp,
  Layers,
  CheckCircle2,
  AlertCircle,
  Sprout,
  CloudRain,
  Thermometer,
  Search,
  ShieldAlert,
  Download,
} from 'lucide-react';
import { PRIMARY_RICE_DISTRICTS } from '../../data/canonicalDistricts';
import { ALL_YEAR_METRICS } from '../../data/maharashtraMapData';
import { TENSOR_SPEC } from '../../data/satelliteSpec';
import { YearSelect } from '../common/YearSelect';
import { CropSelect } from '../common/CropSelect';

interface DistrictDetailPanelProps {
  className?: string;
  onDownloadCsv?: () => void;
}

export const DistrictDetailPanel: React.FC<DistrictDetailPanelProps> = ({
  className = '',
  onDownloadCsv,
}) => {
  const {
    selectedDistrictInfo,
    selectedDistrictId,
    setSelectedDistrictId,
    selectedDistrictMetric,
    selectedYear,
    cropYearStr,
    availableYears,
    oniInfo,
    currentYearMetrics,
    allYearMetrics,
    selectedCrop,
    monitoredDistrictsForCrop,
  } = useDashboard();

  const [comparisonSearch, setComparisonSearch] = useState('');

  const hasCropData = selectedDistrictMetric?.hasDesRecord;
  const isFailure = selectedDistrictMetric?.failureEvent === 1;

  // Selected district historical time series (2015-2022) filtered by selected crop
  const districtHistoricalSeries = useMemo(() => {
    return availableYears.map(yr => {
      const m = allYearMetrics[yr]?.[selectedDistrictInfo.id];
      return {
        year: yr,
        yieldTonnesHa: m?.yieldTonnesHa ?? null,
        rainfallMm: m?.rainfallMm ?? null,
        failure: m?.failureEvent === 1,
      };
    });
  }, [availableYears, selectedDistrictInfo.id, allYearMetrics]);

  // Region-wise statistics helper based on active crop districts
  const getRegionStats = (regionName: 'Konkan' | 'Western MH' | 'Marathwada' | 'Vidarbha') => {
    const regionDistricts = monitoredDistrictsForCrop.filter(d => {
      if (regionName === 'Konkan') return d.division === 'Konkan';
      if (regionName === 'Western MH') return d.division === 'Pune' || d.division === 'Nashik';
      if (regionName === 'Marathwada') return d.division === 'Marathwada';
      if (regionName === 'Vidarbha') return d.division === 'Nagpur' || d.division === 'Amravati';
      return false;
    });
    const total = regionDistricts.length;
    if (total === 0) return { total: 0, failureCount: 0, resilientCount: 0, failurePct: 0, resilientPct: 0 };

    const failureCount = regionDistricts.filter(d => currentYearMetrics[d.id]?.failureEvent === 1).length;
    const resilientCount = total - failureCount;
    const failurePct = Math.round((failureCount / total) * 100);
    const resilientPct = 100 - failurePct;
    return { total, failureCount, resilientCount, failurePct, resilientPct };
  };

  // Filtered districts for comparison table
  const comparisonDistricts = useMemo(() => {
    const baseList = monitoredDistrictsForCrop.length > 0 ? monitoredDistrictsForCrop : PRIMARY_RICE_DISTRICTS;
    if (!comparisonSearch.trim()) return baseList;
    const q = comparisonSearch.toLowerCase();
    return baseList.filter(
      d => d.name.toLowerCase().includes(q) || d.division.toLowerCase().includes(q)
    );
  }, [comparisonSearch, monitoredDistrictsForCrop]);

  return (
    <div
      className={`rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] p-3.5 space-y-3 shadow-xs flex flex-col justify-between ${className}`}
    >
      {/* 1. Header: > District Insights with Year, Crop & District selectors */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#CCD2C4]">
        <div className="flex items-center gap-1.5 text-xs font-mono text-[#12382B] font-bold">
          <span>&gt; District Insights</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Crop Selector */}
          <CropSelect showIcon={false} />

          {/* Kharif Year Selector */}
          <YearSelect />

          {/* District Dropdown Selector */}
          <div className="relative">
            <select
              value={selectedDistrictId}
              onChange={e => setSelectedDistrictId(e.target.value)}
              className="bg-white border border-[#CCD2C4] text-[#16221B] rounded-xl px-2.5 py-2 text-xs font-mono cursor-pointer focus:outline-hidden hover:border-[#12382B] transition-colors shadow-xs"
            >
              {monitoredDistrictsForCrop.map(d => (
                <option key={d.id} value={d.id} className="bg-white text-[#16221B]">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {onDownloadCsv && (
            <button
              onClick={onDownloadCsv}
              type="button"
              className="p-2 rounded-xl bg-white border border-[#CCD2C4] text-[#526458] hover:text-[#12382B] hover:border-[#12382B] transition-all cursor-pointer shadow-xs"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#12382B]" />
            </button>
          )}
        </div>
      </div>

      {/* 2. District Title & Status Badge */}
      <div className="flex items-start justify-between gap-2.5">
        <div>
          <h3 className="text-xl font-bold text-[#16221B] tracking-tight">
            {selectedDistrictInfo.name}
          </h3>
          <span className="text-[11px] text-[#526458] font-medium block mt-0.5">
            {selectedDistrictInfo.division} Division &bull; {selectedDistrictInfo.agroZone}
            {selectedDistrictMetric?.crop && (
              <span className="text-[#12382B] ml-1.5 font-mono font-semibold">[{selectedDistrictMetric.crop}]</span>
            )}
          </span>
        </div>

        {/* Status Badge */}
        {!hasCropData ? (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 bg-[#D2D8CA] text-[#526458] border border-[#CCD2C4]" title="Crop not commercially monitored in this district">
            <ShieldAlert className="w-3 h-3" />
            <span>NOT GROWN</span>
          </span>
        ) : (
          <span
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 shrink-0 ${
              isFailure
                ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                : 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
            }`}
          >
            {isFailure ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
            <span>{isFailure ? 'DES FAILURE' : 'DES RESILIENT'}</span>
          </span>
        )}
      </div>

      {/* 3. 2x2 Metric Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Metric 1: Observed Yield */}
        <div className="p-2.5 rounded-xl bg-[#EAECE4] border border-[#CCD2C4]">
          <span className="text-[9px] text-[#526458] uppercase font-mono block">
            Observed Yield
          </span>
          <span className="text-base font-bold font-mono text-[#16221B] block mt-0.5">
            {selectedDistrictMetric?.yieldTonnesHa !== null && selectedDistrictMetric?.yieldTonnesHa !== undefined
              ? `${selectedDistrictMetric.yieldTonnesHa.toFixed(2)} t/ha`
              : 'N/A'}
          </span>
          <span className="text-[9px] text-[#718277] font-mono block">
            Harvest yield (DES)
          </span>
        </div>

        {/* Metric 2: 5-Yr Baseline Yield */}
        <div className="p-2.5 rounded-xl bg-[#EAECE4] border border-[#CCD2C4]">
          <span className="text-[9px] text-[#526458] uppercase font-mono block">
            5-Yr Baseline Yield
          </span>
          <span className="text-base font-bold font-mono text-[#16221B] block mt-0.5">
            {selectedDistrictMetric?.baselineYieldTonnesHa !== null && selectedDistrictMetric?.baselineYieldTonnesHa !== undefined
              ? `${selectedDistrictMetric.baselineYieldTonnesHa.toFixed(2)} t/ha`
              : 'N/A'}
          </span>
          <span className="text-[9px] text-[#718277] font-mono block">
            Zero-leakage prior mean
          </span>
        </div>

        {/* Metric 3: Yield Departure */}
        <div className="p-2.5 rounded-xl bg-[#EAECE4] border border-[#CCD2C4]">
          <span className="text-[9px] text-[#526458] uppercase font-mono block">
            Yield Departure
          </span>
          <span
            className={`text-base font-bold font-mono block mt-0.5 ${
              (selectedDistrictMetric?.yieldAnomalyPct ?? 0) < -10
                ? 'text-[#DC2626]'
                : 'text-[#16A34A]'
            }`}
          >
            {selectedDistrictMetric?.yieldAnomalyPct !== null && selectedDistrictMetric?.yieldAnomalyPct !== undefined
              ? `${selectedDistrictMetric.yieldAnomalyPct > 0 ? '+' : ''}${selectedDistrictMetric.yieldAnomalyPct.toFixed(1)}%`
              : 'N/A'}
          </span>
          <span className="text-[9px] text-[#718277] font-mono block">
            vs. 5-yr baseline
          </span>
        </div>

        {/* Metric 4: Monsoon Rainfall */}
        <div className="p-2.5 rounded-xl bg-[#EAECE4] border border-[#CCD2C4]">
          <span className="text-[9px] text-[#526458] uppercase font-mono block">
            Monsoon Rainfall
          </span>
          <span className="text-base font-bold font-mono text-[#16221B] block mt-0.5">
            {selectedDistrictMetric?.rainfallMm !== null && selectedDistrictMetric?.rainfallMm !== undefined
              ? `${Math.round(selectedDistrictMetric.rainfallMm).toLocaleString()} mm`
              : 'N/A'}
          </span>
          <span className="text-[9px] text-[#718277] font-mono block">
            Gridded IMD 0.25°
          </span>
        </div>
      </div>

      {/* 4. Key Environmental Observations */}
      <div className="space-y-1.5 pt-1.5 border-t border-[#CCD2C4]">
        <span className="text-[11px] font-bold text-[#16221B] block">Environmental Observations</span>
        <div className="grid grid-cols-3 gap-2">
          {/* Rainfall Badge */}
          <div className="p-2 rounded-xl bg-[#EAECE4] border border-[#CCD2C4] flex flex-col justify-between">
            <div className="flex items-center gap-1 text-[#0284C7]">
              <CloudRain className="w-3 h-3" />
              <span className="text-[9px] font-bold">Rainfall</span>
            </div>
            <span className="text-[11px] font-mono text-[#16221B] mt-0.5 font-bold">
              {selectedDistrictMetric?.rainfallMm !== null && selectedDistrictMetric?.rainfallMm !== undefined
                ? `${Math.round(selectedDistrictMetric.rainfallMm)} mm`
                : 'N/A'}
            </span>
          </div>

          {/* El Niño Badge */}
          <div className="p-2 rounded-xl bg-[#EAECE4] border border-[#CCD2C4] flex flex-col justify-between">
            <div className="flex items-center gap-1 text-[#DC2626]">
              <Thermometer className="w-3 h-3" />
              <span className="text-[9px] font-bold">El Niño</span>
            </div>
            <span className="text-[11px] font-mono text-[#16221B] mt-0.5 font-bold">
              {oniInfo
                ? `${oniInfo.meanEarlyWarningSstAnomaly > 0 ? '+' : ''}${oniInfo.meanEarlyWarningSstAnomaly.toFixed(1)}°C`
                : 'N/A'}
            </span>
          </div>

          {/* Cropland Area Badge */}
          <div className="p-2 rounded-xl bg-[#EAECE4] border border-[#CCD2C4] flex flex-col justify-between">
            <div className="flex items-center gap-1 text-[#12382B]">
              <Sprout className="w-3 h-3" />
              <span className="text-[9px] font-bold">Cropland</span>
            </div>
            <span className="text-[11px] font-mono text-[#16221B] mt-0.5 font-bold">
              {(selectedDistrictInfo.normalKharifAreaHa / 1000).toFixed(0)}k ha
            </span>
          </div>
        </div>
      </div>

      {/* 5. District Comparison Table */}
      <div className="space-y-1.5 pt-1.5 border-t border-[#CCD2C4]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#16221B]">District Comparison</span>
          <div className="relative w-32">
            <Search className="w-3 h-3 text-[#526458] absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={comparisonSearch}
              onChange={e => setComparisonSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-6 pr-2 py-0.5 bg-white border border-[#CCD2C4] rounded-lg text-[10px] text-[#16221B] focus:outline-hidden font-mono placeholder:text-[#889B8F]"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-36 border border-[#CCD2C4] rounded-xl bg-white">
          <table className="w-full text-left text-[10px] font-mono">
            <thead className="bg-[#EAECE4] text-[#526458] sticky top-0 border-b border-[#CCD2C4]">
              <tr>
                <th className="py-1.5 px-2 font-sans font-semibold">District</th>
                <th className="py-1.5 px-1.5 text-right">Yield</th>
                <th className="py-1.5 px-1.5 text-right">Baseline</th>
                <th className="py-1.5 px-1.5 text-right">Departure</th>
                <th className="py-1.5 px-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CCD2C4]">
              {comparisonDistricts.map(d => {
                const metric = currentYearMetrics[d.id];
                const isFail = metric?.failureEvent === 1;
                const isSelected = selectedDistrictId === d.id;

                return (
                  <tr
                    key={d.id}
                    onClick={() => setSelectedDistrictId(d.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#D9E2D5] font-semibold text-[#12382B]' : 'hover:bg-[#F2F4EE]'
                    }`}
                  >
                    <td className="py-1 px-2 text-[#16221B] font-medium">{d.name}</td>
                    <td className="py-1 px-1.5 text-right text-[#526458]">
                      {metric?.yieldTonnesHa !== null && metric?.yieldTonnesHa !== undefined
                        ? metric.yieldTonnesHa.toFixed(2)
                        : '—'}
                    </td>
                    <td className="py-1 px-1.5 text-right text-[#718277]">
                      {metric?.baselineYieldTonnesHa !== null && metric?.baselineYieldTonnesHa !== undefined
                        ? metric.baselineYieldTonnesHa.toFixed(2)
                        : '—'}
                    </td>
                    <td
                      className={`py-1 px-1.5 text-right font-bold ${
                        isFail ? 'text-[#DC2626]' : 'text-[#16A34A]'
                      }`}
                    >
                      {metric?.yieldAnomalyPct !== null && metric?.yieldAnomalyPct !== undefined
                        ? `${metric.yieldAnomalyPct > 0 ? '+' : ''}${metric.yieldAnomalyPct.toFixed(1)}%`
                        : '—'}
                    </td>
                    <td className="py-1 px-2 text-center">
                      <span
                        className={`px-1 py-0.2 rounded text-[8.5px] font-bold ${
                          isFail
                            ? 'bg-[#FEE2E2] text-[#DC2626]'
                            : 'bg-[#DCFCE7] text-[#16A34A]'
                        }`}
                      >
                        {isFail ? 'Fail' : 'OK'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Region-wise Status Breakdown */}
      <div className="space-y-1 pt-1.5 border-t border-[#CCD2C4]">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#16221B]">
          <span>Region-wise Status</span>
          <div className="flex items-center gap-2 text-[9px] font-mono text-[#526458]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span> Fail
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span> Resilient
            </span>
          </div>
        </div>

        <div className="space-y-1 text-[10px] font-mono">
          {(['Konkan', 'Western MH', 'Marathwada', 'Vidarbha'] as const).map(regionName => {
            const stats = getRegionStats(regionName);
            return (
              <div key={regionName} className="space-y-0.5">
                <div className="flex justify-between text-[#526458] text-[9.5px]">
                  <span>{regionName} ({stats.total})</span>
                  <span>{stats.failurePct}% Fail / {stats.resilientPct}% Resilient</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#CCD2C4] flex overflow-hidden border border-[#B8BFB0]">
                  <div className="h-full bg-[#DC2626]" style={{ width: `${stats.failurePct}%` }} />
                  <div className="h-full bg-[#16A34A]" style={{ width: `${stats.resilientPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Secondary Collapsibles */}
      <div className="space-y-1.5 pt-1.5 border-t border-[#CCD2C4]">
        <Collapsible
          title={`Historical Multi-Year Trend (${selectedDistrictInfo.name})`}
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          defaultOpen={false}
        >
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-[#526458] pb-1 border-b border-[#CCD2C4]">
              <span>Year</span>
              <span className="text-right">Yield</span>
              <span className="text-right">Rain</span>
              <span className="text-right">Status</span>
            </div>
            {districtHistoricalSeries.map(row => (
              <div
                key={row.year}
                className={`grid grid-cols-4 gap-1 text-[10px] font-mono py-0.5 ${
                  row.year === selectedYear ? 'text-[#0284C7] font-bold bg-[#0284C7]/10 px-1 rounded' : 'text-[#526458]'
                }`}
              >
                <span>{row.year}</span>
                <span className="text-right">
                  {row.yieldTonnesHa !== null ? `${row.yieldTonnesHa.toFixed(2)} t` : '—'}
                </span>
                <span className="text-right">
                  {row.rainfallMm !== null ? `${Math.round(row.rainfallMm)}` : '—'}
                </span>
                <span
                  className={`text-right font-bold ${
                    row.yieldTonnesHa === null
                      ? 'text-[#718277]'
                      : row.failure
                      ? 'text-[#DC2626]'
                      : 'text-[#16A34A]'
                  }`}
                >
                  {row.yieldTonnesHa === null ? 'N/A' : row.failure ? 'Fail' : 'OK'}
                </span>
              </div>
            ))}
          </div>
        </Collapsible>

        <Collapsible
          title="Satellite Biophysical Indicators (NDVI, etc.)"
          icon={<Layers className="w-3.5 h-3.5" />}
          defaultOpen={false}
        >
          <div className="space-y-1 text-[10px] font-mono">
            <div className="flex justify-between py-0.5 border-b border-[#CCD2C4]/60">
              <span className="text-[#526458]">Tensor Dimensions:</span>
              <span className="text-[#16221B] font-bold">{TENSOR_SPEC.spatialTensorShape}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-[#CCD2C4]/60">
              <span className="text-[#526458]">Temporal Windows:</span>
              <span className="text-[#16221B]">6 bi-weekly (Jun 1 – Aug 31)</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-[#CCD2C4]/60">
              <span className="text-[#526458]">Channels (8 Bands):</span>
              <span className="text-[#16221B]">B2, B3, B4, B8, B11, B12, NDVI, NDWI</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-[#CCD2C4]/60">
              <span className="text-[#526458]">Parcel Purity Mask:</span>
              <span className="text-[#16221B]">ESA WorldCover 10m Class 40</span>
            </div>
          </div>
        </Collapsible>
      </div>
    </div>
  );
};
