import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDashboard } from '../../context/DashboardContext';
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

  // Dynamic Fill matching user reference:
  // Resilient: #44A07A (soft jade seafoam)
  // Failure: #D46A64 (soft coral terracotta)
  // Non-monitored: #525D67 (slate charcoal)
  const getDistrictFill = useCallback(
    (distId: string): string => {
      const isMonitored = monitoredDistrictsForCrop.some(d => d.id === distId);
      if (!isMonitored) return '#525D67';

      if (mode === 'model_pred') {
        const pred = inSeasonModelPredictions[distId];
        if (!pred || pred.predictionStatus !== 'READY') return '#525D67';
        if (pred.riskCategory === 'High' || (pred.failureProbability !== null && pred.failureProbability >= 0.5)) {
          return '#D46A64';
        }
        if (pred.riskCategory === 'Moderate') {
          return '#E59858';
        }
        return '#44A07A';
      }

      if (mode === 'rainfall') {
        const m = currentYearMetrics[distId];
        if (!m || m.rainfallMm === null) return '#525D67';
        if (m.rainfallMm < 700) return '#D46A64';
        if (m.rainfallMm < 1100) return '#E59858';
        return '#3895C8';
      }

      if (mode === 'yield') {
        const m = currentYearMetrics[distId];
        if (!m || m.yieldTonnesHa === null) return '#525D67';
        if (m.yieldTonnesHa < 1.0) return '#D46A64';
        if (m.yieldTonnesHa < 1.8) return '#E59858';
        return '#44A07A';
      }

      // Default: historical failure event
      const metric = currentYearMetrics[distId];
      if (!metric || metric.failureEvent === null) return '#525D67';
      return metric.failureEvent === 1 ? '#D46A64' : '#44A07A';
    },
    [mode, currentYearMetrics, inSeasonModelPredictions, monitoredDistrictsForCrop]
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
      className={`rounded-2xl bg-[#E2E6DC] border border-[#CCD2C4] p-3.5 relative overflow-hidden shadow-xs ${className}`}
    >
      {/* Map Header & Legend Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#CCD2C4]">
        <div>
          <h2 className="text-sm font-bold text-[#16221B] tracking-tight">
            {title || `Maharashtra District Risk Map (Kharif ${cropYearStr})`}
          </h2>
          <p className="text-[11px] text-[#526458] mt-0.5">
            District-wise classification based on &gt;10% yield deficit below historical 5-year baseline
          </p>
        </div>

        {/* Legend matching reference image */}
        <div className="flex items-center gap-3 text-xs font-medium shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D46A64]" />
            <span className="text-[#D46A64] font-mono text-[10px] font-semibold">Failure (&gt;10% Deficit)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#44A07A]" />
            <span className="text-[#44A07A] font-mono text-[10px] font-semibold">Resilient (&le;10%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#525D67]" />
            <span className="text-[#525D67] font-mono text-[10px] font-semibold">Non-Target District</span>
          </div>
          <div className="flex items-center gap-1.5 pl-2 border-l border-[#CCD2C4]">
            <button
              type="button"
              onClick={() => setShowLabels(!showLabels)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors border ${
                showLabels
                  ? 'bg-[#12382B] text-white border-[#12382B]'
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
        style={{
          backgroundColor: '#07100D',
        }}
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

          {/* Layer 1: Frosted Liquid Glass District Polygons (Matching User Reference Image) */}
          <g className="map-polygons-layer">
            {MAHARASHTRA_GEOJSON_POLYGONS.map(poly => {
              const isSelected = selectedDistrictId === poly.id;
              const isHovered = hoveredDistrictId === poly.id;
              const fillColor = getDistrictFill(poly.id);
              const isNonTarget = fillColor === '#525D67';

              // Opacity matching user reference:
              // Monitored: 0.72 (soft matte frosted glass with subtle relief showing through)
              // Non-target: 0.65
              // Selected: 0.78
              // Hovered: 0.75
              const fillOpacity = isSelected
                ? 0.78
                : isHovered
                ? 0.75
                : isNonTarget
                ? 0.65
                : 0.72;

              // Border stroke matching user reference:
              // Selected: Electric cyan #38BDF8 (2.4px)
              // Hovered: #FFFFFF (1.5px)
              // Normal: subtle dark border rgba(15, 23, 20, 0.5) (0.8px)
              let strokeColor = 'rgba(15, 23, 20, 0.55)';
              let strokeWidth = 0.8;

              if (isSelected) {
                strokeColor = '#38BDF8';
                strokeWidth = 2.4;
              } else if (isHovered) {
                strokeColor = '#FFFFFF';
                strokeWidth = 1.6;
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

          {/* Layer 2: District Text Labels (Shown on Selected / Hovered, or all when toggled ON) */}
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
                  fill={isSelected ? '#38BDF8' : '#FFFFFF'}
                  fontSize={isSelected ? '13' : isHovered ? '12.5' : '10.5'}
                  fontWeight={isSelected || isHovered ? '800' : '600'}
                  fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  pointerEvents="none"
                  stroke="#05120C"
                  strokeWidth="2.8"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{
                    paintOrder: 'stroke fill',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
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
