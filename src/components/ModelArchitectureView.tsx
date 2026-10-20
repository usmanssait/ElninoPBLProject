import React from 'react';
import { Layers, ShieldCheck, Target, ArrowRight, Cpu, Activity, Award } from 'lucide-react';
import { MODEL_EVALUATION_SUMMARY } from '../data/modelPredictionData';
import { ModelIntegrityInspector } from './ModelIntegrityInspector';

export const ModelArchitectureView: React.FC = () => {
  return (
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#16221B] pb-12 w-full overflow-hidden">
      {/* 1. Header Banner */}
      <div className="bg-[#E2E6DC] border border-[#CCD2C4] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#12382B]">
              <span className="font-semibold uppercase tracking-wider">Model Architecture</span>
              <span aria-hidden="true" className="text-[#889B8F]">·</span>
              <span className="text-[#526458]">Multi-Crop Spatiotemporal Deep Learning</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#16221B] font-serif">
              Multi-Crop Spatiotemporal CNN-LSTM Network (PyTorch)
            </h1>
            <p className="text-xs text-[#526458] max-w-3xl leading-relaxed">
              Extracts spatial crop canopy features from Sentinel-2 satellite imagery using a 2D-CNN, fuses them with IMD rainfall, rainfall departure %, NOAA ONI SST anomalies, pixel coverage, and one-hot crop identity (Rice, Soybean, Cotton, Bajra, Jowar, Tur), and models temporal sequence dynamics with a Bidirectional LSTM to predict Kharif crop failure.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-[#526458] shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-white border border-[#CCD2C4] text-[#12382B] font-bold shadow-xs">
              17,449 Trainable Parameters (PyTorch Verified)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visual Pipeline Flow Diagram - Responsive Grid */}
      <div className="bg-[#E2E6DC] border border-[#CCD2C4] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 w-full overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#CCD2C4] pb-3 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-[#16221B] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#12382B]" />
            <span>Multi-Crop Spatiotemporal Tensor Transformation Pipeline</span>
          </h3>
          <span className="text-xs font-mono text-[#526458]">
            Batch: B · Temporal Steps: T = 6 (Bi-weekly June 1 – August 31)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          {/* Stage 1 */}
          <div className="p-4 rounded-xl bg-white border border-[#CCD2C4] flex flex-col justify-between shadow-2xs">
            <div>
              <div className="text-[10px] font-mono text-[#12382B] uppercase font-semibold">Stage 1: Multi-Modal Inputs</div>
              <h4 className="text-sm font-bold text-[#16221B] mt-1">Satellite &amp; Climate + Crop</h4>
              <div className="mt-3 space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#EAECE4] border border-[#CCD2C4]">
                  <span className="text-[#526458] block text-[10px]">SENTINEL-2 SPATIAL TENSOR:</span>
                  <span className="text-[#16221B] font-bold">[B, 6, 8, 32, 32]</span>
                  <span className="text-[#718277] block text-[10px] mt-0.5">8 channels (B2-4, B8, B11-12, NDVI, NDWI)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#EAECE4] border border-[#CCD2C4]">
                  <span className="text-[#526458] block text-[10px]">CLIMATE + CROP FEATURE TENSOR:</span>
                  <span className="text-[#0284C7] font-bold">[B, 6, 10]</span>
                  <span className="text-[#718277] block text-[10px] mt-0.5">Rainfall, Dep %, ONI, Coverage, 6 Crop Flags</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#CCD2C4] flex items-center justify-between text-[11px] font-mono text-[#526458]">
              <span>Step 1 of 4</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#12382B]" />
            </div>
          </div>

          {/* Stage 2 */}
          <div className="p-4 rounded-xl bg-white border border-[#CCD2C4] flex flex-col justify-between shadow-2xs">
            <div>
              <div className="text-[10px] font-mono text-[#12382B] uppercase font-semibold">Stage 2: Spatial Encoder</div>
              <h4 className="text-sm font-bold text-[#16221B] mt-1">2D-CNN + BN (4,728 params)</h4>
              <div className="mt-3 space-y-1.5 text-[11px] font-mono text-[#526458]">
                <div className="p-2 rounded-lg bg-[#EAECE4] border border-[#CCD2C4]">Conv2d(8&rarr;16, 3x3) + BN + MaxPool (1,200 params)</div>
                <div className="p-2 rounded-lg bg-[#EAECE4] border border-[#CCD2C4]">Conv2d(16&rarr;24, 3x3) + BN + MaxPool (3,528 params)</div>
                <div className="p-2 rounded-lg bg-[#EAECE4] border border-[#CCD2C4]">AdaptiveAvgPool2d((1, 1)) + Flatten</div>
                <div className="p-2 rounded-lg bg-[#EAECE4] border border-[#CCD2C4] text-[#12382B] font-bold">
                  Spatial Vector: [B, 6, 24]
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#CCD2C4] flex items-center justify-between text-[11px] font-mono text-[#526458]">
              <span>Step 2 of 4</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#12382B]" />
            </div>
          </div>

          {/* Stage 3 */}
          <div className="p-4 rounded-xl bg-white border border-[#CCD2C4] flex flex-col justify-between shadow-2xs">
            <div>
              <div className="text-[10px] font-mono text-[#12382B] uppercase font-semibold">Stage 3: Sequence Core</div>
              <h4 className="text-sm font-bold text-[#16221B] mt-1">BiLSTM (11,520 params)</h4>
              <div className="mt-3 space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#EAECE4] border border-[#CCD2C4]">
                  <span className="text-[#526458] block text-[10px]">TIME-STEP FUSED TENSOR:</span>
                  <span className="text-[#16221B] font-bold">[B, 6, 34]</span>
                  <span className="text-[#718277] block text-[10px] mt-0.5">24 spatial + 10 climate/crop features</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#EAECE4] border border-[#CCD2C4]">
                  <span className="text-[#526458] block text-[10px]">1-LAYER BiLSTM HIDDEN:</span>
                  <span className="text-[#12382B] font-bold">[B, 48]</span>
                  <span className="text-[#718277] block text-[10px] mt-0.5">hidden=24 bidirectional (24x2)</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#CCD2C4] flex items-center justify-between text-[11px] font-mono text-[#526458]">
              <span>Step 3 of 4</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#12382B]" />
            </div>
          </div>

          {/* Stage 4 */}
          <div className="p-4 rounded-xl bg-white border border-[#CCD2C4] flex flex-col justify-between shadow-2xs">
            <div>
              <div className="text-[10px] font-mono text-[#12382B] uppercase font-semibold">Stage 4: Prediction Head</div>
              <h4 className="text-sm font-bold text-[#16221B] mt-1">Classification Head (1,201 params)</h4>
              <div className="mt-3 space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#EAECE4] border border-[#CCD2C4]">
                  <span className="text-[#526458] block text-[10px]">DENSE PROJECTION:</span>
                  <span className="text-[#3E5146]">Linear(48&rarr;24) + ReLU + Dropout(0.30)</span>
                  <span className="text-[#3E5146] block">Linear(24&rarr;1) Logits</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#EAECE4] border border-[#CCD2C4] text-[#16221B]">
                  <span className="text-[#12382B] block text-[10px] font-bold">MODEL OUTPUT:</span>
                  <span className="font-bold text-xs">Crop-Failure Probability</span>
                  <span className="text-[#718277] block text-[10px] mt-0.5">Sigmoid P(failure) &isin; [0, 1]</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#CCD2C4] flex items-center justify-between text-[11px] font-mono text-[#12382B] font-bold">
              <span>Final Output</span>
              <span>P &isin; [0, 1]</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Viva Explanations: Temporal Cutoff & Loss Function */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-mono text-[#12382B] font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#12382B]" />
            <span>TEMPORAL CUTOFF &amp; LEAD TIME</span>
          </div>
          <h4 className="text-base font-bold text-[#16221B]">August 31 In-Season Horizon</h4>
          <p className="text-xs text-[#526458] leading-relaxed">
            The model strictly stops ingesting data on <strong className="text-[#16221B]">August 31</strong> of Kharif season $t$. Harvest yields (October–November) and post-August rains are withheld during inference.
          </p>
          <div className="p-3.5 rounded-xl bg-white border border-[#CCD2C4] text-xs font-mono text-[#526458] space-y-1.5 shadow-2xs">
            <div className="flex justify-between">
              <span>Input Observation Window:</span>
              <span className="text-[#16221B] font-semibold">June 1 – August 31 (6 Windows)</span>
            </div>
            <div className="flex justify-between">
              <span>Harvest Timing:</span>
              <span className="text-[#16221B] font-semibold">October – November</span>
            </div>
            <div className="flex justify-between">
              <span>Early Warning Notice:</span>
              <span className="text-[#16A34A] font-bold">60 to 75 Days Advance Warning</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-700 font-semibold">
            <Target className="w-4 h-4 text-amber-700" />
            <span>CLASS IMBALANCE &amp; LOSS FUNCTION</span>
          </div>
          <h4 className="text-base font-bold text-[#16221B]">Weighted BCEWithLogitsLoss</h4>
          <p className="text-xs text-[#526458] leading-relaxed">
            Severe crop failure occurs in only ~13% of historical district-years (10 failures vs 65 resilient groups). The training pipeline applied a positive class weight to penalize missed crop failures heavily.
          </p>
          <div className="p-3.5 rounded-xl bg-white border border-[#CCD2C4] text-xs font-mono text-[#526458] space-y-1.5 shadow-2xs">
            <div className="text-[#16221B] font-semibold">Loss Formulation:</div>
            <div className="text-[#3E5146] font-mono font-medium">
              BCEWithLogitsLoss(pos_weight = 6.5)
            </div>
            <div className="text-[10px] text-[#718277] mt-1">
              Final training loss converged from {MODEL_EVALUATION_SUMMARY.lossFirstLast[0].toFixed(3)} down to {MODEL_EVALUATION_SUMMARY.lossFirstLast[1].toFixed(3)}.
            </div>
          </div>
        </div>
      </div>

      {/* 4. Model Integrity & Parameter Diagnostics */}
      <ModelIntegrityInspector />
    </div>
  );
};
