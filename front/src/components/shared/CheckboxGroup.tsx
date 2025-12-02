import React, { useState } from 'react';

interface CheckboxOption {
  value: string;
  label: string;
  description?: string; // 可选的选项描述
}

interface CheckboxGroupProps {
  label: string;
  tooltip?: string;
  options: CheckboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  showSelectAll?: boolean; // 是否显示全选按钮
  layout?: 'grid' | 'list'; // 布局方式
  columns?: 2 | 3 | 4; // 网格列数
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  tooltip,
  options,
  values,
  onChange,
  showSelectAll = true,
  layout = 'grid',
  columns = 3,
}) => {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const handleChange = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...values, value]);
    } else {
      onChange(values.filter(v => v !== value));
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (values.length === options.length) {
      onChange([]); // 取消全选
    } else {
      onChange(options.map(opt => opt.value)); // 全选
    }
  };

  // 反选
  const handleInvert = () => {
    const invertedValues = options
      .filter(opt => !values.includes(opt.value))
      .map(opt => opt.value);
    onChange(invertedValues);
  };

  const isAllSelected = values.length === options.length && options.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* 标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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

        {/* 选中计数和快捷操作 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#617589] dark:text-slate-400 font-medium">
            已选 {values.length}/{options.length}
          </span>

          {showSelectAll && options.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-md transition-colors"
              >
                {isAllSelected ? '取消全选' : '全选'}
              </button>
              {values.length > 0 && values.length < options.length && (
                <button
                  type="button"
                  onClick={handleInvert}
                  className="px-2 py-1 text-xs font-medium text-[#617589] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                  反选
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 选项列表 */}
      <div className={`
        ${layout === 'grid'
          ? `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns} gap-2`
          : 'flex flex-col gap-2'
        }
      `}>
        {options.map((option) => {
          const isChecked = values.includes(option.value);
          const isHovered = hoveredOption === option.value;

          return (
            <label
              key={option.value}
              className={`
                group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer select-none
                transition-all duration-200
                ${isChecked
                  ? 'bg-primary/10 dark:bg-primary/20 ring-2 ring-primary/30'
                  : 'bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }
                ${isHovered ? 'scale-[1.02] shadow-md' : ''}
              `}
              onMouseEnter={() => setHoveredOption(option.value)}
              onMouseLeave={() => setHoveredOption(null)}
            >
              {/* 复选框 */}
              <div className="relative flex-shrink-0">
                <input
                  className="peer sr-only"
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleChange(option.value, e.target.checked)}
                />
                <div className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center
                  transition-all duration-200
                  ${isChecked
                    ? 'bg-primary border-primary scale-110'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 group-hover:border-primary/50'
                  }
                `}>
                  {isChecked && (
                    <svg
                      className="w-3 h-3 text-white animate-scale-in"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>

              {/* 标签和描述 */}
              <div className="flex-1 min-w-0">
                <span className={`
                  text-sm font-medium transition-colors
                  ${isChecked
                    ? 'text-primary dark:text-primary'
                    : 'text-[#111418] dark:text-white group-hover:text-primary dark:group-hover:text-primary'
                  }
                `}>
                  {option.label}
                </span>
                {option.description && (
                  <p className="text-xs text-[#617589] dark:text-slate-400 mt-0.5">
                    {option.description}
                  </p>
                )}
              </div>

              {/* 选中指示器 */}
              {isChecked && (
                <span className="material-symbols-outlined text-primary animate-scale-in" style={{ fontSize: '16px' }}>
                  check_circle
                </span>
              )}
            </label>
          );
        })}
      </div>

      {/* 快速操作提示（可选） */}
      {values.length === 0 && options.length > 3 && (
        <div className="flex items-center gap-2 text-xs text-[#617589] dark:text-slate-400 pl-1">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
            lightbulb
          </span>
          <span>提示：点击"全选"可快速选择所有选项</span>
        </div>
      )}
    </div>
  );
};
