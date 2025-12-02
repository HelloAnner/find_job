import React from 'react';
import { useConfig } from '@/contexts/ConfigContext';
import { Select as NiceSelect } from '@/components/shared/Select';
import { Input } from '@/components/shared/Input';
import { Switch } from '@/components/shared/Switch';

const windowOptions = [
  { value: '显示窗口', label: '显示窗口' },
  { value: '后台静默运行', label: '后台静默运行' },
];

export const AdvancedSettings: React.FC = () => {
  const { config, updateConfig, resetConfig } = useConfig();

  const handleDebugChange = (checked: boolean) => {
    updateConfig({ boss: { ...config.boss, debugger: checked } });
  };

  const handleWindowChange = (value: string) => {
    const openWindows = value === '显示窗口';
    updateConfig({ boss: { ...config.boss, openWindows } });
  };

  const handleWaitTimeChange = (min: string, _max: string) => {
    updateConfig({ boss: { ...config.boss, waitTime: parseInt(min) || 0 } });
  };

  const handleMaxChatChange = (value: string) => {
    updateConfig({ boss: { ...config.boss, maxChat: parseInt(value) || 0 } });
  };

  const handleFilterDeadHRChange = (checked: boolean) => {
    updateConfig({ boss: { ...config.boss, filterDeadHR: checked } });
  };

  const handleReset = () => {
    if (window.confirm('确定要重置所有设置为默认值吗？重置后需要重新保存才会生效。')) {
      resetConfig();
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 页面标题 */}
      <div className="flex flex-col gap-2">
        <h1 className="text-[#111418] dark:text-white text-3xl font-bold leading-tight tracking-[-0.02em]">
          高级行为设置
        </h1>
        <p className="text-[#617589] dark:text-slate-400 text-base font-normal leading-normal">
          调整机器人运行的各项高级参数，以实现更精细的控制
        </p>
      </div>

      {/* 高级设置卡片 */}
      <div className="card p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-6">
          {/* 调试模式 */}
          <div className="flex items-center gap-4 bg-transparent px-4 min-h-14 justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="text-[#111418] dark:text-white flex items-center justify-center rounded-xl bg-[#f0f2f4] dark:bg-slate-800 shrink-0 size-10">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  bug_report
                </span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[#111418] dark:text-white text-base font-medium leading-normal flex-1 truncate">
                  调试模式
                </p>
                <div className="tooltip">
                  <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 cursor-help" style={{ fontSize: '18px' }}>
                    help_outline
                  </span>
                  <span className="tooltiptext">
                    开启后，机器人将以可视化的方式运行，方便您观察其行为并进行调试。
                  </span>
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <Switch label="" checked={config.boss.debugger} onChange={handleDebugChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 px-4 py-3">
            <NiceSelect
              label="窗口开启方式"
              tooltip="选择机器人在运行时是否显示浏览器窗口。"
              value={config.boss.openWindows ? '显示窗口' : '后台静默运行'}
              onChange={handleWindowChange}
              options={windowOptions}
            />

            <div className="flex flex-col min-w-40 flex-1">
              <div className="flex items-center gap-2 pb-2">
                <p className="text-[#111418] dark:text-white text-base font-medium leading-normal">投递间隔时间 (秒)</p>
                <div className="tooltip">
                  <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 cursor-help" style={{ fontSize: '18px' }}>
                    help_outline
                  </span>
                  <span className="tooltiptext">设置每次投递操作之间的随机等待时间范围，模拟人类行为，避免被平台检测。</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label=""
                  type="number"
                  value={config.boss.waitTime.toString()}
                  onChange={(e) => handleWaitTimeChange(e.currentTarget.value, config.boss.waitTime.toString())}
                  placeholder="最短"
                />
                <Input
                  label=""
                  type="number"
                  value={(config.boss.waitTime + 10).toString()}
                  readOnly
                  placeholder="最长"
                />
              </div>
            </div>

            <Input
              label="每日最大投递次数"
              tooltip="设置机器人每天最多投递的职位数量，以避免账户被平台限制。"
              type="number"
              value={config.boss.maxChat.toString()}
              onChange={(e) => handleMaxChatChange(e.target.value)}
              placeholder="例如：100"
            />

            <Input
              label="图片简历文件路径"
              tooltip="如果需要以图片形式发送简历，请在此处填写图片的本地文件路径。"
              type="text"
              value=""
              onChange={() => {}}
              placeholder="例如：/path/to/resume.png"
            />
          </div>

          {/* 过滤不活跃的HR */}
          <div className="flex items-center gap-4 bg-transparent px-4 min-h-14 justify-between border-t border-slate-200 dark:border-slate-800 pt-6">
            <div className="flex items-center gap-4">
              <div className="text-[#111418] dark:text-white flex items-center justify-center rounded-xl bg-[#f0f2f4] dark:bg-slate-800 shrink-0 size-10">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  person_off
                </span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[#111418] dark:text-white text-base font-medium leading-normal flex-1 truncate">
                  过滤不活跃的HR
                </p>
                <div className="tooltip">
                  <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 cursor-help" style={{ fontSize: '18px' }}>
                    help_outline
                  </span>
                  <span className="tooltiptext">
                    启用后，机器人将自动跳过那些长期未登录或不活跃的HR发布的职位。
                  </span>
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <Switch label="" checked={config.boss.filterDeadHR} onChange={handleFilterDeadHRChange} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 p-4 mt-4">
        <button
          onClick={handleReset}
          className="flex w-full sm:w-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-11 px-6 bg-transparent text-[#617589] dark:text-slate-400 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="truncate">重置为默认</span>
        </button>
      </div>
    </div>
  );
};
