import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import { NOTE_TAG_LABELS } from '@/utils/constants';
import { getRelativeLabel } from '@/utils/date';
import type { Note } from '@/types';

interface NoteCardProps {
  note: Note;
  onPress: (note: Note) => void;
  onTogglePin: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export function NoteCard({ note, onPress, onTogglePin, onDelete }: NoteCardProps) {
  const bgColor = colors.noteColors[note.colorIndex] || colors.surface;
  const checklist = note.checklistItems || [];
  const doneCount = checklist.filter((i) => i.done).length;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgColor }]}
      onPress={() => onPress(note)}
      onLongPress={() => onTogglePin(note)}
      activeOpacity={0.8}
    >
      {note.pinned && (
        <View style={styles.pinBadge}>
          <MaterialCommunityIcons name="pin" size={14} color={colors.textOnPrimary} />
        </View>
      )}

      <Text style={styles.title} numberOfLines={1}>{note.title || '无标题'}</Text>

      {note.content ? (
        <Text style={styles.content} numberOfLines={4}>{note.content}</Text>
      ) : null}

      {checklist.length > 0 && (
        <View style={styles.checklistPreview}>
          {checklist.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.checklistItem}>
              <MaterialCommunityIcons
                name={item.done ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={16}
                color={colors.textPrimary}
              />
              <Text style={[styles.checklistText, item.done && styles.checklistDone]} numberOfLines={1}>
                {item.text}
              </Text>
            </View>
          ))}
          {checklist.length > 3 && (
            <Text style={styles.moreText}>还有{checklist.length - 3}项...</Text>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.tagChip}>
          <Text style={styles.tagText}>{NOTE_TAG_LABELS[note.tag]}</Text>
        </View>
        {checklist.length > 0 && (
          <Text style={styles.progressText}>{doneCount}/{checklist.length}</Text>
        )}
        <Text style={styles.dateText}>{getRelativeLabel(new Date(note.updatedAt).toISOString().split('T')[0])}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: 120,
    ...shadows.sm,
  },
  pinBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accentWarm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
  content: { ...typography.body2, color: colors.textSecondary, marginBottom: spacing.sm },
  checklistPreview: { gap: spacing.xs, marginBottom: spacing.sm },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  checklistText: { ...typography.caption, color: colors.textPrimary, flex: 1 },
  checklistDone: { textDecorationLine: 'line-through', color: colors.textHint },
  moreText: { ...typography.caption, color: colors.textHint, marginLeft: spacing.xl },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 'auto' },
  tagChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  tagText: { ...typography.caption, color: colors.textSecondary },
  progressText: { ...typography.caption, color: colors.textSecondary },
  dateText: { ...typography.caption, color: colors.textHint, marginLeft: 'auto' },
});
