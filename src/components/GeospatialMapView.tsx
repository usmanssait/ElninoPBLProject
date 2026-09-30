import React, { useState, useRef } from 'react';
import {
  MAHARASHTRA_DISTRICTS,
  PRIMARY_RICE_DISTRICTS,
  resolveCanonicalDistrict,
  DistrictInfo,
} from '../data/canonicalDistricts';
import {
  MAHARASHTRA_DISTRICT_POLYGONS,
  ALL_YEAR_METRICS,
  DistrictYearMetric,
  getRainfallColor,
  getYieldColor,
  getEventAnomalyColor,
  getEventDiscreteColor,
} from '../data/maharashtraMapData';
import { NOAA_CPC_ONI_RECORDS } from '../data/oniElNinoData';
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
} from 'lucide-react';

type MapMode = 'events' | 'rainfall' | 'yield';

export const GeospatialMapView: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2015);
  const [mapMode, setMapMode] = useState<MapMode>('events');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('bhandara');
  const [hoveredDistrictId, setHoveredDistrictId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const availableYears = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];
  const yearStr = `${selectedYear}-${String(selectedYear + 1).slice(-2)}`;
  const oniInfo = NOAA_CPC_ONI_RECORDS.find(r => r.year === selectedYear);

  const currentYearMetrics = ALL_YEAR_METRICS[selectedYear] || {};
  const selectedDistrictInfo =
    MAHARASHTRA_DISTRICTS.find(d => d.id === selectedDistrictId) || PRIMARY_RICE_DISTRICTS[0];
  const selectedDistrictMetric = currentYearMetrics[selectedDistrictId];

  // Active hover district info for telemetry & tooltip
  const activeDistrictId = hoveredDistrictId || selectedDistrictId;
  const activeDistrictInfo =
    MAHARASHTRA_DISTRICTS.find(d => d.id === activeDistrictId) || selectedDistrictInfo;
  const activeDistrictMetric = currentYearMetrics[activeDistrictId];

  // Division list for filtering
  const divisions = ['all', 'Konkan', 'Nashik', 'Pune', 'Marathwada', 'Amravati', 'Nagpur'];

  // Filtered districts matching search or division
  const filteredDistricts = MAHARASHTRA_DISTRICTS.filter(d => {
    if (divisionFilter !== 'all' && d.division !== divisionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return d.name.toLowerCase().includes(q) || d.aliases.some(a => a.toLowerCase().includes(q));
    }
    return true;
  });

  // Calculate Statewide Summary KPIs
  const riceDistrictsList = PRIMARY_RICE_DISTRICTS.map(d => currentYearMetrics[d.id]).filter(Boolean);
  const failureCount = riceDistrictsList.filter(m => m.failureEvent === 1).length;
  const avgRainfall = Math.round(
    riceDistrictsList.reduce((acc, m) => acc + m.rainfallMm, 0) / (riceDistrictsList.length || 1)
  );
  const avgYield = (
    riceDistrictsList.reduce((acc, m) => acc + m.yieldTonnesHa, 0) / (riceDistrictsList.length || 1)
  ).toFixed(2);
  const avgAnomaly = (
    riceDistrictsList.reduce((acc, m) => acc + m.yieldAnomalyPct, 0) / (riceDistrictsList.length || 1)
  ).toFixed(1);

  // Colormap helper for a given district
  const getDistrictFill = (distId: string, mode: MapMode): string => {
    const metric = currentYearMetrics[distId];
    if (!metric) return '#1A2229';

    if (mode === 'rainfall') {
      return getRainfallColor(metric.rainfallMm);
    } else if (mode === 'yield') {
      if (!metric.isRiceProducer) return '#161D24';
      return getYieldColor(metric.yieldTonnesHa);
    } else if (mode === 'events') {
      if (!metric.isRiceProducer) return '#161D24';
      return metric.failureEvent === 1 ? '#DC2626' : '#15803D';
    }
    return '#1A2229';
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.3, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.3, 1));
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleDownloadCsv = () => {
    const headers = [
      'district_id',
      'district_name',
      'division',
      'crop_year',
      'rainfall_mm',
      'yield_t_per_ha',
      'baseline_yield_t_per_ha',
      'yield_anomaly_pct',
      'crop_failure_event',
      'enso_phase',
    ];
    const rows = Object.values(currentYearMetrics).map(m => [
      m.districtId,
      m.districtName,
      m.division,
      m.cropYearStr,
      m.rainfallMm,
      m.yieldTonnesHa,
      m.baselineYieldTonnesHa,
      m.yieldAnomalyPct,
      m.failureEvent,
      `"${m.ensoPhase}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maharashtra_crop_events_${yearStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Executive Dashboard Header */}
      <div className="bg-[#131920] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="font-semibold uppercase tracking-wider">Maharashtra Kharif Rice Framework</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400">Multi-Modal Climate & Crop Failure Monitoring</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Maharashtra District Risk & Yield Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Integrates Directorate of Economics and Statistics (DES) agricultural statistics, India Meteorological Department (IMD) 0.25° gridded monsoon rainfall NetCDF series, and NOAA CPC Oceanic Niño Index records across 36 districts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-slate-800/90 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-all cursor-pointer shadow-xs"
              title="Download consolidated district events as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Kharif Year Selector & Pacific ENSO Macro Climate Ribbon */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mr-1 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              KHARIF YEAR:
            </span>
            <div className="flex items-center gap-1 bg-[#0B0F14] p-1 rounded-xl border border-slate-800">
              {availableYears.map(yr => {
                const isSelected = yr === selectedYear;
                return (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {yr}-{String(yr + 1).slice(-2)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ENSO Status */}
          {oniInfo && (
            <div className="flex items-center gap-2.5 text-xs font-mono bg-[#0B0F14] px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-slate-400">PACIFIC ENSO:</span>
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
                {oniInfo.meanEarlyWarningSstAnomaly.toFixed(2)}°C SST)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Statewide KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Failure Count */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between uppercase">
            <span>Crop Failure Events</span>
            <ShieldAlert className={`w-4 h-4 ${failureCount > 6 ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
                failureCount > 6 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {failureCount} / {PRIMARY_RICE_DISTRICTS.length}
            </span>
            <span className="text-xs text-slate-500 font-mono">districts</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {failureCount > 6 ? 'Severe drought failure triggered' : 'Favorable agricultural resilience'}
          </p>
        </div>

        {/* KPI 2: Mean Yield Departure */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between uppercase">
            <span>Mean Yield Departure</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
                Number(avgAnomaly) < -5 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {Number(avgAnomaly) > 0 ? `+${avgAnomaly}` : avgAnomaly}%
            </span>
            <span className="text-xs text-slate-500 font-mono">vs prior baseline</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Zero-leakage historical prior mean</p>
        </div>

        {/* KPI 3: Monsoon Rainfall */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between uppercase">
            <span>IMD Monsoon Rainfall</span>
            <CloudRain className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
              {avgRainfall.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-mono">mm</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">June 1 – October 31 Kharif total</p>
        </div>

        {/* KPI 4: Mean Rice Yield */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131920] border border-slate-800 shadow-xs">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between uppercase">
            <span>Mean Rice Yield</span>
            <Sprout className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">{avgYield}</span>
            <span className="text-xs text-slate-500 font-mono">t/ha</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Verified DES Kharif statistics</p>
        </div>
      </div>

      {/* 3. The Core Geospatial Map & Telemetry Dashboard */}
      <div className="bg-[#131920] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        {/* Layer Mode Selector & Quick Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          {/* Layer Mode Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto bg-[#0B0F14] p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setMapMode('events')}
              className={`px-3.5 py-1.5 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                mapMode === 'events'
                  ? 'bg-rose-950/80 border border-rose-500/60 text-rose-200 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Crop Failure Events</span>
            </button>

            <button
              onClick={() => setMapMode('rainfall')}
              className={`px-3.5 py-1.5 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                mapMode === 'rainfall'
                  ? 'bg-sky-950/80 border border-sky-500/60 text-sky-200 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5 text-sky-400" />
              <span>Monsoon Rainfall</span>
            </button>

            <button
              onClick={() => setMapMode('yield')}
              className={`px-3.5 py-1.5 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                mapMode === 'yield'
                  ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sprout className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rice Yield (t/ha)</span>
            </button>
          </div>

          {/* Quick District Search */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                const res = resolveCanonicalDistrict(e.target.value);
                if (res) setSelectedDistrictId(res.id);
              }}
              placeholder="Search Maharashtra district..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#0B0F14] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Prominent Map Stage & Telemetry Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map Viewport Area (7 cols on large screens) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-[#0B0F14] border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-inner">
              {/* Cartographic Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-2 border-b border-slate-800 text-xs font-mono gap-2">
                <div className="font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {mapMode === 'events' && `Crop Failure Risk Classification — Kharif ${yearStr}`}
                    {mapMode === 'rainfall' && `IMD Gridded Rainfall (0.25°) — Kharif ${yearStr}`}
                    {mapMode === 'yield' && `DES Kharif Rice Yield (t/ha) — Kharif ${yearStr}`}
                  </span>
                </div>

                {/* Map Controls & Dynamic Legend */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {mapMode === 'events' ? (
                    <div className="flex items-center gap-3 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]"></span>
                        <span className="text-slate-300">Resilient</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span>
                        <span className="text-rose-400 font-semibold">Failure (&lt; -10%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#161D24]"></span>
                        <span className="text-slate-500">Non-Rice</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <div
                        className="h-2 w-32 rounded-xs border border-slate-700 overflow-hidden"
                        style={{
                          background:
                            mapMode === 'rainfall'
                              ? 'linear-gradient(to right, #ECE8F2, #C7BCD7, #A99BBE, #71658C)'
                              : 'linear-gradient(to right, #F1E9BF, #D3D291, #A9AE6A, #8B8C5A)',
                        }}
                      />
                      <div className="flex justify-between w-32 text-[9px] font-mono text-slate-400 mt-0.5">
                        <span>{mapMode === 'rainfall' ? '300 mm' : '0.8 t/ha'}</span>
                        <span>{mapMode === 'rainfall' ? '2,200 mm' : '3.4 t/ha'}</span>
                      </div>
                    </div>
                  )}

                  {/* Zoom controls */}
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

              {/* Centered, Responsive Vector SVG Map */}
              <div className="w-full relative flex items-center justify-center py-2 px-1 overflow-hidden min-h-[380px] sm:min-h-[440px]">
                <svg
                  viewBox="20 15 885 535"
                  preserveAspectRatio="xMidYMid meet"
                  className="w-full h-auto max-h-[480px] transition-transform duration-200 select-none"
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
                    {MAHARASHTRA_DISTRICT_POLYGONS.map(poly => {
                      const isSelected = selectedDistrictId === poly.id;
                      const isHovered = hoveredDistrictId === poly.id;
                      const fillColor = getDistrictFill(poly.id, mapMode);
                      const metric = currentYearMetrics[poly.id];

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
                            strokeWidth={isSelected ? 3 : isHovered ? 2 : 0.9}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            filter={isSelected ? 'url(#glow-selected)' : undefined}
                            className="transition-colors"
                          />

                          {/* Legible District Name */}
                          <text
                            x={poly.center[0]}
                            y={poly.center[1]}
                            fill={isSelected ? '#38BDF8' : '#F8FAFC'}
                            fontSize={isSelected ? '10.5' : '9.5'}
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

                          {/* Failure indicator badge */}
                          {mapMode === 'events' && metric && metric.failureEvent === 1 && (
                            <circle
                              cx={poly.center[0]}
                              cy={poly.center[1] + 11}
                              r="3.5"
                              fill="#EF4444"
                              stroke="#FFFFFF"
                              strokeWidth="1"
                              pointerEvents="none"
                            />
                          )}
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Floating Telemetry Tooltip for Current Hover */}
                {activeDistrictMetric && (
                  <div className="absolute bottom-3 left-3 bg-[#131920]/95 backdrop-blur border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono shadow-xl pointer-events-none z-20 max-w-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-white text-sm">{activeDistrictInfo.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          activeDistrictMetric.failureEvent === 1
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                            : activeDistrictInfo.isRiceProducer
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {activeDistrictMetric.failureEvent === 1
                          ? 'CROP FAILURE'
                          : activeDistrictInfo.isRiceProducer
                          ? 'NORMAL / RESILIENT'
                          : 'NON-RICE'}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-300 flex items-center gap-3">
                      {activeDistrictInfo.isRiceProducer ? (
                        <>
                          <span>Yield: <strong className="text-white">{activeDistrictMetric.yieldTonnesHa} t/ha</strong></span>
                          <span>Anomaly: <strong className={activeDistrictMetric.yieldAnomalyPct < -10 ? 'text-rose-400' : 'text-emerald-400'}>{activeDistrictMetric.yieldAnomalyPct > 0 ? `+${activeDistrictMetric.yieldAnomalyPct}` : activeDistrictMetric.yieldAnomalyPct}%</strong></span>
                        </>
                      ) : (
                        <span className="text-slate-400">Non-paddy agro-climatic region</span>
                      )}
                      <span>Rain: <strong className="text-sky-300">{activeDistrictMetric.rainfallMm} mm</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Subtitle helper guideline */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-3 border-t border-slate-800">
                <span>Click any district polygon or search to inspect full historical telemetry</span>
                <span className="text-emerald-400">36 Districts Reconciled</span>
              </div>
            </div>
          </div>

          {/* Right Telemetry Panel (5 cols on large screens) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#0B0F14] border border-slate-800 rounded-2xl p-5 space-y-5 shadow-inner">
              {/* District Header & Event Status */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                    DISTRICT INSPECTION
                  </span>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{selectedDistrictInfo.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedDistrictInfo.division} Division · {selectedDistrictInfo.agroZone}
                  </p>
                </div>

                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 ${
                    selectedDistrictMetric && selectedDistrictMetric.failureEvent === 1
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/60 shadow-sm'
                      : selectedDistrictInfo.isRiceProducer
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {selectedDistrictMetric && selectedDistrictMetric.failureEvent === 1
                    ? 'CROP FAILURE'
                    : selectedDistrictInfo.isRiceProducer
                    ? 'RESILIENT / NORMAL'
                    : 'NON-RICE'}
                </span>
              </div>

              {/* 4 Core Telemetry Cards */}
              {selectedDistrictMetric && selectedDistrictInfo.isRiceProducer ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#131920] border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Kharif Rice Yield</span>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-xl font-bold font-mono text-white">
                          {selectedDistrictMetric.yieldTonnesHa}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">t/ha</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#131920] border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Historical Baseline</span>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-xl font-bold font-mono text-slate-300">
                          {selectedDistrictMetric.baselineYieldTonnesHa}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">t/ha</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#131920] border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Yield Departure</span>
                      <div className="mt-1 flex items-center gap-1.5">
                        {selectedDistrictMetric.yieldAnomalyPct < -10 ? (
                          <TrendingDown className="w-4 h-4 text-rose-400" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        )}
                        <span
                          className={`text-xl font-bold font-mono ${
                            selectedDistrictMetric.yieldAnomalyPct < -10 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {selectedDistrictMetric.yieldAnomalyPct > 0
                            ? `+${selectedDistrictMetric.yieldAnomalyPct}`
                            : selectedDistrictMetric.yieldAnomalyPct}
                          %
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#131920] border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Monsoon Rainfall</span>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-xl font-bold font-mono text-sky-300">
                          {selectedDistrictMetric.rainfallMm}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">mm</span>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Year Historical Profile Strip (2015-2022) */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-slate-300 font-semibold">
                        8-Year Yield Departure History (2015–2022)
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Click year to switch</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                      {availableYears.map(yr => {
                        const m = ALL_YEAR_METRICS[yr]?.[selectedDistrictId];
                        const isCurrent = yr === selectedYear;
                        if (!m) return null;
                        const isFail = m.failureEvent === 1;

                        return (
                          <button
                            key={yr}
                            onClick={() => setSelectedYear(yr)}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md'
                                : isFail
                                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:border-rose-400'
                                : 'bg-[#131920] border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className={`text-[10px] ${isCurrent ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                              '{String(yr).slice(-2)}
                            </div>
                            <div
                              className={`font-semibold ${
                                isCurrent ? 'text-slate-950' : isFail ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {m.yieldAnomalyPct > 0 ? `+${m.yieldAnomalyPct.toFixed(0)}` : m.yieldAnomalyPct.toFixed(0)}%
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Scientific Cropland Context */}
                  <div className="p-3.5 rounded-xl bg-[#131920] border border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                      <span>Normal Kharif Rice Area:</span>
                      <span className="text-white font-semibold">
                        {selectedDistrictInfo.normalKharifAreaHa.toLocaleString()} ha
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Monitored via <strong className="text-slate-200">ESA WorldCover Class 40 (Cropland purity &ge; 70%)</strong> across verified paddy clusters in {selectedDistrictInfo.name}.
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
                    {selectedDistrictInfo.name} is primarily a cotton, soybean, sugarcane, or pulse cropping region. Select any of the 24 primary rice-producing districts across Konkan or eastern Vidarbha to inspect yield departures.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Maharashtra District Directory Grid */}
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
            const metric = currentYearMetrics[district.id];
            const isFail = metric && metric.failureEvent === 1;

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
                  {district.division}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
