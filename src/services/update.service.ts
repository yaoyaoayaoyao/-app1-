import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { CHANGELOG, type ChangelogEntry } from '@/data/changelog';

// ---------------------------------------------------------------------------
// 版本工具
// ---------------------------------------------------------------------------

/**
 * 语义化版本比较
 * 返回: 1 if a > b, -1 if a < b, 0 if equal
 */
export function compareVersions(a: string, b: string): number {
  const parseVersion = (v: string) => {
    const parts = v.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
    return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
  };
  const va = parseVersion(a);
  const vb = parseVersion(b);
  if (va.major !== vb.major) return va.major > vb.major ? 1 : -1;
  if (va.minor !== vb.minor) return va.minor > vb.minor ? 1 : -1;
  if (va.patch !== vb.patch) return va.patch > vb.patch ? 1 : -1;
  return 0;
}

// ---------------------------------------------------------------------------
// 当前版本信息
// ---------------------------------------------------------------------------

const APP_VERSION = '1.5.0';
const BUILD_DATE = '2026-09-26';
const CHANNEL = 'production';

export function getCurrentVersion(): {
  version: string;
  buildDate: string;
  channel: string;
} {
  // 优先从 expo-constants 读取版本号，fallback 到硬编码
  const version =
    (Constants.expoConfig?.version as string) ||
    (Constants.manifest as any)?.version ||
    APP_VERSION;
  return { version, buildDate: BUILD_DATE, channel: CHANNEL };
}

// ---------------------------------------------------------------------------
// expo-updates（真实 OTA）加载
// 仅在 EAS 生产构建中可用；开发 / Web 环境会回退到下面的模拟实现
// ---------------------------------------------------------------------------

let _expoUpdates: any | null | undefined;

async function loadExpoUpdates(): Promise<any | null> {
  if (_expoUpdates !== undefined) return _expoUpdates;
  try {
    // @ts-ignore expo-updates 只在 EAS 生产构建中存在
    const mod = await import('expo-updates');
    if (mod && mod.isEnabled) {
      _expoUpdates = mod;
    } else {
      _expoUpdates = null;
    }
  } catch {
    _expoUpdates = null;
  }
  return _expoUpdates;
}

// ---------------------------------------------------------------------------
// Web 环境 localStorage 辅助
// ---------------------------------------------------------------------------

const WEB_VERSION_KEY = 'cinnamoroll-installed-version';

function getWebInstalledVersion(): string {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage.getItem(WEB_VERSION_KEY) || APP_VERSION;
  }
  return APP_VERSION;
}

// ---------------------------------------------------------------------------
// 检查更新
// ---------------------------------------------------------------------------

export interface UpdateCheckResult {
  hasUpdate: boolean;
  message: string;
  changelog?: string[];
  latestVersion?: string;
  latestEntry?: ChangelogEntry;
}

/**
 * 检查是否有可用更新
 * 优先走 expo-updates 真实 OTA 检查；不可用时回退到本地 changelog 模拟
 */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
  const updates = await loadExpoUpdates();

  if (updates) {
    try {
      const res = await updates.checkForUpdateAsync();
      if (res.isAvailable) {
        const manifest = (res as any).manifest || {};
        const newVersion: string = manifest.version || CHANGELOG[CHANGELOG.length - 1].version;
        const entry =
          CHANGELOG.find((e) => e.version === newVersion) || CHANGELOG[CHANGELOG.length - 1];
        return {
          hasUpdate: true,
          message: `发现新版本 v${newVersion}`,
          changelog: entry.changes.map((c) => `[${entry.version}] ${c}`),
          latestVersion: newVersion,
          latestEntry: entry,
        };
      }
      return { hasUpdate: false, message: '当前已是最新版本' };
    } catch {
      // 真实检查失败 → 回退模拟
    }
  }

  // ===== 模拟实现（开发 / Web / 未配置 OTA 时）=====
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 600));

  const { version: currentVersion } = getCurrentVersion();
  const latestEntry = CHANGELOG[CHANGELOG.length - 1];
  const latestVersion = latestEntry.version;

  const installedVersion =
    Platform.OS === 'web' ? getWebInstalledVersion() : currentVersion;

  const hasUpdate = compareVersions(latestVersion, installedVersion) > 0;

  if (hasUpdate) {
    const newEntries = CHANGELOG.filter(
      (entry) => compareVersions(entry.version, installedVersion) > 0,
    );
    const allChanges = newEntries.flatMap((entry) =>
      entry.changes.map((change) => `[${entry.version}] ${change}`),
    );

    return {
      hasUpdate: true,
      message: `发现新版本 v${latestVersion}`,
      changelog: allChanges,
      latestVersion,
      latestEntry,
    };
  }

  return {
    hasUpdate: false,
    message: '当前已是最新版本',
  };
}

// ---------------------------------------------------------------------------
// 下载并应用更新
// ---------------------------------------------------------------------------

export interface DownloadProgressCallback {
  (progress: number): void;
}

/**
 * 下载并应用更新
 * 优先走 expo-updates 的 fetchUpdateAsync（真实下载 JS 增量包）；
 * 不可用时使用模拟进度
 */
export async function downloadUpdate(
  onProgress?: DownloadProgressCallback,
): Promise<{ success: boolean; message: string }> {
  const updates = await loadExpoUpdates();

  if (updates) {
    try {
      onProgress?.(15);
      const result = await updates.fetchUpdateAsync();
      onProgress?.(100);
      return {
        success: true,
        message: '更新已下载完成，重启应用以应用更新',
      };
    } catch {
      // 真实下载失败 → 回退模拟
    }
  }

  // ===== 模拟实现 =====
  const totalSteps = 20;
  const stepDelay = 120; // ms

  for (let i = 1; i <= totalSteps; i++) {
    const progress = Math.round((i / totalSteps) * 100);
    onProgress?.(progress);
    await new Promise((resolve) => setTimeout(resolve, stepDelay));
  }

  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    const latestVersion = CHANGELOG[CHANGELOG.length - 1].version;
    localStorage.setItem(WEB_VERSION_KEY, latestVersion);
  }

  return {
    success: true,
    message: '更新已下载完成，重启应用以应用更新',
  };
}

/**
 * 重启应用以应用更新
 * 原生构建用 expo-updates 的 reloadAsync；Web 用 location.reload()
 */
export async function reloadApp(): Promise<void> {
  const updates = await loadExpoUpdates();
  if (updates) {
    try {
      await updates.reloadAsync();
      return;
    } catch {
      // 忽略，回退
    }
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    window.location.reload();
    return;
  }

  // 原生环境且 expo-updates 不可用：无法直接重启，需用户手动重启
}
