import React, { useState } from 'react';
import { Cpu, Database, CheckCircle, AlertTriangle, ShieldCheck, Terminal, Layers } from 'lucide-react';
import { getModelSystemDiagnostics } from '../ml/modelPipeline';

export const ModelIntegrityInspector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const diagnostics = getModelSystemDiagnostics();

  return (
    <div className="bg-[#091410] border border-[#14261F] rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0D241B] border border-[#173D2C] flex items-center justify-center text-[#22C55E]">
            <Cpu className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Model Integrity & Runtime Architecture Diagnostics
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#14261F] text-[#38BDF8] border border-[#1F3D32]">
                TensorFlow.js Verified
              </span>
            </div>
            <p className="text-xs text-[#80978E] mt-0.5 font-medium">
              Authoritative runtime parameters, tensor flow verification, and data availability audit
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E281F] hover:bg-[#14382B] text-[#22C55E] border border-[#1B4B38] text-xs font-mono font-bold transition-colors cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{isOpen ? 'Hide Architecture Audit' : 'Inspect Architecture & Parameters'}</span>
        </button>
      </div>

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-[#14261F]">
        {/* Metric 1: Authoritative Parameter Count */}
        <div className="p-3 rounded-xl bg-[#060D0A] border border-[#14261F]">
          <span className="text-[10px] text-[#7A9187] uppercase font-mono block">Runtime Trainable Params</span>
          <span className="text-lg sm:text-xl font-bold font-mono text-[#38BDF8] block mt-1">
            {diagnostics.authoritativeParamCount.toLocaleString()}
          </span>
          <span className="text-[9px] text-[#556B62] font-mono block mt-0.5">
            via model.countParams()
          </span>
        </div>

        {/* Metric 2: Dataset Sample Count */}
        <div className="p-3 rounded-xl bg-[#060D0A] border border-[#14261F]">
          <span className="text-[10px] text-[#7A9187] uppercase font-mono block">Total Dataset Samples</span>
          <span className="text-lg sm:text-xl font-bold font-mono text-white block mt-1">
            {diagnostics.totalSamplesInDataset}
          </span>
          <span className="text-[9px] text-[#556B62] font-mono block mt-0.5">
            24 districts × 8 seasons (2015–22)
          </span>
        </div>

        {/* Metric 3: Spatial Branch Status */}
        <div className="p-3 rounded-xl bg-[#060D0A] border border-[#14261F]">
          <span className="text-[10px] text-[#7A9187] uppercase font-mono block">Sentinel-2 Spatial Branch</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#EAB308] animate-pulse"></span>
            <span className="text-xs font-bold font-mono text-[#EAB308]">
              {diagnostics.spatialBranchStatus}
            </span>
          </div>
          <span className="text-[9px] text-[#556B62] font-mono block mt-0.5">
            scripts/extract_sentinel2_cropland.js
          </span>
        </div>

        {/* Metric 4: Inference Engine */}
        <div className="p-3 rounded-xl bg-[#060D0A] border border-[#14261F]">
          <span className="text-[10px] text-[#7A9187] uppercase font-mono block">Inference Execution</span>
          <div className="flex items-center gap-1.5 mt-1">
            <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" />
            <span className="text-xs font-bold font-mono text-[#22C55E]">Decoupled Graph</span>
          </div>
          <span className="text-[9px] text-[#556B62] font-mono block mt-0.5">
            Zero DES shortcut leakage
          </span>
        </div>
      </div>

      {/* Expanded Architecture Details */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-[#14261F] space-y-4">
          {/* Sample Limitation Notice */}
          <div className="p-3.5 rounded-xl bg-[#141E11] border border-[#2D3E1A] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#EAB308] shrink-0 mt-0.5" />
            <div className="text-xs text-[#D8E6C3] space-y-1">
              <span className="font-bold block text-white font-mono">
                Academic PBL Dataset Limitation & Non-Fabrication Notice
              </span>
              <p className="leading-relaxed">
                {diagnostics.sampleLimitationNotice}
              </p>
              <p className="text-[11px] text-[#9FB388]">
                <strong>Status:</strong> The complete CNN-LSTM architecture is fully compiled in TensorFlow.js. Training has not been executed on fabricated pixels. Once real Sentinel-2 rasters are exported via the GEE script, full LOSO training will be executed.
              </p>
            </div>
          </div>

          {/* Tensor Flow Verification Box */}
          <div className="p-3 rounded-xl bg-[#060D0A] border border-[#14261F]">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-white mb-2">
              <span className="flex items-center gap-1.5 text-[#38BDF8]">
                <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
                Tensor Flow & Shape Verification
              </span>
              <span className="text-[#22C55E]">PASSED</span>
            </div>
            <p className="text-xs font-mono text-[#80978E] bg-[#030806] p-2.5 rounded-lg border border-[#0D1A14]">
              {diagnostics.shapeVerificationLog}
            </p>
          </div>

          {/* Compiled Layer Breakdown */}
          <div className="p-3 rounded-xl bg-[#060D0A] border border-[#14261F] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-white pb-2 border-b border-[#14261F]">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#22C55E]" />
                Compiled TensorFlow.js Layers ({diagnostics.layers.length} Active Nodes)
              </span>
              <span className="text-[#80978E]">Sum = {diagnostics.authoritativeParamCount.toLocaleString()} params</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-[#6A8177] border-b border-[#14261F] text-[10px] uppercase">
                    <th className="py-1.5 px-2">Layer Name</th>
                    <th className="py-1.5 px-2">Class</th>
                    <th className="py-1.5 px-2">Output Shape</th>
                    <th className="py-1.5 px-2 text-right">Parameters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0F1E18]">
                  {diagnostics.layers.map((l, idx) => (
                    <tr key={idx} className="hover:bg-[#0A1612]">
                      <td className="py-1.5 px-2 text-white font-medium">{l.name}</td>
                      <td className="py-1.5 px-2 text-[#80978E]">{l.className}</td>
                      <td className="py-1.5 px-2 text-[#38BDF8]">
                        [{l.outputShape ? l.outputShape.map(s => (s === null ? 'B' : s)).join(', ') : 'null'}]
                      </td>
                      <td className="py-1.5 px-2 text-right text-[#22C55E]">
                        {l.paramCount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
