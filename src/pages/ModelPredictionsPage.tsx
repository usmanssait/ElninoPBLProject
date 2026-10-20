import React from 'react';
import { DistrictChoropleth } from '../components/map/DistrictChoropleth';
import { YearSelect } from '../components/common/YearSelect';
import { CropSelect } from '../components/common/CropSelect';
import { useDashboard } from '../context/DashboardContext';
import { SUPPORTED_MODEL_YEARS, isModelSupportedYear } from '../data/modelPredictionData';
import { Activity, ShieldAlert, CheckCircle2, Download, Layers, Sprout } from 'lucide-react';

export const ModelPredictionsPage: React.FC = () => {
  const {
    selectedYear,
    setSelectedYear,
    selectedCrop,
    cropYearStr,
    inSeasonModelPredictions,
    selectedDistrictId,
    setSelectedDistrictId,
    monitoredDistrictsForCrop,
  } = useDashboard();

  // Auto-switch to supported date if currently on an unavailable year
  React.useEffect(() => {
    if (!SUPPORTED_MODEL_YEARS.includes(selectedYear)) {
      setSelectedYear(2020);
    }
  }, [selectedYear, setSelectedYear]);

  const isSupported = isModelSupportedYear(selectedYear);

  const readyDistricts = monitoredDistrictsForCrop.filter(
    d => inSeasonModelPredictions[d.id]?.predictionStatus === 'READY'
  );
  const failureCount = readyDistricts.filter(
    d => inSeasonModelPredictions[d.id]?.isFailure === true
  ).length;
  const resilientCount = readyDistricts.length - failureCount;

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#16221B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#CCD2C4]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#16221B] font-serif">
              CNN-LSTM Spatiotemporal In-Season Predictions
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#DCE1D4] text-[#12382B] border border-[#CCD2C4]">
              All-Kharif Multi-Crop Model (17,449 params)
            </span>
          </div>
          <p className="text-xs text-[#526458] mt-0.5 font-medium">
            Trained PyTorch compact CNN-BiLSTM network evaluated across all Kharif crops (Rice, Soybean, Cotton, Bajra, Jowar, Tur) and Sentinel-2 monitored districts
          </p>
        </div>

        {/* Filters: Crop Selector + Year Selector (2019–2022) */}
        <div className="flex items-center gap-2 flex-wrap">
          <CropSelect />
          <YearSelect years={SUPPORTED_MODEL_YEARS} />
        </div>
      </div>

      {/* Active Model Inference Bar */}
      <div className="px-4 py-2.5 rounded-xl border bg-[#EAECE4] border-[#CCD2C4] text-[#16221B] flex items-center justify-between gap-3 text-xs font-mono shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] shrink-0 animate-pulse" />
          <span>
            <strong className="text-[#12382B]">Active Neural Model Inference (Kharif {cropYearStr} — {selectedCrop === 'ALL' ? 'All Kharif Crops Composite' : selectedCrop}):</strong>{' '}
            Evaluated from trained PyTorch checkpoint (<code className="text-[#12382B] font-bold">crop_failure_model.pt</code>). Ingests 6 bi-weekly 8-band Sentinel-2 patches ($[B, 6, 8, 32, 32]$) and 10-dimensional temporal vector (IMD rainfall, departure %, ONI anomaly, coverage, and crop-specific one-hot vector).
          </span>
        </div>
      </div>

      {/* 3 Metric Pills */}
      {isSupported && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#E2E6DC] border border-[#CCD2C4] flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] text-[#526458] font-mono">Monitored In-Season ({selectedCrop})</span>
              <div className="text-xl font-bold font-mono text-[#16221B] mt-0.5">{readyDistricts.length} Districts</div>
            </div>
            <Layers className="w-5 h-5 text-[#0284C7]" />
          </div>

          <div className="p-3.5 rounded-xl bg-[#E2E6DC] border border-[#CCD2C4] flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] text-[#526458] font-mono">Model Predicted Failure</span>
              <div className="text-xl font-bold font-mono text-[#DC2626] mt-0.5">{failureCount} Districts</div>
            </div>
            <ShieldAlert className="w-5 h-5 text-[#DC2626]" />
          </div>

          <div className="p-3.5 rounded-xl bg-[#E2E6DC] border border-[#CCD2C4] flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] text-[#526458] font-mono">Model Predicted Resilient</span>
              <div className="text-xl font-bold font-mono text-[#16A34A] mt-0.5">{resilientCount} Districts</div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
          </div>
        </div>
      )}

      {/* Grid: Map + District Predictions Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7">
          <DistrictChoropleth
            mode="model_pred"
            title={`CNN-LSTM In-Season Risk Map — Kharif ${cropYearStr} (${selectedCrop})`}
            heightClass="min-h-[480px] sm:min-h-[520px]"
          />
        </div>

        {/* Prediction Data Ledger */}
        <div className="lg:col-span-5 rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#CCD2C4]">
            <h3 className="text-sm font-bold text-[#16221B]">Neural Output Ledger</h3>
            <span className="text-[10px] font-mono text-[#526458]">
              {readyDistricts.length} Monitored &middot; {selectedCrop}
            </span>
          </div>

          <div className="overflow-x-auto max-h-[460px] bg-white rounded-xl border border-[#CCD2C4]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#EAECE4] text-[#526458] sticky top-0 border-b border-[#CCD2C4]">
                <tr>
                  <th className="py-2 px-2.5 font-sans font-semibold">District</th>
                  <th className="py-2 px-2 text-right">Risk Score</th>
                  <th className="py-2 px-2 text-right">Category</th>
                  <th className="py-2 px-2 text-right">Patches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CCD2C4]">
                {monitoredDistrictsForCrop.map(d => {
                  const pred = inSeasonModelPredictions[d.id];
                  const isSelected = selectedDistrictId === d.id;
                  const isReady = pred && pred.predictionStatus === 'READY';

                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDistrictId(d.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#D9E2D5] font-semibold text-[#12382B]' : 'hover:bg-[#F2F4EE]'
                      }`}
                    >
                      <td className="py-2 px-2.5 font-sans font-medium text-[#16221B]">{d.name}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-[#16221B]">
                        {isReady && pred.failureProbability !== null
                          ? pred.failureProbability.toFixed(3)
                          : '—'}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            !isReady
                              ? 'bg-[#EAECE4] text-[#718277] border border-[#CCD2C4]'
                              : pred.riskCategory === 'High'
                              ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                              : pred.riskCategory === 'Moderate'
                              ? 'bg-[#FEF3C7] text-amber-800 border border-[#FDE68A]'
                              : 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                          }`}
                        >
                          {isReady ? pred.riskCategory : 'Unmonitored'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right text-[#718277] tabular-nums">
                        {pred?.provenance?.sampledLocations ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
