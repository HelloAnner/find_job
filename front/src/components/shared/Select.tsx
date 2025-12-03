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

// 全新下拉选择：自绘 Listbox，支持键盘导航/ARIA，视觉与交互全面升级
export const Select: React.FC<SelectProps> = ({
  label,
  tooltip,
  value,
  options,
  onChange,
  icon,
  className = '',
}) => {
  const [open, setOpen] = React.useState(false);
  const [focusIdx, setFocusIdx] = React.useState<number>(() => Math.max(0, options.findIndex(o => o.value === value)));
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const current = options.find(o => o.value === value) || options[0];

  // 关闭下拉
  const close = () => setOpen(false);

  // 外部点击关闭
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (listRef.current?.contains(t)) return;
      close();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // 键盘导航
  const onKeyDownBtn: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
      setTimeout(() => {
        listRef.current?.focus();
      }, 0);
    }
  };

  const onKeyDownList: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); btnRef.current?.focus(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(options.length - 1, i + 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); return; }
    if (e.key === 'Home') { e.preventDefault(); setFocusIdx(0); return; }
    if (e.key === 'End') { e.preventDefault(); setFocusIdx(options.length - 1); return; }
    if (e.key === 'Enter') { e.preventDefault(); const o = options[focusIdx]; if (o) { onChange(o.value); close(); btnRef.current?.focus(); } }
  };

  React.useEffect(() => {
    // 当 value 变化时，同步焦点索引
    const idx = options.findIndex(o => o.value === value);
    if (idx >= 0) setFocusIdx(idx);
  }, [value, options]);

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

      {/* 触发按钮 */}
      <div className="relative">
        <button
          ref={btnRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          onKeyDown={onKeyDownBtn}
          className={`
            flex w-full items-center justify-between h-12 rounded-xl px-3 text-left
            bg-white dark:bg-slate-900/70 ring-1 ring-slate-200/70 dark:ring-white/10
            text-[#111418] dark:text-white transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/40
            ${className}
          `}
        >
          <span className="flex items-center gap-2 min-w-0">
            {icon && (
              <span className="material-symbols-outlined text-[#617589] dark:text-slate-400" style={{ fontSize: 20 }}>{icon}</span>
            )}
            <span className="truncate">{current?.label}</span>
          </span>
          <span className={`material-symbols-outlined text-[#617589] dark:text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} style={{ fontSize: 20 }}>
            expand_more
          </span>
        </button>

        {/* 下拉列表 */}
        {open && (
          <div
            ref={listRef}
            tabIndex={-1}
            role="listbox"
            aria-activedescendant={options[focusIdx]?.value}
            onKeyDown={onKeyDownList}
            className="absolute z-20 mt-2 w-full rounded-xl bg-white dark:bg-slate-900/95 shadow-lg ring-1 ring-slate-200/80 dark:ring-white/10 max-h-64 overflow-auto animate-fade-in"
          >
            {options.map((opt, idx) => {
              const active = idx === focusIdx;
              const selected = value === opt.value;
              return (
                <div
                  key={opt.value}
                  id={opt.value}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setFocusIdx(idx)}
                  onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); close(); btnRef.current?.focus(); }}
                  className={`
                    flex items-center justify-between px-3 py-2 cursor-pointer select-none
                    ${active ? 'bg-primary/10 dark:bg-primary/20' : ''}
                    ${selected ? 'text-primary font-medium' : 'text-[#111418] dark:text-white'}
                  `}
                >
                  <span className="truncate">{opt.label}</span>
                  {selected && (
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>check</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </label>
  );
};
