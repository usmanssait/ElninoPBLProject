import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useAppTheme } from '../../context/ThemeContext';
import { SUPPORTED_KHARIF_CROPS, KharifCropType } from '../../data/authoritativeData';
import { Sprout } from 'lucide-react';

interface CropSelectProps {
  className?: string;
  showIcon?: boolean;
}

export const CropSelect: React.FC<CropSelectProps> = ({ className = '', showIcon = true }) => {
  const { selectedCrop, setSelectedCrop } = useDashboard();
  const { isDark } = useAppTheme();

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {showIcon && (
        <Sprout
          className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#39B8C4]' : 'text-[#12382B]'}`}
        />
      )}
      <div className="relative">
        <select
          value={selectedCrop}
          onChange={e => setSelectedCrop(e.target.value as KharifCropType)}
          className={`border rounded-xl px-2.5 py-2 text-xs font-mono cursor-pointer focus:outline-hidden transition-colors shadow-xs ${
            isDark
              ? 'bg-[#14271F] border-[#294338] text-[#E5EEE8] hover:border-[#39B8C4]'
              : 'bg-white border-[#CCD2C4] text-[#16221B] hover:border-[#12382B]'
          }`}
          title="Filter by Kharif Crop"
        >
          {SUPPORTED_KHARIF_CROPS.map(c => (
            <option
              key={c.id}
              value={c.id}
              className={isDark ? 'bg-[#14271F] text-[#E5EEE8]' : 'bg-white text-[#16221B]'}
            >
              {c.icon} {c.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
