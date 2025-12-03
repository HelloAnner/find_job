import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  tooltip?: string;
  icon?: string; // Material Symbols 图标名称
}

// 全新输入框：浮动标签 + 图标可选 + 更清晰的焦点与禁用态
export const Input: React.FC<InputProps> = ({
  label,
  tooltip,
  icon,
  className = '',
  ...props
}) => {
  const [focused, setFocused] = React.useState(false);
  const hasValue = typeof props.value === 'string' ? props.value.length > 0 : false;

  const inputElement = (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8a9a] dark:text-slate-400">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
        </div>
      )}
      <input
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`
          peer flex w-full min-w-0 h-12 rounded-xl bg-white dark:bg-slate-900/70
          ring-1 ring-slate-200/70 dark:ring-white/10 px-3 text-base text-[#111418] dark:text-white
          placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow disabled:opacity-60
          ${icon ? 'pl-10' : ''} ${className}
        `}
        {...props}
      />
      {/* 浮动标签 */}
      {label && (
        <span className={`
          pointer-events-none absolute left-3 ${icon ? 'pl-7' : ''}
          top-1/2 -translate-y-1/2 text-sm text-[#7a8a9a] dark:text-slate-400 transition-all
          peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2
          ${focused || hasValue ? 'top-0 -translate-y-1/2 text-xs bg-white dark:bg-slate-900/70 px-1 rounded' : ''}
        `}>
          {label}
        </span>
      )}
    </div>
  );

  if (!label) return inputElement;

  return (
    <label className="flex flex-col min-w-40 flex-1">
      <div className="flex items-center gap-2 pb-2">
        <p className="sr-only">{label}</p>
        {tooltip && (
          <div className="tooltip">
            <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 cursor-help" style={{ fontSize: 18 }}>help_outline</span>
            <span className="tooltiptext">{tooltip}</span>
          </div>
        )}
      </div>
      {inputElement}
    </label>
  );
};
