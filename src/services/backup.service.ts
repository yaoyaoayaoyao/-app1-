import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useCheckInStore } from '@/stores/checkin.store';
import { useNotesStore } from '@/stores/notes.store';
import { useMoodStore } from '@/stores/mood.store';
import { useFoodStore } from '@/stores/food.store';
import { useJournalStore } from '@/stores/journal.store';

/**
 * 备份与恢复
 * 导出：把手机里所有数据打包成一个 JSON，可以存网盘、发微信、换手机时带走
 * 读取：把用户选中的文件读成文本，交给 migration.service 解析
 */

export interface BackupStats {
  habits: number;
  checkIns: number;
  notes: number;
  moods: number;
  foodEntries: number;
  mealPlans: number;
  journals: number;
}

export function getBackupStats(): BackupStats {
  return {
    habits: useCheckInStore.getState().habits.length,
    checkIns: useCheckInStore.getState().checkIns.length,
    notes: useNotesStore.getState().notes.length,
    moods: useMoodStore.getState().entries.length,
    foodEntries: useFoodStore.getState().entries.length,
    mealPlans: useFoodStore.getState().plans.length,
    journals: useJournalStore.getState().entries.length,
  };
}

export function hasAnyData(): boolean {
  const s = getBackupStats();
  return s.habits + s.checkIns + s.notes + s.moods + s.foodEntries + s.mealPlans + s.journals > 0;
}

function buildBackupJson(): string {
  const checkIn = useCheckInStore.getState();
  const payload = {
    app: '玉桂狗日记',
    backupVersion: 1,
    exportedAt: Date.now(),
    habits: checkIn.habits,
    checkIns: checkIn.checkIns.map((c) => ({
      habitId: c.habitId,
      date: c.date,
      completed: c.completed,
      note: c.note,
      mood: c.mood,
    })),
    notes: useNotesStore.getState().notes,
    moods: useMoodStore.getState().entries,
    foodEntries: useFoodStore.getState().entries,
    mealPlans: useFoodStore.getState().plans,
    journals: useJournalStore.getState().entries,
  };
  return JSON.stringify(payload, null, 2);
}

function timestampName(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

/**
 * 生成备份文件并唤起系统分享（可存到网盘/发给自己）
 * 返回文件名；抛错表示失败
 */
export async function exportBackup(): Promise<{ fileName: string; size: number }> {
  const json = buildBackupJson();
  const fileName = `cinnamoroll-backup-${timestampName()}.json`;
  const file = new FileSystem.File(FileSystem.Paths.document, fileName);
  try {
    file.create({ intermediates: true, overwrite: true });
  } catch {
    // 已存在时 create 会抛，忽略即可
  }
  await file.write(json);

  const size = file.size ?? json.length;

  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: '保存备份文件',
      UTI: 'public.json',
    });
  }

  return { fileName, size };
}

/** 让用户选一个文件，返回文本内容 */
export async function pickFileText(): Promise<{ text: string; name: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', 'text/csv', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets || result.assets.length === 0) return null;
  const asset = result.assets[0];

  const file = new FileSystem.File(asset.uri);
  const text = await file.text();
  return { text, name: asset.name ?? '文件' };
}
