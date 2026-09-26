import { useAIStore, type AIConfigEntry, type SummaryRecord } from '@/stores/ai.store';
import { useCheckInStore } from '@/stores/checkin.store';
import { useMoodStore } from '@/stores/mood.store';
import { useFoodStore, calcKcal, MEAL_META } from '@/stores/food.store';
import { useNotesStore } from '@/stores/notes.store';
import { getTodayString, getWeekRange, getMonthRange, addDays } from '@/utils/date';
import { generateId } from '@/utils/id';
import type { SummaryPeriod, MoodType, NoteTag, Habit } from '@/types';

// === 心情与便签的展示文案 ===
const MOOD_LABELS: Record<MoodType, string> = {
  happy: '开心',
  calm: '平静',
  tired: '疲惫',
  sad: '难过',
  excited: '兴奋',
  angry: '生气',
};

const TAG_LABELS: Record<NoteTag, string> = {
  todo: '待办',
  idea: '想法',
  diary: '日记',
  reminder: '提醒',
  plain: '普通',
};

/**
 * 根据周期计算日期范围
 */
function getDateRange(period: SummaryPeriod): [string, string] {
  const today = getTodayString();
  if (period === 'daily') {
    return [today, today];
  }
  if (period === 'weekly') {
    return getWeekRange(today);
  }
  return getMonthRange(today);
}

/**
 * 收集所有数据源，组装成结构化的用户 prompt 文本
 */
function collectData(period: SummaryPeriod): string {
  const [startDate, endDate] = getDateRange(period);
  const lines: string[] = [];

  const periodLabel = period === 'daily' ? '今天' : period === 'weekly' ? '本周' : '本月';
  lines.push(`【数据时间范围】${periodLabel}（${startDate} 至 ${endDate}）`);
  lines.push('');

  // === 习惯打卡 ===
  const checkInStore = useCheckInStore.getState();
  const activeHabits = checkInStore.habits.filter((h) => !h.archived);
  const periodCheckIns = checkInStore.checkIns.filter(
    (c) => c.date >= startDate && c.date <= endDate && c.completed
  );

  lines.push('【习惯打卡】');
  if (activeHabits.length === 0) {
    lines.push('- 暂无习惯记录');
  } else {
    const totalHabits = activeHabits.length;
    const completedToday = periodCheckIns.length;
    const completionRate = totalHabits > 0
      ? Math.round((completedToday / (totalHabits * (period === 'daily' ? 1 : period === 'weekly' ? 7 : 30))) * 100)
      : 0;

    lines.push(`- 习惯总数：${totalHabits}`);
    lines.push(`- ${periodLabel}完成打卡：${completedToday} 次`);

    activeHabits.forEach((habit) => {
      const streak = checkInStore.getCheckInStreak(habit.id);
      const habitCheckIns = periodCheckIns.filter((c) => c.habitId === habit.id);
      lines.push(
        `  · ${habit.title}：${periodLabel}${habitCheckIns.length}次，连续${streak.currentStreak}天，最长${streak.longestStreak}天`
      );
    });
  }
  lines.push('');

  // === 心情记录 ===
  const moodStore = useMoodStore.getState();
  const moodEntries = moodStore.entries.filter(
    (e) => e.date >= startDate && e.date <= endDate
  );

  lines.push('【心情记录】');
  if (moodEntries.length === 0) {
    lines.push(`- ${periodLabel}暂无心情记录`);
  } else {
    // 心情分布
    const moodCounts: Record<string, number> = {};
    moodEntries.forEach((e) => {
      const label = MOOD_LABELS[e.mood] || e.mood;
      moodCounts[label] = (moodCounts[label] || 0) + 1;
    });
    const moodSummary = Object.entries(moodCounts)
      .map(([m, c]) => `${m}${c}次`)
      .join('、');
    lines.push(`- 心情分布：${moodSummary}`);

    moodEntries.slice(0, 10).forEach((e) => {
      const content = e.content.trim();
      lines.push(`  · ${e.date} ${MOOD_LABELS[e.mood] || e.mood}${content ? '：' + content : ''}`);
    });
    if (moodEntries.length > 10) {
      lines.push(`  · ...共${moodEntries.length}条记录`);
    }
  }
  lines.push('');

  // === 饮食记录 ===
  const foodStore = useFoodStore.getState();
  let foodEntries = foodStore.entries.filter(
    (e) => e.date >= startDate && e.date <= endDate
  );

  lines.push('【饮食记录】');
  if (foodEntries.length === 0) {
    lines.push(`- ${periodLabel}暂无饮食记录`);
  } else {
    const totalKcal = foodEntries.reduce((sum, e) => sum + calcKcal(e), 0);
    const dateSet = new Set(foodEntries.map((e) => e.date));
    const avgKcal = dateSet.size > 0 ? Math.round(totalKcal / dateSet.size) : 0;

    lines.push(`- 记录天数：${dateSet.size}天`);
    lines.push(`- 总餐次：${foodEntries.length}餐`);
    lines.push(`- 平均每日热量：${avgKcal} kcal`);

    // 餐别计数
    const mealCounts: Record<string, number> = { 早餐: 0, 午餐: 0, 晚餐: 0, 加餐: 0 };
    foodEntries.forEach((e) => {
      const label = MEAL_META[e.meal].label;
      mealCounts[label] = (mealCounts[label] || 0) + 1;
    });
    const mealSummary = Object.entries(mealCounts)
      .filter(([, c]) => c > 0)
      .map(([m, c]) => `${m}${c}次`)
      .join('、');
    if (mealSummary) {
      lines.push(`- 餐次分布：${mealSummary}`);
    }

    // top 食物
    const foodCounts: Record<string, number> = {};
    foodEntries.forEach((e) => {
      const name = e.name.trim();
      if (name) foodCounts[name] = (foodCounts[name] || 0) + 1;
    });
    const topFoods = Object.entries(foodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => `${name}(${count}次)`)
      .join('、');
    if (topFoods) {
      lines.push(`- 常吃食物：${topFoods}`);
    }
  }
  lines.push('');

  // === 便签 ===
  const notesStore = useNotesStore.getState();
  const periodNotes = notesStore.notes.filter((n) => {
    // 按 updatedAt 判断是否在周期内
    const noteDate = new Date(n.updatedAt);
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(addDays(endDate, 1) + 'T00:00:00');
    return noteDate >= start && noteDate < end;
  });

  lines.push('【便签记录】');
  if (periodNotes.length === 0) {
    lines.push(`- ${periodLabel}暂无便签`);
  } else {
    const tagCounts: Record<string, number> = {};
    periodNotes.forEach((n) => {
      const label = TAG_LABELS[n.tag] || n.tag;
      tagCounts[label] = (tagCounts[label] || 0) + 1;
    });
    const tagSummary = Object.entries(tagCounts)
      .map(([t, c]) => `${t}${c}条`)
      .join('、');
    lines.push(`- 便签总数：${periodNotes.length}条（${tagSummary}）`);

    periodNotes.slice(0, 8).forEach((n) => {
      const title = n.title.trim();
      const content = n.content.trim().slice(0, 50);
      lines.push(`  · [${TAG_LABELS[n.tag] || n.tag}] ${title}${content ? '：' + content : ''}`);
    });
    if (periodNotes.length > 8) {
      lines.push(`  · ...共${periodNotes.length}条便签`);
    }
  }

  return lines.join('\n');
}

/**
 * 调用单个配置的 Chat Completions API
 */
async function callSingleConfig(
  config: AIConfigEntry,
  messages: { role: string; content: string }[],
  signal?: AbortSignal
): Promise<string> {
  const url = config.apiEndpoint?.trim();

  // 验证 URL 格式
  if (!url) {
    throw new Error(`「${config.name}」API 地址为空`);
  }
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(`「${config.name}」API 地址格式错误：${url}`);
  }

  // 调试日志：打印实际请求的 URL
  console.log(`[AI] 调用 API: ${config.name}`, {
    url,
    model: config.model,
    hasKey: !!config.apiKey,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.7,
    }),
    signal,
  }).catch((fetchErr) => {
    // 网络错误（包括 CORS、DNS 失败等）
    console.error(`[AI] 请求失败: ${config.name}`, {
      url,
      error: fetchErr?.message || String(fetchErr),
    });
    const error = new Error(
      `网络请求失败（${config.name}）：${fetchErr?.message || '无法连接到服务器'}。` +
      `请检查 API 地址是否正确，或是否存在跨域限制。请求地址：${url}`
    );
    (error as any).status = undefined; // 标记为网络错误
    throw error;
  });

  if (!response.ok) {
    let errorMsg = `API 请求失败 (${response.status})`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error?.message) {
        errorMsg = errorBody.error.message;
      }
    } catch {
      // 忽略 JSON 解析错误
    }
    const error = new Error(`「${config.name}」${errorMsg}`);
    (error as any).status = response.status;
    throw error;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI 返回内容为空，请稍后重试');
  }
  return content as string;
}

/**
 * 调用 OpenAI 兼容的 Chat Completions API（支持多配置自动轮换）
 * 按顺序尝试每个 enabled 的配置，401/403/429/网络错误自动切换到下一个
 */
async function callChatAPI(
  configs: AIConfigEntry[],
  messages: { role: string; content: string }[],
  signal?: AbortSignal
): Promise<string> {
  const enabledConfigs = configs.filter((c) => c.enabled && c.apiKey.trim());
  if (enabledConfigs.length === 0) {
    throw new Error('请先配置 AI 密钥');
  }

  const errors: string[] = [];

  for (let i = 0; i < enabledConfigs.length; i++) {
    const config = enabledConfigs[i];
    const isLast = i === enabledConfigs.length - 1;

    try {
      const content = await callSingleConfig(config, messages, signal);

      // 成功后记录当前使用的配置索引到 store
      const originalIndex = configs.findIndex((c) => c.id === config.id);
      if (originalIndex !== -1) {
        useAIStore.getState().setActiveIndex(originalIndex);
      }

      return content;
    } catch (err) {
      // AbortError 直接抛出
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }

      const status = (err as any).status;
      const errorMsg = (err as Error).message || '未知错误';

      // 401/403/429/网络错误 → 换下一个配置
      const shouldRetry =
        status === 401 ||
        status === 403 ||
        status === 429 ||
        status === undefined; // 网络错误通常没有 status

      if (shouldRetry && !isLast) {
        errors.push(`「${config.name}」${errorMsg}`);
        continue;
      }

      // 最后一个配置失败，汇总所有错误
      if (isLast) {
        errors.push(`「${config.name}」${errorMsg}`);
        const summary = errors.join('；');
        throw new Error(`所有配置均失败：${summary}`);
      }

      // 其他错误（如 400、500 等非轮换类错误）直接抛出
      throw err;
    }
  }

  throw new Error('API 调用失败');
}

const SYSTEM_PROMPT = `你是玉桂狗日记的AI助手，负责帮用户回顾和总结他们的日常生活。
请根据用户提供的数据，生成一份温暖、积极、有洞察力的总结。

要求：
1. 用中文回答
2. 语气亲切温暖，像朋友聊天一样
3. 先用2-3句话概述这个时间段的整体情况
4. 列出3-5个亮点（做得好的地方）
5. 给出2-3条温和的建议（不要说教）
6. 分析整体情绪状态
7. 用Markdown格式输出

输出格式严格如下：
## 概述
（2-3句话）

## 亮点
- 亮点1
- 亮点2
...

## 建议
- 建议1
- 建议2
...

## 情绪
（一句话描述整体情绪状态）`;

/**
 * 从 Markdown 内容中解析出亮点、建议、情绪
 */
function parseSummary(content: string): {
  highlights: string[];
  suggestions: string[];
  mood: string;
} {
  const highlights: string[] = [];
  const suggestions: string[] = [];
  let mood = '';

  // 按行分割
  const lines = content.split('\n');
  let currentSection: 'highlights' | 'suggestions' | 'mood' | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    if (lower.startsWith('## 亮点') || lower.startsWith('## highlight')) {
      currentSection = 'highlights';
      continue;
    }
    if (lower.startsWith('## 建议') || lower.startsWith('## suggestion')) {
      currentSection = 'suggestions';
      continue;
    }
    if (lower.startsWith('## 情绪') || lower.startsWith('## mood')) {
      currentSection = 'mood';
      continue;
    }
    if (lower.startsWith('## 概述') || lower.startsWith('## overview') || lower.startsWith('## summary')) {
      currentSection = null;
      continue;
    }

    // 提取列表项
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const item = trimmed.replace(/^[-•]\s*/, '').trim();
      if (currentSection === 'highlights') {
        highlights.push(item);
      } else if (currentSection === 'suggestions') {
        suggestions.push(item);
      }
    } else if (currentSection === 'mood' && trimmed) {
      // 情绪部分收集所有非空行
      mood = mood ? mood + trimmed : trimmed;
    }
  }

  // 兜底：如果没有解析到，尝试整体提取
  if (highlights.length === 0 && suggestions.length === 0) {
    // 尝试从内容中找列表项
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        highlights.push(trimmed.replace(/^[-•]\s*/, '').trim());
      }
    }
  }

  if (!mood) {
    mood = '整体状态平稳，继续保持~';
  }

  return { highlights, suggestions, mood };
}

/**
 * 生成 AI 总结
 */
export async function generateSummary(
  period: SummaryPeriod,
  signal?: AbortSignal
): Promise<SummaryRecord> {
  const { configs, isConfigured, addSummary } = useAIStore.getState();

  if (!isConfigured) {
    throw new Error('请先配置 AI 服务');
  }

  // 1. 收集数据
  const userData = collectData(period);

  // 如果完全没有数据，给出友好提示
  if (userData.includes('暂无习惯记录') &&
      userData.includes('暂无心情记录') &&
      userData.includes('暂无饮食记录') &&
      userData.includes('暂无便签')) {
    throw new Error('当前周期暂无数据，先记录一些内容再来生成总结吧~');
  }

  // 2. 构建 messages
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userData },
  ];

  // 3. 调用 API（多配置轮换）
  const content = await callChatAPI(configs, messages, signal);

  // 4. 解析内容
  const { highlights, suggestions, mood } = parseSummary(content);

  // 5. 构建记录
  const [startDate, endDate] = getDateRange(period);
  const dateLabel = period === 'daily' ? startDate : `${startDate}~${endDate}`;

  const record: SummaryRecord = {
    id: generateId(),
    period,
    date: dateLabel,
    content,
    highlights,
    suggestions,
    mood,
    createdAt: Date.now(),
  };

  // 6. 保存到 store
  addSummary(record);

  return record;
}

/**
 * 测试 API 连接（测试第一个启用的配置）
 */
export async function testConnection(
  configs?: AIConfigEntry[]
): Promise<{ success: boolean; message: string }> {
  const testConfigs = configs || useAIStore.getState().configs;
  const enabledConfigs = testConfigs.filter((c) => c.enabled && c.apiKey.trim());

  if (enabledConfigs.length === 0) {
    return { success: false, message: '请先添加并启用至少一个 AI 配置' };
  }

  const firstConfig = enabledConfigs[0];

  if (!firstConfig.apiEndpoint.trim()) {
    return { success: false, message: `「${firstConfig.name}」API 地址为空` };
  }
  if (!firstConfig.model.trim()) {
    return { success: false, message: `「${firstConfig.name}」模型名称为空` };
  }

  try {
    const content = await callSingleConfig(firstConfig, [
      {
        role: 'user',
        content: '请回复"连接成功"四个字。',
      },
    ]);

    if (content && content.length > 0) {
      return {
        success: true,
        message: `连接成功！AI 回复：${content.slice(0, 40)}`,
      };
    }
    return { success: false, message: 'AI 返回内容为空' };
  } catch (e) {
    const msg = (e as Error).message || '未知错误';
    return { success: false, message: `「${firstConfig.name}」${msg}` };
  }
}

/**
 * AI 分析食物营养成分
 * 用户输入食物名称和可选分量，AI返回热量、三大营养素和饮食建议
 */
export async function analyzeFood(
  foodName: string,
  portion?: number,
  signal?: AbortSignal
): Promise<{
  kcal: number;
  carbs: number;
  fat: number;
  protein: number;
  advice: string;
}> {
  const { configs, isConfigured } = useAIStore.getState();

  if (!isConfigured) {
    throw new Error('请先配置 AI 服务');
  }

  if (!foodName.trim()) {
    throw new Error('请先输入食物名称');
  }

  const portionText = portion && portion > 0 ? `${portion}g` : '按常见份量估算';

  const prompt = `你是营养分析助手。用户会告诉你食物名称和分量（可选），请分析其营养成分。

食物名称：${foodName.trim()}
分量：${portionText}

请返回JSON格式（不要其他文字，不要markdown代码块）：
{
  "kcal": 数字,
  "carbs": 碳水克数,
  "fat": 脂肪克数,
  "protein": 蛋白质克数,
  "advice": "一句简短的饮食建议"
}

热量 = 碳水×4 + 蛋白×4 + 脂肪×9`;

  const messages = [
    { role: 'user', content: prompt },
  ];

  const content = await callChatAPI(configs, messages, signal);

  // 解析 JSON（兼容 markdown 代码块包裹的情况）
  let jsonStr = content.trim();

  // 去除可能的 markdown 代码块包裹
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  // 尝试提取 JSON 对象
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('AI 返回格式异常，请重试');
  }

  const result = {
    kcal: Math.round(Number(parsed.kcal) || 0),
    carbs: Math.round(Number(parsed.carbs) || 0),
    fat: Math.round(Number(parsed.fat) || 0),
    protein: Math.round(Number(parsed.protein) || 0),
    advice: String(parsed.advice || '营养均衡最重要~'),
  };

  return result;
}

/**
 * 分享总结内容（Web 端用 navigator.share，否则复制到剪贴板）
 */
export async function shareSummary(record: SummaryRecord): Promise<string> {
  const text = `【玉桂狗 AI 总结 - ${record.date}】\n\n${record.content}`;

  // Web 端
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: '玉桂狗 AI 总结',
        text,
      });
      return '已分享';
    } catch {
      // 用户取消分享，降级到剪贴板
    }
  }

  // 复制到剪贴板
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return '已复制到剪贴板';
    }
  } catch {
    // ignore
  }

  return '分享完成';
}

// === AI 打卡助手 ===

export type CheckinAction = 'checkin' | 'uncheck' | 'add_habit' | 'query_status' | 'record_mood' | 'unknown';

export interface CheckinCommand {
  action: CheckinAction;
  habit_ids: string[];
  habit_name: string;
  mood: MoodType | '';
  date: string; // "today" | "yesterday" | "YYYY-MM-DD"
  reply: string;
}

const CHECKIN_SYSTEM_PROMPT = `你是打卡助手。用户会用自然语言描述他的行为或需求，请分析并返回操作指令。

当前用户的习惯列表（供你参考匹配）：
{habits_json}

请返回JSON格式（不要其他文字，不要markdown代码块）：
{
  "action": "checkin" | "uncheck" | "add_habit" | "query_status" | "record_mood" | "unknown",
  "habit_ids": ["id1", "id2"],
  "habit_name": "",
  "mood": "happy" | "calm" | "tired" | "sad" | "excited" | "angry" | "",
  "date": "today" | "yesterday" | "2026-09-24",
  "reply": "用户友好的回复文案"
}

匹配规则：
- 模糊匹配习惯名称，语义相近即可
- 可以同时匹配多个习惯
- 如果不确定是哪个习惯，选最接近的
- 如果用户只是问问题或查询状态，用query_status
- 如果用户说"心情很好/开心/难过"等情绪相关的，用record_mood，并从用户话语中提取情绪
- 如果用户说"添加新习惯XX"或"新增习惯XX"，用add_habit，habit_name填习惯名称
- 如果用户说"取消打卡"或"撤销打卡"，用uncheck
- 如果完全无法理解，用unknown，reply写"没听懂，换个说法？"
- date默认是today，只有用户明确提到"昨天"或具体日期才改`;

/**
 * 解析用户自然语言，返回打卡操作指令
 */
export async function parseCheckinCommand(
  userInput: string,
  habits: Habit[],
  signal?: AbortSignal
): Promise<CheckinCommand> {
  const { configs, isConfigured } = useAIStore.getState();

  if (!isConfigured) {
    throw new Error('请先配置 AI 服务');
  }

  const habitsJson = JSON.stringify(
    habits.filter((h) => !h.archived).map((h) => ({ id: h.id, name: h.title, category: h.category }))
  );

  const systemPrompt = CHECKIN_SYSTEM_PROMPT.replace('{habits_json}', habitsJson);

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userInput },
  ];

  const content = await callChatAPI(configs, messages as any, signal);

  // 解析 JSON（兼容 markdown 代码块包裹的情况）
  let jsonStr = content.trim();

  // 去除可能的 markdown 代码块包裹
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  // 尝试提取 JSON 对象
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return {
      action: 'unknown',
      habit_ids: [],
      habit_name: '',
      mood: '',
      date: 'today',
      reply: '没听懂，换个说法？',
    };
  }

  const validActions: CheckinAction[] = ['checkin', 'uncheck', 'add_habit', 'query_status', 'record_mood', 'unknown'];
  const action = validActions.includes(parsed.action) ? parsed.action : 'unknown';
  const habitIds = Array.isArray(parsed.habit_ids) ? parsed.habit_ids.filter((id: any) => typeof id === 'string') : [];

  const validMoods: MoodType[] = ['happy', 'calm', 'tired', 'sad', 'excited', 'angry'];
  const mood = validMoods.includes(parsed.mood) ? parsed.mood : '';

  return {
    action,
    habit_ids: habitIds,
    habit_name: String(parsed.habit_name || ''),
    mood,
    date: String(parsed.date || 'today'),
    reply: String(parsed.reply || '好的~'),
  };
}
