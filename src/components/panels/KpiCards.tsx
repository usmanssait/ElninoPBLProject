import React from 'react';
import { Sprout, ShieldAlert, Clock, CloudRain, Thermometer } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

interface KpiCardsProps {
  className?: string;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ className = '' }) => {
  const {
    historicalTotalDistricts,
    historicalFailureCount,
    historicalResilientCount,
    stateMeanRainfallMm,
    oniInfo,
    selectedCrop,
  } = useDashboard();

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 ${className}`}>
      {/* 1. Total Districts */}
      <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between hover:border-[#1E3A2F] transition-colors shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[11px] text-[#7A9187] font-medium block">
            Total Districts
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {historicalTotalDistricts}
            </span>
            <span className="text-[10px] text-[#7A9187] font-mono">
              {selectedCrop === 'ALL' ? 'Monitored' : `${selectedCrop}`}
            </span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#0D241B] border border-[#173D2C] flex items-center justify-center text-[#22C55E] shrink-0">
          <Sprout className="w-5 h-5 text-[#22C55E]" />
        </div>
      </div>

      {/* 2. Failure Districts */}
      <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between hover:border-[#1E3A2F] transition-colors shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[11px] text-[#7A9187] font-medium block">
            Failure Districts
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#D93838]">
              {historicalFailureCount}
            </span>
            <span className="text-[11px] font-bold text-[#D93838] font-mono">
              {Math.round((historicalFailureCount / historicalTotalDistricts) * 100)}%
            </span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#281313] border border-[#4D1D1D] flex items-center justify-center text-[#D93838] shrink-0">
          <ShieldAlert className="w-5 h-5 text-[#D93838]" />
        </div>
      </div>

      {/* 3. Resilient Districts */}
      <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between hover:border-[#1E3A2F] transition-colors shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[11px] text-[#7A9187] font-medium block">
            Resilient Districts
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {historicalResilientCount}
            </span>
            <span className="text-[11px] font-bold text-[#22C55E] font-mono">
              {Math.round((historicalResilientCount / historicalTotalDistricts) * 100)}%
            </span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#0D241B] border border-[#173D2C] flex items-center justify-center text-[#22C55E] shrink-0">
          <Sprout className="w-5 h-5 text-[#22C55E]" />
        </div>
      </div>

      {/* 4. Forecast Lead Time */}
      <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between hover:border-[#1E3A2F] transition-colors shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[11px] text-[#7A9187] font-medium block">
            Forecast Lead Time
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-white">60–75 Days</span>
          </div>
          <span className="text-[10px] text-[#6A8177] font-mono block">
            August 31 evaluation
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#0D241B] border border-[#173D2C] flex items-center justify-center text-[#22C55E] shrink-0">
          <Clock className="w-5 h-5 text-[#22C55E]" />
        </div>
      </div>

      {/* 5. Monsoon Rainfall (IMD) */}
      <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between hover:border-[#1E3A2F] transition-colors shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[11px] text-[#7A9187] font-medium block">
            Monsoon Rainfall (IMD)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-white">
              {stateMeanRainfallMm !== null ? `${stateMeanRainfallMm.toLocaleString()} mm` : 'N/A'}
            </span>
          </div>
          <span className="text-[10px] text-[#6A8177] font-mono block">
            Rice Belt Seasonal Mean
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#0E1F29] border border-[#1A3A4D] flex items-center justify-center text-[#38BDF8] shrink-0">
          <CloudRain className="w-5 h-5 text-[#38BDF8]" />
        </div>
      </div>

      {/* 6. El Niño Index (ONI) */}
      <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between hover:border-[#1E3A2F] transition-colors shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[11px] text-[#7A9187] font-medium block">
            El Niño Index (ONI)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-white">
              {oniInfo
                ? `${oniInfo.meanEarlyWarningSstAnomaly > 0 ? '+' : ''}${oniInfo.meanEarlyWarningSstAnomaly.toFixed(1)}°C`
                : 'N/A'}
            </span>
          </div>
          <span
            className={`text-[10px] font-bold font-mono block ${
              oniInfo?.elNinoIndicator === 1 ? 'text-[#D93838]' : 'text-[#22C55E]'
            }`}
          >
            {oniInfo?.ensoPhase || 'Neutral'}
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#281313] border border-[#4D1D1D] flex items-center justify-center text-[#D93838] shrink-0">
          <Thermometer className="w-5 h-5 text-[#D93838]" />
        </div>
      </div>
    </div>
  );
};
