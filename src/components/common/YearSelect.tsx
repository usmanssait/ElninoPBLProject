import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useAppTheme } from '../../context/ThemeContext';

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
  const { isDark } = useAppTheme();
  const displayYears = years && years.length > 0 ? years : availableYears;

  React.useEffect(() => {
    if (years && years.length > 0 && !years.includes(selectedYear)) {
      const fallbackYear = years.includes(2020) ? 2020 : years[years.length - 1];
      setSelectedYear(fallbackYear);
    }
  }, [years, selectedYear, setSelectedYear]);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 transition-colors shadow-xs border ${
        isDark
          ? 'bg-[#14271F] border-[#294338] hover:border-[#39B8C4]'
          : 'bg-white border-[#CCD2C4] hover:border-[#12382B]'
      } ${className}`}
    >
      {showIcon && (
        <Calendar
          className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#39B8C4]' : 'text-[#12382B]'}`}
        />
      )}
      <div className="flex flex-col text-left">
        <span
          className={`text-[10px] uppercase font-mono leading-none ${
            isDark ? 'text-[#9BAFA4]' : 'text-[#526458]'
          }`}
        >
          Kharif Year
        </span>
        <div className="relative flex items-center mt-0.5">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className={`appearance-none bg-transparent font-mono font-bold text-xs pr-5 cursor-pointer focus:outline-hidden ${
              isDark ? 'text-[#E5EEE8]' : 'text-[#16221B]'
            }`}
          >
            {displayYears.map(yr => (
              <option
                key={yr}
                value={yr}
                className={isDark ? 'bg-[#14271F] text-[#E5EEE8]' : 'bg-white text-[#16221B]'}
              >
                {yr} – {String(yr + 1).slice(-2)}
              </option>
            ))}
          </select>
          <ChevronDown
            className={`w-3.5 h-3.5 absolute right-0 pointer-events-none ${
              isDark ? 'text-[#9BAFA4]' : 'text-[#526458]'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
