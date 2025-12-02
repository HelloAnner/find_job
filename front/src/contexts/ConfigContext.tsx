import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import type { RootConfig } from '@/types/config';
import axios from 'axios';

// 转换API返回的配置为前端使用格式（backend返回的是小写字段和编码值）
// 注意：后端 GET /api/config 的 JSON 字段为大写（Boss/AI/Bot），这里兼容大小写两种写法
function transformApiToFrontend(apiData: any): RootConfig {
  // 兼容大小写 key
  const boss = apiData?.Boss || apiData?.boss || {};
  const ai = apiData?.AI || apiData?.ai || {};
  const bot = apiData?.Bot || apiData?.bot || {};

  return {
    boss: {
      sayHi: boss?.sayHi ?? boss?.SayHi ?? '',
      debugger: boss?.debugger ?? boss?.Debugger ?? false,
      openWindows: boss?.openWindows ?? boss?.OpenWindows ?? false,
      showWindows: boss?.showWindows ?? boss?.ShowWindows ?? false,
      keywords: boss?.keywords ?? boss?.Keywords ?? [],
      // CityCode：后端为编码；前端展示友好文案。仅对常见编码做最小可用解码，未知编码原样显示。
      cityCode: decodeCities(boss?.cityCode ?? boss?.CityCode ?? []),
      customCityCode: boss?.customCityCode ?? boss?.CustomCityCode ?? {},
      industry: boss?.industry ?? boss?.Industry ?? [],
      experience: decodeExperience(boss?.experience ?? boss?.Experience ?? []),
      jobType: decodeJobType(boss?.jobType ?? boss?.JobType ?? ''),
      salary: decodeSalary(boss?.salary ?? boss?.Salary ?? ''),
      degree: decodeDegree(boss?.degree ?? boss?.Degree ?? []),
      scale: decodeScale(boss?.scale ?? boss?.Scale ?? []),
      stage: decodeStage(boss?.stage ?? boss?.Stage ?? []),
      enableAI: boss?.enableAI ?? boss?.EnableAI ?? false,
      filterDeadHR: boss?.filterDeadHR ?? boss?.FilterDeadHR ?? false,
      sendImgResume: boss?.sendImgResume ?? boss?.SendImgResume ?? false,
      expectedSalary: boss?.expectedSalary ?? boss?.ExpectedSalary ?? [0, 0],
      waitTime: boss?.waitTime ?? boss?.WaitTime ?? 0,
      deadStatus: boss?.deadStatus ?? boss?.DeadStatus ?? [],
      maxChat: boss?.maxChat ?? boss?.MaxChat ?? 0,
      interval: boss?.interval ?? boss?.Interval ?? 0,
    },
    ai: {
      introduce: ai?.introduce ?? ai?.Introduce ?? '',
      prompt: ai?.prompt ?? ai?.Prompt ?? '',
    },
    bot: {
      is_send: bot?.is_send ?? bot?.IsSend ?? false,
      template: bot?.template ?? bot?.Template ?? '',
    },
  };
}

// 解码函数：将后端代码转换为前端可读文本
function decodeExperience(codes: string[]): string[] {
  const map: Record<string, string> = {
    '0': '不限',
    '108': '在校生',
    '102': '应届毕业生',
    '101': '经验不限',
    '103': '1年以下',
    '104': '1-3年',
    '105': '3-5年',
    '106': '5-10年',
    '107': '10年以上',
  };
  return codes.map(code => map[code] || '不限');
}

function decodeJobType(code: string): string {
  const map: Record<string, string> = {
    '0': '不限',
    '1901': '全职',
    '1903': '兼职',
  };
  return map[code] || '不限';
}

function decodeSalary(code: string): string {
  const map: Record<string, string> = {
    '0': '不限',
    '402': '3K以下',
    '403': '3-5K',
    '404': '5-10K',
    '405': '10-20K',
    '406': '20-50K',
    '407': '50K以上',
  };
  return map[code] || '不限';
}

function decodeDegree(codes: string[]): string[] {
  const map: Record<string, string> = {
    '0': '不限',
    '209': '初中及以下',
    '208': '中专/中技',
    '206': '高中',
    '202': '大专',
    '203': '本科',
    '204': '硕士',
    '205': '博士',
  };
  return codes.map(code => map[code] || '不限');
}

function decodeScale(codes: string[]): string[] {
  const map: Record<string, string> = {
    '0': '不限',
    '301': '0-20人',
    '302': '20-99人',
    '303': '100-499人',
    '304': '500-999人',
    '305': '1000-9999人',
    '306': '10000人以上',
  };
  return codes.map(code => map[code] || '不限');
}

function decodeStage(codes: string[]): string[] {
  const map: Record<string, string> = {
    '0': '不限',
    '801': '未融资',
    '802': '天使轮',
    '803': 'A轮',
    '804': 'B轮',
    '805': 'C轮',
    '806': 'D轮及以上',
    '807': '已上市',
    '808': '不需要融资',
  };
  return codes.map(code => map[code] || '不限');
}

// 转换前端使用的小写字段名为API期望的大写字段名
function transformFrontendToApi(frontendData: RootConfig): any {
  return {
    Boss: {
      SayHi: frontendData.boss.sayHi,
      Debugger: frontendData.boss.debugger,
      OpenWindows: frontendData.boss.openWindows,
      ShowWindows: frontendData.boss.showWindows,
      Keywords: frontendData.boss.keywords,
      CityCode: frontendData.boss.cityCode,
      CustomCityCode: frontendData.boss.customCityCode,
      Industry: frontendData.boss.industry,
      Experience: encodeExperience(frontendData.boss.experience),
      JobType: encodeJobType(frontendData.boss.jobType),
      Salary: encodeSalary(frontendData.boss.salary),
      Degree: encodeDegree(frontendData.boss.degree),
      Scale: encodeScale(frontendData.boss.scale),
      Stage: encodeStage(frontendData.boss.stage),
      EnableAI: frontendData.boss.enableAI,
      FilterDeadHR: frontendData.boss.filterDeadHR,
      SendImgResume: frontendData.boss.sendImgResume,
      ExpectedSalary: frontendData.boss.expectedSalary,
      WaitTime: frontendData.boss.waitTime,
      DeadStatus: frontendData.boss.deadStatus,
      MaxChat: frontendData.boss.maxChat,
      Interval: frontendData.boss.interval,
    },
    AI: {
      Introduce: frontendData.ai.introduce,
      Prompt: frontendData.ai.prompt,
    },
    Bot: {
      IsSend: frontendData.bot.is_send,
      Template: frontendData.bot.template,
    },
  };
}

// 编码函数：将前端可读文本转换为后端代码
function encodeExperience(values: string[]): string[] {
  const map: Record<string, string> = {
    '不限': '0',
    '在校生': '108',
    '应届毕业生': '102',
    '经验不限': '101',
    '1年以下': '103',
    '1-3年': '104',
    '3-5年': '105',
    '5-10年': '106',
    '10年以上': '107',
  };
  return values.map(v => map[v] || '0');
}

function encodeJobType(value: string): string {
  const map: Record<string, string> = {
    '不限': '0',
    '全职': '1901',
    '兼职': '1903',
  };
  return map[value] || '0';
}

function encodeSalary(value: string): string {
  const map: Record<string, string> = {
    '不限': '0',
    '3K以下': '402',
    '3-5K': '403',
    '5-10K': '404',
    '10-20K': '405',
    '20-50K': '406',
    '50K以上': '407',
  };
  return map[value] || '0';
}

function encodeDegree(values: string[]): string[] {
  const map: Record<string, string> = {
    '不限': '0',
    '初中及以下': '209',
    '中专/中技': '208',
    '高中': '206',
    '大专': '202',
    '本科': '203',
    '硕士': '204',
    '博士': '205',
  };
  return values.map(v => map[v] || '0');
}

function encodeScale(values: string[]): string[] {
  const map: Record<string, string> = {
    '不限': '0',
    '0-20人': '301',
    '20-99人': '302',
    '100-499人': '303',
    '500-999人': '304',
    '1000-9999人': '305',
    '10000人以上': '306',
  };
  return values.map(v => map[v] || '0');
}

function encodeStage(values: string[]): string[] {
  const map: Record<string, string> = {
    '不限': '0',
    '未融资': '801',
    '天使轮': '802',
    'A轮': '803',
    'B轮': '804',
    'C轮': '805',
    'D轮及以上': '806',
    '已上市': '807',
    '不需要融资': '808',
  };
  return values.map(v => map[v] || '0');
}

const API_BASE = '/api';

// 城市编码简单解码：仅处理 0(不限)、100010000(全国) 两个常见值，其余保持原样
function decodeCities(codes: string[]): string[] {
  return (codes || []).map((c) => {
    if (c === '0') return '不限';
    if (c === '100010000') return '全国';
    return c; // 未知编码原样显示（后续可扩展自动完成/字典）
  });
}

// 深度合并工具函数：递归合并嵌套对象
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    // 如果两者都是对象且不是数组，递归合并
    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      // 否则直接覆盖（包括数组、基本类型等）
      result[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }

  return result;
}

interface ConfigState {
  config: RootConfig;
  loading: boolean; // 配置拉取中
  saving: boolean;  // 自动保存中
  lastSavedAt: number | null; // 保存完成时间戳
  error: string | null;
  isInitialized: boolean; // 是否已完成初始加载
}

type ConfigAction =
  | { type: 'SET_CONFIG'; payload: RootConfig }
  | { type: 'UPDATE_CONFIG'; payload: Partial<RootConfig> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_LAST_SAVED'; payload: number | null }
  | { type: 'SET_INITIALIZED'; payload: boolean };

const defaultConfig: RootConfig = {
  boss: {
    sayHi: '',
    debugger: false,
    openWindows: false,
    showWindows: false,
    keywords: [],
    cityCode: [],
    customCityCode: {},
    industry: [],
    experience: [],
    jobType: '',
    salary: '',
    degree: [],
    scale: [],
    stage: [],
    enableAI: false,
    filterDeadHR: false,
    sendImgResume: false,
    expectedSalary: [0, 0],
    waitTime: 0,
    deadStatus: [],
    maxChat: 0,
    interval: 0,
  },
  ai: {
    introduce: '',
    prompt: '',
  },
  bot: {
    is_send: false,
    template: '',
  },
};

const initialState: ConfigState = {
  config: defaultConfig,
  loading: true,
  saving: false,
  lastSavedAt: null,
  error: null,
  isInitialized: false,
};

const configReducer = (state: ConfigState, action: ConfigAction): ConfigState => {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, config: action.payload, loading: false };
    case 'UPDATE_CONFIG':
      // 使用深度合并，避免嵌套对象被覆盖
      return {
        ...state,
        config: deepMerge(state.config, action.payload),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SAVING':
      return { ...state, saving: action.payload };
    case 'SET_LAST_SAVED':
      return { ...state, lastSavedAt: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    default:
      return state;
  }
};

interface ConfigContextType extends ConfigState {
  fetchConfig: () => Promise<void>;
  saveConfig: () => Promise<boolean>;
  updateConfig: (config: Partial<RootConfig>) => void;
  resetConfig: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(configReducer, initialState);
  // 自动保存：前端去抖，避免频繁写磁盘（后端每次 POST 都会写入文件）
  const saveTimerRef = useRef<number | null>(null);
  const AUTO_SAVE_DELAY = 800; // ms
  // 和后端同步过的“基线”快照；只有当与该快照不同才会保存
  const lastSyncedRef = useRef<RootConfig | null>(null);

  // 简单深比较：仅处理对象/数组/基础类型（我们的配置满足）
  const deepEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
        return true;
      }
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      if (aKeys.length !== bKeys.length) return false;
      for (const k of aKeys) {
        if (!deepEqual(a[k], (b as any)[k])) return false;
      }
      return true;
    }
    return false;
  };

  const fetchConfig = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      // 强制从后端获取配置
      const response = await axios.get(`${API_BASE}/config`, {
        headers: { 'Cache-Control': 'no-cache' },
        params: { t: Date.now() }, // 添加时间戳防止缓存
      });
      console.log('API返回数据:', response.data);
      const frontendConfig = transformApiToFrontend(response.data);
      console.log('转换后的配置:', frontendConfig);

      // 填充默认值：如果某些字段为空，设置合理的默认值
      // 确保 cityCode 至少有一个默认值
      const configWithDefaults = {
        ...frontendConfig,
        boss: {
          ...frontendConfig.boss,
          cityCode: frontendConfig.boss.cityCode && frontendConfig.boss.cityCode.length > 0
            ? frontendConfig.boss.cityCode
            : ['不限'],
        },
      };

      dispatch({ type: 'SET_CONFIG', payload: configWithDefaults });
      // 标记配置已完成初始化，允许自动保存
      dispatch({ type: 'SET_INITIALIZED', payload: true });
      // 将当前拉取到的配置作为“已同步”快照，避免页面初次渲染就触发保存
      lastSyncedRef.current = configWithDefaults;
    } catch (error) {
      console.error('Failed to fetch config:', error);
      dispatch({ type: 'SET_ERROR', payload: '加载配置失败' });
    }
  };

  const saveConfig = async () => {
    try {
      // 未改动则跳过保存（满足“未修改前端页面不更新后端配置”）
      if (lastSyncedRef.current && deepEqual(state.config, lastSyncedRef.current)) {
        console.log('[autosave] 配置未变化，跳过保存');
        return false;
      }
      dispatch({ type: 'SET_SAVING', payload: true });
      const apiData = transformFrontendToApi(state.config);
      await axios.post(`${API_BASE}/config`, apiData);
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_LAST_SAVED', payload: Date.now() });
      // 保存成功后更新“已同步”快照
      lastSyncedRef.current = state.config;
      return true;
    } catch (error) {
      console.error('Failed to save config:', error);
      dispatch({ type: 'SET_ERROR', payload: '保存配置失败' });
      return false;
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  };

  const scheduleAutoSave = () => {
    // 如果配置还未完成初始化，不触发自动保存
    if (!state.isInitialized) {
      console.log('配置未初始化，跳过自动保存');
      return;
    }
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      // 静默保存（当前无全局 loading UI，不会影响交互）
      void saveConfig();
    }, AUTO_SAVE_DELAY);
  };

  const updateConfig = (config: Partial<RootConfig>) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: config });
    // 配置变更后，自动保存（去抖）
    scheduleAutoSave();
  };

  const resetConfig = () => {
    dispatch({ type: 'SET_CONFIG', payload: defaultConfig });
    scheduleAutoSave();
  };

  useEffect(() => {
    fetchConfig();
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return (
    <ConfigContext.Provider
      value={{
        ...state,
        fetchConfig,
        saveConfig,
        updateConfig,
        resetConfig,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
