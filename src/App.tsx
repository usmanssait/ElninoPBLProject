import React, { useState } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardProvider } from './context/DashboardContext';
import { OverviewPage } from './pages/OverviewPage';
import { DistrictRiskMapPage } from './pages/DistrictRiskMapPage';
import { HistoricalAnalysisPage } from './pages/HistoricalAnalysisPage';
import { RainfallTrendsPage } from './pages/RainfallTrendsPage';
import { ModelPredictionsPage } from './pages/ModelPredictionsPage';
import { ModelArchitectureView } from './components/ModelArchitectureView';
import { LosoValidationView } from './components/LosoValidationView';
import { FutureElNinoPage } from './pages/FutureElNinoPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { AboutProjectPage } from './pages/AboutProjectPage';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-[#060D0A] text-[#E8EFEB] flex flex-col lg:flex-row font-sans selection:bg-[#22C55E]/30 selection:text-[#4ADE80] overflow-x-hidden">
        {/* Grouped Sidebar matching Mockup */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Analytics Viewport */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          <main className="flex-1 p-3 sm:p-4 lg:p-5 w-full">
            {activeTab === 'overview' && <OverviewPage />}
            {activeTab === 'risk_map' && <DistrictRiskMapPage />}
            {activeTab === 'historical_analysis' && <HistoricalAnalysisPage />}
            {activeTab === 'rainfall_trends' && <RainfallTrendsPage />}
            {activeTab === 'model_predictions' && <ModelPredictionsPage />}
            {activeTab === 'model_architecture' && <ModelArchitectureView />}
            {activeTab === 'loso_validation' && <LosoValidationView />}
            {activeTab === 'future_elnino' && <FutureElNinoPage />}
            {activeTab === 'data_sources' && <DataSourcesPage />}
            {activeTab === 'about_project' && <AboutProjectPage />}
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
