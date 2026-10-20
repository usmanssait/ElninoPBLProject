import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

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

  return (
    <div
      className={`inline-flex items-center gap-2 bg-[#0B1A14] border border-[#173026] hover:border-[#22C55E]/50 rounded-xl px-3 py-1.5 transition-colors ${className}`}
    >
      {showIcon && <Calendar className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />}
      <div className="flex flex-col text-left">
        <span className="text-[10px] uppercase font-mono text-[#71877E] leading-none">
          Kharif Year
        </span>
        <div className="relative flex items-center mt-0.5">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="appearance-none bg-transparent text-white font-mono font-bold text-xs pr-5 cursor-pointer focus:outline-hidden"
          >
            {displayYears.map(yr => (
              <option key={yr} value={yr} className="bg-[#08120E] text-white">
                {yr} – {String(yr + 1).slice(-2)}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#7A9187] absolute right-0 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
