import React from 'react';
import { Sprout, ShieldAlert, Clock, CloudRain, Thermometer } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useAppTheme } from '../../context/ThemeContext';

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

  const { isDark } = useAppTheme();

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 ${className}`}>
      {/* 1. Total Districts */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors shadow-xs ${
          isDark
            ? 'bg-[#091410] border-[#14261F] hover:border-[#1E3A2F]'
            : 'bg-[#E2E6DC] border-[#CCD2C4] hover:border-[#12382B]/40'
        }`}
      >
        <div className="space-y-0.5">
          <span
            className={`text-[11px] font-medium block uppercase tracking-wider ${
              isDark ? 'text-[#7A9187]' : 'text-[#526458]'
            }`}
          >
            Total Districts
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                isDark ? 'text-white' : 'text-[#16221B]'
              }`}
            >
              {historicalTotalDistricts}
            </span>
            <span className={`text-[10px] font-mono ${isDark ? 'text-[#7A9187]' : 'text-[#718277]'}`}>
              {selectedCrop === 'ALL' ? 'Monitored' : `${selectedCrop}`}
            </span>
          </div>
        </div>
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
            isDark
              ? 'bg-[#0D241B] border-[#173D2C] text-[#22C55E]'
              : 'bg-[#D8DECFC0] border-[#CCD2C4] text-[#12382B]'
          }`}
        >
          <Sprout className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Failure Districts */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors shadow-xs ${
          isDark
            ? 'bg-[#091410] border-[#14261F] hover:border-[#1E3A2F]'
            : 'bg-[#E2E6DC] border-[#CCD2C4] hover:border-[#DC2626]/40'
        }`}
      >
        <div className="space-y-0.5">
          <span
            className={`text-[11px] font-medium block uppercase tracking-wider ${
              isDark ? 'text-[#7A9187]' : 'text-[#526458]'
            }`}
          >
            Failure Districts
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                isDark ? 'text-[#D93838]' : 'text-[#DC2626]'
              }`}
            >
              {historicalFailureCount}
            </span>
            <span
              className={`text-[11px] font-bold font-mono ${
                isDark ? 'text-[#D93838]' : 'text-[#DC2626]'
              }`}
            >
              {Math.round((historicalFailureCount / historicalTotalDistricts) * 100)}%
            </span>
          </div>
        </div>
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
            isDark
              ? 'bg-[#281313] border-[#4D1D1D] text-[#D93838]'
              : 'bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]'
          }`}
        >
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Resilient Districts */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors shadow-xs ${
          isDark
            ? 'bg-[#091410] border-[#14261F] hover:border-[#1E3A2F]'
            : 'bg-[#E2E6DC] border-[#CCD2C4] hover:border-[#16A34A]/40'
        }`}
      >
        <div className="space-y-0.5">
          <span
            className={`text-[11px] font-medium block uppercase tracking-wider ${
              isDark ? 'text-[#7A9187]' : 'text-[#526458]'
            }`}
          >
            Resilient Districts
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                isDark ? 'text-white' : 'text-[#16221B]'
              }`}
            >
              {historicalResilientCount}
            </span>
            <span
              className={`text-[11px] font-bold font-mono ${
                isDark ? 'text-[#22C55E]' : 'text-[#16A34A]'
              }`}
            >
              {Math.round((historicalResilientCount / historicalTotalDistricts) * 100)}%
            </span>
          </div>
        </div>
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
            isDark
              ? 'bg-[#0D241B] border-[#173D2C] text-[#22C55E]'
              : 'bg-[#DCFCE7] border-[#BBF7D0] text-[#16A34A]'
          }`}
        >
          <Sprout className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Forecast Lead Time */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors shadow-xs ${
          isDark
            ? 'bg-[#091410] border-[#14261F] hover:border-[#1E3A2F]'
            : 'bg-[#E2E6DC] border-[#CCD2C4] hover:border-[#12382B]/40'
        }`}
      >
        <div className="space-y-0.5">
          <span
            className={`text-[11px] font-medium block uppercase tracking-wider ${
              isDark ? 'text-[#7A9187]' : 'text-[#526458]'
            }`}
          >
            Forecast Lead Time
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl font-bold font-mono ${
                isDark ? 'text-white' : 'text-[#16221B]'
              }`}
            >
              60–75 Days
            </span>
          </div>
          <span className={`text-[10px] font-mono block ${isDark ? 'text-[#6A8177]' : 'text-[#718277]'}`}>
            August 31 evaluation
          </span>
        </div>
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
            isDark
              ? 'bg-[#0D241B] border-[#173D2C] text-[#22C55E]'
              : 'bg-[#E0E7FF] border-[#C7D2FE] text-[#4338CA]'
          }`}
        >
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* 5. Monsoon Rainfall (IMD) */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors shadow-xs ${
          isDark
            ? 'bg-[#091410] border-[#14261F] hover:border-[#1E3A2F]'
            : 'bg-[#E2E6DC] border-[#CCD2C4] hover:border-[#0284C7]/40'
        }`}
      >
        <div className="space-y-0.5">
          <span
            className={`text-[11px] font-medium block uppercase tracking-wider ${
              isDark ? 'text-[#7A9187]' : 'text-[#526458]'
            }`}
          >
            Monsoon Rainfall (IMD)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl font-bold font-mono ${
                isDark ? 'text-white' : 'text-[#16221B]'
              }`}
            >
              {stateMeanRainfallMm !== null ? `${stateMeanRainfallMm.toLocaleString()} mm` : 'N/A'}
            </span>
          </div>
          <span className={`text-[10px] font-mono block ${isDark ? 'text-[#6A8177]' : 'text-[#718277]'}`}>
            Rice Belt Seasonal Mean
          </span>
        </div>
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
            isDark
              ? 'bg-[#0E1F29] border-[#1A3A4D] text-[#38BDF8]'
              : 'bg-[#E0F2FE] border-[#BAE6FD] text-[#0284C7]'
          }`}
        >
          <CloudRain className="w-5 h-5" />
        </div>
      </div>

      {/* 6. El Niño Index (ONI) */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors shadow-xs ${
          isDark
            ? 'bg-[#091410] border-[#14261F] hover:border-[#1E3A2F]'
            : 'bg-[#E2E6DC] border-[#CCD2C4] hover:border-[#12382B]/40'
        }`}
      >
        <div className="space-y-0.5">
          <span
            className={`text-[11px] font-medium block uppercase tracking-wider ${
              isDark ? 'text-[#7A9187]' : 'text-[#526458]'
            }`}
          >
            El Niño Index (ONI)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl font-bold font-mono ${
                isDark ? 'text-white' : 'text-[#16221B]'
              }`}
            >
              {oniInfo
                ? `${oniInfo.meanEarlyWarningSstAnomaly > 0 ? '+' : ''}${oniInfo.meanEarlyWarningSstAnomaly.toFixed(1)}°C`
                : 'N/A'}
            </span>
          </div>
          <span
            className={`text-[10px] font-bold font-mono block ${
              oniInfo?.elNinoIndicator === 1
                ? isDark
                  ? 'text-[#D93838]'
                  : 'text-[#DC2626]'
                : isDark
                ? 'text-[#22C55E]'
                : 'text-[#16A34A]'
            }`}
          >
            {oniInfo?.ensoPhase || 'Neutral'}
          </span>
        </div>
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
            oniInfo?.elNinoIndicator === 1
              ? isDark
                ? 'bg-[#281313] border-[#4D1D1D] text-[#D93838]'
                : 'bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]'
              : isDark
              ? 'bg-[#0D241B] border-[#173D2C] text-[#22C55E]'
              : 'bg-[#DCFCE7] border-[#BBF7D0] text-[#16A34A]'
          }`}
        >
          <Thermometer className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
