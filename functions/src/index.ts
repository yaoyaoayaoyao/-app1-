import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions/v2';

const AI_API_KEY = defineSecret('AI_API_KEY');

interface SummaryInput {
  period: string;
  startDate: string;
  endDate: string;
  checkIns: any[];
  notes: any[];
  habits: any[];
  partnerData: { checkIns: any[]; notes: any[]; habits: any[] } | null;
  userName: string;
  partnerName: string | null;
}

interface SummaryOutput {
  content: string;
  highlights: string[];
  mood: string;
  suggestions: string[];
  partnerSummary: string | null;
}

/**
 * AI总结 Cloud Function
 * 通过 httpsCallable 调用，使用 Secrets 管理 API Key
 */
export const generateAISummary = onCall(
  { secrets: [AI_API_KEY], timeoutSeconds: 60 },
  async (request): Promise<SummaryOutput> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '需要登录');
    }

    const data = request.data as SummaryInput;
    const apiKey = AI_API_KEY.value();

    if (!apiKey) {
      throw new HttpsError('internal', 'AI API Key 未配置');
    }

    // 构建周期标签
    const periodLabelMap: Record<string, string> = {
      daily: '今日',
      weekly: '本周',
      monthly: '本月',
    };
    const periodLabel = periodLabelMap[data.period] || '本期';

    // 构建统计文本
    const myStats = buildStatsText(data.checkIns, data.notes, data.habits, data.userName || '你');
    const partnerStats = data.partnerData
      ? buildStatsText(
          data.partnerData.checkIns,
          data.partnerData.notes,
          data.partnerData.habits,
          data.partnerName || '搭档',
        )
      : '';

    // 系统 Prompt：玉桂狗小助手，温柔可爱的语气
    const systemPrompt = `你是玉桂狗小助手，一个温柔可爱的AI总结助手。请用温暖、鼓励的语气为用户生成${periodLabel}总结。
要求：
1. 总结打卡情况和习惯养成进度
2. 分析便签内容的主要主题和情绪
3. 给出3-5个关键亮点(highlights数组)
4. 分析整体情绪(mood)
5. 给出2-3条具体建议(suggestions数组)
6. 如果有搭档数据，在partnerSummary字段生成对比和鼓励文字
7. content字段用Markdown格式，包含表情符号
8. 语气要像玉桂狗一样温柔可爱

返回JSON格式：
{
  "content": "markdown总结正文",
  "highlights": ["亮点1", "亮点2", ...],
  "mood": "情绪关键词",
  "suggestions": ["建议1", "建议2", ...],
  "partnerSummary": "搭档对比总结（如有）"
}`;

    // 用户 Prompt：包含用户和搭档的统计数据
    const userPrompt = `${myStats}\n${partnerStats}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('AI API error response', { status: response.status, errorText });
        throw new Error(`AI API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0].message.content;
      const parsed = JSON.parse(content) as SummaryOutput;

      logger.info('AI summary generated successfully', {
        period: data.period,
        highlightsCount: parsed.highlights?.length || 0,
        hasPartner: !!data.partnerData,
      });

      return parsed;
    } catch (error) {
      logger.error('AI summary generation failed', { error: String(error) });
      throw new HttpsError('internal', 'AI总结生成失败', error as any);
    }
  },
);

/**
 * 构建统计文本辅助函数
 * 将打卡、便签、习惯数据转换为可读的文本格式
 */
function buildStatsText(
  checkIns: any[],
  notes: any[],
  habits: any[],
  name: string,
): string {
  const totalHabits = habits.length;
  const completedCheckIns = checkIns.filter((c) => c.completed);
  const completionRate =
    totalHabits > 0 ? Math.round((completedCheckIns.length / totalHabits) * 100) : 0;

  const checkInByHabit: Record<string, number> = {};
  completedCheckIns.forEach((c) => {
    checkInByHabit[c.habitId] = (checkInByHabit[c.habitId] || 0) + 1;
  });

  const habitDetails = habits
    .map((h) => {
      const count = checkInByHabit[h.id] || 0;
      return `- ${h.title} (${h.category}): 完成${count}次`;
    })
    .join('\n');

  const noteDetails = notes
    .map((n) => `- [${n.tag}] ${n.title}: ${(n.content || '').substring(0, 100)}`)
    .join('\n');

  const moods = completedCheckIns.map((c) => c.mood).filter(Boolean);

  return `${name}的数据 (${checkIns.length > 0 ? '有活动' : '无活动'}):
习惯总数: ${totalHabits}
完成打卡: ${completedCheckIns.length}次
完成率: ${completionRate}%
习惯明细:
${habitDetails || '无'}
便签数: ${notes.length}
便签内容:
${noteDetails || '无'}
情绪记录: ${moods.join(', ') || '无'}`;
}
