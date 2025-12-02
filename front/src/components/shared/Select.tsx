import React from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  tooltip?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  tooltip,
  value,
  options,
  onChange,
  icon,
  className = '',
}) => {
  return (
    <label className="flex flex-col min-w-40 flex-1">
      <div className="flex items-center gap-2 pb-2">
        <p className="text-[#111418] dark:text-white text-base font-medium leading-normal">
          {label}
        </p>
        {tooltip && (
          <div className="tooltip">
            <HelpCircle size={18} className="text-[#617589] dark:text-slate-400 cursor-help" />
            <span className="tooltiptext">{tooltip}</span>
          </div>
        )}
      </div>
      <div className="relative flex w-full flex-1 items-stretch rounded-lg">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#617589] dark:text-slate-400">
            {icon}
          </div>
        )}
        <select
          className={`form-select appearance-none flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe0e6] dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-[#617589] px-3 text-base font-normal leading-normal ${
            icon ? 'pl-10' : ''
          } ${className}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none text-[#617589] dark:text-slate-400 absolute right-0 flex h-full items-center justify-center pr-3">
          <ChevronDown size={20} />
        </div>
      </div>
    </label>
  );
};