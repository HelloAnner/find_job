import React from 'react';
import { NavLink } from 'react-router-dom';

// 全新侧边栏：窄栏 + 图标为主 + 气泡提示；强调当前页，整体更简洁
const navItems = [
  { path: '/basic', label: '基本设置', icon: 'tune' },
  { path: '/advanced', label: '高级设置', icon: 'settings' },
  { path: '/ai', label: 'AI 配置', icon: 'smart_toy' },
  { path: '/credentials', label: '登录凭证', icon: 'key' },
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
          <div className="text-sm font-semibold text-[#0f172a] dark:text-white/90">find_jobs</div>
          <div className="text-xs text-[#5f6b76] dark:text-[#93a4b3]">配置面板</div>
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

      {/* GitHub 图标 - 固定在底部 */}
      <div className="absolute bottom-4 left-0 right-0 px-4">
        <a
          href="https://github.com/HelloAnner/find_job"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-12 h-12 mx-auto rounded-xl bg-slate-100/60 dark:bg-slate-900/40 hover:bg-slate-200/80 dark:hover:bg-slate-800/60 transition-colors group"
          title="访问 GitHub 仓库"
        >
          <svg
            className="w-5 h-5 text-[#617589] dark:text-slate-400 group-hover:text-primary transition-colors"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.492.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </div>
    </aside>
  );
};
