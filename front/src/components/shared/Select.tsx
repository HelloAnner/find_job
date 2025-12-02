import React from 'react';

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
  icon?: string; // Material Symbols 图标名称
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
            <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 cursor-help" style={{ fontSize: '18px' }}>
              help_outline
            </span>
            <span className="tooltiptext">{tooltip}</span>
          </div>
        )}
      </div>
      <div className="relative flex w-full flex-1 items-stretch rounded-xl">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {icon}
            </span>
          </div>
        )}
        <select
          className={`appearance-none flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111418] dark:text-white bg-white dark:bg-slate-900/70 ring-1 ring-slate-200/70 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40 h-12 placeholder:text-[#617589] px-3 text-base font-normal leading-normal transition-shadow ${
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
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
    </label>
  );
};
