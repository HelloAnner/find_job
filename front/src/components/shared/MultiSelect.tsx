import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label: string;
  tooltip?: string;
  values: string[];
  options: Option[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  maxHeight?: number; // px
}

// 极简风格多选：按钮 + 下拉面板 + 搜索；键盘/鼠标皆可用
export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  tooltip,
  values,
  options,
  onChange,
  placeholder = '选择…',
  searchable = true,
  maxHeight = 280,
}) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [focusIdx, setFocusIdx] = React.useState(0);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter(o => o.label.toLowerCase().includes(q)) : options;
  }, [query, options]);

  const toggle = (v: string) => {
    onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v]);
  };

  // 选择一个选项后清空搜索框（用户需求：多选回车后输入框自动清空）
  const choose = (v: string) => {
    toggle(v);
    if (searchable) {
      setQuery('');
      // 继续聚焦搜索框，提高连选效率
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  };

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

  const onKeyDownBtn: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setTimeout(() => listRef.current?.focus(), 0);
    }
  };

  const onKeyDownList: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); btnRef.current?.focus(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(filtered.length - 1, i + 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); return; }
    if (e.key === 'Home') { e.preventDefault(); setFocusIdx(0); return; }
    if (e.key === 'End') { e.preventDefault(); setFocusIdx(filtered.length - 1); return; }
    if (e.key === 'Enter') { e.preventDefault(); const o = filtered[focusIdx]; if (o) choose(o.value); }
  };

  const clearAll = () => onChange([]);
  const allValues = options.map(o => o.value);
  const allSelected = values.length === allValues.length && allValues.length > 0;
  const selectAll = () => onChange(allSelected ? [] : allValues);

  return (
    <label className="flex flex-col min-w-40 flex-1">
      <div className="flex items-center gap-2 pb-2">
        <p className="text-[#111418] dark:text-white text-base font-medium leading-normal">{label}</p>
        {tooltip && (
          <div className="tooltip">
            <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 cursor-help" style={{ fontSize: 18 }}>help_outline</span>
            <span className="tooltiptext">{tooltip}</span>
          </div>
        )}
      </div>

      {/* 触发按钮：展示选择计数与若干 tag */}
      <div className="relative">
        <button
          ref={btnRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          onKeyDown={onKeyDownBtn}
          className="flex w-full items-center justify-between h-12 rounded-xl px-3 text-left bg-white dark:bg-slate-900/70 ring-1 ring-slate-200/70 dark:ring-white/10 text-[#111418] dark:text-white transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <span className="flex items-center gap-2 min-w-0">
            {values.length === 0 ? (
              <span className="text-[#7a8a9a] truncate">{placeholder}</span>
            ) : (
              <span className="flex flex-wrap items-center gap-1 truncate">
                {values.slice(0, 3).map(v => {
                  const o = options.find(x => x.value === v);
                  return (
                    <span key={v} className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 h-6 text-xs text-slate-700 dark:text-slate-200">
                      {o?.label || v}
                    </span>
                  );
                })}
                {values.length > 3 && (
                  <span className="text-xs text-[#7a8a9a]">+{values.length - 3}</span>
                )}
              </span>
            )}
          </span>
          <span className={`material-symbols-outlined text-[#617589] dark:text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} style={{ fontSize: 20 }}>expand_more</span>
        </button>

        {open && (
          <div
            ref={listRef}
            tabIndex={-1}
            role="listbox"
            aria-multiselectable
            onKeyDown={onKeyDownList}
            className="absolute z-20 mt-2 w-full rounded-xl bg-white dark:bg-slate-900/95 shadow-lg ring-1 ring-slate-200/80 dark:ring-white/10 overflow-hidden animate-fade-in"
          >
            {/* 顶部操作区 */}
            <div className="flex items-center gap-2 p-2 border-b border-slate-200/70 dark:border-white/10">
              {searchable && (
                <div className="flex-1">
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setFocusIdx(0); }}
                    className="w-full h-9 rounded-lg bg-white dark:bg-slate-900/70 ring-1 ring-slate-200/70 dark:ring-white/10 px-2 text-sm placeholder:text-[#7a8a9a] focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="搜索选项…"
                  />
                </div>
              )}
              <button type="button" onClick={selectAll} className="px-2 h-9 text-xs rounded-md text-primary hover:bg-primary/10">{allSelected ? '取消全选' : '全选'}</button>
              {values.length > 0 && (
                <button type="button" onClick={clearAll} className="px-2 h-9 text-xs rounded-md text-[#7a8a9a] hover:bg-slate-100 dark:hover:bg-slate-800">清空</button>
              )}
            </div>

            {/* 列表 */}
            <div style={{ maxHeight }} className="overflow-auto py-1">
              {filtered.length === 0 && (
                <div className="px-3 py-6 text-sm text-[#7a8a9a] text-center">无匹配项</div>
              )}
              {filtered.map((o, idx) => {
                const selected = values.includes(o.value);
                const active = idx === focusIdx;
                return (
                <div
                  key={o.value}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setFocusIdx(idx)}
                  onMouseDown={(e) => { e.preventDefault(); choose(o.value); }}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer select-none ${active ? 'bg-primary/10 dark:bg-primary/20' : ''}`}
                >
                    <span className="truncate text-sm">{o.label}</span>
                    <span className={`material-symbols-outlined ${selected ? 'text-primary' : 'text-transparent'}`} style={{ fontSize: 18 }}>check</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </label>
  );
};

export default MultiSelect;
