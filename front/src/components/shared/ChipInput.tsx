import React, { useRef, useState } from 'react';

interface ChipInputProps {
  label: string;
  tooltip?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  allowDuplicates?: boolean;
  suggestions?: string[]; // 可选的自动完成建议
  maxItems?: number; // 最大条目数限制
}

// Chip 输入（上下结构版本）：
// - 上：固定高度输入框（不因已选项而挪动/换行）
// - 下：已添加项区域（可滚动），支持双击编辑/点击移除
export const ChipInput: React.FC<ChipInputProps> = ({
  label,
  tooltip,
  values,
  onChange,
  placeholder = '输入后按 Enter 添加，支持批量粘贴',
  allowDuplicates = false,
  suggestions = [],
  maxItems,
}) => {
  const [input, setInput] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLLabelElement>(null);

  const commit = (raw: string) => {
    if (!raw.trim()) return;
    if (maxItems && values.length >= maxItems) {
      setError(`最多只能添加 ${maxItems} 个条目`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    const parts = raw
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
      .filter(v => allowDuplicates || !values.includes(v));
    if (!parts.length) {
      if (!allowDuplicates && raw.trim()) {
        setError('该值已存在');
        setTimeout(() => setError(''), 2000);
      }
      return;
    }
    if (maxItems && values.length + parts.length > maxItems) {
      const remaining = maxItems - values.length;
      setError(`只能再添加 ${remaining} 个条目`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    onChange([...values, ...parts]);
    setInput('');
    setError('');
  };

  const removeAt = (idx: number) => {
    const next = values.filter((_, i) => i !== idx);
    onChange(next);
    inputRef.current?.focus();
  };

  const clearAll = () => {
    if (window.confirm(`确定要清空所有 ${values.length} 个条目吗？`)) {
      onChange([]);
      setInput('');
      inputRef.current?.focus();
    }
  };

  const startEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditingValue(values[idx]);
  };

  const saveEdit = (idx: number) => {
    const newValue = editingValue.trim();
    if (newValue && (allowDuplicates || !values.includes(newValue) || values[idx] === newValue)) {
      const next = [...values];
      next[idx] = newValue;
      onChange(next);
    }
    setEditingIndex(null);
    setEditingValue('');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(input); }
    else if (e.key === 'Backspace' && !input && values.length) { e.preventDefault(); removeAt(values.length - 1); }
    else if (e.key === 'Escape') { setInput(''); setError(''); inputRef.current?.blur(); }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    setError('');
    setShowSuggestions(!!val && suggestions.length > 0);
  };

  const selectSuggestion = (value: string) => { commit(value); setShowSuggestions(false); };

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        if (editingIndex !== null) saveEdit(editingIndex);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingIndex, editingValue, values]);

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !values.includes(s)
  );

  const isMaxReached = maxItems ? values.length >= maxItems : false;

  return (
    <label className="flex flex-col min-w-40 flex-1 relative" ref={wrapperRef}>
      {/* 顶部：标题与操作 */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <p className="text-[#e6eef7] dark:text-white/90 text-sm font-medium leading-normal">{label}</p>
          {tooltip && (
            <div className="tooltip">
              <span className="material-symbols-outlined text-[#93a4b3] cursor-help" style={{ fontSize: 18 }}>help_outline</span>
              <span className="tooltiptext">{tooltip}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {values.length > 0 && (
            <button type="button" onClick={clearAll} className="px-2 py-1 text-xs rounded-md text-[#93a4b3] hover:bg-slate-800/60 transition-colors">清空</button>
          )}
          <span className="text-xs text-[#93a4b3] font-medium">{values.length} 个</span>
        </div>
      </div>

      {/* 中部：固定高度输入框（不随条目变化） */}
      <div className={`relative ${isMaxReached ? 'opacity-60' : ''}`}>
        <input
          ref={inputRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          onFocus={() => setShowSuggestions(input.length > 0 && suggestions.length > 0)}
          disabled={isMaxReached}
          className="w-full h-12 rounded-xl bg-[var(--surface)] ring-1 ring-slate-200/70 dark:ring-white/10 px-3 text-sm text-[#111418] dark:text-white placeholder:text-[#93a4b3] focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed"
          placeholder={isMaxReached ? '已达到最大数量' : placeholder}
        />
        {input && !isMaxReached && (
          <button type="button" onClick={() => commit(input)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-primary/20 transition-colors" aria-label="添加">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>add</span>
          </button>
        )}

        {/* 建议下拉：跟随输入框 */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-[var(--surface)] shadow-lg max-h-40 overflow-y-auto z-10 animate-fade-in">
            {filteredSuggestions.map((s, idx) => (
              <div key={`${s}-${idx}`} onClick={() => selectSuggestion(s)} className="px-3 py-2 text-sm cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 flex items-center gap-2 transition-colors">
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 14 }}>add</span>
                <span className="text-slate-700 dark:text-slate-200">{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-1 mt-1 text-xs text-red-500 dark:text-red-400 animate-slide-in">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>error</span>
          <span>{error}</span>
        </div>
      )}

      {/* 底部：已添加项（不影响输入框高度） */}
      <div className="mt-3 rounded-xl ring-1 ring-slate-200/70 dark:ring-white/10 bg-white/60 dark:bg-[#0f1922] p-2 min-h-[42px]">
        {values.length === 0 ? (
          <div className="text-xs text-[#93a4b3] px-1 py-1">暂无条目</div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {values.map((v, i) => (
              <span
                key={`${v}-${i}`}
                onDoubleClick={() => !isMaxReached && startEdit(i)}
                className={`${editingIndex === i ? 'ring-2 ring-primary/40 bg-white dark:bg-slate-800' : 'bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 text-slate-700 dark:text-slate-200 hover:from-primary/20 hover:to-primary/10 dark:hover:from-primary/30 dark:hover:to-primary/20'} inline-flex items-center gap-1 rounded-full px-2.5 h-8 text-sm transition-all duration-200 animate-slide-in ${editingIndex === i ? 'cursor-text' : 'cursor-default hover:scale-105'}`}
              >
                {editingIndex === i ? (
                  <>
                    <input
                      autoFocus
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); saveEdit(i); }
                        else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
                      }}
                      className="bg-transparent outline-none text-sm max-w-[8rem] text-[#111418] dark:text-white"
                    />
                    <button type="button" className="p-0.5 rounded-full hover:bg-primary/20 transition-colors" onClick={() => saveEdit(i)}>
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: 14 }}>check</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="truncate max-w-[10rem]">{v}</span>
                    <button
                      type="button"
                      className="p-0.5 rounded-full hover:bg-red-500/20 dark:hover:bg-red-400/20 transition-colors group"
                      onClick={(e) => { e.stopPropagation(); removeAt(i); }}
                      aria-label={`移除 ${v}`}
                    >
                      <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" style={{ fontSize: 14 }}>close</span>
                    </button>
                  </>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </label>
  );
};
