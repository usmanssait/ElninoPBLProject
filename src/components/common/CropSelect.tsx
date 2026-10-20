import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { SUPPORTED_KHARIF_CROPS, KharifCropType } from '../../data/authoritativeData';
import { Sprout } from 'lucide-react';

interface CropSelectProps {
  className?: string;
  showIcon?: boolean;
}

export const CropSelect: React.FC<CropSelectProps> = ({ className = '', showIcon = true }) => {
  const { selectedCrop, setSelectedCrop } = useDashboard();

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {showIcon && <Sprout className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />}
      <div className="relative">
        <select
          value={selectedCrop}
          onChange={e => setSelectedCrop(e.target.value as KharifCropType)}
          className="bg-[#0B1A14] border border-[#173026] text-[#E8EFEB] rounded-xl px-2.5 py-2 text-xs font-mono cursor-pointer focus:outline-hidden hover:border-[#22C55E]/60 transition-colors shadow-xs"
          title="Filter by Kharif Crop"
        >
          {SUPPORTED_KHARIF_CROPS.map(c => (
            <option key={c.id} value={c.id} className="bg-[#08120E] text-white">
              {c.icon} {c.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
