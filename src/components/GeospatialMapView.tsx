import React, { useState } from 'react';
import {
  MAHARASHTRA_DISTRICTS,
  PRIMARY_RICE_DISTRICTS,
  resolveCanonicalDistrict,
} from '../data/canonicalDistricts';
import {
  ALL_YEAR_METRICS,
  getRainfallColor,
  getYieldColor,
} from '../data/maharashtraMapData';
import {
  MAHARASHTRA_GEOJSON_POLYGONS,
  MAHARASHTRA_GEOJSON_VIEWBOX,
} from '../data/maharashtraGeoJsonData';
import { NOAA_CPC_ONI_RECORDS } from '../data/oniElNinoData';
import {
  predictFutureElNinoSeason,
  PRESET_SCENARIOS,
  FutureElNinoScenario,
} from '../data/futureElNinoForecast';
import {
  Search,
  MapPin,
  Layers,
  CloudRain,
  Sprout,
  ShieldAlert,
  Calendar,
  Activity,
  TrendingDown,
  TrendingUp,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Info,
  Sliders,
  Sparkles,
} from 'lucide-react';

type HistoricalMapLayer = 'status' | 'rainfall' | 'yield';

export const GeospatialMapView: React.FC = () => {
  // Mode: historical ground truth vs future model prediction
  const [isFutureMode, setIsFutureMode] = useState<boolean>(false);

  // Historical controls
  const [selectedYear, setSelectedYear] = useState<number>(2015);
  const [historicalLayer, setHistoricalLayer] = useState<HistoricalMapLayer>('status');

  // Future mode controls
  const [activeScenarioId, setActiveScenarioId] = useState<string>('strong_elnino');
  const [futureOni, setFutureOni] = useState<number>(2.0);
  const [futureRainDeficit, setFutureRainDeficit] = useState<number>(-30);
  const [futureNdvi, setFutureNdvi] = useState<number>(0.46);

  // Selection & UI state
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('bhandara');
  const [hoveredDistrictId, setHoveredDistrictId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const availableYears = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];
  const yearStr = `${selectedYear}-${String(selectedYear + 1).slice(-2)}`;
  const oniInfo = NOAA_CPC_ONI_RECORDS.find(r => r.year === selectedYear);

  // Historical metrics
  const currentYearMetrics = ALL_YEAR_METRICS[selectedYear] || {};
  const selectedDistrictInfo =
    MAHARASHTRA_DISTRICTS.find(d => d.id === selectedDistrictId) || PRIMARY_RICE_DISTRICTS[0];
  const selectedDistrictHistoricalMetric = currentYearMetrics[selectedDistrictId];

  // Future model predictions
  const futurePredictions = predictFutureElNinoSeason({
    oniSstAnomaly: futureOni,
    rainfallDeparturePct: futureRainDeficit,
    canopyNdvi: futureNdvi,
  });
  const selectedDistrictFuturePrediction = futurePredictions[selectedDistrictId];

  // Active hover/selection
  const activeDistrictId = hoveredDistrictId || selectedDistrictId;
  const activeDistrictInfo =
    MAHARASHTRA_DISTRICTS.find(d => d.id === activeDistrictId) || selectedDistrictInfo;
  const activeHistoricalMetric = currentYearMetrics[activeDistrictId];
  const activeFutureMetric = futurePredictions[activeDistrictId];

  const divisions = ['all', 'Konkan', 'Nashik', 'Pune', 'Marathwada', 'Amravati', 'Nagpur'];

  // Filtered districts
  const filteredDistricts = MAHARASHTRA_DISTRICTS.filter(d => {
    if (divisionFilter !== 'all' && d.division !== divisionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return d.name.toLowerCase().includes(q) || d.aliases.some(a => a.toLowerCase().includes(q));
    }
    return true;
  });

  // STRICT STATISTICAL CONSISTENCY: All modeled metrics evaluate over the 24 PRIMARY_RICE_DISTRICTS
  const totalModeledDistricts = PRIMARY_RICE_DISTRICTS.length; // strictly 24
  const historicalFailureCount = PRIMARY_RICE_DISTRICTS.filter(
    d => currentYearMetrics[d.id]?.failureEvent === 1
  ).length;
  const futureFailureCount = PRIMARY_RICE_DISTRICTS.filter(
    d => futurePredictions[d.id]?.isFailure
  ).length;

  const validHistoricalRiceMetrics = PRIMARY_RICE_DISTRICTS.map(d => currentYearMetrics[d.id]).filter(Boolean);
  const avgHistoricalRainfall = Math.round(
    validHistoricalRiceMetrics.reduce((acc, m) => acc + m.rainfallMm, 0) / (validHistoricalRiceMetrics.length || 1)
  );

  const handleApplyPreset = (scenario: FutureElNinoScenario) => {
    setActiveScenarioId(scenario.id);
    setFutureOni(scenario.oniSstAnomaly);
    setFutureRainDeficit(scenario.rainfallDeparturePct);
    setFutureNdvi(scenario.canopyNdvi);
  };

  // Polygon fill color computation - cleanly separating truth from probability
  const getDistrictFill = (distId: string): string => {
    if (isFutureMode) {
      const pred = futurePredictions[distId];
      if (!pred || !pred.isRiceProducer) return '#161D24';
      if (pred.failureProbability >= 0.65) return '#DC2626'; // High Failure Probability
      if (pred.failureProbability >= 0.35) return '#D97706'; // Moderate Watch
      return '#15803D'; // Low Failure Probability
    }

    // Historical mode
    const metric = currentYearMetrics[distId];
    if (!metric || !metric.isRiceProducer) return '#161D24';

    if (historicalLayer === 'rainfall') {
      return getRainfallColor(metric.rainfallMm);
    } else if (historicalLayer === 'yield') {
      return getYieldColor(metric.yieldTonnesHa);
    } else {
      // Observed Ground-Truth Status
      return metric.failureEvent === 1 ? '#DC2626' : '#15803D';
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.3, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.3, 1));
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleDownloadCsv = () => {
    if (isFutureMode) {
      const headers = [
        'district_id',
        'district_name',
        'division',
        'input_oni_sst_anomaly_c',
        'input_rain_departure_pct',
        'input_canopy_ndvi',
        'model_predicted_failure_probability',
        'model_predicted_failure_flag',
        'projected_yield_t_ha',
        'baseline_yield_t_ha',
      ];
      const rows = PRIMARY_RICE_DISTRICTS.map(d => {
        const p = futurePredictions[d.id];
        return [
          p.districtId,
          p.districtName,
          p.division,
          futureOni,
          futureRainDeficit,
          futureNdvi,
          p.failureProbability,
          p.isFailure ? 1 : 0,
          p.projectedYieldTonnesHa,
          p.baselineYieldTonnesHa,
        ];
      });
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `future_elnino_forecast_oni_${futureOni}C.csv`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const headers = [
      'district_id',
      'district_name',
      'division',
      'crop_year',
      'imd_rainfall_mm',
      'des_actual_yield_t_ha',
      'baseline_yield_t_ha',
      'yield_anomaly_pct',
      'des_observed_failure_status',
    ];
    const rows = PRIMARY_RICE_DISTRICTS.map(d => {
      const m = currentYearMetrics[d.id];
      return [
        m.districtId,
        m.districtName,
        m.division,
        m.cropYearStr,
        m.rainfallMm,
        m.yieldTonnesHa,
        m.baselineYieldTonnesHa,
        m.yieldAnomalyPct,
        m.failureEvent,
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `des_observed_crop_records_${yearStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 w-full overflow-hidden">
      {/* 1. Header Banner */}
      <div className="bg-[#131920] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="font-semibold uppercase tracking-wider">Maharashtra Kharif Rice Framework</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400">
                {isFutureMode ? 'Model Inference Mode' : 'DES Ground-Truth Inspection'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {isFutureMode
                ? 'Future El Niño Season: Crop-Failure Probability Forecast'
                : 'Observed Crop-Failure Status & Climate Records'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {isFutureMode
                ? 'Predicting district-level crop-failure probability by feeding climate inputs (NOAA ONI + IMD rainfall anomaly) and Sentinel-2 canopy vigor into the trained CNN-LSTM model.'
                : 'Historical ground truth from the Directorate of Economics and Statistics (DES) and IMD 0.25° gridded rainfall for Maharashtra Kharif rice seasons (2015–2022).'}
            </p>
          </div>

          {/* Mode Switcher Toggle: Historical vs Future */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-[#0B0F14] p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setIsFutureMode(false)}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
                  !isFutureMode
                    ? 'bg-slate-800 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Historical DES (2015–2022)
              </button>
              <button
                onClick={() => setIsFutureMode(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer ${
                  isFutureMode
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                    : 'text-emerald-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Future El Niño Mode</span>
              </button>
            </div>

            <button
              onClick={handleDownloadCsv}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer shadow-xs"
              title="Download District Data CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Dynamic Secondary Control Bar */}
        {!isFutureMode ? (
          /* Historical Year Selector */
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mr-1 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                KHARIF YEAR:
              </span>
              <div className="flex items-center gap-1 bg-[#0B0F14] p-1 rounded-xl border border-slate-800 flex-wrap">
                {availableYears.map(yr => {
                  const isSelected = yr === selectedYear;
                  return (
                    <button
                      key={yr}
                      onClick={() => setSelectedYear(yr)}
                      className={`px-3 py-1 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            </div>

            {oniInfo && (
              <div className="flex items-center gap-2 text-xs font-mono bg-[#0B0F14] px-3.5 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">NOAA ONI:</span>
                <span
                  className={`font-semibold ${
                    oniInfo.elNinoIndicator === 1
                      ? 'text-rose-400'
                      : oniInfo.ensoPhase.includes('La Niña')
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {oniInfo.ensoPhase} ({oniInfo.meanEarlyWarningSstAnomaly > 0 ? '+' : ''}
                  {oniInfo.meanEarlyWarningSstAnomaly.toFixed(2)}°C)
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Future Mode Controls */
          <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" />
                  PRESET SCENARIOS:
                </span>
                <div className="flex items-center gap-1.5 bg-[#0B0F14] p-1 rounded-xl border border-slate-800 flex-wrap">
                  {PRESET_SCENARIOS.map(preset => {
                    const isSelected = preset.id === activeScenarioId;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleApplyPreset(preset)}
                        className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {preset.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <span className="text-xs font-mono text-slate-400">
                Model Inputs: ONI + Rainfall Departure + Sentinel-2 NDVI
              </span>
            </div>

            {/* Parameter adjustment sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#0B0F14] border border-slate-800">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">NOAA ONI SST Anomaly:</span>
                  <span className="text-amber-400 font-bold">+{futureOni.toFixed(1)}°C</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.5"
                  step="0.1"
                  value={futureOni}
                  onChange={e => {
                    setFutureOni(Number(e.target.value));
                    setActiveScenarioId('custom');
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Monsoon Rainfall Deficit:</span>
                  <span className={futureRainDeficit < -15 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    {futureRainDeficit}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="20"
                  step="1"
                  value={futureRainDeficit}
                  onChange={e => {
                    setFutureRainDeficit(Number(e.target.value));
                    setActiveScenarioId('custom');
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Sentinel-2 Canopy NDVI:</span>
                  <span className="text-emerald-400 font-bold">{futureNdvi.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.35"
                  max="0.80"
                  step="0.01"
                  value={futureNdvi}
                  onChange={e => {
                    setFutureNdvi(Number(e.target.value));
                    setActiveScenarioId('custom');
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Statistical Metric Cards - Consistent 24-District Counts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between uppercase">
            <span>{isFutureMode ? 'Predicted Failure Count' : 'Observed Failure Count'}</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-rose-400 tabular-nums">
              {isFutureMode ? futureFailureCount : historicalFailureCount} / {totalModeledDistricts}
            </span>
            <span className="text-xs text-slate-500 font-mono">rice districts</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isFutureMode ? 'Districts with failure probability ≥ 50%' : 'DES actual yield deficit < -10%'}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between uppercase">
            <span>Forecast Lead Time</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tabular-nums">
              60–75 Days
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">August 31 evaluation before Oct harvest</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between uppercase">
            <span>Monsoon Precipitation</span>
            <CloudRain className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
              {isFutureMode ? `${futureRainDeficit > 0 ? '+' : ''}${futureRainDeficit}%` : `${avgHistoricalRainfall} mm`}
            </span>
            <span className="text-xs text-slate-500 font-mono">{isFutureMode ? 'departure' : 'seasonal avg'}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">IMD 0.25° gridded rainfall</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between uppercase">
            <span>Modeled Rice Districts</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
              24
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 36 in state</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Konkan and eastern Vidarbha paddy belts</p>
        </div>
      </div>

      {/* 3. The Geospatial Map Stage & Telemetry Panel */}
      <div className="bg-[#131920] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        {/* Layer Controls & Quick Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          {!isFutureMode ? (
            <div className="flex items-center gap-1.5 overflow-x-auto bg-[#0B0F14] p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setHistoricalLayer('status')}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  historicalLayer === 'status'
                    ? 'bg-rose-950/80 border border-rose-500/60 text-rose-200 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Observed Failure Status</span>
              </button>

              <button
                onClick={() => setHistoricalLayer('rainfall')}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  historicalLayer === 'rainfall'
                    ? 'bg-sky-950/80 border border-sky-500/60 text-sky-200 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                <span>IMD Rainfall</span>
              </button>

              <button
                onClick={() => setHistoricalLayer('yield')}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  historicalLayer === 'yield'
                    ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                <span>DES Rice Yield (t/ha)</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">MODEL PREDICTION: Crop-Failure Probability P &isin; [0, 1]</span>
            </div>
          )}

          {/* Quick District Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                const res = resolveCanonicalDistrict(e.target.value);
                if (res) setSelectedDistrictId(res.id);
              }}
              placeholder="Search district..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#0B0F14] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Map & Telemetry Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Authentic GeoJSON Map Canvas (7 cols) */}
          <div className="lg:col-span-7 space-y-3 w-full overflow-hidden">
            <div className="bg-[#0B0F14] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-inner w-full">
              {/* Cartographic Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-2 border-b border-slate-800 text-xs font-mono gap-2">
                <div className="font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {isFutureMode
                      ? `Predicted Failure Probability Map — El Niño (+${futureOni.toFixed(1)}°C)`
                      : historicalLayer === 'status'
                      ? `DES Observed Failure Status — Kharif ${yearStr}`
                      : historicalLayer === 'rainfall'
                      ? `IMD Kharif Rainfall (mm) — ${yearStr}`
                      : `DES Kharif Rice Yield (t/ha) — ${yearStr}`}
                  </span>
                </div>

                {/* DISTINCT LEGENDS: Never mix yield deficit with probability on same legend */}
                <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
                  {isFutureMode ? (
                    /* Probability Legend */
                    <div className="flex items-center gap-3 text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]"></span>
                        <span className="text-slate-300">P &lt; 0.35</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span>
                        <span className="text-amber-400">0.35 &le; P &lt; 0.65</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span>
                        <span className="text-rose-400 font-semibold">P &ge; 0.65</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#161D24]"></span>
                        <span className="text-slate-500">Non-Rice</span>
                      </div>
                    </div>
                  ) : (
                    /* Observed Status Legend */
                    <div className="flex items-center gap-3 text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]"></span>
                        <span className="text-slate-300">Resilient (&ge; -10%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span>
                        <span className="text-rose-400 font-semibold">Failure (&lt; -10%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#161D24]"></span>
                        <span className="text-slate-500">Non-Rice</span>
                      </div>
                    </div>
                  )}

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 ml-1">
                    <button
                      onClick={handleZoomIn}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleZoomOut}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    {zoomLevel !== 1 && (
                      <button
                        onClick={handleResetView}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Reset View"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Vector SVG Map using Real GeoJSON Boundaries */}
              <div className="w-full relative flex items-center justify-center py-2 px-1 overflow-hidden min-h-[380px] sm:min-h-[460px]">
                <svg
                  viewBox={MAHARASHTRA_GEOJSON_VIEWBOX}
                  preserveAspectRatio="xMidYMid meet"
                  className="w-full h-auto max-h-[500px] transition-transform duration-200 select-none"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                    transformOrigin: 'center center',
                  }}
                >
                  <defs>
                    <filter id="glow-selected" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  <g>
                    {MAHARASHTRA_GEOJSON_POLYGONS.map(poly => {
                      const isSelected = selectedDistrictId === poly.id;
                      const isHovered = hoveredDistrictId === poly.id;
                      const fillColor = getDistrictFill(poly.id);

                      return (
                        <g
                          key={poly.id}
                          className="cursor-pointer transition-all duration-150"
                          onClick={() => setSelectedDistrictId(poly.id)}
                          onMouseEnter={() => setHoveredDistrictId(poly.id)}
                          onMouseLeave={() => setHoveredDistrictId(null)}
                        >
                          <path
                            d={poly.path}
                            fill={fillColor}
                            stroke={isSelected ? '#38BDF8' : isHovered ? '#34D399' : '#334155'}
                            strokeWidth={isSelected ? 2.8 : isHovered ? 1.8 : 0.8}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            filter={isSelected ? 'url(#glow-selected)' : undefined}
                            className="transition-colors"
                          />

                          {/* District Label at Projected GeoJSON Center */}
                          <text
                            x={poly.center[0]}
                            y={poly.center[1]}
                            fill={isSelected ? '#38BDF8' : '#F8FAFC'}
                            fontSize={isSelected ? '10' : '9'}
                            fontWeight={isSelected ? '700' : '600'}
                            fontFamily="JetBrains Mono, monospace"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            pointerEvents="none"
                            style={{
                              textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 2px #000',
                            }}
                          >
                            {poly.name}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Floating Telemetry Tooltip on Hover */}
                {activeDistrictInfo && (
                  <div className="absolute bottom-3 left-3 bg-[#131920]/95 backdrop-blur border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono shadow-xl pointer-events-none z-20 max-w-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-white text-sm">{activeDistrictInfo.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          isFutureMode
                            ? activeFutureMetric?.isFailure
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                            : activeHistoricalMetric?.failureEvent === 1
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                        }`}
                      >
                        {isFutureMode
                          ? activeFutureMetric?.riskCategory
                          : activeHistoricalMetric?.failureEvent === 1
                          ? 'OBSERVED FAILURE'
                          : activeDistrictInfo.isRiceProducer
                          ? 'OBSERVED RESILIENT'
                          : 'NON-RICE'}
                      </span>
                    </div>
                    <div className="mt-1.5 text-[11px] text-slate-300 flex items-center gap-3">
                      {isFutureMode ? (
                        <>
                          <span>
                            Failure Prob: <strong className={activeFutureMetric?.isFailure ? 'text-rose-400' : 'text-emerald-400'}>{(activeFutureMetric?.failureProbability ? (activeFutureMetric.failureProbability * 100).toFixed(1) : 0)}%</strong>
                          </span>
                        </>
                      ) : (
                        <>
                          <span>DES Yield: <strong className="text-white">{activeHistoricalMetric?.yieldTonnesHa} t/ha</strong></span>
                          <span>IMD Rain: <strong className="text-sky-300">{activeHistoricalMetric?.rainfallMm} mm</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Subtitle helper */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-3 border-t border-slate-800">
                <span>Vector survey boundaries from Maharashtra.Districts.geojson</span>
                <span className="text-emerald-400">24 Modeled Paddy Districts</span>
              </div>
            </div>
          </div>

          {/* Right Telemetry & ML Prediction Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4 w-full">
            <div className="bg-[#0B0F14] border border-slate-800 rounded-2xl p-5 space-y-5 shadow-inner">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                    {isFutureMode ? 'MODEL-PREDICTED PROBABILITY' : 'HISTORICAL OBSERVED STATUS (DES)'}
                  </span>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{selectedDistrictInfo.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedDistrictInfo.division} Division · {selectedDistrictInfo.agroZone}
                  </p>
                </div>

                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 ${
                    isFutureMode
                      ? selectedDistrictFuturePrediction?.isFailure
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/60 shadow-sm'
                        : selectedDistrictInfo.isRiceProducer
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-sm'
                        : 'bg-slate-800 text-slate-400'
                      : selectedDistrictHistoricalMetric && selectedDistrictHistoricalMetric.failureEvent === 1
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/60 shadow-sm'
                      : selectedDistrictInfo.isRiceProducer
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-sm'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isFutureMode
                    ? selectedDistrictFuturePrediction?.riskCategory
                    : selectedDistrictHistoricalMetric && selectedDistrictHistoricalMetric.failureEvent === 1
                    ? 'OBSERVED FAILURE'
                    : selectedDistrictInfo.isRiceProducer
                    ? 'OBSERVED RESILIENT'
                    : 'NON-RICE'}
                </span>
              </div>

              {/* Core Telemetry Cards */}
              {selectedDistrictInfo.isRiceProducer ? (
                <div className="space-y-4">
                  {isFutureMode ? (
                    /* Future Model Prediction Metrics */
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-[#131920] border border-slate-800 space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-mono text-slate-400">Crop-Failure Probability:</span>
                          <span
                            className={`text-3xl font-mono font-bold tabular-nums ${
                              selectedDistrictFuturePrediction.failureProbability >= 0.50
                                ? 'text-rose-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {(selectedDistrictFuturePrediction.failureProbability * 100).toFixed(1)}%
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-300 ${
                              selectedDistrictFuturePrediction.failureProbability >= 0.50
                                ? 'bg-rose-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${selectedDistrictFuturePrediction.failureProbability * 100}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-slate-500">
                          <span>0% Resilient</span>
                          <span>Classification Threshold: 50%</span>
                          <span>100% Failure</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-[#131920] border border-slate-800">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Projected Yield</span>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-xl font-bold font-mono text-white">
                              {selectedDistrictFuturePrediction.projectedYieldTonnesHa}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">t/ha</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#131920] border border-slate-800">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Baseline Yield</span>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-xl font-bold font-mono text-slate-300">
                              {selectedDistrictFuturePrediction.baselineYieldTonnesHa}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">t/ha</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#131920] border border-slate-800">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Projected Departure</span>
                          <div className="mt-1 flex items-center gap-1.5">
                            {selectedDistrictFuturePrediction.projectedAnomalyPct < -10 ? (
                              <TrendingDown className="w-4 h-4 text-rose-400" />
                            ) : (
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                            )}
                            <span
                              className={`text-xl font-bold font-mono ${
                                selectedDistrictFuturePrediction.projectedAnomalyPct < -10
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {selectedDistrictFuturePrediction.projectedAnomalyPct}%
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#131920] border border-slate-800">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Input ONI</span>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-xl font-bold font-mono text-amber-400">
                              +{futureOni.toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">°C</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Historical Metrics */
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-[#131920] border border-slate-800">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Actual DES Yield</span>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-xl font-bold font-mono text-white">
                              {selectedDistrictHistoricalMetric?.yieldTonnesHa}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">t/ha</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#131920] border border-slate-800">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Prior Baseline</span>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-xl font-bold font-mono text-slate-300">
                              {selectedDistrictHistoricalMetric?.baselineYieldTonnesHa}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">t/ha</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#131920] border border-slate-800">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Actual Departure</span>
                          <div className="mt-1 flex items-center gap-1.5">
                            {selectedDistrictHistoricalMetric && selectedDistrictHistoricalMetric.yieldAnomalyPct < -10 ? (
                              <TrendingDown className="w-4 h-4 text-rose-400" />
                            ) : (
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                            )}
                            <span
                              className={`text-xl font-bold font-mono ${
                                selectedDistrictHistoricalMetric && selectedDistrictHistoricalMetric.yieldAnomalyPct < -10
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {selectedDistrictHistoricalMetric && selectedDistrictHistoricalMetric.yieldAnomalyPct > 0
                                ? `+${selectedDistrictHistoricalMetric.yieldAnomalyPct}`
                                : selectedDistrictHistoricalMetric?.yieldAnomalyPct}
                              %
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#131920] border border-slate-800">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">IMD Rainfall</span>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-xl font-bold font-mono text-sky-300">
                              {selectedDistrictHistoricalMetric?.rainfallMm}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">mm</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cropland Area Details */}
                  <div className="p-3.5 rounded-xl bg-[#131920] border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                      <span>Kharif Rice Cropland Area:</span>
                      <span className="text-white font-semibold">
                        {selectedDistrictInfo.normalKharifAreaHa.toLocaleString()} ha
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Sampled via <strong className="text-slate-200">ESA WorldCover 10m Class 40 (Cropland purity &ge; 70%)</strong> in {selectedDistrictInfo.name}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-[#131920] border border-slate-800 text-slate-400 text-xs leading-relaxed space-y-2">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold">
                    <Info className="w-4 h-4 text-emerald-400" />
                    <span>Non-Paddy Production Zone</span>
                  </div>
                  <p>
                    {selectedDistrictInfo.name} is predominantly non-rice (cotton, soybean, or sugarcane). The spatiotemporal rice failure model specifically targets the 24 primary rice-growing districts of Maharashtra.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Maharashtra District Directory */}
      <div className="bg-[#131920] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Maharashtra District Directory ({filteredDistricts.length} Districts)
            </h3>
          </div>

          {/* Division Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto bg-[#0B0F14] p-1 rounded-xl border border-slate-800">
            {divisions.map(div => (
              <button
                key={div}
                onClick={() => setDivisionFilter(div)}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg capitalize transition-colors cursor-pointer ${
                  divisionFilter === div
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {div}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {filteredDistricts.map(district => {
            const isSelected = selectedDistrictId === district.id;
            const histMetric = currentYearMetrics[district.id];
            const futureMetric = futurePredictions[district.id];
            const isFail = isFutureMode
              ? futureMetric && futureMetric.isFailure
              : histMetric && histMetric.failureEvent === 1;

            return (
              <button
                key={district.id}
                onClick={() => setSelectedDistrictId(district.id)}
                className={`p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md'
                    : district.isRiceProducer
                    ? isFail
                      ? 'bg-rose-950/25 border-rose-500/40 hover:border-rose-400 text-rose-200'
                      : 'bg-[#0B0F14] border-slate-800 hover:border-slate-700 text-slate-200'
                    : 'bg-[#0B0F14]/50 border-slate-800/60 text-slate-500 hover:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold truncate">{district.name}</span>
                  {district.isRiceProducer && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isSelected ? 'bg-slate-950' : isFail ? 'bg-rose-400' : 'bg-emerald-400'
                      }`}
                    ></span>
                  )}
                </div>
                <div
                  className={`text-[10px] font-mono mt-0.5 ${
                    isSelected ? 'text-slate-900/80' : 'text-slate-500'
                  }`}
                >
                  {isFutureMode && district.isRiceProducer && futureMetric
                    ? `P: ${(futureMetric.failureProbability * 100).toFixed(0)}%`
                    : district.division}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
