import React, { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useAppTheme } from '../../context/ThemeContext';

interface RainfallYieldChartProps {
  className?: string;
  title?: string;
}

export const RainfallYieldChart: React.FC<RainfallYieldChartProps> = ({
  className = '',
  title,
}) => {
  const { selectedYear, setSelectedYear, availableYears, allYearMetrics, monitoredDistrictsForCrop, selectedCrop } = useDashboard();
  const { isDark } = useAppTheme();

  const displayTitle = title || (
    selectedCrop === 'ALL'
      ? 'All Kharif Crops — Mean Rainfall & Yield'
      : `${selectedCrop} Belt — Mean Rainfall & Yield`
  );

  // Multi-year averages computed from allYearMetrics (dynamically filtered by crop)
  const yearlyData = useMemo(() => {
    return availableYears.map(yr => {
      const yrMetrics = allYearMetrics[yr] || {};
      const valid = monitoredDistrictsForCrop.map(d => yrMetrics[d.id]).filter(Boolean);
      const withRain = valid.filter(m => m.rainfallMm !== null);
      const withYield = valid.filter(m => m.yieldTonnesHa !== null);

      const avgRain = withRain.length > 0
        ? Math.round(withRain.reduce((acc, m) => acc + (m.rainfallMm || 0), 0) / withRain.length)
        : 0;
      const avgYield = withYield.length > 0
        ? Number((withYield.reduce((acc, m) => acc + (m.yieldTonnesHa || 0), 0) / withYield.length).toFixed(2))
        : 0;

      return {
        year: yr,
        yearLabel: String(yr),
        rainfall: avgRain,
        yieldVal: avgYield,
      };
    });
  }, [availableYears, allYearMetrics, monitoredDistrictsForCrop]);

  const selectedData = yearlyData.find(d => d.year === selectedYear);

  return (
    <div
      className={`rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-xs transition-colors ${
        isDark
          ? 'bg-[#102019] border border-[#294338]'
          : 'bg-[#E2E6DC] border border-[#CCD2C4]'
      } ${className}`}
    >
      {/* 1. Header & Legend */}
      <div
        className={`flex items-center justify-between gap-2 pb-2 border-b ${
          isDark ? 'border-[#294338]' : 'border-[#CCD2C4]'
        }`}
      >
        <h3
          className={`text-sm font-bold tracking-tight ${
            isDark ? 'text-[#E5EEE8]' : 'text-[#16221B]'
          }`}
        >
          {displayTitle}
        </h3>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-mono shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2 rounded-xs bg-[#0284C7]" />
            <span className={`font-medium ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`}>
              Avg Rain (mm)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#44A07A]" />
            <span className={`font-medium ${isDark ? 'text-[#44A07A]' : 'text-[#16A34A]'}`}>
              Avg Yield (t/ha)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Scaled Horizontal Bar Chart filling available window */}
      <div className="flex-1 flex flex-col justify-end py-2 min-h-[100px]">
        <div
          className={`flex-1 min-h-[90px] w-full flex items-end justify-between gap-1.5 sm:gap-2 px-1 border-b relative pb-1 ${
            isDark ? 'border-[#294338]' : 'border-[#CCD2C4]'
          }`}
        >
          {/* Subtle horizontal reference lines */}
          <div
            className={`absolute inset-x-0 top-0 border-b pointer-events-none ${
              isDark ? 'border-[#294338]/60' : 'border-[#CCD2C4]/50'
            }`}
          />
          <div
            className={`absolute inset-x-0 top-1/2 border-b pointer-events-none ${
              isDark ? 'border-[#294338]/40' : 'border-[#CCD2C4]/35'
            }`}
          />

          {yearlyData.map(item => {
            const isCurrent = item.year === selectedYear;
            const rainHeight = Math.min(100, Math.max(20, Math.round((item.rainfall / 1400) * 100)));

            return (
              <div
                key={item.year}
                onClick={() => setSelectedYear(item.year)}
                className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group relative"
                title={`${item.year}: ${item.rainfall} mm rainfall · ${item.yieldVal} t/ha yield`}
              >
                {/* Yield Value Badge on Top */}
                <span
                  className={`text-[11px] sm:text-xs font-mono font-bold leading-none mb-1 transition-colors ${
                    isCurrent
                      ? isDark
                        ? 'text-[#38BDF8]'
                        : 'text-[#0284C7]'
                      : isDark
                      ? 'text-[#44A07A] group-hover:text-white'
                      : 'text-[#16A34A] group-hover:text-[#16221B]'
                  }`}
                >
                  {item.yieldVal}t
                </span>

                {/* Rainfall Bar with Smooth Gradient */}
                <div className="w-full flex-1 flex items-end justify-center min-h-[35px]">
                  <div
                    className={`w-full max-w-[36px] sm:max-w-[42px] rounded-t-md transition-all duration-200 ${
                      isCurrent
                        ? 'bg-gradient-to-t from-[#0284C7] to-[#38BDF8] shadow-[0_2px_8px_rgba(2,132,199,0.35)]'
                        : isDark
                        ? 'bg-[#0284C7]/45 group-hover:bg-[#0284C7]/80'
                        : 'bg-[#0284C7]/65 group-hover:bg-[#0284C7]/90'
                    }`}
                    style={{ height: `${rainHeight}%` }}
                  />
                </div>

                {/* Year Label */}
                <span
                  className={`text-[11px] sm:text-xs font-mono font-semibold mt-1 transition-colors ${
                    isCurrent
                      ? isDark
                        ? 'text-[#38BDF8] font-bold'
                        : 'text-[#0284C7] font-bold'
                      : isDark
                      ? 'text-[#9BAFA4] group-hover:text-white'
                      : 'text-[#526458] group-hover:text-[#16221B]'
                  }`}
                >
                  {item.yearLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Status Row */}
      <div
        className={`flex items-center justify-between text-[10px] sm:text-[11px] font-mono pt-1.5 border-t ${
          isDark ? 'border-[#294338] text-[#9BAFA4]' : 'border-[#CCD2C4] text-[#526458]'
        }`}
      >
        <span>Cycles: 2015–2022</span>
        <span className={isDark ? 'text-[#E5EEE8] font-medium' : 'text-[#16221B] font-medium'}>
          Selected:{' '}
          <strong className={isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}>
            {selectedYear}
          </strong>{' '}
          ({selectedData?.rainfall ?? 'N/A'} mm · {selectedData?.yieldVal ?? 'N/A'} t/ha)
        </span>
      </div>
    </div>
  );
};
