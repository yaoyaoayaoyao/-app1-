import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import { getRelativeLabel } from '@/utils/date';
import type { JournalEntry } from '@/types';

interface JournalCardProps {
  journal: JournalEntry;
  onPress: (journal: JournalEntry) => void;
  onDelete?: (journal: JournalEntry) => void;
}

export function JournalCard({ journal, onPress, onDelete }: JournalCardProps) {
  const bgColor = colors.noteColors[journal.colorIndex] || colors.surface;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgColor }]}
      onPress={() => onPress(journal)}
      activeOpacity={0.85}
    >
      {/* 图片区域 */}
      {journal.imageUri ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: journal.imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
          {/* 贴纸预览 */}
          {journal.stickers.length > 0 && (
            <View style={styles.stickersPreview}>
              {journal.stickers.slice(0, 3).map((s) => (
                <Text key={s.id} style={styles.stickerPreviewEmoji}>{s.content}</Text>
              ))}
              {journal.stickers.length > 3 && (
                <Text style={styles.stickerMore}>+{journal.stickers.length - 3}</Text>
              )}
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: bgColor }]}>
          <Text style={styles.placeholderEmoji}>📔</Text>
        </View>
      )}

      {/* 内容区域 */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {journal.title || '无标题手账'}
        </Text>
        {journal.content ? (
          <Text style={styles.desc} numberOfLines={2}>{journal.content}</Text>
        ) : null}
      </View>

      {/* 日期标签 */}
      <View style={styles.dateBadge}>
        <Text style={styles.dateText}>{getRelativeLabel(journal.date)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: colors.surfaceVariant,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
    opacity: 0.5,
  },
  stickersPreview: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: '60%',
    justifyContent: 'flex-end',
  },
  stickerPreviewEmoji: {
    fontSize: 16,
    marginLeft: 2,
  },
  stickerMore: {
    fontSize: 10,
    color: colors.textOnPrimary,
    backgroundColor: colors.textSecondary + '80',
    borderRadius: 8,
    paddingHorizontal: 4,
    marginLeft: 2,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.sm,
  },
  title: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  desc: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dateBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.surface + 'E0',
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  dateText: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});
