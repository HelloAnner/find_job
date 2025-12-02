import React from 'react';

interface LoadingSkeletonProps {
  type?: 'page' | 'card' | 'input' | 'list';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'page', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'page':
        return (
          <div className="flex flex-col gap-8 animate-pulse">
            {/* 标题骨架 */}
            <div className="flex flex-col gap-2">
              <div className="h-9 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-5 w-96 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>

            {/* 卡片骨架 */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-6 flex flex-col gap-4">
                <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="flex flex-col gap-2">
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'card':
        return (
          <div className="card p-6 flex flex-col gap-4 animate-pulse">
            <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(count * 2)].map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'input':
        return (
          <div className="flex flex-col gap-2 animate-pulse">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        );

      case 'list':
        return (
          <div className="flex flex-col gap-2">
            {[...Array(count)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              ></div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return <>{renderSkeleton()}</>;
};

// 加载指示器（用于页面内加载）
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({
  size = 'md',
  text,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${sizeClasses[size]} border-4 border-slate-200 dark:border-slate-700 border-t-primary rounded-full animate-spin`}></div>
      {text && (
        <p className="text-sm text-[#617589] dark:text-slate-400 font-medium">{text}</p>
      )}
    </div>
  );
};

// 空状态组件
export const EmptyState: React.FC<{
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon = 'inbox', title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500" style={{ fontSize: '32px' }}>
          {icon}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-[#111418] dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[#617589] dark:text-slate-400 text-center max-w-md mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

// 错误状态组件
export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = '出错了', message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 animate-scale-in">
        <span className="material-symbols-outlined text-red-500" style={{ fontSize: '32px' }}>
          error
        </span>
      </div>
      <h3 className="text-lg font-semibold text-[#111418] dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-[#617589] dark:text-slate-400 text-center max-w-md mb-6">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            refresh
          </span>
          <span className="text-sm font-medium">重试</span>
        </button>
      )}
    </div>
  );
};
