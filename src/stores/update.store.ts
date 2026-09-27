import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  checkForUpdate,
  downloadUpdate,
  installUpdate as doInstall,
  getCurrentVersion,
} from '@/services/update.service';

export interface UpdateInfo {
  version: string;
  changes: string[];
  date: string;
}

interface UpdateState {
  // 状态
  currentVersion: string;
  lastCheckTime: number | null;
  hasUpdate: boolean;
  updateInfo: UpdateInfo | null;
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  isDownloaded: boolean;
  isDismissed: boolean;
  installMessage: string | null;

  // 操作
  checkUpdate: (silent?: boolean) => Promise<void>;
  applyUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  dismissUpdate: () => void;
  resetDismiss: () => void;
}

export const useUpdateStore = create<UpdateState>()(
  persist(
    (set, get) => ({
      currentVersion: getCurrentVersion().version,
      lastCheckTime: null,
      hasUpdate: false,
      updateInfo: null,
      isChecking: false,
      isDownloading: false,
      downloadProgress: 0,
      isDownloaded: false,
      isDismissed: false,
      installMessage: null,

      checkUpdate: async (silent = false) => {
        if (get().isChecking) return;
        set({ isChecking: true });

        try {
          const result = await checkForUpdate();
          const now = Date.now();

          if (result.hasUpdate && result.latestEntry) {
            set({
              hasUpdate: true,
              updateInfo: {
                version: result.latestEntry.version,
                changes: result.changelog || result.latestEntry.changes,
                date: result.latestEntry.date,
              },
              lastCheckTime: now,
              isChecking: false,
              isDismissed: silent ? get().isDismissed : false,
            });
          } else {
            set({
              hasUpdate: false,
              updateInfo: null,
              lastCheckTime: now,
              isChecking: false,
            });
          }
        } catch {
          set({ isChecking: false });
        }
      },

      applyUpdate: async () => {
        if (get().isDownloading) return;
        set({ isDownloading: true, downloadProgress: 0 });

        try {
          const result = await downloadUpdate((progress) => {
            set({ downloadProgress: progress });
          });

          if (result.success) {
            set({
              isDownloading: false,
              downloadProgress: 100,
              isDownloaded: true,
              hasUpdate: false,
            });
          } else {
            set({ isDownloading: false });
          }
        } catch {
          set({ isDownloading: false });
        }
      },

      installUpdate: async () => {
        set({ installMessage: null });
        const result = await doInstall();
        set({ installMessage: result.success ? null : result.message });
      },

      dismissUpdate: () => {
        set({ isDismissed: true });
      },

      resetDismiss: () => {
        set({ isDismissed: false });
      },
    }),
    {
      name: 'cinnamoroll-update',
      storage: createJSONStorage(() => AsyncStorage),
      // 只持久化需要的数据
      partialize: (state) => ({
        lastCheckTime: state.lastCheckTime,
        isDismissed: state.isDismissed,
      }),
    },
  ),
);

// installUpdate 已在本 store 提供，不再导出 reloadApp
