import React from 'react';
import { NavLink } from 'react-router-dom';

// 全新侧边栏：窄栏 + 图标为主 + 气泡提示；强调当前页，整体更简洁
const navItems = [
  { path: '/basic', label: '基本设置', icon: 'tune' },
  { path: '/advanced', label: '高级设置', icon: 'settings' },
  { path: '/ai', label: 'AI 配置', icon: 'smart_toy' },
];

export const Sidebar: React.FC = () => {
  return (
    // 固定在左侧，任何情况下不随内容滚动
    <aside className="fixed inset-y-0 left-0 w-64 bg-white/90 dark:bg-[#0b141c]/90 backdrop-blur border-r border-slate-200/80 dark:border-white/10 overflow-hidden z-40">
      {/* 品牌区：默认展开并水平展示文字 */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200/80 dark:border-white/10">
        <div className="size-9 bg-gradient-to-br from-primary/90 to-primary rounded-xl text-white grid place-items-center shadow-sm">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>work</span>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/90">find_jobs</div>
          <div className="text-xs text-[#93a4b3]">配置面板</div>
        </div>
      </div>

      {/* 导航：默认展开，文字水平展示 */}
      <nav className="mt-3 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors
              ${isActive
                ? 'bg-primary/10 text-[#111418] dark:text-white ring-1 ring-primary/30'
                : 'text-[#617589] dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/40'}
            `}
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`} style={{ fontSize: 20 }}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
