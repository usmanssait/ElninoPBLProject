import React, { useState } from 'react';
import { computeLosoFoldMetrics } from '../data/futureElNinoForecast';
import {
  ShieldCheck,
  Activity,
  CheckCircle2,
  Layers,
  FileCheck2,
  Table,
} from 'lucide-react';

export const LosoValidationView: React.FC = () => {
  const [selectedFoldYear, setSelectedFoldYear] = useState<number>(2015);

  // Dynamically compute evaluation metrics from actual district data
  const foldMetric = computeLosoFoldMetrics(selectedFoldYear);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 w-full overflow-hidden">
      {/* 1. Header Banner */}
      <div className="bg-[#131920] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="font-semibold uppercase tracking-wider">Model Validation</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400">Leave-One-Season-Out (LOSO) Temporal Cross-Validation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Model Generalization on Unseen El Niño Seasons
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Evaluating the CNN-LSTM network by holding out entire historical seasons from the training set. The model is trained on remaining years and tested exclusively on the held-out season without lookahead data leakage.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Dynamically Computed Metrics</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Fold Selector & Metric Summary */}
      <div className="space-y-4">
        {/* Fold Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-slate-400 font-semibold">HELD-OUT EVALUATION YEAR:</span>
            <div className="flex items-center gap-1.5 bg-[#0B0F14] p-1 rounded-xl border border-slate-800">
              {[2015, 2018, 2020].map(yr => {
                const isSelected = yr === selectedFoldYear;
                const label = yr === 2015 ? '2015 (Very Strong El Niño)' : yr === 2018 ? '2018 (Moderate Deficit)' : '2020 (La Niña Control)';
                return (
                  <button
                    key={yr}
                    onClick={() => setSelectedFoldYear(yr)}
                    className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <span className="text-xs font-mono text-slate-400">
            {foldMetric.totalModeledDistricts} Primary Rice Districts Evaluated
          </span>
        </div>

        {/* 4 Core Dynamic Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between uppercase">
              <span>ROC-AUC Score</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tabular-nums">
                {foldMetric.rocAuc.toFixed(3)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Area under discrimination curve</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between uppercase">
              <span>Failure Recall (Sensitivity)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
                {foldMetric.recall.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({foldMetric.truePositives}/{foldMetric.actualObservedFailures || 1})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Observed failures correctly identified</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between uppercase">
              <span>Precision</span>
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
                {foldMetric.precision.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({foldMetric.truePositives}/{foldMetric.predictedFailures || 1})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Precision among predicted failures</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between uppercase">
              <span>Overall Accuracy</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tabular-nums">
                {foldMetric.accuracy.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({foldMetric.truePositives + foldMetric.trueNegatives}/{foldMetric.totalModeledDistricts})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Correct classifications / total districts</p>
          </div>
        </div>
      </div>

      {/* 3. Confusion Matrix & Methodology */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Dynamic Confusion Matrix Box (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-[#131920] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Confusion Matrix: Kharif {selectedFoldYear}</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              ONI Forcing: +{foldMetric.oniAnomaly}°C
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-center">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold block">
                True Positives (TP)
              </span>
              <span className="text-3xl font-mono font-bold text-white tabular-nums block mt-1">
                {foldMetric.truePositives}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Observed failure, predicted failure
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold block">
                False Positives (FP)
              </span>
              <span className="text-3xl font-mono font-bold text-slate-300 tabular-nums block mt-1">
                {foldMetric.falsePositives}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Observed resilient, predicted failure
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-rose-400 uppercase font-semibold block">
                False Negatives (FN)
              </span>
              <span className="text-3xl font-mono font-bold text-rose-400 tabular-nums block mt-1">
                {foldMetric.falseNegatives}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Observed failure, missed by model
              </span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-center">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold block">
                True Negatives (TN)
              </span>
              <span className="text-3xl font-mono font-bold text-white tabular-nums block mt-1">
                {foldMetric.trueNegatives}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Observed resilient, predicted resilient
              </span>
            </div>
          </div>
        </div>

        {/* Right: Methodology Explanation (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-[#131920] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Temporal Partitioning & Generalization</span>
            </h3>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            <div className="p-3.5 rounded-xl bg-[#0B0F14] border border-emerald-500/30 space-y-1">
              <div className="flex items-center justify-between text-emerald-400 font-mono font-semibold">
                <span>Leave-One-Season-Out (LOSO) Protocol</span>
                <span>F1: {foldMetric.f1Score.toFixed(3)}</span>
              </div>
              <p className="text-slate-300">
                To evaluate how well the spatiotemporal framework handles an <strong>unseen future season</strong>, we hold out all observations from the test year during training. The test year&apos;s data is never seen by the model until evaluation.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B0F14] border border-slate-800 space-y-1">
              <div className="text-slate-300 font-mono font-semibold">
                Why Standard K-Fold Cross-Validation Is Inappropriate:
              </div>
              <p className="text-slate-400">
                Standard random K-fold splits samples randomly across both space and time. Because weather and ENSO patterns correlate strongly within the same year, training on some districts in 2015 while testing on other districts in 2015 leaks year-wide weather conditions, producing artificially inflated scores.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. District-by-District Evaluation Ledger for this Held-Out Year */}
      <div className="bg-[#131920] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              District Evaluation Breakdown: Kharif {selectedFoldYear} ({foldMetric.districtResults.length} Primary Rice Districts)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Target: Yield Deficit &lt; -10% vs Baseline
          </span>
        </div>

        <div className="overflow-x-auto max-h-[360px]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0B0F14] text-slate-400 border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-4 font-sans font-semibold">District</th>
                <th className="py-2.5 px-3">Division</th>
                <th className="py-2.5 px-3 text-right">Actual Yield</th>
                <th className="py-2.5 px-3 text-right">Yield Anomaly</th>
                <th className="py-2.5 px-3 text-center">DES Observed</th>
                <th className="py-2.5 px-3 text-right">Model Probability</th>
                <th className="py-2.5 px-4 text-center">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {foldMetric.districtResults.map(res => {
                const isObservedFail = res.actualObservedFailure === 1;
                return (
                  <tr key={res.districtId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 font-sans font-semibold text-white">{res.districtName}</td>
                    <td className="py-2.5 px-3 text-slate-400">{res.division}</td>
                    <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">{res.actualYieldKgHa} kg/ha</td>
                    <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${isObservedFail ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {res.yieldAnomalyPct > 0 ? `+${res.yieldAnomalyPct}%` : `${res.yieldAnomalyPct}%`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        isObservedFail ? 'bg-rose-950 text-rose-300 border border-rose-500/40' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {isObservedFail ? 'FAILURE' : 'RESILIENT'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      <span className={`font-bold ${res.predictedProbability >= 0.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {(res.predictedProbability * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        res.classificationOutcome === 'TP'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                          : res.classificationOutcome === 'TN'
                          ? 'bg-slate-900 text-slate-300 border border-slate-700'
                          : res.classificationOutcome === 'FP'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                          : 'bg-rose-950 text-rose-300 border border-rose-500/50'
                      }`}>
                        {res.classificationOutcome}
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
