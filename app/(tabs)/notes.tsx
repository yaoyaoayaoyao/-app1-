import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { NoteCard } from '@/components/NoteCard';
import { JournalCard } from '@/components/JournalCard';
import { EmptyState } from '@/components/EmptyState';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { JournalCalendar } from '@/components/JournalCalendar';
import { JournalSummary, PeriodSwitch } from '@/components/JournalSummary';
import { useNotesStore } from '@/stores/notes.store';
import { useJournalStore } from '@/stores/journal.store';
import { useFoodStore } from '@/stores/food.store';
import { useMoodStore } from '@/stores/mood.store';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { NOTE_TAG_LABELS } from '@/utils/constants';
import type { Note, NoteTag, JournalEntry } from '@/types';

type FilterType = NoteTag | 'all' | 'journal';
type TopTab = 'notes' | 'calendar';
type CalendarSubTab = 'calendar' | 'summary';

export default function NotesScreen() {
  const { notes, removeNote, toggleNotePin, loading, error } = useNotesStore();
  const { entries: journals } = useJournalStore();
  const { entries: foodEntries } = useFoodStore();
  const { entries: moodEntries } = useMoodStore();
  const [filterTag, setFilterTag] = useState<FilterType>('all');
  const [topTab, setTopTab] = useState<TopTab>('notes');
  const [calendarSubTab, setCalendarSubTab] = useState<CalendarSubTab>('calendar');
  const [summaryPeriod, setSummaryPeriod] = useState<'week' | 'month' | 'year'>('week');

  const showNotes = filterTag !== 'journal';
  const showJournals = filterTag === 'journal' || filterTag === 'all';

  const filteredNotes = showNotes
    ? filterTag === 'all'
      ? notes
      : notes.filter((n) => n.tag === filterTag)
    : [];

  const filteredJournals = showJournals ? journals : [];

  // 合并显示（仅在 all 模式下，手账和便签混合）
  const allItems = useCallback(() => {
    if (filterTag === 'journal') {
      return { notes: [], journals: filteredJournals };
    }
    if (filterTag === 'all') {
      return { notes: filteredNotes, journals: filteredJournals };
    }
    return { notes: filteredNotes, journals: [] };
  }, [filterTag, filteredNotes, filteredJournals]);

  const { notes: displayNotes, journals: displayJournals } = allItems();

  const handleOpenNote = useCallback((note: Note) => {
    router.push({ pathname: '/note-edit', params: { noteId: note.id } });
  }, []);

  const handleNewNote = useCallback(() => {
    router.push('/note-edit');
  }, []);

  const handleOpenJournal = useCallback((journal: JournalEntry) => {
    router.push({ pathname: '/journal-edit', params: { journalId: journal.id } });
  }, []);

  const handleNewJournal = useCallback(() => {
    router.push('/journal-edit');
  }, []);

  const handleAddRecordForDate = useCallback((_date: string) => {
    router.push('/journal-edit');
  }, []);

  const isEmpty = displayNotes.length === 0 && displayJournals.length === 0;

  const getEmptyMessage = () => {
    if (filterTag === 'journal') return '还没有手账';
    if (filterTag === 'all') return '还没有便签和手账';
    return '该分类下暂无便签';
  };

  return (
    <ScreenWrapper gradient="mint">
      {/* 顶部Tab：便签 / 手账 / 日历 */}
      <View style={styles.topTabBar}>
        <TopTabButton
          label="便签"
          active={topTab === 'notes'}
          onPress={() => setTopTab('notes')}
        />
        <TopTabButton
          label="手账"
          active={topTab === 'notes' && filterTag === 'journal'}
          onPress={() => {
            setTopTab('notes');
            setFilterTag('journal');
          }}
        />
        <TopTabButton
          label="日历"
          active={topTab === 'calendar'}
          onPress={() => setTopTab('calendar')}
          icon="calendar-month"
        />
      </View>

      {topTab === 'calendar' ? (
        <>
          {/* 日历Tab内二级切换：日历 / 总结 */}
          <View style={styles.subTabBar}>
            <SubTabButton
              label="日历"
              active={calendarSubTab === 'calendar'}
              onPress={() => setCalendarSubTab('calendar')}
            />
            <SubTabButton
              label="总结"
              active={calendarSubTab === 'summary'}
              onPress={() => setCalendarSubTab('summary')}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.calendarScroll}
          >
            {calendarSubTab === 'calendar' ? (
              <JournalCalendar
                notes={notes}
                journals={journals}
                foodEntries={foodEntries}
                moodEntries={moodEntries}
                onAddRecord={handleAddRecordForDate}
                onOpenJournal={handleOpenJournal}
                onOpenNote={handleOpenNote}
              />
            ) : (
              <>
                <PeriodSwitch
                  period={summaryPeriod}
                  onChange={setSummaryPeriod}
                />
                <JournalSummary
                  notes={notes}
                  journals={journals}
                  moodEntries={moodEntries}
                  foodEntries={foodEntries}
                />
              </>
            )}
          </ScrollView>
        </>
      ) : (
        <>
          {/* 分类筛选 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <FilterChip label="全部" active={filterTag === 'all'} onPress={() => setFilterTag('all')} />
            <FilterChip label="📔 手账" active={filterTag === 'journal'} onPress={() => setFilterTag('journal')} />
            {Object.entries(NOTE_TAG_LABELS).map(([key, label]) => (
              <FilterChip
                key={key}
                label={label}
                active={filterTag === key}
                onPress={() => setFilterTag(key as NoteTag)}
              />
            ))}
          </ScrollView>

          {isEmpty ? (
            <EmptyState message={getEmptyMessage()} subMessage="点击右下角新建一条" />
          ) : (
            <FlatList
              data={displayNotes}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                displayJournals.length > 0 ? (
                  <View style={styles.journalSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>手账</Text>
                      <TouchableOpacity onPress={() => setFilterTag('journal')}>
                        <Text style={styles.seeAll}>查看全部</Text>
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={displayJournals}
                      keyExtractor={(item) => item.id}
                      numColumns={2}
                      columnWrapperStyle={styles.row}
                      scrollEnabled={false}
                      renderItem={({ item }) => (
                        <JournalCard
                          journal={item}
                          onPress={handleOpenJournal}
                        />
                      )}
                    />
                    {filterTag === 'all' && displayNotes.length > 0 && (
                      <View style={styles.sectionDivider}>
                        <Text style={styles.sectionTitle}>便签</Text>
                      </View>
                    )}
                  </View>
                ) : null
              }
              renderItem={({ item }) => (
                <NoteCard
                  note={item}
                  onPress={handleOpenNote}
                  onTogglePin={(note) => toggleNotePin(note.id, note.pinned)}
                  onDelete={(note) => removeNote(note.id)}
                />
              )}
            />
          )}
        </>
      )}

      {/* 悬浮按钮 - 长按切换类型 */}
      {topTab === 'notes' && (
        <>
          <TouchableOpacity style={styles.fab} onPress={handleNewNote} onLongPress={handleNewJournal} activeOpacity={0.8}>
            <MaterialCommunityIcons name="plus" size={28} color={colors.textOnPrimary} />
          </TouchableOpacity>

          {/* 手账快捷入口（右下角小按钮） */}
          <TouchableOpacity
            style={styles.journalFab}
            onPress={handleNewJournal}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="book-heart" size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </>
      )}

      {/* 日历Tab下的添加按钮 */}
      {topTab === 'calendar' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleNewJournal}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={28} color={colors.textOnPrimary} />
        </TouchableOpacity>
      )}

      <LoadingOverlay visible={loading} message="玉桂狗正在写字..." />
    </ScreenWrapper>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function TopTabButton({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.topTab, active && styles.topTabActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon as any}
          size={18}
          color={active ? colors.primary : colors.textSecondary}
        />
      )}
      <Text style={[styles.topTabText, active && styles.topTabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SubTabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.subTab, active && styles.subTabActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.subTabText, active && styles.subTabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // 顶部Tab
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface + '60',
    borderRadius: borderRadius.pill,
    padding: 4,
    marginVertical: spacing.sm,
    gap: 4,
  },
  topTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  topTabActive: {
    backgroundColor: colors.surface,
    ...{
      shadowColor: colors.primaryDark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  },
  topTabText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  topTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // 二级Tab
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.pill,
    padding: 4,
    marginBottom: spacing.md,
    gap: 4,
  },
  subTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
  },
  subTabActive: {
    backgroundColor: colors.surface,
    ...{
      shadowColor: colors.primaryDark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  },
  subTabText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  subTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  calendarScroll: {
    paddingBottom: 100,
  },

  filterRow: { flexDirection: 'row', paddingVertical: spacing.md, gap: spacing.sm, paddingHorizontal: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { ...typography.body2, color: colors.textSecondary },
  filterTextActive: { color: colors.textOnPrimary, fontWeight: '600' },
  list: { paddingBottom: 100 },
  row: { gap: spacing.md, marginBottom: spacing.md },
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
  journalFab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl + 68,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentWarm,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.accentWarm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  journalSection: {
    marginBottom: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  seeAll: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  sectionDivider: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
});
