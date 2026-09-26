import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '@/theme';

// 设计稿营养素颜色编码
export const NUTRITION_COLORS = {
  carbs: '#34C759',   // 碳水 - 绿色
  fat: '#FF9500',     // 脂肪 - 橙色
  protein: '#FF2D55', // 蛋白质 - 粉红
} as const;

interface NutritionRingProps {
  /** 碳水克数 */
  carbs?: number;
  /** 脂肪克数 */
  fat?: number;
  /** 蛋白质克数 */
  protein?: number;
  /** 总热量 kcal（不传则自动计算） */
  totalKcal?: number;
  /** 环形图尺寸，默认 60（设计稿详情卡右侧小环） */
  size?: number;
  /** 环宽，默认 max(8, size*0.11) */
  strokeWidth?: number;
  /** 是否显示中心热量文字，默认 true */
  showCenterText?: boolean;
  /** 是否显示底部图例，默认 true */
  showLegend?: boolean;
}

/**
 * 营养素环形图 - 显示三大营养素热量占比
 * 碳水(绿色 #34C759) / 脂肪(橙色 #FF9500) / 蛋白质(粉红 #FF2D55)
 * 从顶部12点钟方向开始，顺时针绘制
 */
export function NutritionRing({
  carbs = 0,
  fat = 0,
  protein = 0,
  totalKcal,
  size = 60,
  strokeWidth,
  showCenterText = true,
  showLegend = true,
}: NutritionRingProps) {
  const carbsKcal = Math.round(carbs * 4);
  const fatKcal = Math.round(fat * 9);
  const proteinKcal = Math.round(protein * 4);
  const sum = carbsKcal + fatKcal + proteinKcal;
  const kcal = totalKcal != null && totalKcal > 0 ? totalKcal : sum;

  const stroke = strokeWidth ?? Math.max(8, size * 0.11);
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  // 各段长度（按热量占比）
  const carbsLen = sum > 0 ? (carbsKcal / sum) * circumference : 0;
  const fatLen = sum > 0 ? (fatKcal / sum) * circumference : 0;
  const proteinLen = sum > 0 ? (proteinKcal / sum) * circumference : 0;

  // 起始偏移（从顶部12点钟方向开始，顺时针）
  const carbsOffset = 0;
  const fatOffset = carbsLen;
  const proteinOffset = carbsLen + fatLen;

  // 旋转 -90deg 使起点在顶部
  const rotate = -90;

  const carbsPct = sum > 0 ? Math.round((carbsKcal / sum) * 100) : 0;
  const fatPct = sum > 0 ? Math.round((fatKcal / sum) * 100) : 0;
  const proteinPct = sum > 0 ? Math.round((proteinKcal / sum) * 100) : 0;

  // 小尺寸时缩小图例字号
  const isSmall = size <= 80;

  return (
    <View style={styles.container}>
      <View style={[styles.ringWrap, { width: size, height: size }]}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: `${rotate}deg` as any }] }}>
          {/* 背景环 */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={colors.surfaceVariant}
            strokeWidth={stroke}
            fill="none"
          />
          {/* 碳水段（绿色） */}
          {carbsLen > 0 && (
            <Circle
              cx={cx}
              cy={cy}
              r={radius}
              stroke={NUTRITION_COLORS.carbs}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${carbsLen} ${circumference}`}
              strokeDashoffset={-carbsOffset}
            />
          )}
          {/* 脂肪段（橙色） */}
          {fatLen > 0 && (
            <Circle
              cx={cx}
              cy={cy}
              r={radius}
              stroke={NUTRITION_COLORS.fat}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${fatLen} ${circumference}`}
              strokeDashoffset={-fatOffset}
            />
          )}
          {/* 蛋白质段（粉红） */}
          {proteinLen > 0 && (
            <Circle
              cx={cx}
              cy={cy}
              r={radius}
              stroke={NUTRITION_COLORS.protein}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${proteinLen} ${circumference}`}
              strokeDashoffset={-proteinOffset}
            />
          )}
        </Svg>
        {/* 中心热量（可关闭） */}
        {showCenterText && (
          <View style={styles.centerContent}>
            <Text style={[styles.kcalNumber, isSmall && styles.kcalNumberSmall]}>{kcal}</Text>
            <Text style={[styles.kcalUnit, isSmall && styles.kcalUnitSmall]}>kcal</Text>
          </View>
        )}
      </View>

      {/* 图例（可关闭） */}
      {showLegend && (
        <View style={[styles.legendRow, isSmall && styles.legendRowSmall]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: NUTRITION_COLORS.carbs }]} />
            <Text style={styles.legendLabel}>碳水</Text>
            <Text style={styles.legendValue}>{carbsPct}%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: NUTRITION_COLORS.fat }]} />
            <Text style={styles.legendLabel}>脂肪</Text>
            <Text style={styles.legendValue}>{fatPct}%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: NUTRITION_COLORS.protein }]} />
            <Text style={styles.legendLabel}>蛋白</Text>
            <Text style={styles.legendValue}>{proteinPct}%</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  ringWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  kcalNumber: {
    ...typography.h1,
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  kcalNumberSmall: {
    fontSize: 14,
    fontWeight: '700',
  },
  kcalUnit: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  kcalUnitSmall: {
    fontSize: 9,
    marginTop: 0,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
  },
  legendRowSmall: {
    gap: 10,
    marginTop: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  legendValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
