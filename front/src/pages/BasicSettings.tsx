import React from 'react';
import { useConfig } from '@/contexts/ConfigContext';
import { ChipInput } from '@/components/shared/ChipInput';
import { Input } from '@/components/shared/Input';
import { Select as NiceSelect } from '@/components/shared/Select';
import { Switch } from '@/components/shared/Switch';
import { Section } from '@/components/shared/Section';
import { Field } from '@/components/shared/Field';
import { MultiSelect } from '@/components/shared/MultiSelect';

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
  { value: '不限', label: '不限' },
  { value: '0-20人', label: '0-20人' },
  { value: '20-99人', label: '20-99人' },
  { value: '100-499人', label: '100-499人' },
  { value: '500-999人', label: '500-999人' },
  { value: '1000-9999人', label: '1000-9999人' },
  { value: '10000人以上', label: '10000人以上' },
];

const stageOptions = [
  { value: '不限', label: '不限' },
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
  const { config, updateConfig } = useConfig();

  // 关键词与地域已改为 ChipInput，直接在 onChange 中更新数组，无需本地 split 逻辑

  const handleExperienceChange = (value: string) => {
    updateConfig({ boss: { ...config.boss, experience: [value] } });
  };

  const handleDegreeChange = (value: string) => {
    updateConfig({ boss: { ...config.boss, degree: [value] } });
  };

  const handleScaleChange = (values: string[]) => {
    let cleaned = values;
    if (values.includes('不限')) {
      cleaned = values.length === 1 ? ['不限'] : values.filter(v => v !== '不限');
    }
    updateConfig({ boss: { ...config.boss, scale: cleaned } });
  };

  const handleStageChange = (values: string[]) => {
    let cleaned = values;
    if (values.includes('不限')) {
      cleaned = values.length === 1 ? ['不限'] : values.filter(v => v !== '不限');
    }
    updateConfig({ boss: { ...config.boss, stage: cleaned } });
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

  // 城市 Chip 专用：支持 "全国/不限" 逻辑，与其他城市互斥
  const handleCityChipsChange = (vals: string[]) => {
    const cleaned = Array.from(new Set(vals.map(v => v.trim()).filter(Boolean)));
    const hasAll = cleaned.some(v => v === '全国' || v === '不限');
    const next = hasAll ? ['全国'] : cleaned;
    updateConfig({ boss: { ...config.boss, cityCode: next } });
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1 items-center text-center">
        <h1 className="text-2xl font-semibold tracking-tight">基本投递设置</h1>
        <p className="text-sm text-[#7a8a9a]">保持简约但参数齐全，保障机器人稳定高效投递。</p>
      </div>

      {/* 职位偏好 */}
      <Section title="职位偏好" description="关键词影响搜索结果；可选启用智能扩展以覆盖更多相关岗位。">
        <Field label="职位名称/关键词" hint="输入后按 Enter 或用逗号分隔添加；支持批量粘贴">
          <ChipInput
            label=""
            values={config.boss.keywords}
            onChange={(vals) => updateConfig({ boss: { ...config.boss, keywords: vals } })}
            placeholder="例如：前端开发、React、Vue"
          />
        </Field>

        <div className="p-5 border-b border-slate-200/70 dark:border-white/10 last:border-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold text-[#0f172a] dark:text-white leading-normal">关键词扩展</div>
            <div className="text-xs text-[#5f6b76] dark:text-[#93a4b3] leading-normal">启用后自动扩展近义词与相关词</div>
          </div>
          <Switch label="关键词扩展" hideLabel checked={config.boss.enableAI} onChange={(v) => updateConfig({ boss: { ...config.boss, enableAI: v } })} />
        </div>
      </Section>

      {/* 求职要求 */}
      <Section title="求职要求" description="按地域、经验、学历与薪资筛选目标职位。">
        <Field label="地域" hint="支持输入多个城市；输入“全国”与其它城市互斥">
          <ChipInput label="" values={config.boss.cityCode} onChange={handleCityChipsChange} placeholder="例如：北京、上海、深圳" />
        </Field>

        <Field label="经验" hint="期望职位的经验要求">
          <NiceSelect label="" value={config.boss.experience[0] || '不限'} onChange={handleExperienceChange} options={experienceOptions} />
        </Field>

        <Field label="薪资 (千/月)" hint="直接填写最低与最高预期薪资，单位为千元/月">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="最低"
              type="number"
              value={(config.boss.expectedSalary[0] || '').toString()}
              onChange={(e) => handleSalaryChange(e.currentTarget.value, config.boss.expectedSalary[1]?.toString() || '')}
              placeholder="最低"
              min={0}
            />
            <Input
              label="最高"
              type="number"
              value={(config.boss.expectedSalary[1] || '').toString()}
              onChange={(e) => handleSalaryChange(config.boss.expectedSalary[0]?.toString() || '', e.currentTarget.value)}
              placeholder="最高"
              min={0}
            />
          </div>
        </Field>

        <Field label="学历" hint="职位要求的最低学历">
          <NiceSelect label="" value={config.boss.degree[0] || '不限'} onChange={handleDegreeChange} options={degreeOptions} />
        </Field>
      </Section>

      {/* 公司偏好 */}
      <Section title="公司偏好" description="对公司规模与融资阶段的偏好设置（多选）">
        <Field label="公司规模">
          <MultiSelect label="" values={config.boss.scale} onChange={handleScaleChange} options={scaleOptions} placeholder="选择规模…" />
        </Field>
        <Field label="融资阶段">
          <MultiSelect label="" values={config.boss.stage} onChange={handleStageChange} options={stageOptions} placeholder="选择阶段…" />
        </Field>
      </Section>

    </div>
  );
};
