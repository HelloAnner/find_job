import React from 'react';

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

// 极简风格设置分组：标题 + 说明 + 卡片容器
export const Section: React.FC<SectionProps> = ({ title, description, children }) => {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[18px] font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-[#7a8a9a] leading-normal">{description}</p>
        )}
      </div>
      <div className="bg-white dark:bg-slate-900/70 ring-1 ring-slate-200/70 dark:ring-white/10 rounded-2xl">
        {children}
      </div>
    </section>
  );
};

export default Section;

