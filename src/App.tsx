import React, { useState } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardProvider } from './context/DashboardContext';
import { HomePage } from './pages/HomePage';
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
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'dashboard' || window.location.hash.includes('dashboard')) {
        return 'dashboard';
      }
    }
    return 'landing';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const handleLaunchDashboard = (initialTab: ActiveTab = 'overview') => {
    setActiveTab(initialTab);
    setViewMode('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLanding = () => {
    setViewMode('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (viewMode === 'landing') {
    return (
      <DashboardProvider>
        <HomePage onLaunchDashboard={handleLaunchDashboard} />
      </DashboardProvider>
    );
  }

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-[#EAECE4] text-[#16221B] flex flex-col lg:flex-row font-sans selection:bg-[#12382B] selection:text-white overflow-x-hidden">
        {/* Grouped Sidebar with Return to Home Button */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onBackToLanding={handleBackToLanding}
        />

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
