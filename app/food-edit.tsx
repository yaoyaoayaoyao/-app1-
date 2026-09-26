import React, { useState, useRef, useMemo } from 'react';
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
import { useFoodStore, MEAL_META, FRAME_STYLES, calcKcal } from '@/stores/food.store';
import { analyzeFood } from '@/services/ai.service';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import { getTodayString } from '@/utils/date';
import type { Meal } from '@/types';

const PHOTO_HEIGHT = 340; // 照片区高度340px（原版170的2倍）

export default function FoodEditScreen() {
  const params = useLocalSearchParams<{ entryId?: string; planMode?: string }>();
  const addEntry = useFoodStore((s) => s.addEntry);
  const updateEntry = useFoodStore((s) => s.updateEntry);
  const deleteEntry = useFoodStore((s) => s.deleteEntry);
  const getEntry = useFoodStore((s) => s.getEntry);

  const existing = params.entryId ? getEntry(params.entryId) : null;
  const isEditing = !!existing;

  const [meal, setMeal] = useState<Meal>(existing?.meal || 'breakfast');
  const [name, setName] = useState(existing?.name || '');
  const [kcal, setKcal] = useState(existing?.kcal?.toString() || '');
  const [portion, setPortion] = useState(existing?.portion?.toString() || '');
  const [carbs, setCarbs] = useState(existing?.carbs?.toString() || '');
  const [fat, setFat] = useState(existing?.fat?.toString() || '');
  const [protein, setProtein] = useState(existing?.protein?.toString() || '');
  const [image, setImage] = useState<string>(existing?.image || '');
  const [frame, setFrame] = useState<string>(existing?.frame || 'none');

  // AI 分析相关状态
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiError, setAiError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 预览热量
  const previewKcal = useMemo(() => {
    if (kcal) return parseInt(kcal) || 0;
    return calcKcal({
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      protein: parseFloat(protein) || 0,
    } as any);
  }, [kcal, carbs, fat, protein]);

  // 选择图片（Web端）
  const handlePickImage = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
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
      setImage(result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 移除照片
  const handleRemoveImage = () => {
    setImage('');
  };

  // AI 算热量
  const handleAnalyzeFood = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请先输入食物名称');
      return;
    }

    setAiLoading(true);
    setAiError('');
    setAiAdvice('');

    try {
      const portionNum = portion ? parseFloat(portion) : undefined;
      const result = await analyzeFood(name.trim(), portionNum);

      // 自动填充营养信息
      setKcal(result.kcal.toString());
      setCarbs(result.carbs.toString());
      setFat(result.fat.toString());
      setProtein(result.protein.toString());
      setAiAdvice(result.advice);
    } catch (e) {
      const msg = (e as Error).message || 'AI 分析失败，请稍后重试';
      setAiError(msg);
      Alert.alert('AI 分析失败', msg);
    } finally {
      setAiLoading(false);
    }
  };

  // 保存
  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入食物名称~');
      return;
    }

    const entryData = {
      date: existing?.date || getTodayString(),
      meal,
      name: name.trim(),
      kcal: kcal ? parseInt(kcal) : undefined,
      portion: portion ? parseFloat(portion) : undefined,
      carbs: carbs ? parseFloat(carbs) : undefined,
      fat: fat ? parseFloat(fat) : undefined,
      protein: protein ? parseFloat(protein) : undefined,
      image,
      frame,
    };

    if (isEditing && existing) {
      updateEntry(existing.id, entryData);
    } else {
      addEntry(entryData);
    }
    router.back();
  };

  // 删除
  const handleDelete = () => {
    if (!existing) return;
    Alert.alert('删除记录', '确定要删除这条饮食记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          deleteEntry(existing.id);
          router.back();
        },
      },
    ]);
  };

  const meals: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <ScreenWrapper gradient="mint" safeArea={false}>
      {/* 顶部栏 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{isEditing ? '编辑饮食' : '记一餐'}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 照片选择区 340px */}
        <View style={styles.photoSection}>
          {image ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: image }} style={styles.photo} resizeMode="cover" />
              {/* 边框预览叠加层 */}
              <FrameOverlay frame={frame} />
              {/* 操作按钮 */}
              <View style={styles.photoActions}>
                <TouchableOpacity style={styles.photoActionBtn} onPress={handlePickImage} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="image-edit" size={16} color={colors.textOnPrimary} />
                  <Text style={styles.photoActionText}>重新选</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoActionBtn} onPress={handleRemoveImage} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.textOnPrimary} />
                  <Text style={styles.photoActionText}>移除</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.photoPlaceholder} onPress={handlePickImage} activeOpacity={0.7}>
              <MaterialCommunityIcons name="image-plus" size={64} color={colors.textSecondary} />
              <Text style={styles.photoPlaceholderText}>加张照片</Text>
              <Text style={styles.photoPlaceholderHint}>拍张美食照，留住美味瞬间~</Text>
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

        {/* 餐别选择 */}
        <View style={[styles.section, styles.cardShadow]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={colors.accentWarm} />
            <Text style={styles.sectionTitle}>餐别</Text>
          </View>
          <View style={styles.mealChipRow}>
            {meals.map((m) => {
              const meta = MEAL_META[m];
              const selected = meal === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.mealChip, selected && styles.mealChipActive]}
                  onPress={() => setMeal(m)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.mealChipEmoji, selected && styles.mealChipEmojiActive]}>
                    {meta.emoji}
                  </Text>
                  <Text style={[styles.mealChipText, selected && styles.mealChipTextActive]}>
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 食物名称 */}
        <View style={[styles.section, styles.cardShadow]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="food" size={20} color={colors.accentMint} />
            <Text style={styles.sectionTitle}>食物名称</Text>
          </View>
          <View style={styles.nameInputRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              placeholder="吃了什么？"
              placeholderTextColor={colors.textHint}
              value={name}
              onChangeText={setName}
              maxLength={30}
            />
            {/* AI 算热量按钮 */}
            <TouchableOpacity
              style={[styles.aiBtn, aiLoading && styles.aiBtnLoading]}
              onPress={handleAnalyzeFood}
              disabled={aiLoading}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={aiLoading ? 'loading' : 'auto-fix'}
                size={18}
                color={colors.textOnPrimary}
              />
              <Text style={styles.aiBtnText}>{aiLoading ? '分析中' : 'AI算'}</Text>
            </TouchableOpacity>
          </View>

          {/* AI 建议卡片 */}
          {aiAdvice ? (
            <View style={styles.aiAdviceCard}>
              <View style={styles.aiAdviceHeader}>
                <MaterialCommunityIcons name="lightbulb-on" size={16} color={colors.accentLavender} />
                <Text style={styles.aiAdviceTitle}>AI 建议</Text>
              </View>
              <Text style={styles.aiAdviceText}>{aiAdvice}</Text>
            </View>
          ) : null}
        </View>

        {/* 营养信息 */}
        <View style={[styles.section, styles.cardShadow]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="fire" size={20} color={colors.accentWarm} />
            <Text style={styles.sectionTitle}>营养信息</Text>
            <Text style={styles.previewKcal}>≈ {previewKcal} kcal</Text>
          </View>

          {/* 热量 */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>热量 (kcal)</Text>
            <TextInput
              style={styles.numberInput}
              placeholder="自动计算"
              placeholderTextColor={colors.textHint}
              value={kcal}
              onChangeText={setKcal}
              keyboardType="numeric"
            />
          </View>

          {/* 分量 */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>分量 (g)</Text>
            <TextInput
              style={styles.numberInput}
              placeholder="如 200"
              placeholderTextColor={colors.textHint}
              value={portion}
              onChangeText={setPortion}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.divider} />

          {/* 三大营养素 */}
          <Text style={styles.nutrientSubtitle}>三大营养素 (g)</Text>
          <View style={styles.nutrientRow}>
            <View style={styles.nutrientCell}>
              <View style={[styles.nutrientDot, { backgroundColor: colors.success }]} />
              <Text style={styles.inputLabel}>碳水</Text>
              <TextInput
                style={styles.nutrientInput}
                placeholder="0"
                placeholderTextColor={colors.textHint}
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.nutrientCell}>
              <View style={[styles.nutrientDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.inputLabel}>脂肪</Text>
              <TextInput
                style={styles.nutrientInput}
                placeholder="0"
                placeholderTextColor={colors.textHint}
                value={fat}
                onChangeText={setFat}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.nutrientCell}>
              <View style={[styles.nutrientDot, { backgroundColor: colors.accentWarm }]} />
              <Text style={styles.inputLabel}>蛋白</Text>
              <TextInput
                style={styles.nutrientInput}
                placeholder="0"
                placeholderTextColor={colors.textHint}
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* 照片边框选择 */}
        {image ? (
          <View style={[styles.section, styles.cardShadow]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="image-frame" size={20} color={colors.accentLavender} />
              <Text style={styles.sectionTitle}>照片边框</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.frameRow}>
              {FRAME_STYLES.map((f) => {
                const selected = frame === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.frameChip, selected && styles.frameChipActive]}
                    onPress={() => setFrame(f.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.frameChipEmoji}>{f.emoji}</Text>
                    <Text style={[styles.frameChipText, selected && styles.frameChipTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* 保存按钮 */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
          <MaterialCommunityIcons name="check-circle" size={22} color={colors.textOnPrimary} />
          <Text style={styles.saveButtonText}>{isEditing ? '更新记录' : '保存记录'}</Text>
        </TouchableOpacity>

        {/* 删除按钮（编辑模式） */}
        {isEditing && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.7}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
            <Text style={styles.deleteText}>删除这条记录</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

// === 边框预览叠加层 ===
function FrameOverlay({ frame }: { frame: string }) {
  if (frame === 'none') return null;

  const frameStyles: Record<string, { borderWidth: number; borderColor: string; backgroundColor?: string }> = {
    cream: { borderWidth: 16, borderColor: '#FFF5F0', backgroundColor: 'rgba(255,245,240,0.2)' },
    dots: { borderWidth: 10, borderColor: colors.primaryLight },
    candy: { borderWidth: 14, borderColor: colors.accentWarm },
    cloud: { borderWidth: 12, borderColor: colors.primaryLight },
  };

  const style = frameStyles[frame];
  if (!style) return null;

  return <View style={[styles.frameOverlay, style]} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  cardShadow: {
    ...shadows.md,
  },

  // 顶部栏
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  topTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  saveText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '700',
  },

  // 照片区 340px
  photoSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceVariant,
  },
  photoContainer: {
    width: '100%',
    height: PHOTO_HEIGHT,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: PHOTO_HEIGHT,
  },
  frameOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.xl,
  },
  photoActions: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  photoActionText: {
    fontSize: 12,
    color: colors.textOnPrimary,
    fontWeight: '500',
  },
  photoPlaceholder: {
    width: '100%',
    height: PHOTO_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight + '40',
  },
  photoPlaceholderText: {
    ...typography.h3,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  photoPlaceholderHint: {
    ...typography.caption,
    color: colors.textHint,
  },

  // 通用 section
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  previewKcal: {
    ...typography.body2,
    color: colors.accentWarm,
    fontWeight: '700',
  },

  // 餐别 chips
  mealChipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mealChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceVariant,
    gap: 4,
  },
  mealChipActive: {
    backgroundColor: colors.primaryLight + '80',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  mealChipEmoji: {
    fontSize: 22,
  },
  mealChipEmojiActive: {},
  mealChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  mealChipTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },

  // 文本输入
  textInput: {
    ...typography.body1,
    color: colors.textPrimary,
    padding: 0,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  // 食物名称输入行（带AI按钮）
  nameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  // AI 算按钮
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentLavender,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    minWidth: 64,
    justifyContent: 'center',
  },
  aiBtnLoading: {
    opacity: 0.6,
  },
  aiBtnText: {
    ...typography.caption,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },

  // AI 建议卡片
  aiAdviceCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.accentLavender + '15',
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accentLavender,
  },
  aiAdviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  aiAdviceTitle: {
    ...typography.caption,
    color: colors.accentLavender,
    fontWeight: '700',
  },
  aiAdviceText: {
    ...typography.body2,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // 数字输入行
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  inputLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  numberInput: {
    ...typography.body1,
    color: colors.textPrimary,
    textAlign: 'right',
    minWidth: 100,
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  nutrientSubtitle: {
    ...typography.caption,
    color: colors.textHint,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  nutrientRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  nutrientCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  nutrientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nutrientInput: {
    ...typography.body2,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    padding: 0,
    minWidth: 30,
  },

  // 边框选择
  frameRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  frameChip: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceVariant,
    gap: 4,
    minWidth: 72,
  },
  frameChipActive: {
    backgroundColor: colors.accentLavender + '40',
    borderWidth: 2,
    borderColor: colors.accentLavender,
  },
  frameChipEmoji: {
    fontSize: 22,
  },
  frameChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  frameChipTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },

  // 保存按钮
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  saveButtonText: {
    ...typography.buttonLabel,
    color: colors.textOnPrimary,
    fontWeight: '700',
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
