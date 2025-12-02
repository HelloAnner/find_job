import React from 'react';
import { Bot, MessageSquare, Send } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';
import { Textarea } from '@/components/shared/Textarea';

export const AISettings: React.FC = () => {
  const { config, updateConfig, saveConfig, resetConfig } = useConfig();

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
              AI助手与消息模板
            </p>
            <p className="text-[#617589] dark:text-slate-400 text-base font-normal leading-normal">
              配置AI助手的沟通方式和投递成功后的消息模板
            </p>
          </div>
        </div>

        {/* AI助手配置 */}
        <div className="flex flex-col gap-4 bg-white dark:bg-slate-900/70 p-6 rounded-xl border border-transparent dark:border-white/10 shadow-sm">
          <h2 className="text-[#111418] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-2 border-b border-slate-200 dark:border-white/10">
            AI 助手配置
          </h2>

          <div className="flex flex-col gap-6 px-4 py-3">
            <Textarea
              label="AI助手自我介绍"
              tooltip="这是您在与HR或招聘方初次沟通时使用的自我介绍。AI会参考这段内容来生成个性化消息。"
              value={config.ai.introduce}
              onChange={(e) => handleIntroduceChange(e.target.value)}
              placeholder="例如：您好，我是一位拥有3年经验的前端开发者，擅长使用React和Vue框架..."
              rows={6}
              icon={<Bot size={18} />}
            />

            <Textarea
              label="自定义 Prompt"
              tooltip="为AI提供特定的指令，以指导它如何为您撰写或优化内容。留空则使用默认配置。"
              value={config.ai.prompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="例如：请以热情、专业的语气撰写求职信，并强调我的项目经验..."
              rows={6}
              icon={<MessageSquare size={18} />}
            />
          </div>
        </div>

        {/* 消息模板配置 */}
        <div className="flex flex-col gap-4 bg-white dark:bg-slate-900/70 p-6 rounded-xl border border-transparent dark:border-white/10 shadow-sm">
          <h2 className="text-[#111418] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-2 border-b border-slate-200 dark:border-white/10">
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
              <div className="shrink-0">
                <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-[#f0f2f4] dark:bg-slate-800 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-primary">
                  <div className="h-full w-[27px] rounded-full bg-white transition-transform" style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 6px' }}></div>
                  <input
                    checked={config.bot.is_send}
                    onChange={(e) => handleBotSendChange(e.target.checked)}
                    className="invisible absolute"
                    type="checkbox"
                  />
                </label>
              </div>
            </div>

            <Textarea
              label="消息模板"
              tooltip="自定义投递成功后发送的消息内容。您可以使用 {职位名称} 和 {公司名称} 作为占位符。"
              value={config.bot.template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              placeholder="您好，我对贵公司发布的 {职位名称} 职位非常感兴趣。我的技能和经验与该职位的要求高度匹配，期待能有机会进一步沟通。"
              rows={6}
              icon={<Send size={18} />}
            />
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