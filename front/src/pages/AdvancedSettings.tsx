import React from 'react';
import { useConfig } from '@/contexts/ConfigContext';
import { Select as NiceSelect } from '@/components/shared/Select';
import { Input } from '@/components/shared/Input';
import { Switch } from '@/components/shared/Switch';
import { Section } from '@/components/shared/Section';
import { Field } from '@/components/shared/Field';

const intervalOptions = [1, 2, 3, 4, 6, 8, 12, 24].map((hour) => ({
  value: hour.toString(),
  label: `${hour} 小时`,
}));

export const AdvancedSettings: React.FC = () => {
  const { config, updateConfig } = useConfig();

  const handleIntervalChange = (value: string) => {
    updateConfig({ boss: { ...config.boss, interval: parseInt(value) || 1 } });
  };

  const handleWaitTimeChange = (min: string) => {
    updateConfig({ boss: { ...config.boss, waitTime: parseInt(min) || 0 } });
  };

  const handleMaxChatChange = (value: string) => {
    updateConfig({ boss: { ...config.boss, maxChat: parseInt(value) || 0 } });
  };

  const handleFilterDeadHRChange = (checked: boolean) => {
    updateConfig({ boss: { ...config.boss, filterDeadHR: checked } });
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">高级行为设置</h1>
        <p className="text-sm text-[#7a8a9a]">更细粒度地控制机器人的运行方式。</p>
      </div>

      <Section title="运行参数" description="间隔与等待时间会影响稳定性与反检测效果。">
        <Field label="投递间隔时间 (小时)" hint="控制完整投递任务之间的休眠时长，刷新后依然生效">
          <NiceSelect
            label=""
            value={(config.boss.interval || 1).toString()}
            onChange={handleIntervalChange}
            options={intervalOptions}
          />
        </Field>

        <Field label="操作等待 (秒)" hint="每次页面操作之间的随机等待下限，上限自动 +10 秒">
          <div className="max-w-xs">
            <Input
              label="最短等待"
              type="number"
              value={config.boss.waitTime.toString()}
              onChange={(e) => handleWaitTimeChange(e.currentTarget.value)}
              placeholder="例如：5"
              min={0}
            />
            <p className="text-xs text-[#93a4b3] mt-2">系统会额外+10秒作为上限，不需手动填写。</p>
          </div>
        </Field>

        <Field label="每日最大投递次数" hint="避免因频率过高触发平台限制">
          <Input label="" type="number" value={config.boss.maxChat.toString()} onChange={(e) => handleMaxChatChange(e.target.value)} placeholder="例如：100" />
        </Field>
      </Section>

      <Section title="过滤策略" description="减少无效沟通，节约次数。">
        <Field label="过滤不活跃的 HR" hint="自动跳过长期未登录的 HR">
          <Switch label="启用" checked={config.boss.filterDeadHR} onChange={handleFilterDeadHRChange} />
        </Field>
      </Section>

    </div>
  );
};
