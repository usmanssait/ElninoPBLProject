import React from 'react';
import { Calendar } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { CustomSelect, SelectOption } from './CustomSelect';

interface YearSelectProps {
  className?: string;
  showIcon?: boolean;
  years?: number[];
}

export const YearSelect: React.FC<YearSelectProps> = ({
  className = '',
  showIcon = true,
  years,
}) => {
  const { selectedYear, setSelectedYear, availableYears } = useDashboard();
  const displayYears = years && years.length > 0 ? years : availableYears;

  React.useEffect(() => {
    if (years && years.length > 0 && !years.includes(selectedYear)) {
      const fallbackYear = years.includes(2020) ? 2020 : years[years.length - 1];
      setSelectedYear(fallbackYear);
    }
  }, [years, selectedYear, setSelectedYear]);

  const options: SelectOption<number>[] = displayYears.map(yr => ({
    value: yr,
    label: `${yr} – ${String(yr + 1).slice(-2)}`,
    badge: yr === 2015 ? 'El Niño' : yr === 2020 ? 'Baseline' : undefined,
  }));

  return (
    <CustomSelect<number>
      value={selectedYear}
      onChange={setSelectedYear}
      options={options}
      label="Kharif Year"
      icon={showIcon ? <Calendar className="w-3.5 h-3.5" /> : undefined}
      className={className}
      title="Select Kharif Season"
    />
  );
};
