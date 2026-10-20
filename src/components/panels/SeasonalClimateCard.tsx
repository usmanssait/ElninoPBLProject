import React from 'react';
import { CloudRain, Thermometer, Sprout } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

interface SeasonalClimateCardProps {
  className?: string;
}

export const SeasonalClimateCard: React.FC<SeasonalClimateCardProps> = ({ className = '' }) => {
  const { cropYearStr, stateMeanRainfallMm, oniInfo, historicalTotalDistricts } = useDashboard();

  return (
    <div
      className={`rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] p-3.5 sm:p-4 flex flex-col justify-between shadow-xs ${className}`}
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#CCD2C4]">
        <span className="text-sm font-bold text-[#16221B] tracking-tight">
          Seasonal Climate Indices ({cropYearStr})
        </span>
        <span className="text-xs font-mono text-[#526458]">
          NOAA CPC &amp; IMD Observations
        </span>
      </div>

      {/* 2. Scaled 3 Metric Tiles filling available window */}
      <div className="flex-1 grid grid-cols-3 gap-2.5 my-2 min-h-[100px] items-stretch">
        {/* Metric 1: Rice Belt Rain */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-[#EAECE4] border border-[#CCD2C4] flex flex-col justify-between hover:border-[#0284C7]/40 transition-colors">
          <div className="flex items-center gap-1.5 text-xs text-[#526458] font-semibold">
            <CloudRain className="w-4 h-4 text-[#0284C7] shrink-0" />
            <span className="truncate">Rice Belt Rain</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#16221B] mt-1 tracking-tight">
            {stateMeanRainfallMm !== null ? `${stateMeanRainfallMm} mm` : 'N/A'}
          </div>
          <div className="text-[11px] sm:text-xs text-[#718277] font-mono leading-tight">
            June–August Mean
          </div>
        </div>

        {/* Metric 2: El Niño (ONI) */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-[#EAECE4] border border-[#CCD2C4] flex flex-col justify-between hover:border-[#DC2626]/40 transition-colors">
          <div className="flex items-center gap-1.5 text-xs text-[#526458] font-semibold">
            <Thermometer className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span className="truncate">El Niño (ONI)</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#16221B] mt-1 tracking-tight">
            {oniInfo
              ? `${oniInfo.meanEarlyWarningSstAnomaly > 0 ? '+' : ''}${oniInfo.meanEarlyWarningSstAnomaly.toFixed(1)}°C`
              : 'N/A'}
          </div>
          <div
            className={`text-[11px] sm:text-xs font-bold font-mono leading-tight ${
              oniInfo?.elNinoIndicator === 1 ? 'text-[#DC2626]' : 'text-[#16A34A]'
            }`}
          >
            {oniInfo?.ensoPhase || 'Neutral'}
          </div>
        </div>

        {/* Metric 3: Spatial Scope */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-[#EAECE4] border border-[#CCD2C4] flex flex-col justify-between hover:border-[#12382B]/40 transition-colors">
          <div className="flex items-center gap-1.5 text-xs text-[#526458] font-semibold">
            <Sprout className="w-4 h-4 text-[#12382B] shrink-0" />
            <span className="truncate">Spatial Scope</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#16221B] mt-1 tracking-tight">
            {historicalTotalDistricts} Dist.
          </div>
          <div className="text-[11px] sm:text-xs text-[#718277] font-mono leading-tight">
            Primary Rice Belt
          </div>
        </div>
      </div>

      {/* 3. Bottom Meta Row */}
      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-[#526458] pt-1.5 border-t border-[#CCD2C4]">
        <span>IMD Gridded: 0.25°</span>
        <span className="text-[#718277]">Pacific SST Niño 3.4 Early Warning</span>
      </div>
    </div>
  );
};
