import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import { NOTE_TAG_LABELS } from '@/utils/constants';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Note, JournalEntry, MoodEntry, FoodEntry, MoodType } from '@/types';
import type { DayDetailData } from '@/services/journal-summary.service';
import { getMoodInfo } from './MoodPicker';

/** 心情对应的 emoji */
const MOOD_EMOJI: Record<MoodType, string> = {
  happy: '😊',
  calm: '😌',
  tired: '😴',
  sad: '😢',
  excited: '🤩',
  angry: '😠',
};

const SCREEN_WIDTH = Dimensions.get('window').width;

interface DayDetailSheetProps {
  visible: boolean;
  detail: DayDetailData | null;
  onClose: () => void;
  onAddRecord?: (date: string) => void;
  onOpenJournal?: (journal: JournalEntry) => void;
  onOpenNote?: (note: Note) => void;
}

/** 便签分类色 */
function getNoteTagColor(tag: Note['tag']): string {
  const map: Record<string, string> = {
    todo: colors.accentLemon,
    idea: colors.accentWarm,
    diary: colors.accentMint,
    reminder: colors.accentLavender,
    plain: colors.primaryLight,
  };
  return map[tag] || colors.primaryLight;
}

export function DayDetailSheet({
  visible,
  detail,
  onClose,
  onAddRecord,
  onOpenJournal,
  onOpenNote,
}: DayDetailSheetProps) {
  if (!detail) return null;

  const dateLabel = format(parseISO(detail.date), 'M月d日 EEEE', { locale: zhCN });
  const isEmpty =
    detail.journals.length === 0 &&
    detail.notes.length === 0 &&
    detail.foodEntries.length === 0 &&
    !detail.mood;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* 拖拽条 */}
          <View style={styles.handleBar} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 关闭按钮 */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            {/* 标题 */}
            <View style={styles.titleSection}>
              <Text style={styles.dateLabel}>{dateLabel}</Text>
              <Text style={styles.warmTitle}>翻开这一天</Text>
            </View>

            {/* 心情 */}
            {detail.mood && (
              <View style={styles.moodCard}>
                {(() => {
                  const info = getMoodInfo(detail.mood.mood);
                  return (
                    <View style={styles.moodRow}>
                      <View style={[styles.moodDot, { backgroundColor: info.color }]} />
                      <Text style={styles.moodEmoji}>{MOOD_EMOJI[detail.mood.mood] || '☁️'}</Text>
                      <Text style={styles.moodLabel}>{info.label}</Text>
                    </View>
                  );
                })()}
                {detail.mood.content ? (
                  <Text style={styles.moodContent}>{detail.mood.content}</Text>
                ) : null}
              </View>
            )}

            {/* 手账列表 */}
            {detail.journals.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📔 手账 ({detail.journals.length})</Text>
                {detail.journals.map((journal) => (
                  <TouchableOpacity
                    key={journal.id}
                    style={[styles.recordCard, { backgroundColor: colors.noteColors[journal.colorIndex] || colors.surface }]}
                    onPress={() => onOpenJournal?.(journal)}
                    activeOpacity={0.8}
                  >
                    {journal.imageUri && (
                      <Image source={{ uri: journal.imageUri }} style={styles.recordImage} resizeMode="cover" />
                    )}
                    <View style={styles.recordContent}>
                      <Text style={styles.recordTitle} numberOfLines={1}>
                        {journal.title || '无标题手账'}
                      </Text>
                      {journal.content ? (
                        <Text style={styles.recordText} numberOfLines={3}>{journal.content}</Text>
                      ) : null}
                      {journal.stickers.length > 0 && (
                        <Text style={styles.stickerPreview}>
                          {journal.stickers.slice(0, 5).map((s) => s.content).join(' ')}
                        </Text>
                      )}
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textHint} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 便签列表 */}
            {detail.notes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📝 便签 ({detail.notes.length})</Text>
                {detail.notes.map((note) => (
                  <TouchableOpacity
                    key={note.id}
                    style={[styles.recordCard, { backgroundColor: colors.noteColors[note.colorIndex] || colors.surface }]}
                    onPress={() => onOpenNote?.(note)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.noteHeader}>
                      <View style={[styles.tagChip, { backgroundColor: getNoteTagColor(note.tag) + '60' }]}>
                        <Text style={styles.tagText}>{NOTE_TAG_LABELS[note.tag] || '便签'}</Text>
                      </View>
                      {note.pinned && (
                        <MaterialCommunityIcons name="pin" size={14} color={colors.warning} />
                      )}
                    </View>
                    <View style={styles.recordContent}>
                      <Text style={styles.recordTitle} numberOfLines={1}>
                        {note.title || '无标题'}
                      </Text>
                      {note.content ? (
                        <Text style={styles.recordText} numberOfLines={3}>{note.content}</Text>
                      ) : null}
                      {note.checklistItems && note.checklistItems.length > 0 && (
                        <Text style={styles.checklistPreview}>
                          {note.checklistItems.filter((i) => i.done).length}/{note.checklistItems.length} 项完成
                        </Text>
                      )}
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textHint} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 饮食记录 */}
            {detail.foodEntries.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🍽 饮食 ({detail.foodEntries.length})</Text>
                {detail.foodEntries.map((food) => (
                  <View key={food.id} style={styles.recordCard}>
                    {food.image ? (
                      <Image source={{ uri: food.image }} style={styles.recordImage} resizeMode="cover" />
                    ) : null}
                    <View style={styles.recordContent}>
                      <Text style={styles.recordTitle} numberOfLines={1}>{food.name}</Text>
                      <Text style={styles.mealLabel}>
                        {food.meal === 'breakfast' ? '🌅 早餐' : food.meal === 'lunch' ? '☀️ 午餐' : food.meal === 'dinner' ? '🌙 晚餐' : '🍪 加餐'}
                        {food.kcal ? ` · ${food.kcal}kcal` : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 空状态 */}
            {isEmpty && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>☁️</Text>
                <Text style={styles.emptyText}>这一天还没有记录</Text>
                <Text style={styles.emptySubText}>点击下方添加，留住美好瞬间</Text>
              </View>
            )}

            {/* 添加记录按钮 */}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => onAddRecord?.(detail.date)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={22} color={colors.textOnPrimary} />
              <Text style={styles.addBtnText}>添加记录</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '88%',
    ...shadows.lg,
  },
  handleBar: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  // 标题区
  titleSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  dateLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  warmTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    fontWeight: '700',
  },

  // 心情
  moodCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  moodDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabel: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  moodContent: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // 分区
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },

  // 记录卡片
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  recordImage: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  recordContent: {
    flex: 1,
  },
  recordTitle: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  recordText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stickerPreview: {
    fontSize: 14,
    marginTop: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  tagChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
  },
  tagText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  checklistPreview: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  mealLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // 空状态
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptySubText: {
    ...typography.caption,
    color: colors.textHint,
    marginTop: spacing.xs,
  },

  // 添加按钮
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  addBtnText: {
    ...typography.buttonLabel,
    color: colors.textOnPrimary,
  },

  bottomSpacer: {
    height: 20,
  },
});
