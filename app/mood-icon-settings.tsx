import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { getMoodInfo, getMoodIcon } from '@/components/MoodPicker';
import { useMoodStore } from '@/stores/mood.store';
import { useThemeStore } from '@/stores/theme.store';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import type { MoodType } from '@/types';

const MOOD_LIST: MoodType[] = ['happy', 'calm', 'tired', 'sad', 'excited', 'angry'];
const MAX_ICON_SIZE = 200;

export default function MoodIconSettingsScreen() {
  const customIcons = useMoodStore((s) => s.customIcons);
  const setCustomIcon = useMoodStore((s) => s.setCustomIcon);
  const resetCustomIcon = useMoodStore((s) => s.resetCustomIcon);
  const resetAllCustomIcons = useMoodStore((s) => s.resetAllCustomIcons);
  const currentTheme = useThemeStore((s) => s.currentTheme);

  const [uploadingMood, setUploadingMood] = useState<MoodType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadPress = (mood: MoodType) => {
    if (Platform.OS === 'web') {
      setUploadingMood(mood);
      fileInputRef.current?.click();
    } else {
      Alert.alert('提示', '图片上传功能在移动端使用 expo-image-picker 实现');
    }
  };

  /**
   * 使用 Canvas 压缩图片到最大 200x200px
   */
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // 计算压缩后的尺寸
          let { width, height } = img;
          if (width > MAX_ICON_SIZE || height > MAX_ICON_SIZE) {
            const ratio = Math.min(MAX_ICON_SIZE / width, MAX_ICON_SIZE / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // 用 Canvas 绘制并压缩
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas 不可用'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          // 转 base64，使用 JPEG 格式 0.85 质量
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingMood) return;

    try {
      const base64 = await compressImage(file);
      setCustomIcon(uploadingMood, base64);
    } catch (err) {
      Alert.alert('上传失败', '图片处理出错，请重试~');
    }

    setUploadingMood(null);
    // 重置 input，允许重复选择同一张图
    e.target.value = '';
  };

  const handleReset = (mood: MoodType) => {
    const info = getMoodInfo(mood);
    Alert.alert('重置图标', `确定要恢复"${info.label}"的默认图标吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '重置',
        style: 'destructive',
        onPress: () => resetCustomIcon(mood),
      },
    ]);
  };

  const handleResetAll = () => {
    Alert.alert('全部重置', '确定要恢复所有心情的默认图标吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '全部重置',
        style: 'destructive',
        onPress: () => resetAllCustomIcons(),
      },
    ]);
  };

  const hasAnyCustom = Object.values(customIcons).some((v) => v !== null);

  return (
    <ScreenWrapper gradient="sky" useThemeGradient safeArea={false}>
      {/* 隐藏的文件选择器（Web端） */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileChange as any}
        />
      )}

      {/* 顶部栏 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>心情图标</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 提示说明 */}
        <View style={styles.tipCard}>
          <MaterialCommunityIcons name="information-outline" size={18} color={colors.textHint} />
          <Text style={styles.tipText}>
            上传自定义图片替换默认的玉桂狗心情图标~{'\n'}
            建议选择正方形图片，效果更佳
          </Text>
        </View>

        {/* 心情图标列表 */}
        <View style={[styles.listCard, styles.cardShadow]}>
          {MOOD_LIST.map((mood, index) => {
            const info = getMoodInfo(mood);
            const isCustom = !!customIcons[mood];

            return (
              <View
                key={mood}
                style={[
                  styles.moodRow,
                  index > 0 && styles.moodRowBorder,
                ]}
              >
                {/* 左侧：当前图标 */}
                <View style={[styles.iconWrapper, { backgroundColor: info.color + '15' }]}>
                  {getMoodIcon(mood, info.color, 44, customIcons[mood])}
                </View>

                {/* 中间：心情名称 + 标签 */}
                <View style={styles.moodInfo}>
                  <Text style={styles.moodName}>{info.label}</Text>
                  <View style={[
                    styles.tag,
                    isCustom
                      ? { backgroundColor: currentTheme.primary + '15' }
                      : { backgroundColor: colors.surfaceVariant },
                  ]}>
                    <Text style={[
                      styles.tagText,
                      isCustom && { color: currentTheme.primary },
                    ]}>
                      {isCustom ? '自定义' : '默认'}
                    </Text>
                  </View>
                </View>

                {/* 右侧：按钮 */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.uploadBtn, { borderColor: currentTheme.primary }]}
                    onPress={() => handleUploadPress(mood)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="upload" size={16} color={currentTheme.primary} />
                    <Text style={[styles.uploadBtnText, { color: currentTheme.primary }]}>
                      上传
                    </Text>
                  </TouchableOpacity>

                  {isCustom && (
                    <TouchableOpacity
                      style={styles.resetBtn}
                      onPress={() => handleReset(mood)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="refresh" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* 底部全部重置按钮 */}
        <TouchableOpacity
          style={[
            styles.resetAllBtn,
            !hasAnyCustom && styles.resetAllBtnDisabled,
          ]}
          onPress={handleResetAll}
          disabled={!hasAnyCustom}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="refresh" size={18} color={hasAnyCustom ? colors.error : colors.textHint} />
          <Text style={[
            styles.resetAllText,
            !hasAnyCustom && { color: colors.textHint },
          ]}>
            全部重置
          </Text>
        </TouchableOpacity>

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
  content: {
    padding: spacing.lg,
  },
  cardShadow: {
    ...shadows.md,
  },

  // 提示卡片
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  tipText: {
    ...typography.caption,
    color: colors.textHint,
    flex: 1,
    lineHeight: 18,
  },

  // 列表卡片
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  moodRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodInfo: {
    flex: 1,
    gap: 4,
  },
  moodName: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
  },
  tagText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resetBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 全部重置按钮
  resetAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error + '12',
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.error + '30',
  },
  resetAllBtnDisabled: {
    backgroundColor: colors.surfaceVariant,
    borderColor: 'transparent',
  },
  resetAllText: {
    ...typography.body1,
    color: colors.error,
    fontWeight: '600',
  },

  bottomSpacer: {
    height: 40,
  },
});
