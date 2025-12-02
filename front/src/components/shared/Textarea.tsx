import React from 'react';
import { HelpCircle } from 'lucide-react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  tooltip?: string;
  icon?: React.ReactNode;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  tooltip,
  icon,
  className = '',
  ...props
}) => {
  return (
    <label className="flex flex-col min-w-40 flex-1">
      <div className="flex items-center gap-2 pb-2">
        <p className="text-[#111418] dark:text-white text-base font-medium leading-normal">
          {label}
        </p>
        {tooltip && (
          <div className="tooltip">
            <HelpCircle size={18} className="text-[#617589] dark:text-slate-400 cursor-help" />
            <span className="tooltiptext">{tooltip}</span>
          </div>
        )}
      </div>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-3 text-[#617589] dark:text-slate-400">
            {icon}
          </div>
        )}
        <textarea
          className={`form-textarea flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe0e6] dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary dark:focus:border-primary min-h-32 placeholder:text-[#617589] p-[15px] text-base font-normal leading-normal ${
            icon ? 'pl-10' : ''
          } ${className}`}
          {...props}
        />
      </div>
    </label>
  );
};