import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Habit, CheckInRecord, CheckInCategory, HabitMode, Note, NoteTag, MoodEntry, MoodType } from '@/types';
import { colors } from '@/theme';
import { generateId } from '@/utils/id';
import { useCheckInStore } from '@/stores/checkin.store';
import { useNotesStore } from '@/stores/notes.store';
import { useMoodStore } from '@/stores/mood.store';

/**
 * 数据搬家服务
 * 把别的 App 导出的打卡数据翻译成本 App 的格式，再合并进本地库。
 * 支持三种来源：
 *   1. legacy-v5  旧版「随身便签 + 物品资产 + 习惯打卡」导出的 backup_*.json
 *   2. generic    通用 JSON：{ habits: [{ name, dates: [...] }] } 或直接是数组
 *   3. csv        纯文本：一行一条「习惯名,日期」
 */

export type SourceFormat = 'legacy-v5' | 'generic' | 'csv';

export interface MigrationHabitPreview {
  name: string;
  icon: string;
  color: string;
  category: CheckInCategory;
  recordCount: number;      // 这个文件里带过来的打卡条数
  newRecordCount: number;   // 去掉重复后真正会新增的条数
  isExisting: boolean;      // App 里已经有同名习惯 → 合并到它身上
  isHiddenInSource: boolean;
  firstDate: string | null;
  lastDate: string | null;
}

export interface MigrationPreview {
  format: SourceFormat;
  formatLabel: string;
  habits: MigrationHabitPreview[];
  newHabitCount: number;
  mergeHabitCount: number;
  newRecordCount: number;
  skipRecordCount: number;
  noteCount: number;
  moodCount: number;
  warnings: string[];
}

export interface MigrationResult {
  habitsAdded: number;
  habitsMerged: number;
  recordsAdded: number;
  notesAdded: number;
  moodsAdded: number;
}

// ===== 旧图标名 → MaterialCommunityIcons 名字 =====
const LEGACY_ICON_MAP: Record<string, string> = {
  pill: 'pill',
  sprout: 'sprout',
  dumbbell: 'dumbbell',
  activity: 'run-fast',
  coffee: 'coffee',
  carrot: 'carrot',
  brain: 'brain',
  salad: 'food-apple',
  utensils: 'silverware-fork-knife',
  water: 'water',
  book: 'book-open-variant',
  pen: 'pencil',
  heart: 'heart',
  star: 'star',
  moon: 'sleep',
  sun: 'white-balance-sunny',
  bed: 'bed',
  run: 'run',
  bike: 'bike',
  bath: 'shower',
  tooth: 'tooth',
  apple: 'food-apple',
  music: 'music',
  camera: 'camera',
  phone: 'phone',
  home: 'home',
  work: 'briefcase',
  briefcase: 'briefcase',
  leaf: 'leaf',
  flame: 'fire',
};
const DEFAULT_ICON = 'check-circle-outline';

// 旧分类 → 本 App 分类
const LEGACY_CATEGORY_MAP: Record<string, CheckInCategory> = {
  健康: 'health',
  医疗: 'health',
  运动: 'exercise',
  健身: 'exercise',
  学习: 'study',
  读书: 'study',
  生活: 'life',
  工作: 'custom',
  其他: 'custom',
};

const CATEGORY_LABEL: Record<CheckInCategory, string> = {
  health: '健康',
  study: '学习',
  life: '生活',
  exercise: '运动',
  custom: '其他',
};

const GLYPH_MAP: Record<string, unknown> =
  (MaterialCommunityIcons as unknown as { glyphMap?: Record<string, unknown> }).glyphMap ?? {};

/** 图标名必须真实存在，否则渲染会崩，统一兜底 */
export function safeIcon(name: string | undefined | null): string {
  if (!name) return DEFAULT_ICON;
  const mapped = LEGACY_ICON_MAP[name] ?? name;
  if (Object.keys(GLYPH_MAP).length > 0) {
    return GLYPH_MAP[mapped] !== undefined ? mapped : DEFAULT_ICON;
  }
  return /^[a-z0-9-]+$/.test(mapped) ? mapped : DEFAULT_ICON;
}

/** 颜色必须是 #RRGGBB，否则从便签色板里挑一个 */
function safeColor(input: unknown, seed: number): string {
  if (typeof input === 'string' && /^#[0-9a-fA-F]{6}$/.test(input.trim())) {
    return input.trim();
  }
  return colors.noteColors[seed % colors.noteColors.length];
}

/** 把各种写法统一成 2026-09-03 */
function normalizeDate(raw: unknown): string | null {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const s = String(raw).trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }
  // 20260903
  m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

/** 判断一条记录算不算「打过卡」 */
function isCompletedValue(v: unknown): boolean {
  if (v === true || v === 1 || v === '1') return true;
  if (typeof v === 'string') return v.trim().toLowerCase() === 'true' || v.trim() === 'yes' || v.trim() === 'done';
  if (typeof v === 'number') return v > 0;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.completed === 'boolean') return o.completed;
    if (typeof o.done === 'boolean') return o.done;
    return true; // 有这条记录就当作打过
  }
  return false;
}

// ===== 中间结构：解析完的统一形态 =====
interface ParsedSource {
  habits: {
    name: string;
    icon: string;
    color: string;
    category: CheckInCategory;
    freqHint?: string;
    hidden?: boolean;
    createdAt: number;
    dates: string[];
  }[];
  notes: { text: string; category: string; createdAt: number; updatedAt: number; pinned: boolean }[];
  moods: { date: string; mood: MoodType }[];
}

const MOOD_MAP: Record<string, MoodType> = {
  happy: 'happy',
  love: 'happy',
  joy: 'happy',
  excited: 'excited',
  calm: 'calm',
  neutral: 'calm',
  ok: 'calm',
  tired: 'tired',
  sad: 'sad',
  angry: 'angry',
  mad: 'angry',
};

// ===== 格式识别 =====
export function detectFormat(text: string): SourceFormat | null {
  const t = text.trim();
  if (!t) return null;

  if (t.startsWith('{') || t.startsWith('[')) {
    try {
      const data = JSON.parse(t);
      if (data && typeof data === 'object' && Array.isArray((data as { plans?: unknown[] }).plans)) {
        return 'legacy-v5';
      }
      return 'generic';
    } catch {
      return null;
    }
  }

  // 纯文本：至少有一行能认出日期
  const hasDate = t.split(/\r?\n/).some((line) => line.includes(',') || line.includes('\t') || line.includes('，'));
  return hasDate ? 'csv' : null;
}

// ===== 解析：旧版 v5 =====
function parseLegacyV5(data: Record<string, unknown>): ParsedSource {
  const plans = (data.plans as Record<string, unknown>[] | undefined) ?? [];
  const habits: ParsedSource['habits'] = [];

  plans.forEach((p, index) => {
    if (!p || typeof p !== 'object') return;
    const name = String(p.name ?? p.title ?? '').trim();
    if (!name) return;

    const rawRecords = (p.records ?? p.log ?? p.dates ?? {}) as unknown;
    const dates: string[] = [];
    if (Array.isArray(rawRecords)) {
      rawRecords.forEach((d) => {
        const nd = normalizeDate(d);
        if (nd) dates.push(nd);
      });
    } else if (rawRecords && typeof rawRecords === 'object') {
      Object.entries(rawRecords as Record<string, unknown>).forEach(([k, v]) => {
        const nd = normalizeDate(k);
        if (nd && isCompletedValue(v)) dates.push(nd);
      });
    }

    const catRaw = String(p.cat ?? p.category ?? '').trim();
    habits.push({
      name,
      icon: safeIcon(String(p.icon ?? '') || undefined),
      color: safeColor(p.color, index),
      category: LEGACY_CATEGORY_MAP[catRaw] ?? 'custom',
      freqHint: typeof p.freq === 'string' ? p.freq : undefined,
      hidden: p.hidden === true,
      createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
      dates: [...new Set(dates)].sort(),
    });
  });

  // 便签
  const notesRaw = (data.notes as Record<string, unknown>[] | undefined) ?? [];
  const notes: ParsedSource['notes'] = notesRaw
    .filter((n) => n && typeof n === 'object' && !(n as { deletedAt?: unknown }).deletedAt)
    .map((n) => ({
      text: String(n.text ?? n.content ?? '').trim(),
      category: String(n.category ?? '未分类'),
      createdAt: typeof n.created === 'number' ? n.created : Date.now(),
      updatedAt: typeof n.updated === 'number' ? n.updated : Date.now(),
      pinned: n.pin === true || n.imp === true,
    }))
    .filter((n) => n.text.length > 0);

  // 心情
  const moodRaw = (data.mood as Record<string, unknown> | undefined) ?? {};
  const moods: ParsedSource['moods'] = [];
  Object.entries(moodRaw).forEach(([k, v]) => {
    const d = normalizeDate(k);
    if (!d) return;
    const mt = MOOD_MAP[String(v).trim().toLowerCase()];
    if (mt) moods.push({ date: d, mood: mt });
  });

  return { habits, notes, moods };
}

// ===== 解析：通用 JSON =====
function pickHabitName(h: Record<string, unknown>): string {
  return String(h.name ?? h.title ?? h.habit ?? h.label ?? '').trim();
}

function pickDates(h: Record<string, unknown>): string[] {
  const raw = (h.dates ?? h.records ?? h.checkins ?? h.checkIns ?? h.log ?? h.doneDates ?? []) as unknown;
  const out: string[] = [];
  if (Array.isArray(raw)) {
    raw.forEach((d) => {
      if (d && typeof d === 'object') {
        const nd = normalizeDate((d as Record<string, unknown>).date ?? (d as Record<string, unknown>).day);
        if (nd && isCompletedValue((d as Record<string, unknown>).completed ?? (d as Record<string, unknown>).done ?? true)) {
          out.push(nd);
        }
      } else {
        const nd = normalizeDate(d);
        if (nd) out.push(nd);
      }
    });
  } else if (raw && typeof raw === 'object') {
    Object.entries(raw as Record<string, unknown>).forEach(([k, v]) => {
      const nd = normalizeDate(k);
      if (nd && isCompletedValue(v)) out.push(nd);
    });
  }
  return [...new Set(out)].sort();
}

function parseGeneric(data: unknown): ParsedSource {
  let list: unknown[] = [];
  let rawCheckIns: unknown[] = [];
  let rawNotes: unknown[] = [];
  let rawMoods: unknown[] = [];

  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const candidate =
      (d.habits as unknown[]) ?? (d.plans as unknown[]) ?? (d.items as unknown[]) ?? (d.data as unknown[]) ?? [];
    list = Array.isArray(candidate) ? candidate : [];
    rawCheckIns = (Array.isArray(d.checkIns) ? d.checkIns : Array.isArray(d.checkins) ? d.checkins : []) as unknown[];
    rawNotes = (Array.isArray(d.notes) ? d.notes : []) as unknown[];
    rawMoods = (Array.isArray(d.moods) ? d.moods : Array.isArray(d.moodEntries) ? d.moodEntries : []) as unknown[];
  }

  const habits: ParsedSource['habits'] = [];
  const idToIndex = new Map<string, number>();

  list.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const h = item as Record<string, unknown>;
    const name = pickHabitName(h);
    if (!name) return;
    const catRaw = String(h.category ?? h.cat ?? '').trim();
    const idx = habits.length;
    habits.push({
      name,
      icon: safeIcon(String(h.icon ?? '') || undefined),
      color: safeColor(h.color ?? h.colour, index),
      category:
        LEGACY_CATEGORY_MAP[catRaw] ??
        (Object.keys(CATEGORY_LABEL).includes(catRaw) ? (catRaw as CheckInCategory) : 'custom'),
      hidden: h.archived === true || h.hidden === true,
      createdAt: typeof h.createdAt === 'number' ? h.createdAt : Date.now(),
      dates: pickDates(h),
    });
    const sid = h.id ?? h.habitId;
    if (typeof sid === 'string' || typeof sid === 'number') idToIndex.set(String(sid), idx);
  });

  // 打卡记录单独成表的情况（本 App 自己导出的备份就是这种）
  rawCheckIns.forEach((r) => {
    if (!r || typeof r !== 'object') return;
    const rec = r as Record<string, unknown>;
    const d = normalizeDate(rec.date ?? rec.day);
    if (!d) return;
    if (!isCompletedValue(rec.completed ?? rec.done ?? true)) return;
    const idx = idToIndex.get(String(rec.habitId ?? rec.habit ?? ''));
    if (idx === undefined) return;
    habits[idx].dates.push(d);
  });
  habits.forEach((h) => {
    h.dates = [...new Set(h.dates)].sort();
  });

  // 便签
  const notes: ParsedSource['notes'] = [];
  rawNotes.forEach((n) => {
    if (!n || typeof n !== 'object') return;
    const o = n as Record<string, unknown>;
    const text = String(o.content ?? o.text ?? '').trim();
    if (!text) return;
    notes.push({
      text,
      category: String(o.category ?? o.tag ?? '未分类'),
      createdAt: typeof o.createdAt === 'number' ? o.createdAt : Date.now(),
      updatedAt: typeof o.updatedAt === 'number' ? o.updatedAt : Date.now(),
      pinned: o.pinned === true || o.pin === true,
    });
  });

  // 心情：既支持 { "2026-09-12": "happy" }，也支持 [{ date, mood }]
  const moods: ParsedSource['moods'] = [];
  rawMoods.forEach((m) => {
    if (!m || typeof m !== 'object') return;
    const o = m as Record<string, unknown>;
    const d = normalizeDate(o.date ?? o.day);
    if (!d) return;
    const mt = MOOD_MAP[String(o.mood ?? '').trim().toLowerCase()];
    if (mt) moods.push({ date: d, mood: mt });
  });

  return { habits, notes, moods };
}

// ===== 解析：CSV 文本 =====
function parseCsv(text: string): ParsedSource {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  const dateRe = /(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})|(\d{4}\d{2}\d{2})/;
  const map = new Map<string, string[]>();

  lines.forEach((line) => {
    // 支持逗号、中文逗号、制表符、分号
    const parts = line.split(/[,，\t;；]/).map((s) => s.trim()).filter((s) => s.length > 0);
    if (parts.length < 2) return;

    const dateIdx = parts.findIndex((p) => dateRe.test(p));
    if (dateIdx < 0) return;
    const date = normalizeDate(parts[dateIdx]);
    if (!date) return;

    const name = parts[dateIdx === 0 ? 1 : 0];
    if (!name) return;

    const arr = map.get(name) ?? [];
    arr.push(date);
    map.set(name, arr);
  });

  const habits: ParsedSource['habits'] = [];
  let i = 0;
  map.forEach((dates, name) => {
    habits.push({
      name,
      icon: safeIcon(undefined),
      color: safeColor(null, i),
      category: 'custom',
      createdAt: Date.now(),
      dates: [...new Set(dates)].sort(),
    });
    i++;
  });

  return { habits, notes: [], moods: [] };
}

// ===== 解析总入口 =====
function parseSource(text: string, format: SourceFormat): ParsedSource {
  if (format === 'csv') return parseCsv(text);
  const data = JSON.parse(text.trim());
  if (format === 'legacy-v5') return parseLegacyV5(data as Record<string, unknown>);
  return parseGeneric(data);
}

/**
 * 生成预览：不写任何数据，只告诉用户「会新增什么、会跳过什么」
 */
export function buildPreview(text: string, format: SourceFormat): MigrationPreview {
  const parsed = parseSource(text, format);
  if (parsed.habits.length === 0) {
    throw new Error('没认出任何打卡习惯，请检查文件内容是不是导出时的原始备份。');
  }

  const { habits: existHabits, checkIns: existCheckIns } = useCheckInStore.getState();
  const existingByTitle = new Map<string, Habit>();
  existHabits.forEach((h) => existingByTitle.set(h.title.trim(), h));
  const existRecordIds = new Set(existCheckIns.map((c) => c.id));

  const warnings: string[] = [];
  const previews: MigrationHabitPreview[] = [];
  let newHabitCount = 0;
  let mergeHabitCount = 0;
  let newRecordCount = 0;
  let skipRecordCount = 0;

  parsed.habits.forEach((h) => {
    const matched = existingByTitle.get(h.name);
    const habitId = matched?.id ?? `new_${h.name}`;
    let fresh = 0;
    h.dates.forEach((d) => {
      if (existRecordIds.has(`${habitId}_${d}`)) return;
      fresh++;
    });
    const skipped = h.dates.length - fresh;

    if (matched) mergeHabitCount++;
    else newHabitCount++;
    newRecordCount += fresh;
    skipRecordCount += skipped;

    if (h.freqHint === 'twice' || h.freqHint === 'meal') {
      warnings.push(`「${h.name}」在老 App 里一天要打多次卡，搬过来后按「当天打过」记一次。`);
    }

    previews.push({
      name: h.name,
      icon: h.icon,
      color: h.color,
      category: h.category,
      recordCount: h.dates.length,
      newRecordCount: fresh,
      isExisting: !!matched,
      isHiddenInSource: !!h.hidden,
      firstDate: h.dates[0] ?? null,
      lastDate: h.dates[h.dates.length - 1] ?? null,
    });
  });

  if (parsed.notes.length > 0) warnings.push(`文件里还有 ${parsed.notes.length} 条便签，可以一起搬过来。`);
  if (parsed.moods.length > 0) warnings.push(`文件里还有 ${parsed.moods.length} 天的心情记录，可以一起搬过来。`);

  // 日期跨度提示
  const allDates = parsed.habits.flatMap((h) => h.dates).sort();
  if (allDates.length > 0) {
    warnings.unshift(`打卡日期范围：${allDates[0]} 到 ${allDates[allDates.length - 1]}`);
  }

  const formatLabel =
    format === 'legacy-v5' ? '旧版备份（随身便签+习惯打卡 v5）' : format === 'generic' ? '通用 JSON' : '文本 / CSV';

  return {
    format,
    formatLabel,
    habits: previews,
    newHabitCount,
    mergeHabitCount,
    newRecordCount,
    skipRecordCount,
    noteCount: parsed.notes.length,
    moodCount: parsed.moods.length,
    warnings,
  };
}

export function categoryLabel(c: CheckInCategory): string {
  return CATEGORY_LABEL[c];
}

/**
 * 真正写入。同名习惯合并，同一天重复记录跳过，已有的数据一条都不会被覆盖。
 */
export async function applyMigration(
  text: string,
  format: SourceFormat,
  options: { mode: HabitMode; includeNotes: boolean; includeMoods: boolean },
): Promise<MigrationResult> {
  const parsed = parseSource(text, format);

  const checkIn = useCheckInStore.getState();
  const existingByTitle = new Map<string, Habit>();
  checkIn.habits.forEach((h) => existingByTitle.set(h.title.trim(), h));
  const existRecordIds = new Set(checkIn.checkIns.map((c) => c.id));

  const userId = 'local_user';
  const newHabits: Habit[] = [];
  const newRecords: CheckInRecord[] = [];
  let habitsAdded = 0;
  let habitsMerged = 0;

  parsed.habits.forEach((h) => {
    const matched = existingByTitle.get(h.name);
    const habitId = matched?.id ?? generateId();

    if (!matched) {
      newHabits.push({
        id: habitId,
        userId,
        title: h.name,
        category: h.category,
        icon: h.icon,
        color: h.color,
        targetDays: 30,
        reminderTime: null,
        mode: options.mode,
        createdAt: h.createdAt,
        archived: !!h.hidden,
      });
      habitsAdded++;
    } else {
      habitsMerged++;
    }

    h.dates.forEach((d) => {
      const id = `${habitId}_${d}`;
      if (existRecordIds.has(id)) return;
      existRecordIds.add(id);
      newRecords.push({
        id,
        habitId,
        userId,
        date: d,
        completed: true,
        note: null,
        mood: null,
        createdAt: Date.parse(`${d}T12:00:00`) || Date.now(),
      });
    });
  });

  useCheckInStore.setState({
    habits: [...checkIn.habits, ...newHabits],
    checkIns: [...checkIn.checkIns, ...newRecords],
  });

  // 便签
  let notesAdded = 0;
  if (options.includeNotes && parsed.notes.length > 0) {
    const noteState = useNotesStore.getState();
    const existTexts = new Set(noteState.notes.map((n) => `${n.title}||${n.content}`));
    const tagOf = (c: string): NoteTag => {
      if (c.includes('待') || c.includes('todo')) return 'todo';
      if (c.includes('想') || c.includes('灵感')) return 'idea';
      if (c.includes('日记')) return 'diary';
      if (c.includes('提醒')) return 'reminder';
      return 'plain';
    };
    const newNotes: Note[] = [];
    parsed.notes.forEach((n, i) => {
      const title = n.text.split(/\r?\n/)[0].slice(0, 20) || '旧便签';
      const key = `${title}||${n.text}`;
      if (existTexts.has(key)) return;
      existTexts.add(key);
      newNotes.push({
        id: generateId(),
        userId,
        title,
        content: n.text,
        colorIndex: i % colors.noteColors.length,
        tag: tagOf(n.category),
        pinned: n.pinned,
        checklistItems: null,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      });
    });
    if (newNotes.length > 0) {
      useNotesStore.setState({
        notes: [...newNotes, ...noteState.notes].sort((a, b) => b.updatedAt - a.updatedAt),
      });
      notesAdded = newNotes.length;
    }
  }

  // 心情
  let moodsAdded = 0;
  if (options.includeMoods && parsed.moods.length > 0) {
    const moodState = useMoodStore.getState();
    const existDates = new Set(moodState.entries.map((e) => e.date));
    const newMoods: MoodEntry[] = [];
    parsed.moods.forEach((m) => {
      if (existDates.has(m.date)) return;
      existDates.add(m.date);
      newMoods.push({
        id: generateId(),
        date: m.date,
        mood: m.mood,
        content: '（从旧版数据搬过来的）',
        createdAt: Date.parse(`${m.date}T12:00:00`) || Date.now(),
      });
    });
    if (newMoods.length > 0) {
      useMoodStore.setState({
        entries: [...moodState.entries, ...newMoods].sort((a, b) => a.date.localeCompare(b.date)),
      });
      moodsAdded = newMoods.length;
    }
  }

  return {
    habitsAdded,
    habitsMerged,
    recordsAdded: newRecords.length,
    notesAdded,
    moodsAdded,
  };
}
