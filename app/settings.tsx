import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { useAuthStore } from '@/stores/auth.store';
import { importAllSeedData, clearAllUserData } from '@/services/seed.service';
import { getCurrentVersion } from '@/services/update.service';
import { useUpdateStore } from '@/stores/update.store';
import { colors, typography, spacing, borderRadius } from '@/theme';

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(user?.displayName || '');

  const checkUpdate = useUpdateStore((s) => s.checkUpdate);
  const applyUpdate = useUpdateStore((s) => s.applyUpdate);
  const { version: currentVersion } = getCurrentVersion();

  const handleCheckUpdate = async () => {
    setLoadingMessage('正在检查更新...');
    setLoading(true);
    try {
      await checkUpdate(false);
      const { hasUpdate, updateInfo } = useUpdateStore.getState();
      setLoading(false);
      if (hasUpdate && updateInfo) {
        Alert.alert(
          `发现新版本 v${updateInfo.version}`,
          `更新内容：\n${updateInfo.changes.map((c) => `· ${c}`).join('\n')}`,
          [
            { text: '稍后', style: 'cancel' },
            { text: '立即下载', onPress: () => applyUpdate() },
          ],
        );
      } else {
        Alert.alert('已是最新版本', `当前版本 v${currentVersion}\n（发布日期：${getCurrentVersion().buildDate}）`);
      }
    } catch (e) {
      setLoading(false);
      Alert.alert('检查失败', (e as Error).message);
    }
  };

  const handleImportSeedData = () => {
    Alert.alert('导入数据', '将导入22个习惯和153条打卡记录，确定吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '导入',
        onPress: async () => {
          setLoadingMessage('正在导入数据...');
          setLoading(true);
          try {
            const result = await importAllSeedData();
            setLoading(false);
            Alert.alert('导入成功！', `已导入 ${result.habits} 个习惯、${result.checkIns} 条打卡记录、${result.notes} 条便签。`);
          } catch (e) {
            setLoading(false);
            Alert.alert('导入失败', (e as Error).message);
          }
        },
      },
    ]);
  };

  const handleClearAllData = () => {
    Alert.alert('清空数据', '确定要清空所有数据吗？此操作不可恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定清空',
        style: 'destructive',
        onPress: () => {
          Alert.alert('再次确认', '真的要清空所有数据吗？', [
            { text: '取消', style: 'cancel' },
            {
              text: '确认清空',
              style: 'destructive',
              onPress: async () => {
                setLoadingMessage('正在清空数据...');
                setLoading(true);
                try {
                  await clearAllUserData();
                  setLoading(false);
                  Alert.alert('已清空', '所有数据已清除。');
                } catch (e) {
                  setLoading(false);
                  Alert.alert('清空失败', (e as Error).message);
                }
              },
            },
          ]);
        },
      },
    ]);
  };

  const handleEditName = () => {
    setTempName(user?.displayName || '');
    setEditingName(true);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      updateProfile({ displayName: tempName.trim() });
    }
    setEditingName(false);
  };

  return (
    <ScreenWrapper gradient="sky" safeArea={false}>
      {/* 顶部栏 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>设置</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 用户信息卡片 */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: user?.avatarColor || colors.primary }]}>
            <Text style={styles.avatarText}>{user?.displayName?.[0] || '玉'}</Text>
          </View>
          <View style={styles.profileInfo}>
            {editingName ? (
              <View style={styles.editNameRow}>
                <TextInput
                  style={styles.nameInput}
                  value={tempName}
                  onChangeText={setTempName}
                  autoFocus
                  onSubmitEditing={handleSaveName}
                />
                <TouchableOpacity onPress={handleSaveName}>
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.nameRow} onPress={handleEditName}>
                <Text style={styles.profileName}>{user?.displayName || '玉桂狗'}</Text>
                <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.textHint} />
              </TouchableOpacity>
            )}
            <Text style={styles.profileEmail}>本地单机版</Text>
          </View>
        </View>

        {/* 数据管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据管理</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleImportSeedData}
          >
            <MaterialCommunityIcons name="download" size={22} color={colors.accentMint} />
            <Text style={styles.menuText}>导入 22 个习惯 + 153 条打卡记录</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textHint} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleClearAllData}
          >
            <MaterialCommunityIcons name="delete-outline" size={22} color={colors.error} />
            <Text style={[styles.menuText, { color: colors.error }]}>清空所有数据</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textHint} />
          </TouchableOpacity>
        </View>

        {/* 关于 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleCheckUpdate}>
            <MaterialCommunityIcons name="update" size={22} color={colors.primary} />
            <Text style={styles.menuText}>检查更新</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textHint} />
          </TouchableOpacity>
          <View style={styles.menuItem}>
            <MaterialCommunityIcons name="information" size={22} color={colors.textSecondary} />
            <Text style={styles.menuText}>版本</Text>
            <Text style={styles.menuValue}>{currentVersion}</Text>
          </View>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert(
                '关于',
                `玉桂狗日记 v${currentVersion}\n发布日期：${getCurrentVersion().buildDate}\n更新通道：${getCurrentVersion().channel}\n\n一个可爱的日常打卡和便签App\n记录每一天的美好\n\n纯本地单机版，数据保存在设备上`,
              )
            }
          >
            <MaterialCommunityIcons name="heart" size={22} color={colors.accentWarm} />
            <Text style={styles.menuText}>关于玉桂狗日记</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LoadingOverlay visible={loading} message={loadingMessage} />
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { ...typography.h2, color: colors.textOnPrimary },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nameInput: {
    ...typography.h2,
    color: colors.textPrimary,
    flex: 1,
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  profileName: { ...typography.h2, color: colors.textPrimary },
  profileEmail: { ...typography.body2, color: colors.textSecondary, marginTop: spacing.xs },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.md },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  menuText: { ...typography.body1, color: colors.textPrimary, flex: 1 },
  menuValue: { ...typography.body2, color: colors.textHint },
});
