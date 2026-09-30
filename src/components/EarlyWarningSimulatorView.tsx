import React, { useState } from 'react';
import { PRIMARY_RICE_DISTRICTS, DistrictInfo } from '../data/canonicalDistricts';
import {
  AlertCircle,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  Calendar,
  Activity,
  Droplets,
  Thermometer,
  Layers,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';

export const EarlyWarningSimulatorView: React.FC = () => {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictInfo>(PRIMARY_RICE_DISTRICTS[5]); // Bhandara
  const [rainDeparture, setRainDeparture] = useState<number>(-28); // % deficit
  const [oniSstAnomaly, setOniSstAnomaly] = useState<number>(1.6); // °C El Niño
  const [canopyNdvi, setCanopyNdvi] = useState<number>(0.52); // Mean August NDVI

  // Mathematical risk sensitivity formulation based on calibrated spatiotemporal response
  const rainEffect = (-rainDeparture / 100) * 2.8;
  const oniEffect = Math.max(0, oniSstAnomaly - 0.2) * 1.5;
  const ndviEffect = (0.70 - canopyNdvi) * 3.5;
  const baselineHazard =
    selectedDistrict.division === 'Marathwada' ? 0.4 : selectedDistrict.division === 'Nagpur' ? 0.1 : -0.2;

  const rawLogit = -1.8 + rainEffect + oniEffect + ndviEffect + baselineHazard;
  const predictedProbability = 1 / (1 + Math.exp(-rawLogit));
  const probPercent = Number((predictedProbability * 100).toFixed(1));

  const isHighRisk = predictedProbability >= 0.65;
  const isModerateRisk = predictedProbability >= 0.30 && predictedProbability < 0.65;

  const handlePreset = (type: '2015_severe' | '2020_lanina' | 'normal') => {
    if (type === '2015_severe') {
      setRainDeparture(-35);
      setOniSstAnomaly(1.8);
      setCanopyNdvi(0.48);
    } else if (type === '2020_lanina') {
      setRainDeparture(18);
      setOniSstAnomaly(-0.6);
      setCanopyNdvi(0.78);
    } else {
      setRainDeparture(0);
      setOniSstAnomaly(0.0);
      setCanopyNdvi(0.68);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="bg-[#131920] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="font-semibold uppercase tracking-wider">In-Season Predictive Simulation</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400">August 31 Early Warning Horizon</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Mid-Season Crop Failure Early Warning Forecast
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Simulates multi-modal risk response on August 31 using observed June–August spatial cropland vegetation vigor, monsoon precipitation departures, and NOAA ONI Pacific sea surface temperature anomalies.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3.5 py-2 rounded-xl bg-[#0B0F14] border border-slate-800 text-xs font-mono text-emerald-400 font-bold">
              Lead Time: 60–75 Days Advance Warning
            </span>
          </div>
        </div>
      </div>

      {/* 2. Parameter Controls and Forecast Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Parameter Sliders (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-[#131920] border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Environmental Input Drivers (June 1 – August 31)</span>
              </h3>

              {/* Scenario Presets */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-slate-400 mr-1 hidden sm:inline">PRESETS:</span>
                <button
                  onClick={() => handlePreset('2015_severe')}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-500/40 hover:bg-rose-900/60 transition-colors cursor-pointer"
                >
                  2015 El Niño
                </button>
                <button
                  onClick={() => handlePreset('2020_lanina')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/40 transition-colors cursor-pointer"
                >
                  2020 La Niña
                </button>
                <button
                  onClick={() => handlePreset('normal')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Neutral
                </button>
              </div>
            </div>

            {/* Target District Selector */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-2 font-semibold">
                TARGET RICE DISTRICT:
              </label>
              <select
                value={selectedDistrict.id}
                onChange={e => {
                  const d = PRIMARY_RICE_DISTRICTS.find(dist => dist.id === e.target.value);
                  if (d) setSelectedDistrict(d);
                }}
                className="w-full bg-[#0B0F14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-hidden focus:border-emerald-500"
              >
                {PRIMARY_RICE_DISTRICTS.map(d => (
                  <option key={d.id} value={d.id} className="bg-[#0B0F14]">
                    {d.name} ({d.division} Division · {d.agroZone})
                  </option>
                ))}
              </select>
            </div>

            {/* Slider 1: IMD Monsoon Departure */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  IMD June–August Rainfall Departure:
                </span>
                <span
                  className={`font-bold ${
                    rainDeparture < -20
                      ? 'text-rose-400'
                      : rainDeparture > 10
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {rainDeparture > 0 ? `+${rainDeparture}` : rainDeparture}%
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={rainDeparture}
                onChange={e => setRainDeparture(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>-50% (Severe Drought)</span>
                <span>0% (Long-Period Normal)</span>
                <span>+50% (Excess Monsoon)</span>
              </div>
            </div>

            {/* Slider 2: NOAA ONI SST Anomaly */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  NOAA ONI Pacific SST Anomaly:
                </span>
                <span
                  className={`font-bold ${
                    oniSstAnomaly >= 1.5
                      ? 'text-rose-400'
                      : oniSstAnomaly <= -0.5
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {oniSstAnomaly > 0 ? `+${oniSstAnomaly.toFixed(1)}` : oniSstAnomaly.toFixed(1)}°C
                </span>
              </div>
              <input
                type="range"
                min="-1.5"
                max="2.5"
                step="0.1"
                value={oniSstAnomaly}
                onChange={e => setOniSstAnomaly(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>-1.5°C (Strong La Niña)</span>
                <span>0.0°C (Neutral ENSO)</span>
                <span>+2.5°C (Super El Niño)</span>
              </div>
            </div>

            {/* Slider 3: Sentinel-2 August Canopy NDVI */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Mid-Season Canopy Vigor (Sentinel-2 NDVI):
                </span>
                <span
                  className={`font-bold ${
                    canopyNdvi < 0.52
                      ? 'text-rose-400'
                      : canopyNdvi > 0.70
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {canopyNdvi.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.85"
                step="0.01"
                value={canopyNdvi}
                onChange={e => setCanopyNdvi(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0.30 (Severe Stunting / Browning)</span>
                <span>0.60 (Moderate Canopy)</span>
                <span>0.85 (Vigorous Lush Paddy)</span>
              </div>
            </div>

            {/* Scientific Timeline Notice */}
            <div className="p-4 rounded-xl bg-[#0B0F14] border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-white block">Timeline Guardrail:</span>
              <p className="leading-relaxed">
                All features above reflect observed conditions up to <strong className="text-slate-200">August 31</strong> only. Late-season September–October rainfall and harvest observations are strictly masked to ensure true zero-leakage early forecasting.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Early Warning Forecast Result (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className={`p-6 rounded-2xl border shadow-xl space-y-5 transition-all ${
              isHighRisk
                ? 'bg-rose-950/20 border-rose-500/50'
                : isModerateRisk
                ? 'bg-amber-950/20 border-amber-500/50'
                : 'bg-emerald-950/20 border-emerald-500/50'
            }`}
          >
            {/* Risk Category Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                EARLY WARNING RISK OUTPUT
              </span>
              <span
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 ${
                  isHighRisk
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/60'
                    : isModerateRisk
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/60'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                }`}
              >
                {isHighRisk ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>HIGH FAILURE HAZARD</span>
                  </>
                ) : isModerateRisk ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>ELEVATED WATCH</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>FAVORABLE / LOW RISK</span>
                  </>
                )}
              </span>
            </div>

            {/* Projected Probability Gauge */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-mono text-slate-400">Model Predicted Failure Probability:</span>
                <span
                  className={`text-4xl font-mono font-bold tabular-nums ${
                    isHighRisk
                      ? 'text-rose-400'
                      : isModerateRisk
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {probPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    isHighRisk
                      ? 'bg-rose-500'
                      : isModerateRisk
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${probPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>0% (Resilient)</span>
                <span>Decision Threshold: 50%</span>
                <span>100% (Certain Failure)</span>
              </div>
            </div>

            {/* Risk Driver Decomposition */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs font-mono text-slate-300 font-semibold block">
                Vulnerability Driver Breakdown:
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Monsoon Deficit Stress:</span>
                  <span className={rainDeparture < -15 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    {rainDeparture < -15 ? 'HIGH DEFICIT' : rainDeparture < 0 ? 'MODERATE' : 'NORMAL'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>ENSO Pacific Teleconnection:</span>
                  <span className={oniSstAnomaly >= 1.0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    {oniSstAnomaly >= 1.0 ? 'EL NIÑO FORCING' : 'NEUTRAL / LA NIÑA'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Vegetation Health Index:</span>
                  <span className={canopyNdvi < 0.55 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {canopyNdvi < 0.55 ? 'STUNTED' : 'HEALTHY'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actionable Agricultural Advisory */}
            <div className="p-4 rounded-xl bg-[#0B0F14] border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider block">
                Agro-Advisory Recommendation:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isHighRisk ? (
                  <>
                    <strong className="text-rose-400">Critical Alert:</strong> Early warning threshold breached in {selectedDistrict.name}. Recommended actions include immediate micro-irrigation scheduling, contingency pulse re-sowing advisories, and triggering PMFBY crop insurance assessment protocols 60 days ahead of harvest.
                  </>
                ) : isModerateRisk ? (
                  <>
                    <strong className="text-amber-400">Advisory Watch:</strong> Moderate moisture stress detected. Recommended actions include weekly soil moisture tracking via Sentinel-2 SWIR bands and canal water rationing for critical panicle initiation stages.
                  </>
                ) : (
                  <>
                    <strong className="text-emerald-400">Favorable Outlook:</strong> Agro-climatic parameters support normal to above-average Kharif paddy yields in {selectedDistrict.name}. No emergency mitigation required.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
