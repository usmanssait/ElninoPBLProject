import React, { useState } from 'react';
import { DistrictChoropleth } from '../components/map/DistrictChoropleth';
import { YearSelect } from '../components/common/YearSelect';
import { DistrictDetailPanel } from '../components/panels/DistrictDetailPanel';
import { useDashboard } from '../context/DashboardContext';
import { Layers, CloudRain, Sprout, ShieldAlert } from 'lucide-react';

export const DistrictRiskMapPage: React.FC = () => {
  const { cropYearStr } = useDashboard();
  const [mapLayer, setMapLayer] = useState<'historical' | 'rainfall' | 'yield'>('historical');

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#E8EFEB]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#14261F]/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            District Risk & Spatiotemporal Map
          </h1>
          <p className="text-xs text-[#80978E] mt-0.5 font-medium">
            Full-state choropleth inspection across Kharif seasons with layer switches for crop failure events, rainfall, and harvest yield
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Layer Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[#060D0A] border border-[#14261F]">
            <button
              onClick={() => setMapLayer('historical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                mapLayer === 'historical'
                  ? 'bg-[#22C55E] text-[#051A11] font-bold shadow-xs'
                  : 'text-[#849B90] hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Failure Events</span>
            </button>
            <button
              onClick={() => setMapLayer('rainfall')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                mapLayer === 'rainfall'
                  ? 'bg-[#22C55E] text-[#051A11] font-bold shadow-xs'
                  : 'text-[#849B90] hover:text-white'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>IMD Rainfall</span>
            </button>
            <button
              onClick={() => setMapLayer('yield')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                mapLayer === 'yield'
                  ? 'bg-[#22C55E] text-[#051A11] font-bold shadow-xs'
                  : 'text-[#849B90] hover:text-white'
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
