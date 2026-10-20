import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

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
  const scaledKm = Math.max(10, Math.round(200 / zoomLevel));

  return (
    <>
      {/* Top-Left Zoom & Reset Buttons */}
      <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-20">
        <button
          type="button"
          onClick={onZoomIn}
          className="w-8 h-8 rounded-lg bg-[#0C1B15]/90 hover:bg-[#122A20] border border-[#163327] text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-[#A4B8AF]" />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          className="w-8 h-8 rounded-lg bg-[#0C1B15]/90 hover:bg-[#122A20] border border-[#163327] text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-[#A4B8AF]" />
        </button>
        <button
          type="button"
          onClick={onReset}
          className="w-8 h-8 rounded-lg bg-[#0C1B15]/90 hover:bg-[#122A20] border border-[#163327] text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
          title="Reset Position"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#A4B8AF]" />
        </button>
        <div className="px-1 py-0.5 rounded-md bg-[#0C1B15]/90 border border-[#163327] text-[9px] font-mono text-[#7A9187] text-center select-none shadow-xs">
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>

      {/* Top-Right North Arrow & Instruction Badge */}
      <div className="absolute top-3.5 right-3.5 z-20 pointer-events-none select-none flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0C1B15]/90 border border-[#163327] text-[10px] font-mono text-[#849B90] backdrop-blur-xs shadow-md">
          <span className="text-[#22C55E] font-medium">Pan: Drag</span>
          <span className="text-[#2C4A3C]">·</span>
          <span>Zoom: Scroll Wheel</span>
          <span className="text-[#2C4A3C]">·</span>
          <span>Select: Click District</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#0C1B15]/80 border border-[#163327] flex flex-col items-center justify-center shadow-md">
          <span className="text-[11px] font-bold font-mono text-[#22C55E] leading-none">N</span>
          <span className="text-[9px] text-[#22C55E] leading-none">▲</span>
        </div>
      </div>

      {/* Bottom-Left Metric Scale Bar */}
      <div className="absolute bottom-3.5 left-3.5 z-20 pointer-events-none select-none flex flex-col gap-1 font-mono text-[9px] text-[#7A9187] bg-[#0C1B15]/80 p-1.5 rounded-lg border border-[#163327]">
        <div className="flex justify-between w-28 text-[9px]">
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
    </>
  );
};
