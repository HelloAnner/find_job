import React from 'react';
import { NavLink } from 'react-router-dom';
import { Settings, Zap, Bot, Home } from 'lucide-react';

const navItems = [
  { path: '/', label: '仪表板', icon: <Home size={20} /> },
  { path: '/basic', label: '基本投递设置', icon: <Settings size={20} /> },
  { path: '/advanced', label: '高级行为设置', icon: <Zap size={20} /> },
  { path: '/ai', label: 'AI助手配置', icon: <Bot size={20} /> },
];

export const Sidebar: React.FC = () => {
  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="size-10 bg-primary rounded-lg flex items-center justify-center">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#111418] dark:text-white">
              找工作机器人
            </h1>
            <p className="text-sm text-[#617589] dark:text-slate-400">
              配置管理
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-[#617589] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-[#617589] dark:text-slate-400">
              配置实时保存到 config.yaml
            </p>
            <p className="text-xs text-[#617589] dark:text-slate-400 mt-1">
              修改立即生效，无需重启
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};