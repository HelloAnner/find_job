import React from 'react';

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  tooltip?: string;
  hideLabel?: boolean;
}

// 全新开关：可键盘操作（Space/Enter），更强的可达性
export const Switch: React.FC<SwitchProps> = ({ label, checked, onChange, tooltip, hideLabel = false }) => {
  const onKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div className={`flex items-center gap-4 ${hideLabel ? 'justify-end' : 'justify-between'}`}>
      {!hideLabel && (
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
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onKeyDown={onKeyDown}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          checked ? 'bg-primary' : 'bg-[#e9edf0] dark:bg-slate-800'
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
