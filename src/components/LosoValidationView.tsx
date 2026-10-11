import React, { useState } from 'react';
import { computeLosoFoldMetrics } from '../data/futureElNinoForecast';
import {
  ShieldAlert,
  Activity,
  CheckCircle2,
  Layers,
  FileCheck2,
  Table,
  CloudRain,
  Sprout,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const LosoValidationView: React.FC = () => {
  const [selectedFoldYear, setSelectedFoldYear] = useState<number>(2015);

  // Authoritative empirical ground-truth summary for held-out fold
  const foldMetric = computeLosoFoldMetrics(selectedFoldYear);

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#E8EFEB] pb-12 w-full overflow-hidden">
      {/* 1. Header Banner */}
      <div className="bg-[#091410] border border-[#14261F] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#22C55E]">
              <span className="font-semibold uppercase tracking-wider">Temporal Cross-Validation</span>
              <span aria-hidden="true" className="text-[#3A5046]">·</span>
              <span className="text-[#80978E]">Leave-One-Season-Out (LOSO) Protocol</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Model Generalization on Unseen Historical Seasons
            </h1>
            <p className="text-xs text-[#80978E] max-w-3xl leading-relaxed">
              Evaluating framework robustness by isolating entire historical Kharif seasons from training. Model evaluation metrics require offline training with saved weights (<code className="text-[#22C55E]">train.py</code>). All proxy heuristics that leaked target labels have been decommissioned.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1A0E] border border-[#534319] text-xs font-mono text-amber-400 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Awaiting Offline Training Checkpoint</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Fold Selector & Metric Summary */}
      <div className="space-y-3">
        {/* Fold Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-[#80978E] font-semibold">HELD-OUT EVALUATION YEAR:</span>
            <div className="flex items-center gap-1.5 bg-[#060D0A] p-1 rounded-xl border border-[#14261F]">
              {[2015, 2018, 2020].map(yr => {
                const isSelected = yr === selectedFoldYear;
                const label = yr === 2015 ? '2015 (Very Strong El Niño)' : yr === 2018 ? '2018 (Moderate Deficit)' : '2020 (La Niña Control)';
                return (
                  <button
                    key={yr}
                    onClick={() => setSelectedFoldYear(yr)}
                    className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#22C55E] text-[#051A11] font-bold shadow-xs'
                        : 'text-[#80978E] hover:text-white hover:bg-[#0B1A14]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <span className="text-xs font-mono text-[#80978E]">
            {foldMetric.totalModeledDistricts} Primary Rice Districts in Fold
          </span>
        </div>

        {/* 4 Core Metric Cards (Empirical Observations + Model Status) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-[#091410] border border-[#14261F]">
            <div className="text-[11px] font-mono text-[#7A9187] flex items-center justify-between uppercase">
              <span>Observed Yield Failures</span>
              <ShieldAlert className="w-4 h-4 text-[#D93838]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-[#D93838] tabular-nums">
                {foldMetric.actualObservedFailures}
              </span>
              <span className="text-xs text-[#80978E] font-mono">
                / {foldMetric.totalModeledDistricts} ({foldMetric.totalModeledDistricts > 0 ? Math.round((foldMetric.actualObservedFailures / foldMetric.totalModeledDistricts) * 100) : 0}%)
              </span>
            </div>
            <p className="text-[10px] text-[#6A8177] mt-1">DES Kharif ground truth (&lt; -10% yield)</p>
          </div>

          <div className="p-4 rounded-xl bg-[#091410] border border-[#14261F]">
            <div className="text-[11px] font-mono text-[#7A9187] flex items-center justify-between uppercase">
              <span>Observed Resilient</span>
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-[#22C55E] tabular-nums">
                {foldMetric.actualResilientDistricts}
              </span>
              <span className="text-xs text-[#80978E] font-mono">
                / {foldMetric.totalModeledDistricts}
              </span>
            </div>
            <p className="text-[10px] text-[#6A8177] mt-1">Normal or surplus rice harvest</p>
          </div>

          <div className="p-4 rounded-xl bg-[#091410] border border-[#14261F]">
            <div className="text-[11px] font-mono text-[#7A9187] flex items-center justify-between uppercase">
              <span>Mean Fold Rainfall (IMD)</span>
              <CloudRain className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
                {foldMetric.meanRainfallMm !== null ? `${foldMetric.meanRainfallMm} mm` : 'N/A'}
              </span>
            </div>
            <p className="text-[10px] text-[#6A8177] mt-1">ENSO forcing: +{foldMetric.oniAnomaly}°C ({foldMetric.climatePhase})</p>
          </div>

          <div className="p-4 rounded-xl bg-[#091410] border border-[#14261F]">
            <div className="text-[11px] font-mono text-[#7A9187] flex items-center justify-between uppercase">
              <span>Model Classification Metrics</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold font-mono text-amber-400">
                PENDING WEIGHTS
              </span>
            </div>
            <p className="text-[10px] text-[#80978E] mt-1">ROC-AUC / F1 suspended awaiting train.py</p>
          </div>
        </div>
      </div>

      {/* 3. Fold Ground-Truth Breakdown & Methodology */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Empirical Fold Summary (6 cols) */}
        <div className="lg:col-span-6 p-4 sm:p-5 rounded-2xl bg-[#091410] border border-[#14261F] space-y-4">
          <div className="flex items-center justify-between border-b border-[#14261F] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#22C55E]" />
              <span>Ground Truth Breakdown: Kharif {selectedFoldYear}</span>
            </h3>
            <span className="text-xs font-mono text-[#80978E]">
              ONI Forcing: +{foldMetric.oniAnomaly}°C
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-[#281313] border border-[#4D1D1D] text-center">
              <span className="text-[10px] font-mono text-[#D93838] uppercase font-semibold block">
                Observed Failures (DES)
              </span>
              <span className="text-3xl font-mono font-bold text-[#D93838] tabular-nums block mt-1">
                {foldMetric.actualObservedFailures}
              </span>
              <span className="text-[10px] text-[#80978E] mt-0.5 block">
                Yield anomaly &lt; -10% below baseline
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0E241B] border border-[#1B4B38] text-center">
              <span className="text-[10px] font-mono text-[#22C55E] uppercase font-semibold block">
                Observed Resilient (DES)
              </span>
              <span className="text-3xl font-mono font-bold text-white tabular-nums block mt-1">
                {foldMetric.actualResilientDistricts}
              </span>
              <span className="text-[10px] text-[#80978E] mt-0.5 block">
                Yield anomaly &ge; -10% of baseline
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#060D0A] border border-[#14261F] text-center">
              <span className="text-[10px] font-mono text-[#38BDF8] uppercase font-semibold block">
                Average Kharif Yield
              </span>
              <span className="text-2xl font-mono font-bold text-white tabular-nums block mt-1">
                {foldMetric.meanYieldKgHa} kg/ha
              </span>
              <span className="text-[10px] text-[#80978E] mt-0.5 block">
                Across 24 primary rice districts
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#060D0A] border border-[#14261F] text-center">
              <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold block">
                Model Evaluation
              </span>
              <span className="text-sm font-mono font-bold text-amber-400 block mt-2">
                Awaiting Checkpoint
              </span>
              <span className="text-[10px] text-[#80978E] mt-0.5 block">
                No heuristic proxy fabricated
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#060D0A] border border-[#14261F] flex items-start gap-2 text-xs text-[#80978E]">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Confusion matrix (TP / FP / FN / TN) is deactivated until genuine trained weights are generated by running <code className="text-white">python scripts/train.py</code> across the 7 training folds. The CNN-BiLSTM architecture is compiled (56,625 parameters) and ready for checkpoint weights.
            </p>
          </div>
        </div>

        {/* Right: Methodology Explanation (6 cols) */}
        <div className="lg:col-span-6 p-4 sm:p-5 rounded-2xl bg-[#091410] border border-[#14261F] space-y-4">
          <div className="flex items-center justify-between border-b border-[#14261F] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#22C55E]" />
              <span>Temporal Partitioning & Generalization</span>
            </h3>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            <div className="p-3.5 rounded-xl bg-[#060D0A] border border-[#17382B] space-y-1">
              <div className="flex items-center justify-between text-[#22C55E] font-mono font-semibold">
                <span>Leave-One-Season-Out (LOSO) Protocol</span>
                <span>Zero Temporal Leakage</span>
              </div>
              <p className="text-[#A4B8AF]">
                To evaluate how well the spatiotemporal framework handles an <strong>unseen future season</strong>, we hold out all observations from the test year during training. The test year&apos;s data is never seen by the model until evaluation.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#060D0A] border border-[#14261F] space-y-1">
              <div className="text-white font-mono font-semibold">
                Why Standard K-Fold Cross-Validation Is Inappropriate:
              </div>
              <p className="text-[#80978E]">
                Standard random K-fold splits samples randomly across space and time. Because monsoon and ENSO patterns correlate strongly within the same year, training on some districts in 2015 while testing on other districts in 2015 leaks year-wide weather conditions, producing artificially inflated scores.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#060D0A] border border-[#14261F] space-y-1">
              <div className="text-white font-mono font-semibold">
                Decommissioning of Proxy Heuristics:
              </div>
              <p className="text-[#80978E]">
                Previous versions approximated inference logits using the ground-truth yield anomaly. To preserve scientific rigor for PBL evaluation, all synthetic proxies have been removed. Genuine validation metrics will appear once model weights are trained on genuine multi-temporal Sentinel-2 imagery.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. District-by-District Ground Truth Ledger */}
      <div className="bg-[#091410] border border-[#14261F] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#14261F] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-[#22C55E]" />
            <h3 className="text-sm font-bold text-white">
              Observed Ground Truth Ledger: Kharif {selectedFoldYear} ({foldMetric.districtResults.length} Primary Rice Districts)
            </h3>
          </div>
          <span className="text-xs font-mono text-[#80978E]">
            Target: Yield Deficit &lt; -10% vs Baseline
          </span>
        </div>

        <div className="overflow-x-auto max-h-[360px]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#060D0A] text-[#7A9187] border-b border-[#14261F] sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-4 font-sans font-semibold">District</th>
                <th className="py-2.5 px-3">Division</th>
                <th className="py-2.5 px-3 text-right">IMD Rainfall</th>
                <th className="py-2.5 px-3 text-right">Actual Yield</th>
                <th className="py-2.5 px-3 text-right">Yield Anomaly</th>
                <th className="py-2.5 px-3 text-center">DES Observed</th>
                <th className="py-2.5 px-4 text-center">Model Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14261F]">
              {foldMetric.districtResults.map(res => {
                const isObservedFail = res.actualObservedFailure === 1;
                return (
                  <tr key={res.districtId} className="hover:bg-[#0B1A14]/40 transition-colors">
                    <td className="py-2.5 px-4 font-sans font-semibold text-white">{res.districtName}</td>
                    <td className="py-2.5 px-3 text-[#80978E]">{res.division}</td>
                    <td className="py-2.5 px-3 text-right text-white tabular-nums">
                      {res.rainfallMm !== null ? `${res.rainfallMm} mm` : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#A4B8AF] tabular-nums">
                      {res.actualYieldKgHa !== null ? `${res.actualYieldKgHa} kg/ha` : 'N/A'}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${isObservedFail ? 'text-[#D93838]' : 'text-[#22C55E]'}`}>
                      {res.yieldAnomalyPct !== null ? (res.yieldAnomalyPct > 0 ? `+${res.yieldAnomalyPct}%` : `${res.yieldAnomalyPct}%`) : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        isObservedFail ? 'bg-[#2E1212] text-[#D93838] border border-[#591C1C]' : 'bg-[#0E281F] text-[#22C55E] border border-[#1B4B38]'
                      }`}>
                        {isObservedFail ? 'FAILURE' : 'RESILIENT'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono text-[#80978E] bg-[#060D0A] border border-[#14261F]">
                        Awaiting Weights
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
