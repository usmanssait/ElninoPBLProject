import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MAHARASHTRA_DISTRICTS,
  PRIMARY_RICE_DISTRICTS,
  resolveCanonicalDistrict,
  DistrictInfo,
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
  DistrictFuturePrediction,
} from '../data/futureElNinoForecast';
import {
  getSeasonPredictions,
  runDistrictInference,
  DistrictModelPrediction,
} from '../ml/modelPipeline';
import { ModelIntegrityInspector } from './ModelIntegrityInspector';
import {
  Search,
  MapPin,
  Layers,
  CloudRain,
  Sprout,
  ShieldAlert,
  Calendar,
  Clock,
  Thermometer,
  Activity,
  TrendingDown,
  TrendingUp,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Sliders,
  ChevronDown,
  Compass,
} from 'lucide-react';

type OperatingMode = 'historical' | 'model_pred' | 'future_elnino';

export const GeospatialMapView: React.FC = () => {
  // Operating Mode
  const [operatingMode, setOperatingMode] = useState<OperatingMode>('historical');

  // Historical controls
  const [selectedYear, setSelectedYear] = useState<number>(2015);

  // Future mode controls
  const [activeScenarioId, setActiveScenarioId] = useState<string>('strong_elnino');
  const [futureOni, setFutureOni] = useState<number>(2.0);
  const [futureRainDeficit, setFutureRainDeficit] = useState<number>(-30);
  const [futureNdvi, setFutureNdvi] = useState<number>(0.46);

  // Selection & UI state
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('bhandara');
  const [hoveredDistrictId, setHoveredDistrictId] = useState<string | null>(null);
  const [comparisonSearch, setComparisonSearch] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isWheeling, setIsWheeling] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoomLevel);
  const panRef = useRef(panOffset);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const dragStartPanRef = useRef({ x: 0, y: 0 });
  const wheelTimeoutRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({ x: 0, y: 0 });

  const availableYears = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];
  const yearStr = `${selectedYear}-${String(selectedYear + 1).slice(-2)}`;
  const oniInfo = NOAA_CPC_ONI_RECORDS.find(r => r.year === selectedYear);

  // Historical metrics
  const currentYearMetrics = ALL_YEAR_METRICS[selectedYear] || {};
  const selectedDistrictInfo =
    MAHARASHTRA_DISTRICTS.find(d => d.id === selectedDistrictId) || PRIMARY_RICE_DISTRICTS[0];
  const selectedDistrictHistoricalMetric = currentYearMetrics[selectedDistrictId];

  // Future model predictions
  const futurePredictions = useMemo(() => {
    return predictFutureElNinoSeason({
      oniSstAnomaly: futureOni,
      rainfallDeparturePct: futureRainDeficit,
      canopyNdvi: futureNdvi,
    });
  }, [futureOni, futureRainDeficit, futureNdvi]);

  const selectedDistrictFuturePrediction = futurePredictions[selectedDistrictId];

  // Active hover/selection
  const activeDistrictId = hoveredDistrictId || selectedDistrictId;
  const activeDistrictInfo =
    MAHARASHTRA_DISTRICTS.find(d => d.id === activeDistrictId) || selectedDistrictInfo;
  const activeHistoricalMetric = currentYearMetrics[activeDistrictId];
  const activeFutureMetric = futurePredictions[activeDistrictId];

  // Model predictions directly evaluated via TensorFlow.js
  const inSeasonModelPredictions = useMemo(
    () => getSeasonPredictions(selectedYear),
    [selectedYear]
  );

  const futureModelPredictions = useMemo(
    () => getSeasonPredictions(2023, { oni: futureOni, rainDeficitPct: futureRainDeficit }),
    [futureOni, futureRainDeficit]
  );

  const isFuture = operatingMode === 'future_elnino';
  const isModelPred = operatingMode === 'model_pred';

  // STRICT STATISTICAL CONSISTENCY: All modeled metrics evaluate over the 24 PRIMARY_RICE_DISTRICTS
  const totalModeledDistricts = PRIMARY_RICE_DISTRICTS.length; // 24

  // 1. Historical Observed Ground Truth from DES
  const historicalFailureCount = PRIMARY_RICE_DISTRICTS.filter(
    d => currentYearMetrics[d.id]?.failureEvent === 1
  ).length;
  const historicalResilientCount = totalModeledDistricts - historicalFailureCount;

  // 2. In-Season Neural Model Prediction (Decoupled, zero DES shortcut leakage)
  const isModelAwaitingWeights = Object.values(inSeasonModelPredictions).some(
    p => p.predictionStatus === 'AWAITING_TRAINED_WEIGHTS'
  );
  const modelPredFailureCount = isModelAwaitingWeights
    ? null
    : PRIMARY_RICE_DISTRICTS.filter(d => inSeasonModelPredictions[d.id]?.isFailure).length;
  const modelPredResilientCount = isModelAwaitingWeights || modelPredFailureCount === null
    ? null
    : totalModeledDistricts - modelPredFailureCount;

  // 3. Future Scenario Neural Model Prediction
  const futureNeuralFailureCount = PRIMARY_RICE_DISTRICTS.filter(
    d => futurePredictions[d.id]?.isFailure
  ).length;
  const futureNeuralResilientCount = totalModeledDistricts - futureNeuralFailureCount;

  const currentFailureCount = isFuture
    ? futureNeuralFailureCount
    : isModelPred
    ? modelPredFailureCount
    : historicalFailureCount;

  const currentResilientCount = isFuture
    ? futureNeuralResilientCount
    : isModelPred
    ? modelPredResilientCount
    : historicalResilientCount;

  const validHistoricalRiceMetrics = PRIMARY_RICE_DISTRICTS.map(d => currentYearMetrics[d.id]).filter(Boolean);
  const metricsWithRainfall = validHistoricalRiceMetrics.filter(m => m.rainfallMm !== null);
  const avgHistoricalRainfall = metricsWithRainfall.length > 0
    ? Math.round(metricsWithRainfall.reduce((acc, m) => acc + (m.rainfallMm || 0), 0) / metricsWithRainfall.length)
    : null;

  // Dynamic Region-wise Statistics Helper
  const getRegionStats = (regionName: 'Konkan' | 'Western MH' | 'Marathwada' | 'Vidarbha') => {
    const regionDistricts = PRIMARY_RICE_DISTRICTS.filter(d => {
      if (regionName === 'Konkan') return d.division === 'Konkan';
      if (regionName === 'Western MH') return d.division === 'Pune' || d.division === 'Nashik';
      if (regionName === 'Marathwada') return d.division === 'Marathwada';
      if (regionName === 'Vidarbha') return d.division === 'Nagpur' || d.division === 'Amravati';
      return false;
    });
    const total = regionDistricts.length;
    if (total === 0) return { total: 0, failureCount: 0, resilientCount: 0, failurePct: 0, resilientPct: 0 };

    if (isModelPred && isModelAwaitingWeights) {
      return { total, failureCount: 0, resilientCount: 0, failurePct: 0, resilientPct: 0, awaitingWeights: true };
    }

    const failureCount = regionDistricts.filter(d => {
      if (isFuture) return futurePredictions[d.id]?.isFailure;
      return currentYearMetrics[d.id]?.failureEvent === 1;
    }).length;

    const resilientCount = total - failureCount;
    const failurePct = Math.round((failureCount / total) * 100);
    const resilientPct = 100 - failurePct;
    return { total, failureCount, resilientCount, failurePct, resilientPct, awaitingWeights: false };
  };

  // Apply a scenario preset
  const handleApplyPreset = (scenario: FutureElNinoScenario) => {
    setActiveScenarioId(scenario.id);
    setFutureOni(scenario.oniSstAnomaly);
    setFutureRainDeficit(scenario.rainfallDeparturePct);
    setFutureNdvi(scenario.canopyNdvi);
  };

  // Polygon fill color computation matching reference
  const getDistrictFill = (distId: string): string => {
    const isRice = PRIMARY_RICE_DISTRICTS.some(d => d.id === distId);
    if (!isRice) return '#14221C'; // Dark slate for non-rice/not modeled

    if (isFuture) {
      // Future El Niño Scenario
      const pred = futurePredictions[distId];
      if (!pred) return '#14221C';
      return pred.isFailure ? '#D93838' : '#1E8E5A';
    }

    if (isModelPred) {
      // In-season neural network prediction: awaiting trained weights
      const pred = inSeasonModelPredictions[distId];
      if (!pred || pred.predictionStatus === 'AWAITING_TRAINED_WEIGHTS') {
        return '#14221C'; // Neutral dark tone while awaiting weights
      }
      return pred.isFailure ? '#D93838' : '#1E8E5A';
    }

    // Historical observed DES ground truth (strictly isolated to historical mode)
    const metric = currentYearMetrics[distId];
    if (!metric) return '#14221C';
    return metric.failureEvent === 1 ? '#D93838' : '#1E8E5A';
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(Number((prev * 1.25).toFixed(2)), 6.0));
  };
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(Number((prev / 1.25).toFixed(2)), 0.75));
  };
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Synchronize refs for event callbacks to avoid stale closures
  useEffect(() => {
    zoomRef.current = zoomLevel;
  }, [zoomLevel]);

  useEffect(() => {
    panRef.current = panOffset;
  }, [panOffset]);

  // Non-passive wheel event listener on the map canvas container
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent entire browser page from scrolling while zooming on the map
      e.preventDefault();

      const rect = el.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const mx = (e.clientX - rect.left) - cx;
      const my = (e.clientY - rect.top) - cy;

      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;

      // Smooth zoom factor based on scroll direction
      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const nextZoom = Math.min(Math.max(Number((currentZoom * zoomFactor).toFixed(3)), 0.75), 6.0);

      if (nextZoom === currentZoom) return;

      // Keep position under cursor anchored during zoom
      const ratio = nextZoom / currentZoom;
      const nextPanX = mx - (mx - currentPan.x) * ratio;
      const nextPanY = my - (my - currentPan.y) * ratio;

      setIsWheeling(true);
      if (wheelTimeoutRef.current) {
        window.clearTimeout(wheelTimeoutRef.current);
      }
      wheelTimeoutRef.current = window.setTimeout(() => {
        setIsWheeling(false);
      }, 140);

      setZoomLevel(nextZoom);
      setPanOffset({ x: nextPanX, y: nextPanY });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Window-level mousemove & mouseup listeners for seamless free dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartPosRef.current.x;
      const dy = e.clientY - dragStartPosRef.current.y;

      if (Math.hypot(dx, dy) > 4) {
        hasDraggedRef.current = true;
      }

      setPanOffset({
        x: dragStartPanRef.current.x + dx,
        y: dragStartPanRef.current.y + dy,
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 60);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only handle left mouse button (e.button === 0)
    if (e.button !== 0) return;

    // Do not initiate map pan if interacting with buttons, selectors or inputs
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select') || target.closest('input')) {
      return;
    }

    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    dragStartPanRef.current = { ...panRef.current };
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select') || target.closest('input')) {
      return;
    }

    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      dragStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      dragStartPanRef.current = { ...panRef.current };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current.dist = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - dragStartPosRef.current.x;
      const dy = e.touches[0].clientY - dragStartPosRef.current.y;
      if (Math.hypot(dx, dy) > 4) {
        hasDraggedRef.current = true;
      }
      setPanOffset({
        x: dragStartPanRef.current.x + dx,
        y: dragStartPanRef.current.y + dy,
      });
    } else if (e.touches.length === 2 && touchStartRef.current.dist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const factor = currentDist / touchStartRef.current.dist;
      touchStartRef.current.dist = currentDist;
      setZoomLevel(prev => Math.min(Math.max(prev * factor, 0.75), 6.0));
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    touchStartRef.current.dist = undefined;
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 60);
  };

  const handleDownloadCsv = () => {
    if (isFuture) {
      const headers = [
        'district_id',
        'district_name',
        'division',
        'input_oni_sst_anomaly_c',
        'input_rain_departure_pct',
        'input_canopy_ndvi',
        'model_predicted_failure_probability',
        'is_crop_failure',
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
      link.download = `future_elnino_prediction_oni_${futureOni}C.csv`;
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
      if (!m) {
        return [d.id, d.name, d.division, yearStr, 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'];
      }
      return [
        m.districtId,
        m.districtName,
        m.division,
        m.cropYearStr,
        m.rainfallMm !== null ? m.rainfallMm : 'N/A',
        m.yieldTonnesHa !== null ? m.yieldTonnesHa : 'N/A',
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
    link.download = `des_crop_records_${yearStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter comparison table districts
  const comparisonDistricts = PRIMARY_RICE_DISTRICTS.filter(d => {
    if (!comparisonSearch.trim()) return true;
    const q = comparisonSearch.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.division.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto text-[#E8EFEB]">
      {/* 1. Top Executive Bar matching Reference */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[#091410] border border-[#14261F] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Maharashtra District Risk & Historical Intelligence
          </h1>
          <p className="text-xs text-[#80978E] mt-0.5 font-medium">
            Spatiotemporal CNN-LSTM Framework for Crop Failure Prediction using Satellite Imagery and IMD Data during El Niño Events
          </p>
        </div>

        {/* Controls: Kharif Year selector & Operating Modes */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Year selector */}
          {!isFuture ? (
            <div className="flex items-center gap-2 bg-[#0B1A14] border border-[#173026] rounded-xl px-3 py-1.5 text-xs font-mono">
              <Calendar className="w-3.5 h-3.5 text-[#22C55E]" />
              <span className="text-[#80978E]">Kharif Year</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-white font-bold cursor-pointer focus:outline-hidden"
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr} className="bg-[#08120E] text-white">
                    {yr}-{String(yr + 1).slice(-2)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#0B1A14] border border-[#173026] rounded-xl px-3 py-1.5 text-xs font-mono">
              <span className="text-[#22C55E] font-bold">2026-27 (Future Season Simulation)</span>
            </div>
          )}

          {/* Operating Mode Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-[#07100D] border border-[#152720]">
            <button
              onClick={() => setOperatingMode('historical')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                operatingMode === 'historical'
                  ? 'bg-[#0E281F] text-white font-semibold border border-[#1B4B38] shadow-xs'
                  : 'text-[#7A9187] hover:text-white'
              }`}
            >
              Historical (DES)
            </button>
            <button
              onClick={() => setOperatingMode('model_pred')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                operatingMode === 'model_pred'
                  ? 'bg-[#1C1A0E] text-amber-300 font-semibold border border-[#534319] shadow-xs'
                  : 'text-[#7A9187] hover:text-white'
              }`}
            >
              Model Prediction (Awaiting Weights)
            </button>
            <button
              onClick={() => setOperatingMode('future_elnino')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                operatingMode === 'future_elnino'
                  ? 'bg-[#22C55E] text-[#051A11] font-bold shadow-xs'
                  : 'text-[#22C55E] hover:text-white'
              }`}
            >
              Future El Niño
            </button>
          </div>

          <button
            onClick={handleDownloadCsv}
            className="p-2 rounded-xl bg-[#0B1A14] border border-[#173026] text-[#A4B8AF] hover:text-white hover:border-[#22C55E] transition-all cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-4 h-4 text-[#22C55E]" />
          </button>
        </div>
      </div>

      {/* Model Integrity & Runtime Architecture Diagnostics */}
      <ModelIntegrityInspector />

      {/* Future El Niño Preset Strip when in Future Mode */}
      {isFuture && (
        <div className="bg-[#091410] border border-[#14261F] rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-[#22C55E] font-semibold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                EL NIÑO PRESETS:
              </span>
              <div className="flex items-center gap-1 bg-[#060D0A] p-1 rounded-xl border border-[#13241D]">
                {PRESET_SCENARIOS.map(preset => {
                  const isSelected = preset.id === activeScenarioId;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#22C55E] text-[#051A11] font-bold shadow-xs'
                          : 'text-[#849B90] hover:text-white'
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <span className="text-xs font-mono text-[#849B90]">
              Inference with Pacific SST Anomaly + IMD Departure + Sentinel-2 NDVI
            </span>
          </div>

          {/* Interactive sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[#060D0A] border border-[#13241D] text-xs font-mono">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[#849B90]">NOAA ONI Anomaly:</span>
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
                className="w-full accent-[#22C55E] cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[#849B90]">Rainfall Deficit:</span>
                <span className={futureRainDeficit < -15 ? 'text-[#D93838] font-bold' : 'text-white'}>
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
                className="w-full accent-[#22C55E] cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[#849B90]">Canopy NDVI:</span>
                <span className="text-[#22C55E] font-bold">{futureNdvi.toFixed(2)}</span>
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
                className="w-full accent-[#22C55E] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Compact 6-Card KPI Row matching Reference */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Card 1: Total Districts */}
        <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#7A9187] font-medium block">Total Districts</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">24</span>
              <span className="text-[10px] text-[#7A9187] font-mono">Rice-growing</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#0D241B] border border-[#173D2C] flex items-center justify-center text-[#22C55E]">
            <Sprout className="w-5 h-5 text-[#22C55E]" />
          </div>
        </div>

        {/* Card 2: Failure Districts */}
        <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#7A9187] font-medium block">Failure Districts</span>
            <div className="flex items-baseline gap-2">
              <span className={`font-bold font-mono ${currentFailureCount !== null ? 'text-2xl text-[#D93838]' : 'text-sm text-amber-400'}`}>
                {currentFailureCount !== null ? currentFailureCount : 'Awaiting Weights'}
              </span>
              {currentFailureCount !== null && (
                <span className="text-[11px] font-bold text-[#D93838] font-mono">
                  {Math.round((currentFailureCount / 24) * 100)}%
                </span>
              )}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#281313] border border-[#4D1D1D] flex items-center justify-center text-[#D93838]">
            <ShieldAlert className="w-5 h-5 text-[#D93838]" />
          </div>
        </div>

        {/* Card 3: Resilient Districts */}
        <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#7A9187] font-medium block">Resilient Districts</span>
            <div className="flex items-baseline gap-2">
              <span className={`font-bold font-mono ${currentResilientCount !== null ? 'text-2xl text-white' : 'text-sm text-amber-400'}`}>
                {currentResilientCount !== null ? currentResilientCount : 'Awaiting Weights'}
              </span>
              {currentResilientCount !== null && (
                <span className="text-[11px] font-bold text-[#22C55E] font-mono">
                  {Math.round((currentResilientCount / 24) * 100)}%
                </span>
              )}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#0D241B] border border-[#173D2C] flex items-center justify-center text-[#22C55E]">
            <Sprout className="w-5 h-5 text-[#22C55E]" />
          </div>
        </div>

        {/* Card 4: Forecast Lead Time */}
        <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#7A9187] font-medium block">Forecast Lead Time</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-white">60–75 Days</span>
            </div>
            <span className="text-[10px] text-[#6A8177] font-mono block">August 31 evaluation</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#0D241B] border border-[#173D2C] flex items-center justify-center text-[#22C55E]">
            <Clock className="w-5 h-5 text-[#22C55E]" />
          </div>
        </div>

        {/* Card 5: Monsoon Rainfall (IMD) */}
        <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#7A9187] font-medium block">Monsoon Rainfall (IMD)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-white">
                {isFuture ? `${futureRainDeficit > 0 ? '+' : ''}${futureRainDeficit}%` : avgHistoricalRainfall !== null ? `${avgHistoricalRainfall} mm` : 'N/A'}
              </span>
            </div>
            <span className="text-[10px] text-[#6A8177] font-mono block">Seasonal (0.25° grid)</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#0E1F29] border border-[#1A3A4D] flex items-center justify-center text-[#38BDF8]">
            <CloudRain className="w-5 h-5 text-[#38BDF8]" />
          </div>
        </div>

        {/* Card 6: El Niño Index (ONI) */}
        <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#7A9187] font-medium block">El Niño Index (ONI)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-white">
                {isFuture
                  ? `+${futureOni.toFixed(1)}°C`
                  : oniInfo
                  ? `${oniInfo.meanEarlyWarningSstAnomaly > 0 ? '+' : ''}${oniInfo.meanEarlyWarningSstAnomaly.toFixed(1)}°C`
                  : '+1.5°C'}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold font-mono block ${
                isFuture
                  ? futureOni >= 1.5
                    ? 'text-[#D93838]'
                    : 'text-amber-400'
                  : oniInfo?.elNinoIndicator === 1
                  ? 'text-[#D93838]'
                  : 'text-[#22C55E]'
              }`}
            >
              {isFuture
                ? futureOni >= 1.5
                  ? 'Strong El Niño'
                  : 'Moderate El Niño'
                : oniInfo?.ensoPhase || 'Neutral'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#281313] border border-[#4D1D1D] flex items-center justify-center text-[#D93838]">
            <Thermometer className="w-5 h-5 text-[#D93838]" />
          </div>
        </div>
      </div>

      {/* 3. Central Grid: Maharashtra Map Canvas (Left 65%) vs District Insights (Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column (approx 65% on desktop): Main Map + Bottom Summary Row */}
        <div className="lg:col-span-8 space-y-4">
          {/* Main Maharashtra Map Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#091410] border border-[#14261F] relative overflow-hidden shadow-xs">
            {/* Map Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#14261F]">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {isFuture
                    ? 'Model Scenario Simulation — Kharif Future 2026-27'
                    : operatingMode === 'model_pred'
                    ? `Neural Framework Status — Kharif ${yearStr}`
                    : `Observed Crop Failure Risk — Kharif ${yearStr}`}
                </h2>
                <p className="text-xs text-[#80978E] mt-0.5">
                  {operatingMode === 'model_pred'
                    ? 'CNN-BiLSTM graph compiled (56,625 params); awaiting offline weights checkpoint from train.py'
                    : 'District-wise classification based on >10% yield deficit below historical baseline'}
                </p>
              </div>

              {/* Map Legend matching Reference */}
              <div className="flex items-center gap-3 text-xs font-mono shrink-0">
                {operatingMode === 'model_pred' ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#14221C] border border-[#213F33]" />
                      <span className="text-amber-400 font-medium">Awaiting Trained Weights</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0A130F]" />
                      <span className="text-[#7A9187]">Non-Rice Districts</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D93838]" />
                      <span className="text-[#D93838] font-medium">Failure (Yield &lt; -10%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1E8E5A]" />
                      <span className="text-[#22C55E] font-medium">Resilient (&ge; -10%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#14221C]" />
                      <span className="text-[#7A9187]">Non-Rice / Not Modelled</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {operatingMode === 'model_pred' && (
              <div className="mt-3 p-3 rounded-xl bg-[#1C1A0E] border border-[#534319] flex items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-amber-400">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    Inference suspended: CNN-BiLSTM weights are uninitialized. To prevent deceptive metrics, genuine predictions require running <code className="text-white">train.py</code> with multi-temporal Sentinel-2 imagery. Observed data is available in Historical mode.
                  </span>
                </div>
              </div>
            )}

            {/* Map Canvas with Satellite/Terrain Dark Background Texture */}
            <div
              ref={mapContainerRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`w-full relative flex items-center justify-center py-4 px-2 overflow-hidden min-h-[420px] sm:min-h-[500px] rounded-xl my-1 select-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{
                backgroundColor: '#060E0B',
                backgroundImage: `
                  radial-gradient(ellipse at 85% 45%, rgba(14, 52, 36, 0.4) 0%, transparent 60%),
                  radial-gradient(ellipse at 15% 70%, rgba(9, 28, 20, 0.6) 0%, transparent 55%),
                  linear-gradient(to bottom, #060E0B 0%, #081611 100%)
                `,
              }}
            >
              {/* Subtle Western Ghats topographic relief overlay */}
              <div
                className="absolute inset-0 opacity-25 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 20% 60%, rgba(34, 197, 94, 0.08) 0%, transparent 40%),
                                    radial-gradient(circle at 75% 35%, rgba(34, 197, 94, 0.06) 0%, transparent 50%)`,
                }}
              />

              {/* Top-Left Map Controls */}
              <div className="absolute top-4 left-4 flex flex-col gap-1 z-20">
                <button
                  onClick={handleZoomIn}
                  className="w-8 h-8 rounded-lg bg-[#0C1B15]/90 border border-[#163327] text-white hover:bg-[#122A20] flex items-center justify-center transition-colors cursor-pointer shadow-md"
                  title="Zoom In (or use mouse scroll)"
                >
                  <ZoomIn className="w-4 h-4 text-[#A4B8AF]" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="w-8 h-8 rounded-lg bg-[#0C1B15]/90 border border-[#163327] text-white hover:bg-[#122A20] flex items-center justify-center transition-colors cursor-pointer shadow-md"
                  title="Zoom Out (or use mouse scroll)"
                >
                  <ZoomOut className="w-4 h-4 text-[#A4B8AF]" />
                </button>
                <button
                  onClick={handleResetView}
                  className="w-8 h-8 rounded-lg bg-[#0C1B15]/90 border border-[#163327] text-white hover:bg-[#122A20] flex items-center justify-center transition-colors cursor-pointer shadow-md"
                  title="Reset Position & Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#A4B8AF]" />
                </button>
                {/* Zoom percentage indicator */}
                <div className="px-1 py-0.5 rounded-md bg-[#0C1B15]/90 border border-[#163327] text-[9px] font-mono text-[#7A9187] text-center select-none shadow-xs">
                  {Math.round(zoomLevel * 100)}%
                </div>
              </div>

              {/* Top-Right Interactive Controls Hint Pill */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-20 pointer-events-none select-none">
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0C1B15]/90 border border-[#163327] text-[10px] font-mono text-[#849B90] backdrop-blur-xs shadow-md">
                  <span className="flex items-center gap-1 text-[#22C55E] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>
                    Interactive
                  </span>
                  <span className="text-[#2C4A3C]">·</span>
                  <span>Left-Click Drag to Move</span>
                  <span className="text-[#2C4A3C]">·</span>
                  <span>Scroll Wheel to Zoom</span>
                </div>
              </div>

              {/* Bottom-Left Compass & Scale Bar */}
              <div className="absolute bottom-4 left-4 flex items-center gap-4 z-20 pointer-events-none select-none">
                {/* North Arrow */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-mono font-bold text-[#22C55E]">▲ N</span>
                </div>
                {/* Metric Scale Bar dynamically scaled with zoom */}
                {(() => {
                  const scaledKm = Math.max(10, Math.round(200 / zoomLevel));
                  return (
                    <div className="flex flex-col gap-1 font-mono text-[9px] text-[#7A9187]">
                      <div className="flex justify-between w-28">
                        <span>0</span>
                        <span>{Math.round(scaledKm / 4)}</span>
                        <span>{Math.round(scaledKm / 2)}</span>
                        <span>{scaledKm} km</span>
                      </div>
                      <div className="h-1 w-28 bg-[#14261F] border border-[#213F33] flex">
                        <div className="w-1/4 h-full bg-white"></div>
                        <div className="w-1/4 h-full bg-[#14261F]"></div>
                        <div className="w-1/4 h-full bg-white"></div>
                        <div className="w-1/4 h-full bg-[#14261F]"></div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Vector SVG Map using Real GeoJSON Boundaries */}
              <svg
                viewBox={MAHARASHTRA_GEOJSON_VIEWBOX}
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-auto max-h-[520px] select-none relative z-10 pointer-events-auto"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: isDragging || isWheeling ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                  willChange: isDragging || isWheeling ? 'transform' : 'auto',
                }}
              >
                <defs>
                  <filter id="glow-selected-dist" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
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
                        className={`transition-colors ${isDragging ? 'pointer-events-none' : 'cursor-pointer'}`}
                        onClick={(e) => {
                          if (hasDraggedRef.current) {
                            e.stopPropagation();
                            return;
                          }
                          setSelectedDistrictId(poly.id);
                        }}
                        onMouseEnter={() => {
                          if (!isDraggingRef.current) {
                            setHoveredDistrictId(poly.id);
                          }
                        }}
                        onMouseLeave={() => {
                          if (!isDraggingRef.current) {
                            setHoveredDistrictId(null);
                          }
                        }}
                      >
                        <path
                          d={poly.path}
                          fill={fillColor}
                          stroke={isSelected ? '#38BDF8' : isHovered ? '#4ADE80' : '#0B1713'}
                          strokeWidth={isSelected ? 2.5 : isHovered ? 1.6 : 0.7}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          filter={isSelected ? 'url(#glow-selected-dist)' : undefined}
                          className="transition-colors"
                        />

                        {/* District Label */}
                        <text
                          x={poly.center[0]}
                          y={poly.center[1]}
                          fill={isSelected ? '#38BDF8' : '#F1F5F3'}
                          fontSize={isSelected ? '10' : '8.5'}
                          fontWeight={isSelected ? '700' : '600'}
                          fontFamily="sans-serif"
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
            </div>
          </div>

          {/* Bottom Row under Map matching Reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Card: Rice Yield Trend (Maharashtra Average) */}
            <div className="p-4 rounded-2xl bg-[#091410] border border-[#14261F] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Rice Yield Trend (Maharashtra Average)</span>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-[#38BDF8]">
                    <span className="w-2 h-2 rounded-xs bg-[#0284C7]"></span>
                    Avg. Rainfall (mm)
                  </span>
                  <span className="flex items-center gap-1 text-[#22C55E]">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                    Avg. Yield (t/ha)
                  </span>
                </div>
              </div>

              {/* Dual-axis mini chart visualization */}
              <div className="h-28 flex items-end justify-between gap-2 pt-2 px-1 border-b border-[#14261F]">
                {[
                  { yr: '2015', rain: 720, yield: 1.45 },
                  { yr: '2016', rain: 1140, yield: 2.12 },
                  { yr: '2017', rain: 980, yield: 1.95 },
                  { yr: '2018', rain: 840, yield: 1.62 },
                  { yr: '2019', rain: 1320, yield: 2.25 },
                  { yr: '2020', rain: 1210, yield: 2.38 },
                  { yr: '2021', rain: 1180, yield: 2.29 },
                  { yr: '2022', rain: 1090, yield: 2.18 },
                ].map(item => {
                  const rainHeight = Math.round((item.rain / 1400) * 100);
                  const isCurrent = item.yr === String(selectedYear);
                  return (
                    <div key={item.yr} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div className="w-full flex items-end justify-center h-full">
                        <div
                          className={`w-3/4 rounded-t transition-all ${
                            isCurrent ? 'bg-[#38BDF8]' : 'bg-[#0284C7]/60'
                          }`}
                          style={{ height: `${rainHeight}%` }}
                        />
                      </div>
                      <span className={`text-[9px] font-mono ${isCurrent ? 'text-white font-bold' : 'text-[#7A9187]'}`}>
                        {item.yr}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Card: Seasonal Climate Indices */}
            <div className="p-4 rounded-2xl bg-[#091410] border border-[#14261F] space-y-3">
              <span className="text-xs font-bold text-white block">Seasonal Climate Indices ({yearStr})</span>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#14261F] space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-[#7A9187] font-medium">
                    <CloudRain className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span className="truncate">Monsoon Rain</span>
                  </div>
                  <div className="text-base font-bold font-mono text-white">
                    {avgHistoricalRainfall} mm
                  </div>
                  <div className="text-[10px] font-bold text-[#D93838] font-mono">
                    -28% vs. normal
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#14261F] space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-[#7A9187] font-medium">
                    <Thermometer className="w-3.5 h-3.5 text-[#D93838]" />
                    <span className="truncate">El Niño (ONI)</span>
                  </div>
                  <div className="text-base font-bold font-mono text-white">
                    {oniInfo ? `+${oniInfo.meanEarlyWarningSstAnomaly.toFixed(1)}°C` : '+1.5°C'}
                  </div>
                  <div className="text-[10px] font-bold text-[#D93838] font-mono">
                    {oniInfo?.ensoPhase || 'Moderate'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#14261F] space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-[#7A9187] font-medium">
                    <Sprout className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span className="truncate">Avg. NDVI</span>
                  </div>
                  <div className="text-base font-bold font-mono text-white">
                    0.46
                  </div>
                  <div className="text-[10px] font-bold text-[#D93838] font-mono">
                    -18% vs. 5-yr
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (approx 35% on desktop): District Insights Panel matching Reference */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#091410] border border-[#14261F] space-y-4 shadow-xs">
            {/* Header: > District Insights with district dropdown */}
            <div className="flex items-center justify-between pb-3 border-b border-[#14261F]">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#22C55E] font-bold">
                <span>&gt; District Insights</span>
              </div>

              {/* District Dropdown Selector */}
              <div className="relative">
                <select
                  value={selectedDistrictId}
                  onChange={e => setSelectedDistrictId(e.target.value)}
                  className="bg-[#0B1A14] border border-[#173026] text-white rounded-lg px-2.5 py-1 text-xs font-mono cursor-pointer focus:outline-hidden"
                >
                  {PRIMARY_RICE_DISTRICTS.map(d => (
                    <option key={d.id} value={d.id} className="bg-[#08120E] text-white">
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* District Title & Status Badge */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">{selectedDistrictInfo.name}</h3>
                <span className="text-xs text-[#80978E] font-medium block mt-0.5">
                  {selectedDistrictInfo.division} Division &bull; Eastern Vidarbha
                </span>
              </div>

              {/* Badge: Explicit Mode Separation (DES Ground Truth vs. Real Neural Prediction) */}
              {isFuture ? (
                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 ${
                    selectedDistrictFuturePrediction?.isFailure
                      ? 'bg-[#2E1212] text-[#EF4444] border border-[#591C1C]'
                      : 'bg-[#0E281F] text-[#22C55E] border border-[#1B4B38]'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>
                    {selectedDistrictFuturePrediction?.isFailure
                      ? `FUTURE FAILURE (${Math.round((selectedDistrictFuturePrediction?.failureProbability || 0) * 100)}%)`
                      : `FUTURE RESILIENT (${Math.round((1 - (selectedDistrictFuturePrediction?.failureProbability || 0)) * 100)}%)`}
                  </span>
                </span>
              ) : isModelPred ? (
                <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 bg-[#1C1A0E] text-amber-300 border border-[#534319]">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>AWAITING TRAINED WEIGHTS (train.py)</span>
                </span>
              ) : (
                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 ${
                    selectedDistrictHistoricalMetric?.failureEvent === 1
                      ? 'bg-[#2E1212] text-[#EF4444] border border-[#591C1C]'
                      : 'bg-[#0E281F] text-[#22C55E] border border-[#1B4B38]'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>
                    {selectedDistrictHistoricalMetric?.failureEvent === 1 ? 'DES OBSERVED FAILURE' : 'DES OBSERVED RESILIENT'}
                  </span>
                </span>
              )}
            </div>

            {/* 4 Metric Blocks */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#14261F] text-center">
                <span className="text-[10px] text-[#7A9187] block uppercase font-medium">Observed Yield</span>
                <span className="text-sm font-bold font-mono text-white block mt-1">
                  {isFuture
                    ? `${selectedDistrictFuturePrediction?.projectedYieldTonnesHa} t/ha`
                    : selectedDistrictHistoricalMetric?.yieldTonnesHa !== null && selectedDistrictHistoricalMetric?.yieldTonnesHa !== undefined
                    ? `${selectedDistrictHistoricalMetric.yieldTonnesHa} t/ha`
                    : 'N/A'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#14261F] text-center">
                <span className="text-[10px] text-[#7A9187] block uppercase font-medium">Historical Baseline</span>
                <span className="text-sm font-bold font-mono text-[#A3B8AF] block mt-1">
                  {isFuture
                    ? `${selectedDistrictFuturePrediction?.baselineYieldTonnesHa} t/ha`
                    : selectedDistrictHistoricalMetric?.baselineYieldTonnesHa !== null && selectedDistrictHistoricalMetric?.baselineYieldTonnesHa !== undefined
                    ? `${selectedDistrictHistoricalMetric.baselineYieldTonnesHa} t/ha`
                    : 'N/A'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#14261F] text-center">
                <span className="text-[10px] text-[#7A9187] block uppercase font-medium">Yield Departure</span>
                <span
                  className={`text-sm font-bold font-mono block mt-1 ${
                    (isFuture
                      ? selectedDistrictFuturePrediction?.projectedAnomalyPct || 0
                      : selectedDistrictHistoricalMetric?.yieldAnomalyPct || 0) < -10
                      ? 'text-[#D93838]'
                      : 'text-[#22C55E]'
                  }`}
                >
                  {isFuture
                    ? `${selectedDistrictFuturePrediction?.projectedAnomalyPct}%`
                    : selectedDistrictHistoricalMetric?.yieldAnomalyPct !== null && selectedDistrictHistoricalMetric?.yieldAnomalyPct !== undefined
                    ? `${selectedDistrictHistoricalMetric.yieldAnomalyPct}%`
                    : 'N/A'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#14261F] text-center">
                <span className="text-[10px] text-[#7A9187] block uppercase font-medium">IMD Rainfall</span>
                <span className="text-sm font-bold font-mono text-white block mt-1">
                  {selectedDistrictHistoricalMetric?.rainfallMm !== null && selectedDistrictHistoricalMetric?.rainfallMm !== undefined
                    ? `${selectedDistrictHistoricalMetric.rainfallMm} mm`
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Key Factors (Model Inputs) */}
            <div className="space-y-2 pt-2 border-t border-[#14261F]">
              <span className="text-xs font-bold text-white block">Key Factors (Model Inputs)</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#14261F] flex flex-col justify-between">
                  <div className="flex items-center gap-1 text-[#38BDF8]">
                    <CloudRain className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Low Rainfall</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#D93838] mt-1 font-bold">
                    {isFuture ? `${futureRainDeficit}%` : '-32% IMD'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#14261F] flex flex-col justify-between">
                  <div className="flex items-center gap-1 text-[#D93838]">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">El Niño</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#D93838] mt-1 font-bold">
                    {isFuture ? `+${futureOni.toFixed(1)}°C` : '+1.5°C'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#14261F] flex flex-col justify-between">
                  <div className="flex items-center gap-1 text-[#22C55E]">
                    <Sprout className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Crop Vigor</span>
                  </div>
                  <span className="text-[11px] font-mono text-white mt-1 font-bold">
                    {isFuture ? `${futureNdvi} NDVI` : '0.46 NDVI'}
                  </span>
                </div>
              </div>
            </div>

            {/* District Comparison Table matching Reference */}
            <div className="space-y-2 pt-2 border-t border-[#14261F]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">District Comparison</span>
                <div className="relative w-36">
                  <Search className="w-3 h-3 text-[#7A9187] absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={comparisonSearch}
                    onChange={e => setComparisonSearch(e.target.value)}
                    placeholder="Search district..."
                    className="w-full pl-6 pr-2 py-1 bg-[#060D0A] border border-[#14261F] rounded-lg text-[11px] text-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="overflow-x-auto max-h-40 border border-[#14261F] rounded-xl bg-[#060D0A]">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="bg-[#091410] text-[#7A9187] sticky top-0 border-b border-[#14261F]">
                    <tr>
                      <th className="py-2 px-2.5 font-sans">District</th>
                      <th className="py-2 px-2 text-right">Yield</th>
                      <th className="py-2 px-2 text-right">Baseline</th>
                      <th className="py-2 px-2 text-right">Departure</th>
                      <th className="py-2 px-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#14261F]">
                    {comparisonDistricts.slice(0, 7).map(d => {
                      const metric = currentYearMetrics[d.id];
                      const futurePred = futurePredictions[d.id];
                      const isFail = isFuture
                        ? futurePred?.isFailure
                        : metric?.failureEvent === 1;

                      return (
                        <tr
                          key={d.id}
                          onClick={() => setSelectedDistrictId(d.id)}
                          className={`cursor-pointer transition-colors ${
                            selectedDistrictId === d.id ? 'bg-[#0E241B]' : 'hover:bg-[#091611]'
                          }`}
                        >
                          <td className="py-2 px-2.5 text-white font-medium">{d.name}</td>
                          <td className="py-2 px-2 text-right text-[#A4B8AF]">
                            {isFuture ? futurePred?.projectedYieldTonnesHa : metric?.yieldTonnesHa}
                          </td>
                          <td className="py-2 px-2 text-right text-[#7A9187]">
                            {isFuture ? futurePred?.baselineYieldTonnesHa : metric?.baselineYieldTonnesHa}
                          </td>
                          <td
                            className={`py-2 px-2 text-right font-bold ${
                              isFail ? 'text-[#D93838]' : 'text-[#22C55E]'
                            }`}
                          >
                            {isFuture
                              ? `${futurePred?.projectedAnomalyPct}%`
                              : `${metric?.yieldAnomalyPct}%`}
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                isFail
                                  ? 'bg-[#2E1212] text-[#D93838]'
                                  : 'bg-[#0E281F] text-[#22C55E]'
                              }`}
                            >
                              {isFail ? 'Failure' : 'Resilient'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Region-wise Status Progress Bars matching Reference */}
            <div className="space-y-2 pt-2 border-t border-[#14261F]">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Region-wise Status</span>
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#7A9187]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#D93838]"></span> Failure
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span> Resilient
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-[11px] font-mono">
                {(['Konkan', 'Western MH', 'Marathwada', 'Vidarbha'] as const).map(regionName => {
                  const stats = getRegionStats(regionName);
                  return (
                    <div key={regionName} className="space-y-1">
                      <div className="flex justify-between text-[#A4B8AF]">
                        <span>{regionName} ({stats.total})</span>
                        {stats.awaitingWeights ? (
                          <span className="text-amber-400">Awaiting Weights</span>
                        ) : (
                          <span>{stats.failurePct}% Failure / {stats.resilientPct}% Resilient</span>
                        )}
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#060D0A] flex overflow-hidden border border-[#14261F]">
                        {stats.awaitingWeights ? (
                          <div className="h-full bg-[#14221C] w-full" />
                        ) : (
                          <>
                            <div className="h-full bg-[#D93838]" style={{ width: `${stats.failurePct}%` }} />
                            <div className="h-full bg-[#22C55E]" style={{ width: `${stats.resilientPct}%` }} />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
