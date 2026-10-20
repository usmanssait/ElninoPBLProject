import React, { useState } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardProvider } from './context/DashboardContext';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/common/ThemeToggle';
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
import { Home, ChevronRight, Activity } from 'lucide-react';

const TAB_TITLES: Record<ActiveTab, string> = {
  overview: 'Overview & District Choropleth',
  risk_map: 'District Risk Map',
  historical_analysis: 'Historical Analysis & APY Audit',
  rainfall_trends: 'Rainfall & Climate Trends',
  model_predictions: 'CNN–LSTM Predictions',
  model_architecture: 'Model Architecture & Pipeline',
  loso_validation: 'Holdout District Validation',
  future_elnino: 'Future El Niño Scenarios',
  data_sources: 'Data Sources & Specifications',
  about_project: 'About Project & Code Exports',
};

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

  return (
    <ThemeProvider>
      <DashboardProvider>
        {viewMode === 'landing' ? (
          <HomePage onLaunchDashboard={handleLaunchDashboard} />
        ) : (
          <div className="min-h-screen bg-[#EAECE4] text-[#16221B] flex flex-col lg:flex-row font-sans selection:bg-[#12382B] selection:text-white overflow-x-hidden">
            {/* Grouped Sidebar with Return to Home Button */}
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onBackToLanding={handleBackToLanding}
            />

            {/* Main Analytics Viewport */}
            <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
              {/* Top Dashboard Header Bar with Breadcrumbs & Theme Toggle */}
              <header className="sticky top-0 z-30 px-3 sm:px-5 lg:px-6 py-2.5 bg-[#EAECE4]/90 backdrop-blur-md border-b border-[#CCD2C4]/70 flex items-center justify-between gap-3 shadow-2xs">
                {/* Left: Breadcrumbs & Current View */}
                <div className="flex items-center gap-2 text-xs font-mono min-w-0">
                  <button
                    onClick={handleBackToLanding}
                    className="inline-flex items-center gap-1.5 text-[#526458] hover:text-[#16221B] transition-colors font-medium cursor-pointer shrink-0"
                    title="Return to Project Home"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Home</span>
                  </button>
                  <ChevronRight className="w-3 h-3 text-[#889B8F] shrink-0" />
                  <span className="font-semibold text-[#16221B] truncate">
                    {TAB_TITLES[activeTab] || activeTab}
                  </span>
                </div>

                {/* Right: Operational Status Pill & Theme Toggle */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#CCD2C4] text-[10px] font-mono text-[#526458] shadow-2xs">
                    <Activity className="w-3 h-3 text-[#16A34A] animate-pulse" />
                    <span>ENSO Niño 3.4 · IMD RF25 · S2</span>
                  </div>

                  {/* Theme Switcher Toggle (Top Right for Dashboard) */}
                  <ThemeToggle />
                </div>
              </header>

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
        )}
      </DashboardProvider>
    </ThemeProvider>
  );
}
