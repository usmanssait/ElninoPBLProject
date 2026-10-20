import React, { useState } from 'react';
import { Cpu, CheckCircle, AlertTriangle, ShieldCheck, Terminal, Layers } from 'lucide-react';
import { getModelSystemDiagnostics } from '../ml/modelPipeline';

export const ModelIntegrityInspector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const diagnostics = getModelSystemDiagnostics();

  return (
    <div className="bg-[#E2E6DC] border border-[#CCD2C4] rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#DCE1D4] border border-[#CCD2C4] flex items-center justify-center text-[#12382B]">
            <Cpu className="w-5 h-5 text-[#12382B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#16221B] tracking-tight">
                Model Integrity &amp; Runtime Architecture Diagnostics
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#DCE1D4] text-[#12382B] border border-[#CCD2C4]">
                PyTorch Checkpoint Connected
              </span>
            </div>
            <p className="text-xs text-[#526458] mt-0.5 font-medium">
              Authoritative parameters ({diagnostics.authoritativeParamCount.toLocaleString()}), tensor flow verification, and offline PyTorch inference audit
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#12382B] hover:bg-[#1A4C3B] text-white text-xs font-mono font-bold transition-colors cursor-pointer shadow-xs"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{isOpen ? 'Hide Architecture Audit' : 'Inspect Architecture & Parameters'}</span>
        </button>
      </div>

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-[#CCD2C4]">
        {/* Metric 1: Authoritative Parameter Count */}
        <div className="p-3 rounded-xl bg-[#EAECE4] border border-[#CCD2C4]">
          <span className="text-[10px] text-[#526458] uppercase font-mono block">Runtime Trainable Params</span>
          <span className="text-lg sm:text-xl font-bold font-mono text-[#0284C7] block mt-1">
            {diagnostics.authoritativeParamCount.toLocaleString()}
          </span>
          <span className="text-[9px] text-[#718277] font-mono block mt-0.5">
            PyTorch CNN-LSTM Checkpoint
          </span>
        </div>

        {/* Metric 2: Dataset Sample Count */}
        <div className="p-3 rounded-xl bg-[#EAECE4] border border-[#CCD2C4]">
          <span className="text-[10px] text-[#526458] uppercase font-mono block">Dataset Patch Rows</span>
          <span className="text-lg sm:text-xl font-bold font-mono text-[#16221B] block mt-1">
            {diagnostics.totalSamplesInDataset}
          </span>
          <span className="text-[9px] text-[#718277] font-mono block mt-0.5">
            matched S2 + IMD + DES records
          </span>
        </div>

        {/* Metric 3: Spatial Branch Status */}
        <div className="p-3 rounded-xl bg-[#EAECE4] border border-[#CCD2C4]">
          <span className="text-[10px] text-[#526458] uppercase font-mono block">Sentinel-2 Spatial Branch</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
            <span className="text-xs font-bold font-mono text-[#16A34A]">
              {diagnostics.spatialBranchStatus}
            </span>
          </div>
          <span className="text-[9px] text-[#718277] font-mono block mt-0.5">
            2019–2022 Kharif rasters
          </span>
        </div>

        {/* Metric 4: Inference Engine */}
        <div className="p-3 rounded-xl bg-[#EAECE4] border border-[#CCD2C4]">
          <span className="text-[10px] text-[#526458] uppercase font-mono block">Inference Execution</span>
          <div className="flex items-center gap-1.5 mt-1">
            <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />
            <span className="text-xs font-bold font-mono text-[#16A34A]">PyTorch CNN-LSTM</span>
          </div>
          <span className="text-[9px] text-[#718277] font-mono block mt-0.5">
            crop_model_output checkpoint
          </span>
        </div>
      </div>

      {/* Expanded Architecture Details */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-[#CCD2C4] space-y-4">
          {/* Sample Limitation Notice */}
          <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 space-y-1">
              <span className="font-bold block text-amber-950 font-mono">
                Model Evaluation &amp; Academic Prototype Audit
              </span>
              <p className="leading-relaxed">
                {diagnostics.sampleLimitationNotice}
              </p>
              <p className="text-[11px] text-amber-900">
                <strong>Scientific limitation:</strong> {diagnostics.evaluation.warning}
              </p>
            </div>
          </div>

          {/* Tensor Flow Verification Box */}
          <div className="p-3 rounded-xl bg-white border border-[#CCD2C4]">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#16221B] mb-2">
              <span className="flex items-center gap-1.5 text-[#0284C7]">
                <ShieldCheck className="w-4 h-4 text-[#0284C7]" />
                Tensor Flow &amp; Shape Verification
              </span>
              <span className="text-[#16A34A]">VERIFIED</span>
            </div>
            <p className="text-xs font-mono text-[#526458] bg-[#EAECE4] p-2.5 rounded-lg border border-[#CCD2C4]">
              {diagnostics.shapeVerificationLog}
            </p>
          </div>

          {/* Compiled Layer Breakdown */}
          <div className="p-3 rounded-xl bg-white border border-[#CCD2C4] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#16221B] pb-2 border-b border-[#CCD2C4]">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#12382B]" />
                Model Layers ({diagnostics.layers.length} Functional Stages)
              </span>
              <span className="text-[#526458]">Sum = {diagnostics.authoritativeParamCount.toLocaleString()} params</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-[#526458] border-b border-[#CCD2C4] text-[10px] uppercase">
                    <th className="py-1.5 px-2">Layer Name</th>
                    <th className="py-1.5 px-2">Specification</th>
                    <th className="py-1.5 px-2">Output Shape</th>
                    <th className="py-1.5 px-2 text-right">Parameters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CCD2C4]">
                  {diagnostics.layers.map((l, idx) => (
                    <tr key={idx} className="hover:bg-[#F2F4EE]">
                      <td className="py-1.5 px-2 text-[#16221B] font-medium">{l.name}</td>
                      <td className="py-1.5 px-2 text-[#526458]">{l.type}</td>
                      <td className="py-1.5 px-2 text-[#0284C7]">{l.outputShape}</td>
                      <td className="py-1.5 px-2 text-right text-[#16A34A] font-semibold">
                        {l.params.toLocaleString()}
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
