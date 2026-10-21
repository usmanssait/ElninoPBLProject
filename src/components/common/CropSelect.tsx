import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { SUPPORTED_KHARIF_CROPS, KharifCropType } from '../../data/authoritativeData';
import { Sprout } from 'lucide-react';
import { CustomSelect, SelectOption } from './CustomSelect';

interface CropSelectProps {
  className?: string;
  showIcon?: boolean;
}

export const CropSelect: React.FC<CropSelectProps> = ({ className = '', showIcon = true }) => {
  const { selectedCrop, setSelectedCrop } = useDashboard();

  const cropOptions: SelectOption<KharifCropType>[] = SUPPORTED_KHARIF_CROPS.map(c => ({
    value: c.id,
    label: `${c.icon} ${c.label}`,
    badge: c.id === 'rice' ? 'Active Focus' : 'Phase 2',
  }));

  return (
    <CustomSelect<KharifCropType>
      value={selectedCrop}
      onChange={setSelectedCrop}
      options={cropOptions}
      label="CROP"
      icon={showIcon ? <Sprout className="w-3.5 h-3.5" /> : undefined}
      className={className}
      title="Filter by Kharif Crop"
    />
  );
};
