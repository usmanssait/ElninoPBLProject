import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useAppTheme } from '../../context/ThemeContext';
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

  const { isDark } = useAppTheme();
  const [comparisonSearch, setComparisonSearch] = useState('');

  const hasCropData = selectedDistrictMetric?.hasDesRecord;
  const isFailure = selectedDistrictMetric?.failureEvent === 1;

  // Multi-year series for selected district
  const districtHistoricalSeries = useMemo(() => {
    return availableYears.map(yr => {
      const metric = allYearMetrics[yr]?.[selectedDistrictId];
      return {
        year: yr,
        yieldTonnesHa: metric?.yieldTonnesHa ?? null,
        rainfallMm: metric?.rainfallMm ?? null,
        failure: metric?.failureEvent === 1,
      };
    });
  }, [availableYears, allYearMetrics, selectedDistrictId]);

  // Filtered comparison list
  const comparisonDistricts = useMemo(() => {
    return monitoredDistrictsForCrop.filter(d =>
      d.name.toLowerCase().includes(comparisonSearch.toLowerCase())
    );
  }, [comparisonSearch, monitoredDistrictsForCrop]);

  // Region-wise statistics helper based on active crop districts
  const getRegionStats = (regionName: string) => {
    const dists = monitoredDistrictsForCrop.filter(d => {
      if (regionName === 'Konkan') return d.division === 'Konkan';
      if (regionName === 'Western MH') return d.division === 'Pune' || d.division === 'Nashik';
      if (regionName === 'Marathwada') return d.division === 'Chhatrapati Sambhajinagar';
      if (regionName === 'Vidarbha') return d.division === 'Nagpur' || d.division === 'Amravati';
      return false;
    });

    const total = dists.length;
    if (total === 0) return { total: 0, failCount: 0, resilientCount: 0, failurePct: 0, resilientPct: 0 };

    const failCount = dists.filter(d => currentYearMetrics[d.id]?.failureEvent === 1).length;
    const resilientCount = total - failCount;
    const failurePct = Math.round((failCount / total) * 100);
    const resilientPct = 100 - failurePct;

    return { total, failCount, resilientCount, failurePct, resilientPct };
  };

  return (
    <div
      className={`rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-xs transition-colors space-y-3 ${
        isDark
          ? 'bg-[#091410] border border-[#14261F]'
          : 'bg-[#E2E6DC] border border-[#CCD2C4]'
      } ${className}`}
    >
      {/* 1. Header with Crop & Year Pickers */}
      <div
        className={`flex flex-col gap-2 pb-2.5 border-b ${
          isDark ? 'border-[#14261F]' : 'border-[#CCD2C4]'
        }`}
      >
        <div
          className={`flex items-center justify-between text-xs font-mono font-medium ${
            isDark ? 'text-[#7A9187]' : 'text-[#526458]'
          }`}
        >
          <span>Kharif {cropYearStr} &bull; Ground Truth Analysis</span>
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
              className={`rounded-xl px-2.5 py-2 text-xs font-mono cursor-pointer focus:outline-hidden transition-colors shadow-xs ${
                isDark
                  ? 'bg-[#060D0A] border border-[#14261F] text-white hover:border-[#22C55E]'
                  : 'bg-white border border-[#CCD2C4] text-[#16221B] hover:border-[#12382B]'
              }`}
            >
              {monitoredDistrictsForCrop.map(d => (
                <option
                  key={d.id}
                  value={d.id}
                  className={isDark ? 'bg-[#060D0A] text-white' : 'bg-white text-[#16221B]'}
                >
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {onDownloadCsv && (
            <button
              onClick={onDownloadCsv}
              type="button"
              className={`p-2 rounded-xl border transition-all cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-[#060D0A] border-[#14261F] text-[#7A9187] hover:text-white hover:border-[#22C55E]'
                  : 'bg-white border-[#CCD2C4] text-[#526458] hover:text-[#12382B] hover:border-[#12382B]'
              }`}
              title="Download CSV"
            >
              <Download className={`w-3.5 h-3.5 ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`} />
            </button>
          )}
        </div>
      </div>

      {/* 2. District Title & Status Badge */}
      <div className="flex items-start justify-between gap-2.5">
        <div>
          <h3
            className={`text-xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-[#16221B]'
            }`}
          >
            {selectedDistrictInfo.name}
          </h3>
          <span
            className={`text-[11px] font-medium block mt-0.5 ${
              isDark ? 'text-[#80978E]' : 'text-[#526458]'
            }`}
          >
            {selectedDistrictInfo.division} Division &bull; {selectedDistrictInfo.agroZone}
            {selectedDistrictMetric?.crop && (
              <span
                className={`ml-1.5 font-mono font-semibold ${
                  isDark ? 'text-[#22C55E]' : 'text-[#12382B]'
                }`}
              >
                [{selectedDistrictMetric.crop}]
              </span>
            )}
          </span>
        </div>

        {/* Status Badge */}
        {!hasCropData ? (
          <span
            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 border ${
              isDark
                ? 'bg-[#14221C] text-[#7A9187] border-[#23332A]'
                : 'bg-[#D2D8CA] text-[#526458] border-[#CCD2C4]'
            }`}
            title="Crop not commercially monitored in this district"
          >
            <ShieldAlert className="w-3 h-3" />
            <span>NOT GROWN</span>
          </span>
        ) : (
          <span
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 shrink-0 border ${
              isFailure
                ? isDark
                  ? 'bg-[#281313] text-[#D93838] border-[#4D1D1D]'
                  : 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]'
                : isDark
                ? 'bg-[#0E281F] text-[#22C55E] border-[#173D2C]'
                : 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]'
            }`}
          >
            {isFailure ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
            <span>{isFailure ? 'DES OBSERVED FAILURE' : 'DES OBSERVED RESILIENT'}</span>
          </span>
        )}
      </div>

      {/* 3. 2x2 Metric Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Metric 1: Observed Yield */}
        <div
          className={`p-2.5 rounded-xl border ${
            isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-[#EAECE4] border-[#CCD2C4]'
          }`}
        >
          <span
            className={`text-[9px] uppercase font-mono block ${
              isDark ? 'text-[#7A9187]' : 'text-[#526458]'
            }`}
          >
            Observed Yield
          </span>
          <span
            className={`text-base font-bold font-mono block mt-0.5 ${
              isDark ? 'text-white' : 'text-[#16221B]'
            }`}
          >
            {selectedDistrictMetric?.yieldTonnesHa !== null && selectedDistrictMetric?.yieldTonnesHa !== undefined
              ? `${selectedDistrictMetric.yieldTonnesHa.toFixed(2)} t/ha`
              : 'N/A'}
          </span>
          <span
            className={`text-[9.5px] font-mono block ${
              isDark ? 'text-[#7A9187]' : 'text-[#718277]'
            }`}
          >
            Baseline: {selectedDistrictMetric?.baselineYieldTonnesHa?.toFixed(2) ?? '—'} t
          </span>
        </div>

        {/* Metric 2: Yield Departure */}
        <div
          className={`p-2.5 rounded-xl border ${
            isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-[#EAECE4] border-[#CCD2C4]'
          }`}
        >
          <span
            className={`text-[9px] uppercase font-mono block ${
              isDark ? 'text-[#7A9187]' : 'text-[#526458]'
            }`}
          >
            Yield Departure
          </span>
          <span
            className={`text-base font-bold font-mono block mt-0.5 ${
              isFailure
                ? isDark
                  ? 'text-[#D93838]'
                  : 'text-[#DC2626]'
                : isDark
                ? 'text-[#22C55E]'
                : 'text-[#16A34A]'
            }`}
          >
            {selectedDistrictMetric?.yieldAnomalyPct !== null && selectedDistrictMetric?.yieldAnomalyPct !== undefined
              ? `${selectedDistrictMetric.yieldAnomalyPct > 0 ? '+' : ''}${selectedDistrictMetric.yieldAnomalyPct.toFixed(1)}%`
              : 'N/A'}
          </span>
          <span
            className={`text-[9.5px] font-mono block ${
              isDark ? 'text-[#7A9187]' : 'text-[#718277]'
            }`}
          >
            Threshold: &minus;10% deficit
          </span>
        </div>

        {/* Metric 3: IMD Monsoon Rain */}
        <div
          className={`p-2.5 rounded-xl border ${
            isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-[#EAECE4] border-[#CCD2C4]'
          }`}
        >
          <span
            className={`text-[9px] uppercase font-mono block ${
              isDark ? 'text-[#7A9187]' : 'text-[#526458]'
            }`}
          >
            IMD Monsoon Rain
          </span>
          <span
            className={`text-base font-bold font-mono block mt-0.5 ${
              isDark ? 'text-white' : 'text-[#16221B]'
            }`}
          >
            {selectedDistrictMetric?.rainfallMm !== null && selectedDistrictMetric?.rainfallMm !== undefined
              ? `${Math.round(selectedDistrictMetric.rainfallMm)} mm`
              : 'N/A'}
          </span>
          <span
            className={`text-[9.5px] font-mono block ${
              isDark ? 'text-[#7A9187]' : 'text-[#718277]'
            }`}
          >
            June 1 – August 31
          </span>
        </div>

        {/* Metric 4: Model Early Warning */}
        <div
          className={`p-2.5 rounded-xl border ${
            isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-[#EAECE4] border-[#CCD2C4]'
          }`}
        >
          <span
            className={`text-[9px] uppercase font-mono block ${
              isDark ? 'text-[#7A9187]' : 'text-[#526458]'
            }`}
          >
            Model Early Warning
          </span>
          <span
            className={`text-base font-bold font-mono block mt-0.5 ${
              isDark ? 'text-[#22C55E]' : 'text-[#12382B]'
            }`}
          >
            T-60 to T-75d
          </span>
          <span
            className={`text-[9.5px] font-mono block ${
              isDark ? 'text-[#7A9187]' : 'text-[#718277]'
            }`}
          >
            Pre-harvest lead time
          </span>
        </div>
      </div>

      {/* 4. Key Environmental Observations */}
      <div
        className={`space-y-1.5 pt-1.5 border-t ${
          isDark ? 'border-[#14261F]/60' : 'border-[#CCD2C4]'
        }`}
      >
        <span
          className={`text-[11px] font-bold block ${
            isDark ? 'text-white' : 'text-[#16221B]'
          }`}
        >
          Environmental Observations
        </span>
        <div className="grid grid-cols-3 gap-2">
          {/* Rainfall Badge */}
          <div
            className={`p-2 rounded-xl border flex flex-col justify-between ${
              isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-[#EAECE4] border-[#CCD2C4]'
            }`}
          >
            <div className={`flex items-center gap-1 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`}>
              <CloudRain className="w-3 h-3" />
              <span className={`text-[9px] font-bold ${isDark ? 'text-[#A4B8AF]' : ''}`}>Rainfall</span>
            </div>
            <span
              className={`text-[11px] font-mono mt-0.5 font-bold ${
                isDark ? 'text-white' : 'text-[#16221B]'
              }`}
            >
              {selectedDistrictMetric?.rainfallMm !== null && selectedDistrictMetric?.rainfallMm !== undefined
                ? `${Math.round(selectedDistrictMetric.rainfallMm)} mm`
                : 'N/A'}
            </span>
          </div>

          {/* El Niño Badge */}
          <div
            className={`p-2 rounded-xl border flex flex-col justify-between ${
              isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-[#EAECE4] border-[#CCD2C4]'
            }`}
          >
            <div className={`flex items-center gap-1 ${isDark ? 'text-[#D93838]' : 'text-[#DC2626]'}`}>
              <Thermometer className="w-3 h-3" />
              <span className={`text-[9px] font-bold ${isDark ? 'text-[#A4B8AF]' : ''}`}>El Niño</span>
            </div>
            <span
              className={`text-[11px] font-mono mt-0.5 font-bold ${
                isDark ? 'text-white' : 'text-[#16221B]'
              }`}
            >
              {oniInfo
                ? `${oniInfo.meanEarlyWarningSstAnomaly > 0 ? '+' : ''}${oniInfo.meanEarlyWarningSstAnomaly.toFixed(1)}°C`
                : 'N/A'}
            </span>
          </div>

          {/* Cropland Area Badge */}
          <div
            className={`p-2 rounded-xl border flex flex-col justify-between ${
              isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-[#EAECE4] border-[#CCD2C4]'
            }`}
          >
            <div className={`flex items-center gap-1 ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`}>
              <Sprout className="w-3 h-3" />
              <span className={`text-[9px] font-bold ${isDark ? 'text-[#A4B8AF]' : ''}`}>Cropland</span>
            </div>
            <span
              className={`text-[11px] font-mono mt-0.5 font-bold ${
                isDark ? 'text-white' : 'text-[#16221B]'
              }`}
            >
              {(selectedDistrictInfo.normalKharifAreaHa / 1000).toFixed(0)}k ha
            </span>
          </div>
        </div>
      </div>

      {/* 5. District Comparison Table */}
      <div
        className={`space-y-1.5 pt-1.5 border-t ${
          isDark ? 'border-[#14261F]/60' : 'border-[#CCD2C4]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-bold ${
              isDark ? 'text-white' : 'text-[#16221B]'
            }`}
          >
            District Comparison
          </span>
          <div className="relative w-32">
            <Search
              className={`w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-[#7A9187]' : 'text-[#526458]'
              }`}
            />
            <input
              type="text"
              value={comparisonSearch}
              onChange={e => setComparisonSearch(e.target.value)}
              placeholder="Search..."
              className={`w-full pl-6 pr-2 py-0.5 rounded-lg text-[10px] focus:outline-hidden font-mono ${
                isDark
                  ? 'bg-[#060D0A] border border-[#14261F] text-white placeholder:text-[#526458]'
                  : 'bg-white border border-[#CCD2C4] text-[#16221B] placeholder:text-[#889B8F]'
              }`}
            />
          </div>
        </div>

        <div
          className={`overflow-x-auto max-h-36 rounded-xl border ${
            isDark ? 'border-[#14261F] bg-[#060D0A]' : 'border-[#CCD2C4] bg-white'
          }`}
        >
          <table className="w-full text-left text-[10px] font-mono">
            <thead
              className={`sticky top-0 border-b ${
                isDark
                  ? 'bg-[#091410] text-[#7A9187] border-[#14261F]'
                  : 'bg-[#EAECE4] text-[#526458] border-[#CCD2C4]'
              }`}
            >
              <tr>
                <th className="py-1.5 px-2 font-sans font-semibold">District</th>
                <th className="py-1.5 px-1.5 text-right">Yield</th>
                <th className="py-1.5 px-1.5 text-right">Baseline</th>
                <th className="py-1.5 px-1.5 text-right">Departure</th>
                <th className="py-1.5 px-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#14261F]' : 'divide-[#CCD2C4]'}`}>
              {comparisonDistricts.map(d => {
                const metric = currentYearMetrics[d.id];
                const isFail = metric?.failureEvent === 1;
                const isSelected = selectedDistrictId === d.id;

                return (
                  <tr
                    key={d.id}
                    onClick={() => setSelectedDistrictId(d.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? isDark
                          ? 'bg-[#0E241B] text-white font-semibold shadow-xs'
                          : 'bg-[#12382B] text-white font-semibold shadow-xs'
                        : isDark
                        ? 'hover:bg-[#091611]'
                        : 'hover:bg-[#F2F4EE]'
                    }`}
                  >
                    <td
                      className={`py-1 px-2 font-medium ${
                        isSelected ? 'text-white' : isDark ? 'text-white' : 'text-[#16221B]'
                      }`}
                    >
                      {d.name}
                    </td>
                    <td
                      className={`py-1 px-1.5 text-right ${
                        isSelected
                          ? 'text-emerald-100'
                          : isDark
                          ? 'text-[#A4B8AF]'
                          : 'text-[#526458]'
                      }`}
                    >
                      {metric?.yieldTonnesHa !== null && metric?.yieldTonnesHa !== undefined
                        ? metric.yieldTonnesHa.toFixed(2)
                        : '—'}
                    </td>
                    <td
                      className={`py-1 px-1.5 text-right ${
                        isSelected
                          ? 'text-emerald-200/70'
                          : isDark
                          ? 'text-[#7A9187]'
                          : 'text-[#718277]'
                      }`}
                    >
                      {metric?.baselineYieldTonnesHa !== null && metric?.baselineYieldTonnesHa !== undefined
                        ? metric.baselineYieldTonnesHa.toFixed(2)
                        : '—'}
                    </td>
                    <td
                      className={`py-1 px-1.5 text-right font-bold ${
                        isSelected
                          ? isFail
                            ? 'text-red-300'
                            : 'text-emerald-300'
                          : isFail
                          ? isDark
                            ? 'text-[#D93838]'
                            : 'text-[#DC2626]'
                          : isDark
                          ? 'text-[#22C55E]'
                          : 'text-[#16A34A]'
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
                            ? isDark
                              ? 'bg-[#2E1212] text-[#D93838]'
                              : 'bg-[#FEE2E2] text-[#DC2626]'
                            : isDark
                            ? 'bg-[#0E281F] text-[#22C55E]'
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
      <div
        className={`space-y-1 pt-1.5 border-t ${
          isDark ? 'border-[#14261F]/60' : 'border-[#CCD2C4]'
        }`}
      >
        <div
          className={`flex items-center justify-between text-[11px] font-bold ${
            isDark ? 'text-white' : 'text-[#16221B]'
          }`}
        >
          <span>Region-wise Status</span>
          <div
            className={`flex items-center gap-2 text-[9px] font-mono ${
              isDark ? 'text-[#7A9187]' : 'text-[#526458]'
            }`}
          >
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#D93838]' : 'bg-[#D46A64]'}`}></span> Fail
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#22C55E]' : 'bg-[#44A07A]'}`}></span> Resilient
            </span>
          </div>
        </div>

        <div className="space-y-1.5 text-[10px] font-mono">
          {(['Konkan', 'Western MH', 'Marathwada', 'Vidarbha'] as const).map(regionName => {
            const stats = getRegionStats(regionName);
            return (
              <div key={regionName} className="space-y-0.5">
                <div
                  className={`flex justify-between text-[9.5px] ${
                    isDark ? 'text-[#A4B8AF]' : 'text-[#526458]'
                  }`}
                >
                  <span
                    className={`font-semibold ${
                      isDark ? 'text-white' : 'text-[#16221B]'
                    }`}
                  >
                    {regionName} ({stats.total})
                  </span>
                  <span>
                    {stats.failurePct}% Fail / {stats.resilientPct}% Resilient
                  </span>
                </div>
                {/* Clean Theme-Aware Status Bar Track */}
                <div
                  className={`h-2 w-full rounded-full flex overflow-hidden border ${
                    isDark
                      ? 'bg-[#060D0A] border-[#14261F]'
                      : 'bg-[#CCD2C4] border-[#B8BFB0]'
                  }`}
                >
                  <div
                    className={`h-full transition-all duration-300 ${isDark ? 'bg-[#D93838]' : 'bg-[#D46A64]'}`}
                    style={{ width: `${stats.failurePct}%` }}
                    title={`${regionName} Fail: ${stats.failurePct}%`}
                  />
                  <div
                    className={`h-full transition-all duration-300 ${isDark ? 'bg-[#22C55E]' : 'bg-[#44A07A]'}`}
                    style={{ width: `${stats.resilientPct}%` }}
                    title={`${regionName} Resilient: ${stats.resilientPct}%`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Secondary Collapsibles */}
      <div
        className={`space-y-1.5 pt-1.5 border-t ${
          isDark ? 'border-[#14261F]/60' : 'border-[#CCD2C4]'
        }`}
      >
        <Collapsible
          title={`Historical Multi-Year Trend (${selectedDistrictInfo.name})`}
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          defaultOpen={false}
        >
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            <div
              className={`grid grid-cols-4 gap-1 text-[9px] font-mono pb-1 border-b ${
                isDark ? 'border-[#14261F] text-[#7A9187]' : 'border-[#CCD2C4] text-[#526458]'
              }`}
            >
              <span>Year</span>
              <span className="text-right">Yield</span>
              <span className="text-right">Rain</span>
              <span className="text-right">Status</span>
            </div>
            {districtHistoricalSeries.map(row => (
              <div
                key={row.year}
                className={`grid grid-cols-4 gap-1 text-[10px] font-mono py-0.5 ${
                  row.year === selectedYear
                    ? isDark
                      ? 'text-[#38BDF8] font-bold bg-[#0C1F2B]/30 px-1 rounded'
                      : 'text-[#0284C7] font-bold bg-[#0284C7]/10 px-1 rounded'
                    : isDark
                    ? 'text-[#A4B8AF]'
                    : 'text-[#526458]'
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
                      ? isDark
                        ? 'text-[#647C72]'
                        : 'text-[#718277]'
                      : row.failure
                      ? isDark
                        ? 'text-[#D93838]'
                        : 'text-[#DC2626]'
                      : isDark
                      ? 'text-[#22C55E]'
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
            <div
              className={`flex justify-between py-0.5 border-b ${
                isDark ? 'border-[#14261F]/60' : 'border-[#CCD2C4]/60'
              }`}
            >
              <span className={isDark ? 'text-[#7A9187]' : 'text-[#526458]'}>Tensor Dimensions:</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                {TENSOR_SPEC.spatialTensorShape}
              </span>
            </div>
            <div
              className={`flex justify-between py-0.5 border-b ${
                isDark ? 'border-[#14261F]/60' : 'border-[#CCD2C4]/60'
              }`}
            >
              <span className={isDark ? 'text-[#7A9187]' : 'text-[#526458]'}>Temporal Windows:</span>
              <span className={isDark ? 'text-white' : 'text-[#16221B]'}>
                6 bi-weekly (Jun 1 – Aug 31)
              </span>
            </div>
            <div
              className={`flex justify-between py-0.5 border-b ${
                isDark ? 'border-[#14261F]/60' : 'border-[#CCD2C4]/60'
              }`}
            >
              <span className={isDark ? 'text-[#7A9187]' : 'text-[#526458]'}>Channels (8 Bands):</span>
              <span className={isDark ? 'text-white' : 'text-[#16221B]'}>
                B2, B3, B4, B8, B11, B12, NDVI, NDWI
              </span>
            </div>
            <div
              className={`flex justify-between py-0.5 border-b ${
                isDark ? 'border-[#14261F]/60' : 'border-[#CCD2C4]/60'
              }`}
            >
              <span className={isDark ? 'text-[#7A9187]' : 'text-[#526458]'}>Parcel Purity Mask:</span>
              <span className={isDark ? 'text-white' : 'text-[#16221B]'}>
                ESA WorldCover 10m Class 40
              </span>
            </div>
          </div>
        </Collapsible>
      </div>
    </div>
  );
};
