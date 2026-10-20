import React from 'react';
import { Collapsible } from '../components/common/Collapsible';
import { ProjectScriptsInspectorView } from '../components/ProjectScriptsInspectorView';
import { PyTorchExportView } from '../components/PyTorchExportView';
import { FileCode2, Terminal, Info, CheckCircle2, AlertCircle } from 'lucide-react';

export const AboutProjectPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#E8EFEB]">
      {/* Header */}
      <div className="pb-2 border-b border-[#14261F]/60">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          About Spatiotemporal Crop Risk Analytics System
        </h1>
        <p className="text-xs text-[#80978E] mt-0.5 font-medium">
          Undergraduate B.Tech PBL Research Framework for Crop Failure Early Warning during El Niño Events across Maharashtra
        </p>
      </div>

      {/* Project Abstract & Roadmap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#091410] border border-[#14261F] p-5 sm:p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Info className="w-4 h-4 text-[#22C55E]" />
            <span>Research Motivation & Objective</span>
          </div>
          <p className="text-xs text-[#A4B8AF] leading-relaxed">
            El Niño episodes induce erratic southwest monsoon rainfall patterns across central and peninsular India, leading to localized agricultural distress. This system integrates multi-spectral Sentinel-2 satellite imagery, daily IMD gridded rainfall, and NOAA ONI sea surface temperatures into a spatiotemporal CNN-BiLSTM neural network to predict crop failure up to 60–75 days prior to harvest.
          </p>
        </div>

        <div className="rounded-2xl bg-[#091410] border border-[#14261F] p-5 sm:p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
            <span>Development Roadmap & Crop Scope</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#16382A]">
              <span className="text-[#22C55E] font-bold block">Phase 1 (Current Active Build):</span>
              <span className="text-[#80978E] text-[11px] font-sans">
                Streamlined UI layout, grouped navigation, zero-leakage baseline audit, and rice pilot CNN-LSTM checkpoint evaluation.
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#14261F]">
              <span className="text-[#38BDF8] font-bold block">Phase 2 (Upcoming Expansion):</span>
              <span className="text-[#80978E] text-[11px] font-sans">
                Transition from rice to All Kharif Crops using DES multi-crop APY statistics and area-weighted Composite Kharif Yield Index.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Code Inspection & Reference Scripts Collapsibles */}
      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-bold text-white tracking-tight">
          Reference Code & Execution Pipelines
        </h2>

        <Collapsible
          title="Python Preprocessing & Visualization Scripts (Click to Inspect)"
          icon={<Terminal className="w-4 h-4" />}
          defaultOpen={false}
        >
          <div className="pt-2">
            <ProjectScriptsInspectorView />
          </div>
        </Collapsible>

        <Collapsible
          title="Standalone PyTorch CNN-LSTM Training & Inference Code"
          icon={<FileCode2 className="w-4 h-4" />}
          defaultOpen={false}
        >
          <div className="pt-2">
            <PyTorchExportView />
          </div>
        </Collapsible>
      </div>
    </div>
  );
};
