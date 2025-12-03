import React from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'find-jobs-theme';

const getInitialThemeState = () => {
  if (typeof window === 'undefined') {
    return { theme: 'dark' as Theme, manual: false };
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return { theme: stored as Theme, manual: true };
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return { theme: prefersDark ? 'dark' : 'light', manual: false };
};

// 主题切换：支持系统偏好 + 手动覆盖，并通过图标提示当前状态
export const ThemeToggle: React.FC = () => {
  const [state, setState] = React.useState(getInitialThemeState);
  const { theme, manual } = state;

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    if (manual) {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [theme, manual]);

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => {
      setState((prev) => {
        if (prev.manual) return prev;
        return { ...prev, theme: event.matches ? 'dark' : 'light' };
      });
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const toggleTheme = () => {
    setState((prev) => ({ theme: prev.theme === 'dark' ? 'light' : 'dark', manual: true }));
  };

  const icon = theme === 'dark' ? 'light_mode' : 'dark_mode';
  const description = theme === 'dark' ? '切到明亮模式' : '切到暗黑模式';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed top-5 right-5 z-40 h-12 w-12 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/15 shadow-lg backdrop-blur-md flex items-center justify-center text-[#111418] dark:text-white hover:scale-105 transition-transform"
      aria-label={description}
    >
      <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>{icon}</span>
    </button>
  );
};

export default ThemeToggle;
