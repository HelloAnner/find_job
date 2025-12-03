import React from 'react';
import { Sidebar } from './Sidebar';
import { SaveIndicator } from '../SaveIndicator';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* 固定左侧边栏 */}
      <Sidebar />

      {/* 右侧内容区域：单独滚动，左侧保持固定 */}
      <main className="ml-64 h-screen overflow-y-auto bg-background-light dark:bg-background-dark">
        {/* 新版容器：≥xl 使用可用区域的 2/3，视觉更轻盈；小屏占满 */}
        <div className="px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40 flex flex-1 justify-center py-8">
          <div className="flex flex-col w-full xl:w-2/3 gap-8 animate-fade-in">
            {children}
          </div>
        </div>
      </main>

      {/* 右下角自动保存提示 */}
      <SaveIndicator />
    </div>
  );
};
