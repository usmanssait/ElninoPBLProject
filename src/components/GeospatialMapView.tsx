import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MAHARASHTRA_DISTRICTS,
  PRIMARY_RICE_DISTRICTS,
  DistrictInfo,
} from '../data/canonicalDistricts';
import {
  ALL_YEAR_METRICS,
  DistrictYearMetric,
} from '../data/maharashtraMapData';
import {
  MAHARASHTRA_GEOJSON_POLYGONS,
  MAHARASHTRA_GEOJSON_VIEWBOX,
  GeoDistrictPolygon,
} from '../data/maharashtraGeoJsonData';
import { NOAA_CPC_ONI_RECORDS } from '../data/oniElNinoData';
import {
  getSeasonPredictions,
  DistrictModelPrediction,
} from '../ml/modelPipeline';
import {
  isModelSupportedYear,
  SUPPORTED_MODEL_YEARS,
} from '../data/modelPredictionData';
import {
  Search,
  MapPin,
  Layers,
  CloudRain,
  Sprout,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Clock,
  Thermometer,
  Activity,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Compass,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

type OperatingMode = 'historical' | 'model_pred' | 'future_elnino';

export const GeospatialMapView: React.FC = () => {
  // Operating Mode
  const [operatingMode, setOperatingMode] = useState<OperatingMode>('historical');

  // Kharif Season Year (2015-2022)
  const [selectedYear, setSelectedYear] = useState<number>(2015);

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

  // Historical metrics for currently selected year
  const currentYearMetrics = ALL_YEAR_METRICS[selectedYear] || {};
  const selectedDistrictInfo =
    MAHARASHTRA_DISTRICTS.find(d => d.id === selectedDistrictId) || PRIMARY_RICE_DISTRICTS[0];
  const selectedDistrictHistoricalMetric = currentYearMetrics[selectedDistrictId];

  // Model predictions for the selected season (2019-2022 supported)
  const inSeasonModelPredictions = useMemo(
    () => getSeasonPredictions(selectedYear),
    [selectedYear]
  );
  const selectedDistrictModelPred = inSeasonModelPredictions[selectedDistrictId];

  const isModelPred = operatingMode === 'model_pred';
  const isFuture = operatingMode === 'future_elnino';
  const isYearSupported = isModelSupportedYear(selectedYear);

  // Denominators:
  // In Historical mode, evaluation spans the 24 PRIMARY_RICE_DISTRICTS.
  // In Model Prediction mode, Sentinel-2 multi-spectral rasters cover 20 monitored districts.
  const historicalTotalDistricts = PRIMARY_RICE_DISTRICTS.length; // 24
  const modelTotalMonitoredDistricts = 20;

  // 1. Historical Observed Ground Truth from DES
  const historicalFailureCount = PRIMARY_RICE_DISTRICTS.filter(
    d => currentYearMetrics[d.id]?.failureEvent === 1
  ).length;
  const historicalResilientCount = historicalTotalDistricts - historicalFailureCount;

  // 2. In-Season Neural Model Prediction (2019-2022)
  const modelPredReadyDistricts = PRIMARY_RICE_DISTRICTS.filter(
    d => inSeasonModelPredictions[d.id]?.predictionStatus === 'READY'
  );
  const modelPredFailureCount = !isYearSupported
    ? null
    : modelPredReadyDistricts.filter(d => inSeasonModelPredictions[d.id]?.isFailure === true).length;
  const modelPredResilientCount = !isYearSupported
    ? null
    : modelPredReadyDistricts.filter(d => inSeasonModelPredictions[d.id]?.isFailure === false).length;

  // State-wide / rice-belt average monsoon rainfall for the selected season
  const validHistoricalRiceMetrics = PRIMARY_RICE_DISTRICTS.map(d => currentYearMetrics[d.id]).filter(Boolean);
  const metricsWithRainfall = validHistoricalRiceMetrics.filter(m => m.rainfallMm !== null);
  const avgHistoricalRainfall = metricsWithRainfall.length > 0
    ? Math.round(metricsWithRainfall.reduce((acc, m) => acc + (m.rainfallMm || 0), 0) / metricsWithRainfall.length)
    : null;

  // Multi-year averages computed dynamically from ALL_YEAR_METRICS (2015-2022)
  const yearlyHistoricalAverages = useMemo(() => {
    return availableYears.map(yr => {
      const yrMetrics = ALL_YEAR_METRICS[yr] || {};
      const valid = PRIMARY_RICE_DISTRICTS.map(d => yrMetrics[d.id]).filter(Boolean);
      const withRain = valid.filter(m => m.rainfallMm !== null);
      const withYield = valid.filter(m => m.yieldTonnesHa !== null);
      const avgRain = withRain.length > 0
        ? Math.round(withRain.reduce((acc, m) => acc + (m.rainfallMm || 0), 0) / withRain.length)
        : 0;
      const avgYld = withYield.length > 0
        ? Number((withYield.reduce((acc, m) => acc + (m.yieldTonnesHa || 0), 0) / withYield.length).toFixed(2))
        : 0;
      return { yr: String(yr), rain: avgRain, yield: avgYld };
    });
  }, []);

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
    if (total === 0) return { total: 0, failureCount: 0, resilientCount: 0, failurePct: 0, resilientPct: 0, unsupported: false };

    if (isModelPred) {
      if (!isYearSupported) {
        return { total, failureCount: 0, resilientCount: 0, failurePct: 0, resilientPct: 0, unsupported: true };
      }
      const readyDistricts = regionDistricts.filter(d => inSeasonModelPredictions[d.id]?.predictionStatus === 'READY');
      const failCount = readyDistricts.filter(d => inSeasonModelPredictions[d.id]?.isFailure === true).length;
      const resCount = readyDistricts.length - failCount;
      const totalSampled = readyDistricts.length;
      const mFailPct = totalSampled > 0 ? Math.round((failCount / totalSampled) * 100) : 0;
      const mResPct = totalSampled > 0 ? 100 - mFailPct : 0;
      return { total, failureCount: failCount, resilientCount: resCount, failurePct: mFailPct, resilientPct: mResPct, unsupported: false };
    }

    const failureCount = regionDistricts.filter(d => currentYearMetrics[d.id]?.failureEvent === 1).length;
    const resilientCount = total - failureCount;
    const failurePct = Math.round((failureCount / total) * 100);
    const resilientPct = 100 - failurePct;
    return { total, failureCount, resilientCount, failurePct, resilientPct, unsupported: false };
  };

  // Polygon fill color
  const getDistrictFill = (distId: string): string => {
    const isRice = PRIMARY_RICE_DISTRICTS.some(d => d.id === distId);
    if (!isRice) return '#14221C'; // Dark slate for non-rice / unmonitored

    if (isModelPred) {
      if (!isYearSupported) return '#14221C';
      const pred = inSeasonModelPredictions[distId];
      if (!pred || pred.predictionStatus !== 'READY') {
        return '#14221C'; // Unsampled in Sentinel-2 dataset
      }
      if (pred.riskCategory === 'High' || (pred.failureProbability !== null && pred.failureProbability >= 0.5)) {
        return '#D93838'; // High risk (Red)
      }
      if (pred.riskCategory === 'Moderate') {
        return '#D97706'; // Moderate risk (Amber)
      }
      return '#1E8E5A'; // Low risk (Green)
    }

    // Historical observed DES ground truth
    const metric = currentYearMetrics[distId];
    if (!metric) return '#14221C';
    return metric.failureEvent === 1 ? '#D93838' : '#1E8E5A';
  };

  // Label collision avoidance and clean positioning helper
  const getDistrictLabel = (poly: GeoDistrictPolygon, zoom: number) => {
    // Mumbai collision resolution:
    // Mumbai Suburban center is [25, 325], Mumbai City center is [25, 339].
    // At normal zoom (< 1.6), render a single unified "Mumbai" label.
    if (poly.id === 'mumbai_city') {
      if (zoom < 1.6) return null; // Suppress duplicate label
      return { text: 'Mumbai City', x: poly.center[0], y: poly.center[1] + 4 };
    }
    if (poly.id === 'mumbai_suburban') {
      if (zoom < 1.6) {
        return { text: 'Mumbai', x: 25, y: 332 };
      }
      return { text: 'Mumbai Sub.', x: poly.center[0], y: poly.center[1] - 4 };
    }

    // Abbreviate overly long district names to prevent clipping
    let displayName = poly.name;
    if (poly.name === 'Chhatrapati Sambhajinagar') {
      displayName = 'Chh. Sambhajinagar';
    }

    return { text: displayName, x: poly.center[0], y: poly.center[1] };
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

  // Synchronize refs for event callbacks
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
      e.preventDefault();

      const rect = el.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const mx = (e.clientX - rect.left) - cx;
      const my = (e.clientY - rect.top) - cy;

      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const nextZoom = Math.min(Math.max(Number((currentZoom * zoomFactor).toFixed(3)), 0.75), 6.0);

      if (nextZoom === currentZoom) return;

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

  // Mouse drag listeners
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
    if (e.button !== 0) return;
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
    if (isModelPred) {
      const headers = [
        'district_id',
        'district_name',
        'crop_year',
        'model_risk_score',
        'risk_category',
        'predicted_failure_binary',
        'sampled_s2_patches',
        'mean_valid_pixel_pct',
        'kharif_rainfall_mm',
        'rainfall_departure_pct',
        'oni_jun_aug_anomaly_c',
      ];
      const rows = PRIMARY_RICE_DISTRICTS.map(d => {
        const p = inSeasonModelPredictions[d.id];
        if (!p || p.predictionStatus !== 'READY') {
          return [d.id, d.name, yearStr, 'N/A', 'UNSUPPORTED', 'N/A', '0', 'N/A', 'N/A', 'N/A', 'N/A'];
        }
        return [
          d.id,
          d.name,
          yearStr,
          p.failureProbability !== null ? p.failureProbability.toFixed(3) : 'N/A',
          p.riskCategory,
          p.isFailure ? 1 : 0,
          p.provenance?.sampledLocations ?? 0,
          p.provenance?.meanValidPixelFraction !== undefined
            ? `${(p.provenance.meanValidPixelFraction * 100).toFixed(1)}%`
            : 'N/A',
          p.climateInputsUsed.cumulativeRainfallMm !== null
            ? Math.round(p.climateInputsUsed.cumulativeRainfallMm)
            : 'N/A',
          p.climateInputsUsed.rainfallDeparturePct !== null
            ? p.climateInputsUsed.rainfallDeparturePct.toFixed(1)
            : 'N/A',
          p.climateInputsUsed.oniSstAnomaly.toFixed(1),
        ];
      });
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cnn_lstm_predictions_${yearStr}.csv`;
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
      'yield_departure_pct',
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
        m.rainfallMm !== null ? Math.round(m.rainfallMm) : 'N/A',
        m.yieldTonnesHa !== null ? m.yieldTonnesHa.toFixed(2) : 'N/A',
        m.baselineYieldTonnesHa !== null ? m.baselineYieldTonnesHa.toFixed(2) : 'N/A',
        m.yieldAnomalyPct !== null ? `${m.yieldAnomalyPct.toFixed(1)}%` : 'N/A',
        m.failureEvent !== null ? m.failureEvent : 'N/A',
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
      {/* 1. Header Bar */}
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
          {/* Year selector (active in Historical and Model Pred modes) */}
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
              <span className="text-amber-400 font-bold">Prospective Forecasting Research Status</span>
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
              onClick={() => {
                setOperatingMode('model_pred');
                if (selectedYear < 2019) setSelectedYear(2022);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                operatingMode === 'model_pred'
                  ? 'bg-[#0E281F] text-[#4ADE80] font-semibold border border-[#1B4B38] shadow-xs'
                  : 'text-[#7A9187] hover:text-white'
              }`}
            >
              Model Prediction (CNN-LSTM)
            </button>
            <button
              onClick={() => setOperatingMode('future_elnino')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                operatingMode === 'future_elnino'
                  ? 'bg-[#1C2818] text-[#EAB308] font-bold border border-[#445E20] shadow-xs'
                  : 'text-[#8AA870] hover:text-white'
              }`}
            >
              Future El Niño
            </button>
          </div>

          <button
            onClick={handleDownloadCsv}
            disabled={isFuture}
            className="p-2 rounded-xl bg-[#0B1A14] border border-[#173026] text-[#A4B8AF] hover:text-white hover:border-[#22C55E] disabled:opacity-40 transition-all cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-4 h-4 text-[#22C55E]" />
          </button>
        </div>
      </div>

      {/* Restrained 1-line Model Status Pill in Model Prediction Mode */}
      {isModelPred && (
        <div className={`px-4 py-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono ${
          isYearSupported
            ? 'bg-[#091D15] border-[#164332] text-[#4ADE80]'
            : 'bg-[#1C1A0E] border-[#534319] text-amber-400'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span>
              {isYearSupported ? (
                <>
                  <strong className="text-white">Active Neural Model Inference:</strong> Evaluated from trained PyTorch checkpoint (<code className="text-white">crop_failure_model.pt</code>, 11,081 parameters) across 20 Sentinel-2 monitored districts.
                </>
              ) : (
                <>
                  <strong className="text-white">Unsupported Season:</strong> Multi-spectral Sentinel-2 satellite patches were exported for Kharif years 2019–2022. Select 2019–2022 or switch to Historical (DES) mode for observed yield records.
                </>
              )}
            </span>
          </div>
          <span className="text-[11px] text-[#80978E] hidden md:inline">
            Full parameter inspection available in CNN-LSTM Network tab
          </span>
        </div>
      )}

      {/* FUTURE EL NIÑO VIEW: Dedicated Authoritative Research Status View */}
      {isFuture ? (
        <div className="bg-[#091410] border border-[#14261F] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1C2412] border border-[#3A4E20] flex items-center justify-center text-[#EAB308] shrink-0">
              <Compass className="w-6 h-6 text-[#EAB308]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2A230A] text-[#EAB308] border border-[#594715]">
                  Research Feasibility Audit
                </span>
                <span className="text-xs text-[#80978E] font-mono">
                  Future-Season Prospective Forecasting
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Prospective Crop Failure Forecasting Status
              </h2>
              <p className="text-xs sm:text-sm text-[#A4B8AF] leading-relaxed max-w-4xl">
                Prospective future-season crop failure prediction is currently <strong className="text-white">non-operational</strong>. The spatiotemporal CNN-LSTM architecture requires genuine observed multi-spectral satellite rasters, gridded IMD rainfall records, and Pacific SST anomalies. These empirical prerequisites cannot be fabricated in advance without compromising scientific integrity.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#060D0A] border border-[#14261F] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#38BDF8]">
                <Layers className="w-4 h-4" />
                <span>Sentinel-2 Satellite Imagery</span>
              </div>
              <p className="text-xs text-[#80978E] leading-relaxed">
                The 2D-CNN spatial encoder strictly ingests 6 bi-weekly 8-band 32&times;32 surface reflectance patches spanning June 1 to August 31. Prospective seasons lack satellite acquisitions; synthetic rasters would distort feature representations.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#060D0A] border border-[#14261F] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#38BDF8]">
                <CloudRain className="w-4 h-4" />
                <span>Gridded IMD Monsoon Rainfall</span>
              </div>
              <p className="text-xs text-[#80978E] leading-relaxed">
                The temporal BiLSTM core requires cumulative monsoon rainfall and district-level departure percentages up to the August 31 evaluation cutoff. Seasonal monsoon totals cannot be deterministically inferred prior to observations.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#060D0A] border border-[#14261F] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#EAB308]">
                <Thermometer className="w-4 h-4" />
                <span>Domain Shift & ENSO Extrapolation</span>
              </div>
              <p className="text-xs text-[#80978E] leading-relaxed">
                The trained checkpoint was calibrated on Kharif 2019–2022 (ENSO Neutral and La Niña conditions). Extrapolating directly to severe El Niño events (+1.5°C to +2.0°C ONI) requires domain adaptation and physical climate ensemble modeling.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1A14] border border-[#1B4B38] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#A4B8AF]">
              To evaluate verified empirical data, inspect observed records under <strong className="text-white">Historical (DES)</strong> or model predictions under <strong className="text-[#4ADE80]">Model Prediction (CNN-LSTM)</strong>.
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setOperatingMode('historical')}
                className="px-4 py-2 rounded-xl bg-[#0E281F] hover:bg-[#163E30] text-white text-xs font-mono font-bold border border-[#22C55E]/40 transition-colors cursor-pointer"
              >
                View Historical (DES)
              </button>
              <button
                onClick={() => {
                  setOperatingMode('model_pred');
                  setSelectedYear(2022);
                }}
                className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#1EA850] text-[#051A11] text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                View Model Predictions (2019–22)
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Compact 6-Card KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* Card 1: Total Districts */}
            <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] text-[#7A9187] font-medium block">
                  {isModelPred ? 'Monitored Districts' : 'Total Districts'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white">
                    {isModelPred ? modelTotalMonitoredDistricts : historicalTotalDistricts}
                  </span>
                  <span className="text-[10px] text-[#7A9187] font-mono">
                    {isModelPred ? 'of 24 rice districts' : 'Rice-growing'}
                  </span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#0D241B] border border-[#173D2C] flex items-center justify-center text-[#22C55E]">
                <Sprout className="w-5 h-5 text-[#22C55E]" />
              </div>
            </div>

            {/* Card 2: Failure Districts / High Risk */}
            <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] text-[#7A9187] font-medium block">
                  {isModelPred ? 'Model High Risk' : 'Failure Districts'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className={`font-bold font-mono ${
                    isModelPred
                      ? isYearSupported ? 'text-2xl text-[#D93838]' : 'text-sm text-amber-400'
                      : 'text-2xl text-[#D93838]'
                  }`}>
                    {isModelPred
                      ? isYearSupported ? modelPredFailureCount : 'Unavailable'
                      : historicalFailureCount}
                  </span>
                  {isModelPred ? (
                    isYearSupported && modelPredFailureCount !== null ? (
                      <span className="text-[11px] font-bold text-[#D93838] font-mono">
                        {Math.round((modelPredFailureCount / modelTotalMonitoredDistricts) * 100)}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-mono">2019–22 only</span>
                    )
                  ) : (
                    <span className="text-[11px] font-bold text-[#D93838] font-mono">
                      {Math.round((historicalFailureCount / historicalTotalDistricts) * 100)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#281313] border border-[#4D1D1D] flex items-center justify-center text-[#D93838]">
                <ShieldAlert className="w-5 h-5 text-[#D93838]" />
              </div>
            </div>

            {/* Card 3: Resilient Districts / Low Risk */}
            <div className="p-3.5 rounded-xl bg-[#091410] border border-[#14261F] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] text-[#7A9187] font-medium block">
                  {isModelPred ? 'Model Low Risk' : 'Resilient Districts'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className={`font-bold font-mono ${
                    isModelPred
                      ? isYearSupported ? 'text-2xl text-white' : 'text-sm text-amber-400'
                      : 'text-2xl text-white'
                  }`}>
                    {isModelPred
                      ? isYearSupported ? modelPredResilientCount : 'Unavailable'
                      : historicalResilientCount}
                  </span>
                  {isModelPred ? (
                    isYearSupported && modelPredResilientCount !== null ? (
                      <span className="text-[11px] font-bold text-[#22C55E] font-mono">
                        {Math.round((modelPredResilientCount / modelTotalMonitoredDistricts) * 100)}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-mono">2019–22 only</span>
                    )
                  ) : (
                    <span className="text-[11px] font-bold text-[#22C55E] font-mono">
                      {Math.round((historicalResilientCount / historicalTotalDistricts) * 100)}%
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
                    {avgHistoricalRainfall !== null ? `${avgHistoricalRainfall.toLocaleString()} mm` : 'N/A'}
                  </span>
                </div>
                <span className="text-[10px] text-[#6A8177] font-mono block">Rice Belt Seasonal Mean</span>
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
                    {oniInfo
                      ? `${oniInfo.meanEarlyWarningSstAnomaly > 0 ? '+' : ''}${oniInfo.meanEarlyWarningSstAnomaly.toFixed(1)}°C`
                      : 'N/A'}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold font-mono block ${
                    oniInfo?.elNinoIndicator === 1 ? 'text-[#D93838]' : 'text-[#22C55E]'
                  }`}
                >
                  {oniInfo?.ensoPhase || 'Neutral'}
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
                      {isModelPred
                        ? isYearSupported
                          ? `Trained CNN-LSTM Model Predictions — Kharif ${yearStr}`
                          : `CNN-LSTM Predictions Unavailable — Kharif ${yearStr}`
                        : `Observed Crop Failure Ground Truth — Kharif ${yearStr}`}
                    </h2>
                    <p className="text-xs text-[#80978E] mt-0.5">
                      {isModelPred
                        ? isYearSupported
                          ? 'Model outputs evaluated on 6-window Sentinel-2 multi-spectral rasters & gridded IMD rainfall'
                          : 'Multi-spectral Sentinel-2 satellite patches are available for 2019–2022 only.'
                        : 'District-wise classification based on >10% yield deficit below historical 5-year baseline'}
                    </p>
                  </div>

                  {/* Map Legend */}
                  <div className="flex items-center gap-3 text-xs font-mono shrink-0 flex-wrap">
                    {isModelPred ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#D93838]" />
                          <span className="text-[#D93838] font-medium">High Risk (P &ge; 50%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                          <span className="text-[#F59E0B] font-medium">Moderate (33–50%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1E8E5A]" />
                          <span className="text-[#22C55E] font-medium">Low Risk (&lt; 33%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#14221C]" />
                          <span className="text-[#7A9187]">Not Monitored</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#D93838]" />
                          <span className="text-[#D93838] font-medium">Failure (Deficit &gt; 10%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1E8E5A]" />
                          <span className="text-[#22C55E] font-medium">Resilient (&le; 10%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#14221C]" />
                          <span className="text-[#7A9187]">Non-Rice District</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Map Canvas with Satellite/Terrain Dark Background Texture */}
                <div
                  ref={mapContainerRef}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`w-full relative flex items-center justify-center py-4 px-2 overflow-hidden min-h-[460px] sm:min-h-[520px] rounded-xl my-1 select-none ${
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
                    <div className="px-1 py-0.5 rounded-md bg-[#0C1B15]/90 border border-[#163327] text-[9px] font-mono text-[#7A9187] text-center select-none shadow-xs">
                      {Math.round(zoomLevel * 100)}%
                    </div>
                  </div>

                  {/* Top-Right Interactive Navigation Hint */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-20 pointer-events-none select-none">
                    <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0C1B15]/90 border border-[#163327] text-[10px] font-mono text-[#849B90] backdrop-blur-xs shadow-md">
                      <span className="text-[#22C55E] font-medium">Pan: Drag</span>
                      <span className="text-[#2C4A3C]">·</span>
                      <span>Zoom: Scroll Wheel</span>
                      <span className="text-[#2C4A3C]">·</span>
                      <span>Select: Click District</span>
                    </div>
                  </div>

                  {/* Bottom-Left Compass & Scale Bar */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-4 z-20 pointer-events-none select-none">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-mono font-bold text-[#22C55E]">▲ N</span>
                    </div>
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
                    <g>
                      {MAHARASHTRA_GEOJSON_POLYGONS.map(poly => {
                        const isSelected = selectedDistrictId === poly.id;
                        const isHovered = hoveredDistrictId === poly.id;
                        const fillColor = getDistrictFill(poly.id);
                        const labelInfo = getDistrictLabel(poly, zoomLevel);

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
                              strokeWidth={isSelected ? 2.0 : isHovered ? 1.5 : 0.7}
                              strokeLinejoin="round"
                              strokeLinecap="round"
                              className="transition-colors"
                            />

                            {/* Collision-Aware District Label */}
                            {labelInfo && (
                              <text
                                x={labelInfo.x}
                                y={labelInfo.y}
                                fill={isSelected ? '#38BDF8' : '#F1F5F3'}
                                fontSize={isSelected ? '9.5' : '8'}
                                fontWeight={isSelected ? '700' : '600'}
                                fontFamily="sans-serif"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                pointerEvents="none"
                                style={{
                                  textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 2px #000',
                                }}
                              >
                                {labelInfo.text}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </g>
                  </svg>
                </div>
              </div>

              {/* Bottom Row under Map */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Card: Rice Yield Trend (Dynamically computed averages 2015-2022) */}
                <div className="p-4 rounded-2xl bg-[#091410] border border-[#14261F] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Rice Belt Mean Rainfall & Yield Trend</span>
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className="flex items-center gap-1 text-[#38BDF8]">
                        <span className="w-2 h-2 rounded-xs bg-[#0284C7]"></span>
                        Avg Rain (mm)
                      </span>
                      <span className="flex items-center gap-1 text-[#22C55E]">
                        <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                        Avg Yield (t/ha)
                      </span>
                    </div>
                  </div>

                  {/* Dual-axis mini chart */}
                  <div className="h-28 flex items-end justify-between gap-2 pt-2 px-1 border-b border-[#14261F]">
                    {yearlyHistoricalAverages.map(item => {
                      const rainHeight = Math.min(100, Math.max(15, Math.round((item.rain / 1400) * 100)));
                      const isCurrent = item.yr === String(selectedYear);
                      return (
                        <div
                          key={item.yr}
                          onClick={() => setSelectedYear(Number(item.yr))}
                          className="flex-1 flex flex-col items-center gap-1 h-full justify-end cursor-pointer group"
                        >
                          <div className="w-full flex items-end justify-center h-full">
                            <div
                              className={`w-3/4 rounded-t transition-all ${
                                isCurrent ? 'bg-[#38BDF8]' : 'bg-[#0284C7]/50 group-hover:bg-[#0284C7]/80'
                              }`}
                              style={{ height: `${rainHeight}%` }}
                              title={`${item.yr}: ${item.rain} mm | ${item.yield} t/ha`}
                            />
                          </div>
                          <span className={`text-[9px] font-mono ${isCurrent ? 'text-[#38BDF8] font-bold' : 'text-[#7A9187]'}`}>
                            {item.yr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#7A9187]">
                    <span>Kharif Season Cycles (2015–2022)</span>
                    <span className="text-white font-medium">Selected: {selectedYear} ({avgHistoricalRainfall ?? 'N/A'} mm)</span>
                  </div>
                </div>

                {/* Right Card: Seasonal Climate Summary for selected year */}
                <div className="p-4 rounded-2xl bg-[#091410] border border-[#14261F] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Seasonal Climate Indices ({yearStr})</span>
                    <span className="text-[10px] font-mono text-[#80978E]">NOAA CPC & IMD Observations</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#14261F] space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-[#7A9187] font-medium">
                        <CloudRain className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span className="truncate">Rice Belt Rain</span>
                      </div>
                      <div className="text-base font-bold font-mono text-white">
                        {avgHistoricalRainfall !== null ? `${avgHistoricalRainfall} mm` : 'N/A'}
                      </div>
                      <div className="text-[10px] text-[#80978E] font-mono">
                        June–August
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#14261F] space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-[#7A9187] font-medium">
                        <Thermometer className="w-3.5 h-3.5 text-[#D93838]" />
                        <span className="truncate">El Niño (ONI)</span>
                      </div>
                      <div className="text-base font-bold font-mono text-white">
                        {oniInfo ? `${oniInfo.meanEarlyWarningSstAnomaly > 0 ? '+' : ''}${oniInfo.meanEarlyWarningSstAnomaly.toFixed(1)}°C` : 'N/A'}
                      </div>
                      <div className={`text-[10px] font-bold font-mono ${oniInfo?.elNinoIndicator === 1 ? 'text-[#D93838]' : 'text-[#22C55E]'}`}>
                        {oniInfo?.ensoPhase || 'Neutral'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#14261F] space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-[#7A9187] font-medium">
                        <Sprout className="w-3.5 h-3.5 text-[#22C55E]" />
                        <span className="truncate">Spatial Scope</span>
                      </div>
                      <div className="text-base font-bold font-mono text-white">
                        {isModelPred ? '20 Dist.' : '24 Dist.'}
                      </div>
                      <div className="text-[10px] text-[#80978E] font-mono">
                        {isModelPred ? 'Sentinel-2 Grid' : 'Primary Rice'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (approx 35% on desktop): District Insights Panel */}
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

                {/* District Title & Mode Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">{selectedDistrictInfo.name}</h3>
                    <span className="text-xs text-[#80978E] font-medium block mt-0.5">
                      {selectedDistrictInfo.division} Division &bull; {selectedDistrictInfo.agroZone}
                    </span>
                  </div>

                  {/* Badge: Explicit Mode Separation (DES Ground Truth vs. Neural Prediction) */}
                  {isModelPred ? (
                    (() => {
                      if (!isYearSupported) {
                        return (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 shrink-0 bg-[#14221C] text-[#849B90] border border-[#213F33]">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>UNSUPPORTED (2019–22)</span>
                          </span>
                        );
                      }
                      if (!selectedDistrictModelPred || selectedDistrictModelPred.predictionStatus !== 'READY') {
                        return (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 shrink-0 bg-[#14221C] text-[#849B90] border border-[#213F33]">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>NOT MONITORED</span>
                          </span>
                        );
                      }
                      if (selectedDistrictModelPred.riskCategory === 'High') {
                        return (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 shrink-0 bg-[#2E1212] text-[#EF4444] border border-[#591C1C]">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>HIGH RISK ({Math.round((selectedDistrictModelPred.failureProbability || 0) * 100)}%)</span>
                          </span>
                        );
                      }
                      if (selectedDistrictModelPred.riskCategory === 'Moderate') {
                        return (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 shrink-0 bg-[#2B1D0E] text-[#F59E0B] border border-[#5E3E18]">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>MODERATE ({Math.round((selectedDistrictModelPred.failureProbability || 0) * 100)}%)</span>
                          </span>
                        );
                      }
                      return (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 shrink-0 bg-[#0E281F] text-[#22C55E] border border-[#1B4B38]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>LOW RISK ({Math.round((selectedDistrictModelPred.failureProbability || 0) * 100)}%)</span>
                        </span>
                      );
                    })()
                  ) : (
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 shrink-0 ${
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

                {/* 2x2 Metric Grid: Spacious and Cleanly Formatted without text overflow */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {/* Metric 1 */}
                  <div className="p-3 rounded-xl bg-[#060D0A] border border-[#14261F]">
                    <span className="text-[10px] text-[#7A9187] uppercase font-mono block">
                      {isModelPred ? 'Model Risk Score' : 'Observed Yield'}
                    </span>
                    <span className="text-base sm:text-lg font-bold font-mono text-white block mt-1">
                      {isModelPred
                        ? selectedDistrictModelPred?.failureProbability !== null && selectedDistrictModelPred?.failureProbability !== undefined
                          ? selectedDistrictModelPred.failureProbability.toFixed(3)
                          : 'N/A'
                        : selectedDistrictHistoricalMetric?.yieldTonnesHa !== null && selectedDistrictHistoricalMetric?.yieldTonnesHa !== undefined
                        ? `${selectedDistrictHistoricalMetric.yieldTonnesHa.toFixed(2)} t/ha`
                        : 'N/A'}
                    </span>
                    <span className="text-[9px] text-[#5A7167] font-mono block mt-0.5">
                      {isModelPred ? 'Sigmoid P(failure)' : 'Harvest yield (DES)'}
                    </span>
                  </div>

                  {/* Metric 2 */}
                  <div className="p-3 rounded-xl bg-[#060D0A] border border-[#14261F]">
                    <span className="text-[10px] text-[#7A9187] uppercase font-mono block">
                      {isModelPred ? 'Risk Category' : '5-Yr Baseline Yield'}
                    </span>
                    <span className={`text-base sm:text-lg font-bold font-mono block mt-1 ${
                      isModelPred
                        ? selectedDistrictModelPred?.riskCategory === 'High'
                          ? 'text-[#D93838]'
                          : selectedDistrictModelPred?.riskCategory === 'Moderate'
                          ? 'text-[#F59E0B]'
                          : selectedDistrictModelPred?.riskCategory === 'Low'
                          ? 'text-[#22C55E]'
                          : 'text-[#80978E]'
                        : 'text-white'
                    }`}>
                      {isModelPred
                        ? selectedDistrictModelPred?.riskCategory || 'Unavailable'
                        : selectedDistrictHistoricalMetric?.baselineYieldTonnesHa !== null && selectedDistrictHistoricalMetric?.baselineYieldTonnesHa !== undefined
                        ? `${selectedDistrictHistoricalMetric.baselineYieldTonnesHa.toFixed(2)} t/ha`
                        : 'N/A'}
                    </span>
                    <span className="text-[9px] text-[#5A7167] font-mono block mt-0.5">
                      {isModelPred ? 'Inference classification' : 'Zero-leakage prior mean'}
                    </span>
                  </div>

                  {/* Metric 3 */}
                  <div className="p-3 rounded-xl bg-[#060D0A] border border-[#14261F]">
                    <span className="text-[10px] text-[#7A9187] uppercase font-mono block">
                      {isModelPred ? 'Sampled Patches' : 'Yield Departure'}
                    </span>
                    <span
                      className={`text-base sm:text-lg font-bold font-mono block mt-1 ${
                        isModelPred
                          ? 'text-white'
                          : (selectedDistrictHistoricalMetric?.yieldAnomalyPct ?? 0) < -10
                          ? 'text-[#D93838]'
                          : 'text-[#22C55E]'
                      }`}
                    >
                      {isModelPred
                        ? selectedDistrictModelPred?.provenance?.sampledLocations
                          ? `${selectedDistrictModelPred.provenance.sampledLocations} patches`
                          : 'N/A'
                        : selectedDistrictHistoricalMetric?.yieldAnomalyPct !== null && selectedDistrictHistoricalMetric?.yieldAnomalyPct !== undefined
                        ? `${selectedDistrictHistoricalMetric.yieldAnomalyPct > 0 ? '+' : ''}${selectedDistrictHistoricalMetric.yieldAnomalyPct.toFixed(1)}%`
                        : 'N/A'}
                    </span>
                    <span className="text-[9px] text-[#5A7167] font-mono block mt-0.5">
                      {isModelPred ? 'Sentinel-2 rasters' : 'vs. 5-yr baseline'}
                    </span>
                  </div>

                  {/* Metric 4 */}
                  <div className="p-3 rounded-xl bg-[#060D0A] border border-[#14261F]">
                    <span className="text-[10px] text-[#7A9187] uppercase font-mono block">
                      {isModelPred ? 'Pixel Coverage' : 'Monsoon Rainfall'}
                    </span>
                    <span className="text-base sm:text-lg font-bold font-mono text-white block mt-1">
                      {isModelPred
                        ? selectedDistrictModelPred?.provenance?.meanValidPixelFraction !== undefined
                          ? `${Math.round(selectedDistrictModelPred.provenance.meanValidPixelFraction * 100)}% valid`
                          : 'N/A'
                        : selectedDistrictHistoricalMetric?.rainfallMm !== null && selectedDistrictHistoricalMetric?.rainfallMm !== undefined
                        ? `${Math.round(selectedDistrictHistoricalMetric.rainfallMm).toLocaleString()} mm`
                        : 'N/A'}
                    </span>
                    <span className="text-[9px] text-[#5A7167] font-mono block mt-0.5">
                      {isModelPred ? 'Cloud-filtered raster pixels' : 'Gridded IMD 0.25°'}
                    </span>
                  </div>
                </div>

                {/* Key Environmental Observations */}
                <div className="space-y-2 pt-2 border-t border-[#14261F]">
                  <span className="text-xs font-bold text-white block">Environmental Observations</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#14261F] flex flex-col justify-between">
                      <div className="flex items-center gap-1 text-[#38BDF8]">
                        <CloudRain className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">Rainfall</span>
                      </div>
                      <span className="text-[11px] font-mono text-white mt-1 font-bold">
                        {selectedDistrictHistoricalMetric?.rainfallMm !== null && selectedDistrictHistoricalMetric?.rainfallMm !== undefined
                          ? `${Math.round(selectedDistrictHistoricalMetric.rainfallMm)} mm`
                          : 'N/A'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#14261F] flex flex-col justify-between">
                      <div className="flex items-center gap-1 text-[#D93838]">
                        <Thermometer className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">El Niño</span>
                      </div>
                      <span className="text-[11px] font-mono text-white mt-1 font-bold">
                        {oniInfo ? `${oniInfo.meanEarlyWarningSstAnomaly > 0 ? '+' : ''}${oniInfo.meanEarlyWarningSstAnomaly.toFixed(1)}°C` : 'N/A'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#060D0A] border border-[#14261F] flex flex-col justify-between">
                      <div className="flex items-center gap-1 text-[#22C55E]">
                        <Sprout className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">Cropland</span>
                      </div>
                      <span className="text-[11px] font-mono text-white mt-1 font-bold">
                        {(selectedDistrictInfo.normalKharifAreaHa / 1000).toFixed(0)}k ha
                      </span>
                    </div>
                  </div>
                </div>

                {/* District Comparison Table */}
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

                  <div className="overflow-x-auto max-h-44 border border-[#14261F] rounded-xl bg-[#060D0A]">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-[#091410] text-[#7A9187] sticky top-0 border-b border-[#14261F]">
                        <tr>
                          <th className="py-2 px-2.5 font-sans">District</th>
                          <th className="py-2 px-2 text-right">{isModelPred ? 'Risk Score' : 'Yield'}</th>
                          <th className="py-2 px-2 text-right">{isModelPred ? 'Category' : 'Baseline'}</th>
                          <th className="py-2 px-2 text-right">{isModelPred ? 'Patches' : 'Departure'}</th>
                          <th className="py-2 px-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#14261F]">
                        {comparisonDistricts.slice(0, 7).map(d => {
                          const metric = currentYearMetrics[d.id];
                          const modelPred = inSeasonModelPredictions[d.id];
                          const isFail = isModelPred
                            ? modelPred?.isFailure
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
                                {isModelPred
                                  ? modelPred?.failureProbability !== null && modelPred?.failureProbability !== undefined
                                    ? modelPred.failureProbability.toFixed(3)
                                    : 'N/A'
                                  : metric?.yieldTonnesHa !== null && metric?.yieldTonnesHa !== undefined
                                  ? metric.yieldTonnesHa.toFixed(2)
                                  : 'N/A'}
                              </td>
                              <td className="py-2 px-2 text-right text-[#7A9187]">
                                {isModelPred
                                  ? modelPred?.riskCategory || 'N/A'
                                  : metric?.baselineYieldTonnesHa !== null && metric?.baselineYieldTonnesHa !== undefined
                                  ? metric.baselineYieldTonnesHa.toFixed(2)
                                  : 'N/A'}
                              </td>
                              <td
                                className={`py-2 px-2 text-right font-bold ${
                                  isFail ? 'text-[#D93838]' : 'text-[#22C55E]'
                                }`}
                              >
                                {isModelPred
                                  ? modelPred?.provenance?.sampledLocations ?? 'N/A'
                                  : metric?.yieldAnomalyPct !== null && metric?.yieldAnomalyPct !== undefined
                                  ? `${metric.yieldAnomalyPct > 0 ? '+' : ''}${metric.yieldAnomalyPct.toFixed(1)}%`
                                  : 'N/A'}
                              </td>
                              <td className="py-2 px-2.5 text-center">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    isFail
                                      ? 'bg-[#2E1212] text-[#D93838]'
                                      : isModelPred && modelPred?.predictionStatus !== 'READY'
                                      ? 'bg-[#14221C] text-[#849B90]'
                                      : 'bg-[#0E281F] text-[#22C55E]'
                                  }`}
                                >
                                  {isModelPred
                                    ? modelPred?.riskCategory || 'Unsampled'
                                    : isFail
                                    ? 'Failure'
                                    : 'Resilient'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Region-wise Status Breakdown */}
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
                            {stats.unsupported ? (
                              <span className="text-amber-400">2019–22 only</span>
                            ) : (
                              <span>{stats.failurePct}% Failure / {stats.resilientPct}% Resilient</span>
                            )}
                          </div>
                          <div className="h-2 w-full rounded-full bg-[#060D0A] flex overflow-hidden border border-[#14261F]">
                            {stats.unsupported ? (
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
        </>
      )}
    </div>
  );
};
