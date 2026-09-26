import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { useCheckInStore } from '@/stores/checkin.store';
import { useMoodStore } from '@/stores/mood.store';
import { useAIStore } from '@/stores/ai.store';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import { parseCheckinCommand, type CheckinCommand } from '@/services/ai.service';
import { getTodayString } from '@/utils/date';
import type { MoodType } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

const MOOD_LABELS: Record<MoodType, string> = {
  happy: '开心',
  calm: '平静',
  tired: '疲惫',
  sad: '难过',
  excited: '兴奋',
  angry: '生气',
};

export default function AICheckinScreen() {
  const habits = useCheckInStore((s) => s.habits);
  const { toggleToday, isHabitCheckedToday, addHabit, getTodayCheckIns } = useCheckInStore();
  const addMoodEntry = useMoodStore((s) => s.addEntry);
  const isConfigured = useAIStore((s) => s.isConfigured);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: '你好呀~ 我是你的AI打卡助手！你可以用自然语言告诉我你做了什么，我来帮你自动打卡。试试说"今天运动了"或者"我喝了牛奶"吧~',
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 执行打卡操作
  const executeCommand = async (cmd: CheckinCommand): Promise<string> => {
    const today = getTodayString();
    const results: string[] = [];

    switch (cmd.action) {
      case 'checkin': {
        if (cmd.habit_ids.length === 0) {
          return '没有找到匹配的习惯呢，要不要添加一个新习惯？';
        }
        for (const habitId of cmd.habit_ids) {
          const habit = habits.find((h) => h.id === habitId);
          if (!habit) continue;
          if (!isHabitCheckedToday(habitId)) {
            await toggleToday(habitId, null, null);
            results.push(`✅ 已为「${habit.title}」打卡`);
          } else {
            results.push(`「${habit.title}」今天已经打卡过啦`);
          }
        }
        return results.length > 0 ? results.join('\n') : '没有找到匹配的习惯';
      }

      case 'uncheck': {
        if (cmd.habit_ids.length === 0) {
          return '没有找到匹配的习惯呢';
        }
        for (const habitId of cmd.habit_ids) {
          const habit = habits.find((h) => h.id === habitId);
          if (!habit) continue;
          if (isHabitCheckedToday(habitId)) {
            await toggleToday(habitId, null, null);
            results.push(`↩️ 已取消「${habit.title}」的打卡`);
          } else {
            results.push(`「${habit.title}」今天还没打卡哦`);
          }
        }
        return results.length > 0 ? results.join('\n') : '没有找到匹配的习惯';
      }

      case 'add_habit': {
        const habitName = cmd.habit_name.trim();
        if (!habitName) {
          return '习惯名称不能为空呢';
        }
        await addHabit({
          title: habitName,
          category: 'custom',
          icon: 'star-four-points',
          color: colors.accentLavender,
          targetDays: 21,
          reminderTime: null,
        });
        return `✨ 已添加新习惯「${habitName}」，加油哦~`;
      }

      case 'query_status': {
        // 返回今日完成情况
        const todayCheckIns = getTodayCheckIns();
        const activeHabits = habits.filter((h) => !h.archived);
        const completedCount = todayCheckIns.length;
        const totalCount = activeHabits.length;

        if (totalCount === 0) {
          return '你还没有添加任何习惯呢，点击右下角 + 添加第一个习惯吧~';
        }

        const habitStatus = activeHabits
          .map((h) => {
            const done = todayCheckIns.some((c) => c.habitId === h.id);
            return `${done ? '✅' : '⬜'} ${h.title}`;
          })
          .join('\n');

        return `📊 今日打卡进度：${completedCount} / ${totalCount}\n\n${habitStatus}`;
      }

      case 'record_mood': {
        if (!cmd.mood) {
          return '我没听清你的心情呢，再说一次吧~';
        }
        addMoodEntry(cmd.mood, '', today);
        const moodLabel = MOOD_LABELS[cmd.mood] || cmd.mood;
        return `🌈 已记录今日心情：${moodLabel}\n${cmd.reply}`;
      }

      case 'unknown':
      default:
        return cmd.reply || '没听懂，换个说法？';
    }
  };

  // 发送消息
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    // 添加用户消息
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      if (!isConfigured) {
        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'ai',
          content: '请先在设置中配置 AI 服务才能使用打卡助手哦~',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsLoading(false);
        return;
      }

      // 调用 AI 解析
      const cmd = await parseCheckinCommand(text, habits);

      // 执行操作
      const resultText = await executeCommand(cmd);

      // 添加 AI 回复
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'ai',
        content: resultText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '出错了，请稍后重试';
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'ai',
        content: `哎呀，出了点小问题：${errorMsg}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper gradient="lavender">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* 顶部导航栏 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <MaterialCommunityIcons name="robot-happy" size={22} color={colors.accentLavender} />
            <Text style={styles.headerTitle}>AI打卡助手</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* 聊天消息列表 */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                msg.role === 'user' ? styles.messageRowRight : styles.messageRowLeft,
              ]}
            >
              {msg.role === 'ai' && (
                <View style={styles.aiAvatar}>
                  <MaterialCommunityIcons name="robot-happy" size={20} color={colors.textOnPrimary} />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.role === 'user' ? styles.userText : styles.aiText,
                  ]}
                >
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}

          {/* Loading 状态 */}
          {isLoading && (
            <View style={[styles.messageRow, styles.messageRowLeft]}>
              <View style={styles.aiAvatar}>
                <MaterialCommunityIcons name="robot-happy" size={20} color={colors.textOnPrimary} />
              </View>
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <View style={styles.loadingDots}>
                  <View style={[styles.dot, styles.dot1]} />
                  <View style={[styles.dot, styles.dot2]} />
                  <View style={[styles.dot, styles.dot3]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* 底部输入框 */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="说点什么，比如'今天运动了'"
            placeholderTextColor={colors.textHint}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={200}
            editable={!isLoading}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="send" size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '85%',
    gap: spacing.sm,
  },
  messageRowLeft: {
    alignSelf: 'flex-start',
  },
  messageRowRight: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentLavender,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  messageBubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  userBubble: {
    backgroundColor: colors.accentLavender,
    borderBottomRightRadius: borderRadius.sm,
  },
  aiBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: borderRadius.sm,
  },
  messageText: {
    ...typography.body1,
    lineHeight: 22,
  },
  userText: {
    color: colors.textOnPrimary,
  },
  aiText: {
    color: colors.textPrimary,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textHint,
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.pill,
    ...typography.body1,
    color: colors.textPrimary,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentLavender,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
