import React from 'react';
import { Sidebar } from './Sidebar';
import { SaveIndicator } from '../SaveIndicator';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* 页面主容器：与 ui 设计文件对齐外边距 */}
        <div className="px-4 sm:px-8 md:px-12 lg:px-16 xl:px-24 flex flex-1 justify-center py-6">
          {/* 添加页面切换动画 */}
          <div className="flex flex-col w-full max-w-[960px] gap-8 animate-fade-in">
            {children}
          </div>
        </div>
      </main>
      {/* 右下角自动保存提示 */}
      <SaveIndicator />
    </div>
  );
};
