import React from 'react';
import { useConfig } from '@/contexts/ConfigContext';
import { CheckboxGroup } from '@/components/shared/CheckboxGroup';
import { ChipInput } from '@/components/shared/ChipInput';
import { Input } from '@/components/shared/Input';
import { Select as NiceSelect } from '@/components/shared/Select';
import { Switch } from '@/components/shared/Switch';

const experienceOptions = [
  { value: '不限', label: '不限' },
  { value: '在校生', label: '在校/应届' },
  { value: '1年以下', label: '1年以下' },
  { value: '1-3年', label: '1-3年' },
  { value: '3-5年', label: '3-5年' },
  { value: '5-10年', label: '5-10年' },
  { value: '10年以上', label: '10年以上' },
];

const degreeOptions = [
  { value: '不限', label: '不限' },
  { value: '大专', label: '大专' },
  { value: '本科', label: '本科' },
  { value: '硕士', label: '硕士' },
  { value: '博士', label: '博士' },
];

const scaleOptions = [
  { value: '0-20人', label: '0-20人' },
  { value: '20-99人', label: '20-99人' },
  { value: '100-499人', label: '100-499人' },
  { value: '500-999人', label: '500-999人' },
  { value: '1000-9999人', label: '1000-9999人' },
  { value: '10000人以上', label: '10000人以上' },
];

const stageOptions = [
  { value: '未融资', label: '未融资' },
  { value: '天使轮', label: '天使轮' },
  { value: 'A轮', label: 'A轮' },
  { value: 'B轮', label: 'B轮' },
  { value: 'C轮', label: 'C轮' },
  { value: 'D轮及以上', label: 'D轮及以上' },
  { value: '已上市', label: '已上市' },
  { value: '不需要融资', label: '不需要融资' },
];

export const BasicSettings: React.FC = () => {
  const { config, updateConfig, resetConfig } = useConfig();

  // 关键词与地域已改为 ChipInput，直接在 onChange 中更新数组，无需本地 split 逻辑

  const handleExperienceChange = (value: string) => {
    updateConfig({ boss: { ...config.boss, experience: [value] } });
  };

  const handleDegreeChange = (value: string) => {
    updateConfig({ boss: { ...config.boss, degree: [value] } });
  };

  const handleScaleChange = (values: string[]) => {
    updateConfig({ boss: { ...config.boss, scale: values } });
  };

  const handleStageChange = (values: string[]) => {
    updateConfig({ boss: { ...config.boss, stage: values } });
  };

  const handleSalaryChange = (min: string, max: string) => {
    updateConfig({
      boss: {
        ...config.boss,
        expectedSalary: [parseInt(min) || 0, parseInt(max) || 0]
      }
    });
  };

  // 自动保存：已在 ConfigProvider 中实现，这里不再提供手动保存

  const handleReset = () => {
    if (window.confirm('确定要重置所有设置吗？重置后需要重新保存才会生效。')) {
      resetConfig();
    }
  };

  // 城市 Chip 专用：支持 "全国/不限" 逻辑，与其他城市互斥
  const handleCityChipsChange = (vals: string[]) => {
    const cleaned = Array.from(new Set(vals.map(v => v.trim()).filter(Boolean)));
    const hasAll = cleaned.some(v => v === '全国' || v === '不限');
    const next = hasAll ? ['全国'] : cleaned;
    updateConfig({ boss: { ...config.boss, cityCode: next } });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-[#111418] dark:text-white text-3xl font-bold leading-tight tracking-[-0.02em]">
          基本投递设置
        </h1>
        <p className="text-[#617589] dark:text-slate-400 text-base font-normal leading-normal">
          在这里自定义您的自动化机器人行为和参数，精准匹配职位。
        </p>
      </div>

      {/* 职位偏好 */}
      <div className="card p-6 flex flex-col gap-4">
        <h2 className="text-[#111418] dark:text-white text-xl font-semibold leading-tight tracking-tight px-4 pb-3 pt-2 border-b border-slate-200 dark:border-white/10">
          职位偏好
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 px-4 py-3">
          <ChipInput
            label="职位名称/关键词"
            tooltip="输入后按 Enter 添加，或用逗号分隔，例如 '前端开发, React'"
            values={config.boss.keywords}
            onChange={(vals) => updateConfig({ boss: { ...config.boss, keywords: vals } })}
            placeholder="例如：前端开发、React、Vue"
          />

          <div className="flex flex-col min-w-40 flex-1 justify-end">
            <Switch
              label="关键词扩展"
              tooltip="启用后，机器人将自动扩展您的关键词，寻找更多相关职位。"
              checked={config.boss.enableAI}
              onChange={(v) => updateConfig({ boss: { ...config.boss, enableAI: v } })}
            />
          </div>
        </div>
      </div>

      {/* 求职要求 */}
      <div className="card p-6 flex flex-col gap-4">
        <h2 className="text-[#111418] dark:text-white text-xl font-semibold leading-tight tracking-tight px-4 pb-3 pt-2 border-b border-slate-200 dark:border-white/10">
          求职要求
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 px-4 py-3">
          <ChipInput
            label="地域"
            tooltip="可输入多个城市，按 Enter 或用逗号分隔新增；支持输入“全国”（与其他城市互斥）。"
            values={config.boss.cityCode}
            onChange={handleCityChipsChange}
            placeholder="例如：北京、上海、深圳"
          />

          <NiceSelect
            label="经验"
            tooltip="选择您期望的职位工作经验要求。"
            value={config.boss.experience[0] || '不限'}
            onChange={handleExperienceChange}
            options={experienceOptions}
          />

          <div className="flex flex-col min-w-40 flex-1">
            <div className="flex items-center gap-2 pb-2">
              <p className="text-[#111418] dark:text-white text-base font-medium leading-normal">薪资 (千/月)</p>
              <div className="tooltip">
                <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 cursor-help" style={{ fontSize: '18px' }}>
                  help_outline
                </span>
                <span className="tooltiptext">设置您期望的月薪范围，单位为千元（k）。留空表示不限。</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="最低"
                type="number"
                value={(config.boss.expectedSalary[0] || '').toString()}
                onChange={(e) => handleSalaryChange(e.currentTarget.value, config.boss.expectedSalary[1]?.toString() || '')}
                placeholder="最低"
              />
              <Input
                label="最高"
                type="number"
                value={(config.boss.expectedSalary[1] || '').toString()}
                onChange={(e) => handleSalaryChange(config.boss.expectedSalary[0]?.toString() || '', e.currentTarget.value)}
                placeholder="最高"
              />
            </div>
          </div>

          <NiceSelect
            label="学历"
            tooltip="选择职位要求的最低学历。"
            value={config.boss.degree[0] || '不限'}
            onChange={handleDegreeChange}
            options={degreeOptions}
          />
        </div>
      </div>

      {/* 公司偏好 */}
      <div className="card p-6 flex flex-col gap-4">
        <h2 className="text-[#111418] dark:text-white text-xl font-semibold leading-tight tracking-tight px-4 pb-3 pt-2 border-b border-slate-200 dark:border-white/10">
          公司偏好
        </h2>

        <div className="px-4 py-3">
          <div className="flex flex-col gap-6">
            <CheckboxGroup
              label="公司规模"
              tooltip="选择您偏好的公司员工数量规模，可多选。"
              options={scaleOptions}
              values={config.boss.scale}
              onChange={handleScaleChange}
            />

            <CheckboxGroup
              label="融资阶段"
              tooltip="选择您偏好的公司融资阶段，可多选。"
              options={stageOptions}
              values={config.boss.stage}
              onChange={handleStageChange}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 p-4 mt-4">
        <button
          onClick={handleReset}
          className="flex w-full sm:w-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-6 bg-transparent text-[#617589] dark:text-slate-400 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="truncate">重置</span>
        </button>
      </div>
    </div>
  );
};
