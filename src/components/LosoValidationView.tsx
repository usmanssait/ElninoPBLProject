import React, { useState } from 'react';
import {
  CheckCircle2,
  Table,
  Sprout,
  AlertTriangle,
  Info,
  Award,
  Filter,
} from 'lucide-react';
import {
  MODEL_EVALUATION_SUMMARY,
  HELDOUT_TEST_PREDICTIONS,
} from '../data/modelPredictionData';
import { useAppTheme } from '../context/ThemeContext';
import { CustomSelect, SelectOption } from './common/CustomSelect';

export const LosoValidationView: React.FC = () => {
  const [selectedTestDistrict, setSelectedTestDistrict] = useState<string>('all');
  const { isDark } = useAppTheme();
  const metrics = MODEL_EVALUATION_SUMMARY;

  const filteredPredictions = HELDOUT_TEST_PREDICTIONS.filter(p => {
    if (selectedTestDistrict !== 'all' && p.districtKey !== selectedTestDistrict) return false;
    return true;
  });

  const districtOptions: SelectOption<string>[] = [
    { value: 'all', label: 'All 5 Test Districts' },
    ...(metrics.testDistricts || []).map(d => ({
      value: d,
      label: d.toUpperCase(),
    })),
  ];

  return (
    <div className={`space-y-4 max-w-[1720px] mx-auto pb-12 w-full overflow-hidden ${isDark ? 'text-[#E8EFEB]' : 'text-[#16221B]'}`}>
      {/* 1. Header Banner */}
      <div
        className={`border rounded-2xl p-4 sm:p-5 shadow-xs ${
          isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className={`font-semibold uppercase tracking-wider ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`}>
                Spatial Generalization
              </span>
              <span aria-hidden="true" className={isDark ? 'text-[#3E5146]' : 'text-[#889B8F]'}>·</span>
              <span className={isDark ? 'text-[#7A9187]' : 'text-[#526458]'}>
                Grouped-District Holdout Evaluation Protocol
              </span>
            </div>
            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight font-serif ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
              Model Evaluation on Unseen Test Districts
            </h1>
            <p className={`text-xs max-w-3xl leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
              Assessing spatial transferability by holding out 5 entire geographical districts (<code className={`font-semibold ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`}>gondia, nagpur, nashik, palghar, sangli</code>) during training. Below are the actual empirical evaluation metrics and inference predictions recorded in <code className={`font-semibold ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`}>evaluation_metrics.json</code>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold shadow-2xs ${
                isDark
                  ? 'bg-[#0E241C] border-[#183B2B] text-[#22C55E]'
                  : 'bg-white border-[#CCD2C4] text-[#16A34A]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
              <span>Grouped-District Holdout Completed</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Core Evaluation Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: ROC-AUC */}
        <div
          className={`p-4 rounded-xl border shadow-xs ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <div className={`text-[11px] font-mono flex items-center justify-between uppercase ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
            <span>ROC-AUC Score</span>
            <Award className="w-4 h-4 text-[#22C55E]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#22C55E] tabular-nums">
              {(metrics.rocAuc * 100).toFixed(1)}%
            </span>
          </div>
          <p className={`text-[10px] mt-1 ${isDark ? 'text-[#7A9187]' : 'text-[#718277]'}`}>
            Area under ROC Curve across 20 test seasons
          </p>
        </div>

        {/* Metric 2: F1-Score */}
        <div
          className={`p-4 rounded-xl border shadow-xs ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <div className={`text-[11px] font-mono flex items-center justify-between uppercase ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
            <span>F1-Score</span>
            <Award className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#38BDF8] tabular-nums">
              {metrics.f1Score.toFixed(3)}
            </span>
          </div>
          <p className={`text-[10px] mt-1 ${isDark ? 'text-[#7A9187]' : 'text-[#718277]'}`}>
            Harmonic mean of precision &amp; recall
          </p>
        </div>

        {/* Metric 3: Accuracy */}
        <div
          className={`p-4 rounded-xl border shadow-xs ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <div className={`text-[11px] font-mono flex items-center justify-between uppercase ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
            <span>Accuracy</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
              {(metrics.accuracy * 100).toFixed(1)}%
            </span>
          </div>
          <p className={`text-[10px] mt-1 ${isDark ? 'text-[#7A9187]' : 'text-[#718277]'}`}>
            Raw accuracy on held-out records
          </p>
        </div>

        {/* Metric 4: Balanced Accuracy */}
        <div
          className={`p-4 rounded-xl border shadow-xs ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <div className={`text-[11px] font-mono flex items-center justify-between uppercase ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
            <span>Balanced Accuracy</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-purple-400 tabular-nums">
              {(metrics.balancedAccuracy * 100).toFixed(1)}%
            </span>
          </div>
          <p className={`text-[10px] mt-1 ${isDark ? 'text-[#7A9187]' : 'text-[#718277]'}`}>
            Accounts for class imbalance in test set
          </p>
        </div>
      </div>

      {/* 3. Scientific Limitation & Partition Details */}
      <div
        className={`p-4 rounded-2xl border flex items-start gap-3 shadow-2xs ${
          isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#EAECE4] border-[#CCD2C4]'
        }`}
      >
        <Info className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`} />
        <div className="text-xs space-y-1">
          <span className={`font-bold font-mono block ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
            Holdout Interpretation &amp; Class Imbalance Note
          </span>
          <p className={`leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
            {metrics.warning}
          </p>
          <div className={`flex items-center gap-4 pt-1 font-mono text-[11px] flex-wrap ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
            <span>Training: 15 districts (218 patch-rows, 8 failures, 47 resilient)</span>
            <span>&bull;</span>
            <span>Holdout: 5 districts (104 patch-rows, 2 failures, 18 resilient)</span>
          </div>
        </div>
      </div>

      {/* 4. Multi-Crop Kharif Validation Performance Breakdown */}
      {metrics.metricsByCrop && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border space-y-4 shadow-xs ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${isDark ? 'border-[#14261F]' : 'border-[#CCD2C4]'}`}>
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                <Sprout className={`w-4 h-4 ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`} />
                <span>Multi-Crop Kharif Generalization Performance (All 6 Crops)</span>
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
                Evaluation across 1,211 multi-spectral patch-year samples spanning Rice, Soybean, Cotton, Bajra, Jowar, and Tur
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-bold shadow-2xs ${
                isDark
                  ? 'bg-[#060D0A] text-[#22C55E] border-[#183B2B]'
                  : 'bg-white text-[#16A34A] border-[#CCD2C4]'
              }`}
            >
              Overall ROC-AUC: {(metrics.rocAuc * 100).toFixed(1)}% &middot; F1: {metrics.f1Score.toFixed(3)}
            </span>
          </div>

          <div
            className={`overflow-x-auto border rounded-xl ${
              isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-white border-[#CCD2C4]'
            }`}
          >
            <table className="w-full text-left text-xs font-mono">
              <thead
                className={`border-b ${
                  isDark
                    ? 'bg-[#060D0A] text-[#7A9187] border-[#14261F]'
                    : 'bg-[#EAECE4] text-[#526458] border-[#CCD2C4]'
                }`}
              >
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
              <tbody className={`divide-y ${isDark ? 'divide-[#14261F]' : 'divide-[#CCD2C4]'}`}>
                {Object.entries(metrics.metricsByCrop).map(([cropName, cMetrics]) => (
                  <tr
                    key={cropName}
                    className={`transition-colors ${isDark ? 'hover:bg-[#0E241C]/40' : 'hover:bg-[#F2F4EE]'}`}
                  >
                    <td className={`py-2 px-3 font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                      <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                      <span>{cropName}</span>
                    </td>
                    <td className={`py-2 px-3 text-right tabular-nums ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
                      {cMetrics.samples}
                    </td>
                    <td className={`py-2 px-3 text-right font-bold tabular-nums ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                      {(cMetrics.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-right text-[#38BDF8] tabular-nums">
                      {(cMetrics.balanced_accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-right text-amber-500 tabular-nums">
                      {cMetrics.f1_score.toFixed(3)}
                    </td>
                    <td className="py-2 px-3 text-right text-[#22C55E] font-bold tabular-nums">
                      {(cMetrics.roc_auc * 100).toFixed(1)}%
                    </td>
                    <td className={`py-2 px-3 text-right tabular-nums ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
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
      <div
        className={`p-4 sm:p-5 rounded-2xl border space-y-4 shadow-xs ${
          isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
        }`}
      >
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${isDark ? 'border-[#14261F]' : 'border-[#CCD2C4]'}`}>
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
              <Table className={`w-4 h-4 ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`} />
              <span>Held-out Test District Predictions (20 Seasons Evaluated)</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
              Empirical inference records from unseen test districts withheld during CNN-LSTM training
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CustomSelect<string>
              value={selectedTestDistrict}
              onChange={setSelectedTestDistrict}
              options={districtOptions}
              label="FILTER DISTRICT"
              icon={<Filter className="w-3.5 h-3.5" />}
              align="right"
            />
          </div>
        </div>

        <div
          className={`overflow-x-auto border rounded-xl ${
            isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-white border-[#CCD2C4]'
          }`}
        >
          <table className="w-full text-left text-xs font-mono">
            <thead
              className={`border-b ${
                isDark
                  ? 'bg-[#060D0A] text-[#7A9187] border-[#14261F]'
                  : 'bg-[#EAECE4] text-[#526458] border-[#CCD2C4]'
              }`}
            >
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
            <tbody className={`divide-y ${isDark ? 'divide-[#14261F]' : 'divide-[#CCD2C4]'}`}>
              {filteredPredictions.map((row, idx) => {
                const isCorrect = (row.predictedProbability >= 0.5 ? 1 : 0) === row.actualFailure;
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${isDark ? 'hover:bg-[#0E241C]/40' : 'hover:bg-[#F2F4EE]'}`}
                  >
                    <td className={`py-2 px-3 font-medium ${isDark ? 'text-white' : 'text-[#16221B]'}`}>{row.district}</td>
                    <td className={`py-2 px-3 ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>{row.cropYear}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.actualFailure === 1
                            ? isDark
                              ? 'bg-[#351214] text-[#F87171] border border-[#602022]'
                              : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                            : isDark
                            ? 'bg-[#0E2E1E] text-[#4ADE80] border border-[#1A4C32]'
                            : 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                        }`}
                      >
                        {row.actualFailure === 1 ? 'Failure (1)' : 'Resilient (0)'}
                      </span>
                    </td>
                    <td className={`py-2 px-3 text-right font-bold tabular-nums ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                      {(row.predictedProbability * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.isPredictedFailure
                            ? isDark
                              ? 'bg-[#351214] text-[#F87171] border border-[#602022]'
                              : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                            : isDark
                            ? 'bg-[#0E2E1E] text-[#4ADE80] border border-[#1A4C32]'
                            : 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                        }`}
                      >
                        {row.isPredictedFailure ? 'Predicted Failure' : 'Predicted Resilient'}
                      </span>
                    </td>
                    <td className={`py-2 px-3 text-center ${isDark ? 'text-[#7A9187]' : 'text-[#718277]'}`}>
                      {row.patches}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                          isCorrect
                            ? isDark
                              ? 'text-[#4ADE80]'
                              : 'text-[#16A34A]'
                            : isDark
                            ? 'text-amber-400'
                            : 'text-amber-700'
                        }`}
                      >
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
