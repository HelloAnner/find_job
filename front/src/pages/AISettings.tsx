import React from 'react';
import { useConfig } from '@/contexts/ConfigContext';
import { Switch } from '@/components/shared/Switch';

export const AISettings: React.FC = () => {
  const { config, updateConfig, resetConfig } = useConfig();

  const handleIntroduceChange = (value: string) => {
    updateConfig({ ai: { ...config.ai, introduce: value } });
  };

  const handlePromptChange = (value: string) => {
    updateConfig({ ai: { ...config.ai, prompt: value } });
  };

  const handleBotSendChange = (checked: boolean) => {
    updateConfig({ bot: { ...config.bot, is_send: checked } });
  };

  const handleTemplateChange = (value: string) => {
    updateConfig({ bot: { ...config.bot, template: value } });
  };

  // 自动保存：已在 ConfigProvider 中实现，这里不再提供手动保存

  const handleReset = () => {
    if (window.confirm('确定要重置所有设置为默认值吗？重置后需要重新保存才会生效。')) {
      resetConfig();
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 顶部品牌与保存按钮删除，改为自动保存 */}

      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <div className="flex min-w-72 flex-col gap-3">
            <p className="text-[#111418] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
              AI助手与消息模板
            </p>
            <p className="text-[#617589] dark:text-slate-400 text-base font-normal leading-normal">
              配置AI助手的沟通方式和投递成功后的消息模板
            </p>
          </div>
        </div>

        {/* AI助手配置 */}
        <div className="card p-6 flex flex-col gap-4">
          <h2 className="text-[#111418] dark:text-white text-[22px] font-semibold leading-tight tracking-tight px-4 pb-3 pt-2 border-b border-slate-200 dark:border-white/10">
            AI 助手配置
          </h2>

          <div className="flex flex-col gap-6 px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <div className="flex items-center gap-2 pb-2">
                <p className="text-[#111418] dark:text-white text-base font-medium leading-normal">AI助手自我介绍</p>
                <div className="tooltip">
                  <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 cursor-help" style={{ fontSize: '18px' }}>
                    help_outline
                  </span>
                  <span className="tooltiptext">这是您在与HR或招聘方初次沟通时使用的自我介绍。AI会参考这段内容来生成个性化消息。</span>
                </div>
              </div>
              <textarea
                value={config.ai.introduce}
                onChange={(e) => handleIntroduceChange(e.target.value)}
                placeholder="例如：您好，我是一位拥有3年经验的前端开发者，擅长使用React和Vue框架..."
                className="flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-xl text-[#111418] dark:text-white placeholder:text-[#617589] bg-white dark:bg-slate-900/70 ring-1 ring-slate-200/70 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-32 p-[15px] text-base leading-normal transition-shadow"
              />
            </label>

            <label className="flex flex-col min-w-40 flex-1">
              <div className="flex items-center gap-2 pb-2">
                <p className="text-[#111418] dark:text-white text-base font-medium leading-normal">自定义 Prompt</p>
                <div className="tooltip">
                  <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 cursor-help" style={{ fontSize: '18px' }}>
                    help_outline
                  </span>
                  <span className="tooltiptext">为AI提供特定的指令，以指导它如何为您撰写或优化内容。留空则使用默认配置。</span>
                </div>
              </div>
              <textarea
                value={config.ai.prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder="例如：请以热情、专业的语气撰写求职信，并强调我的项目经验..."
                className="flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-xl text-[#111418] dark:text-white placeholder:text-[#617589] bg-white dark:bg-slate-900/70 ring-1 ring-slate-200/70 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-32 p-[15px] text-base leading-normal transition-shadow"
              />
            </label>
          </div>
        </div>

        {/* 消息模板配置 */}
        <div className="card p-6 flex flex-col gap-4">
          <h2 className="text-[#111418] dark:text-white text-[22px] font-semibold leading-tight tracking-tight px-4 pb-3 pt-2 border-b border-slate-200 dark:border-white/10">
            消息模板配置
          </h2>

          <div className="flex flex-col gap-6 px-4 py-3">
            <div className="flex items-center gap-4 bg-transparent min-h-14 justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[#111418] dark:text-white text-base font-medium leading-normal flex-1 truncate">
                  投递成功后自动发送消息
                </p>
                <div className="tooltip">
                  <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 cursor-help" style={{ fontSize: '18px' }}>
                    help_outline
                  </span>
                  <span className="tooltiptext">
                    启用后，机器人将在简历投递成功后，自动向招聘方发送一条预设的消息。
                  </span>
                </div>
              </div>
              <div className="shrink-0 w-52">
                <Switch label="" checked={config.bot.is_send} onChange={handleBotSendChange} />
              </div>
            </div>

            <label className="flex flex-col min-w-40 flex-1">
              <div className="flex items-center gap-2 pb-2">
                <p className="text-[#111418] dark:text-white text-base font-medium leading-normal">消息模板</p>
                <div className="tooltip">
                  <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 cursor-help" style={{ fontSize: '18px' }}>
                    help_outline
                  </span>
                  <span className="tooltiptext">自定义投递成功后发送的消息内容。您可以使用 {'{职位名称}'} 和 {'{公司名称}'} 作为占位符。</span>
                </div>
              </div>
              <textarea
                value={config.bot.template}
                onChange={(e) => handleTemplateChange(e.target.value)}
                placeholder="您好，我对贵公司发布的 {职位名称} 职位非常感兴趣。我的技能和经验与该职位的要求高度匹配，期待能有机会进一步沟通。"
                className="flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-xl text-[#111418] dark:text-white placeholder:text-[#617589] bg-white dark:bg-slate-900/70 ring-1 ring-slate-200/70 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-32 p-[15px] text-base leading-normal transition-shadow"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 p-4 mt-4">
          <button
            onClick={handleReset}
            className="flex w-full sm:w-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-6 bg-transparent text-[#617589] dark:text-slate-400 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="truncate">重置为默认</span>
          </button>
          {/* 取消“保存配置”按钮，采用自动保存 */}
        </div>
      </div>
    </div>
  );
};
