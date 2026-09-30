import React, { useState } from 'react';
import { Header, ActiveTab } from './components/Header';
import { GeospatialMapView } from './components/GeospatialMapView';
import { ModelArchitectureView } from './components/ModelArchitectureView';
import { LosoValidationView } from './components/LosoValidationView';
import { SpatiotemporalDataView } from './components/SpatiotemporalDataView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden">
      {/* Top Navigation */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Viewport Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'map' && <GeospatialMapView />}
        {activeTab === 'model' && <ModelArchitectureView />}
        {activeTab === 'loso' && <LosoValidationView />}
        {activeTab === 'data' && <SpatiotemporalDataView />}
      </main>

      {/* Academic Project Footer */}
      <footer className="border-t border-slate-800/80 bg-[#07090D] py-5 px-4 sm:px-8 mt-auto text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">B.Tech AI & Data Science PBL Mini Project</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="text-slate-500">Spatiotemporal CNN-LSTM Framework for Kharif Rice Failure</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>IMD Gridded 0.25°</span>
            <span>NOAA CPC ONI ERSST.v5</span>
            <span>DES Maharashtra</span>
            <span>Copernicus Sentinel-2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
