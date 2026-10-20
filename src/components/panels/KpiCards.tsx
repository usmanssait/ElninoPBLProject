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
      <div className="p-3.5 rounded-xl bg-[#E2E6DC] border border-[#CCD2C4] flex items-center justify-between hover:border-[#12382B]/40 transition-colors shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[11px] text-[#526458] font-medium block uppercase tracking-wider">
            Total Districts
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#16221B]">
              {historicalTotalDistricts}
            </span>
            <span className="text-[10px] text-[#718277] font-mono">
              {selectedCrop === 'ALL' ? 'Monitored' : `${selectedCrop}`}
            </span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#D8DECFC0] border border-[#CCD2C4] flex items-center justify-center text-[#12382B] shrink-0">
          <Sprout className="w-5 h-5 text-[#12382B]" />
        </div>
      </div>

      {/* 2. Failure Districts */}
      <div className="p-3.5 rounded-xl bg-[#E2E6DC] border border-[#CCD2C4] flex items-center justify-between hover:border-[#DC2626]/40 transition-colors shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[11px] text-[#526458] font-medium block uppercase tracking-wider">
            Failure Districts
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#DC2626]">
              {historicalFailureCount}
            </span>
            <span className="text-[11px] font-bold text-[#DC2626] font-mono">
              {Math.round((historicalFailureCount / historicalTotalDistricts) * 100)}%
            </span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center text-[#DC2626] shrink-0">
          <ShieldAlert className="w-5 h-5 text-[#DC2626]" />
        </div>
      </div>

      {/* 3. Resilient Districts */}
      <div className="p-3.5 rounded-xl bg-[#E2E6DC] border border-[#CCD2C4] flex items-center justify-between hover:border-[#16A34A]/40 transition-colors shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[11px] text-[#526458] font-medium block uppercase tracking-wider">
            Resilient Districts
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#16221B]">
              {historicalResilientCount}
            </span>
            <span className="text-[11px] font-bold text-[#16A34A] font-mono">
              {Math.round((historicalResilientCount / historicalTotalDistricts) * 100)}%
            </span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A] shrink-0">
          <Sprout className="w-5 h-5 text-[#16A34A]" />
        </div>
      </div>

      {/* 4. Forecast Lead Time */}
      <div className="p-3.5 rounded-xl bg-[#E2E6DC] border border-[#CCD2C4] flex items-center justify-between hover:border-[#12382B]/40 transition-colors shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[11px] text-[#526458] font-medium block uppercase tracking-wider">
            Forecast Lead Time
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-[#16221B]">60–75 Days</span>
          </div>
          <span className="text-[10px] text-[#718277] font-mono block">
            August 31 evaluation
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#E0E7FF] border border-[#C7D2FE] flex items-center justify-center text-[#4338CA] shrink-0">
          <Clock className="w-5 h-5 text-[#4338CA]" />
        </div>
      </div>

      {/* 5. Monsoon Rainfall (IMD) */}
      <div className="p-3.5 rounded-xl bg-[#E2E6DC] border border-[#CCD2C4] flex items-center justify-between hover:border-[#0284C7]/40 transition-colors shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[11px] text-[#526458] font-medium block uppercase tracking-wider">
            Monsoon Rainfall (IMD)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-[#16221B]">
              {stateMeanRainfallMm !== null ? `${stateMeanRainfallMm.toLocaleString()} mm` : 'N/A'}
            </span>
          </div>
          <span className="text-[10px] text-[#718277] font-mono block">
            Rice Belt Seasonal Mean
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shrink-0">
          <CloudRain className="w-5 h-5 text-[#0284C7]" />
        </div>
      </div>

      {/* 6. El Niño Index (ONI) */}
      <div className="p-3.5 rounded-xl bg-[#E2E6DC] border border-[#CCD2C4] flex items-center justify-between hover:border-[#12382B]/40 transition-colors shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[11px] text-[#526458] font-medium block uppercase tracking-wider">
            El Niño Index (ONI)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-[#16221B]">
              {oniInfo
                ? `${oniInfo.meanEarlyWarningSstAnomaly > 0 ? '+' : ''}${oniInfo.meanEarlyWarningSstAnomaly.toFixed(1)}°C`
                : 'N/A'}
            </span>
          </div>
          <span
            className={`text-[10px] font-bold font-mono block ${
              oniInfo?.elNinoIndicator === 1 ? 'text-[#DC2626]' : 'text-[#16A34A]'
            }`}
          >
            {oniInfo?.ensoPhase || 'Neutral'}
          </span>
        </div>
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
            oniInfo?.elNinoIndicator === 1
              ? 'bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]'
              : 'bg-[#DCFCE7] border-[#BBF7D0] text-[#16A34A]'
          }`}
        >
          <Thermometer className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
