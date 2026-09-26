import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Svg, { Circle, Ellipse, Path, G, Line, Text as SvgText } from 'react-native-svg';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { useMoodStore } from '@/stores/mood.store';
import type { MoodType } from '@/types';

export interface MoodOption {
  mood: MoodType;
  label: string;
  color: string;
}

// 全身玉桂狗风格心情图标 - 奶油白身体+深蓝色轮廓+完整角色造型（身体/耳朵/尾巴/爪子）
const BODY_COLOR = '#FFFEF7';
const BLUSH = '#F4A4B4';
const TEAR_BLUE = '#87CEEB';
const STAR_YELLOW = '#FFE66D';
const ANGRY_RED = '#FF6B6B';
const SW_MAIN = 2.5;
const SW_SUB = 2;
const SW_DETAIL = 1.8;

const MOOD_ICONS: Record<MoodType, (color: string, size: number) => React.ReactElement> = {
  // 开心：坐姿跳跃+双手举脸颊+7条红色放射线
  happy: (color, size) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* 红色放射线（背后） */}
      <G stroke={ANGRY_RED} strokeWidth="1.8" strokeLinecap="round">
        <Line x1="24" y1="4" x2="24" y2="9" />
        <Line x1="13" y1="8" x2="17" y2="12" />
        <Line x1="35" y1="8" x2="31" y2="12" />
        <Line x1="6" y1="18" x2="11" y2="19" />
        <Line x1="42" y1="18" x2="37" y2="19" />
        <Line x1="5" y1="30" x2="10" y2="28" />
        <Line x1="43" y1="30" x2="38" y2="28" />
      </G>
      {/* 尾巴（右后方小卷） */}
      <Path d="M32 32 C36 30 38 34 36 37 C34 39 31 37 32 34" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB} strokeLinejoin="round"/>
      {/* 左耳 - 竖起 */}
      <Path d="M16 17 C12 9 10 3 15 2 C19 4 20 11 21 17" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN} strokeLinejoin="round"/>
      {/* 右耳 - 下垂弯曲 */}
      <Path d="M32 17 C38 15 41 21 40 27 C39 31 34 30 33 25 L32 17" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN} strokeLinejoin="round"/>
      {/* 身体（坐姿） */}
      <Ellipse cx="24" cy="33" rx="9" ry="8" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN}/>
      {/* 头部 */}
      <Ellipse cx="24" cy="21" rx="9" ry="8" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN}/>
      {/* 左爪 - 举在脸颊旁 */}
      <Ellipse cx="14" cy="23" rx="2.5" ry="3" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB}/>
      {/* 右爪 - 举在脸颊旁 */}
      <Ellipse cx="34" cy="23" rx="2.5" ry="3" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB}/>
      {/* 左脚 */}
      <Ellipse cx="19" cy="40" rx="3" ry="2" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB}/>
      {/* 右脚 */}
      <Ellipse cx="29" cy="40" rx="3" ry="2" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB}/>
      {/* 腮红 */}
      <Ellipse cx="18" cy="23" rx="2" ry="1.2" fill={BLUSH} opacity="0.7"/>
      <Ellipse cx="30" cy="23" rx="2" ry="1.2" fill={BLUSH} opacity="0.7"/>
      {/* 眼睛 - 小圆点 */}
      <Circle cx="20" cy="20" r="1.5" fill={color}/>
      <Circle cx="28" cy="20" r="1.5" fill={color}/>
      {/* 开心笑嘴 */}
      <Path d="M21 25 Q24 28 27 25" stroke={color} strokeWidth={SW_DETAIL} strokeLinecap="round" fill="none"/>
    </Svg>
  ),
  // 一般/平静：侧坐姿势，面朝左，长耳朵下垂
  calm: (color, size) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* 尾巴（右后方） */}
      <Path d="M34 30 C38 28 40 32 38 35 C36 37 33 35 34 32" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB} strokeLinejoin="round"/>
      {/* 后耳（右侧） */}
      <Path d="M28 16 C33 14 36 20 35 26 C34 30 29 28 28 24 L28 16" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN} strokeLinejoin="round"/>
      {/* 身体（侧坐） */}
      <Ellipse cx="24" cy="32" rx="10" ry="9" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN}/>
      {/* 头部（侧面） */}
      <Ellipse cx="20" cy="22" rx="8" ry="7.5" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN}/>
      {/* 前耳（左侧）- 长长下垂 */}
      <Path d="M14 18 C9 18 7 26 9 31 C10 34 14 33 15 28 L15 18" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN} strokeLinejoin="round"/>
      {/* 前脚 */}
      <Ellipse cx="16" cy="40" rx="3.5" ry="2" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB}/>
      {/* 后脚 */}
      <Ellipse cx="30" cy="40" rx="3" ry="1.8" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB}/>
      {/* 腮红 */}
      <Ellipse cx="17" cy="25" rx="2" ry="1.2" fill={BLUSH} opacity="0.6"/>
      {/* 眼睛 - 一个小圆点（侧面） */}
      <Circle cx="22" cy="21" r="1.5" fill={color}/>
      {/* 平静微笑线 */}
      <Path d="M14 26 Q16 27.5 18 26.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </Svg>
  ),
  // 疲惫/睡觉：横躺睡姿+闭眼+zzz气泡（三个从小到大的圆）
  tired: (color, size) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Zzz 气泡 - 三个从小到大的圆 */}
      <G>
        {/* 气泡连接线 */}
        <Path d="M28 9 Q31 6 34 5" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round"/>
        {/* 小圆 */}
        <Circle cx="36" cy="4" r="2" fill={BODY_COLOR} stroke={color} strokeWidth="1"/>
        {/* 中圆 */}
        <Circle cx="40" cy="7" r="3" fill={BODY_COLOR} stroke={color} strokeWidth="1"/>
        {/* 大圆 */}
        <Circle cx="42" cy="12" r="4" fill={BODY_COLOR} stroke={color} strokeWidth="1"/>
        <SvgText x="34.8" y="5.3" fontSize="3" fill={color} fontWeight="600" fontFamily="sans-serif">z</SvgText>
        <SvgText x="38.3" y="8.5" fontSize="4" fill={color} fontWeight="600" fontFamily="sans-serif">z</SvgText>
        <SvgText x="39.3" y="14" fontSize="5.5" fill={color} fontWeight="600" fontFamily="sans-serif">z</SvgText>
      </G>
      {/* 尾巴（右侧小卷） */}
      <Path d="M38 28 C41 26 42 30 40 32 C38 34 36 32 37 29" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB} strokeLinejoin="round"/>
      {/* 身体（横躺） */}
      <Ellipse cx="26" cy="30" rx="14" ry="7" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN}/>
      {/* 耳朵（下垂放平） */}
      <Path d="M10 22 C6 22 4 28 5 32 C6 35 10 34 11 30 L11 22" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN} strokeLinejoin="round"/>
      <Path d="M10 28 C5 30 4 36 6 39 C9 40 12 37 12 32" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN} strokeLinejoin="round"/>
      {/* 头部 */}
      <Ellipse cx="12" cy="28" rx="7" ry="6.5" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN}/>
      {/* 前爪（枕着） */}
      <Ellipse cx="6" cy="32" rx="2.5" ry="2" fill={BODY_COLOR} stroke={color} strokeWidth="1.8"/>
      {/* 后脚 */}
      <Ellipse cx="38" cy="32" rx="2.5" ry="2" fill={BODY_COLOR} stroke={color} strokeWidth="1.8"/>
      {/* 腮红 */}
      <Ellipse cx="14" cy="30" rx="1.8" ry="1" fill={BLUSH} opacity="0.5"/>
      {/* 闭眼（弧线） */}
      <Path d="M9 27 Q11 29 13 27" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* 放松的嘴 */}
      <Path d="M10 31 Q11 32 12 31" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </Svg>
  ),
  // 难过：坐姿+耳朵下垂+闭眼大哭+大颗蓝色泪滴
  sad: (color, size) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* 尾巴 */}
      <Path d="M32 34 C36 33 38 37 36 40 C34 42 31 40 32 37" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB} strokeLinejoin="round"/>
      {/* 左耳 - 下垂 */}
      <Path d="M15 18 C9 18 6 26 7 32 C8 36 12 35 14 30 L15 18" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN} strokeLinejoin="round"/>
      {/* 右耳 - 下垂 */}
      <Path d="M33 18 C39 18 42 26 41 32 C40 36 36 35 34 30 L33 18" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN} strokeLinejoin="round"/>
      {/* 身体（坐姿，微微前倾） */}
      <Ellipse cx="24" cy="34" rx="9" ry="8" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN}/>
      {/* 头部 */}
      <Ellipse cx="24" cy="22" rx="9" ry="8" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN}/>
      {/* 左脚 */}
      <Ellipse cx="19" cy="41" rx="3" ry="2" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB}/>
      {/* 右脚 */}
      <Ellipse cx="29" cy="41" rx="3" ry="2" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB}/>
      {/* 双爪放在腿上 */}
      <Ellipse cx="18" cy="32" rx="2.5" ry="2" fill={BODY_COLOR} stroke={color} strokeWidth="1.8"/>
      <Ellipse cx="30" cy="32" rx="2.5" ry="2" fill={BODY_COLOR} stroke={color} strokeWidth="1.8"/>
      {/* 腮红 */}
      <Ellipse cx="17" cy="25" rx="2" ry="1.2" fill={BLUSH} opacity="0.5"/>
      <Ellipse cx="31" cy="25" rx="2" ry="1.2" fill={BLUSH} opacity="0.5"/>
      {/* 闭眼大哭 */}
      <Path d="M17 21 Q19 23 21 21" stroke={color} strokeWidth={SW_DETAIL} strokeLinecap="round" fill="none"/>
      <Path d="M27 21 Q29 23 31 21" stroke={color} strokeWidth={SW_DETAIL} strokeLinecap="round" fill="none"/>
      {/* 张开的哭嘴 */}
      <Path d="M21 27 Q24 31 27 27" stroke={color} strokeWidth={SW_DETAIL} strokeLinecap="round" fill={BLUSH} fillOpacity="0.3"/>
      {/* 大颗蓝色泪滴（深蓝轮廓） */}
      <Path d="M17 23 Q15 29 17 32 Q19 29 17 23" fill={TEAR_BLUE} stroke={color} strokeWidth="1.2"/>
      <Path d="M31 23 Q33 29 31 32 Q29 29 31 23" fill={TEAR_BLUE} stroke={color} strokeWidth="1.2"/>
    </Svg>
  ),
  // 兴奋/梦幻：坐姿+双手托腮+闭眼幸福+三颗星星（黄粉蓝）
  excited: (color, size) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* 头顶三颗星星：黄、粉、蓝 */}
      <Path d="M14 6 L15 8 L17 8.3 L15.5 9.8 L16 12 L14 10.8 L12 12 L12.5 9.8 L11 8.3 L13 8 Z" fill={STAR_YELLOW} stroke={color} strokeWidth="0.8"/>
      <Path d="M30 4 L30.8 5.8 L32.8 6 L31.4 7.3 L31.8 9.3 L30 8.3 L28.2 9.3 L28.6 7.3 L27.2 6 L29.2 5.8 Z" fill={BLUSH} stroke={color} strokeWidth="0.8"/>
      <Path d="M38 10 L38.6 11.3 L40 11.5 L39 12.5 L39.2 14 L38 13.2 L36.8 14 L37 12.5 L36 11.5 L37.4 11.3 Z" fill={TEAR_BLUE} stroke={color} strokeWidth="0.8"/>
      {/* 尾巴（小卷） */}
      <Path d="M33 33 C37 31 39 35 37 38 C35 40 32 38 33 35" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB} strokeLinejoin="round"/>
      {/* 左耳 */}
      <Path d="M15 17 C10 15 7 22 8 28 C9 32 13 31 14 27 L15 17" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN} strokeLinejoin="round"/>
      {/* 右耳 */}
      <Path d="M33 17 C38 15 41 22 40 28 C39 32 35 31 34 27 L33 17" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN} strokeLinejoin="round"/>
      {/* 身体（坐姿） */}
      <Ellipse cx="24" cy="34" rx="9" ry="8" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN}/>
      {/* 头部 */}
      <Ellipse cx="24" cy="22" rx="9" ry="8" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN}/>
      {/* 左爪托腮 */}
      <Path d="M17 24 C15 25 14 28 16 30 C18 30 19 27 19 25" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB} strokeLinejoin="round"/>
      {/* 右爪托腮 */}
      <Path d="M31 24 C33 25 34 28 32 30 C30 30 29 27 29 25" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB} strokeLinejoin="round"/>
      {/* 左脚 */}
      <Ellipse cx="19" cy="41" rx="3" ry="2" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB}/>
      {/* 右脚 */}
      <Ellipse cx="29" cy="41" rx="3" ry="2" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB}/>
      {/* 腮红 */}
      <Ellipse cx="18" cy="25" rx="2.2" ry="1.3" fill={BLUSH} opacity="0.7"/>
      <Ellipse cx="30" cy="25" rx="2.2" ry="1.3" fill={BLUSH} opacity="0.7"/>
      {/* 闭眼幸福微笑 */}
      <Path d="M17 21 Q19 24 21 21" stroke={color} strokeWidth={SW_DETAIL} strokeLinecap="round" fill="none"/>
      <Path d="M27 21 Q29 24 31 21" stroke={color} strokeWidth={SW_DETAIL} strokeLinecap="round" fill="none"/>
      {/* 幸福的嘴 */}
      <Path d="M22 27 Q24 29 26 27" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </Svg>
  ),
  // 生气：站姿+耳朵竖起+斜眉+生气符号+攥拳
  angry: (color, size) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* 左耳 - 竖起 */}
      <Path d="M15 15 C12 8 11 2 15 1 C18 2 19 9 20 15" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN} strokeLinejoin="round"/>
      {/* 右耳 - 竖起 */}
      <Path d="M33 15 C36 8 37 2 33 1 C30 2 29 9 28 15" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN} strokeLinejoin="round"/>
      {/* 尾巴 */}
      <Path d="M31 31 C35 29 37 33 35 36 C33 38 30 36 31 33" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB} strokeLinejoin="round"/>
      {/* 身体（站姿） */}
      <Ellipse cx="24" cy="33" rx="8" ry="9" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN}/>
      {/* 头部 */}
      <Ellipse cx="24" cy="20" rx="9" ry="8" fill={BODY_COLOR} stroke={color} strokeWidth={SW_MAIN}/>
      {/* 左爪（攥拳在身前） */}
      <Ellipse cx="16" cy="32" rx="2.5" ry="3" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB}/>
      {/* 右爪（攥拳在身前） */}
      <Ellipse cx="32" cy="32" rx="2.5" ry="3" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB}/>
      {/* 左脚 */}
      <Ellipse cx="20" cy="42" rx="2.5" ry="2" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB}/>
      {/* 右脚 */}
      <Ellipse cx="28" cy="42" rx="2.5" ry="2" fill={BODY_COLOR} stroke={color} strokeWidth={SW_SUB}/>
      {/* 左侧生气符号（3条弯曲hash marks） */}
      <G stroke={ANGRY_RED} strokeWidth="1.5" strokeLinecap="round">
        <Path d="M13 22 Q15 21 14 19"/>
        <Path d="M12 24 Q14 23 13 21"/>
        <Path d="M11 26 Q13 25 12 23"/>
      </G>
      {/* 右侧生气符号 */}
      <G stroke={ANGRY_RED} strokeWidth="1.5" strokeLinecap="round">
        <Path d="M35 22 Q33 21 34 19"/>
        <Path d="M36 24 Q34 23 35 21"/>
        <Path d="M37 26 Q35 25 36 23"/>
      </G>
      {/* 腮红 */}
      <Ellipse cx="17" cy="24" rx="2" ry="1.2" fill={BLUSH} opacity="0.6"/>
      <Ellipse cx="31" cy="24" rx="2" ry="1.2" fill={BLUSH} opacity="0.6"/>
      {/* 斜眉 */}
      <Path d="M16 18 L21 20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Path d="M27 20 L32 18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      {/* 生气眯眼 */}
      <Path d="M17 22 L20 21" stroke={color} strokeWidth={SW_DETAIL} strokeLinecap="round"/>
      <Path d="M28 21 L31 22" stroke={color} strokeWidth={SW_DETAIL} strokeLinecap="round"/>
      {/* 向下撇的嘴 */}
      <Path d="M21 27 Q24 24 27 27" stroke={color} strokeWidth={SW_DETAIL} strokeLinecap="round" fill="none"/>
    </Svg>
  ),
};

export { MOOD_ICONS };

/**
 * 获取心情图标（支持自定义图标）
 * @param mood 心情类型
 * @param color 颜色
 * @param size 尺寸
 * @param customIcon 自定义图标 base64，传 null 或不传则使用默认 SVG
 */
export function getMoodIcon(
  mood: MoodType,
  color: string,
  size: number,
  customIcon?: string | null,
): React.ReactElement {
  if (customIcon) {
    return (
      <Image
        source={{ uri: customIcon }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return MOOD_ICONS[mood](color, size);
}

/**
 * Hook 版本：从 store 读取自定义图标并返回对应心情图标
 */
export function useMoodIcon(mood: MoodType, color: string, size: number): React.ReactElement {
  const customIcon = useMoodStore((s) => s.customIcons[mood]);
  return getMoodIcon(mood, color, size, customIcon);
}

// 莫兰迪色系
export const MOOD_OPTIONS: MoodOption[] = [
  { mood: 'happy', label: '开心', color: '#E8A0B0' },
  { mood: 'calm', label: '一般', color: '#A3B9A8' },
  { mood: 'tired', label: '疲惫', color: '#B0A8B9' },
  { mood: 'sad', label: '难过', color: '#8BA8C4' },
  { mood: 'excited', label: '兴奋', color: '#D4A96A' },
  { mood: 'angry', label: '生气', color: '#C47A6D' },
];

export function getMoodInfo(mood: MoodType): MoodOption {
  return MOOD_OPTIONS.find((m) => m.mood === mood) || MOOD_OPTIONS[0];
}

interface MoodPickerProps {
  selectedMood: MoodType | null;
  onSelect: (mood: MoodType) => void;
  size?: 'small' | 'large';
}

export function MoodPicker({ selectedMood, onSelect, size = 'large' }: MoodPickerProps) {
  const isSmall = size === 'small';
  const iconSize = isSmall ? 28 : 38;
  const customIcons = useMoodStore((s) => s.customIcons);

  return (
    <View style={[styles.container, isSmall && styles.containerSmall]}>
      {MOOD_OPTIONS.map((option) => {
        const isSelected = selectedMood === option.mood;
        return (
          <TouchableOpacity
            key={option.mood}
            style={[
              isSmall ? styles.moodItemSmall : styles.moodItem,
              isSelected && {
                backgroundColor: option.color + '18',
                borderColor: option.color,
                transform: [{ scale: 1.08 }],
              },
            ]}
            onPress={() => onSelect(option.mood)}
            activeOpacity={0.7}
          >
            {getMoodIcon(
              option.mood,
              isSelected ? option.color : (option.color + 'AA'),
              iconSize,
              customIcons[option.mood],
            )}
            <Text
              style={[
                isSmall ? styles.labelSmall : styles.label,
                isSelected && { color: option.color, fontWeight: '600' },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  containerSmall: {
    gap: spacing.xs,
  },
  moodItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 52,
  },
  moodItemSmall: {
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minWidth: 44,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 6,
    fontSize: 11,
  },
  labelSmall: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 10,
  },
});
