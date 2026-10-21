import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useAppTheme } from '../../context/ThemeContext';
import {
  MAHARASHTRA_GEOJSON_POLYGONS,
  MAHARASHTRA_GEOJSON_VIEWBOX,
  GeoDistrictPolygon,
} from '../../data/maharashtraGeoJsonData';
import { MapControls } from './MapControls';

interface DistrictChoroplethProps {
  mode?: 'historical' | 'model_pred' | 'yield' | 'rainfall';
  title?: string;
  className?: string;
  heightClass?: string;
}

export const DistrictChoropleth: React.FC<DistrictChoroplethProps> = ({
  mode = 'historical',
  title,
  className = '',
  heightClass = 'min-h-[480px] sm:min-h-[520px]',
}) => {
  const {
    selectedDistrictId,
    setSelectedDistrictId,
    currentYearMetrics,
    inSeasonModelPredictions,
    cropYearStr,
    monitoredDistrictsForCrop,
  } = useDashboard();

  const [hoveredDistrictId, setHoveredDistrictId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isWheeling, setIsWheeling] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoomLevel);
  const panRef = useRef(panOffset);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const dragStartPanRef = useRef({ x: 0, y: 0 });
  const wheelTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    zoomRef.current = zoomLevel;
  }, [zoomLevel]);

  useEffect(() => {
    panRef.current = panOffset;
  }, [panOffset]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(Number((prev * 1.25).toFixed(2)), 5.0));
  };
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(Number((prev / 1.25).toFixed(2)), 0.75));
  };
  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Wheel zoom handler
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const mx = e.clientX - rect.left - cx;
      const my = e.clientY - rect.top - cy;

      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;
      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const nextZoom = Math.min(Math.max(Number((currentZoom * zoomFactor).toFixed(3)), 0.75), 5.0);

      if (nextZoom === currentZoom) return;

      const ratio = nextZoom / currentZoom;
      const nextPanX = mx - (mx - currentPan.x) * ratio;
      const nextPanY = my - (my - currentPan.y) * ratio;

      setIsWheeling(true);
      if (wheelTimeoutRef.current) window.clearTimeout(wheelTimeoutRef.current);
      wheelTimeoutRef.current = window.setTimeout(() => setIsWheeling(false), 120);

      setZoomLevel(nextZoom);
      setPanOffset({ x: nextPanX, y: nextPanY });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select')) return;

    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    dragStartPanRef.current = { ...panRef.current };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartPosRef.current.x;
      const dy = e.clientY - dragStartPosRef.current.y;

      if (!hasDraggedRef.current && Math.hypot(dx, dy) > 6) {
        hasDraggedRef.current = true;
        setIsDragging(true);
      }
      if (hasDraggedRef.current) {
        setPanOffset({
          x: dragStartPanRef.current.x + dx,
          y: dragStartPanRef.current.y + dy,
        });
      }
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 80);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const { isDark } = useAppTheme();

  // Dynamic Fill matching theme:
  // Dark mode (original 674a9b7): Failure: #EF4444, Resilient: #10B981, Non-monitored: #14221C
  // Light mode: Failure: #D46A64, Resilient: #44A07A, Non-monitored: #525D67
  const getDistrictFill = useCallback(
    (distId: string): string => {
      const isMonitored = monitoredDistrictsForCrop.some(d => d.id === distId);
      if (!isMonitored) return isDark ? '#14221C' : '#525D67';

      if (mode === 'model_pred') {
        const pred = inSeasonModelPredictions[distId];
        if (!pred || pred.predictionStatus !== 'READY') return isDark ? '#14221C' : '#525D67';
        if (pred.riskCategory === 'High' || (pred.failureProbability !== null && pred.failureProbability >= 0.5)) {
          return isDark ? '#EF4444' : '#D46A64';
        }
        if (pred.riskCategory === 'Moderate') {
          return isDark ? '#F59E0B' : '#E59858';
        }
        return isDark ? '#10B981' : '#44A07A';
      }

      if (mode === 'rainfall') {
        const m = currentYearMetrics[distId];
        if (!m || m.rainfallMm === null) return isDark ? '#14221C' : '#525D67';
        if (m.rainfallMm < 700) return isDark ? '#EF4444' : '#D46A64';
        if (m.rainfallMm < 1100) return isDark ? '#F59E0B' : '#E59858';
        return isDark ? '#38BDF8' : '#3895C8';
      }

      if (mode === 'yield') {
        const m = currentYearMetrics[distId];
        if (!m || m.yieldTonnesHa === null) return isDark ? '#14221C' : '#525D67';
        if (m.yieldTonnesHa < 1.0) return isDark ? '#EF4444' : '#D46A64';
        if (m.yieldTonnesHa < 1.8) return isDark ? '#F59E0B' : '#E59858';
        return isDark ? '#10B981' : '#44A07A';
      }

      // Default: historical failure event
      const metric = currentYearMetrics[distId];
      if (!metric || metric.failureEvent === null) return isDark ? '#14221C' : '#525D67';
      return metric.failureEvent === 1
        ? (isDark ? '#EF4444' : '#D46A64')
        : (isDark ? '#10B981' : '#44A07A');
    },
    [mode, currentYearMetrics, inSeasonModelPredictions, monitoredDistrictsForCrop, isDark]
  );

  const getDistrictLabel = (poly: GeoDistrictPolygon, zoom: number) => {
    if (poly.id === 'mumbai_city') {
      if (zoom < 1.6) return null;
      return { text: 'Mumbai City', x: poly.center[0], y: poly.center[1] + 4 };
    }
    if (poly.id === 'mumbai_suburban') {
      if (zoom < 1.6) return { text: 'Mumbai', x: 25, y: 332 };
      return { text: 'Mumbai Sub.', x: poly.center[0], y: poly.center[1] - 4 };
    }

    let displayName = poly.name;
    if (poly.name === 'Chhatrapati Sambhajinagar') {
      displayName = 'Chh. Sambhajinagar';
    }
    if (poly.id === 'jalna') {
      return { text: displayName, x: 360, y: 238 };
    }
    return { text: displayName, x: poly.center[0], y: poly.center[1] };
  };

  return (
    <div
      className={`rounded-2xl p-3.5 relative overflow-hidden shadow-xs transition-colors ${
        isDark
          ? 'bg-[#091410] border border-[#14261F]'
          : 'bg-[#E2E6DC] border border-[#CCD2C4]'
      } ${className}`}
    >
      {/* Map Header & Legend Row */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b ${
          isDark ? 'border-[#14261F]' : 'border-[#CCD2C4]'
        }`}
      >
        <div>
          <h2
            className={`text-sm font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-[#16221B]'
            }`}
          >
            {title || `Maharashtra District Risk Map (Kharif ${cropYearStr})`}
          </h2>
          <p
            className={`text-[11px] mt-0.5 ${
              isDark ? 'text-[#80978E]' : 'text-[#526458]'
            }`}
          >
            District-wise classification based on &gt;10% yield deficit below historical 5-year baseline
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-medium shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-[#EF4444]' : 'bg-[#D46A64]'}`}
            />
            <span
              className={`font-mono text-[10px] font-semibold ${
                isDark ? 'text-[#F87171]' : 'text-[#D46A64]'
              }`}
            >
              Failure (Deficit &gt; 10%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-[#10B981]' : 'bg-[#44A07A]'}`}
            />
            <span
              className={`font-mono text-[10px] font-semibold ${
                isDark ? 'text-[#34D399]' : 'text-[#44A07A]'
              }`}
            >
              Resilient (&le; 10%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isDark ? 'bg-[#14221C] border border-[#23332A]' : 'bg-[#525D67]'
              }`}
            />
            <span
              className={`font-mono text-[10px] font-semibold ${
                isDark ? 'text-[#7A9187]' : 'text-[#526458]'
              }`}
            >
              {isDark ? 'Non-Rice District' : 'Non-Target District'}
            </span>
          </div>
          <div
            className={`flex items-center gap-1.5 pl-2 border-l ${
              isDark ? 'border-[#14261F]' : 'border-[#CCD2C4]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
            <span
              className={`font-mono text-[10px] font-semibold ${
                isDark ? 'text-[#67E8F9]' : 'text-[#0284C7]'
              }`}
            >
              Satellite Terrain Layer
            </span>
          </div>
          <div
            className={`flex items-center gap-1.5 pl-2 border-l ${
              isDark ? 'border-[#14261F]' : 'border-[#CCD2C4]'
            }`}
          >
            <button
              type="button"
              onClick={() => setShowLabels(!showLabels)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors border ${
                showLabels
                  ? isDark
                    ? 'bg-[#0E241C] text-[#22C55E] border-[#22C55E]'
                    : 'bg-[#12382B] text-white border-[#12382B]'
                  : isDark
                  ? 'bg-[#060D0A] border-[#14261F] text-[#7A9187] hover:text-white hover:border-[#22C55E]'
                  : 'bg-white border-[#CCD2C4] text-[#526458] hover:text-[#16221B]'
              }`}
            >
              Labels: {showLabels ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className={`w-full relative flex items-center justify-center py-1 px-1 overflow-hidden rounded-xl my-1.5 select-none ${heightClass} ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={
          isDark
            ? {
                backgroundColor: '#040B08',
                backgroundImage: `
                  radial-gradient(ellipse at 80% 45%, rgba(16, 185, 129, 0.05) 0%, transparent 60%),
                  radial-gradient(ellipse at 20% 70%, rgba(34, 197, 94, 0.04) 0%, transparent 55%),
                  linear-gradient(to bottom, #040B08 0%, #06120D 100%)
                `,
              }
            : {
                backgroundColor: '#07100D',
              }
        }
      >
        {/* Controls Overlay */}
        <MapControls
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
        />

        {/* Vector SVG using Real GeoJSON Boundaries with Satellite Terrain Layer */}
        <svg
          viewBox={MAHARASHTRA_GEOJSON_VIEWBOX}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-h-[560px] select-none relative z-10 pointer-events-auto"
          style={{
            overflow: 'visible',
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isDragging || isWheeling ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: isDragging || isWheeling ? 'transform' : 'auto',
          }}
        >
          {/* SVG Definitions for Selection Glow */}
          <defs>
            <filter id="glass-selection-glow" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#38BDF8" floodOpacity="0.9" />
            </filter>
          </defs>

          {/* Layer 0: High-Resolution GEE Sentinel-2 + DEM Satellite Terrain Background */}
          <g className="map-terrain-layer pointer-events-none" style={{ pointerEvents: 'none' }}>
            <image
              href="/images/maharashtra_satellite_terrain_sentinel2_dem.webp"
              x="-1091.8"
              y="-859.9"
              width="3089.8"
              height="2394.6"
              preserveAspectRatio="none"
              style={{
                pointerEvents: 'none',
              }}
            />
          </g>

          {/* Layer 1: District Polygons & Boundaries */}
          <g className="map-polygons-layer">
            {MAHARASHTRA_GEOJSON_POLYGONS.map(poly => {
              const isSelected = selectedDistrictId === poly.id;
              const isHovered = hoveredDistrictId === poly.id;
              const fillColor = getDistrictFill(poly.id);
              const isNonTarget = isDark ? fillColor === '#14221C' : fillColor === '#525D67';

              const fillOpacity = isDark
                ? isSelected
                  ? 0.84
                  : isHovered
                  ? 0.78
                  : isNonTarget
                  ? 0.40
                  : 0.68
                : isSelected
                ? 0.78
                : isHovered
                ? 0.75
                : isNonTarget
                ? 0.65
                : 0.72;

              let strokeColor = isDark ? 'rgba(5, 18, 12, 0.9)' : 'rgba(15, 23, 20, 0.55)';
              let strokeWidth = isDark ? 0.85 : 0.8;

              if (isSelected) {
                strokeColor = '#38BDF8';
                strokeWidth = isDark ? 2.5 : 2.4;
              } else if (isHovered) {
                strokeColor = isDark ? '#4ADE80' : '#FFFFFF';
                strokeWidth = isDark ? 2.0 : 1.6;
              }

              return (
                <path
                  key={poly.id}
                  d={poly.path}
                  fill={fillColor}
                  fillOpacity={fillOpacity}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  filter={isSelected ? 'url(#glass-selection-glow)' : undefined}
                  style={{
                    transition: 'fill-opacity 180ms ease, stroke 180ms ease, stroke-width 180ms ease',
                  }}
                  className="cursor-pointer"
                  onClick={e => {
                    e.stopPropagation();
                    if (!hasDraggedRef.current) {
                      setSelectedDistrictId(poly.id);
                    }
                  }}
                  onPointerUp={e => {
                    if (e.button === 0 && !hasDraggedRef.current) {
                      setSelectedDistrictId(poly.id);
                    }
                  }}
                  onMouseEnter={() => {
                    if (!hasDraggedRef.current) setHoveredDistrictId(poly.id);
                  }}
                  onMouseLeave={() => {
                    if (!hasDraggedRef.current) setHoveredDistrictId(null);
                  }}
                />
              );
            })}
          </g>

          {/* Layer 2: District Text Labels */}
          <g className="map-labels-layer pointer-events-none" style={{ pointerEvents: 'none' }}>
            {MAHARASHTRA_GEOJSON_POLYGONS.map(poly => {
              const isSelected = selectedDistrictId === poly.id;
              const isHovered = hoveredDistrictId === poly.id;

              // Only show label if selected, hovered, or labels toggled ON (or zoomed in)
              if (!isSelected && !isHovered && !showLabels && zoomLevel < 1.6) {
                return null;
              }

              const labelInfo = getDistrictLabel(poly, zoomLevel);
              if (!labelInfo) return null;

              return (
                <text
                  key={`label-${poly.id}`}
                  x={labelInfo.x}
                  y={labelInfo.y}
                  fill={isSelected ? '#38BDF8' : isHovered ? (isDark ? '#4ADE80' : '#FFFFFF') : '#FFFFFF'}
                  fontSize={isSelected ? '14' : isHovered ? '13' : '11.5'}
                  fontWeight={isSelected || isHovered ? '800' : '700'}
                  fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  pointerEvents="none"
                  stroke="#05120C"
                  strokeWidth={isDark ? '3.2' : '2.8'}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{
                    paintOrder: 'stroke fill',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85))',
                  }}
                >
                  {labelInfo.text}
                </text>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};
