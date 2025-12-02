import React from 'react';
import { HelpCircle } from 'lucide-react';

interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxGroupProps {
  label: string;
  tooltip?: string;
  options: CheckboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  tooltip,
  options,
  values,
  onChange,
}) => {
  const handleChange = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...values, value]);
    } else {
      onChange(values.filter(v => v !== value));
    }
  };

  return (
    <div>
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
      <div className="flex flex-wrap gap-4 pt-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
            <input
              className="form-checkbox h-5 w-5 rounded text-primary bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-primary"
              type="checkbox"
              checked={values.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
            />
            <span className="text-[#111418] dark:text-white text-base">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};