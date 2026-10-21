import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useAppTheme } from '../../context/ThemeContext';

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps<T = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  title?: string;
}

export function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  label,
  icon,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  align = 'left',
  title,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useAppTheme();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} title={title}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-2 rounded-xl transition-all cursor-pointer shadow-xs border text-left select-none ${
          label ? 'px-3 py-1.5' : 'px-2.5 py-2'
        } ${
          isDark
            ? isOpen
              ? 'bg-[#0E241C] border-[#22C55E] text-white shadow-[0_0_12px_rgba(34,197,94,0.18)]'
              : 'bg-[#060D0A] border-[#14261F] text-[#E8EFEB] hover:border-[#22C55E]/60'
            : isOpen
            ? 'bg-white border-[#12382B] text-[#16221B] shadow-sm'
            : 'bg-white border-[#CCD2C4] text-[#16221B] hover:border-[#12382B]'
        } ${buttonClassName}`}
      >
        {icon && (
          <span className={`shrink-0 ${isDark ? 'text-[#22C55E]' : 'text-[#12382B]'}`}>
            {icon}
          </span>
        )}

        <div className="flex flex-col min-w-0 pr-1">
          {label && (
            <span
              className={`text-[9.5px] uppercase font-mono font-medium leading-tight tracking-wider ${
                isDark ? 'text-[#7A9187]' : 'text-[#526458]'
              }`}
            >
              {label}
            </span>
          )}
          <span className="font-mono font-bold text-xs truncate leading-tight">
            {selectedOption ? selectedOption.label : String(value)}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${isDark ? 'text-[#7A9187]' : 'text-[#526458]'}`}
        />
      </button>

      {/* Floating Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute mt-1.5 z-50 rounded-xl border p-1 shadow-2xl backdrop-blur-md max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 ${
            align === 'right' ? 'right-0' : 'left-0'
          } min-w-[170px] ${
            isDark
              ? 'bg-[#091410] border-[#14261F] shadow-[0_8px_32px_rgba(0,0,0,0.8)]'
              : 'bg-white border-[#CCD2C4] shadow-xl'
          } ${menuClassName}`}
        >
          {options.map(option => {
            const isSelected = option.value === value;
            return (
              <div
                key={String(option.value)}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-[#0E241C] text-[#22C55E] font-bold'
                      : 'bg-[#12382B] text-white font-bold'
                    : isDark
                    ? 'text-[#E8EFEB] hover:bg-[#122A20]'
                    : 'text-[#16221B] hover:bg-[#F2F4EE]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {option.icon && <span className="shrink-0">{option.icon}</span>}
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{option.label}</span>
                    {option.sublabel && (
                      <span
                        className={`text-[10px] ${
                          isSelected
                            ? isDark
                              ? 'text-[#22C55E]/80'
                              : 'text-emerald-100'
                            : isDark
                            ? 'text-[#7A9187]'
                            : 'text-[#718277]'
                        }`}
                      >
                        {option.sublabel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {option.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        isSelected
                          ? isDark
                            ? 'bg-[#0D241B] text-[#22C55E] border border-[#173D2C]'
                            : 'bg-white/20 text-white'
                          : isDark
                          ? 'bg-[#060D0A] text-[#7A9187] border border-[#14261F]'
                          : 'bg-[#EAECE4] text-[#526458]'
                      }`}
                    >
                      {option.badge}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
