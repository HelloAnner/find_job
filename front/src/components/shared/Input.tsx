import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  tooltip?: string;
  icon?: string; // Material Symbols 图标名称
}

// 输入框：顶部标签 + 更清晰的焦点与禁用态，避免浮动标签导致文字重叠
export const Input: React.FC<InputProps> = ({
  label,
  tooltip,
  icon,
  className = '',
  placeholder,
  ...props
}) => {
  const showLabel = Boolean(label);

  return (
    <label className="flex flex-col min-w-0 flex-1 gap-2">
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-medium text-[#93a4b3] uppercase tracking-wide">
          <span>{label}</span>
          {tooltip && (
            <span className="tooltip">
              <span className="material-symbols-outlined text-[#93a4b3] cursor-help" style={{ fontSize: 16 }}>help_outline</span>
              <span className="tooltiptext">{tooltip}</span>
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8a9a] dark:text-slate-400">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
          </div>
        )}
        <input
          className={`
            flex w-full min-w-0 h-12 rounded-xl bg-[var(--surface)]
            ring-1 ring-slate-200/70 dark:ring-white/10 px-3 text-base text-[#111418] dark:text-white
            placeholder:text-[#93a4b3] focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow disabled:opacity-60
            ${icon ? 'pl-10' : ''} ${className}
          `}
          placeholder={placeholder}
          {...props}
        />
      </div>
    </label>
  );
};
