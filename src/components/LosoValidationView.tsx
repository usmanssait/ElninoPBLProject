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
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#16221B] pb-12 w-full overflow-hidden">
      {/* 1. Header Banner */}
      <div className="bg-[#E2E6DC] border border-[#CCD2C4] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#12382B]">
              <span className="font-semibold uppercase tracking-wider">Spatial Generalization</span>
              <span aria-hidden="true" className="text-[#889B8F]">·</span>
              <span className="text-[#526458]">Grouped-District Holdout Evaluation Protocol</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#16221B] font-serif">
              Model Evaluation on Unseen Test Districts
            </h1>
            <p className="text-xs text-[#526458] max-w-3xl leading-relaxed">
              Assessing spatial transferability by holding out 5 entire geographical districts (<code className="text-[#12382B] font-semibold">gondia, nagpur, nashik, palghar, sangli</code>) during training. Below are the actual empirical evaluation metrics and inference predictions recorded in <code className="text-[#12382B] font-semibold">evaluation_metrics.json</code>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#CCD2C4] text-xs font-mono text-[#16A34A] font-semibold shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>Grouped-District Holdout Completed</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Core Evaluation Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: ROC-AUC */}
        <div className="p-4 rounded-xl bg-[#E2E6DC] border border-[#CCD2C4] shadow-xs">
          <div className="text-[11px] font-mono text-[#526458] flex items-center justify-between uppercase">
            <span>ROC-AUC Score</span>
            <Award className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#16A34A] tabular-nums">
              {(metrics.rocAuc * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-[10px] text-[#718277] mt-1">Area under ROC Curve across 20 test seasons</p>
        </div>

        {/* Metric 2: Balanced Accuracy */}
        <div className="p-4 rounded-xl bg-[#E2E6DC] border border-[#CCD2C4] shadow-xs">
          <div className="text-[11px] font-mono text-[#526458] flex items-center justify-between uppercase">
            <span>Balanced Accuracy</span>
            <Activity className="w-4 h-4 text-[#0284C7]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#0284C7] tabular-nums">
              {(metrics.balancedAccuracy * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-[10px] text-[#718277] mt-1">Macro average across imbalanced classes</p>
        </div>

        {/* Metric 3: Accuracy @ 0.5 Threshold */}
        <div className="p-4 rounded-xl bg-[#E2E6DC] border border-[#CCD2C4] shadow-xs">
          <div className="text-[11px] font-mono text-[#526458] flex items-center justify-between uppercase">
            <span>Test Accuracy (P &ge; 0.5)</span>
            <CheckCircle2 className="w-4 h-4 text-[#16221B]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#16221B] tabular-nums">
              {(metrics.accuracy * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-[#526458] font-mono">
              (Baseline: {(metrics.majorityBaselineAccuracy * 100).toFixed(0)}%)
            </span>
          </div>
          <p className="text-[10px] text-[#718277] mt-1">18/20 test season outcomes correct</p>
        </div>

        {/* Metric 4: F1 Score & Precision/Recall */}
        <div className="p-4 rounded-xl bg-[#E2E6DC] border border-[#CCD2C4] shadow-xs">
          <div className="text-[11px] font-mono text-[#526458] flex items-center justify-between uppercase">
            <span>F1 / Precision / Recall</span>
            <ShieldAlert className="w-4 h-4 text-amber-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-700 tabular-nums">
              0.50
            </span>
            <span className="text-xs text-[#526458] font-mono">
              (P: 0.50 · R: 0.50)
            </span>
          </div>
          <p className="text-[10px] text-[#718277] mt-1">1 true positive, 1 false alarm, 1 missed</p>
        </div>
      </div>

      {/* 3. Scientific Limitation & Partition Details */}
      <div className="p-4 rounded-2xl bg-[#EAECE4] border border-[#CCD2C4] flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-[#12382B] shrink-0 mt-0.5" />
        <div className="text-xs text-[#3E5146] space-y-1">
          <span className="font-bold text-[#16221B] font-mono block">
            Holdout Interpretation &amp; Class Imbalance Note
          </span>
          <p className="leading-relaxed text-[#526458]">
            {metrics.warning}
          </p>
          <div className="flex items-center gap-4 pt-1 font-mono text-[11px] text-[#526458] flex-wrap">
            <span>Training: 15 districts (218 patch-rows, 8 failures, 47 resilient)</span>
            <span>&bull;</span>
            <span>Holdout: 5 districts (104 patch-rows, 2 failures, 18 resilient)</span>
          </div>
        </div>
      </div>

      {/* 4. Multi-Crop Kharif Validation Performance Breakdown */}
      {metrics.metricsByCrop && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#CCD2C4]">
            <div>
              <h3 className="text-sm font-bold text-[#16221B] flex items-center gap-2">
                <Sprout className="w-4 h-4 text-[#12382B]" />
                <span>Multi-Crop Kharif Generalization Performance (All 6 Crops)</span>
              </h3>
              <p className="text-xs text-[#526458] mt-0.5">
                Evaluation across 1,211 multi-spectral patch-year samples spanning Rice, Soybean, Cotton, Bajra, Jowar, and Tur
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-white text-[#16A34A] border border-[#CCD2C4] text-xs font-mono font-bold shadow-2xs">
              Overall ROC-AUC: {(metrics.rocAuc * 100).toFixed(1)}% &middot; F1: {metrics.f1Score.toFixed(3)}
            </span>
          </div>

          <div className="overflow-x-auto border border-[#CCD2C4] rounded-xl bg-white">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#EAECE4] text-[#526458] border-b border-[#CCD2C4]">
                <tr>
                  <th className="py-2.5 px-3">Crop</th>
                  <th className="py-2.5 px-3 text-right">Samples Evaluated</th>
                  <th className="py-2.5 px-3 text-right">Accuracy</th>
                  <th className="py-2.5 px-3 text-right">Balanced Accuracy</th>
                  <th className="py-2.5 px-3 text-right">F1-Score</th>
                  <th className="py-2.5 px-3 text-right">ROC-AUC</th>
                  <th className="py-2.5 px-3 text-right">PR-AUC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CCD2C4]">
                {Object.entries(metrics.metricsByCrop).map(([cropName, cMetrics]) => (
                  <tr key={cropName} className="hover:bg-[#F2F4EE]">
                    <td className="py-2 px-3 text-[#16221B] font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                      <span>{cropName}</span>
                    </td>
                    <td className="py-2 px-3 text-right text-[#526458] tabular-nums">{cMetrics.samples}</td>
                    <td className="py-2 px-3 text-right text-[#16221B] font-bold tabular-nums">
                      {(cMetrics.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-right text-[#0284C7] tabular-nums">
                      {(cMetrics.balanced_accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-right text-amber-700 tabular-nums">
                      {cMetrics.f1_score.toFixed(3)}
                    </td>
                    <td className="py-2 px-3 text-right text-[#16A34A] font-bold tabular-nums">
                      {(cMetrics.roc_auc * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-right text-[#526458] tabular-nums">
                      {(cMetrics.pr_auc * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Held-out Test District Predictions Table */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#CCD2C4]">
          <div>
            <h3 className="text-sm font-bold text-[#16221B] flex items-center gap-2">
              <Table className="w-4 h-4 text-[#12382B]" />
              <span>Held-out Test District Predictions (20 Seasons Evaluated)</span>
            </h3>
            <p className="text-xs text-[#526458] mt-0.5">
              Empirical inference records from unseen test districts withheld during CNN-LSTM training
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#526458]">Filter District:</span>
            <select
              value={selectedTestDistrict}
              onChange={e => setSelectedTestDistrict(e.target.value)}
              className="bg-white border border-[#CCD2C4] text-[#16221B] rounded-lg px-2.5 py-1 text-xs font-mono cursor-pointer focus:outline-hidden shadow-2xs"
            >
              <option value="all">All 5 Test Districts</option>
              {(metrics.testDistricts || []).map(d => (
                <option key={d} value={d} className="bg-white text-[#16221B]">
                  {d.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#CCD2C4] rounded-xl bg-white">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#EAECE4] text-[#526458] border-b border-[#CCD2C4]">
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
            <tbody className="divide-y divide-[#CCD2C4]">
              {filteredPredictions.map((row, idx) => {
                const isCorrect = (row.predictedProbability >= 0.5 ? 1 : 0) === row.actualFailure;
                return (
                  <tr key={idx} className="hover:bg-[#F2F4EE]">
                    <td className="py-2 px-3 text-[#16221B] font-medium">{row.district}</td>
                    <td className="py-2 px-3 text-[#526458]">{row.cropYear}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.actualFailure === 1 ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]' : 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                      }`}>
                        {row.actualFailure === 1 ? 'Failure (1)' : 'Resilient (0)'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-[#16221B] tabular-nums">
                      {(row.predictedProbability * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.isPredictedFailure ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]' : 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                      }`}>
                        {row.isPredictedFailure ? 'Predicted Failure' : 'Predicted Resilient'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-[#718277]">
                      {row.patches}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        isCorrect ? 'text-[#16A34A]' : 'text-amber-700'
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


