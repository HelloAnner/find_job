import React from 'react';
import { Settings, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';
import { CheckboxGroup } from '@/components/shared/CheckboxGroup';

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
  const { config, updateConfig, saveConfig, resetConfig } = useConfig();

  const handleKeywordsChange = (value: string) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k);
    updateConfig({ boss: { ...config.boss, keywords } });
  };

  const handleCityChange = (value: string) => {
    const cities = value.split(',').map(c => c.trim()).filter(c => c);
    updateConfig({ boss: { ...config.boss, cityCode: cities } });
  };

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

  const handleSave = async () => {
    const success = await saveConfig();
    if (success) {
      alert('配置保存成功');
    } else {
      alert('配置保存失败，请检查网络连接');
    }
  };

  const handleReset = () => {
    if (window.confirm('确定要重置所有设置吗？重置后需要重新保存才会生效。')) {
      resetConfig();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-[#111418] dark:text-white text-3xl font-bold leading-tight tracking-[-0.02em]">
          基本投递设置
        </h1>
        <p className="text-[#617589] dark:text-slate-400 text-base font-normal leading-normal">
          在这里自定义您的自动化机器人行为和参数，精准匹配职位。
        </p>
      </div>

      {/* 职位偏好 */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900/70 p-6 rounded-xl border border-transparent dark:border-white/10 shadow-sm">
        <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-2 border-b border-slate-200 dark:border-white/10">
          职位偏好
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 px-4 py-3">
          <Input
            label="职位名称/关键词"
            tooltip="输入您期望的职位名称或关键词，用逗号分隔，例如 '前端开发, React'"
            value={config.boss.keywords.join(', ')}
            onChange={(e) => handleKeywordsChange(e.target.value)}
            placeholder="例如：前端开发, React, Vue"
            icon={<Settings size={18} />}
          />

          <div className="flex flex-col min-w-40 flex-1">
            <div className="flex items-center gap-2 pb-2">
              <p className="text-[#111418] dark:text-white text-base font-medium leading-normal">
                关键词扩展
              </p>
              <div className="tooltip">
                <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 cursor-help" style={{ fontSize: '18px' }}>
                  help_outline
                </span>
                <span className="tooltiptext">启用后，机器人将自动扩展您的关键词，寻找更多相关职位。</span>
              </div>
            </div>
            <div className="flex items-center gap-4 h-12">
              <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-[#f0f2f4] dark:bg-slate-800 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-primary">
                <div className="h-full w-[27px] rounded-full bg-white transition-transform" style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 6px' }}></div>
                <input
                  checked={config.boss.enableAI}
                  onChange={(e) => updateConfig({ boss: { ...config.boss, enableAI: e.target.checked } })}
                  className="invisible absolute"
                  type="checkbox"
                />
              </label>
              <span className="text-[#617589] dark:text-slate-400 text-sm">启用智能扩展</span>
            </div>
          </div>
        </div>
      </div>

      {/* 求职要求 */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900/70 p-6 rounded-xl border border-transparent dark:border-white/10 shadow-sm">
        <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-2 border-b border-slate-200 dark:border-white/10">
          求职要求
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 px-4 py-3">
          <Input
            label="地域"
            tooltip="选择您希望工作的城市，可多选。"
            value={config.boss.cityCode.join(', ')}
            onChange={(e) => handleCityChange(e.target.value)}
            placeholder="例如：北京, 上海, 深圳"
            icon={<MapPin size={18} />}
          />

          <Select
            label="经验"
            tooltip="选择您期望的职位工作经验要求。"
            value={config.boss.experience[0] || '不限'}
            options={experienceOptions}
            onChange={handleExperienceChange}
            icon={<Briefcase size={18} />}
          />

          <div className="flex flex-col min-w-40 flex-1">
            <div className="flex items-center gap-2 pb-2">
              <p className="text-[#111418] dark:text-white text-base font-medium leading-normal">
                薪资 (千/月)
              </p>
              <div className="tooltip">
                <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 cursor-help" style={{ fontSize: '18px' }}>
                  help_outline
                </span>
                <span className="tooltiptext">设置您期望的月薪范围，单位为千元（k）。留空表示不限。</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe0e6] dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-[#617589] p-3 text-base font-normal leading-normal"
                placeholder="最低"
                type="number"
                value={config.boss.expectedSalary[0] || ''}
                onChange={(e) => handleSalaryChange(e.target.value, config.boss.expectedSalary[1]?.toString() || '')}
              />
              <span className="text-[#617589] dark:text-slate-400">-</span>
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe0e6] dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-[#617589] p-3 text-base font-normal leading-normal"
                placeholder="最高"
                type="number"
                value={config.boss.expectedSalary[1] || ''}
                onChange={(e) => handleSalaryChange(config.boss.expectedSalary[0]?.toString() || '', e.target.value)}
              />
            </div>
          </div>

          <Select
            label="学历"
            tooltip="选择职位要求的最低学历。"
            value={config.boss.degree[0] || '不限'}
            options={degreeOptions}
            onChange={handleDegreeChange}
            icon={<GraduationCap size={18} />}
          />
        </div>
      </div>

      {/* 公司偏好 */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900/70 p-6 rounded-xl border border-transparent dark:border-white/10 shadow-sm">
        <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-2 border-b border-slate-200 dark:border-white/10">
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
        <button
          onClick={handleSave}
          className="flex w-full sm:w-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-6 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
        >
          <span className="truncate">保存设置</span>
        </button>
      </div>
    </div>
  );
};