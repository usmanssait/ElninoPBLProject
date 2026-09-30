import React, { useState } from 'react';
import { Header, ActiveTab } from './components/Header';
import { GeospatialMapView } from './components/GeospatialMapView';
import { EarlyWarningSimulatorView } from './components/EarlyWarningSimulatorView';
import { SpatiotemporalDataView } from './components/SpatiotemporalDataView';
import { ModelArchitectureView } from './components/ModelArchitectureView';
import { AuditReportView } from './components/AuditReportView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Polished Academic Top Navigation */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Viewport Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'map' && <GeospatialMapView />}
        {activeTab === 'simulator' && <EarlyWarningSimulatorView />}
        {activeTab === 'data' && <SpatiotemporalDataView />}
        {activeTab === 'model' && <ModelArchitectureView />}
        {activeTab === 'audit' && <AuditReportView />}
      </main>

      {/* Academic Project Footer */}
      <footer className="border-t border-slate-800/80 bg-[#07090D] py-5 px-4 sm:px-8 mt-auto text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">B.Tech AI & Data Science PBL Project</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="text-slate-500">Maharashtra Kharif Rice Early Warning Framework</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>IMD Gridded Rainfall (0.25°)</span>
            <span>NOAA CPC ERSST.v5 ONI</span>
            <span>DES Maharashtra</span>
            <span>ESA WorldCover 10m</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
