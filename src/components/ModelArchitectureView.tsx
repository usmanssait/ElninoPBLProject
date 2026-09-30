import React from 'react';
import { TENSOR_SPEC } from '../data/satelliteSpec';
import { Layers, ShieldCheck, Target, ArrowRight } from 'lucide-react';

export const ModelArchitectureView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 w-full overflow-hidden">
      {/* 1. Header Banner */}
      <div className="bg-[#131920] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="font-semibold uppercase tracking-wider">Model Architecture</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400">Spatiotemporal Multi-Modal Deep Learning</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Spatiotemporal CNN-LSTM Network
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Extracts spatial crop canopy features from Sentinel-2 satellite imagery using a 2D-CNN, fuses them with IMD rainfall and NOAA ONI climate features, and models temporal sequence dynamics with a Bidirectional LSTM to predict rice crop-failure probability.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-400 shrink-0">
            <span className="px-3.5 py-2 rounded-xl bg-[#0B0F14] border border-slate-800 text-emerald-400 font-bold">
              ~78,400 Trainable Parameters
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visual Pipeline Flow Diagram - Responsive Grid with Zero Overflow */}
      <div className="bg-[#131920] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 w-full overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Spatiotemporal Tensor Transformation Pipeline</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Batch: B · Temporal Steps: T = 6 (Bi-weekly June 1 – August 31)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {/* Stage 1 */}
          <div className="p-4 rounded-xl bg-[#0B0F14] border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Stage 1: Model Inputs</div>
              <h4 className="text-sm font-bold text-white mt-1">Multi-Modal Inputs</h4>
              <div className="mt-3 space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#131920] border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">SENTINEL-2 SPATIAL TENSOR:</span>
                  <span className="text-white font-bold">[B, 6, 8, 32, 32]</span>
                  <span className="text-slate-400 block text-[10px] mt-0.5">8 bands, 10m/20m GSD patches</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#131920] border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">IMD + ONI CLIMATE TENSOR:</span>
                  <span className="text-sky-300 font-bold">[B, 6, 4]</span>
                  <span className="text-slate-400 block text-[10px] mt-0.5">Rainfall, Anomaly, ONI, Flag</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Step 1 of 4</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          {/* Stage 2 */}
          <div className="p-4 rounded-xl bg-[#0B0F14] border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Stage 2: Spatial Encoder</div>
              <h4 className="text-sm font-bold text-white mt-1">TimeDistributed 2D-CNN</h4>
              <div className="mt-3 space-y-1.5 text-[11px] font-mono text-slate-400">
                <div className="p-2 rounded-lg bg-[#131920] border border-slate-800">Conv2d(8&rarr;16) + MaxPool</div>
                <div className="p-2 rounded-lg bg-[#131920] border border-slate-800">Conv2d(16&rarr;32) + MaxPool</div>
                <div className="p-2 rounded-lg bg-[#131920] border border-slate-800">Conv2d(32&rarr;64) + AdaptivePool</div>
                <div className="p-2 rounded-lg bg-[#131920] border border-slate-800 text-emerald-400 font-bold">
                  Spatial Vector: [B, 6, 64]
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Step 2 of 4</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          {/* Stage 3 */}
          <div className="p-4 rounded-xl bg-[#0B0F14] border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Stage 3: Sequence Core</div>
              <h4 className="text-sm font-bold text-white mt-1">Bidirectional LSTM</h4>
              <div className="mt-3 space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#131920] border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">FUSED TIME-STEP TENSOR:</span>
                  <span className="text-white font-bold">[B, 6, 68]</span>
                  <span className="text-slate-400 block text-[10px] mt-0.5">64 spatial + 4 climate</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#131920] border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">2-LAYER BiLSTM HIDDEN:</span>
                  <span className="text-emerald-400 font-bold">[B, 128]</span>
                  <span className="text-slate-400 block text-[10px] mt-0.5">Forward + backward context</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Step 3 of 4</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          {/* Stage 4 */}
          <div className="p-4 rounded-xl bg-[#0B0F14] border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Stage 4: Prediction Head</div>
              <h4 className="text-sm font-bold text-white mt-1">Classification Head</h4>
              <div className="mt-3 space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#131920] border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">DENSE LAYERS:</span>
                  <span className="text-slate-300">Linear(128&rarr;32) + Dropout(0.3)</span>
                  <span className="text-slate-300 block">Linear(32&rarr;1) Logits</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#131920] border border-emerald-500/40 text-white">
                  <span className="text-emerald-400 block text-[10px] font-bold">MODEL OUTPUT:</span>
                  <span className="font-bold text-xs">Crop-Failure Probability</span>
                  <span className="text-slate-400 block text-[10px] mt-0.5">P(failure) &isin; [0, 1] via Sigmoid</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-emerald-400 font-bold">
              <span>Final Output</span>
              <span>P &isin; [0, 1]</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Viva Explanations: Temporal Cutoff & Loss Function */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 sm:p-6 rounded-2xl bg-[#131920] border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>TEMPORAL CUTOFF & LEAD TIME</span>
          </div>
          <h4 className="text-base font-bold text-white">August 31 In-Season Horizon</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            The model strictly stops ingesting data on <strong className="text-white">August 31</strong> of Kharif season $t$. Harvest yields (October–November) and late September rains are withheld during inference.
          </p>
          <div className="p-3.5 rounded-xl bg-[#0B0F14] border border-slate-800 text-xs font-mono text-slate-400 space-y-1.5">
            <div className="flex justify-between">
              <span>Input Observation Window:</span>
              <span className="text-white">June 1 – August 31 (In-Season)</span>
            </div>
            <div className="flex justify-between">
              <span>Harvest Timing:</span>
              <span className="text-white">October – November</span>
            </div>
            <div className="flex justify-between">
              <span>Early Warning Notice:</span>
              <span className="text-emerald-400 font-bold">60 to 75 Days Advance Warning</span>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-[#131920] border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-semibold">
            <Target className="w-4 h-4" />
            <span>CLASS IMBALANCE & LOSS FUNCTION</span>
          </div>
          <h4 className="text-base font-bold text-white">Weighted Binary Cross-Entropy</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Severe crop-failure events occur in only ~15% of historical district-years. An unweighted loss function would bias predictions toward the majority normal class.
          </p>
          <div className="p-3.5 rounded-xl bg-[#0B0F14] border border-slate-800 text-xs font-mono text-slate-400 space-y-1.5">
            <div className="text-white font-semibold">Loss Formulation:</div>
            <div className="text-slate-300 font-mono">
              Loss = - [w &middot; y &middot; log(p) + (1 - y) &middot; log(1 - p)]
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Positive weight (w &approx; 4.5) penalizes false negatives (missed failures) more heavily than false alarms.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
