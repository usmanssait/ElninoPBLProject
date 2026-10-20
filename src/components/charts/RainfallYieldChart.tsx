import React, { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { ALL_YEAR_METRICS } from '../../data/maharashtraMapData';
import { PRIMARY_RICE_DISTRICTS } from '../../data/canonicalDistricts';

interface RainfallYieldChartProps {
  className?: string;
  title?: string;
}

export const RainfallYieldChart: React.FC<RainfallYieldChartProps> = ({
  className = '',
  title,
}) => {
  const { selectedYear, setSelectedYear, availableYears, allYearMetrics, monitoredDistrictsForCrop, selectedCrop } = useDashboard();

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
      className={`rounded-2xl bg-[#091410] border border-[#14261F] p-3.5 sm:p-4 flex flex-col justify-between shadow-xs ${className}`}
    >
      {/* 1. Header & Legend */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#14261F]/60">
        <h3 className="text-sm font-bold text-white tracking-tight">
          {displayTitle}
        </h3>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-mono shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2 rounded-xs bg-[#38BDF8]" />
            <span className="text-[#38BDF8] font-medium">Avg Rain (mm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-[#22C55E] font-medium">Avg Yield (t/ha)</span>
          </div>
        </div>
      </div>

      {/* 2. Scaled Horizontal Bar Chart filling available window */}
      <div className="flex-1 flex flex-col justify-end py-2 min-h-[100px]">
        <div className="flex-1 min-h-[90px] w-full flex items-end justify-between gap-1.5 sm:gap-2 px-1 border-b border-[#14261F] relative pb-1">
          {/* Subtle horizontal reference lines */}
          <div className="absolute inset-x-0 top-0 border-b border-[#14261F]/30 pointer-events-none" />
          <div className="absolute inset-x-0 top-1/2 border-b border-[#14261F]/20 pointer-events-none" />

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
                    isCurrent ? 'text-[#38BDF8]' : 'text-[#10B981] group-hover:text-white'
                  }`}
                >
                  {item.yieldVal}t
                </span>

                {/* Rainfall Bar with Smooth Gradient */}
                <div className="w-full flex-1 flex items-end justify-center min-h-[35px]">
                  <div
                    className={`w-full max-w-[36px] sm:max-w-[42px] rounded-t-md transition-all duration-200 ${
                      isCurrent
                        ? 'bg-gradient-to-t from-[#0284C7] to-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.45)]'
                        : 'bg-[#0284C7]/55 group-hover:bg-[#0284C7]/85'
                    }`}
                    style={{ height: `${rainHeight}%` }}
                  />
                </div>

                {/* Year Label */}
                <span
                  className={`text-[11px] sm:text-xs font-mono font-semibold mt-1 transition-colors ${
                    isCurrent ? 'text-[#38BDF8] font-bold' : 'text-[#7A9187] group-hover:text-white'
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
      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-[#7A9187] pt-1.5 border-t border-[#14261F]/60">
        <span>Cycles: 2015–2022</span>
        <span className="text-white font-medium">
          Selected: <strong className="text-[#38BDF8]">{selectedYear}</strong> ({selectedData?.rainfall ?? 'N/A'} mm · {selectedData?.yieldVal ?? 'N/A'} t/ha)
        </span>
      </div>
    </div>
  );
};
