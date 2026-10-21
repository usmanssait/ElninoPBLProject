import React, { useState } from 'react';
import { DistrictChoropleth } from '../components/map/DistrictChoropleth';
import { YearSelect } from '../components/common/YearSelect';
import { DistrictDetailPanel } from '../components/panels/DistrictDetailPanel';
import { useDashboard } from '../context/DashboardContext';
import { useAppTheme } from '../context/ThemeContext';
import { CloudRain, Sprout, ShieldAlert } from 'lucide-react';

export const DistrictRiskMapPage: React.FC = () => {
  const { cropYearStr } = useDashboard();
  const { isDark } = useAppTheme();
  const [mapLayer, setMapLayer] = useState<'historical' | 'rainfall' | 'yield'>('historical');

  return (
    <div className={`space-y-4 max-w-[1720px] mx-auto ${isDark ? 'text-[#E5EEE8]' : 'text-[#16221B]'}`}>
      {/* Page Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b ${
          isDark ? 'border-[#294338]' : 'border-[#CCD2C4]'
        }`}
      >
        <div>
          <h1
            className={`text-xl sm:text-2xl font-bold tracking-tight font-serif ${
              isDark ? 'text-[#E5EEE8]' : 'text-[#16221B]'
            }`}
          >
            District Risk &amp; Spatiotemporal Map
          </h1>
          <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-[#9BAFA4]' : 'text-[#526458]'}`}>
            Full-state choropleth inspection across Kharif seasons with layer switches for crop failure events, rainfall, and harvest yield
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Layer Switcher */}
          <div
            className={`flex items-center p-1 rounded-xl shadow-xs border ${
              isDark ? 'bg-[#14271F] border-[#294338]' : 'bg-white border-[#CCD2C4]'
            }`}
          >
            <button
              onClick={() => setMapLayer('historical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                mapLayer === 'historical'
                  ? isDark
                    ? 'bg-[#102019] text-[#39B8C4] border border-[#39B8C4]/60 font-bold shadow-xs'
                    : 'bg-[#12382B] text-white font-bold shadow-xs'
                  : isDark
                  ? 'text-[#9BAFA4] hover:text-[#E5EEE8]'
                  : 'text-[#526458] hover:text-[#16221B]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Failure Events</span>
            </button>
            <button
              onClick={() => setMapLayer('rainfall')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                mapLayer === 'rainfall'
                  ? isDark
                    ? 'bg-[#102019] text-[#39B8C4] border border-[#39B8C4]/60 font-bold shadow-xs'
                    : 'bg-[#12382B] text-white font-bold shadow-xs'
                  : isDark
                  ? 'text-[#9BAFA4] hover:text-[#E5EEE8]'
                  : 'text-[#526458] hover:text-[#16221B]'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>IMD Rainfall</span>
            </button>
            <button
              onClick={() => setMapLayer('yield')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                mapLayer === 'yield'
                  ? isDark
                    ? 'bg-[#102019] text-[#39B8C4] border border-[#39B8C4]/60 font-bold shadow-xs'
                    : 'bg-[#12382B] text-white font-bold shadow-xs'
                  : isDark
                  ? 'text-[#9BAFA4] hover:text-[#E5EEE8]'
                  : 'text-[#526458] hover:text-[#16221B]'
              }`}
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>DES Yield</span>
            </button>
          </div>

          <YearSelect />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-8 space-y-4">
          <DistrictChoropleth
            mode={mapLayer}
            title={
              mapLayer === 'historical'
                ? `Observed Crop Failure Events — Kharif ${cropYearStr}`
                : mapLayer === 'rainfall'
                ? `IMD Kharif Monsoon Rainfall Distribution — ${cropYearStr}`
                : `DES Rice Yield Distribution (t/ha) — ${cropYearStr}`
            }
            heightClass="min-h-[520px] sm:min-h-[580px]"
          />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <DistrictDetailPanel />
        </div>
      </div>
    </div>
  );
};
