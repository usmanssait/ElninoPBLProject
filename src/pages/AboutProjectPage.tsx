import React from 'react';
import { Collapsible } from '../components/common/Collapsible';
import { ProjectScriptsInspectorView } from '../components/ProjectScriptsInspectorView';
import { PyTorchExportView } from '../components/PyTorchExportView';
import { FileCode2, Terminal, Info, CheckCircle2 } from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';

export const AboutProjectPage: React.FC = () => {
  const { isDark } = useAppTheme();

  return (
    <div className={`space-y-4 max-w-[1720px] mx-auto pb-12 w-full overflow-hidden ${isDark ? 'text-[#E8EFEB]' : 'text-[#16221B]'}`}>
      {/* Header */}
      <div
        className={`border rounded-2xl p-4 sm:p-5 shadow-xs ${
          isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
        }`}
      >
        <h1 className={`text-xl sm:text-2xl font-bold tracking-tight font-serif ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
          About Spatiotemporal Crop Risk Analytics System
        </h1>
        <p className={`text-xs mt-1 font-medium ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
          Undergraduate B.Tech PBL Research Framework for Crop Failure Early Warning during El Niño Events across Maharashtra
        </p>
      </div>

      {/* Project Abstract & Scope */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`rounded-2xl border p-5 sm:p-6 space-y-3 shadow-xs ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <Info className={`w-4 h-4 ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`} />
            <span className={`font-serif ${isDark ? 'text-white' : 'text-[#16221B]'}`}>Research Motivation & Objective</span>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
            El Niño episodes induce erratic southwest monsoon rainfall patterns across central and peninsular India, leading to localized agricultural distress. This system integrates multi-spectral Sentinel-2 satellite imagery, daily IMD gridded rainfall, and NOAA ONI sea surface temperatures into a spatiotemporal CNN-BiLSTM neural network to predict crop failure up to 60–75 days prior to harvest.
          </p>
        </div>

        <div
          className={`rounded-2xl border p-5 sm:p-6 space-y-3 shadow-xs ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
            <span className={`font-serif ${isDark ? 'text-white' : 'text-[#16221B]'}`}>Operational Coverage &amp; Agronomic Scope</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div
              className={`p-3 rounded-xl border shadow-2xs ${
                isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-white border-[#CCD2C4]'
              }`}
            >
              <span className="text-[#22C55E] font-bold block">Primary Paddy (Rice) Belts:</span>
              <span className={`text-[11px] font-sans block mt-0.5 ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
                24 monitored districts spanning Konkan (Thane, Raigad, Ratnagiri, Sindhudurg, Palghar) and Eastern Vidarbha (Bhandara, Gondia, Gadchiroli, Chandrapur, Nagpur).
              </span>
            </div>
            <div
              className={`p-3 rounded-xl border shadow-2xs ${
                isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-white border-[#CCD2C4]'
              }`}
            >
              <span className="text-[#38BDF8] font-bold block">Comparative Kharif Crops:</span>
              <span className={`text-[11px] font-sans block mt-0.5 ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
                Yield sensitivity profiles and empirical response modeling across Maharashtra Kharif staples: Rice, Soybean, Cotton, Bajra, Jowar, and Tur (Pigeon Pea).
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Code Inspection & Reference Scripts Collapsibles */}
      <div className="space-y-3 pt-2">
        <h2 className={`text-sm font-bold tracking-tight font-serif ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
          Reference Code & Execution Pipelines
        </h2>

        <Collapsible
          title="Python Preprocessing & Visualization Scripts (Click to Inspect)"
          icon={<Terminal className={`w-4 h-4 ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`} />}
          defaultOpen={false}
        >
          <div className="pt-2">
            <ProjectScriptsInspectorView />
          </div>
        </Collapsible>

        <Collapsible
          title="Standalone PyTorch CNN-LSTM Training & Inference Code"
          icon={<FileCode2 className={`w-4 h-4 ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`} />}
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
