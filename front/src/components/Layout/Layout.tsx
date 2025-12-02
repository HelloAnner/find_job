import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};