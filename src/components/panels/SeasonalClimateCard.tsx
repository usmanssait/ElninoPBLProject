import React from 'react';
import { CloudRain, Thermometer, Sprout } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useAppTheme } from '../../context/ThemeContext';

interface SeasonalClimateCardProps {
  className?: string;
}

export const SeasonalClimateCard: React.FC<SeasonalClimateCardProps> = ({ className = '' }) => {
  const { cropYearStr, stateMeanRainfallMm, oniInfo, historicalTotalDistricts } = useDashboard();
  const { isDark } = useAppTheme();

  return (
    <div
      className={`rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-xs transition-colors ${
        isDark
          ? 'bg-[#102019] border border-[#294338]'
          : 'bg-[#E2E6DC] border border-[#CCD2C4]'
      } ${className}`}
    >
      {/* 1. Header */}
      <div
        className={`flex items-center justify-between pb-2 border-b ${
          isDark ? 'border-[#294338]' : 'border-[#CCD2C4]'
        }`}
      >
        <span
          className={`text-sm font-bold tracking-tight ${
            isDark ? 'text-[#E5EEE8]' : 'text-[#16221B]'
          }`}
        >
          Seasonal Climate Indices ({cropYearStr})
        </span>
        <span className={`text-xs font-mono ${isDark ? 'text-[#9BAFA4]' : 'text-[#526458]'}`}>
          NOAA CPC &amp; IMD Observations
        </span>
      </div>

      {/* 2. Scaled 3 Metric Tiles filling available window */}
      <div className="flex-1 grid grid-cols-3 gap-2.5 my-2 min-h-[100px] items-stretch">
        {/* Metric 1: Rice Belt Rain */}
        <div
          className={`p-3 sm:p-3.5 rounded-xl border flex flex-col justify-between transition-colors ${
            isDark
              ? 'bg-[#14271F] border-[#294338] hover:border-[#38BDF8]/40'
              : 'bg-[#EAECE4] border-[#CCD2C4] hover:border-[#0284C7]/40'
          }`}
        >
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold ${
              isDark ? 'text-[#9BAFA4]' : 'text-[#526458]'
            }`}
          >
            <CloudRain
              className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`}
            />
            <span className="truncate">Rice Belt Rain</span>
          </div>
          <div
            className={`text-xl sm:text-2xl font-extrabold font-mono mt-1 tracking-tight ${
              isDark ? 'text-[#E5EEE8]' : 'text-[#16221B]'
            }`}
          >
            {stateMeanRainfallMm !== null ? `${stateMeanRainfallMm} mm` : 'N/A'}
          </div>
          <div
            className={`text-[11px] sm:text-xs font-mono leading-tight ${
              isDark ? 'text-[#9BAFA4]' : 'text-[#718277]'
            }`}
          >
            June–August Mean
          </div>
        </div>

        {/* Metric 2: El Niño (ONI) */}
        <div
          className={`p-3 sm:p-3.5 rounded-xl border flex flex-col justify-between transition-colors ${
            isDark
              ? 'bg-[#14271F] border-[#294338] hover:border-[#F87171]/40'
              : 'bg-[#EAECE4] border-[#CCD2C4] hover:border-[#DC2626]/40'
          }`}
        >
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold ${
              isDark ? 'text-[#9BAFA4]' : 'text-[#526458]'
            }`}
          >
            <Thermometer
              className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#F87171]' : 'text-[#DC2626]'}`}
            />
            <span className="truncate">El Niño (ONI)</span>
          </div>
          <div
            className={`text-xl sm:text-2xl font-extrabold font-mono mt-1 tracking-tight ${
              isDark ? 'text-[#E5EEE8]' : 'text-[#16221B]'
            }`}
          >
            {oniInfo
              ? `${oniInfo.meanEarlyWarningSstAnomaly > 0 ? '+' : ''}${oniInfo.meanEarlyWarningSstAnomaly.toFixed(1)}°C`
              : 'N/A'}
          </div>
          <div
            className={`text-[11px] sm:text-xs font-bold font-mono leading-tight ${
              oniInfo?.elNinoIndicator === 1
                ? isDark
                  ? 'text-[#F87171]'
                  : 'text-[#DC2626]'
                : isDark
                ? 'text-[#4ADE80]'
                : 'text-[#16A34A]'
            }`}
          >
            {oniInfo?.ensoPhase || 'Neutral'}
          </div>
        </div>

        {/* Metric 3: Spatial Scope */}
        <div
          className={`p-3 sm:p-3.5 rounded-xl border flex flex-col justify-between transition-colors ${
            isDark
              ? 'bg-[#14271F] border-[#294338] hover:border-[#39B8C4]/40'
              : 'bg-[#EAECE4] border-[#CCD2C4] hover:border-[#12382B]/40'
          }`}
        >
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold ${
              isDark ? 'text-[#9BAFA4]' : 'text-[#526458]'
            }`}
          >
            <Sprout
              className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#39B8C4]' : 'text-[#12382B]'}`}
            />
            <span className="truncate">Spatial Scope</span>
          </div>
          <div
            className={`text-xl sm:text-2xl font-extrabold font-mono mt-1 tracking-tight ${
              isDark ? 'text-[#E5EEE8]' : 'text-[#16221B]'
            }`}
          >
            {historicalTotalDistricts} Dist.
          </div>
          <div
            className={`text-[11px] sm:text-xs font-mono leading-tight ${
              isDark ? 'text-[#9BAFA4]' : 'text-[#718277]'
            }`}
          >
            Primary Rice Belt
          </div>
        </div>
      </div>

      {/* 3. Bottom Meta Row */}
      <div
        className={`flex items-center justify-between text-[10px] sm:text-[11px] font-mono pt-1.5 border-t ${
          isDark ? 'border-[#294338] text-[#9BAFA4]' : 'border-[#CCD2C4] text-[#526458]'
        }`}
      >
        <span>IMD Gridded: 0.25°</span>
        <span className={isDark ? 'text-[#647C6F]' : 'text-[#718277]'}>
          Pacific SST Niño 3.4 Early Warning
        </span>
      </div>
    </div>
  );
};
