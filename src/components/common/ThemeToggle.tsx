import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAppTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = true,
}) => {
  const { theme, toggleTheme, isDark } = useAppTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Switch to ${isDark ? 'Light (New)' : 'Dark (Old)'} scheme`}
      aria-label={`Switch to ${isDark ? 'Light (New)' : 'Dark (Old)'} scheme`}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all duration-200 cursor-pointer select-none shadow-2xs border ${
        isDark
          ? 'bg-[#0B1813] text-[#E8EFEB] border-[#1C362B] hover:border-[#22C55E]/60 hover:text-white'
          : 'bg-white text-[#16221B] border-[#CCD2C4] hover:bg-[#F4F6F2] hover:border-[#12382B]/40'
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-[#12382B] transition-transform duration-300 rotate-0 hover:-rotate-12" />
        )}
      </div>

      {showLabel && (
        <span className="flex items-center gap-1.5">
          <span className="font-semibold">{isDark ? 'Dark (Old)' : 'Light (New)'}</span>
        </span>
      )}
    </button>
  );
};
