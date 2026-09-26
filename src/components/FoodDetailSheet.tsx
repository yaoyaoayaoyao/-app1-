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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NutritionRing, NUTRITION_COLORS } from './NutritionRing';
import { calcKcal, MEAL_META } from '@/stores/food.store';
import { spacing, borderRadius } from '@/theme';
import type { FoodEntry } from '@/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_HEIGHT = 280; // 设计稿：全宽×280px

// 设计稿配色系统
const D = {
  bg: '#FFFFFF',
  textPrimary: '#000000',
  textSecondary: '#666666',
  textHint: '#999999',
  divider: '#F2F2F7',
};

interface FoodDetailSheetProps {
  entry: FoodEntry | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (entry: FoodEntry) => void;
  onDelete: (id: string) => void;
}

/**
 * 食物详情弹窗（严格按设计稿）
 * - 模态弹窗，顶部大圆角 24px
 * - 顶部栏：×关闭 + 分享 + 更多
 * - 食物大图：全宽×280px，无圆角，背景粉紫渐变光晕
 * - 食物名称：22-24pt 粗体居中
 * - "膳食结构"标签：12pt 浅灰
 * - 热量：36-40pt 粗体黑色 + "kcal" 14pt
 * - 右侧：环形图 60px
 * - 三列营养素：彩色圆点 + 标签百分比(10pt) + 克数(16pt粗体)
 * - 底部：食用份量
 */
export function FoodDetailSheet({
  entry,
  visible,
  onClose,
  onEdit,
  onDelete,
}: FoodDetailSheetProps) {
  if (!entry) return null;

  const meta = MEAL_META[entry.meal];
  const kcal = calcKcal(entry);
  const carbs = entry.carbs || 0;
  const fat = entry.fat || 0;
  const protein = entry.protein || 0;
  const carbsKcal = Math.round(carbs * 4);
  const fatKcal = Math.round(fat * 9);
  const proteinKcal = Math.round(protein * 4);
  const sumKcal = carbsKcal + fatKcal + proteinKcal;
  const carbsPct = sumKcal > 0 ? Math.round((carbsKcal / sumKcal) * 100) : 0;
  const fatPct = sumKcal > 0 ? Math.round((fatKcal / sumKcal) * 100) : 0;
  const proteinPct = sumKcal > 0 ? Math.round((proteinKcal / sumKcal) * 100) : 0;

  const handleDelete = () => {
    onDelete(entry.id);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* 顶部栏：×关闭 + 分享 + 更多 */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose} style={styles.topBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={22} color={D.textPrimary} />
            </TouchableOpacity>
            <View style={styles.topBarRight}>
              <TouchableOpacity style={styles.topBtn} activeOpacity={0.7}>
                <MaterialCommunityIcons name="share-outline" size={20} color={D.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.topBtn} activeOpacity={0.7}>
                <MaterialCommunityIcons name="dots-horizontal" size={20} color={D.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 食物大图 280px + 粉紫色渐变光晕背景 */}
            <View style={styles.imageHaloSection}>
              <LinearGradient
                colors={['#FFD9EC', '#E8D0FF', '#FFE8F5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.imageHaloGradient}
              />
              <View style={styles.imageWrap}>
                {entry.image ? (
                  <Image
                    source={{ uri: entry.image }}
                    style={styles.bigImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.emojiPlaceholder}>
                    <Text style={styles.mealEmoji}>{meta.emoji}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* 食物名称：居中大字 22-24pt */}
            <View style={styles.titleSection}>
              <Text style={styles.foodName}>{entry.name || '未命名食物'}</Text>
            </View>

            {/* 膳食结构标签 12pt 浅灰 */}
            <View style={styles.structureLabelRow}>
              <Text style={styles.structureLabelText}>膳食结构</Text>
            </View>

            {/* 左热量 + 右环形图 */}
            <View style={styles.kcalRingRow}>
              {/* 左侧：大热量数字 36-40pt */}
              <View style={styles.kcalBlock}>
                <View style={styles.kcalNumberRow}>
                  <Text style={styles.kcalNumber}>{kcal}</Text>
                  <Text style={styles.kcalUnit}>kcal</Text>
                </View>
              </View>
              {/* 右侧：环形图 60px 无中心文字 */}
              <View style={styles.ringBlock}>
                <NutritionRing
                  carbs={carbs}
                  fat={fat}
                  protein={protein}
                  totalKcal={kcal}
                  size={60}
                  showCenterText={false}
                  showLegend={false}
                />
              </View>
            </View>

            {/* 三列营养素 */}
            <View style={styles.nutrientRow}>
              {/* 碳水 */}
              <View style={styles.nutrientCol}>
                <View style={styles.nutrientLabelRow}>
                  <View style={[styles.nutrientDot, { backgroundColor: NUTRITION_COLORS.carbs }]} />
                  <Text style={[styles.nutrientLabel, { color: NUTRITION_COLORS.carbs }]}>
                    碳水 {carbsPct}%
                  </Text>
                </View>
                <Text style={styles.nutrientGram}>{carbs}g</Text>
              </View>

              {/* 脂肪 */}
              <View style={styles.nutrientCol}>
                <View style={styles.nutrientLabelRow}>
                  <View style={[styles.nutrientDot, { backgroundColor: NUTRITION_COLORS.fat }]} />
                  <Text style={[styles.nutrientLabel, { color: NUTRITION_COLORS.fat }]}>
                    脂肪 {fatPct}%
                  </Text>
                </View>
                <Text style={styles.nutrientGram}>{fat}g</Text>
              </View>

              {/* 蛋白质 */}
              <View style={styles.nutrientCol}>
                <View style={styles.nutrientLabelRow}>
                  <View style={[styles.nutrientDot, { backgroundColor: NUTRITION_COLORS.protein }]} />
                  <Text style={[styles.nutrientLabel, { color: NUTRITION_COLORS.protein }]}>
                    蛋白质 {proteinPct}%
                  </Text>
                </View>
                <Text style={styles.nutrientGram}>{protein}g</Text>
              </View>
            </View>

            {/* 底部：食用份量 */}
            <View style={styles.portionRow}>
              <Text style={styles.portionLabel}>食用份量</Text>
              <Text style={styles.portionValue}>
                {entry.portion != null ? `${entry.portion}g` : '未记录'}
              </Text>
            </View>

            {/* 操作按钮 */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.editBtn]}
                onPress={() => onEdit(entry)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="pencil" size={20} color="#007AFF" />
                <Text style={styles.editBtnText}>编辑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                <Text style={styles.deleteBtnText}>删除</Text>
              </TouchableOpacity>
            </View>

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
    backgroundColor: D.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 16 },
    }) as object,
  },

  // 顶部栏
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 4,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // 大图 + 粉紫渐变光晕
  imageHaloSection: {
    width: SCREEN_WIDTH,
    paddingTop: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  imageHaloGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  imageWrap: {
    width: SCREEN_WIDTH - 32,
    height: IMAGE_HEIGHT,
    alignSelf: 'center',
    borderRadius: 2, // 微小圆角，几乎直角
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B9D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }) as object,
  },
  bigImage: {
    width: '100%',
    height: '100%',
  },
  emojiPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  mealEmoji: {
    fontSize: 96,
  },

  // 名称 22-24pt 粗体居中
  titleSection: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  foodName: {
    fontSize: 23,
    fontWeight: '700',
    color: D.textPrimary,
    textAlign: 'center',
  },

  // 膳食结构标签 12pt 浅灰
  structureLabelRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  structureLabelText: {
    fontSize: 12,
    color: D.textHint,
    fontWeight: '500',
  },

  // 左热量 + 右环形图
  kcalRingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  kcalBlock: {
    flex: 1,
  },
  kcalNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  kcalNumber: {
    fontSize: 38, // 36-40pt 粗体黑色
    fontWeight: '800',
    color: D.textPrimary,
  },
  kcalUnit: {
    fontSize: 14, // 14pt
    color: D.textSecondary,
    fontWeight: '600',
  },
  ringBlock: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 三列营养素
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: D.divider,
    borderBottomWidth: 1,
    borderBottomColor: D.divider,
  },
  nutrientCol: {
    alignItems: 'center',
    gap: 4,
  },
  nutrientLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nutrientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // "碳水 32%" 10pt 对应颜色
  nutrientLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  // "36g" 16pt 粗体黑色
  nutrientGram: {
    fontSize: 16,
    fontWeight: '700',
    color: D.textPrimary,
    marginTop: 2,
  },

  // 食用份量
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  portionLabel: {
    fontSize: 14,
    color: D.textSecondary,
    fontWeight: '500',
  },
  portionValue: {
    fontSize: 14,
    color: D.textPrimary,
    fontWeight: '700',
  },

  // 操作按钮
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 16,
  },
  editBtn: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  editBtnText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
  },
  deleteBtnText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },

  bottomSpacer: {
    height: 20,
  },
});
