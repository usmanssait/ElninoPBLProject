import React, { useState } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { GeospatialMapView } from './components/GeospatialMapView';
import { ModelArchitectureView } from './components/ModelArchitectureView';
import { LosoValidationView } from './components/LosoValidationView';
import { SpatiotemporalDataView } from './components/SpatiotemporalDataView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');

  return (
    <div className="min-h-screen bg-[#060D0A] text-[#E8EFEB] flex flex-col lg:flex-row font-sans selection:bg-[#22C55E]/30 selection:text-[#4ADE80] overflow-x-hidden">
      {/* Dark Forest-Green Left Sidebar matching Reference */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Analytics Viewport */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        <main className="flex-1 p-3 sm:p-4 lg:p-6 w-full max-w-[1720px] mx-auto">
          {activeTab === 'map' && <GeospatialMapView />}
          {activeTab === 'model' && <ModelArchitectureView />}
          {activeTab === 'loso' && <LosoValidationView />}
          {activeTab === 'data' && <SpatiotemporalDataView />}
        </main>
      </div>
    </div>
  );
}
