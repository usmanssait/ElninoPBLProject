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
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#E8EFEB] pb-12 w-full overflow-hidden">
      {/* 1. Header Banner matching reference design */}
      <div className="bg-[#091410] border border-[#14261F] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#22C55E]">
              <span className="font-semibold uppercase tracking-wider">Model Validation</span>
              <span aria-hidden="true" className="text-[#3A5046]">·</span>
              <span className="text-[#80978E]">Leave-One-Season-Out (LOSO) Temporal Cross-Validation</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Model Generalization on Unseen El Niño Seasons
            </h1>
            <p className="text-xs text-[#80978E] max-w-3xl leading-relaxed">
              Evaluating the CNN-LSTM network by holding out entire historical seasons from the training set. The model is trained on remaining years and tested exclusively on the held-out season without lookahead data leakage.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1A14] border border-[#173026] text-xs font-mono text-[#22C55E] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
              <span>Dynamically Computed Metrics</span>
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
            {foldMetric.totalModeledDistricts} Primary Rice Districts Evaluated
          </span>
        </div>

        {/* 4 Core Dynamic Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-[#091410] border border-[#14261F]">
            <div className="text-[11px] font-mono text-[#7A9187] flex items-center justify-between uppercase">
              <span>ROC-AUC Score</span>
              <Activity className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-[#22C55E] tabular-nums">
                {foldMetric.rocAuc.toFixed(3)}
              </span>
            </div>
            <p className="text-[10px] text-[#6A8177] mt-1">Area under discrimination curve</p>
          </div>

          <div className="p-4 rounded-xl bg-[#091410] border border-[#14261F]">
            <div className="text-[11px] font-mono text-[#7A9187] flex items-center justify-between uppercase">
              <span>Failure Recall (Sensitivity)</span>
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
                {foldMetric.recall.toFixed(1)}%
              </span>
              <span className="text-xs text-[#6A8177] font-mono">
                ({foldMetric.truePositives}/{foldMetric.actualObservedFailures || 1})
              </span>
            </div>
            <p className="text-[10px] text-[#6A8177] mt-1">Observed failures correctly identified</p>
          </div>

          <div className="p-4 rounded-xl bg-[#091410] border border-[#14261F]">
            <div className="text-[11px] font-mono text-[#7A9187] flex items-center justify-between uppercase">
              <span>Precision</span>
              <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
                {foldMetric.precision.toFixed(1)}%
              </span>
              <span className="text-xs text-[#6A8177] font-mono">
                ({foldMetric.truePositives}/{foldMetric.predictedFailures || 1})
              </span>
            </div>
            <p className="text-[10px] text-[#6A8177] mt-1">Precision among predicted failures</p>
          </div>

          <div className="p-4 rounded-xl bg-[#091410] border border-[#14261F]">
            <div className="text-[11px] font-mono text-[#7A9187] flex items-center justify-between uppercase">
              <span>Overall Accuracy</span>
              <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-[#22C55E] tabular-nums">
                {foldMetric.accuracy.toFixed(1)}%
              </span>
              <span className="text-xs text-[#6A8177] font-mono">
                ({foldMetric.truePositives + foldMetric.trueNegatives}/{foldMetric.totalModeledDistricts})
              </span>
            </div>
            <p className="text-[10px] text-[#6A8177] mt-1">Correct classifications / total districts</p>
          </div>
        </div>
      </div>

      {/* 3. Confusion Matrix & Methodology */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Dynamic Confusion Matrix Box (6 cols) */}
        <div className="lg:col-span-6 p-4 sm:p-5 rounded-2xl bg-[#091410] border border-[#14261F] space-y-4">
          <div className="flex items-center justify-between border-b border-[#14261F] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#22C55E]" />
              <span>Confusion Matrix: Kharif {selectedFoldYear}</span>
            </h3>
            <span className="text-xs font-mono text-[#80978E]">
              ONI Forcing: +{foldMetric.oniAnomaly}°C
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-[#0E241B] border border-[#1B4B38] text-center">
              <span className="text-[10px] font-mono text-[#22C55E] uppercase font-semibold block">
                True Positives (TP)
              </span>
              <span className="text-3xl font-mono font-bold text-white tabular-nums block mt-1">
                {foldMetric.truePositives}
              </span>
              <span className="text-[10px] text-[#80978E] mt-0.5 block">
                Observed failure, predicted failure
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#060D0A] border border-[#14261F] text-center">
              <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold block">
                False Positives (FP)
              </span>
              <span className="text-3xl font-mono font-bold text-[#A4B8AF] tabular-nums block mt-1">
                {foldMetric.falsePositives}
              </span>
              <span className="text-[10px] text-[#80978E] mt-0.5 block">
                Observed resilient, predicted failure
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#281313] border border-[#4D1D1D] text-center">
              <span className="text-[10px] font-mono text-[#D93838] uppercase font-semibold block">
                False Negatives (FN)
              </span>
              <span className="text-3xl font-mono font-bold text-[#D93838] tabular-nums block mt-1">
                {foldMetric.falseNegatives}
              </span>
              <span className="text-[10px] text-[#80978E] mt-0.5 block">
                Observed failure, missed by model
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0E241B] border border-[#1B4B38] text-center">
              <span className="text-[10px] font-mono text-[#22C55E] uppercase font-semibold block">
                True Negatives (TN)
              </span>
              <span className="text-3xl font-mono font-bold text-white tabular-nums block mt-1">
                {foldMetric.trueNegatives}
              </span>
              <span className="text-[10px] text-[#80978E] mt-0.5 block">
                Observed resilient, predicted resilient
              </span>
            </div>
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
                <span>F1: {foldMetric.f1Score.toFixed(3)}</span>
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
                Standard random K-fold splits samples randomly across both space and time. Because weather and ENSO patterns correlate strongly within the same year, training on some districts in 2015 while testing on other districts in 2015 leaks year-wide weather conditions, producing artificially inflated scores.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. District-by-District Evaluation Ledger */}
      <div className="bg-[#091410] border border-[#14261F] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#14261F] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-[#22C55E]" />
            <h3 className="text-sm font-bold text-white">
              District Evaluation Breakdown: Kharif {selectedFoldYear} ({foldMetric.districtResults.length} Primary Rice Districts)
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
                <th className="py-2.5 px-3 text-right">Actual Yield</th>
                <th className="py-2.5 px-3 text-right">Yield Anomaly</th>
                <th className="py-2.5 px-3 text-center">DES Observed</th>
                <th className="py-2.5 px-3 text-right">Model Probability</th>
                <th className="py-2.5 px-4 text-center">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14261F]">
              {foldMetric.districtResults.map(res => {
                const isObservedFail = res.actualObservedFailure === 1;
                return (
                  <tr key={res.districtId} className="hover:bg-[#0B1A14]/40 transition-colors">
                    <td className="py-2.5 px-4 font-sans font-semibold text-white">{res.districtName}</td>
                    <td className="py-2.5 px-3 text-[#80978E]">{res.division}</td>
                    <td className="py-2.5 px-3 text-right text-[#A4B8AF] tabular-nums">{res.actualYieldKgHa} kg/ha</td>
                    <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${isObservedFail ? 'text-[#D93838]' : 'text-[#22C55E]'}`}>
                      {res.yieldAnomalyPct > 0 ? `+${res.yieldAnomalyPct}%` : `${res.yieldAnomalyPct}%`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        isObservedFail ? 'bg-[#2E1212] text-[#D93838] border border-[#591C1C]' : 'bg-[#0E281F] text-[#22C55E] border border-[#1B4B38]'
                      }`}>
                        {isObservedFail ? 'FAILURE' : 'RESILIENT'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      <span className={`font-bold ${res.predictedProbability >= 0.5 ? 'text-[#D93838]' : 'text-[#22C55E]'}`}>
                        {(res.predictedProbability * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        res.classificationOutcome === 'TP'
                          ? 'bg-[#0E281F] text-[#22C55E] border border-[#1B4B38]'
                          : res.classificationOutcome === 'TN'
                          ? 'bg-[#060D0A] text-[#A4B8AF] border border-[#14261F]'
                          : res.classificationOutcome === 'FP'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                          : 'bg-[#2E1212] text-[#D93838] border border-[#591C1C]'
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
