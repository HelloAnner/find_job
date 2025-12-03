import React from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

// 设置项：上下结构（标题/描述在上，控件在下）
export const Field: React.FC<FieldProps> = ({ label, hint, children }) => {
  return (
    <div className="p-5 border-b last:border-0 border-slate-200/70 dark:border-white/10">
      <div className="flex flex-col gap-1 mb-2">
        <div className="text-sm font-medium text-[#e6eef7] dark:text-white/90 leading-normal">{label}</div>
        {hint && <div className="text-xs text-[#93a4b3] leading-normal">{hint}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
};

export default Field;
