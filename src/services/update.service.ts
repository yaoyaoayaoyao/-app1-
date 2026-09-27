import { Platform, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import { CHANGELOG, type ChangelogEntry } from '@/data/changelog';

// ---------------------------------------------------------------------------
// 仓库配置：App 从这里的最新 Release 下载并安装新 APK
// 注意：若仓库是 Private 私有，App 读不到；需要把仓库改为 Public
// ---------------------------------------------------------------------------

const GITHUB_OWNER = 'yaoyaoayaoyao';
const GITHUB_REPO = '-app1-';
const LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

/** APK 下载后的存放位置（App 私有目录，无需存储权限） */
function getApkDestination() {
  return new FileSystem.File(FileSystem.Paths.document, 'update.apk');
}

// ---------------------------------------------------------------------------
// 版本工具
// ---------------------------------------------------------------------------

/** 语义化版本比较：返回 1 if a>b, -1 if a<b, 0 相等 */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const p = v.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
    return { major: p[0] || 0, minor: p[1] || 0, patch: p[2] || 0 };
  };
  const va = parse(a);
  const vb = parse(b);
  if (va.major !== vb.major) return va.major > vb.major ? 1 : -1;
  if (va.minor !== vb.minor) return va.minor > vb.minor ? 1 : -1;
  if (va.patch !== vb.patch) return va.patch > vb.patch ? 1 : -1;
  return 0;
}

// ---------------------------------------------------------------------------
// 当前版本信息
// ---------------------------------------------------------------------------

const APP_VERSION = '1.7.0';
const BUILD_DATE = '2026-09-27';

export function getCurrentVersion(): {
  version: string;
  buildDate: string;
  channel: string;
} {
  const version =
    (Constants.expoConfig?.version as string) ||
    (Constants.manifest as any)?.version ||
    APP_VERSION;
  return { version, buildDate: BUILD_DATE, channel: 'GitHub Releases' };
}

// ---------------------------------------------------------------------------
// 本次检查结果缓存（下载 / 安装时需要用到链接）
// ---------------------------------------------------------------------------

let _downloadUrl: string | null = null;
let _releaseUrl: string | null = null;
let _downloadedApkUri: string | null = null;

// ---------------------------------------------------------------------------
// 检查更新（GitHub Releases）
// ---------------------------------------------------------------------------

export interface UpdateCheckResult {
  hasUpdate: boolean;
  message: string;
  changelog?: string[];
  latestVersion?: string;
  latestEntry?: ChangelogEntry;
  downloadUrl?: string;
  sizeMB?: number;
}

/** 把 Release 正文整理成更新说明列表 */
function parseReleaseBody(body?: string): string[] {
  if (!body) return [];
  return body
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter((line) => line.length > 0)
    .slice(0, 20);
}

export async function checkForUpdate(): Promise<UpdateCheckResult> {
  const { version: currentVersion } = getCurrentVersion();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000); // 网络差不干等

    const res = await fetch(LATEST_RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      // 404 = 还没有任何 Release，也可能是私有仓库 App 读不到
      return { hasUpdate: false, message: '已是最新版本' };
    }

    const data = await res.json();
    const latestVersion: string = String(data.tag_name || '').replace(/^v/i, '').trim();
    if (!latestVersion) {
      return { hasUpdate: false, message: '已是最新版本' };
    }

    const apkAsset = (data.assets || []).find((a: any) =>
      String(a?.name || '').toLowerCase().endsWith('.apk'),
    );
    _downloadUrl = apkAsset?.browser_download_url ?? null;
    _releaseUrl = data.html_url ?? null;

    if (compareVersions(latestVersion, currentVersion) <= 0) {
      return { hasUpdate: false, message: '当前已是最新版本' };
    }

    const changes = parseReleaseBody(data.body);
    const finalChanges =
      changes.length > 0
        ? changes
        : CHANGELOG.find((e) => e.version === latestVersion)?.changes ?? ['优化与修复'];

    const latestEntry: ChangelogEntry = {
      version: latestVersion,
      date: String(data.published_at || '').slice(0, 10) || BUILD_DATE,
      title: data.name || `v${latestVersion}`,
      changes: finalChanges,
    };

    return {
      hasUpdate: true,
      message: `发现新版本 v${latestVersion}`,
      changelog: finalChanges,
      latestVersion,
      latestEntry,
      downloadUrl: _downloadUrl ?? undefined,
      sizeMB: apkAsset?.size ? +(apkAsset.size / 1048576).toFixed(1) : undefined,
    };
  } catch {
    // 网络不通 / 超时：不当失败，静默视为无更新
    return { hasUpdate: false, message: '已是最新版本' };
  }
}

// ---------------------------------------------------------------------------
// 下载新 APK（真实进度）
// ---------------------------------------------------------------------------

export interface DownloadProgressCallback {
  (progress: number): void;
}

export async function downloadUpdate(
  onProgress?: DownloadProgressCallback,
): Promise<{ success: boolean; message: string }> {
  if (!_downloadUrl) {
    return { success: false, message: '没有可用的下载地址，请先检查更新' };
  }

  try {
    const destination = getApkDestination();

    // 清掉上一次残留的安装包（清理失败也不影响新下载）
    try {
      if (destination.exists) {
        destination.delete();
      }
    } catch {
      /* 忽略 */
    }

    const task = FileSystem.File.createDownloadTask(_downloadUrl, destination, {
      onProgress: ({ bytesWritten, totalBytes }) => {
        const pct = totalBytes > 0 ? Math.round((bytesWritten / totalBytes) * 100) : 0;
        onProgress?.(Math.min(pct, 100));
      },
    });

    const file = await task.downloadAsync();
    onProgress?.(100);

    if (file?.uri) {
      _downloadedApkUri = file.uri;
      return { success: true, message: '下载完成，请安装' };
    }
    return { success: false, message: '下载失败，请稍后重试' };
  } catch (e) {
    return { success: false, message: (e as Error).message || '下载失败' };
  }
}

// ---------------------------------------------------------------------------
// 安装新 APK（唤起安卓安装界面）
// ---------------------------------------------------------------------------

export async function installUpdate(): Promise<{ success: boolean; message: string }> {
  const uri = _downloadedApkUri;

  if (!uri) {
    return { success: false, message: '安装包不存在，请重新下载' };
  }

  // 非安卓（网页预览等）只能跳浏览器
  if (Platform.OS !== 'android') {
    if (_releaseUrl) {
      await Linking.openURL(_releaseUrl);
      return { success: false, message: '已跳转到下载页面（非安卓环境）' };
    }
    return { success: false, message: '当前环境不支持自动安装' };
  }

  try {
    const contentUri = await FileSystem.getContentUriAsync(uri);
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      // Intent.FLAG_GRANT_READ_URI_PERMISSION
      flags: 1,
      type: 'application/vnd.android.package-archive',
    });
    return { success: true, message: '已唤起安装界面' };
  } catch (e) {
    if (_releaseUrl) {
      await Linking.openURL(_releaseUrl);
      return { success: false, message: '已跳转浏览器下载' };
    }
    return { success: false, message: (e as Error).message || '安装失败' };
  }
}

/** 当前已下载待安装的 APK 路径（无则 null） */
export function getDownloadedApkUri(): string | null {
  return _downloadedApkUri;
}
