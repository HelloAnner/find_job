import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/basic', label: '基本投递设置', icon: 'settings' },
  { path: '/advanced', label: '高级行为设置', icon: 'tune' },
  { path: '/ai', label: 'AI助手配置', icon: 'smart_toy' },
];

export const Sidebar: React.FC = () => {
  return (
    <div className="w-64 bg-white dark:bg-[#101922] border-r border-slate-200 dark:border-white/10 h-screen sticky top-0 overflow-y-auto">
      <div className="p-6">
        {/* 品牌Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center">
            <svg fill="currentColor" className="w-6 h-6 text-white" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#111418] dark:text-white tracking-[-0.015em]">
              找工作机器人
            </h1>
            <p className="text-sm text-[#617589] dark:text-slate-400">
              配置管理
            </p>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#f6f7f8] dark:bg-slate-900/70 text-[#111418] dark:text-white ring-1 ring-slate-200/70 dark:ring-white/10 shadow-sm font-medium'
                    : 'text-[#617589] dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-900/30 hover:text-[#111418] dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`material-symbols-outlined ${isActive ? 'text-primary' : 'text-[#617589] dark:text-slate-400'}`}
                    style={{ fontSize: '20px' }}
                  >
                    {item.icon}
                  </span>
                  <span className="text-base">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 底部提示 */}
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/10">
          <div className="px-4 py-3 bg-slate-100/50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-white/10">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: '18px' }}>
                info
              </span>
              <div>
                <p className="text-sm text-[#617589] dark:text-slate-400 font-medium">
                  配置实时保存
                </p>
                <p className="text-xs text-[#617589] dark:text-slate-400 mt-0.5">
                  修改立即生效，无需重启
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
