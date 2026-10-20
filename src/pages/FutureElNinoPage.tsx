import React, { useState, useMemo } from 'react';
import {
  PRESET_SCENARIOS,
  FutureElNinoScenario,
  DistrictFuturePrediction,
  predictFutureElNinoSeason,
} from '../data/futureElNinoForecast';
import {
  Compass,
  AlertTriangle,
  Sliders,
  CloudRain,
  Thermometer,
  Layers,
  Sprout,
  ShieldAlert,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export const FutureElNinoPage: React.FC = () => {
  const { selectedDistrictId, setSelectedDistrictId } = useDashboard();

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
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#E8EFEB]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#14261F]/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Future El Niño Scenario Simulation & Feasibility Audit
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2A230A] text-[#EAB308] border border-[#594715]">
              Prospective Modeling
            </span>
          </div>
          <p className="text-xs text-[#80978E] mt-0.5 font-medium">
            Evaluate district failure vulnerability under hypothetical Pacific SST anomalies and monsoon rainfall deficit scenarios
          </p>
        </div>
      </div>

      {/* Scientific Feasibility Card */}
      <div className="rounded-2xl bg-[#091410] border border-[#14261F] p-4 sm:p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1C2412] border border-[#3A4E20] flex items-center justify-center text-[#EAB308] shrink-0">
            <Compass className="w-5 h-5 text-[#EAB308]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Physical Prerequisites for In-Season Deployment
            </h3>
            <p className="text-xs text-[#A4B8AF] mt-0.5 leading-relaxed">
              Genuine spatiotemporal forecasting requires observed Sentinel-2 L2A surface reflectance arrays and gridded IMD rainfall records. The simulator below evaluates sensitivity using physics-informed empirical response surfaces calibrated to historical ENSO shocks.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase text-[#7A9187]">
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
                    ? 'bg-[#122A1E] border-[#22C55E] shadow-xs'
                    : 'bg-[#091410] border-[#14261F] hover:border-[#1E3A2F]'
                }`}
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs font-bold text-white">{sc.name}</span>
                  <span className="text-[10px] text-[#22C55E]">
                    {sc.oniSstAnomaly > 0 ? `+${sc.oniSstAnomaly}` : sc.oniSstAnomaly}°C
                  </span>
                </div>
                <p className="text-[11px] text-[#80978E] mt-1 leading-snug line-clamp-2">
                  {sc.description}
                </p>
                <div className="flex justify-between text-[10px] font-mono text-[#7A9187] mt-2 pt-1.5 border-t border-[#14261F]/60">
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
        <div className="lg:col-span-4 rounded-2xl bg-[#091410] border border-[#14261F] p-4 sm:p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-[#14261F]">
            <Sliders className="w-4 h-4 text-[#22C55E]" />
            <h3 className="text-sm font-bold text-white">Scenario Parameters</h3>
          </div>

          {/* Slider 1: ONI SST */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#A4B8AF]">Niño 3.4 SST Anomaly:</span>
              <span className="text-white font-bold">{oniAnomaly > 0 ? `+${oniAnomaly.toFixed(1)}` : oniAnomaly.toFixed(1)}°C</span>
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
            <div className="flex justify-between text-[9px] font-mono text-[#5C7267]">
              <span>-1.5°C (La Niña)</span>
              <span>+2.5°C (Super El Niño)</span>
            </div>
          </div>

          {/* Slider 2: Rainfall Departure */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#A4B8AF]">Rainfall Departure %:</span>
              <span className="text-white font-bold">{rainfallDeparture > 0 ? `+${rainfallDeparture}` : rainfallDeparture}%</span>
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
            <div className="flex justify-between text-[9px] font-mono text-[#5C7267]">
              <span>-40% (Severe Deficit)</span>
              <span>+30% (Excess Monsoon)</span>
            </div>
          </div>

          {/* Slider 3: Canopy NDVI */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#A4B8AF]">Mean Mid-Season NDVI:</span>
              <span className="text-white font-bold">{canopyNdvi.toFixed(2)}</span>
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
            <div className="flex justify-between text-[9px] font-mono text-[#5C7267]">
              <span>0.30 (Stressed)</span>
              <span>0.85 (Vigorous Canopy)</span>
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 rounded-xl bg-[#060D0A] border border-[#14261F] text-xs font-mono space-y-1.5">
            <div className="flex justify-between text-[#7A9187]">
              <span>High Risk Districts:</span>
              <span className="text-[#EF4444] font-bold">{highRiskCount}</span>
            </div>
            <div className="flex justify-between text-[#7A9187]">
              <span>Moderate Watch:</span>
              <span className="text-amber-400 font-bold">{modRiskCount}</span>
            </div>
            <div className="flex justify-between text-[#7A9187]">
              <span>Low Risk:</span>
              <span className="text-[#22C55E] font-bold">{lowRiskCount}</span>
            </div>
          </div>
        </div>

        {/* District Projected Risks Table (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-[#091410] border border-[#14261F] p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#14261F]">
            <h3 className="text-sm font-bold text-white">District Failure Risk Projections</h3>
            <span className="text-[10px] font-mono text-[#7A9187]">24 Rice Districts</span>
          </div>

          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#060D0A] text-[#7A9187] sticky top-0 border-b border-[#14261F]">
                <tr>
                  <th className="py-2.5 px-3 font-sans font-semibold">District</th>
                  <th className="py-2.5 px-2 text-right">Failure Prob.</th>
                  <th className="py-2.5 px-2 text-right">Projected Yield</th>
                  <th className="py-2.5 px-2 text-right">Anomaly %</th>
                  <th className="py-2.5 px-3 text-center">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14261F]">
                {simulationResults.map(r => {
                  const isSelected = selectedDistrictId === r.districtId;
                  const isHigh = r.riskCategory === 'High Failure Probability';
                  const isMod = r.riskCategory === 'Moderate Watch';

                  return (
                    <tr
                      key={r.districtId}
                      onClick={() => setSelectedDistrictId(r.districtId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#0E281F] text-white' : 'hover:bg-[#0B1A14]/40'
                      }`}
                    >
                      <td className="py-2 px-3 font-sans font-medium text-white">{r.districtName}</td>
                      <td className="py-2 px-2 text-right tabular-nums font-bold">
                        {(r.failureProbability * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">
                        {r.projectedYieldTonnesHa.toFixed(2)} t/ha
                      </td>
                      <td
                        className={`py-2 px-2 text-right tabular-nums font-bold ${
                          r.projectedAnomalyPct < -10 ? 'text-[#EF4444]' : 'text-[#22C55E]'
                        }`}
                      >
                        {r.projectedAnomalyPct > 0 ? `+${r.projectedAnomalyPct.toFixed(1)}%` : `${r.projectedAnomalyPct.toFixed(1)}%`}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            isHigh
                              ? 'bg-[#2E1212] text-[#EF4444] border border-[#591C1C]'
                              : isMod
                              ? 'bg-amber-950/40 text-amber-400 border border-amber-600/30'
                              : 'bg-[#0E281F] text-[#22C55E] border border-[#1B4B38]'
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
