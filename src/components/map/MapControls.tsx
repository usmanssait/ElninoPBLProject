import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useAppTheme } from '../../context/ThemeContext';

interface MapControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onReset,
}) => {
  const { isDark } = useAppTheme();
  const scaledKm = Math.max(10, Math.round(200 / zoomLevel));

  return (
    <>
      {/* Top-Left Zoom & Reset Buttons */}
      <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-20">
        <button
          type="button"
          onClick={onZoomIn}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shadow-md ${
            isDark
              ? 'bg-[#102019]/95 hover:bg-[#14271F] border-[#294338] text-[#E5EEE8]'
              : 'bg-white/95 hover:bg-white border-[#CCD2C4] text-[#16221B]'
          }`}
          title="Zoom In"
        >
          <ZoomIn className={`w-4 h-4 ${isDark ? 'text-[#39B8C4]' : 'text-[#12382B]'}`} />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shadow-md ${
            isDark
              ? 'bg-[#102019]/95 hover:bg-[#14271F] border-[#294338] text-[#E5EEE8]'
              : 'bg-white/95 hover:bg-white border-[#CCD2C4] text-[#16221B]'
          }`}
          title="Zoom Out"
        >
          <ZoomOut className={`w-4 h-4 ${isDark ? 'text-[#39B8C4]' : 'text-[#12382B]'}`} />
        </button>
        <button
          type="button"
          onClick={onReset}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shadow-md ${
            isDark
              ? 'bg-[#102019]/95 hover:bg-[#14271F] border-[#294338] text-[#E5EEE8]'
              : 'bg-white/95 hover:bg-white border-[#CCD2C4] text-[#16221B]'
          }`}
          title="Reset Position"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isDark ? 'text-[#39B8C4]' : 'text-[#12382B]'}`} />
        </button>
        <div
          className={`px-1 py-0.5 rounded-md border text-[9px] font-mono text-center select-none shadow-xs font-semibold ${
            isDark
              ? 'bg-[#102019]/95 border-[#294338] text-[#9BAFA4]'
              : 'bg-white/95 border-[#CCD2C4] text-[#526458]'
          }`}
        >
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>

      {/* Top-Right North Arrow & Instruction Badge */}
      <div className="absolute top-3.5 right-3.5 z-20 pointer-events-none select-none flex items-center gap-2.5">
        <div
          className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[10px] font-mono backdrop-blur-xs shadow-md ${
            isDark
              ? 'bg-[#102019]/95 border-[#294338] text-[#9BAFA4]'
              : 'bg-white/95 border-[#CCD2C4] text-[#16221B]'
          }`}
        >
          <span className={`font-semibold ${isDark ? 'text-[#39B8C4]' : 'text-[#12382B]'}`}>Pan: Drag</span>
          <span className={isDark ? 'text-[#294338]' : 'text-[#A4B0A4]'}>·</span>
          <span>Zoom: Scroll Wheel</span>
          <span className={isDark ? 'text-[#294338]' : 'text-[#A4B0A4]'}>·</span>
          <span>Select: Click District</span>
        </div>
        <div
          className={`w-8 h-8 rounded-full border flex flex-col items-center justify-center shadow-md ${
            isDark
              ? 'bg-[#102019]/95 border-[#294338]'
              : 'bg-white/95 border-[#CCD2C4]'
          }`}
        >
          <span className={`text-[11px] font-bold font-mono leading-none ${isDark ? 'text-[#E5EEE8]' : 'text-[#12382B]'}`}>
            N
          </span>
          <span className={`text-[9px] leading-none ${isDark ? 'text-[#39B8C4]' : 'text-[#12382B]'}`}>
            ▲
          </span>
        </div>
      </div>

      {/* Bottom-Left Metric Scale Bar */}
      <div
        className={`absolute bottom-3.5 left-3.5 z-20 pointer-events-none select-none flex flex-col gap-1 font-mono text-[9px] p-1.5 rounded-lg border shadow-xs ${
          isDark
            ? 'bg-[#102019]/95 border-[#294338] text-[#9BAFA4]'
            : 'bg-white/95 border-[#CCD2C4] text-[#526458]'
        }`}
      >
        <div className="flex justify-between w-28 text-[9px] font-semibold">
          <span>0</span>
          <span>{Math.round(scaledKm / 4)}</span>
          <span>{Math.round(scaledKm / 2)}</span>
          <span>{scaledKm} km</span>
        </div>
        <div
          className={`h-1.5 w-28 flex rounded-xs overflow-hidden border ${
            isDark ? 'bg-[#14271F] border-[#294338]' : 'bg-[#CCD2C4] border-[#B0B8A6]'
          }`}
        >
          <div className={`w-1/4 h-full ${isDark ? 'bg-[#39B8C4]' : 'bg-[#12382B]'}`}></div>
          <div className={`w-1/4 h-full ${isDark ? 'bg-[#102019]' : 'bg-white'}`}></div>
          <div className={`w-1/4 h-full ${isDark ? 'bg-[#39B8C4]' : 'bg-[#12382B]'}`}></div>
          <div className={`w-1/4 h-full ${isDark ? 'bg-[#102019]' : 'bg-white'}`}></div>
        </div>
      </div>
    </>
  );
};
