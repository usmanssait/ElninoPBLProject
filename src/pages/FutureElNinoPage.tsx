import React, { useState, useMemo } from 'react';
import {
  PRESET_SCENARIOS,
  FutureElNinoScenario,
  DistrictFuturePrediction,
  predictFutureElNinoSeason,
} from '../data/futureElNinoForecast';
import { Compass, Sliders } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { useAppTheme } from '../context/ThemeContext';

export const FutureElNinoPage: React.FC = () => {
  const { selectedDistrictId, setSelectedDistrictId } = useDashboard();
  const { isDark } = useAppTheme();

  // Selected or custom scenario
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('2026_super_elnino');
  const [oniAnomaly, setOniAnomaly] = useState<number>(2.0);
  const [rainfallDeparture, setRainfallDeparture] = useState<number>(-28);
  const [canopyNdvi, setCanopyNdvi] = useState<number>(0.42);

  const handleSelectPreset = (sc: FutureElNinoScenario) => {
    setSelectedScenarioId(sc.id);
    setOniAnomaly(sc.oniSstAnomaly);
    setRainfallDeparture(sc.rainfallDeparturePct);
    setCanopyNdvi(sc.canopyNdvi);
  };

  const simulationResults = useMemo(() => {
    const map = predictFutureElNinoSeason({
      oniSstAnomaly: oniAnomaly,
      rainfallDeparturePct: rainfallDeparture,
      canopyNdvi: canopyNdvi,
    });
    return Object.values(map);
  }, [oniAnomaly, rainfallDeparture, canopyNdvi]);

  const highRiskCount = simulationResults.filter(
    (r: DistrictFuturePrediction) => r.riskCategory === 'High Failure Probability'
  ).length;
  const modRiskCount = simulationResults.filter(
    (r: DistrictFuturePrediction) => r.riskCategory === 'Moderate Watch'
  ).length;
  const lowRiskCount = simulationResults.filter(
    (r: DistrictFuturePrediction) => r.riskCategory === 'Low Failure Probability'
  ).length;

  return (
    <div className={`space-y-4 max-w-[1720px] mx-auto pb-12 w-full overflow-hidden ${isDark ? 'text-[#E8EFEB]' : 'text-[#16221B]'}`}>
      {/* Header */}
      <div
        className={`border rounded-2xl p-4 sm:p-5 shadow-xs ${
          isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight font-serif ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                Future El Niño Scenario Simulation & Feasibility Audit
              </h1>
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                  isDark
                    ? 'bg-[#352A12] text-amber-300 border-[#604D20]'
                    : 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                }`}
              >
                Prospective Modeling
              </span>
            </div>
            <p className={`text-xs mt-1 font-medium ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
              Evaluate district failure vulnerability under hypothetical Pacific SST anomalies and monsoon rainfall deficit scenarios
            </p>
          </div>
        </div>
      </div>

      {/* Scientific Feasibility Card */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 space-y-3 shadow-xs ${
          isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${
              isDark
                ? 'bg-[#060D0A] border-[#14261F] text-[#22C55E]'
                : 'bg-white border-[#CCD2C4] text-[#12382B]'
            }`}
          >
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
              Physical Prerequisites for In-Season Deployment
            </h3>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
              Genuine spatiotemporal forecasting requires observed Sentinel-2 L2A surface reflectance arrays and gridded IMD rainfall records. The simulator below evaluates sensitivity using physics-informed empirical response surfaces calibrated to historical ENSO shocks.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="space-y-2">
        <span className={`text-[11px] font-mono uppercase font-bold tracking-wider ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
          Select Climate Scenario Preset
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_SCENARIOS.map(sc => {
            const isSelected = selectedScenarioId === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => handleSelectPreset(sc)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-[#0E241C] text-white border-[#22C55E]/60 shadow-[0_0_12px_rgba(34,197,94,0.18)]'
                      : 'bg-[#12382B] text-white border-[#12382B] shadow-xs'
                    : isDark
                    ? 'bg-[#091410] border-[#14261F] hover:bg-[#0E241C]/60 text-[#E8EFEB]'
                    : 'bg-[#E2E6DC] border-[#CCD2C4] hover:bg-[#D9DED3] text-[#16221B]'
                }`}
              >
                <div className="flex items-center justify-between font-mono">
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : isDark ? 'text-white' : 'text-[#16221B]'}`}>
                    {sc.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      isSelected
                        ? isDark
                          ? 'text-[#22C55E]'
                          : 'text-emerald-200'
                        : isDark
                        ? 'text-[#22C55E]'
                        : 'text-[#12382B]'
                    }`}
                  >
                    {sc.oniSstAnomaly > 0 ? `+${sc.oniSstAnomaly}` : sc.oniSstAnomaly}°C
                  </span>
                </div>
                <p
                  className={`text-[11px] mt-1 leading-snug line-clamp-2 ${
                    isSelected ? (isDark ? 'text-[#A3B8AF]' : 'text-emerald-100/80') : (isDark ? 'text-[#7A9187]' : 'text-[#526458]')
                  }`}
                >
                  {sc.description}
                </p>
                <div
                  className={`flex justify-between text-[10px] font-mono mt-2 pt-1.5 border-t ${
                    isSelected
                      ? isDark
                        ? 'border-[#183B2B] text-[#22C55E]'
                        : 'border-emerald-800 text-emerald-200'
                      : isDark
                      ? 'border-[#14261F] text-[#7A9187]'
                      : 'border-[#CCD2C4] text-[#718277]'
                  }`}
                >
                  <span>Rain: {sc.rainfallDeparturePct}%</span>
                  <span>NDVI: {sc.canopyNdvi}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sliders & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Sliders (4 cols) */}
        <div
          className={`lg:col-span-4 rounded-2xl border p-4 sm:p-5 space-y-4 shadow-xs ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <div className={`flex items-center gap-2 pb-2 border-b ${isDark ? 'border-[#14261F]' : 'border-[#CCD2C4]'}`}>
            <Sliders className={`w-4 h-4 ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`} />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>Scenario Parameters</h3>
          </div>

          {/* Slider 1: ONI SST */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className={isDark ? 'text-[#7A9187]' : 'text-[#526458]'}>Niño 3.4 SST Anomaly:</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                {oniAnomaly > 0 ? `+${oniAnomaly.toFixed(1)}` : oniAnomaly.toFixed(1)}°C
              </span>
            </div>
            <input
              type="range"
              min="-1.5"
              max="2.5"
              step="0.1"
              value={oniAnomaly}
              onChange={e => {
                setOniAnomaly(Number(e.target.value));
                setSelectedScenarioId('custom');
              }}
              className="w-full accent-[#22C55E] cursor-pointer"
            />
            <div className={`flex justify-between text-[9px] font-mono ${isDark ? 'text-[#7A9187]' : 'text-[#718277]'}`}>
              <span>-1.5°C (La Niña)</span>
              <span>+2.5°C (Super El Niño)</span>
            </div>
          </div>

          {/* Slider 2: Rainfall Departure */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className={isDark ? 'text-[#7A9187]' : 'text-[#526458]'}>Rainfall Departure %:</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>
                {rainfallDeparture > 0 ? `+${rainfallDeparture}` : rainfallDeparture}%
              </span>
            </div>
            <input
              type="range"
              min="-40"
              max="30"
              step="1"
              value={rainfallDeparture}
              onChange={e => {
                setRainfallDeparture(Number(e.target.value));
                setSelectedScenarioId('custom');
              }}
              className="w-full accent-[#22C55E] cursor-pointer"
            />
            <div className={`flex justify-between text-[9px] font-mono ${isDark ? 'text-[#7A9187]' : 'text-[#718277]'}`}>
              <span>-40% (Severe Deficit)</span>
              <span>+30% (Excess Monsoon)</span>
            </div>
          </div>

          {/* Slider 3: Canopy NDVI */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className={isDark ? 'text-[#7A9187]' : 'text-[#526458]'}>Mean Mid-Season NDVI:</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>{canopyNdvi.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.85"
              step="0.01"
              value={canopyNdvi}
              onChange={e => {
                setCanopyNdvi(Number(e.target.value));
                setSelectedScenarioId('custom');
              }}
              className="w-full accent-[#22C55E] cursor-pointer"
            />
            <div className={`flex justify-between text-[9px] font-mono ${isDark ? 'text-[#7A9187]' : 'text-[#718277]'}`}>
              <span>0.30 (Stressed)</span>
              <span>0.85 (Vigorous Canopy)</span>
            </div>
          </div>

          {/* Summary */}
          <div
            className={`p-3.5 rounded-xl border text-xs font-mono space-y-1.5 shadow-2xs ${
              isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-white border-[#CCD2C4]'
            }`}
          >
            <div className={`flex justify-between ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
              <span>High Risk Districts:</span>
              <span className="text-[#F87171] font-bold">{highRiskCount}</span>
            </div>
            <div className={`flex justify-between ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
              <span>Moderate Watch:</span>
              <span className="text-amber-400 font-bold">{modRiskCount}</span>
            </div>
            <div className={`flex justify-between ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>
              <span>Low Risk:</span>
              <span className="text-[#4ADE80] font-bold">{lowRiskCount}</span>
            </div>
          </div>
        </div>

        {/* District Projected Risks Table (8 cols) */}
        <div
          className={`lg:col-span-8 rounded-2xl border p-4 sm:p-5 shadow-xs space-y-3 ${
            isDark ? 'bg-[#091410] border-[#14261F]' : 'bg-[#E2E6DC] border-[#CCD2C4]'
          }`}
        >
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-[#14261F]' : 'border-[#CCD2C4]'}`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#16221B]'}`}>District Failure Risk Projections</h3>
            <span className={`text-[10px] font-mono ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}>24 Rice Districts</span>
          </div>

          <div
            className={`overflow-x-auto max-h-[460px] border rounded-xl shadow-2xs ${
              isDark ? 'bg-[#060D0A] border-[#14261F]' : 'bg-white border-[#CCD2C4]'
            }`}
          >
            <table className="w-full text-left text-xs font-mono">
              <thead
                className={`sticky top-0 border-b ${
                  isDark
                    ? 'bg-[#060D0A] text-[#7A9187] border-[#14261F]'
                    : 'bg-[#EAECE4] text-[#526458] border-[#CCD2C4]'
                }`}
              >
                <tr>
                  <th className="py-2.5 px-3 font-sans font-semibold">District</th>
                  <th className="py-2.5 px-2 text-right">Failure Prob.</th>
                  <th className="py-2.5 px-2 text-right">Projected Yield</th>
                  <th className="py-2.5 px-2 text-right">Anomaly %</th>
                  <th className="py-2.5 px-3 text-center">Category</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#14261F]' : 'divide-[#CCD2C4]'}`}>
                {simulationResults.map(r => {
                  const isSelected = selectedDistrictId === r.districtId;
                  const isHigh = r.riskCategory === 'High Failure Probability';
                  const isMod = r.riskCategory === 'Moderate Watch';

                  return (
                    <tr
                      key={r.districtId}
                      onClick={() => setSelectedDistrictId(r.districtId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? isDark
                            ? 'bg-[#0E241C] text-[#22C55E]'
                            : 'bg-[#12382B] text-white'
                          : isDark
                          ? 'hover:bg-[#0E241C]/40 text-[#E8EFEB]'
                          : 'hover:bg-[#F4F6F2] text-[#16221B]'
                      }`}
                    >
                      <td className={`py-2 px-3 font-sans font-medium ${isSelected ? (isDark ? 'text-[#22C55E]' : 'text-white') : (isDark ? 'text-white' : 'text-[#16221B]')}`}>
                        {r.districtName}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums font-bold">
                        {(r.failureProbability * 100).toFixed(1)}%
                      </td>
                      <td className={`py-2 px-2 text-right tabular-nums ${isSelected ? (isDark ? 'text-[#A3B8AF]' : 'text-emerald-100') : (isDark ? 'text-[#7A9187]' : 'text-[#526458]')}`}>
                        {r.projectedYieldTonnesHa.toFixed(2)} t/ha
                      </td>
                      <td
                        className={`py-2 px-2 text-right tabular-nums font-bold ${
                          isSelected
                            ? isDark
                              ? 'text-[#22C55E]'
                              : 'text-white'
                            : r.projectedAnomalyPct < -10
                            ? isDark
                              ? 'text-[#F87171]'
                              : 'text-[#DC2626]'
                            : isDark
                            ? 'text-[#4ADE80]'
                            : 'text-[#16A34A]'
                        }`}
                      >
                        {r.projectedAnomalyPct > 0 ? `+${r.projectedAnomalyPct.toFixed(1)}%` : `${r.projectedAnomalyPct.toFixed(1)}%`}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            isHigh
                              ? isDark
                                ? 'bg-[#351214] text-[#F87171] border border-[#602022]'
                                : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                              : isMod
                              ? isDark
                                ? 'bg-[#352A12] text-amber-300 border border-[#604D20]'
                                : 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                              : isDark
                              ? 'bg-[#0E2E1E] text-[#4ADE80] border border-[#1A4C32]'
                              : 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                          }`}
                        >
                          {isHigh ? 'High Risk' : isMod ? 'Moderate' : 'Low Risk'}
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
    </div>
  );
};
