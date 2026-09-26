import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { CheckInCard } from '@/components/CheckInCard';
import { StreakBadge } from '@/components/StreakBadge';
import { EmptyState } from '@/components/EmptyState';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { Mascot } from '@/components/Mascot';
import { useAuthStore } from '@/stores/auth.store';
import { useCheckInStore } from '@/stores/checkin.store';
import { useStreak } from '@/hooks/useStreak';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { HABIT_ICONS, HABIT_CATEGORY_LABELS } from '@/utils/constants';
import { getTodayString, getRelativeLabel } from '@/utils/date';
import type { Habit, CheckInCategory, HabitMode } from '@/types';

export default function CheckInScreen() {
  const user = useAuthStore((s) => s.user);
  const habits = useCheckInStore((s) => s.habits.filter((h) => !h.archived));
  const checkIns = useCheckInStore((s) => s.checkIns);
  const { addHabit, toggleToday, loading, error } = useCheckInStore();
  const [showAddModal, setShowAddModal] = useState(false);

  const todayCheckIns = useMemo(() => {
    const today = getTodayString();
    return checkIns.filter((c) => c.date === today && c.completed);
  }, [checkIns]);

  // 按模式拆分：必做（计入必须完成进度）/ 记录（仅记录今天有没有干）
  const requiredHabits = useMemo(
    () => habits.filter((h) => h.mode !== 'record'),
    [habits]
  );
  const recordHabits = useMemo(
    () => habits.filter((h) => h.mode === 'record'),
    [habits]
  );
  const isDoneToday = (habitId: string) =>
    todayCheckIns.some((c) => c.habitId === habitId);

  const requiredTotal = requiredHabits.length;
  const requiredDone = requiredHabits.filter((h) => isDoneToday(h.id)).length;
  const requiredProgress = requiredTotal > 0 ? (requiredDone / requiredTotal) * 100 : 0;
  const allRequiredDone = requiredTotal > 0 && requiredDone >= requiredTotal;

  const recordTotal = recordHabits.length;
  const recordDone = recordHabits.filter((h) => isDoneToday(h.id)).length;
  const recordProgress = recordTotal > 0 ? (recordDone / recordTotal) * 100 : 0;

  return (
    <ScreenWrapper gradient="sunrise">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 头部 - 今日进度（必做 / 记录 拆分） */}
        <View style={styles.header}>
          <Mascot size={80} expression={allRequiredDone ? 'excited' : 'happy'} />
          <Text style={styles.dateText}>{getRelativeLabel(getTodayString())}</Text>

          {/* 必做进度 */}
          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <MaterialCommunityIcons name="check-decagram" size={18} color={colors.accentWarm} />
              <Text style={styles.progressLabel}>必做</Text>
              <Text style={styles.progressCount}>
                {requiredDone} / {requiredTotal}
              </Text>
              {allRequiredDone && <Text style={styles.celebrateText}>必做全部完成！</Text>}
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${requiredProgress}%`, backgroundColor: colors.accentMint },
                ]}
              />
            </View>
          </View>

          {/* 记录进度（仅记录今天有没有干） */}
          {recordTotal > 0 && (
            <View style={styles.progressBlock}>
              <View style={styles.progressRow}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={18} color={colors.accentLavender} />
                <Text style={[styles.progressLabel, { color: colors.accentLavender }]}>记录</Text>
                <Text style={[styles.progressCount, { color: colors.textSecondary }]}>
                  {recordDone} / {recordTotal}
                </Text>
                <Text style={styles.recordHint}>今天有没有干</Text>
              </View>
              <View style={[styles.progressBarContainer, { backgroundColor: colors.accentLavender + '25' }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${recordProgress}%`, backgroundColor: colors.accentLavender },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* 习惯列表 */}
        {habits.length === 0 ? (
          <EmptyState message="还没有打卡习惯" subMessage="点击右下角添加第一个习惯吧" />
        ) : (
          habits.map((habit) => (
            <CheckInCardWithStreak
              key={habit.id}
              habit={habit}
              isChecked={todayCheckIns.some((c) => c.habitId === habit.id && c.completed)}
              onToggle={() => toggleToday(habit.id, null, null)}
            />
          ))
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      {/* AI 打卡助手按钮 */}
      <TouchableOpacity
        style={styles.aiButton}
        onPress={() => router.push('/ai-checkin')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="robot-happy" size={22} color={colors.textOnPrimary} />
      </TouchableOpacity>

      {/* 添加习惯按钮 */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <MaterialCommunityIcons name="plus" size={28} color={colors.textOnPrimary} />
      </TouchableOpacity>

      {/* 添加习惯弹窗 */}
      <AddHabitModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addHabit}
        userColor={user?.avatarColor || colors.primary}
      />

      <LoadingOverlay visible={loading} message="玉桂狗正在记录..." />
    </ScreenWrapper>
  );
}

function CheckInCardWithStreak({
  habit,
  isChecked,
  onToggle,
}: {
  habit: Habit;
  isChecked: boolean;
  onToggle: () => void;
}) {
  const { streak } = useStreak(habit.id);
  return (
    <CheckInCard
      habit={habit}
      isChecked={isChecked}
      streak={streak?.currentStreak || 0}
      onToggle={onToggle}
    />
  );
}

// === 添加习惯弹窗 ===
function AddHabitModal({
  visible,
  onClose,
  onAdd,
  userColor,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (habit: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'archived'>) => Promise<void>;
  userColor: string;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CheckInCategory>('health');
  const [selectedIcon, setSelectedIcon] = useState('water');
  const [targetDays, setTargetDays] = useState(21);
  const [mode, setMode] = useState<HabitMode>('required');

  const handleAdd = async () => {
    if (!title.trim()) return;
    await onAdd({
      title: title.trim(),
      category,
      icon: selectedIcon,
      color: userColor,
      targetDays,
      mode,
      reminderTime: null,
    });
    setTitle('');
    setCategory('health');
    setSelectedIcon('water');
    setTargetDays(21);
    setMode('required');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>添加新习惯</Text>

          <TextInput
            style={styles.modalInput}
            placeholder="习惯名称 (如：喝水8杯)"
            placeholderTextColor={colors.textHint}
            value={title}
            onChangeText={setTitle}
          />

          {/* 类型选择：必做 / 记录 */}
          <Text style={styles.label}>类型</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[
                styles.modeChip,
                mode === 'required' && [styles.modeChipSelected, { borderColor: colors.accentWarm, backgroundColor: colors.accentWarm + '18' }],
              ]}
              onPress={() => setMode('required')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="check-decagram"
                size={18}
                color={mode === 'required' ? colors.accentWarm : colors.textSecondary}
              />
              <Text style={[styles.modeText, mode === 'required' && { color: colors.accentWarm, fontWeight: '700' }]}>
                必做
              </Text>
              <Text style={[styles.modeSub, mode === 'required' && { color: colors.accentWarm }]}>必须完成</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeChip,
                mode === 'record' && [styles.modeChipSelected, { borderColor: colors.accentLavender, backgroundColor: colors.accentLavender + '18' }],
              ]}
              onPress={() => setMode('record')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={18}
                color={mode === 'record' ? colors.accentLavender : colors.textSecondary}
              />
              <Text style={[styles.modeText, mode === 'record' && { color: colors.accentLavender, fontWeight: '700' }]}>
                记录
              </Text>
              <Text style={[styles.modeSub, mode === 'record' && { color: colors.accentLavender }]}>今天有没有干</Text>
            </TouchableOpacity>
          </View>

          {/* 分类选择 */}
          <Text style={styles.label}>分类</Text>
          <View style={styles.categoryRow}>
            {Object.entries(HABIT_CATEGORY_LABELS).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[styles.categoryChip, category === key && styles.categoryChipSelected]}
                onPress={() => {
                  setCategory(key as CheckInCategory);
                  setSelectedIcon(HABIT_ICONS[key][0]);
                }}
              >
                <Text style={[styles.categoryText, category === key && styles.categoryTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 图标选择 */}
          <Text style={styles.label}>图标</Text>
          <View style={styles.iconRow}>
            {HABIT_ICONS[category].map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[styles.iconOption, selectedIcon === icon && styles.iconOptionSelected]}
                onPress={() => setSelectedIcon(icon)}
              >
                <MaterialCommunityIcons
                  name={icon as any}
                  size={24}
                  color={selectedIcon === icon ? colors.textOnPrimary : colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* 目标天数 */}
          <Text style={styles.label}>目标天数: {targetDays}天</Text>
          <View style={styles.targetRow}>
            {[7, 21, 30, 66, 100].map((days) => (
              <TouchableOpacity
                key={days}
                style={[styles.targetChip, targetDays === days && styles.targetChipSelected]}
                onPress={() => setTargetDays(days)}
              >
                <Text style={[styles.targetText, targetDays === days && styles.targetTextSelected]}>
                  {days}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleAdd}>
              <Text style={styles.confirmText}>添加</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 100 },
  header: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.lg },
  dateText: { ...typography.h3, color: colors.textSecondary, marginTop: spacing.sm },
  // 进度块（必做 / 记录 拆分）
  progressBlock: { marginTop: spacing.md, marginBottom: spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  progressLabel: { ...typography.body1, color: colors.accentWarm, fontWeight: '700' },
  progressCount: { ...typography.h1, color: colors.textPrimary },
  recordHint: { ...typography.caption, color: colors.textHint, marginLeft: 'auto' },
  celebrateText: { ...typography.body2, color: colors.accentWarm, marginTop: spacing.xs, marginLeft: 'auto', fontWeight: '600' },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.surface + '80',
    borderRadius: 4,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accentMint,
    borderRadius: 4,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  aiButton: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.xl + 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentLavender,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.accentLavender,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  errorText: { ...typography.body2, color: colors.error, textAlign: 'center', marginTop: spacing.md },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: '85%',
  },
  modalTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.lg },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body1,
    marginBottom: spacing.lg,
    color: colors.textPrimary,
  },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.sm },
  // 类型选择（必做 / 记录）
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 2,
  },
  modeChipSelected: { borderWidth: 1.5 },
  modeText: { ...typography.body1, color: colors.textSecondary, fontWeight: '600' },
  modeSub: { ...typography.caption, color: colors.textHint, fontSize: 11 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surfaceVariant,
  },
  categoryChipSelected: { backgroundColor: colors.primary },
  categoryText: { ...typography.body2, color: colors.textSecondary },
  categoryTextSelected: { color: colors.textOnPrimary },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOptionSelected: { backgroundColor: colors.primary },
  targetRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  targetChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
  },
  targetChipSelected: { backgroundColor: colors.accentWarm },
  targetText: { ...typography.body2, color: colors.textSecondary },
  targetTextSelected: { color: colors.textOnPrimary, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: spacing.md },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  cancelText: { ...typography.buttonLabel, color: colors.textSecondary },
  confirmText: { ...typography.buttonLabel, color: colors.textOnPrimary },
});
