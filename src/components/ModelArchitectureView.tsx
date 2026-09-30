import React from 'react';
import { TENSOR_SPEC } from '../data/satelliteSpec';
import { Layers, Cpu, Clock, ShieldCheck, ArrowRight, Zap, Target } from 'lucide-react';

export const ModelArchitectureView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="bg-[#131920] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="font-semibold uppercase tracking-wider">Deep Learning Model Design</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400">Spatiotemporal Multi-Modal Fusion</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Spatiotemporal CNN-LSTM Network Architecture
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Fuses fine-scale spatial crop canopy vigor (TimeDistributed 2D-CNN) with temporal monsoon deficit sequences (BiLSTM) and macro-climatic El Niño SST forcing to forecast crop failure 60–75 days prior to harvest.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-400 shrink-0">
            <span className="px-3.5 py-2 rounded-xl bg-[#0B0F14] border border-slate-800 text-emerald-400 font-bold">
              ~78,400 Trainable Parameters
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visual Pipeline Flow Diagram */}
      <div className="bg-[#131920] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Tensor Transformations Across the Early Warning Window</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">Batch Size: B · Time Steps: T=6 (Bi-weekly June–August)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Stage 1 */}
          <div className="p-4 rounded-xl bg-[#0B0F14] border border-slate-800 relative">
            <div className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Stage 1: Inputs</div>
            <h4 className="text-sm font-bold text-white mt-1">Multi-Modal Tensors</h4>
            <div className="mt-3 space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#131920] border border-slate-800">
                <span className="text-slate-400 block text-[10px]">SPATIAL TENSOR:</span>
                <span className="text-white font-bold">[B, 6, 8, 32, 32]</span>
                <span className="text-slate-400 block text-[10px] mt-0.5">8 spectral bands, 10m GSD</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#131920] border border-slate-800">
                <span className="text-slate-400 block text-[10px]">EXOGENOUS CLIMATE:</span>
                <span className="text-sky-300 font-bold">[B, 6, 4]</span>
                <span className="text-slate-400 block text-[10px] mt-0.5">Rain, Anom, ONI, Event</span>
              </div>
            </div>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </div>
          </div>

          {/* Stage 2 */}
          <div className="p-4 rounded-xl bg-[#0B0F14] border border-slate-800 relative">
            <div className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Stage 2: Spatial Encoder</div>
            <h4 className="text-sm font-bold text-white mt-1">TimeDistributed 2D-CNN</h4>
            <div className="mt-3 space-y-1.5 text-[11px] font-mono text-slate-400">
              <div className="p-2 rounded-lg bg-[#131920] border border-slate-800">Conv2d(8&rarr;16) + MaxPool &rarr; 16x16</div>
              <div className="p-2 rounded-lg bg-[#131920] border border-slate-800">Conv2d(16&rarr;32) + MaxPool &rarr; 8x8</div>
              <div className="p-2 rounded-lg bg-[#131920] border border-slate-800">Conv2d(32&rarr;64) + AdaptivePool &rarr; 1x1</div>
              <div className="p-2 rounded-lg bg-[#131920] border border-slate-800 text-emerald-400 font-bold">
                Spatial Vector: [B, 6, 64]
              </div>
            </div>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </div>
          </div>

          {/* Stage 3 */}
          <div className="p-4 rounded-xl bg-[#0B0F14] border border-slate-800 relative">
            <div className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Stage 3: Recurrent Core</div>
            <h4 className="text-sm font-bold text-white mt-1">Bidirectional LSTM</h4>
            <div className="mt-3 space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#131920] border border-slate-800">
                <span className="text-slate-400 block text-[10px]">FUSED STEP VECTOR:</span>
                <span className="text-white font-bold">[B, 6, 68]</span>
                <span className="text-slate-400 block text-[10px] mt-0.5">64 (spatial) + 4 (climate)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#131920] border border-slate-800">
                <span className="text-slate-400 block text-[10px]">2-LAYER BiLSTM OUTPUT:</span>
                <span className="text-emerald-400 font-bold">[B, 128]</span>
                <span className="text-slate-400 block text-[10px] mt-0.5">2 * 64 hidden units</span>
              </div>
            </div>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </div>
          </div>

          {/* Stage 4 */}
          <div className="p-4 rounded-xl bg-[#0B0F14] border border-slate-800">
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
                <span className="font-bold text-xs">{TENSOR_SPEC.modelNomenclature.predictionOutputLabel}</span>
                <span className="text-slate-400 block text-[10px] mt-0.5">P &isin; [0, 1] via Sigmoid</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Temporal Independence & Loss Formulation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-[#131920] border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>ZERO TEMPORAL LEAKAGE ENFORCEMENT</span>
          </div>
          <h4 className="text-base font-bold text-white">Strict Timeline Partitioning</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            The model strictly observes input features up to <strong className="text-white">August 31</strong> of year $t$. Post-August rainfall (September–October), late-season satellite passes, and DES harvest yields are never provided as model inputs during inference.
          </p>
          <div className="p-3.5 rounded-xl bg-[#0B0F14] border border-slate-800 text-xs font-mono text-slate-400 space-y-1.5">
            <div className="flex justify-between">
              <span>Observation Horizon:</span>
              <span className="text-white">June 1 – August 31 (In-Season)</span>
            </div>
            <div className="flex justify-between">
              <span>Forecast Target Date:</span>
              <span className="text-white">October – November Harvest</span>
            </div>
            <div className="flex justify-between">
              <span>Decision Lead Time:</span>
              <span className="text-emerald-400 font-bold">60 to 75 Days Advance Warning</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#131920] border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-semibold">
            <Target className="w-4 h-4" />
            <span>TRAINING & LOSS FORMULATION</span>
          </div>
          <h4 className="text-base font-bold text-white">Handling Class Imbalance</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Crop failure events occur in approximately 12–18% of district-years. Standard Cross-Entropy will bias towards the majority normal class without loss weighting.
          </p>
          <div className="p-3.5 rounded-xl bg-[#0B0F14] border border-slate-800 text-xs font-mono text-slate-400 space-y-1.5">
            <div className="text-white font-semibold">Weighted BCE Loss Formulation:</div>
            <div className="text-slate-300 font-mono">
              Loss = - [w &middot; y &middot; log(p_pred) + (1 - y) &middot; log(1 - p_pred)]
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              w &approx; 4.5 pos_weight penalizes false negatives (missed crop failures) 4.5x more heavily than false alarms.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
