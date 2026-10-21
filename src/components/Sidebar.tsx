import React, { useState } from 'react';
import {
  Home,
  Map,
  BarChart2,
  TrendingUp,
  Cpu,
  Layers,
  ShieldCheck,
  Compass,
  Database,
  Info,
  Sprout,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';

export type ActiveTab =
  | 'overview'
  | 'risk_map'
  | 'historical_analysis'
  | 'rainfall_trends'
  | 'model_predictions'
  | 'model_architecture'
  | 'loso_validation'
  | 'future_elnino'
  | 'data_sources'
  | 'about_project';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onBackToLanding?: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onBackToLanding,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark } = useAppTheme();

  const sections: NavSection[] = [
    {
      title: 'EXPLORATION',
      items: [
        {
          id: 'overview',
          label: 'Overview',
          icon: <Home className="w-4 h-4" />,
        },
        {
          id: 'risk_map',
          label: 'District Risk Map',
          icon: <Map className="w-4 h-4" />,
        },
        {
          id: 'historical_analysis',
          label: 'Historical Analysis',
          icon: <BarChart2 className="w-4 h-4" />,
        },
        {
          id: 'rainfall_trends',
          label: 'Rainfall & Trends',
          icon: <TrendingUp className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'MODELLING & FORECASTING',
      items: [
        {
          id: 'model_predictions',
          label: 'CNN–LSTM Predictions',
          icon: <Cpu className="w-4 h-4" />,
        },
        {
          id: 'model_architecture',
          label: 'Model Architecture',
          icon: <Layers className="w-4 h-4" />,
        },
        {
          id: 'loso_validation',
          label: 'LOSO Validation',
          icon: <ShieldCheck className="w-4 h-4" />,
        },
        {
          id: 'future_elnino',
          label: 'Future El Niño',
          icon: <Compass className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'PROJECT',
      items: [
        {
          id: 'data_sources',
          label: 'Data Sources',
          icon: <Database className="w-4 h-4" />,
        },
        {
          id: 'about_project',
          label: 'About Project',
          icon: <Info className="w-4 h-4" />,
        },
      ],
    },
  ];

  const handleSelectTab = (id: ActiveTab) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const navContent = (
    <div
      className={`flex flex-col h-full justify-between p-4 overflow-y-auto select-none ${
        isDark ? 'bg-[#091410] text-[#E8EFEB]' : 'bg-[#E0E4D8] text-[#16221B]'
      }`}
    >
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pt-1">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${
              isDark
                ? 'bg-[#0E241C] border-[#183B2B] text-[#22C55E]'
                : 'bg-[#D0D6C6] border-[#BDC4B4] text-[#12382B]'
            }`}
          >
            <Sprout className={`w-5 h-5 ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`} />
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className={`text-sm font-bold tracking-tight truncate ${
                isDark ? 'text-white' : 'text-[#16221B]'
              }`}
            >
              Maharashtra
            </span>
            <span
              className={`text-xs font-semibold tracking-tight truncate ${
                isDark ? 'text-[#A3B8AF]' : 'text-[#35483D]'
              }`}
            >
              Crop-Risk Analytics
            </span>
            <span
              className={`text-[10px] truncate font-mono mt-0.5 ${
                isDark ? 'text-[#7A9187]' : 'text-[#607368]'
              }`}
            >
              Spatiotemporal Analysis
            </span>
          </div>
        </div>

        {/* Back to Project Landing Page Button */}
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs group ${
              isDark
                ? 'bg-[#0E241C] text-[#22C55E] hover:bg-[#133025] border border-[#183B2B]'
                : 'bg-[#12382B] text-white hover:bg-[#1A4C3B] border border-[#0F3025]'
            }`}
            title="Return to Project Homepage"
          >
            <span className="flex items-center gap-2">
              <ArrowLeft
                className={`w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 ${
                  isDark ? 'text-[#22C55E]' : 'text-[#4ADE80]'
                }`}
              />
              <span>Project Home</span>
            </span>
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${
                isDark ? 'text-[#7A9187] group-hover:text-white' : 'text-[#A3B8AF] group-hover:text-white'
              }`}
            >
              Exit
            </span>
          </button>
        )}

        {/* Grouped Navigation Sections */}
        <nav className="space-y-5">
          {sections.map(sec => (
            <div key={sec.title} className="space-y-1">
              <span
                className={`px-3 text-[10px] font-mono font-bold tracking-wider uppercase block pb-1 ${
                  isDark ? 'text-[#4D6559]' : 'text-[#607368]'
                }`}
              >
                {sec.title}
              </span>
              {sec.items.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-[#0E241C] text-[#22C55E] font-semibold border border-[#22C55E]/30 shadow-xs'
                          : 'bg-[#12382B] text-white font-semibold shadow-xs'
                        : isDark
                        ? 'text-[#7A9187] hover:text-white hover:bg-[#0E241C]/60'
                        : 'text-[#3E5146] hover:text-[#16221B] hover:bg-[#D4D9CC]'
                    }`}
                  >
                    <span
                      className={
                        isActive
                          ? isDark
                            ? 'text-[#22C55E]'
                            : 'text-[#4ADE80]'
                          : isDark
                          ? 'text-[#4D6559]'
                          : 'text-[#506659]'
                      }
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Info (ThemeToggle removed from left pane per user request) */}
      <div
        className={`mt-4 pt-3 border-t text-[10px] font-mono px-1 flex items-center justify-between ${
          isDark ? 'border-[#14261F] text-[#4D6559]' : 'border-[#CCD2C4] text-[#607368]'
        }`}
      >
        <span>B.Tech PBL</span>
        <span className={`font-bold ${isDark ? 'text-[#7A9187]' : 'text-[#35483D]'}`}>
          Kharif Crop System
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Locked Left Sidebar */}
      <aside
        className={`hidden lg:flex w-60 xl:w-64 shrink-0 flex-col h-full border-r z-30 select-none ${
          isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E0E4D8] border-[#CCD2C4]'
        }`}
      >
        {navContent}
      </aside>

      {/* Mobile Top Header with Hamburger Toggle */}
      <div
        className={`lg:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-40 ${
          isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E0E4D8] border-[#CCD2C4]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
              isDark
                ? 'bg-[#0E241C] border-[#183B2B] text-[#22C55E]'
                : 'bg-[#D0D6C6] border-[#BDC4B4] text-[#12382B]'
            }`}
          >
            <Sprout className={`w-4 h-4 ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`} />
          </div>
          <span
            className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}
          >
            Maharashtra Crop-Risk Analytics
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className={`p-1.5 rounded-lg cursor-pointer ${
                isDark ? 'bg-[#0E241C] text-[#22C55E]' : 'bg-[#12382B] text-white'
              }`}
              title="Back to Project Homepage"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`p-1.5 rounded-lg border cursor-pointer ${
              isDark
                ? 'bg-[#0E241C] text-[#7A9187] border-[#183B2B] hover:text-white'
                : 'bg-[#D4D9CC] text-[#35483D] border-[#CCD2C4] hover:text-[#16221B]'
            }`}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80%] h-full z-10 shadow-2xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
