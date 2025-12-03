import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  tooltip?: string;
  icon?: string; // Material Symbols 图标名称
}

// 新版多行输入：更舒适的行高与焦点，支持可选图标
export const Textarea: React.FC<TextareaProps> = ({
  label,
  tooltip,
  icon,
  className = '',
  ...props
}) => {
  return (
    <label className="flex flex-col min-w-40 flex-1">
      <div className="flex items-center gap-2 pb-2">
        <p className="text-[#111418] dark:text-white text-base font-medium leading-normal">
          {label}
        </p>
        {tooltip && (
          <div className="tooltip">
            <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 cursor-help" style={{ fontSize: 18 }}>help_outline</span>
            <span className="tooltiptext">{tooltip}</span>
          </div>
        )}
      </div>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-3 text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
          </div>
        )}
        <textarea
          className={`flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-xl text-[#111418] dark:text-white placeholder:text-[#617589] bg-white dark:bg-slate-900/70 ring-1 ring-slate-200/70 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-32 p-[15px] text-[15px] leading-relaxed transition-shadow ${icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
    </label>
  );
};
