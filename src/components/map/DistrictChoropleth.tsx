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

  const { isDark } = useAppTheme();

  // Helper to clamp pan offsets so user can never pan Maharashtra out of view
  const clampPanOffset = useCallback(
    (x: number, y: number, zoom: number): { x: number; y: number } => {
      const el = containerRef.current;
      const width = el ? el.clientWidth : 750;
      const height = el ? el.clientHeight : 520;

      // At zoom 1.0, allow elastic navigation without losing the state
      // As zoom increases, allow proportional panning to reach every corner
      const maxPanX = Math.max(80, ((zoom - 0.65) / zoom) * (width * 0.75));
      const maxPanY = Math.max(65, ((zoom - 0.65) / zoom) * (height * 0.75));

      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, y)),
      };
    },
    []
  );

  const handleZoomIn = () => {
    setZoomLevel(prev => {
      const next = Math.min(Number((prev * 1.25).toFixed(2)), 5.0);
      setPanOffset(currPan => clampPanOffset(currPan.x, currPan.y, next));
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const next = Math.max(Number((prev / 1.25).toFixed(2)), 0.75);
      setPanOffset(currPan => clampPanOffset(currPan.x, currPan.y, next));
      return next;
    });
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Wheel zoom handler with boundary clamping
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
      const rawPanX = mx - (mx - currentPan.x) * ratio;
      const rawPanY = my - (my - currentPan.y) * ratio;
      const clampedPan = clampPanOffset(rawPanX, rawPanY, nextZoom);

      setIsWheeling(true);
      if (wheelTimeoutRef.current) window.clearTimeout(wheelTimeoutRef.current);
      wheelTimeoutRef.current = window.setTimeout(() => setIsWheeling(false), 120);

      setZoomLevel(nextZoom);
      setPanOffset(clampedPan);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [clampPanOffset]);

  // Mouse pan handlers with boundary clamping
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
        const clamped = clampPanOffset(
          dragStartPanRef.current.x + dx,
          dragStartPanRef.current.y + dy,
          zoomRef.current
        );
        setPanOffset(clamped);
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
  }, [clampPanOffset]);

  // Liquid Glass Styling Engine:
  // Delivers true Apple-style translucent glass so the underlying 3D Sentinel-2 topography,
  // rivers, and coastal contours shine through with zero artificial muddy green tint.
  const getDistrictGlassStyle = useCallback(
    (distId: string, isSelected: boolean, isHovered: boolean) => {
      const isMonitored = monitoredDistrictsForCrop.some(d => d.id === distId);

      // Non-monitored districts: neutral translucent smoke glass (no muddy green)
      if (!isMonitored) {
        return {
          fill: isDark
            ? isHovered ? 'rgba(38, 50, 68, 0.40)' : 'rgba(24, 32, 44, 0.20)'
            : isHovered ? 'rgba(100, 116, 139, 0.30)' : 'rgba(148, 163, 184, 0.16)',
          stroke: isSelected
            ? '#38BDF8'
            : isHovered
            ? (isDark ? 'rgba(203, 213, 225, 0.60)' : 'rgba(71, 85, 105, 0.65)')
            : (isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(100, 116, 139, 0.28)'),
          strokeWidth: isSelected ? 2.4 : isHovered ? 1.4 : 0.75,
          isMonitored: false,
        };
      }

      let category: 'failure' | 'resilient' | 'moderate' | 'high_rain' = 'resilient';

      if (mode === 'model_pred') {
        const pred = inSeasonModelPredictions[distId];
        if (pred && pred.predictionStatus === 'READY') {
          if (pred.riskCategory === 'High' || (pred.failureProbability !== null && pred.failureProbability >= 0.5)) {
            category = 'failure';
          } else if (pred.riskCategory === 'Moderate') {
            category = 'moderate';
          }
        }
      } else if (mode === 'rainfall') {
        const m = currentYearMetrics[distId];
        if (m && m.rainfallMm !== null) {
          if (m.rainfallMm < 700) category = 'failure';
          else if (m.rainfallMm < 1100) category = 'moderate';
          else category = 'high_rain';
        }
      } else if (mode === 'yield') {
        const m = currentYearMetrics[distId];
        if (m && m.yieldTonnesHa !== null) {
          if (m.yieldTonnesHa < 1.0) category = 'failure';
          else if (m.yieldTonnesHa < 1.8) category = 'moderate';
        }
      } else {
        // Historical default
        const metric = currentYearMetrics[distId];
        if (metric && metric.failureEvent === 1) {
          category = 'failure';
        }
      }

      if (category === 'failure') {
        return {
          fill: isDark
            ? isSelected
              ? 'rgba(239, 68, 68, 0.65)'
              : isHovered
              ? 'rgba(239, 68, 68, 0.52)'
              : 'rgba(239, 68, 68, 0.38)'
            : isSelected
            ? 'rgba(220, 38, 38, 0.62)'
            : isHovered
            ? 'rgba(220, 38, 38, 0.48)'
            : 'rgba(220, 38, 38, 0.35)',
          stroke: isSelected
            ? '#38BDF8'
            : isHovered
            ? (isDark ? '#FCA5A5' : '#DC2626')
            : (isDark ? 'rgba(248, 113, 113, 0.85)' : 'rgba(220, 38, 38, 0.85)'),
          strokeWidth: isSelected ? 2.6 : isHovered ? 1.8 : 1.1,
          isMonitored: true,
        };
      }

      if (category === 'moderate') {
        return {
          fill: isDark
            ? isSelected
              ? 'rgba(245, 158, 11, 0.65)'
              : isHovered
              ? 'rgba(245, 158, 11, 0.52)'
              : 'rgba(245, 158, 11, 0.36)'
            : isSelected
            ? 'rgba(217, 119, 6, 0.60)'
            : isHovered
            ? 'rgba(217, 119, 6, 0.46)'
            : 'rgba(217, 119, 6, 0.34)',
          stroke: isSelected
            ? '#38BDF8'
            : isHovered
            ? (isDark ? '#FCD34D' : '#B45309')
            : (isDark ? 'rgba(251, 191, 36, 0.85)' : 'rgba(217, 119, 6, 0.85)'),
          strokeWidth: isSelected ? 2.6 : isHovered ? 1.8 : 1.1,
          isMonitored: true,
        };
      }

      if (category === 'high_rain') {
        return {
          fill: isDark
            ? isSelected
              ? 'rgba(56, 189, 248, 0.65)'
              : isHovered
              ? 'rgba(56, 189, 248, 0.52)'
              : 'rgba(56, 189, 248, 0.36)'
            : isSelected
            ? 'rgba(2, 132, 199, 0.60)'
            : isHovered
            ? 'rgba(2, 132, 199, 0.46)'
            : 'rgba(2, 132, 199, 0.34)',
          stroke: isSelected
            ? '#38BDF8'
            : isHovered
            ? (isDark ? '#7DD3FC' : '#0369A1')
            : (isDark ? 'rgba(56, 189, 248, 0.85)' : 'rgba(2, 132, 199, 0.85)'),
          strokeWidth: isSelected ? 2.6 : isHovered ? 1.8 : 1.1,
          isMonitored: true,
        };
      }

      // Default resilient
      return {
        fill: isDark
          ? isSelected
            ? 'rgba(16, 185, 129, 0.65)'
            : isHovered
            ? 'rgba(16, 185, 129, 0.52)'
            : 'rgba(16, 185, 129, 0.36)'
          : isSelected
          ? 'rgba(13, 148, 136, 0.60)'
          : isHovered
          ? 'rgba(13, 148, 136, 0.46)'
          : 'rgba(13, 148, 136, 0.34)',
        stroke: isSelected
          ? '#38BDF8'
          : isHovered
          ? (isDark ? '#6EE7B7' : '#0F766E')
          : (isDark ? 'rgba(52, 211, 153, 0.85)' : 'rgba(13, 148, 136, 0.85)'),
        strokeWidth: isSelected ? 2.6 : isHovered ? 1.8 : 1.1,
        isMonitored: true,
      };
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

        {/* Legend with Liquid Glass Indicators */}
        <div className="flex items-center gap-3 text-xs font-medium shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full border shadow-xs"
              style={{
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.75)' : 'rgba(220, 38, 38, 0.75)',
                borderColor: isDark ? '#F87171' : '#DC2626',
              }}
            />
            <span
              className={`font-mono text-[10px] font-semibold ${
                isDark ? 'text-[#F87171]' : 'text-[#DC2626]'
              }`}
            >
              Failure (Deficit &gt; 10%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full border shadow-xs"
              style={{
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.75)' : 'rgba(13, 148, 136, 0.75)',
                borderColor: isDark ? '#34D399' : '#0D9488',
              }}
            />
            <span
              className={`font-mono text-[10px] font-semibold ${
                isDark ? 'text-[#34D399]' : 'text-[#0D9488]'
              }`}
            >
              Resilient (&le; 10%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full border shadow-xs"
              style={{
                backgroundColor: isDark ? 'rgba(38, 50, 68, 0.50)' : 'rgba(148, 163, 184, 0.35)',
                borderColor: isDark ? '#475569' : '#94A3B8',
              }}
            />
            <span
              className={`font-mono text-[10px] font-semibold ${
                isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
              }`}
            >
              Non-Target District
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
              Sentinel-2 DEM Layer
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

      {/* Map Canvas with Theme-Aware Marine Frame */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className={`w-full relative flex items-center justify-center py-1 px-1 overflow-hidden rounded-xl my-1.5 select-none ${heightClass} ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          backgroundColor: isDark ? '#040B0E' : '#0B171D',
          backgroundImage: isDark
            ? 'radial-gradient(ellipse at 50% 50%, rgba(14, 165, 233, 0.03) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 50%, rgba(56, 189, 248, 0.04) 0%, transparent 75%)',
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
            <filter id="glass-selection-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="4.5"
                floodColor={isDark ? '#38BDF8' : '#0284C7'}
                floodOpacity="0.85"
              />
            </filter>
          </defs>

          {/* Layer 0: High-Resolution GEE Sentinel-2 + DEM Satellite Terrain Background */}
          {/* Theme-tuned filter removes artificial tint and balances light mode contrast */}
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
                filter: isDark
                  ? 'brightness(0.95) contrast(1.08) saturate(1.06)'
                  : 'brightness(1.08) contrast(0.98) saturate(1.02)',
              }}
            />
          </g>

          {/* Layer 1: District Polygons with Apple Liquid Glass Translucency */}
          <g className="map-polygons-layer">
            {MAHARASHTRA_GEOJSON_POLYGONS.map(poly => {
              const isSelected = selectedDistrictId === poly.id;
              const isHovered = hoveredDistrictId === poly.id;
              const glassStyle = getDistrictGlassStyle(poly.id, isSelected, isHovered);

              return (
                <path
                  key={poly.id}
                  d={poly.path}
                  fill={glassStyle.fill}
                  stroke={glassStyle.stroke}
                  strokeWidth={glassStyle.strokeWidth}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  filter={isSelected ? 'url(#glass-selection-glow)' : undefined}
                  style={{
                    transition: 'fill 180ms ease, stroke 180ms ease, stroke-width 180ms ease',
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

          {/* Layer 2: Dynamic District Text Labels & Glass Pill Badges */}
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

              // Dynamic font size inversely scaled to zoom to keep typography crisp and balanced
              const baseSize = isSelected ? 13.5 : isHovered ? 12 : 10.5;
              const dynamicFontSize = Math.max(5.5, Math.min(14, baseSize / Math.pow(zoomLevel, 0.72)));

              // Geometry for Apple-style glass pill badge on hover / selection
              const textLen = labelInfo.text.length;
              const badgeWidth = textLen * (dynamicFontSize * 0.58) + dynamicFontSize * 1.0;
              const badgeHeight = dynamicFontSize * 1.55;
              const badgeRadius = badgeHeight * 0.35;

              return (
                <g key={`label-${poly.id}`}>
                  {(isSelected || isHovered) && (
                    <rect
                      x={labelInfo.x - badgeWidth / 2}
                      y={labelInfo.y - badgeHeight / 2}
                      width={badgeWidth}
                      height={badgeHeight}
                      rx={badgeRadius}
                      fill={isDark ? 'rgba(5, 13, 10, 0.88)' : 'rgba(255, 255, 255, 0.92)'}
                      stroke={isSelected ? '#38BDF8' : isDark ? '#4ADE80' : '#12382B'}
                      strokeWidth={Math.max(0.8, 1.2 / Math.pow(zoomLevel, 0.72))}
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
                    />
                  )}
                  <text
                    x={labelInfo.x}
                    y={labelInfo.y}
                    fill={
                      isSelected
                        ? isDark ? '#38BDF8' : '#0284C7'
                        : isHovered
                        ? isDark ? '#4ADE80' : '#16221B'
                        : isDark ? '#F8FAFC' : '#0F172A'
                    }
                    fontSize={dynamicFontSize}
                    fontWeight={isSelected || isHovered ? '700' : '600'}
                    fontFamily="'Plus Jakarta Sans', Inter, system-ui, -apple-system, sans-serif"
                    letterSpacing="0.02em"
                    textAnchor="middle"
                    dominantBaseline="central"
                    pointerEvents="none"
                    stroke={
                      isSelected || isHovered
                        ? 'none'
                        : isDark ? 'rgba(4, 11, 8, 0.92)' : 'rgba(255, 255, 255, 0.95)'
                    }
                    strokeWidth={
                      isSelected || isHovered
                        ? 0
                        : Math.max(1.0, 1.8 / Math.pow(zoomLevel, 0.72))
                    }
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={{
                      paintOrder: 'stroke fill',
                      filter: isSelected || isHovered ? undefined : 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
                    }}
                  >
                    {labelInfo.text}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};
