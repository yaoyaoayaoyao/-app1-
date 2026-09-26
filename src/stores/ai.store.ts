import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SummaryPeriod } from '@/types';
import { generateId } from '@/utils/id';

// === AI 配置项类型 ===
export interface AIConfigEntry {
  id: string;
  name: string;          // 配置名称，如"日日新"、"Agnes AI"
  apiEndpoint: string;   // API地址
  apiKey: string;        // API密钥
  model: string;         // 模型名
  enabled: boolean;      // 是否启用
}

// 旧版配置类型（用于 migrate）
interface LegacyAIConfig {
  apiEndpoint: string;
  apiKey: string;
  backupApiKey?: string;
  model: string;
}

export interface SummaryRecord {
  id: string;
  period: SummaryPeriod;
  date: string;           // 总结的日期范围标识
  content: string;        // AI生成的总结内容(Markdown格式)
  highlights: string[];   // 亮点
  suggestions: string[];  // 建议
  mood: string;           // 情绪分析
  createdAt: number;
}

interface AIState {
  configs: AIConfigEntry[];       // 配置数组，按顺序轮换
  activeConfigIndex: number;      // 当前使用的配置索引
  isConfigured: boolean;          // 至少有一个启用的配置且有密钥
  summaries: SummaryRecord[];

  // 配置管理
  addConfig: (config: Omit<AIConfigEntry, 'id'>) => void;
  updateConfig: (id: string, partial: Partial<AIConfigEntry>) => void;
  deleteConfig: (id: string) => void;
  moveConfig: (id: string, direction: 'up' | 'down') => void;
  toggleConfig: (id: string) => void;
  setActiveIndex: (index: number) => void;
  getNextAvailableConfig: () => AIConfigEntry | null;

  // 兼容旧接口（内部使用 configs，保留 isConfigured 判断）
  resetConfig: () => void;

  // 总结管理
  addSummary: (record: SummaryRecord) => void;
  deleteSummary: (id: string) => void;
  clearSummaries: () => void;
}

// 默认配置数组
const DEFAULT_CONFIGS: AIConfigEntry[] = [
  {
    id: 'sensenova-1',
    name: '日日新',
    apiEndpoint: 'https://api.sensenova.cn/compatible-mode/v1/chat/completions',
    apiKey: '', // 留空，请在 App「AI 设置」里填写自己的密钥（存在本机，不入源码）
    model: 'sensenova-6.8-flash-lite',
    enabled: true,
  },
  {
    id: 'agnes-1',
    name: 'Agnes AI',
    apiEndpoint: 'https://api.agnes-ai.cn/v1/chat/completions',
    apiKey: '', // 留空，请在 App「AI 设置」里填写自己的密钥（存在本机，不入源码）
    model: 'agnes-2.5-flash',
    enabled: true,
  },
];

// 计算是否已配置（至少有一个启用且有密钥的配置）
function computeIsConfigured(configs: AIConfigEntry[]): boolean {
  return configs.some((c) => c.enabled && c.apiKey.trim() !== '');
}

// 总结历史最多保留条数
const MAX_SUMMARIES = 30;

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      configs: [...DEFAULT_CONFIGS],
      activeConfigIndex: 0,
      isConfigured: computeIsConfigured(DEFAULT_CONFIGS),
      summaries: [],

      addConfig: (config) => {
        const newConfig: AIConfigEntry = { ...config, id: generateId() };
        const newConfigs = [...get().configs, newConfig];
        set({
          configs: newConfigs,
          isConfigured: computeIsConfigured(newConfigs),
        });
      },

      updateConfig: (id, partial) => {
        const newConfigs = get().configs.map((c) =>
          c.id === id ? { ...c, ...partial } : c
        );
        set({
          configs: newConfigs,
          isConfigured: computeIsConfigured(newConfigs),
        });
      },

      deleteConfig: (id) => {
        const state = get();
        const targetIndex = state.configs.findIndex((c) => c.id === id);
        if (targetIndex === -1) return;

        const newConfigs = state.configs.filter((c) => c.id !== id);
        let newActiveIndex = state.activeConfigIndex;
        // 如果删除的是当前或之前的配置，调整 activeIndex
        if (targetIndex <= state.activeConfigIndex) {
          newActiveIndex = Math.max(0, state.activeConfigIndex - 1);
        }
        // 如果数组为空，重置为 0
        if (newConfigs.length === 0) {
          newActiveIndex = 0;
        }

        set({
          configs: newConfigs,
          activeConfigIndex: newActiveIndex,
          isConfigured: computeIsConfigured(newConfigs),
        });
      },

      moveConfig: (id, direction) => {
        const configs = [...get().configs];
        const index = configs.findIndex((c) => c.id === id);
        if (index === -1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= configs.length) return;

        // 交换
        const temp = configs[index];
        configs[index] = configs[targetIndex];
        configs[targetIndex] = temp;

        set({ configs });
      },

      toggleConfig: (id) => {
        const newConfigs = get().configs.map((c) =>
          c.id === id ? { ...c, enabled: !c.enabled } : c
        );
        set({
          configs: newConfigs,
          isConfigured: computeIsConfigured(newConfigs),
        });
      },

      setActiveIndex: (index) => {
        set({ activeConfigIndex: index });
      },

      getNextAvailableConfig: () => {
        const { configs, activeConfigIndex } = get();
        // 从当前索引的下一个开始找，循环一圈
        for (let i = 1; i <= configs.length; i++) {
          const idx = (activeConfigIndex + i) % configs.length;
          if (configs[idx].enabled && configs[idx].apiKey.trim()) {
            return configs[idx];
          }
        }
        return null;
      },

      resetConfig: () => {
        set({
          configs: [],
          activeConfigIndex: 0,
          isConfigured: false,
        });
      },

      addSummary: (record) => {
        set((state) => {
          const updated = [record, ...state.summaries];
          if (updated.length > MAX_SUMMARIES) {
            return { summaries: updated.slice(0, MAX_SUMMARIES) };
          }
          return { summaries: updated };
        });
      },

      deleteSummary: (id) => {
        set((state) => ({
          summaries: state.summaries.filter((s) => s.id !== id),
        }));
      },

      clearSummaries: () => {
        set({ summaries: [] });
      },
    }),
    {
      name: 'cinnamoroll-ai',
      version: 5,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        configs: state.configs,
        activeConfigIndex: state.activeConfigIndex,
        summaries: state.summaries,
      }),
      migrate: (persisted: any, version: number) => {
        // v1-v4: 旧版单配置 + backupApiKey 格式
        if (version < 5 && persisted?.config) {
          const oldConfig = persisted.config as LegacyAIConfig;
          const configs: AIConfigEntry[] = [];

          // 主 key 转为第一个配置
          if (oldConfig.apiKey?.trim()) {
            configs.push({
              id: `migrated-main-${generateId()}`,
              name: '配置 1',
              apiEndpoint: oldConfig.apiEndpoint || '',
              apiKey: oldConfig.apiKey,
              model: oldConfig.model || '',
              enabled: true,
            });
          }

          // 备用 key 转为第二个配置（同一个 endpoint 和 model）
          if (oldConfig.backupApiKey?.trim()) {
            configs.push({
              id: `migrated-backup-${generateId()}`,
              name: '配置 2',
              apiEndpoint: oldConfig.apiEndpoint || '',
              apiKey: oldConfig.backupApiKey,
              model: oldConfig.model || '',
              enabled: true,
            });
          }

          // 如果都没有，保留空数组
          persisted.configs = configs;
          persisted.activeConfigIndex = 0;
          delete persisted.config;
        }

        // v5 之前可能没有 configs，确保有默认值
        if (!persisted.configs) {
          persisted.configs = [];
          persisted.activeConfigIndex = 0;
        }

        return persisted;
      },
    },
  ),
);

// === 预设 API 提供商 ===
export interface AIProvider {
  id: string;
  name: string;
  apiEndpoint: string;
  model: string;
  description: string;
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'sensenova',
    name: '日日新',
    apiEndpoint: 'https://api.sensenova.cn/compatible-mode/v1/chat/completions',
    model: 'sensenova-6.8-flash-lite',
    description: '商汤日日新，国内高速稳定',
  },
  {
    id: 'agnes',
    name: 'Agnes AI',
    apiEndpoint: 'https://api.agnes-ai.cn/v1/chat/completions',
    model: 'agnes-2.5-flash',
    description: 'Agnes AI，国内高速响应',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    description: 'GPT-4o-mini，海外可用',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    description: '国内可用，便宜实惠',
  },
  {
    id: 'custom',
    name: '自定义',
    apiEndpoint: '',
    model: '',
    description: '兼容 OpenAI 格式的任意 API',
  },
];
