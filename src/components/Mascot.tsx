import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { CinnamorollMascot } from './CinnamorollMascot';
import { useMascotStore } from '@/stores/mascot.store';
import type { MascotExpression, HeadShape, BodyShape, EarShape, PartSize } from '@/types';

interface MascotProps {
  size?: number;
  expression?: MascotExpression;
  animated?: boolean;
  /** 圆形头像模式（上传图片时裁剪为圆形） */
  circular?: boolean;
  /** 形状/大小覆盖（用于形象设置实时预览） */
  headShape?: HeadShape;
  headSize?: PartSize;
  bodyShape?: BodyShape;
  bodySize?: PartSize;
  earShape?: EarShape;
  earSize?: PartSize;
}

export function Mascot({
  size = 120,
  expression,
  animated = true,
  circular = false,
  headShape,
  headSize,
  bodyShape,
  bodySize,
  earShape,
  earSize,
}: MascotProps) {
  const mascotConfig = useMascotStore((s) => s.mascotConfig);

  const floatY = useSharedValue(0);

  React.useEffect(() => {
    if (animated && mascotConfig.type === 'cinnamoroll') {
      floatY.value = withRepeat(
        withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    }
  }, [animated, mascotConfig.type]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const actualSize = size * mascotConfig.size;
  const actualExpression = expression || mascotConfig.expression;

  if (mascotConfig.type === 'upload' && mascotConfig.customImageUri) {
    return (
      <Animated.View style={floatStyle}>
        <View
          style={[
            styles.imageContainer,
            circular && styles.circular,
            { width: actualSize, height: actualSize, borderRadius: circular ? actualSize / 2 : 0 },
          ]}
        >
          <Image
            source={{ uri: mascotConfig.customImageUri }}
            style={{ width: actualSize, height: actualSize }}
            resizeMode="cover"
          />
        </View>
      </Animated.View>
    );
  }

  return (
    <CinnamorollMascot
      size={actualSize}
      expression={actualExpression}
      animated={animated}
      bodyColor={mascotConfig.bodyColor}
      cheekColor={mascotConfig.cheekColor}
      earColor={mascotConfig.earColor}
      headShape={headShape ?? mascotConfig.headShape}
      headSize={headSize ?? mascotConfig.headSize}
      bodyShape={bodyShape ?? mascotConfig.bodyShape}
      bodySize={bodySize ?? mascotConfig.bodySize}
      earShape={earShape ?? mascotConfig.earShape}
      earSize={earSize ?? mascotConfig.earSize}
    />
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    overflow: 'hidden',
  },
  circular: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
