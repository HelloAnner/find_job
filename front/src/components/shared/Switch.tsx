import React from 'react';

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  tooltip?: string;
}

// 现代化开关组件：无外部依赖，纯 Tailwind
export const Switch: React.FC<SwitchProps> = ({ label, checked, onChange, tooltip }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <p className="text-[#111418] dark:text-white text-base font-medium leading-normal flex-1 truncate">
          {label}
        </p>
        {tooltip && (
          <div className="tooltip">
            <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 cursor-help" style={{ fontSize: 18 }}>help_outline</span>
            <span className="tooltiptext">{tooltip}</span>
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          checked ? 'bg-primary' : 'bg-[#f0f2f4] dark:bg-slate-800'
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

