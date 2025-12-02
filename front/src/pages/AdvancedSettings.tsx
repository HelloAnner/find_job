import React from 'react';
import { Bug, Eye, Target, Image, UserX } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';

const windowOptions = [
  { value: '显示窗口', label: '显示窗口' },
  { value: '后台静默运行', label: '后台静默运行' },
];

export const AdvancedSettings: React.FC = () => {
  const { config, updateConfig, saveConfig, resetConfig } = useConfig();

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

  const handleSave = async () => {
    const success = await saveConfig();
    if (success) {
      alert('配置保存成功');
    } else {
      alert('配置保存失败，请检查网络连接');
    }
  };

  const handleReset = () => {
    if (window.confirm('确定要重置所有设置为默认值吗？重置后需要重新保存才会生效。')) {
      resetConfig();
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f4] dark:border-b-white/10 px-4 sm:px-6 md:px-10 py-3 bg-white dark:bg-background-dark rounded-xl sticky top-4 z-10 shadow-sm">
        <div className="flex items-center gap-4 text-[#111418] dark:text-white">
          <div className="size-6 text-primary">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"></path>
            </svg>
          </div>
          <h1 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
            自动化找工作机器人
          </h1>
        </div>
        <button
          onClick={handleSave}
          className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
        >
          <span className="truncate">保存配置</span>
        </button>
      </header>

      <main className="flex flex-col gap-8">
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <div className="flex min-w-72 flex-col gap-3">
            <p className="text-[#111418] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
              高级行为设置
            </p>
            <p className="text-[#617589] dark:text-slate-400 text-base font-normal leading-normal">
              调整机器人运行的各项高级参数，以实现更精细的控制
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 bg-white dark:bg-slate-900/70 p-6 rounded-xl border border-transparent dark:border-white/10 shadow-sm">
          <div className="flex flex-col gap-6">
            {/* 调试模式 */}
            <div className="flex items-center gap-4 bg-transparent px-4 min-h-14 justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
              <div className="flex items-center gap-4">
                <div className="text-[#111418] dark:text-white flex items-center justify-center rounded-lg bg-[#f0f2f4] dark:bg-slate-800 shrink-0 size-10">
                  <Bug size={20} />
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
                <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-[#f0f2f4] dark:bg-slate-800 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-primary">
                  <div className="h-full w-[27px] rounded-full bg-white transition-transform" style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 6px' }}></div>
                  <input
                    checked={config.boss.debugger}
                    onChange={(e) => handleDebugChange(e.target.checked)}
                    className="invisible absolute"
                    type="checkbox"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-8 px-4 py-3">
              <Select
                label="窗口开启方式"
                tooltip="选择机器人在运行时是否显示浏览器窗口。"
                value={config.boss.openWindows ? '显示窗口' : '后台静默运行'}
                options={windowOptions}
                onChange={handleWindowChange}
                icon={<Eye size={18} />}
              />

              <div className="flex flex-col min-w-40 flex-1">
                <div className="flex items-center gap-2 pb-2">
                  <p className="text-[#111418] dark:text-white text-base font-medium leading-normal">
                    投递间隔时间 (秒)
                  </p>
                  <div className="tooltip">
                    <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 cursor-help" style={{ fontSize: '18px' }}>
                      help_outline
                    </span>
                    <span className="tooltiptext">
                      设置每次投递操作之间的随机等待时间范围，模拟人类行为，避免被平台检测。
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe0e6] dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-14 placeholder:text-[#617589] p-[15px] text-base font-normal leading-normal"
                    placeholder="最短"
                    type="number"
                    value={config.boss.waitTime}
                    onChange={(e) => handleWaitTimeChange(e.target.value, config.boss.waitTime.toString())}
                  />
                  <span className="text-[#617589] dark:text-slate-400">-</span>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe0e6] dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-14 placeholder:text-[#617589] p-[15px] text-base font-normal leading-normal"
                    placeholder="最长"
                    type="number"
                    value={config.boss.waitTime + 10}
                    readOnly
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
                icon={<Target size={18} />}
              />

              <Input
                label="图片简历文件路径"
                tooltip="如果需要以图片形式发送简历，请在此处填写图片的本地文件路径。"
                value=""
                onChange={() => {}}
                placeholder="例如：C:\Users\YourName\resume.png"
                icon={<Image size={18} />}
              />
            </div>

            {/* 过滤不活跃的HR */}
            <div className="flex items-center gap-4 bg-transparent px-4 min-h-14 justify-between border-t border-slate-200 dark:border-slate-800 pt-6">
              <div className="flex items-center gap-4">
                <div className="text-[#111418] dark:text-white flex items-center justify-center rounded-lg bg-[#f0f2f4] dark:bg-slate-800 shrink-0 size-10">
                  <UserX size={20} />
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
                <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-[#f0f2f4] dark:bg-slate-800 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-primary">
                  <div className="h-full w-[27px] rounded-full bg-white transition-transform" style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 6px' }}></div>
                  <input
                    checked={config.boss.filterDeadHR}
                    onChange={(e) => handleFilterDeadHRChange(e.target.checked)}
                    className="invisible absolute"
                    type="checkbox"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 p-4 mt-4">
          <button
            onClick={handleReset}
            className="flex w-full sm:w-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-6 bg-transparent text-[#617589] dark:text-slate-400 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="truncate">重置为默认</span>
          </button>
          <button
            onClick={handleSave}
            className="flex w-full sm:w-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-6 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
          >
            <span className="truncate">保存配置</span>
          </button>
        </div>
      </main>
    </div>
  );
};