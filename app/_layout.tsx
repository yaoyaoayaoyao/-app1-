import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider, DefaultTheme } from 'react-native-paper';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { useUpdateStore } from '@/stores/update.store';
import { colors } from '@/theme';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { Mascot } from '@/components/Mascot';
import { View, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    accent: colors.accentWarm,
    background: colors.background,
    surface: colors.surface,
    text: colors.textPrimary,
  },
};

export default function RootLayout() {
  const { initialized, initUser } = useAuthStore();
  const currentTheme = useThemeStore((s) => s.currentTheme);
  const checkUpdate = useUpdateStore((s) => s.checkUpdate);

  // 加载图标字体（修复 Web 端图标显示为方块的问题）
  const [fontsLoaded, fontError] = useFonts({
    'Material Community Icons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
  });

  useEffect(() => {
    initUser();
    // 启动时静默检查更新（不自动弹窗，只更新 store 状态，Banner 自然显示）
    const timer = setTimeout(() => {
      checkUpdate(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [initUser, checkUpdate]);

  // 字体加载失败时在控制台打印错误
  useEffect(() => {
    if (fontError) {
      console.warn('[Font] 图标字体加载失败:', fontError);
    }
  }, [fontError]);

  if (!initialized || !fontsLoaded) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: currentTheme.background }]}>
        <Mascot size={150} expression="happy" />
        <LoadingOverlay visible={true} message="玉桂狗正在飞来..." />
      </View>
    );
  }

  const dynamicPaperTheme = {
    ...paperTheme,
    colors: {
      ...paperTheme.colors,
      primary: currentTheme.primary,
      accent: currentTheme.accentWarm,
      background: currentTheme.background,
      surface: currentTheme.surface,
      text: currentTheme.textPrimary,
    },
  };

  return (
    <PaperProvider theme={dynamicPaperTheme}>
      <View style={styles.rootContainer}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="note-edit" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="food-edit" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="journal-edit" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="mood-history" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="mascot-settings" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="theme-settings" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="ai-settings" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
