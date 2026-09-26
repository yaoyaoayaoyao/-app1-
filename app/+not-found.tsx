import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, Link } from 'expo-router';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { Mascot } from '@/components/Mascot';
import { colors, typography, spacing, borderRadius } from '@/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '页面不存在', headerShown: false }} />
      <ScreenWrapper gradient="sky" safeArea={false}>
        <View style={styles.container}>
          <Mascot size={120} expression="sad" />

          <Text style={styles.title}>哎呀~</Text>
          <Text style={styles.subtitle}>这个页面不存在哦</Text>
          <Text style={styles.description}>
            玉桂狗找不到你要去的地方{'\n'}
            是不是迷路了呢？
          </Text>

          <Link href="/" asChild>
            <TouchableOpacity style={styles.button}>
              <MaterialCommunityIcons name="home" size={20} color={colors.textOnPrimary} />
              <Text style={styles.buttonText}>返回首页</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScreenWrapper>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: spacing.xl,
  },
  subtitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  description: {
    ...typography.body1,
    color: colors.textHint,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
    lineHeight: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  buttonText: {
    ...typography.buttonLabel,
    color: colors.textOnPrimary,
  },
});
