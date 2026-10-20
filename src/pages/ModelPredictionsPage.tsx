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
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#E8EFEB]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#14261F]/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              CNN-LSTM Spatiotemporal In-Season Predictions
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1B382A] text-[#4ADE80] border border-[#22C55E]/40">
              All-Kharif Multi-Crop Model (17,449 params)
            </span>
          </div>
          <p className="text-xs text-[#80978E] mt-0.5 font-medium">
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
      <div className="px-4 py-2.5 rounded-xl border bg-[#091D15] border-[#164332] text-[#4ADE80] flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] shrink-0 animate-pulse" />
          <span>
            <strong className="text-white">Active Neural Model Inference (Kharif {cropYearStr} — {selectedCrop === 'ALL' ? 'All Kharif Crops Composite' : selectedCrop}):</strong>{' '}
            Evaluated from trained PyTorch checkpoint (<code className="text-white">crop_failure_model.pt</code>). Ingests 6 bi-weekly 8-band Sentinel-2 patches ($[B, 6, 8, 32, 32]$) and 10-dimensional temporal vector (IMD rainfall, departure %, ONI anomaly, coverage, and crop-specific one-hot vector).
          </span>
        </div>
      </div>

      {/* 3 Metric Pills */}
      {isSupported && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#7A9187] font-mono">Monitored In-Season ({selectedCrop})</span>
              <div className="text-xl font-bold font-mono text-white mt-0.5">{readyDistricts.length} Districts</div>
            </div>
            <Layers className="w-5 h-5 text-[#38BDF8]" />
          </div>

          <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#7A9187] font-mono">Model Predicted Failure</span>
              <div className="text-xl font-bold font-mono text-[#EF4444] mt-0.5">{failureCount} Districts</div>
            </div>
            <ShieldAlert className="w-5 h-5 text-[#EF4444]" />
          </div>

          <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#7A9187] font-mono">Model Predicted Resilient</span>
              <div className="text-xl font-bold font-mono text-[#22C55E] mt-0.5">{resilientCount} Districts</div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
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
        <div className="lg:col-span-5 rounded-2xl bg-[#091410] border border-[#14261F] p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#14261F]">
            <h3 className="text-sm font-bold text-white">Neural Output Ledger</h3>
            <span className="text-[10px] font-mono text-[#7A9187]">
              {readyDistricts.length} Monitored &middot; {selectedCrop}
            </span>
          </div>

          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#060D0A] text-[#7A9187] sticky top-0 border-b border-[#14261F]">
                <tr>
                  <th className="py-2 px-2.5 font-sans font-semibold">District</th>
                  <th className="py-2 px-2 text-right">Risk Score</th>
                  <th className="py-2 px-2 text-right">Category</th>
                  <th className="py-2 px-2 text-right">Patches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14261F]">
                {monitoredDistrictsForCrop.map(d => {
                  const pred = inSeasonModelPredictions[d.id];
                  const isSelected = selectedDistrictId === d.id;
                  const isReady = pred && pred.predictionStatus === 'READY';

                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDistrictId(d.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#0E281F] text-white' : 'hover:bg-[#0B1A14]/40'
                      }`}
                    >
                      <td className="py-2 px-2.5 font-sans font-medium text-white">{d.name}</td>
                      <td className="py-2 px-2 text-right tabular-nums">
                        {isReady && pred.failureProbability !== null
                          ? pred.failureProbability.toFixed(3)
                          : '—'}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            !isReady
                              ? 'bg-[#14221C] text-[#62776E]'
                              : pred.riskCategory === 'High'
                              ? 'bg-[#2E1212] text-[#EF4444]'
                              : pred.riskCategory === 'Moderate'
                              ? 'bg-amber-950/40 text-amber-400'
                              : 'bg-[#0E281F] text-[#22C55E]'
                          }`}
                        >
                          {isReady ? pred.riskCategory : 'Unmonitored'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right text-[#80978E] tabular-nums">
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
