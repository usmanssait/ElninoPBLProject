import React from 'react';
import { Sprout, Activity, Database, Layers, ShieldCheck } from 'lucide-react';

export type ActiveTab = 'map' | 'model' | 'loso' | 'data';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const navTabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'map', label: 'District Risk Map', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'model', label: 'CNN-LSTM Network', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'loso', label: 'LOSO Validation', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'data', label: 'Data Sources & Baseline', icon: <Database className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B0F14]/95 border-b border-slate-800/80 text-slate-100 px-4 sm:px-6 lg:px-8 py-3 w-full">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Wordmark branding */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-xs">
            <Sprout className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-semibold tracking-tight text-white flex items-center gap-2">
              Maharashtra Crop-Risk CNN-LSTM
            </span>
            <span className="text-[10px] font-mono text-emerald-400/90 hidden sm:inline">
              Spatiotemporal Rice Failure Prediction
            </span>
          </div>
        </div>

        {/* 4 Clean Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
          {navTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Project badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>B.Tech PBL Project</span>
          </div>
        </div>
      </div>

      {/* Mobile navigation tabs */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 border-t border-slate-800/60 mt-2 scrollbar-none">
        {navTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
