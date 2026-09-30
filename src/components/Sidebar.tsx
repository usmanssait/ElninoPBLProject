import React, { useState } from 'react';
import {
  Layers,
  Activity,
  ShieldCheck,
  Database,
  Sprout,
  Menu,
  X,
} from 'lucide-react';

export type ActiveTab = 'map' | 'model' | 'loso' | 'data';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      id: 'map' as ActiveTab,
      label: 'District Risk Map',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'model' as ActiveTab,
      label: 'CNN-LSTM Network',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: 'loso' as ActiveTab,
      label: 'LOSO Validation',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'data' as ActiveTab,
      label: 'Data Sources & Links',
      icon: <Database className="w-4 h-4" />,
    },
  ];

  const handleSelectTab = (id: ActiveTab) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between p-4 bg-[#08120E] text-[#E8EFEB]">
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pt-1">
          <div className="w-9 h-9 rounded-xl bg-[#0D241C] border border-[#164332] text-[#22C55E] flex items-center justify-center shrink-0 shadow-xs">
            <Sprout className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold tracking-tight text-white truncate">
              Maharashtra
            </span>
            <span className="text-xs font-semibold text-[#E1EAE5] tracking-tight truncate">
              Crop-Risk CNN-LSTM
            </span>
            <span className="text-[10px] text-[#71877E] truncate font-mono mt-0.5">
              Spatiotemporal Rice Failure Early Warning
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#0E241C] text-white font-semibold border-l-2 border-[#22C55E] shadow-xs'
                    : 'text-[#849B90] hover:text-white hover:bg-[#0B1813]'
                }`}
              >
                <span
                  className={`${
                    isActive ? 'text-[#22C55E]' : 'text-[#647C72]'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Card with Mini Maharashtra Outline Graphic */}
      <div className="mt-6 pt-4 border-t border-[#13241C]">
        <div className="p-3.5 rounded-xl bg-[#0B1712] border border-[#14261E] relative overflow-hidden group">
          {/* Subtle radar / terrain grid pattern in background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 75% 35%, #22C55E 0%, transparent 60%), linear-gradient(to bottom right, #091913, #050E0B)`,
            }}
          />

          <div className="relative z-10 flex items-center gap-3">
            {/* Stylized Mini Maharashtra Outline Graphic */}
            <div className="w-12 h-10 shrink-0 relative flex items-center justify-center">
              <svg
                viewBox="0 0 100 85"
                className="w-full h-full text-[#1E3A2F]"
                fill="currentColor"
              >
                {/* Simplified Maharashtra Silhouette */}
                <path
                  d="M15,20 L35,10 L75,8 L95,22 L85,45 L78,65 L50,80 L35,75 L20,82 L10,65 L18,45 Z"
                  fill="#112B21"
                  stroke="#22C55E"
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                />
                {/* Pinpoint over Vidarbha */}
                <circle cx="75" cy="30" r="3.5" fill="#22C55E" />
                <circle
                  cx="75"
                  cy="30"
                  r="7"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              </svg>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-white tracking-tight truncate">
                Maharashtra
              </span>
              <span className="text-[10px] text-[#A3B8AF] font-medium truncate">
                Kharif Rice
              </span>
              <span className="text-[9px] font-mono text-[#62776E] mt-0.5">
                2015 – 2022 DES Ground Truth
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-[#586E64] px-1">
          <span>B.Tech PBL Project</span>
          <span className="text-[#22C55E] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>
            Operational
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:flex w-60 xl:w-64 shrink-0 flex-col h-screen sticky top-0 border-r border-[#13241C] z-30">
        {navContent}
      </aside>

      {/* Mobile Top Header with Hamburger Toggle */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#08120E] border-b border-[#13241C] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0D241C] border border-[#164332] text-[#22C55E] flex items-center justify-center">
            <Sprout className="w-4 h-4 text-[#22C55E]" />
          </div>
          <span className="text-xs font-bold text-white">
            Maharashtra Crop-Risk CNN-LSTM
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg bg-[#0C1914] text-[#A3B8AF] border border-[#162A21] hover:text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
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
