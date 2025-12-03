import React from 'react';
import { useConfig } from '@/contexts/ConfigContext';
import { Switch } from '@/components/shared/Switch';
import { Section } from '@/components/shared/Section';
import { Field } from '@/components/shared/Field';

const botPlaceholders = [
  { key: 'jobLink', label: '岗位链接' },
  { key: 'companyName', label: '公司名称' },
  { key: 'jobArea', label: '城市/经验' },
  { key: 'salary', label: '薪资范围' },
  { key: 'greeting', label: '招呼语/备注' },
  { key: 'status', label: '投递状态' },
  { key: 'timestamp', label: '时间戳' },
];

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
      <div className="flex flex-col gap-1 items-center text-center">
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

      <Section
        title="企业微信机器人通知"
        description="用于把投递成功/失败等状态推送到企业微信群。请确保服务器已配置企业微信机器人 Webhook（环境变量 HOOK_URL）。"
      >
        <Field label="推送开关" hint="开启后每次投递结果都会生成一条 Markdown 消息并通过机器人发送">
          <Switch label="启用通知" checked={config.bot.is_send} onChange={handleBotSendChange} />
        </Field>
        <Field
          label="通知模板"
          hint="支持企业微信 Markdown，可嵌入下方列出的占位符"
        >
          <div className="flex flex-col gap-4">
            <textarea
              value={config.bot.template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              placeholder={`例如：## 新投递成功\n- 岗位：{{jobLink}}\n- 公司：{{companyName}}`}
              className="flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-xl text-[#111418] dark:text-white placeholder:text-[#93a4b3] bg-white/90 dark:bg-[#0f1922] ring-1 ring-slate-200/70 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-48 p-4 text-[15px] leading-relaxed transition-shadow"
            />
            <div className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-[#0f1922] p-4 text-xs text-[#4c5562] dark:text-[#bfcad6] space-y-2">
              <div className="font-semibold text-sm text-[#111418] dark:text-white">可用占位符</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {botPlaceholders.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-2 rounded-lg bg-slate-100/70 dark:bg-white/5 px-3 py-2">
                    <code className="text-[11px] text-primary">{`{{${item.key}}}`}</code>
                    <span className="text-[11px] text-[#4c5562] dark:text-[#9fb0c2]">{item.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#858f9b]">
                * 模板需符合企业微信 Markdown 语法；若占位符未提供对应值将被替换为空字符串。
              </p>
            </div>
          </div>
        </Field>
      </Section>

    </div>
  );
};
