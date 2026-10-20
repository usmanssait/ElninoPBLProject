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
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#16221B]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#CCD2C4]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#16221B] font-serif">
            District Risk &amp; Spatiotemporal Map
          </h1>
          <p className="text-xs text-[#526458] mt-0.5 font-medium">
            Full-state choropleth inspection across Kharif seasons with layer switches for crop failure events, rainfall, and harvest yield
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Layer Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-white border border-[#CCD2C4] shadow-xs">
            <button
              onClick={() => setMapLayer('historical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                mapLayer === 'historical'
                  ? 'bg-[#12382B] text-white font-bold shadow-xs'
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
                  ? 'bg-[#12382B] text-white font-bold shadow-xs'
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
                  ? 'bg-[#12382B] text-white font-bold shadow-xs'
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
