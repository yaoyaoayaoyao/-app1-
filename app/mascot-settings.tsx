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
import { Mascot } from '@/components/Mascot';
import { useMascotStore } from '@/stores/mascot.store';
import { useThemeStore } from '@/stores/theme.store';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import type { MascotExpression, MascotType, HeadShape, BodyShape, EarShape, PartSize } from '@/types';

const expressionOptions: { expression: MascotExpression; label: string; icon: string }[] = [
  { expression: 'happy', label: '开心', icon: 'emoticon-happy' },
  { expression: 'sleepy', label: '困困', icon: 'sleep' },
  { expression: 'excited', label: '兴奋', icon: 'star' },
  { expression: 'sad', label: '难过', icon: 'emoticon-sad' },
  { expression: 'shy', label: '害羞', icon: 'flower' },
  { expression: 'angry', label: '生气', icon: 'emoticon-angry' },
  { expression: 'love', label: '爱心', icon: 'heart' },
];

const bodyColorPresets = [
  '#FFFFFF', // 白色（默认）
  '#FFF5E6', // 奶油白
  '#FFE4E1', // 蜜桃粉
  '#E8F5E9', // 薄荷绿
  '#E3F2FD', // 天空蓝
  '#F3E5F5', // 薰衣草紫
  '#FFFDE7', // 柠檬黄
  '#FFCCBC', // 珊瑚橙
];

const cheekColorPresets = [
  '#FFB5C5', // 樱花粉（默认）
  '#FF8A80', // 珊瑚红
  '#FFD180', // 蜜桃橙
  '#B9F6CA', // 薄荷绿
  '#82B1FF', // 天空蓝
  '#EA80FC', // 梦幻紫
  '#FFFF8D', // 柠檬黄
  '#F8BBD0', // 浅粉
];

const earColorPresets = [
  '#F0F7FC', // 淡蓝（默认）
  '#FFF0F5', // 淡粉
  '#F0FFF4', // 淡绿
  '#F5F0FF', // 淡紫
  '#FFF9E6', // 淡黄
  '#FFE8E0', // 淡橙
  '#E6F7FF', // 淡青
  '#FFFFFF', // 纯白
];

const headShapeOptions: { value: HeadShape; label: string }[] = [
  { value: 'round', label: '圆脸' },
  { value: 'square', label: '方脸' },
  { value: 'oval', label: '椭圆脸' },
];
const bodyShapeOptions: { value: BodyShape; label: string }[] = [
  { value: 'round', label: '圆润' },
  { value: 'plump', label: '丰满' },
  { value: 'slim', label: '苗条' },
];
const earShapeOptions: { value: EarShape; label: string }[] = [
  { value: 'long', label: '长耳朵' },
  { value: 'round', label: '圆耳朵' },
  { value: 'short', label: '短耳朵' },
];
const sizeOptions: { value: PartSize; label: string }[] = [
  { value: 'small', label: '小' },
  { value: 'medium', label: '中' },
  { value: 'large', label: '大' },
];

export default function MascotSettingsScreen() {
  const mascotConfig = useMascotStore((s) => s.mascotConfig);
  const setMascotConfig = useMascotStore((s) => s.setMascotConfig);
  const setCustomImage = useMascotStore((s) => s.setCustomImage);
  const resetMascot = useMascotStore((s) => s.resetMascot);
  const currentTheme = useThemeStore((s) => s.currentTheme);

  const [mode, setMode] = useState<MascotType>(mascotConfig.type);
  const [tempExpression, setTempExpression] = useState<MascotExpression>(mascotConfig.expression);
  const [tempBodyColor, setTempBodyColor] = useState(mascotConfig.bodyColor);
  const [tempCheekColor, setTempCheekColor] = useState(mascotConfig.cheekColor);
  const [tempEarColor, setTempEarColor] = useState(mascotConfig.earColor);
  const [tempHeadShape, setTempHeadShape] = useState<HeadShape>(mascotConfig.headShape);
  const [tempHeadSize, setTempHeadSize] = useState<PartSize>(mascotConfig.headSize);
  const [tempBodyShape, setTempBodyShape] = useState<BodyShape>(mascotConfig.bodyShape);
  const [tempBodySize, setTempBodySize] = useState<PartSize>(mascotConfig.bodySize);
  const [tempEarShape, setTempEarShape] = useState<EarShape>(mascotConfig.earShape);
  const [tempEarSize, setTempEarSize] = useState<PartSize>(mascotConfig.earSize);
  const [tempImageUri, setTempImageUri] = useState<string | null>(mascotConfig.customImageUri);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePickImage = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
      Alert.alert('提示', '图片上传功能在移动端使用 expo-image-picker 实现');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setTempImageUri(result);
    };
    reader.readAsDataURL(file);

    // 重置 input，允许重复选择同一张图
    e.target.value = '';
  };

  const handleSave = () => {
    if (mode === 'cinnamoroll') {
      setMascotConfig({
        type: 'cinnamoroll',
        expression: tempExpression,
        bodyColor: tempBodyColor,
        cheekColor: tempCheekColor,
        earColor: tempEarColor,
        headShape: tempHeadShape,
        headSize: tempHeadSize,
        bodyShape: tempBodyShape,
        bodySize: tempBodySize,
        earShape: tempEarShape,
        earSize: tempEarSize,
        customImageUri: null,
      });
    } else {
      if (!tempImageUri) {
        Alert.alert('提示', '请先选择一张图片哦~');
        return;
      }
      setCustomImage(tempImageUri);
    }
    Alert.alert('保存成功', '形象已更新！', [
      { text: '好的', onPress: () => router.back() },
    ]);
  };

  const handleReset = () => {
    Alert.alert('重置形象', '确定要恢复默认的玉桂狗形象吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '重置',
        style: 'destructive',
        onPress: () => {
          resetMascot();
          setMode('cinnamoroll');
          setTempExpression('happy');
          setTempBodyColor('#FFFFFF');
          setTempCheekColor('#FFB5C5');
          setTempEarColor('#F0F7FC');
          setTempHeadShape('round');
          setTempHeadSize('medium');
          setTempBodyShape('round');
          setTempBodySize('medium');
          setTempEarShape('long');
          setTempEarSize('medium');
          setTempImageUri(null);
        },
      },
    ]);
  };

  return (
    <ScreenWrapper gradient="sky" useThemeGradient safeArea={false}>
      {/* 隐藏的文件选择器（Web端） */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange as any}
        />
      )}

      {/* 顶部栏 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>形象设置</Text>
        <TouchableOpacity onPress={handleReset}>
          <MaterialCommunityIcons name="refresh" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* === 实时预览 === */}
        <View style={[styles.previewCard, styles.cardShadow]}>
          <Text style={styles.previewTitle}>预览</Text>
          <View style={styles.previewMascot}>
            {mode === 'cinnamoroll' ? (
              <Mascot
                size={140}
                expression={tempExpression}
                headShape={tempHeadShape}
                headSize={tempHeadSize}
                bodyShape={tempBodyShape}
                bodySize={tempBodySize}
                earShape={tempEarShape}
                earSize={tempEarSize}
              />
            ) : (
              <View
                style={[
                  styles.uploadPreview,
                  tempImageUri ? {} : styles.uploadPreviewEmpty,
                ]}
              >
                {tempImageUri ? (
                  <Mascot
                    size={140}
                    headShape={tempHeadShape}
                    headSize={tempHeadSize}
                    bodyShape={tempBodyShape}
                    bodySize={tempBodySize}
                    earShape={tempEarShape}
                    earSize={tempEarSize}
                  />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <MaterialCommunityIcons
                      name="image-plus"
                      size={48}
                      color={colors.textHint}
                    />
                    <Text style={styles.uploadPlaceholderText}>选择图片后预览</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* === 模式切换 === */}
        <View style={[styles.modeSwitch, styles.cardShadow]}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'cinnamoroll' && [styles.modeButtonActive, { backgroundColor: currentTheme.primary }],
            ]}
            onPress={() => setMode('cinnamoroll')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="dog"
              size={20}
              color={mode === 'cinnamoroll' ? colors.textOnPrimary : colors.textSecondary}
            />
            <Text
              style={[
                styles.modeButtonText,
                mode === 'cinnamoroll' && styles.modeButtonTextActive,
              ]}
            >
              玉桂狗
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'upload' && [styles.modeButtonActive, { backgroundColor: currentTheme.primary }],
            ]}
            onPress={() => setMode('upload')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="image-plus"
              size={20}
              color={mode === 'upload' ? colors.textOnPrimary : colors.textSecondary}
            />
            <Text
              style={[
                styles.modeButtonText,
                mode === 'upload' && styles.modeButtonTextActive,
              ]}
            >
              上传图片
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'cinnamoroll' ? (
          <>
            {/* === 表情选择 === */}
            <View style={[styles.sectionCard, styles.cardShadow]}>
              <Text style={styles.sectionTitle}>表情</Text>
              <View style={styles.expressionGrid}>
                {expressionOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.expression}
                    style={[
                      styles.expressionItem,
                      tempExpression === opt.expression && [
                        styles.expressionItemActive,
                        { borderColor: currentTheme.primary, backgroundColor: currentTheme.primary + '15' },
                      ],
                    ]}
                    onPress={() => setTempExpression(opt.expression)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={opt.icon as any}
                      size={28}
                      color={tempExpression === opt.expression ? currentTheme.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.expressionLabel,
                        tempExpression === opt.expression && { color: currentTheme.primary, fontWeight: '600' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* === 身体颜色 === */}
            <View style={[styles.sectionCard, styles.cardShadow]}>
              <Text style={styles.sectionTitle}>身体颜色</Text>
              <View style={styles.colorGrid}>
                {bodyColorPresets.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                      tempBodyColor === color && [styles.colorCircleActive, { borderColor: currentTheme.primary }],
                    ]}
                    onPress={() => setTempBodyColor(color)}
                    activeOpacity={0.7}
                  />
                ))}
              </View>
            </View>

            {/* === 腮红颜色 === */}
            <View style={[styles.sectionCard, styles.cardShadow]}>
              <Text style={styles.sectionTitle}>腮红颜色</Text>
              <View style={styles.colorGrid}>
                {cheekColorPresets.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                      tempCheekColor === color && [styles.colorCircleActive, { borderColor: currentTheme.primary }],
                    ]}
                    onPress={() => setTempCheekColor(color)}
                    activeOpacity={0.7}
                  />
                ))}
              </View>
            </View>

            {/* === 耳朵颜色 === */}
            <View style={[styles.sectionCard, styles.cardShadow]}>
              <Text style={styles.sectionTitle}>耳朵颜色</Text>
              <View style={styles.colorGrid}>
                {earColorPresets.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                      tempEarColor === color && [styles.colorCircleActive, { borderColor: currentTheme.primary }],
                    ]}
                    onPress={() => setTempEarColor(color)}
                    activeOpacity={0.7}
                  />
                ))}
              </View>
            </View>

            {/* === 脑袋：形状 / 大小 === */}
            <View style={[styles.sectionCard, styles.cardShadow]}>
              <Text style={styles.sectionTitle}>脑袋</Text>
              <Text style={styles.subTitle}>形状</Text>
              <View style={styles.chipRow}>
                {headShapeOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.chip,
                      tempHeadShape === opt.value && [
                        styles.chipActive,
                        { backgroundColor: currentTheme.primary + '18', borderColor: currentTheme.primary },
                      ],
                    ]}
                    onPress={() => setTempHeadShape(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        tempHeadShape === opt.value && { color: currentTheme.primary, fontWeight: '600' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.subTitle}>大小</Text>
              <View style={styles.chipRow}>
                {sizeOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.chip,
                      tempHeadSize === opt.value && [
                        styles.chipActive,
                        { backgroundColor: currentTheme.primary + '18', borderColor: currentTheme.primary },
                      ],
                    ]}
                    onPress={() => setTempHeadSize(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        tempHeadSize === opt.value && { color: currentTheme.primary, fontWeight: '600' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* === 身体：形状 / 大小 === */}
            <View style={[styles.sectionCard, styles.cardShadow]}>
              <Text style={styles.sectionTitle}>身体</Text>
              <Text style={styles.subTitle}>形状</Text>
              <View style={styles.chipRow}>
                {bodyShapeOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.chip,
                      tempBodyShape === opt.value && [
                        styles.chipActive,
                        { backgroundColor: currentTheme.primary + '18', borderColor: currentTheme.primary },
                      ],
                    ]}
                    onPress={() => setTempBodyShape(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        tempBodyShape === opt.value && { color: currentTheme.primary, fontWeight: '600' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.subTitle}>大小</Text>
              <View style={styles.chipRow}>
                {sizeOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.chip,
                      tempBodySize === opt.value && [
                        styles.chipActive,
                        { backgroundColor: currentTheme.primary + '18', borderColor: currentTheme.primary },
                      ],
                    ]}
                    onPress={() => setTempBodySize(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        tempBodySize === opt.value && { color: currentTheme.primary, fontWeight: '600' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* === 耳朵：形状 / 大小 === */}
            <View style={[styles.sectionCard, styles.cardShadow]}>
              <Text style={styles.sectionTitle}>耳朵</Text>
              <Text style={styles.subTitle}>形状</Text>
              <View style={styles.chipRow}>
                {earShapeOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.chip,
                      tempEarShape === opt.value && [
                        styles.chipActive,
                        { backgroundColor: currentTheme.primary + '18', borderColor: currentTheme.primary },
                      ],
                    ]}
                    onPress={() => setTempEarShape(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        tempEarShape === opt.value && { color: currentTheme.primary, fontWeight: '600' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.subTitle}>大小</Text>
              <View style={styles.chipRow}>
                {sizeOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.chip,
                      tempEarSize === opt.value && [
                        styles.chipActive,
                        { backgroundColor: currentTheme.primary + '18', borderColor: currentTheme.primary },
                      ],
                    ]}
                    onPress={() => setTempEarSize(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        tempEarSize === opt.value && { color: currentTheme.primary, fontWeight: '600' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          /* === 上传图片模式 === */
          <View style={[styles.sectionCard, styles.cardShadow]}>
            <Text style={styles.sectionTitle}>选择图片</Text>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: currentTheme.primary + '15', borderColor: currentTheme.primary }]}
              onPress={handlePickImage}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="upload" size={32} color={currentTheme.primary} />
              <Text style={[styles.uploadButtonText, { color: currentTheme.primary }]}>
                {tempImageUri ? '更换图片' : '选择图片'}
              </Text>
            </TouchableOpacity>

            <View style={styles.uploadTips}>
              <MaterialCommunityIcons name="information-outline" size={16} color={colors.textHint} />
              <Text style={styles.uploadTipsText}>
                建议选择正方形图片，效果更佳~{'\n'}
                图片会保存在本地，不会上传到服务器
              </Text>
            </View>
          </View>
        )}

        {/* === 保存按钮 === */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: currentTheme.primary }]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>保存形象</Text>
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
  topTitle: { ...typography.h3, color: colors.textPrimary },
  content: {
    padding: spacing.lg,
  },
  cardShadow: {
    ...shadows.md,
  },

  // 预览卡片
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  previewTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  previewMascot: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPreview: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surfaceVariant,
  },
  uploadPreviewEmpty: {
    backgroundColor: colors.surfaceVariant,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadPlaceholderText: {
    ...typography.caption,
    color: colors.textHint,
    marginTop: spacing.sm,
  },

  // 模式切换
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    padding: 4,
    marginBottom: spacing.md,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
  },
  modeButtonActive: {
    ...shadows.sm,
  },
  modeButtonText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  modeButtonTextActive: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },

  // 通用区块卡片
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // 表情选择
  expressionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  expressionItem: {
    width: '22%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  expressionItemActive: {
    borderWidth: 2,
  },
  expressionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 11,
  },

  // 颜色选择
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
  },
  colorCircleActive: {
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },

  // 上传按钮
  uploadButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  uploadButtonText: {
    ...typography.body1,
    fontWeight: '600',
  },
  uploadTips: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  uploadTipsText: {
    ...typography.caption,
    color: colors.textHint,
    flex: 1,
    lineHeight: 18,
  },

  // 保存按钮
  saveButton: {
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.md,
  },
  saveButtonText: {
    ...typography.h3,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },

  bottomSpacer: {
    height: 40,
  },

  // 形状/大小 调节
  subTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: {
    borderWidth: 1.5,
  },
  chipText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
});
