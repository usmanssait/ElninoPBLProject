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
      className={`rounded-xl border border-[#14261F] bg-[#060D0A] overflow-hidden transition-all ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-[#0B1A14]/40 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-[#22C55E] shrink-0">{icon}</span>}
          <span className="text-xs font-semibold text-[#D3E2DA] truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          <ChevronDown
            className={`w-4 h-4 text-[#7A9187] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#22C55E]' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-[#14261F] text-xs text-[#A4B8AF] animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </div>
  );
};
