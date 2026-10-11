import React from 'react';
import { TENSOR_SPEC } from '../data/satelliteSpec';
import { Layers, ShieldCheck, Target, ArrowRight, Cpu, Activity } from 'lucide-react';

export const ModelArchitectureView: React.FC = () => {
  return (
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#E8EFEB] pb-12 w-full overflow-hidden">
      {/* 1. Header Banner matching reference design */}
      <div className="bg-[#091410] border border-[#14261F] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#22C55E]">
              <span className="font-semibold uppercase tracking-wider">Model Architecture</span>
              <span aria-hidden="true" className="text-[#3A5046]">·</span>
              <span className="text-[#80978E]">Spatiotemporal Multi-Modal Deep Learning</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Spatiotemporal CNN-LSTM Network
            </h1>
            <p className="text-xs text-[#80978E] max-w-3xl leading-relaxed">
              Extracts spatial crop canopy features from Sentinel-2 satellite imagery using a 2D-CNN, fuses them with IMD rainfall and NOAA ONI climate features, and models temporal sequence dynamics with a Bidirectional LSTM to predict rice crop-failure probability.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-[#80978E] shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-[#060D0A] border border-[#14261F] text-[#22C55E] font-bold">
              ~78,400 Trainable Parameters
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visual Pipeline Flow Diagram - Responsive Grid */}
      <div className="bg-[#091410] border border-[#14261F] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 w-full overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#14261F] pb-3 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#22C55E]" />
            <span>Spatiotemporal Tensor Transformation Pipeline</span>
          </h3>
          <span className="text-xs font-mono text-[#80978E]">
            Batch: B · Temporal Steps: T = 6 (Bi-weekly June 1 – August 31)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          {/* Stage 1 */}
          <div className="p-4 rounded-xl bg-[#060D0A] border border-[#14261F] flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#22C55E] uppercase font-semibold">Stage 1: Model Inputs</div>
              <h4 className="text-sm font-bold text-white mt-1">Multi-Modal Inputs</h4>
              <div className="mt-3 space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#091410] border border-[#14261F]">
                  <span className="text-[#80978E] block text-[10px]">SENTINEL-2 SPATIAL TENSOR:</span>
                  <span className="text-white font-bold">[B, 6, 8, 32, 32]</span>
                  <span className="text-[#80978E] block text-[10px] mt-0.5">8 bands, 10m/20m GSD patches</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#091410] border border-[#14261F]">
                  <span className="text-[#80978E] block text-[10px]">IMD + ONI CLIMATE TENSOR:</span>
                  <span className="text-[#38BDF8] font-bold">[B, 6, 4]</span>
                  <span className="text-[#80978E] block text-[10px] mt-0.5">Rainfall, Anomaly, ONI, Flag</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#14261F] flex items-center justify-between text-[11px] font-mono text-[#80978E]">
              <span>Step 1 of 4</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#22C55E]" />
            </div>
          </div>

          {/* Stage 2 */}
          <div className="p-4 rounded-xl bg-[#060D0A] border border-[#14261F] flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#22C55E] uppercase font-semibold">Stage 2: Spatial Encoder</div>
              <h4 className="text-sm font-bold text-white mt-1">TimeDistributed 2D-CNN</h4>
              <div className="mt-3 space-y-1.5 text-[11px] font-mono text-[#80978E]">
                <div className="p-2 rounded-lg bg-[#091410] border border-[#14261F]">Conv2d(8&rarr;16) + MaxPool</div>
                <div className="p-2 rounded-lg bg-[#091410] border border-[#14261F]">Conv2d(16&rarr;32) + MaxPool</div>
                <div className="p-2 rounded-lg bg-[#091410] border border-[#14261F]">Conv2d(32&rarr;64) + AdaptivePool</div>
                <div className="p-2 rounded-lg bg-[#091410] border border-[#14261F] text-[#22C55E] font-bold">
                  Spatial Vector: [B, 6, 64]
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#14261F] flex items-center justify-between text-[11px] font-mono text-[#80978E]">
              <span>Step 2 of 4</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#22C55E]" />
            </div>
          </div>

          {/* Stage 3 */}
          <div className="p-4 rounded-xl bg-[#060D0A] border border-[#14261F] flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#22C55E] uppercase font-semibold">Stage 3: Sequence Core</div>
              <h4 className="text-sm font-bold text-white mt-1">Bidirectional LSTM</h4>
              <div className="mt-3 space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#091410] border border-[#14261F]">
                  <span className="text-[#80978E] block text-[10px]">FUSED TIME-STEP TENSOR:</span>
                  <span className="text-white font-bold">[B, 6, 68]</span>
                  <span className="text-[#80978E] block text-[10px] mt-0.5">64 spatial + 4 climate</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#091410] border border-[#14261F]">
                  <span className="text-[#80978E] block text-[10px]">2-LAYER BiLSTM HIDDEN:</span>
                  <span className="text-[#22C55E] font-bold">[B, 128]</span>
                  <span className="text-[#80978E] block text-[10px] mt-0.5">Forward + backward context</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#14261F] flex items-center justify-between text-[11px] font-mono text-[#80978E]">
              <span>Step 3 of 4</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#22C55E]" />
            </div>
          </div>

          {/* Stage 4 */}
          <div className="p-4 rounded-xl bg-[#060D0A] border border-[#14261F] flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#22C55E] uppercase font-semibold">Stage 4: Prediction Head</div>
              <h4 className="text-sm font-bold text-white mt-1">Classification Head</h4>
              <div className="mt-3 space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#091410] border border-[#14261F]">
                  <span className="text-[#80978E] block text-[10px]">DENSE LAYERS:</span>
                  <span className="text-[#A4B8AF]">Linear(128&rarr;32) + Dropout(0.3)</span>
                  <span className="text-[#A4B8AF] block">Linear(32&rarr;1) Logits</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#091410] border border-[#173D2C] text-white">
                  <span className="text-[#22C55E] block text-[10px] font-bold">MODEL OUTPUT:</span>
                  <span className="font-bold text-xs">Crop-Failure Probability</span>
                  <span className="text-[#80978E] block text-[10px] mt-0.5">P(failure) &isin; [0, 1] via Sigmoid</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#14261F] flex items-center justify-between text-[11px] font-mono text-[#22C55E] font-bold">
              <span>Final Output</span>
              <span>P &isin; [0, 1]</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Viva Explanations: Temporal Cutoff & Loss Function */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#091410] border border-[#14261F] space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-mono text-[#22C55E] font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>TEMPORAL CUTOFF & LEAD TIME</span>
          </div>
          <h4 className="text-base font-bold text-white">August 31 In-Season Horizon</h4>
          <p className="text-xs text-[#A4B8AF] leading-relaxed">
            The model strictly stops ingesting data on <strong className="text-white">August 31</strong> of Kharif season $t$. Harvest yields (October–November) and late September rains are withheld during inference.
          </p>
          <div className="p-3.5 rounded-xl bg-[#060D0A] border border-[#14261F] text-xs font-mono text-[#80978E] space-y-1.5">
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
              <span className="text-[#22C55E] font-bold">60 to 75 Days Advance Warning</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#091410] border border-[#14261F] space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-semibold">
            <Target className="w-4 h-4" />
            <span>CLASS IMBALANCE & LOSS FUNCTION</span>
          </div>
          <h4 className="text-base font-bold text-white">Weighted Binary Cross-Entropy</h4>
          <p className="text-xs text-[#A4B8AF] leading-relaxed">
            Severe crop-failure events occur in only ~15% of historical district-years. An unweighted loss function would bias predictions toward the majority normal class.
          </p>
          <div className="p-3.5 rounded-xl bg-[#060D0A] border border-[#14261F] text-xs font-mono text-[#80978E] space-y-1.5">
            <div className="text-white font-semibold">Loss Formulation:</div>
            <div className="text-[#A4B8AF] font-mono">
              Loss = - [w &middot; y &middot; log(p) + (1 - y) &middot; log(1 - p)]
            </div>
            <div className="text-[10px] text-[#6A8177] mt-1">
              Positive weight (w &approx; 4.5) penalizes false negatives (missed failures) more heavily than false alarms.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
