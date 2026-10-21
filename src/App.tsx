import React, { useState } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardProvider } from './context/DashboardContext';
import { ThemeProvider, useAppTheme } from './context/ThemeContext';
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

interface DashboardLayoutProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onBackToLanding: () => void;
}

function DashboardLayout({ activeTab, setActiveTab, onBackToLanding }: DashboardLayoutProps) {
  const { isDark } = useAppTheme();

  return (
    <div
      className={`h-screen w-screen overflow-hidden flex flex-col lg:flex-row font-sans selection:bg-[#12382B] selection:text-white ${
        isDark ? 'bg-[#060D0A] text-white' : 'bg-[#EAECE4] text-[#16221B]'
      }`}
    >
      {/* Grouped Locked Sidebar with Return to Home Button */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onBackToLanding={onBackToLanding}
      />

      {/* Main Analytics Viewport: Scrollable Independent of Left Pane */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-y-auto overflow-x-hidden">
        {/* Top Dashboard Header Bar with Breadcrumbs & Single Theme Toggle */}
        <header
          className={`sticky top-0 z-30 px-3 sm:px-5 lg:px-6 py-2.5 backdrop-blur-md border-b flex items-center justify-between gap-3 shadow-2xs ${
            isDark
              ? 'bg-[#060D0A]/90 border-[#14261F]'
              : 'bg-[#EAECE4]/90 border-[#CCD2C4]/70'
          }`}
        >
          {/* Left: Breadcrumbs & Current View */}
          <div className="flex items-center gap-2 text-xs font-mono min-w-0">
            <button
              onClick={onBackToLanding}
              className={`inline-flex items-center gap-1.5 transition-colors font-medium cursor-pointer shrink-0 ${
                isDark ? 'text-[#7A9187] hover:text-white' : 'text-[#526458] hover:text-[#16221B]'
              }`}
              title="Return to Project Home"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <ChevronRight
              className={`w-3 h-3 shrink-0 ${isDark ? 'text-[#3E5146]' : 'text-[#889B8F]'}`}
            />
            <span
              className={`font-semibold truncate ${
                isDark ? 'text-[#E8EFEB]' : 'text-[#16221B]'
              }`}
            >
              {TAB_TITLES[activeTab] || activeTab}
            </span>
          </div>

          {/* Right: Operational Status Pill & Single Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono shadow-2xs ${
                isDark
                  ? 'bg-[#091410] border-[#14261F] text-[#7A9187]'
                  : 'bg-white border-[#CCD2C4] text-[#526458]'
              }`}
            >
              <Activity className="w-3 h-3 text-[#22C55E] animate-pulse" />
              <span>ENSO Niño 3.4 · IMD RF25 · S2</span>
            </div>

            {/* Sole Dashboard Theme Switcher */}
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
  );
}

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
          <DashboardLayout
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onBackToLanding={handleBackToLanding}
          />
        )}
      </DashboardProvider>
    </ThemeProvider>
  );
}
