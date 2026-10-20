import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

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

  return (
    <div
      className={`rounded-xl border border-[#CCD2C4] bg-[#EAECE4] overflow-hidden transition-all shadow-2xs ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-[#E2E6DC] transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-[#12382B] shrink-0">{icon}</span>}
          <span className="text-xs font-semibold text-[#16221B] truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          <ChevronDown
            className={`w-4 h-4 text-[#526458] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#12382B]' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-[#CCD2C4] text-xs text-[#3E5146] animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </div>
  );
};
