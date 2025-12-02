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

// 现代化"多值输入"组件：使用 Material Symbols 图标
// - 支持回车/逗号添加 Chip
// - 点击叉号或退格键移除
// - 双击 Chip 可编辑
// - 批量粘贴多个值
// - 一键清空
// - 条目数量提示
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

  // 提交新值
  const commit = (raw: string) => {
    if (!raw.trim()) return;

    // 检查是否达到最大条目数
    if (maxItems && values.length >= maxItems) {
      setError(`最多只能添加 ${maxItems} 个条目`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    // 支持批量输入：逗号分隔
    const parts = raw
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
      .filter(v => allowDuplicates || !values.includes(v)); // 去重

    if (!parts.length) {
      if (!allowDuplicates && raw.trim()) {
        setError('该值已存在');
        setTimeout(() => setError(''), 2000);
      }
      return;
    }

    // 检查批量添加后是否超出限制
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

  // 移除值
  const removeAt = (idx: number) => {
    const next = values.filter((_, i) => i !== idx);
    onChange(next);
    inputRef.current?.focus();
  };

  // 一键清空
  const clearAll = () => {
    if (window.confirm(`确定要清空所有 ${values.length} 个条目吗？`)) {
      onChange([]);
      setInput('');
      inputRef.current?.focus();
    }
  };

  // 开始编辑
  const startEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditingValue(values[idx]);
  };

  // 保存编辑
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

  // 取消编辑
  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  // 键盘处理
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit(input);
    } else if (e.key === 'Backspace' && !input && values.length) {
      // 退格删除最后一个
      e.preventDefault();
      removeAt(values.length - 1);
    } else if (e.key === 'Escape') {
      setInput('');
      setError('');
      inputRef.current?.blur();
    }
  };

  // 处理输入变化（过滤建议）
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    setError('');
    setShowSuggestions(!!val && suggestions.length > 0);
  };

  // 选择建议
  const selectSuggestion = (value: string) => {
    commit(value);
    setShowSuggestions(false);
  };

  // 点击外部关闭建议
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        if (editingIndex !== null) {
          saveEdit(editingIndex);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingIndex, editingValue, values]);

  // 过滤建议
  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !values.includes(s)
  );

  const isMaxReached = maxItems ? values.length >= maxItems : false;

  return (
    <label className="flex flex-col min-w-40 flex-1 relative" ref={wrapperRef}>
      {/* 标题和操作栏 */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <p className="text-[#111418] dark:text-white text-base font-medium leading-normal">{label}</p>
          {tooltip && (
            <div className="tooltip">
              <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 cursor-help" style={{ fontSize: '18px' }}>
                help_outline
              </span>
              <span className="tooltiptext">{tooltip}</span>
            </div>
          )}
        </div>

        {/* 条目计数和清空按钮 */}
        {values.length > 0 && (
          <div className="flex items-center gap-2 animate-fade-in">
            <span className={`text-xs font-medium ${isMaxReached ? 'text-orange-500' : 'text-[#617589] dark:text-slate-400'}`}>
              {values.length}{maxItems ? `/${maxItems}` : ''} 条
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:underline transition-colors"
              title="清空所有"
            >
              清空
            </button>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className={`
        flex min-h-12 items-center gap-2 rounded-xl bg-white dark:bg-slate-900/70 ring-1 transition-all
        ${error
          ? 'ring-2 ring-red-500 dark:ring-red-400'
          : 'ring-slate-200/70 dark:ring-white/10 focus-within:ring-2 focus-within:ring-primary/40'
        }
        ${isMaxReached ? 'opacity-60' : ''}
        px-2 py-1
      `}>
        {/* 已选 Chip */}
        <div className="flex flex-wrap items-center gap-2 py-1">
          {values.map((v, i) => (
            <span
              key={`${v}-${i}`}
              onDoubleClick={() => !isMaxReached && startEdit(i)}
              className={`
                inline-flex items-center gap-1 rounded-full px-2.5 h-8 text-sm
                transition-all duration-200 animate-slide-in
                ${editingIndex === i
                  ? 'ring-2 ring-primary/40 bg-white dark:bg-slate-800'
                  : 'bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 text-slate-700 dark:text-slate-200 hover:from-primary/20 hover:to-primary/10 dark:hover:from-primary/30 dark:hover:to-primary/20'
                }
                ${editingIndex === i ? 'cursor-text' : 'cursor-default hover:scale-105'}
              `}
            >
              {editingIndex === i ? (
                <>
                  <input
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveEdit(i);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelEdit();
                      }
                    }}
                    className="bg-transparent outline-none text-sm max-w-[8rem] text-[#111418] dark:text-white"
                  />
                  <button type="button" className="p-0.5 rounded-full hover:bg-primary/20 transition-colors" onClick={() => saveEdit(i)}>
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '14px' }}>check</span>
                  </button>
                </>
              ) : (
                <>
                  <span className="truncate max-w-[10rem]">{v}</span>
                  <button
                    type="button"
                    className="p-0.5 rounded-full hover:bg-red-500/20 dark:hover:bg-red-400/20 transition-colors group"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAt(i);
                    }}
                    aria-label={`移除 ${v}`}
                  >
                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" style={{ fontSize: '14px' }}>close</span>
                  </button>
                </>
              )}
            </span>
          ))}
        </div>
        {/* 输入框 */}
        <input
          ref={inputRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          onFocus={() => setShowSuggestions(input.length > 0 && suggestions.length > 0)}
          disabled={isMaxReached}
          className="flex-1 min-w-[8rem] bg-transparent outline-none h-10 px-2 text-[#111418] dark:text-white placeholder:text-[#617589] text-sm disabled:cursor-not-allowed"
          placeholder={isMaxReached ? '已达到最大数量' : placeholder}
        />
        {/* 添加按钮 */}
        {input && !isMaxReached && (
          <button
            type="button"
            onClick={() => commit(input)}
            className="p-1 rounded-full hover:bg-primary/20 transition-colors animate-scale-in"
            aria-label="添加"
          >
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>add</span>
          </button>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-1 mt-1 text-xs text-red-500 dark:text-red-400 animate-slide-in">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
          <span>{error}</span>
        </div>
      )}

      {/* 自动完成建议 */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg max-h-40 overflow-y-auto z-10 animate-fade-in">
          {filteredSuggestions.map((s, idx) => (
            <div
              key={`${s}-${idx}`}
              onClick={() => selectSuggestion(s)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '14px' }}>add</span>
              <span className="text-slate-700 dark:text-slate-200">{s}</span>
            </div>
          ))}
        </div>
      )}
    </label>
  );
};
