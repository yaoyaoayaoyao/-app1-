import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { MoodCalendar } from '@/components/MoodCalendar';
import { MoodPicker, getMoodInfo, getMoodIcon } from '@/components/MoodPicker';
import { EmptyState } from '@/components/EmptyState';
import { useMoodStore } from '@/stores/mood.store';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import type { MoodType, MoodEntry } from '@/types';
import { getTodayString, getRelativeLabel } from '@/utils/date';

export default function MoodHistoryScreen() {
  const entries = useMoodStore((s) => s.entries);
  const addEntry = useMoodStore((s) => s.addEntry);
  const deleteEntry = useMoodStore((s) => s.deleteEntry);
  const customIcons = useMoodStore((s) => s.customIcons);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editMood, setEditMood] = useState<MoodType | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEditor, setShowEditor] = useState(false);

  const today = getTodayString();

  // 按日期倒序排列的日记列表
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.date.localeCompare(a.date));
  }, [entries]);

  // 本月统计
  const monthStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const stats: Record<MoodType, number> = {
      happy: 0, calm: 0, tired: 0, sad: 0, excited: 0, angry: 0,
    };
    let total = 0;
    entries.forEach((e) => {
      const [y, m] = e.date.split('-').map(Number);
      if (y === currentYear && m === currentMonth) {
        stats[e.mood]++;
        total++;
      }
    });
    return { stats, total };
  }, [entries]);

  const handleDayPress = (date: string, entry: MoodEntry | null) => {
    setSelectedDate(date);
    if (entry) {
      setEditMood(entry.mood);
      setEditContent(entry.content);
    } else {
      setEditMood(null);
      setEditContent('');
    }
    setShowEditor(true);
  };

  const handleSaveEntry = () => {
    if (!editMood || !selectedDate) return;
    addEntry(editMood, editContent, selectedDate);
    setShowEditor(false);
    setSelectedDate(null);
  };

  const handleDeleteEntry = () => {
    if (!selectedDate) return;
    const entry = entries.find((e) => e.date === selectedDate);
    if (!entry) return;

    Alert.alert('删除心情', '确定要删除这条心情记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          deleteEntry(entry.id);
          setShowEditor(false);
          setSelectedDate(null);
        },
      },
    ]);
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'M月d日 EEEE', { locale: zhCN });
  };

  return (
    <ScreenWrapper gradient="sky" safeArea={false}>
      {/* 顶部栏 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>心情日历</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 本月统计 */}
        <View style={[styles.statsCard, styles.cardShadow]}>
          <Text style={styles.statsTitle}>本月心情</Text>
          {monthStats.total === 0 ? (
            <Text style={styles.statsEmpty}>还没有记录哦~</Text>
          ) : (
            <View style={styles.statsContent}>
              {Object.entries(monthStats.stats).map(([mood, count]) => {
                const info = getMoodInfo(mood as MoodType);
                const percent = monthStats.total > 0 ? (count / monthStats.total) * 100 : 0;
                return (
                  <View key={mood} style={styles.statBarItem}>
                    <View style={styles.statBarLabelRow}>
                      <View style={[styles.statDot, { backgroundColor: info.color }]} />
                      <Text style={styles.statLabel}>{info.label}</Text>
                      <Text style={styles.statCount}>{count}天</Text>
                    </View>
                    <View style={styles.statBarTrack}>
                      <View
                        style={[
                          styles.statBarFill,
                          { width: `${percent}%`, backgroundColor: info.color },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 月历视图 */}
        <View style={[styles.calendarCard, styles.cardShadow]}>
          <MoodCalendar onDayPress={handleDayPress} />
        </View>

        {/* 心情日记列表 */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <MaterialCommunityIcons name="book-heart" size={20} color={colors.accentWarm} />
            <Text style={styles.listTitle}>心情日记</Text>
            <Text style={styles.listCount}>共 {entries.length} 条</Text>
          </View>

          {sortedEntries.length === 0 ? (
            <EmptyState message="还没有心情记录" subMessage="点击日历上的日期开始记录吧~" />
          ) : (
            <View style={styles.entryList}>
              {sortedEntries.map((entry) => {
                const moodInfo = getMoodInfo(entry.mood);
                return (
                  <TouchableOpacity
                    key={entry.id}
                    style={[styles.entryCard, styles.cardShadow]}
                    onPress={() => handleDayPress(entry.date, entry)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.entryLeft}>
                      {getMoodIcon(moodInfo.mood, moodInfo.color, 36, customIcons[moodInfo.mood])}
                    </View>
                    <View style={styles.entryContent}>
                      <View style={styles.entryHeaderRow}>
                        <Text style={styles.entryMoodLabel}>{moodInfo.label}</Text>
                        <Text style={styles.entryDate}>
                          {entry.date === today ? '今天' : getRelativeLabel(entry.date)}
                        </Text>
                      </View>
                      {entry.content ? (
                        <Text style={styles.entryText} numberOfLines={2}>
                          {entry.content}
                        </Text>
                      ) : (
                        <Text style={styles.entryTextEmpty}>没有文字记录</Text>
                      )}
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color={colors.textHint}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 编辑弹窗 */}
      {showEditor && selectedDate && (
        <View style={styles.editorOverlay}>
          <View style={styles.editorPanel}>
            <View style={styles.editorHeader}>
              <Text style={styles.editorDate}>{formatDateLabel(selectedDate)}</Text>
              <TouchableOpacity onPress={() => setShowEditor(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.editorLabel}>今天的心情是？</Text>
            <MoodPicker selectedMood={editMood} onSelect={setEditMood} size="small" />

            <Text style={styles.editorLabel}>想说点什么？</Text>
            <TextInput
              style={styles.editorInput}
              placeholder="记录一句话心情..."
              placeholderTextColor={colors.textHint}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              maxLength={100}
              textAlignVertical="top"
            />

            <View style={styles.editorActions}>
              {entries.find((e) => e.date === selectedDate) && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={handleDeleteEntry}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="delete-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.saveBtn, !editMood && styles.saveBtnDisabled]}
                onPress={handleSaveEntry}
                disabled={!editMood}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  topTitle: { ...typography.h3, color: colors.textPrimary, fontWeight: '600' },

  scrollContent: {
    paddingBottom: spacing.xxl,
  },

  // 统计卡片
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  statsTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  statsEmpty: {
    ...typography.body2,
    color: colors.textHint,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  statsContent: {
    gap: spacing.sm,
  },
  statBarItem: {
    gap: 4,
  },
  statBarLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    flex: 1,
  },
  statCount: {
    ...typography.caption,
    color: colors.textHint,
  },
  statBarTrack: {
    height: 6,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 3,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardShadow: {
    ...shadows.md,
  },

  // 日历卡片
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  // 日记列表
  listSection: {
    paddingHorizontal: spacing.lg,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  listTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  listCount: {
    ...typography.caption,
    color: colors.textHint,
  },
  entryList: {
    gap: spacing.sm,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  entryLeft: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  entryContent: {
    flex: 1,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryMoodLabel: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  entryDate: {
    ...typography.caption,
    color: colors.textHint,
    marginLeft: 'auto',
  },
  entryText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  entryTextEmpty: {
    ...typography.body2,
    color: colors.textHint,
    fontStyle: 'italic',
  },

  bottomSpacer: {
    height: 40,
  },

  // 编辑弹窗
  editorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  editorPanel: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  editorDate: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  editorLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  editorInput: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 80,
    ...typography.body1,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  editorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: colors.textHint,
  },
  saveBtnText: {
    ...typography.body1,
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
});
