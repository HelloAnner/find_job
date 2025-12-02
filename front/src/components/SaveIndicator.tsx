import React, { useEffect, useState } from 'react';
import { useConfig } from '@/contexts/ConfigContext';

// 右下角自动保存指示器：保存中显示旋转；保存成功后短暂显示“已保存”
export const SaveIndicator: React.FC = () => {
  const { saving, lastSavedAt } = useConfig();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (saving) {
      setVisible(true);
      return;
    }
    if (lastSavedAt) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 1500);
      return () => clearTimeout(t);
    }
  }, [saving, lastSavedAt]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex items-center gap-2 rounded-full bg-[#111418] text-white/90 dark:bg-white/10 backdrop-blur px-3 py-1.5 shadow-lg ring-1 ring-black/10 dark:ring-white/10">
        {saving ? (
          <div className="size-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
        ) : (
          <svg className="size-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        )}
        <span className="text-xs font-medium">
          {saving ? '正在保存…' : '已自动保存'}
        </span>
      </div>
    </div>
  );
};

