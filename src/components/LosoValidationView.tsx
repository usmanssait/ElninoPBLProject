import React, { useState } from 'react';
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
  Award,
} from 'lucide-react';
import {
  MODEL_EVALUATION_SUMMARY,
  HELDOUT_TEST_PREDICTIONS,
} from '../data/modelPredictionData';

export const LosoValidationView: React.FC = () => {
  const [selectedTestDistrict, setSelectedTestDistrict] = useState<string>('all');
  const metrics = MODEL_EVALUATION_SUMMARY;

  const filteredPredictions = HELDOUT_TEST_PREDICTIONS.filter(p => {
    if (selectedTestDistrict !== 'all' && p.districtKey !== selectedTestDistrict) return false;
    return true;
  });

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#E8EFEB] pb-12 w-full overflow-hidden">
      {/* 1. Header Banner */}
      <div className="bg-[#091410] border border-[#14261F] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#22C55E]">
              <span className="font-semibold uppercase tracking-wider">Spatial Generalization</span>
              <span aria-hidden="true" className="text-[#3A5046]">·</span>
              <span className="text-[#80978E]">Grouped-District Holdout Evaluation Protocol</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Model Evaluation on Unseen Test Districts
            </h1>
            <p className="text-xs text-[#80978E] max-w-3xl leading-relaxed">
              Assessing spatial transferability by holding out 5 entire geographical districts (<code className="text-[#22C55E]">gondia, nagpur, nashik, palghar, sangli</code>) during training. Below are the actual empirical evaluation metrics and inference predictions recorded in <code className="text-[#22C55E]">evaluation_metrics.json</code>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#091D15] border border-[#164332] text-xs font-mono text-[#4ADE80] font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
              <span>Grouped-District Holdout Completed</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Core Evaluation Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: ROC-AUC */}
        <div className="p-4 rounded-xl bg-[#091410] border border-[#14261F]">
          <div className="text-[11px] font-mono text-[#7A9187] flex items-center justify-between uppercase">
            <span>ROC-AUC Score</span>
            <Award className="w-4 h-4 text-[#22C55E]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#22C55E] tabular-nums">
              {(metrics.rocAuc * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-[10px] text-[#6A8177] mt-1">Area under ROC Curve across 20 test seasons</p>
        </div>

        {/* Metric 2: Balanced Accuracy */}
        <div className="p-4 rounded-xl bg-[#091410] border border-[#14261F]">
          <div className="text-[11px] font-mono text-[#7A9187] flex items-center justify-between uppercase">
            <span>Balanced Accuracy</span>
            <Activity className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#38BDF8] tabular-nums">
              {(metrics.balancedAccuracy * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-[10px] text-[#6A8177] mt-1">Macro average across imbalanced classes</p>
        </div>

        {/* Metric 3: Accuracy @ 0.5 Threshold */}
        <div className="p-4 rounded-xl bg-[#091410] border border-[#14261F]">
          <div className="text-[11px] font-mono text-[#7A9187] flex items-center justify-between uppercase">
            <span>Test Accuracy (P &ge; 0.5)</span>
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
              {(metrics.accuracy * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-[#80978E] font-mono">
              (Baseline: {(metrics.majorityBaselineAccuracy * 100).toFixed(0)}%)
            </span>
          </div>
          <p className="text-[10px] text-[#6A8177] mt-1">18/20 test season outcomes correct</p>
        </div>

        {/* Metric 4: F1 Score & Precision/Recall */}
        <div className="p-4 rounded-xl bg-[#091410] border border-[#14261F]">
          <div className="text-[11px] font-mono text-[#7A9187] flex items-center justify-between uppercase">
            <span>F1 / Precision / Recall</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-400 tabular-nums">
              0.50
            </span>
            <span className="text-xs text-[#80978E] font-mono">
              (P: 0.50 · R: 0.50)
            </span>
          </div>
          <p className="text-[10px] text-[#6A8177] mt-1">1 true positive, 1 false alarm, 1 missed</p>
        </div>
      </div>

      {/* 3. Scientific Limitation & Partition Details */}
      <div className="p-4 rounded-2xl bg-[#141C16] border border-[#234330] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
        <div className="text-xs text-[#C6DACF] space-y-1">
          <span className="font-bold text-white font-mono block">
            Holdout Interpretation & Class Imbalance Note
          </span>
          <p className="leading-relaxed text-[#A4B8AF]">
            {metrics.warning}
          </p>
          <div className="flex items-center gap-4 pt-1 font-mono text-[11px] text-[#718E81] flex-wrap">
            <span>Training: 15 districts (218 patch-rows, 8 failures, 47 resilient)</span>
            <span>&bull;</span>
            <span>Holdout: 5 districts (104 patch-rows, 2 failures, 18 resilient)</span>
          </div>
        </div>
      </div>

      {/* 4. Held-out Test District Predictions Table */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#091410] border border-[#14261F] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#14261F]">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-[#22C55E]" />
              <span>Held-out Test District Predictions (20 Seasons Evaluated)</span>
            </h3>
            <p className="text-xs text-[#80978E] mt-0.5">
              Empirical inference records from unseen test districts withheld during CNN-LSTM training
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#80978E]">Filter District:</span>
            <select
              value={selectedTestDistrict}
              onChange={e => setSelectedTestDistrict(e.target.value)}
              className="bg-[#0B1A14] border border-[#173026] text-white rounded-lg px-2.5 py-1 text-xs font-mono cursor-pointer focus:outline-hidden"
            >
              <option value="all">All 5 Test Districts</option>
              {metrics.testDistricts.map(d => (
                <option key={d} value={d} className="bg-[#08120E] text-white">
                  {d.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#14261F] rounded-xl bg-[#060D0A]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#091410] text-[#7A9187] border-b border-[#14261F]">
              <tr>
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3">Season</th>
                <th className="py-2.5 px-3 text-center">True DES Label</th>
                <th className="py-2.5 px-3 text-right">Predicted P(Failure)</th>
                <th className="py-2.5 px-3 text-center">Classification @ 0.5</th>
                <th className="py-2.5 px-3 text-center">S2 Patches</th>
                <th className="py-2.5 px-3 text-center">Evaluation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F1E18]">
              {filteredPredictions.map((row, idx) => {
                const isCorrect = (row.predictedProbability >= 0.5 ? 1 : 0) === row.actualFailure;
                return (
                  <tr key={idx} className="hover:bg-[#0A1612]">
                    <td className="py-2 px-3 text-white font-medium">{row.district}</td>
                    <td className="py-2 px-3 text-[#A4B8AF]">{row.cropYear}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.actualFailure === 1 ? 'bg-[#2E1212] text-[#EF4444]' : 'bg-[#0E241B] text-[#22C55E]'
                      }`}>
                        {row.actualFailure === 1 ? 'Failure (1)' : 'Resilient (0)'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-white tabular-nums">
                      {(row.predictedProbability * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.isPredictedFailure ? 'bg-[#2E1212] text-[#EF4444]' : 'bg-[#0E241B] text-[#22C55E]'
                      }`}>
                        {row.isPredictedFailure ? 'Predicted Failure' : 'Predicted Resilient'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-[#80978E]">
                      {row.patches}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        isCorrect ? 'text-[#22C55E]' : 'text-amber-400'
                      }`}>
                        {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        {isCorrect ? 'Correct' : 'Misclassified'}
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
