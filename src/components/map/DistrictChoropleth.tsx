import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  MAHARASHTRA_GEOJSON_POLYGONS,
  MAHARASHTRA_GEOJSON_VIEWBOX,
  GeoDistrictPolygon,
} from '../../data/maharashtraGeoJsonData';
import { PRIMARY_RICE_DISTRICTS } from '../../data/canonicalDistricts';
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
    // Dragging state is only activated if mouse moves beyond threshold
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

  // Dynamic Fill calculation based on monitored crop districts
  const getDistrictFill = useCallback(
    (distId: string): string => {
      const isMonitored = monitoredDistrictsForCrop.some(d => d.id === distId);
      if (!isMonitored) return '#14221C'; // Excluded / Not grown in district

      if (mode === 'model_pred') {
        const pred = inSeasonModelPredictions[distId];
        if (!pred || pred.predictionStatus !== 'READY') return '#14221C';
        if (pred.riskCategory === 'High' || (pred.failureProbability !== null && pred.failureProbability >= 0.5)) {
          return '#EF4444'; // Red
        }
        if (pred.riskCategory === 'Moderate') {
          return '#F59E0B'; // Amber
        }
        return '#10B981'; // Green
      }

      if (mode === 'rainfall') {
        const m = currentYearMetrics[distId];
        if (!m || m.rainfallMm === null) return '#14221C';
        if (m.rainfallMm < 700) return '#EF4444';
        if (m.rainfallMm < 1100) return '#F59E0B';
        return '#0284C7';
      }

      if (mode === 'yield') {
        const m = currentYearMetrics[distId];
        if (!m || m.yieldTonnesHa === null) return '#14221C';
        if (m.yieldTonnesHa < 1.0) return '#EF4444';
        if (m.yieldTonnesHa < 1.8) return '#F59E0B';
        return '#10B981';
      }

      // Default: historical failure event
      const metric = currentYearMetrics[distId];
      if (!metric || metric.failureEvent === null) return '#14221C';
      return metric.failureEvent === 1 ? '#EF4444' : '#10B981';
    },
    [mode, currentYearMetrics, inSeasonModelPredictions, monitoredDistrictsForCrop]
  );

  // Label formatting and collision resolution
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

        {/* Legend matching mockup */}
        <div className="flex items-center gap-3 text-xs font-medium shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <span className="text-[#DC2626] font-mono text-[10px] font-semibold">Failure (&gt;10% Deficit)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
            <span className="text-[#16A34A] font-mono text-[10px] font-semibold">Resilient (&le;10%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1] border border-[#94A3B8]" />
            <span className="text-[#526458] font-mono text-[10px]">Non-Target District</span>
          </div>
          <div className="flex items-center gap-1.5 pl-2 border-l border-[#CCD2C4]">
            <span className="w-2 h-2 rounded-full bg-[#0284C7] animate-pulse" />
            <span className="text-[#0284C7] font-mono text-[10px] font-semibold">Satellite Terrain Layer</span>
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
          backgroundColor: '#040B08',
          backgroundImage: `
            radial-gradient(ellipse at 80% 45%, rgba(16, 185, 129, 0.05) 0%, transparent 60%),
            radial-gradient(ellipse at 20% 70%, rgba(34, 197, 94, 0.04) 0%, transparent 55%),
            linear-gradient(to bottom, #040B08 0%, #06120D 100%)
          `,
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
          {/* SVG Definitions for Liquid Glass Filters and Glow */}
          <defs>
            <filter id="glass-selection-glow" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#38BDF8" floodOpacity="0.85" />
            </filter>
            <filter id="glass-hover-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#4ADE80" floodOpacity="0.70" />
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
                filter: 'saturate(1.18) contrast(1.12) brightness(0.96)',
                pointerEvents: 'none',
              }}
            />
          </g>

          {/* Layer 1: Apple-style Liquid Glass District Polygons */}
          <g className="map-polygons-layer">
            {MAHARASHTRA_GEOJSON_POLYGONS.map(poly => {
              const isSelected = selectedDistrictId === poly.id;
              const isHovered = hoveredDistrictId === poly.id;
              const fillColor = getDistrictFill(poly.id);
              const isNonRice = fillColor === '#14221C';

              // Liquid Glass Transparency:
              // Monitored districts: 0.30 base opacity so lush satellite terrain is seen through it
              // Non-monitored: 0.06 subtle tint
              // Hovered: 0.46
              // Selected: 0.58
              const fillOpacity = isSelected
                ? 0.58
                : isHovered
                ? 0.46
                : isNonRice
                ? 0.06
                : 0.30;

              // Apple Liquid Glass Rim Stroke
              let strokeColor = 'rgba(255, 255, 255, 0.22)';
              let strokeWidth = 0.85;

              if (isSelected) {
                strokeColor = '#38BDF8';
                strokeWidth = 2.8;
              } else if (isHovered) {
                strokeColor = fillColor === '#EF4444' ? '#FCA5A5' : '#86EFAC';
                strokeWidth = 2.0;
              } else if (!isNonRice) {
                strokeColor = fillColor === '#EF4444' ? 'rgba(248, 113, 113, 0.90)' : 'rgba(74, 222, 128, 0.90)';
                strokeWidth = 1.3;
              }

              return (
                <path
                  key={poly.id}
                  d={poly.path}
                  fill={isNonRice ? '#06120D' : fillColor}
                  fillOpacity={fillOpacity}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  filter={isSelected ? 'url(#glass-selection-glow)' : isHovered ? 'url(#glass-hover-glow)' : undefined}
                  style={{
                    transition: 'fill-opacity 220ms ease, stroke 220ms ease, stroke-width 220ms ease',
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

          {/* Layer 2: District Text Labels (Rendered OVER all polygons and borders) */}
          <g className="map-labels-layer pointer-events-none" style={{ pointerEvents: 'none' }}>
            {MAHARASHTRA_GEOJSON_POLYGONS.map(poly => {
              const isSelected = selectedDistrictId === poly.id;
              const isHovered = hoveredDistrictId === poly.id;
              const labelInfo = getDistrictLabel(poly, zoomLevel);
              if (!labelInfo) return null;

              return (
                <text
                  key={`label-${poly.id}`}
                  x={labelInfo.x}
                  y={labelInfo.y}
                  fill={isSelected ? '#38BDF8' : isHovered ? '#4ADE80' : '#FFFFFF'}
                  fontSize={isSelected ? '14' : isHovered ? '13' : '11.5'}
                  fontWeight={isSelected || isHovered ? '800' : '700'}
                  fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  pointerEvents="none"
                  stroke="#05120C"
                  strokeWidth="3.2"
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
