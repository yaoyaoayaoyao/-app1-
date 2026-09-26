import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing } from '@/theme';
import { useThemeStore } from '@/stores/theme.store';

interface ScreenWrapperProps {
  children: React.ReactNode;
  gradient?: keyof typeof gradients;
  safeArea?: boolean;
  useThemeGradient?: boolean;
}

export function ScreenWrapper({
  children,
  gradient = 'sky',
  safeArea = true,
  useThemeGradient = false,
}: ScreenWrapperProps) {
  const currentTheme = useThemeStore((s) => s.currentTheme);
  const backgroundType = useThemeStore((s) => s.backgroundType);
  const backgroundImage = useThemeStore((s) => s.backgroundImage);
  const backgroundOpacity = useThemeStore((s) => s.backgroundOpacity);

  // 使用主题渐变色或预设渐变
  const gradientColors: [string, string] = useThemeGradient
    ? [currentTheme.gradientStart, currentTheme.gradientEnd]
    : [gradients[gradient][0], gradients[gradient][1]];

  // 根据背景类型渲染不同背景
  const renderBackground = () => {
    if (backgroundType === 'image' && backgroundImage) {
      return (
        <ImageBackground
          source={{ uri: backgroundImage }}
          style={styles.gradient}
          resizeMode="cover"
        >
          <View
            style={[
              styles.overlay,
              {
                backgroundColor: currentTheme.background,
                opacity: 1 - backgroundOpacity,
              },
            ]}
          />
          {children}
        </ImageBackground>
      );
    }

    if (backgroundType === 'color') {
      return (
        <View style={[styles.gradient, { backgroundColor: currentTheme.background }]}>
          {children}
        </View>
      );
    }

    // 默认：渐变背景
    return (
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        {children}
      </LinearGradient>
    );
  };

  const content = renderBackground();

  if (safeArea) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={currentTheme.background} />
        {content}
      </SafeAreaView>
    );
  }

  return <View style={[styles.container, { backgroundColor: currentTheme.background }]}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
