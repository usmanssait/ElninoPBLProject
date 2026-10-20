import React from 'react';
import { Collapsible } from '../components/common/Collapsible';
import { ProjectScriptsInspectorView } from '../components/ProjectScriptsInspectorView';
import { PyTorchExportView } from '../components/PyTorchExportView';
import { FileCode2, Terminal, Info, CheckCircle2 } from 'lucide-react';

export const AboutProjectPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#16221B] pb-12 w-full overflow-hidden">
      {/* Header */}
      <div className="bg-[#E2E6DC] border border-[#CCD2C4] rounded-2xl p-4 sm:p-5 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#16221B] font-serif">
          About Spatiotemporal Crop Risk Analytics System
        </h1>
        <p className="text-xs text-[#526458] mt-1 font-medium">
          Undergraduate B.Tech PBL Research Framework for Crop Failure Early Warning during El Niño Events across Maharashtra
        </p>
      </div>

      {/* Project Abstract & Roadmap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] p-5 sm:p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-[#16221B] font-bold text-sm">
            <Info className="w-4 h-4 text-[#12382B]" />
            <span className="font-serif">Research Motivation & Objective</span>
          </div>
          <p className="text-xs text-[#526458] leading-relaxed">
            El Niño episodes induce erratic southwest monsoon rainfall patterns across central and peninsular India, leading to localized agricultural distress. This system integrates multi-spectral Sentinel-2 satellite imagery, daily IMD gridded rainfall, and NOAA ONI sea surface temperatures into a spatiotemporal CNN-BiLSTM neural network to predict crop failure up to 60–75 days prior to harvest.
          </p>
        </div>

        <div className="rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] p-5 sm:p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-[#16221B] font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span className="font-serif">Development Roadmap & Crop Scope</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-white border border-[#CCD2C4] shadow-2xs">
              <span className="text-[#16A34A] font-bold block">Phase 1 (Current Active Build):</span>
              <span className="text-[#526458] text-[11px] font-sans block mt-0.5">
                Streamlined UI layout, grouped navigation, zero-leakage baseline audit, and rice pilot CNN-LSTM checkpoint evaluation.
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#CCD2C4] shadow-2xs">
              <span className="text-[#0284C7] font-bold block">Phase 2 (Upcoming Expansion):</span>
              <span className="text-[#526458] text-[11px] font-sans block mt-0.5">
                Transition from rice to All Kharif Crops using DES multi-crop APY statistics and area-weighted Composite Kharif Yield Index.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Code Inspection & Reference Scripts Collapsibles */}
      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-bold text-[#16221B] tracking-tight font-serif">
          Reference Code & Execution Pipelines
        </h2>

        <Collapsible
          title="Python Preprocessing & Visualization Scripts (Click to Inspect)"
          icon={<Terminal className="w-4 h-4 text-[#12382B]" />}
          defaultOpen={false}
        >
          <div className="pt-2">
            <ProjectScriptsInspectorView />
          </div>
        </Collapsible>

        <Collapsible
          title="Standalone PyTorch CNN-LSTM Training & Inference Code"
          icon={<FileCode2 className="w-4 h-4 text-[#12382B]" />}
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
