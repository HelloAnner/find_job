import React from 'react';
import { useConfig } from '@/contexts/ConfigContext';
import { Switch } from '@/components/shared/Switch';
import { Section } from '@/components/shared/Section';
import { Field } from '@/components/shared/Field';

export const AISettings: React.FC = () => {
  const { config, updateConfig } = useConfig();

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

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">AI 助手与消息</h1>
        <p className="text-sm text-[#7a8a9a]">配置 AI 助手语气与沟通模板。</p>
      </div>

      <Section title="AI 助手" description="用于生成初次沟通语的背景信息与个性化提示。">
        <Field label="自我介绍" hint="AI 会据此生成更贴合的招呼语">
          <textarea
            value={config.ai.introduce}
            onChange={(e) => handleIntroduceChange(e.target.value)}
            placeholder="例如：3 年前端经验，熟悉 React/Vue/TypeScript，关注可用性与性能…"
            className="flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-xl text-[#111418] dark:text-white placeholder:text-[#93a4b3] bg-white/90 dark:bg-[#0f1922] ring-1 ring-slate-200/70 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-56 p-4 text-[15px] leading-relaxed transition-shadow"
          />
        </Field>

        <Field label="自定义 Prompt" hint="为空则使用默认行为">
          <textarea
            value={config.ai.prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="例如：语气专业、简洁，突出项目落地与业务价值…"
            className="flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-xl text-[#111418] dark:text-white placeholder:text-[#93a4b3] bg-white/90 dark:bg-[#0f1922] ring-1 ring-slate-200/70 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-56 p-4 text-[15px] leading-relaxed transition-shadow"
          />
        </Field>
      </Section>

      <Section title="消息模板" description="投递成功后可自动发送一条消息">
        <Field label="自动发送" hint="开启后在投递成功后立即发送">
          <Switch label="启用" checked={config.bot.is_send} onChange={handleBotSendChange} />
        </Field>
        <Field label="模板内容" hint="可使用 {职位名称}、{公司名称} 作为占位符">
          <textarea
            value={config.bot.template}
            onChange={(e) => handleTemplateChange(e.target.value)}
            placeholder="您好，我对贵公司发布的 {职位名称} 职位非常感兴趣…"
            className="flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-xl text-[#111418] dark:text-white placeholder:text-[#93a4b3] bg-white/90 dark:bg-[#0f1922] ring-1 ring-slate-200/70 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-48 p-4 text-[15px] leading-relaxed transition-shadow"
          />
        </Field>
      </Section>

    </div>
  );
};
