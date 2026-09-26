import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { Mascot } from '@/components/Mascot';
import { useThemeStore, type BackgroundType } from '@/stores/theme.store';
import { themes, type Theme } from '@/theme/themes';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';

// ========== 预设背景配置 ==========
interface PresetBackground {
  id: string;
  name: string;
  colors?: [string, string, string]; // 三色渐变
  imageUri?: string; // 本地图片资源
  icon: string;
  type: 'gradient' | 'image';
}

// 玉桂狗预设背景（用户上传的图片）
const cinnamorollPresets: PresetBackground[] = [
  { id: 'cinnamoroll-1', name: '玉桂狗·微笑', icon: 'heart', type: 'image', imageUri: require('../assets/images/backgrounds/bg-1.png') as string },
  { id: 'cinnamoroll-2', name: '玉桂狗·粉色', icon: 'flower', type: 'image', imageUri: require('../assets/images/backgrounds/bg-2.png') as string },
  { id: 'cinnamoroll-3', name: '玉桂狗·蓝色', icon: 'cloud', type: 'image', imageUri: require('../assets/images/backgrounds/bg-3.png') as string },
  { id: 'cinnamoroll-4', name: '玉桂狗·星空', icon: 'star', type: 'image', imageUri: require('../assets/images/backgrounds/bg-4.png') as string },
  { id: 'cinnamoroll-5', name: '玉桂狗·梦幻', icon: 'sparkles', type: 'image', imageUri: require('../assets/images/backgrounds/bg-5.png') as string },
  { id: 'cinnamoroll-6', name: '玉桂狗·奶油', icon: 'cookie', type: 'image', imageUri: require('../assets/images/backgrounds/bg-6.png') as string },
  { id: 'cinnamoroll-7', name: '玉桂狗·花束', icon: 'flower-tulip', type: 'image', imageUri: require('../assets/images/backgrounds/bg-7.png') as string },
];

const gradientPresets: PresetBackground[] = [
  {
    id: 'cloud-sky',
    name: '云朵天空',
    colors: ['#87CEEB', '#E0F4FF', '#FFFFFF'],
    icon: 'cloud-outline',
    type: 'gradient',
  },
  {
    id: 'pink-starry',
    name: '粉色星空',
    colors: ['#FFB6C1', '#DDA0DD', '#9370DB'],
    icon: 'star-outline',
    type: 'gradient',
  },
  {
    id: 'mint-ocean',
    name: '薄荷海洋',
    colors: ['#98FB98', '#48D1CC', '#40E0D0'],
    icon: 'waves',
    type: 'gradient',
  },
  {
    id: 'warm-sunset',
    name: '暖黄日落',
    colors: ['#FFD700', '#FFA500', '#FF7F50'],
    icon: 'weather-sunset',
    type: 'gradient',
  },
  {
    id: 'purple-dream',
    name: '紫色梦幻',
    colors: ['#E6E6FA', '#DDA0DD', '#9370DB'],
    icon: 'sparkles',
    type: 'gradient',
  },
];

const presetBackgrounds = [...cinnamorollPresets, ...gradientPresets];

// 生成渐变背景的 base64 图片（Web端用 Canvas）
function generateGradientBase64(colors: string[], width = 800, height = 1200): string | null {
  if (Platform.OS !== 'web') return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    return canvas.toDataURL('image/jpeg', 0.8);
  } catch {
    return null;
  }
}

// 压缩图片并转为 base64（Web端）
function compressImage(file: File, maxWidth = 800, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'web') {
      reject(new Error('Only supported on web'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, 1);
        const width = img.width * ratio;
        const height = img.height * ratio;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function ThemeSettingsScreen() {
  const currentTheme = useThemeStore((s) => s.currentTheme);
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);
  const backgroundType = useThemeStore((s) => s.backgroundType);
  const backgroundImage = useThemeStore((s) => s.backgroundImage);
  const backgroundOpacity = useThemeStore((s) => s.backgroundOpacity);
  const setBackgroundType = useThemeStore((s) => s.setBackgroundType);
  const setBackgroundImage = useThemeStore((s) => s.setBackgroundImage);
  const setBackgroundOpacity = useThemeStore((s) => s.setBackgroundOpacity);
  const resetBackground = useThemeStore((s) => s.resetBackground);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sliderValue, setSliderValue] = useState(backgroundOpacity);

  const handleSelectTheme = (theme: Theme) => {
    setTheme(theme.id);
  };

  const handleBackgroundTypeChange = (type: BackgroundType) => {
    setBackgroundType(type);
  };

  const handleUploadPress = () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressImage(file, 800, 0.8);
      setBackgroundImage(base64);
      setBackgroundType('image');
    } catch (error) {
      console.error('Failed to process image:', error);
    }

    // 重置 input 以便可以再次选择同一文件
    if (event.target) {
      event.target.value = '';
    }
  };

  const handlePresetSelect = (preset: PresetBackground) => {
    if (preset.type === 'image' && preset.imageUri) {
      // 图片类型预设：直接使用图片URI
      setBackgroundImage(preset.imageUri);
      setBackgroundType('image');
    } else if (preset.type === 'gradient' && preset.colors) {
      // 渐变类型预设：生成 base64
      const base64 = generateGradientBase64(preset.colors);
      if (base64) {
        setBackgroundImage(base64);
        setBackgroundType('image');
      }
    }
  };

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    setBackgroundOpacity(value);
  };

  const bgTypes: { type: BackgroundType; label: string; icon: string }[] = [
    { type: 'gradient', label: '渐变', icon: 'gradient' },
    { type: 'color', label: '纯色', icon: 'circle-outline' },
    { type: 'image', label: '图片', icon: 'image-outline' },
  ];

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
        <Text style={styles.topTitle}>主题设置</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* === 当前主题预览 === */}
        <View style={[styles.currentThemeCard, styles.cardShadow]}>
          <LinearGradient
            colors={[currentTheme.gradientStart, currentTheme.gradientEnd]}
            style={styles.currentThemePreview}
          >
            <Mascot size={80} expression="happy" />
            <Text style={[styles.currentThemeName, { color: currentTheme.textPrimary }]}>
              {currentTheme.name}
            </Text>
            <Text style={[styles.currentThemeDesc, { color: currentTheme.textSecondary }]}>
              当前使用的主题
            </Text>
          </LinearGradient>
        </View>

        {/* === 主题列表 === */}
        <Text style={styles.sectionLabel}>选择主题</Text>

        <View style={styles.themeGrid}>
          {themes.map((theme) => {
            const isSelected = themeId === theme.id;
            return (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeCard,
                  styles.cardShadow,
                  isSelected && [styles.themeCardSelected, { borderColor: theme.primary }],
                ]}
                onPress={() => handleSelectTheme(theme)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[theme.gradientStart, theme.gradientEnd]}
                  style={styles.themePreview}
                >
                  {/* 主题颜色预览小圆点 */}
                  <View style={styles.colorDotsRow}>
                    <View style={[styles.colorDot, { backgroundColor: theme.primary }]} />
                    <View style={[styles.colorDot, { backgroundColor: theme.accentWarm }]} />
                    <View style={[styles.colorDot, { backgroundColor: theme.accentMint }]} />
                    <View style={[styles.colorDot, { backgroundColor: theme.accentLavender }]} />
                  </View>

                  {/* 小吉祥物预览 */}
                  <View style={styles.miniMascot}>
                    <View
                      style={[
                        styles.miniHead,
                        { backgroundColor: theme.surface, borderColor: theme.surfaceVariant },
                      ]}
                    >
                      <View style={[styles.miniEye, styles.miniEyeLeft, { backgroundColor: theme.textPrimary }]} />
                      <View style={[styles.miniEye, styles.miniEyeRight, { backgroundColor: theme.textPrimary }]} />
                      <View style={[styles.miniCheek, styles.miniCheekLeft, { backgroundColor: theme.accentWarm }]} />
                      <View style={[styles.miniCheek, styles.miniCheekRight, { backgroundColor: theme.accentWarm }]} />
                    </View>
                  </View>
                </LinearGradient>

                <View style={styles.themeInfo}>
                  <View style={styles.themeNameRow}>
                    <Text style={[styles.themeName, { color: theme.textPrimary }]}>
                      {theme.name}
                    </Text>
                    {isSelected && (
                      <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                        <MaterialCommunityIcons name="check" size={14} color={theme.textOnPrimary} />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.themeDesc, { color: theme.textSecondary }]} numberOfLines={1}>
                    {theme.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* === 背景设置 === */}
        <Text style={styles.sectionLabel}>背景设置</Text>

        <View style={[styles.bgSectionCard, styles.cardShadow]}>
          {/* 背景类型切换 */}
          <View style={styles.segmentedControl}>
            {bgTypes.map((item) => {
              const isActive = backgroundType === item.type;
              return (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.segmentedItem,
                    isActive && [styles.segmentedItemActive, { backgroundColor: currentTheme.primary }],
                  ]}
                  onPress={() => handleBackgroundTypeChange(item.type)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={16}
                    color={isActive ? currentTheme.textOnPrimary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.segmentedLabel,
                      { color: isActive ? currentTheme.textOnPrimary : colors.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 图片模式下的设置 */}
          {backgroundType === 'image' && (
            <View style={styles.imageSettings}>
              {/* 上传按钮 */}
              <TouchableOpacity
                style={[styles.uploadBtn, { borderColor: currentTheme.primary }]}
                onPress={handleUploadPress}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="cloud-upload-outline" size={20} color={currentTheme.primary} />
                <Text style={[styles.uploadBtnText, { color: currentTheme.primary }]}>
                  上传背景图片
                </Text>
              </TouchableOpacity>

              {backgroundImage && (
                <View style={styles.currentBgPreview}>
                  <Text style={styles.currentBgLabel}>当前背景</Text>
                  <View style={[styles.bgPreviewImg, { backgroundColor: currentTheme.surfaceVariant }]}>
                    <LinearGradient
                      colors={[currentTheme.gradientStart, currentTheme.gradientEnd]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.previewBadge}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={currentTheme.primary} />
                    </View>
                  </View>
                </View>
              )}

              {/* 透明度调节 */}
              <View style={styles.opacitySection}>
                <View style={styles.opacityLabelRow}>
                  <Text style={styles.opacityLabel}>遮罩透明度</Text>
                  <Text style={[styles.opacityValue, { color: currentTheme.primary }]}>
                    {Math.round(backgroundOpacity * 100)}%
                  </Text>
                </View>
                <View style={styles.sliderContainer}>
                  <View style={[styles.sliderTrack, { backgroundColor: currentTheme.surfaceVariant }]}>
                    <View
                      style={[
                        styles.sliderFill,
                        {
                          width: `${backgroundOpacity * 100}%`,
                          backgroundColor: currentTheme.primary,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.sliderThumb,
                        {
                          left: `calc(${backgroundOpacity * 100}% - 10px)`,
                          backgroundColor: currentTheme.primary,
                        },
                      ]}
                    />
                  </View>
                  {/* Web端使用原生 range input 覆盖 */}
                  {Platform.OS === 'web' && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(backgroundOpacity * 100)}
                      onChange={(e) => handleSliderChange(parseInt(e.target.value, 10) / 100)}
                      style={styles.nativeSlider}
                    />
                  )}
                </View>
                <View style={styles.sliderHintRow}>
                  <Text style={styles.sliderHint}>不透明</Text>
                  <Text style={styles.sliderHint}>透明</Text>
                </View>
              </View>

              {/* 预设背景 */}
              <View style={styles.presetSection}>
                <Text style={styles.presetTitle}>
                  <MaterialCommunityIcons name="palette-outline" size={14} color={colors.textSecondary} />
                  {' '}预设背景
                </Text>
                <View style={styles.presetGrid}>
                  {presetBackgrounds.map((preset) => (
                    <TouchableOpacity
                      key={preset.id}
                      style={[styles.presetItem, styles.cardShadow]}
                      onPress={() => handlePresetSelect(preset)}
                      activeOpacity={0.8}
                    >
                      {preset.type === 'image' && preset.imageUri ? (
                        <Image
                          source={{ uri: preset.imageUri as any }}
                          style={styles.presetImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <LinearGradient
                          colors={preset.colors!}
                          style={styles.presetGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                        >
                          <MaterialCommunityIcons
                            name={preset.icon as any}
                            size={20}
                            color="rgba(255,255,255,0.8)"
                          />
                        </LinearGradient>
                      )}
                      <Text style={styles.presetName}>{preset.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 重置按钮 */}
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={resetBackground}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="refresh" size={14} color={colors.textSecondary} />
                <Text style={styles.resetBtnText}>重置为默认背景</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 纯色模式提示 */}
          {backgroundType === 'color' && (
            <View style={styles.colorModeHint}>
              <View style={[styles.colorPreview, { backgroundColor: currentTheme.background }]} />
              <View style={styles.colorModeText}>
                <Text style={styles.colorModeTitle}>纯色背景</Text>
                <Text style={styles.colorModeDesc}>
                  使用当前主题的背景色作为页面背景
                </Text>
              </View>
            </View>
          )}

          {/* 渐变模式提示 */}
          {backgroundType === 'gradient' && (
            <View style={styles.colorModeHint}>
              <LinearGradient
                colors={[currentTheme.gradientStart, currentTheme.gradientEnd]}
                style={styles.colorPreview}
              />
              <View style={styles.colorModeText}>
                <Text style={styles.colorModeTitle}>渐变背景</Text>
                <Text style={styles.colorModeDesc}>
                  使用当前主题的渐变色作为页面背景
                </Text>
              </View>
            </View>
          )}
        </View>

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

  // 当前主题卡片
  currentThemeCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  currentThemePreview: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  currentThemeName: {
    ...typography.h2,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  currentThemeDesc: {
    ...typography.body2,
    marginTop: spacing.xs,
  },

  // 区块标题
  sectionLabel: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    paddingLeft: spacing.xs,
  },

  // 主题网格
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  themeCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardSelected: {
    borderWidth: 2,
  },
  themePreview: {
    height: 120,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  colorDotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  miniMascot: {
    alignItems: 'center',
  },
  miniHead: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniEye: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    top: 16,
  },
  miniEyeLeft: {
    left: 14,
  },
  miniEyeRight: {
    right: 14,
  },
  miniCheek: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    bottom: 12,
    opacity: 0.6,
  },
  miniCheekLeft: {
    left: 8,
  },
  miniCheekRight: {
    right: 8,
  },

  themeInfo: {
    padding: spacing.md,
  },
  themeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  themeName: {
    ...typography.body1,
    fontWeight: '600',
  },
  themeDesc: {
    ...typography.caption,
    fontSize: 11,
  },
  selectedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // === 背景设置卡片 ===
  bgSectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  // 分段控件
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 999,
    padding: 4,
    marginBottom: spacing.lg,
  },
  segmentedItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 999,
    gap: 6,
  },
  segmentedItemActive: {
    ...shadows.sm,
  },
  segmentedLabel: {
    ...typography.body2,
    fontWeight: '600',
    fontSize: 13,
  },

  // 图片设置区域
  imageSettings: {
    gap: spacing.lg,
  },

  // 上传按钮
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  uploadBtnText: {
    ...typography.body1,
    fontWeight: '600',
  },

  // 当前背景预览
  currentBgPreview: {
    alignItems: 'center',
  },
  currentBgLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  bgPreviewImg: {
    width: 120,
    height: 80,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },

  // 透明度调节
  opacitySection: {
    marginTop: spacing.xs,
  },
  opacityLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  opacityLabel: {
    ...typography.body2,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  opacityValue: {
    ...typography.body1,
    fontWeight: '700',
  },
  sliderContainer: {
    position: 'relative',
    height: 28,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    ...shadows.sm,
  },
  nativeSlider: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 28,
    opacity: 0.001,
    cursor: 'pointer',
    margin: 0,
    padding: 0,
  },
  sliderHintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sliderHint: {
    ...typography.caption,
    color: colors.textHint,
    fontSize: 11,
  },

  // 预设背景
  presetSection: {
    marginTop: spacing.xs,
  },
  presetTitle: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetItem: {
    width: '18%',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  presetGradient: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetImage: {
    width: '100%',
    height: 50,
  },
  presetName: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    paddingVertical: 4,
  },

  // 重置按钮
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: 6,
  },
  resetBtnText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  // 纯色/渐变模式提示
  colorModeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
  },
  colorPreview: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  colorModeText: {
    flex: 1,
  },
  colorModeTitle: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  colorModeDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  bottomSpacer: {
    height: 40,
  },
});
