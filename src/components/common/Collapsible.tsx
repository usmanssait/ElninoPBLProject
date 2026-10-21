import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAppTheme } from '../../context/ThemeContext';

interface CollapsibleProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  icon,
  defaultOpen = false,
  badge,
  children,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { isDark } = useAppTheme();

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all shadow-2xs ${
        isDark
          ? 'border-[#294338] bg-[#102019]'
          : 'border-[#CCD2C4] bg-[#EAECE4]'
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between p-3 text-left transition-colors cursor-pointer select-none ${
          isDark ? 'hover:bg-[#14271F]' : 'hover:bg-[#E2E6DC]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <span className={`shrink-0 ${isDark ? 'text-[#39B8C4]' : 'text-[#12382B]'}`}>
              {icon}
            </span>
          )}
          <span
            className={`text-xs font-semibold truncate ${
              isDark ? 'text-[#E5EEE8]' : 'text-[#16221B]'
            }`}
          >
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isDark ? 'text-[#9BAFA4]' : 'text-[#526458]'
            } ${isOpen ? (isDark ? 'rotate-180 text-[#39B8C4]' : 'rotate-180 text-[#12382B]') : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className={`p-3 border-t text-xs animate-in fade-in duration-150 ${
            isDark
              ? 'border-[#294338] text-[#9BAFA4]'
              : 'border-[#CCD2C4] text-[#3E5146]'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
};
