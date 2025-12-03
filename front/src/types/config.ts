export interface BossConfig {
  sayHi: string;
  keywords: string[];
  cityCode: string[];
  customCityCode: Record<string, string>;
  industry: string[];
  experience: string[];
  jobType: string;
  salary: string;
  degree: string[];
  scale: string[];
  stage: string[];
  enableAI: boolean;
  filterDeadHR: boolean;
  sendImgResume: boolean;
  expectedSalary: number[];
  waitTime: number;
  deadStatus: string[];
  maxChat: number;
  interval: number;
}

export interface AiConfig {
  introduce: string;
  prompt: string;
}

export interface BotConfig {
  is_send: boolean;
  template: string;
}

export interface RootConfig {
  boss: BossConfig;
  ai: AiConfig;
  bot: BotConfig;
}
