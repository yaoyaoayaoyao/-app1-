import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Rect, Path, G } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type {
  MascotExpression,
  HeadShape,
  BodyShape,
  EarShape,
  PartSize,
} from '@/types';

export type { MascotExpression } from '@/types';

const expressions: Record<MascotExpression, { eyeRy: number; mouthD: string; eyeStyle?: string; extra?: string }> = {
  happy: { eyeRy: 1.5, mouthD: 'M 35 52 Q 50 58 65 52' },
  sleepy: { eyeRy: 0.5, mouthD: 'M 40 53 Q 50 56 60 53' },
  excited: { eyeRy: 3, mouthD: 'M 35 50 Q 50 62 65 50' },
  sad: { eyeRy: 1, mouthD: 'M 35 56 Q 50 50 65 56' },
  shy: { eyeRy: 1.2, mouthD: 'M 38 54 Q 50 57 62 54' },
  angry: { eyeRy: 1.5, mouthD: 'M 38 55 Q 50 50 62 55' },
  love: { eyeRy: 0.3, mouthD: 'M 36 53 Q 50 60 64 53' },
};

// 部位大小系数
const SIZE_SCALE: Record<PartSize, number> = {
  small: 0.82,
  medium: 1.0,
  large: 1.18,
};

interface CinnamorollMascotProps {
  size?: number;
  expression?: MascotExpression;
  animated?: boolean;
  bodyColor?: string;
  cheekColor?: string;
  earColor?: string;
  headShape?: HeadShape;
  headSize?: PartSize;
  bodyShape?: BodyShape;
  bodySize?: PartSize;
  earShape?: EarShape;
  earSize?: PartSize;
}

export function CinnamorollMascot({
  size = 120,
  expression = 'happy',
  animated = true,
  bodyColor = '#FFFFFF',
  cheekColor = '#FFB5C5',
  earColor = '#F0F7FC',
  headShape = 'round',
  headSize = 'medium',
  bodyShape = 'round',
  bodySize = 'medium',
  earShape = 'long',
  earSize = 'medium',
}: CinnamorollMascotProps) {
  const floatY = useSharedValue(0);

  React.useEffect(() => {
    if (animated) {
      floatY.value = withRepeat(
        withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    }
  }, [animated]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const exp = expressions[expression];
  const eyeColor = '#3A4A5C';
  const strokeColor = '#E1E8ED';

  // 计算各部位几何
  const headS = SIZE_SCALE[headSize];
  const bodyS = SIZE_SCALE[bodySize];
  const earS = SIZE_SCALE[earSize];

  const headR = 32 * headS;

  const earRx = 14 * earS;
  let earRy = 22 * earS;
  if (earShape === 'round') earRy = 15 * earS;
  else if (earShape === 'short') earRy = 12 * earS;

  let bodyRx = 25 * bodyS;
  let bodyRy = 22 * bodyS;
  if (bodyShape === 'plump') {
    bodyRx = 25 * bodyS * 1.15;
    bodyRy = 22 * bodyS * 1.1;
  } else if (bodyShape === 'slim') {
    bodyRx = 25 * bodyS * 0.8;
    bodyRy = 22 * bodyS * 1.05;
  }

  return (
    <Animated.View style={floatStyle}>
      <View style={{ width: size, height: size * 1.3 }}>
        <Svg width={size} height={size * 1.3} viewBox="0 0 100 130">
          {/* 左耳朵 */}
          <Ellipse cx="28" cy="22" rx={earRx} ry={earRy} fill={bodyColor} stroke={strokeColor} strokeWidth="1" />
          <Ellipse cx="28" cy="24" rx={earRx * 0.57} ry={earRy * 0.62} fill={earColor} />
          {/* 右耳朵 */}
          <Ellipse cx="72" cy="22" rx={earRx} ry={earRy} fill={bodyColor} stroke={strokeColor} strokeWidth="1" />
          <Ellipse cx="72" cy="24" rx={earRx * 0.57} ry={earRy * 0.62} fill={earColor} />

          {/* 头部 */}
          {headShape === 'square' ? (
            <Rect
              x={50 - headR}
              y={50 - headR}
              width={headR * 2}
              height={headR * 2}
              rx={headR * 0.28}
              fill={bodyColor}
              stroke={strokeColor}
              strokeWidth="1"
            />
          ) : headShape === 'oval' ? (
            <Ellipse cx="50" cy="50" rx={headR * 1.06} ry={headR * 0.9} fill={bodyColor} stroke={strokeColor} strokeWidth="1" />
          ) : (
            <Circle cx="50" cy="50" r={headR} fill={bodyColor} stroke={strokeColor} strokeWidth="1" />
          )}

          {/* 脸颊红晕 */}
          <Circle cx="28" cy="55" r="5" fill={cheekColor} opacity="0.5" />
          <Circle cx="72" cy="55" r="5" fill={cheekColor} opacity="0.5" />

          {/* 害羞表情 - 更大的腮红 */}
          {expression === 'shy' && (
            <>
              <Circle cx="26" cy="56" r="7" fill={cheekColor} opacity="0.7" />
              <Circle cx="74" cy="56" r="7" fill={cheekColor} opacity="0.7" />
            </>
          )}

          {/* 爱心眼 */}
          {expression === 'love' ? (
            <>
              <G transform="translate(34, 46) scale(0.7)">
                <Path
                  d="M 8 12 C 3 8 0 5 0 3 C 0 0 4 0 6 2 C 7 3 8 4 8 5 C 8 4 9 3 10 2 C 12 0 16 0 16 3 C 16 5 13 8 8 12 Z"
                  fill={cheekColor}
                />
              </G>
              <G transform="translate(50, 46) scale(0.7)">
                <Path
                  d="M 8 12 C 3 8 0 5 0 3 C 0 0 4 0 6 2 C 7 3 8 4 8 5 C 8 4 9 3 10 2 C 12 0 16 0 16 3 C 16 5 13 8 8 12 Z"
                  fill={cheekColor}
                />
              </G>
            </>
          ) : (
            <>
              <Ellipse cx="40" cy="48" rx="2.5" ry={exp.eyeRy} fill={eyeColor} />
              <Ellipse cx="60" cy="48" rx="2.5" ry={exp.eyeRy} fill={eyeColor} />
            </>
          )}

          {/* 生气表情 - 眉毛 */}
          {expression === 'angry' && (
            <>
              <Path d="M 34 42 L 44 44" stroke={eyeColor} strokeWidth="1.5" strokeLinecap="round" />
              <Path d="M 66 42 L 56 44" stroke={eyeColor} strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}

          {/* 嘴巴 */}
          <Path d={exp.mouthD} stroke={eyeColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* 身体 */}
          <Ellipse cx="50" cy="100" rx={bodyRx} ry={bodyRy} fill={bodyColor} stroke={strokeColor} strokeWidth="1" />

          {/* 肚子 */}
          <Ellipse cx="50" cy="105" rx={16 * bodyS} ry={14 * bodyS} fill={earColor} opacity="0.5" />

          {/* 左脚 */}
          <Ellipse cx="38" cy="122" rx={8 * bodyS} ry={5 * bodyS} fill={bodyColor} stroke={strokeColor} strokeWidth="1" />
          {/* 右脚 */}
          <Ellipse cx="62" cy="122" rx={8 * bodyS} ry={5 * bodyS} fill={bodyColor} stroke={strokeColor} strokeWidth="1" />
        </Svg>
      </View>
    </Animated.View>
  );
}
