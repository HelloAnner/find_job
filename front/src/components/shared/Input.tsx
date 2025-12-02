import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  tooltip?: string;
  icon?: string; // Material Symbols 图标名称
}

export const Input: React.FC<InputProps> = ({
  label,
  tooltip,
  icon,
  className = '',
  ...props
}) => {
  const inputElement = (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#617589] dark:text-slate-400">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {icon}
          </span>
        </div>
      )}
      <input
        className={`flex w-full min-w-0 flex-1 h-12 rounded-xl text-[#111418] dark:text-white placeholder:text-[#617589] bg-white dark:bg-slate-900/70 ring-1 ring-slate-200/70 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow ${
          icon ? 'pl-10 pr-3' : 'px-3'
        } ${className}`}
        {...props}
      />
    </div>
  );

  if (!label) {
    return inputElement;
  }

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
      {inputElement}
    </label>
  );
};
