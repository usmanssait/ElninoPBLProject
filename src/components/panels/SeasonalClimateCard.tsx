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
      className={`rounded-2xl bg-[#091410] border border-[#14261F] p-3.5 sm:p-4 flex flex-col justify-between shadow-xs ${className}`}
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#14261F]/60">
        <span className="text-sm font-bold text-white tracking-tight">
          Seasonal Climate Indices ({cropYearStr})
        </span>
        <span className="text-xs font-mono text-[#80978E]">
          NOAA CPC &amp; IMD Observations
        </span>
      </div>

      {/* 2. Scaled 3 Metric Tiles filling available window */}
      <div className="flex-1 grid grid-cols-3 gap-2.5 my-2 min-h-[100px] items-stretch">
        {/* Metric 1: Rice Belt Rain */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-[#060D0A] border border-[#14261F] flex flex-col justify-between hover:border-[#38BDF8]/40 transition-colors">
          <div className="flex items-center gap-1.5 text-xs text-[#A4B8AF] font-semibold">
            <CloudRain className="w-4 h-4 text-[#38BDF8] shrink-0" />
            <span className="truncate">Rice Belt Rain</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-white mt-1 tracking-tight">
            {stateMeanRainfallMm !== null ? `${stateMeanRainfallMm} mm` : 'N/A'}
          </div>
          <div className="text-[11px] sm:text-xs text-[#7A9187] font-mono leading-tight">
            June–August Mean
          </div>
        </div>

        {/* Metric 2: El Niño (ONI) */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-[#060D0A] border border-[#14261F] flex flex-col justify-between hover:border-[#D93838]/40 transition-colors">
          <div className="flex items-center gap-1.5 text-xs text-[#A4B8AF] font-semibold">
            <Thermometer className="w-4 h-4 text-[#D93838] shrink-0" />
            <span className="truncate">El Niño (ONI)</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-white mt-1 tracking-tight">
            {oniInfo
              ? `${oniInfo.meanEarlyWarningSstAnomaly > 0 ? '+' : ''}${oniInfo.meanEarlyWarningSstAnomaly.toFixed(1)}°C`
              : 'N/A'}
          </div>
          <div
            className={`text-[11px] sm:text-xs font-bold font-mono leading-tight ${
              oniInfo?.elNinoIndicator === 1 ? 'text-[#D93838]' : 'text-[#22C55E]'
            }`}
          >
            {oniInfo?.ensoPhase || 'Neutral'}
          </div>
        </div>

        {/* Metric 3: Spatial Scope */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-[#060D0A] border border-[#14261F] flex flex-col justify-between hover:border-[#22C55E]/40 transition-colors">
          <div className="flex items-center gap-1.5 text-xs text-[#A4B8AF] font-semibold">
            <Sprout className="w-4 h-4 text-[#22C55E] shrink-0" />
            <span className="truncate">Spatial Scope</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-white mt-1 tracking-tight">
            {historicalTotalDistricts} Dist.
          </div>
          <div className="text-[11px] sm:text-xs text-[#7A9187] font-mono leading-tight">
            Primary Rice Belt
          </div>
        </div>
      </div>

      {/* 3. Bottom Meta Row */}
      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-[#7A9187] pt-1.5 border-t border-[#14261F]/60">
        <span>IMD Gridded: 0.25°</span>
        <span className="text-[#849B90]">Pacific SST Niño 3.4 Early Warning</span>
      </div>
    </div>
  );
};
