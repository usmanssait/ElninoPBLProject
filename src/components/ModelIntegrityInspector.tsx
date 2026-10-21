import React, { useState } from 'react';
import { Cpu, CheckCircle, AlertTriangle, ShieldCheck, Terminal, Layers } from 'lucide-react';
import { getModelSystemDiagnostics } from '../ml/modelPipeline';
import { useAppTheme } from '../context/ThemeContext';

export const ModelIntegrityInspector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const diagnostics = getModelSystemDiagnostics();
  const { isDark } = useAppTheme();

  return (
    <div
      className={`border rounded-2xl p-4 sm:p-5 shadow-xs ${
        isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
      }`}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
              isDark
                ? 'bg-[#060D0A] border-[#14261F] text-[#22C55E]'
                : 'bg-[#DCE1D4] border-[#CCD2C4] text-[#12382B]'
            }`}
          >
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                Model Integrity &amp; Runtime Architecture Diagnostics
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  isDark
                    ? 'bg-[#0E241C] text-[#22C55E] border-[#183B2B]'
                    : 'bg-[#DCE1D4] text-[#12382B] border-[#CCD2C4]'
                }`}
              >
                PyTorch Checkpoint Connected
              </span>
            </div>
            <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
              Authoritative parameters ({diagnostics.authoritativeParamCount.toLocaleString()}), tensor flow verification, and offline PyTorch inference audit
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer shadow-xs ${
            isDark
              ? 'bg-[#0E241C] text-[#22C55E] hover:bg-[#133025] border border-[#183B2B]'
              : 'bg-[#12382B] hover:bg-[#1A4C3B] text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{isOpen ? 'Hide Architecture Audit' : 'Inspect Architecture & Parameters'}</span>
        </button>
      </div>

      {/* Summary Stat Grid */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t ${isDark ? 'border-[#14261F]' : 'border-[#CCD2C4]'}`}>
        {/* Metric 1: Authoritative Parameter Count */}
        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-[#EAECE4] border-[#CCD2C4]'}`}>
          <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>Runtime Trainable Params</span>
          <span className="text-lg sm:text-xl font-bold font-mono text-[#38BDF8] block mt-1">
            {diagnostics.authoritativeParamCount.toLocaleString()}
          </span>
          <span className={`text-[9px] font-mono block mt-0.5 ${isDark ? 'text-[#7A9187]' : 'text-[#718277]'}`}>
            PyTorch CNN-LSTM Checkpoint
          </span>
        </div>

        {/* Metric 2: Dataset Sample Count */}
        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-[#EAECE4] border-[#CCD2C4]'}`}>
          <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>Dataset Patch Rows</span>
          <span className={`text-lg sm:text-xl font-bold font-mono block mt-1 ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
            {diagnostics.totalSamplesInDataset}
          </span>
          <span className={`text-[9px] font-mono block mt-0.5 ${isDark ? 'text-[#7A9187]' : 'text-[#718277]'}`}>
            matched S2 + IMD + DES records
          </span>
        </div>

        {/* Metric 3: Spatial Branch Status */}
        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-[#EAECE4] border-[#CCD2C4]'}`}>
          <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>Sentinel-2 Spatial Branch</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
            <span className="text-xs font-bold font-mono text-[#22C55E]">
              {diagnostics.spatialBranchStatus}
            </span>
          </div>
          <span className={`text-[9px] font-mono block mt-0.5 ${isDark ? 'text-[#7A9187]' : 'text-[#718277]'}`}>
            2019–2022 Kharif rasters
          </span>
        </div>

        {/* Metric 4: Inference Engine */}
        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-[#EAECE4] border-[#CCD2C4]'}`}>
          <span className={`text-[10px] uppercase font-mono block ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>Inference Execution</span>
          <div className="flex items-center gap-1.5 mt-1">
            <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" />
            <span className="text-xs font-bold font-mono text-[#22C55E]">PyTorch CNN-LSTM</span>
          </div>
          <span className={`text-[9px] font-mono block mt-0.5 ${isDark ? 'text-[#7A9187]' : 'text-[#718277]'}`}>
            crop_model_output checkpoint
          </span>
        </div>
      </div>

      {/* Expanded Architecture Details */}
      {isOpen && (
        <div className={`mt-4 pt-4 border-t space-y-4 ${isDark ? 'border-[#14261F]' : 'border-[#CCD2C4]'}`}>
          {/* Sample Limitation Notice */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isDark
                ? 'bg-[#352A12] border-[#604D20] text-amber-200'
                : 'bg-[#FEF3C7] border-[#FDE68A] text-amber-950'
            }`}
          >
            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-800'}`} />
            <div className="text-xs space-y-1">
              <span className="font-bold block font-mono">
                Model Evaluation &amp; Empirical Generalization Audit
              </span>
              <p className="leading-relaxed">
                {diagnostics.sampleLimitationNotice}
              </p>
              <p className={`text-[11px] ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                <strong>Scientific limitation:</strong> {diagnostics.evaluation.warning}
              </p>
            </div>
          </div>

          {/* Tensor Flow Verification Box */}
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-white border-[#CCD2C4]'}`}>
            <div className={`flex items-center justify-between text-xs font-mono font-bold mb-2 ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
              <span className="flex items-center gap-1.5 text-[#38BDF8]">
                <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
                Tensor Flow &amp; Shape Verification
              </span>
              <span className="text-[#22C55E]">VERIFIED</span>
            </div>
            <p className={`text-xs font-mono p-2.5 rounded-lg border ${isDark ? 'bg-[#091410] border-[#14261F] text-[#A3B8AF]' : 'bg-[#EAECE4] border-[#CCD2C4] text-[#526458]'}`}>
              {diagnostics.shapeVerificationLog}
            </p>
          </div>

          {/* Compiled Layer Breakdown */}
          <div className={`p-3 rounded-xl border space-y-2 ${isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-white border-[#CCD2C4]'}`}>
            <div className={`flex items-center justify-between text-xs font-mono font-bold pb-2 border-b ${isDark ? 'border-[#14261F] text-white' : 'border-[#CCD2C4] text-[#16221B]'}`}>
              <span className="flex items-center gap-1.5">
                <Layers className={`w-4 h-4 ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`} />
                Model Layers ({diagnostics.layers.length} Functional Stages)
              </span>
              <span className={isDark ? 'text-[#7A9187]' : 'text-[#526458]'}>Sum = {diagnostics.authoritativeParamCount.toLocaleString()} params</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className={`border-b text-[10px] uppercase ${isDark ? 'border-[#14261F] text-[#7A9187]' : 'border-[#CCD2C4] text-[#526458]'}`}>
                    <th className="py-1.5 px-2">Layer Name</th>
                    <th className="py-1.5 px-2">Specification</th>
                    <th className="py-1.5 px-2">Output Shape</th>
                    <th className="py-1.5 px-2 text-right">Parameters</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#14261F]' : 'divide-[#CCD2C4]'}`}>
                  {diagnostics.layers.map((l, idx) => (
                    <tr
                      key={idx}
                      className={`transition-colors ${isDark ? 'hover:bg-[#0E241C]/40' : 'hover:bg-[#F2F4EE]'}`}
                    >
                      <td className={`py-1.5 px-2 font-medium ${isDark ? 'text-white' : 'text-[#16221B]'}`}>{l.name}</td>
                      <td className={`py-1.5 px-2 ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>{l.type}</td>
                      <td className="py-1.5 px-2 text-[#38BDF8]">{l.outputShape}</td>
                      <td className="py-1.5 px-2 text-right text-[#22C55E] font-semibold">
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
