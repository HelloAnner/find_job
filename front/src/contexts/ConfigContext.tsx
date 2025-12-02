import React, { createContext, useContext, useEffect, useReducer } from 'react';
import type { RootConfig } from '@/types/config';
import axios from 'axios';

const API_BASE = '/api';

interface ConfigState {
  config: RootConfig;
  loading: boolean;
  error: string | null;
}

type ConfigAction =
  | { type: 'SET_CONFIG'; payload: RootConfig }
  | { type: 'UPDATE_CONFIG'; payload: Partial<RootConfig> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const defaultConfig: RootConfig = {
  boss: {
    sayHi: '',
    debugger: false,
    openWindows: false,
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
  error: null,
};

const configReducer = (state: ConfigState, action: ConfigAction): ConfigState => {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, config: action.payload, loading: false };
    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
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

  const fetchConfig = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.get(`${API_BASE}/config`);
      dispatch({ type: 'SET_CONFIG', payload: response.data });
    } catch (error) {
      console.error('Failed to fetch config:', error);
      dispatch({ type: 'SET_ERROR', payload: '加载配置失败' });
    }
  };

  const saveConfig = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await axios.post(`${API_BASE}/config`, state.config);
      dispatch({ type: 'SET_ERROR', payload: null });
      return true;
    } catch (error) {
      console.error('Failed to save config:', error);
      dispatch({ type: 'SET_ERROR', payload: '保存配置失败' });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateConfig = (config: Partial<RootConfig>) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: config });
  };

  const resetConfig = () => {
    dispatch({ type: 'SET_CONFIG', payload: defaultConfig });
  };

  useEffect(() => {
    fetchConfig();
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