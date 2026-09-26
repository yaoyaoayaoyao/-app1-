import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { useJournalStore } from '@/stores/journal.store';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import type { Sticker } from '@/types';
import { generateId } from '@/utils/id';
import { getTodayString } from '@/utils/date';

// 常用 emoji 贴纸
const EMOJI_STICKERS = [
  '🌸', '🌺', '🌻', '🌷', '🍀', '⭐', '🌟', '💫',
  '💖', '💕', '💗', '💝', '🎀', '🎈', '🎉', '🎊',
  '☁️', '🌈', '☀️', '🌙', '🦋', '🐰', '🐱', '🐶',
  '🍰', '🍓', '🍑', '🍦', '🎂', '🍩', '☕', '🍵',
  '📝', '💭', '💌', '🎵', '📷', '✨', '💎', '🌊',
];

// 手账背景色
const JOURNAL_COLORS = [
  '#FFF5BA', // 柠檬黄
  '#FFB5C5', // 樱花粉
  '#A8E6CF', // 薄荷绿
  '#B8E0F5', // 天空蓝
  '#C3B1E1', // 薰衣草紫
  '#FFD8A8', // 蜜桃橙
];

export default function JournalEditScreen() {
  const params = useLocalSearchParams<{ journalId?: string }>();
  const addEntry = useJournalStore((s) => s.addEntry);
  const editEntry = useJournalStore((s) => s.editEntry);
  const getEntry = useJournalStore((s) => s.getEntry);
  const removeEntry = useJournalStore((s) => s.removeEntry);

  const existing = params.journalId ? getEntry(params.journalId) : null;
  const isEditing = !!existing;

  const [title, setTitle] = useState(existing?.title || '');
  const [content, setContent] = useState(existing?.content || '');
  const [imageUri, setImageUri] = useState<string | null>(existing?.imageUri || null);
  const [stickers, setStickers] = useState<Sticker[]>(existing?.stickers || []);
  const [colorIndex, setColorIndex] = useState(existing?.colorIndex ?? 1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 选择图片（Web端）
  const handlePickImage = () => {
    if (Platform.OS === 'web') {
      // Web 端：触发隐藏的 file input
      fileInputRef.current?.click();
    } else {
      // 原生端：提示不支持（MVP简化）
      Alert.alert('提示', '当前平台暂不支持图片选择');
    }
  };

  // Web 端文件选择回调
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageUri(result);
    };
    reader.readAsDataURL(file);
    // 重置 input 以便可以重复选择同一张图
    e.target.value = '';
  };

  // 添加贴纸
  const handleAddSticker = (emoji: string) => {
    const newSticker: Sticker = {
      id: generateId(),
      type: 'emoji',
      content: emoji,
      x: 30 + Math.random() * 40, // 30%-70% 随机位置
      y: 30 + Math.random() * 40,
      scale: 1,
      rotation: 0,
    };
    setStickers([...stickers, newSticker]);
  };

  // 删除贴纸
  const handleRemoveSticker = (id: string) => {
    setStickers(stickers.filter((s) => s.id !== id));
  };

  // 保存手账
  const handleSave = () => {
    if (!title.trim() && !content.trim() && !imageUri) {
      Alert.alert('提示', '请至少添加标题、内容或照片中的一项~');
      return;
    }

    if (isEditing && existing) {
      editEntry(existing.id, {
        title: title.trim(),
        content: content.trim(),
        imageUri,
        stickers,
        colorIndex,
      });
    } else {
      addEntry({
        title: title.trim(),
        content: content.trim(),
        imageUri,
        stickers,
        colorIndex,
        date: getTodayString(),
      });
    }
    router.back();
  };

  // 删除手账
  const handleDelete = () => {
    if (!existing) return;
    Alert.alert('删除手账', '确定要删除这篇手账吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          removeEntry(existing.id);
          router.back();
        },
      },
    ]);
  };

  const bgColor = JOURNAL_COLORS[colorIndex];

  return (
    <ScreenWrapper gradient="mint" safeArea={false}>
      {/* 顶部栏 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{isEditing ? '编辑手账' : '新手账'}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 照片区域 */}
        <View style={[styles.photoSection, { backgroundColor: bgColor }]}>
          {imageUri ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="cover" />
              {/* 贴纸层 */}
              {stickers.map((sticker) => (
                <TouchableOpacity
                  key={sticker.id}
                  style={[
                    styles.stickerOnPhoto,
                    {
                      left: `${sticker.x}%`,
                      top: `${sticker.y}%`,
                      transform: [
                        { scale: sticker.scale },
                        { rotate: `${sticker.rotation}deg` },
                      ],
                    },
                  ]}
                  onPress={() => handleRemoveSticker(sticker.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stickerEmoji}>{sticker.content}</Text>
                </TouchableOpacity>
              ))}
              {/* 替换按钮 */}
              <TouchableOpacity
                style={styles.replacePhotoBtn}
                onPress={handlePickImage}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="image-edit" size={16} color={colors.textOnPrimary} />
                <Text style={styles.replacePhotoText}>替换</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.photoPlaceholder}
              onPress={handlePickImage}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="image-plus" size={48} color={colors.textSecondary} />
              <Text style={styles.photoPlaceholderText}>选择照片</Text>
              <Text style={styles.photoPlaceholderHint}>点击上传一张照片</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 隐藏的 file input（Web端） */}
        {Platform.OS === 'web' && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange as any}
          />
        )}

        {/* 文字输入区 */}
        <View style={[styles.textSection, styles.cardShadow]}>
          <TextInput
            style={styles.titleInput}
            placeholder="给手账起个标题..."
            placeholderTextColor={colors.textHint}
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />
          <View style={styles.divider} />
          <TextInput
            style={styles.contentInput}
            placeholder="记录今天的故事..."
            placeholderTextColor={colors.textHint}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
        </View>

        {/* 贴纸工具栏 */}
        <View style={[styles.stickerSection, styles.cardShadow]}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="sticker-emoji" size={20} color={colors.accentWarm} />
            <Text style={styles.sectionTitle}>贴纸</Text>
            {stickers.length > 0 && (
              <Text style={styles.stickerCount}>{stickers.length} 个</Text>
            )}
          </View>
          <Text style={styles.stickerHint}>点击添加贴纸，点击照片上的贴纸可删除</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stickerRow}
          >
            {EMOJI_STICKERS.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={styles.stickerChip}
                onPress={() => handleAddSticker(emoji)}
                activeOpacity={0.6}
              >
                <Text style={styles.stickerChipEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 背景色选择 */}
        <View style={[styles.colorSection, styles.cardShadow]}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="palette" size={20} color={colors.accentLavender} />
            <Text style={styles.sectionTitle}>背景色</Text>
          </View>
          <View style={styles.colorRow}>
            {JOURNAL_COLORS.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorDot,
                  { backgroundColor: color },
                  colorIndex === index && styles.colorDotActive,
                ]}
                onPress={() => setColorIndex(index)}
                activeOpacity={0.7}
              >
                {colorIndex === index && (
                  <MaterialCommunityIcons name="check" size={16} color={colors.textPrimary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 删除按钮（编辑模式） */}
        {isEditing && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="delete-outline" size={18} color={colors.error} />
            <Text style={styles.deleteText}>删除这篇手账</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  saveText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },

  scrollContent: {
    paddingBottom: spacing.xxl,
  },

  cardShadow: {
    ...shadows.md,
  },

  // 照片区域
  photoSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    minHeight: 200,
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  photoPlaceholderText: {
    ...typography.h3,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  photoPlaceholderHint: {
    ...typography.caption,
    color: colors.textHint,
  },
  replacePhotoBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  replacePhotoText: {
    fontSize: 12,
    color: colors.textOnPrimary,
    fontWeight: '500',
  },

  // 贴纸在照片上
  stickerOnPhoto: {
    position: 'absolute',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  stickerEmoji: {
    fontSize: 40,
  },

  // 文字输入区
  textSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  titleInput: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  contentInput: {
    ...typography.body1,
    color: colors.textPrimary,
    minHeight: 100,
    padding: 0,
    lineHeight: 22,
  },

  // 贴纸工具栏
  stickerSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  stickerCount: {
    ...typography.caption,
    color: colors.textHint,
  },
  stickerHint: {
    ...typography.caption,
    color: colors.textHint,
    marginBottom: spacing.sm,
  },
  stickerRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stickerChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  stickerChipEmoji: {
    fontSize: 24,
  },

  // 背景色选择
  colorSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },

  // 删除按钮
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.error + '10',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  deleteText: {
    ...typography.body1,
    color: colors.error,
    fontWeight: '500',
  },

  bottomSpacer: {
    height: 40,
  },
});
