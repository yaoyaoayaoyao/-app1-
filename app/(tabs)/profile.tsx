import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { Mascot } from '@/components/Mascot';
import { MoodPicker, getMoodInfo } from '@/components/MoodPicker';
import { MoodCalendar } from '@/components/MoodCalendar';
import { UpdateModal } from '@/components/UpdateModal';
import { useAuthStore } from '@/stores/auth.store';
import { useCheckInStore } from '@/stores/checkin.store';
import { useNotesStore } from '@/stores/notes.store';
import { useMoodStore } from '@/stores/mood.store';
import { useMascotStore } from '@/stores/mascot.store';
import { useThemeStore } from '@/stores/theme.store';
import { useUpdateStore } from '@/stores/update.store';
import { useAIStore } from '@/stores/ai.store';
import { getCurrentVersion } from '@/services/update.service';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import type { MoodType, MascotExpression } from '@/types';
import { getTodayString } from '@/utils/date';

// 心情到吉祥物表情的映射
const moodToExpression: Record<MoodType, MascotExpression> = {
  happy: 'happy',
  calm: 'sleepy',
  tired: 'sleepy',
  sad: 'sad',
  excited: 'excited',
  angry: 'angry',
};

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const currentTheme = useThemeStore((s) => s.currentTheme);
  const habits = useCheckInStore((s) => s.habits.filter((h) => !h.archived));
  const checkIns = useCheckInStore((s) => s.checkIns);
  const notes = useNotesStore((s) => s.notes);
  const todayEntry = useMoodStore((s) => s.getTodayEntry());
  const addEntry = useMoodStore((s) => s.addEntry);
  const setExpression = useMascotStore((s) => s.setExpression);
  const { checkUpdate, lastCheckTime, isChecking } = useUpdateStore();
  const aiConfigured = useAIStore((s) => s.isConfigured);

  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(user?.displayName || '');
  const [editingBio, setEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState('玉桂狗陪你记录每一天~');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [moodContent, setMoodContent] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateToast, setUpdateToast] = useState('');

  // 初始化今日心情
  useEffect(() => {
    if (todayEntry) {
      setSelectedMood(todayEntry.mood);
      setMoodContent(todayEntry.content);
    }
  }, [todayEntry?.id]);

  // 心情变化时联动吉祥物表情
  useEffect(() => {
    if (selectedMood) {
      setExpression(moodToExpression[selectedMood]);
    } else {
      setExpression('happy');
    }
  }, [selectedMood, setExpression]);

  // 今日打卡统计
  const todayStats = useMemo(() => {
    const today = getTodayString();
    const todayCheckIns = checkIns.filter((c) => c.date === today && c.completed);
    const totalHabits = habits.length;
    return {
      completed: todayCheckIns.length,
      total: totalHabits,
      noteCount: notes.length,
    };
  }, [checkIns, habits, notes]);

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

  const handleSaveMood = () => {
    if (!selectedMood) {
      Alert.alert('提示', '请选择一个心情哦~');
      return;
    }
    addEntry(selectedMood, moodContent);
    const moodLabel = getMoodInfo(selectedMood).label;
    Alert.alert('心情已记录', `今天是${moodLabel}的一天！玉桂狗也感受到啦~`);
  };

  // 检查更新
  const handleCheckUpdate = async () => {
    await checkUpdate(false);
    const { hasUpdate } = useUpdateStore.getState();
    if (hasUpdate) {
      setShowUpdateModal(true);
    } else {
      setUpdateToast('已是最新版本！');
      setTimeout(() => setUpdateToast(''), 2500);
    }
  };

  // 格式化上次检查时间
  const lastCheckText = lastCheckTime
    ? `上次检查：${format(lastCheckTime, 'MM-dd HH:mm')}`
    : '尚未检查';

  const menuItems = [
    {
      icon: 'heart',
      label: '心情日历',
      subtitle: '回顾每天的心情',
      color: colors.accentWarm,
      onPress: () => router.push('/mood-history' as any),
    },
    {
      icon: 'face-profile',
      label: '形象设置',
      subtitle: '自定义玉桂狗形象',
      color: colors.accentWarm,
      onPress: () => router.push('/mascot-settings' as any),
    },
    {
      icon: 'image-outline',
      label: '心情图标',
      subtitle: '自定义每个心情的图标',
      color: colors.accentWarm,
      onPress: () => router.push('/mood-icon-settings' as any),
    },
    {
      icon: 'palette',
      label: '主题设置',
      subtitle: currentTheme.name,
      color: colors.primary,
      onPress: () => router.push('/theme-settings' as any),
    },
    {
      icon: 'robot-happy',
      label: 'AI 总结',
      subtitle: aiConfigured ? '已配置 · 回顾成长轨迹' : '未配置 · 点击去设置',
      color: colors.accentLavender,
      onPress: () => router.push('/summary'),
    },
    {
      icon: 'cog-outline',
      label: 'AI 设置',
      subtitle: aiConfigured ? '已配置 · 点击管理' : '配置 API 密钥',
      color: colors.accentLavender,
      onPress: () => router.push('/ai-settings' as any),
    },
    {
      icon: 'database',
      label: '数据管理',
      subtitle: '导入、导出、清空数据',
      color: colors.accentMint,
      onPress: () => router.push('/settings'),
    },
    {
      icon: 'cellphone-link',
      label: '检查更新',
      subtitle: isChecking ? '正在检查...' : `v${getCurrentVersion().version} · ${lastCheckText}`,
      color: colors.primaryDark,
      onPress: handleCheckUpdate,
    },
    {
      icon: 'information',
      label: '关于',
      subtitle: `版本 ${getCurrentVersion().version}`,
      color: colors.textSecondary,
      onPress: () => router.push('/modal'),
    },
  ];

  return (
    <ScreenWrapper gradient="sky" useThemeGradient>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* === 顶部形象区 === */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.mascotContainer}
            onPress={() => router.push('/mascot-settings' as any)}
            activeOpacity={0.8}
          >
            <Mascot size={100} />
            <View style={styles.editBadge}>
              <MaterialCommunityIcons name="pencil" size={14} color={colors.textOnPrimary} />
            </View>
          </TouchableOpacity>

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
                  <MaterialCommunityIcons name="check" size={20} color={currentTheme.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.nameRow} onPress={handleEditName}>
                <Text style={styles.profileName}>{user?.displayName || '玉桂狗'}</Text>
                <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.textHint} />
              </TouchableOpacity>
            )}

            {editingBio ? (
              <TextInput
                style={styles.bioInput}
                value={tempBio}
                onChangeText={setTempBio}
                autoFocus
                onSubmitEditing={() => setEditingBio(false)}
              />
            ) : (
              <TouchableOpacity onPress={() => setEditingBio(true)}>
                <Text style={styles.profileBio} numberOfLines={2}>
                  玉桂狗陪你记录每一天~
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* === 统计数据 === */}
        <View style={[styles.statsCard, styles.cardShadow]}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{habits.length}</Text>
            <Text style={styles.statLabel}>习惯</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{checkIns.filter((c) => c.completed).length}</Text>
            <Text style={styles.statLabel}>打卡</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{notes.length}</Text>
            <Text style={styles.statLabel}>便签</Text>
          </View>
        </View>

        {/* === 今日心情卡片 === */}
        <View style={[styles.sectionCard, styles.cardShadow]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="heart" size={20} color={colors.accentWarm} />
            <Text style={styles.sectionTitle}>今日心情</Text>
            {todayEntry && (
              <Text style={styles.moodRecordedTag}>已记录</Text>
            )}
          </View>

          <MoodPicker
            selectedMood={selectedMood}
            onSelect={setSelectedMood}
            size="small"
          />

          <TextInput
            style={styles.moodInput}
            placeholder="记录一句话心情..."
            placeholderTextColor={colors.textHint}
            value={moodContent}
            onChangeText={setMoodContent}
            multiline
            maxLength={100}
          />

          <TouchableOpacity
            style={[styles.moodSaveBtn, { backgroundColor: currentTheme.primary }]}
            onPress={handleSaveMood}
            activeOpacity={0.8}
          >
            <Text style={styles.moodSaveText}>
              {todayEntry ? '更新心情' : '记录心情'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* === 心情日历卡片（预览） === */}
        <TouchableOpacity
          style={[styles.sectionCard, styles.cardShadow]}
          onPress={() => router.push('/mood-history' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calendar-heart" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>心情日历</Text>
            <View style={styles.seeAllRow}>
              <Text style={styles.seeAllText}>查看全部</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textHint} />
            </View>
          </View>
          <MoodCalendar compact />
        </TouchableOpacity>

        {/* === 功能入口列表 === */}
        <View style={[styles.sectionCard, styles.cardShadow]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index > 0 && styles.menuItemBorder,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textHint} />
            </TouchableOpacity>
          ))}
        </View>

        {/* 底部间距 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 更新弹窗 */}
      <UpdateModal
        visible={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
      />

      {/* 已是最新版本 Toast */}
      {updateToast !== '' && (
        <View style={styles.toast}>
          <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
          <Text style={styles.toastText}>{updateToast}</Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // === 顶部形象区 ===
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  mascotContainer: {
    position: 'relative',
    marginRight: spacing.lg,
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
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
  profileName: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  profileBio: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  bioInput: {
    ...typography.body2,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },

  // === 统计卡片 ===
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.divider,
  },
  cardShadow: {
    ...shadows.md,
  },

  // === 通用区块卡片 ===
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
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
    flex: 1,
  },
  moodRecordedTag: {
    ...typography.caption,
    color: colors.accentMint,
    backgroundColor: colors.accentMint + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
    fontWeight: '500',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    ...typography.caption,
    color: colors.textHint,
  },

  // === 今日心情 ===
  moodInput: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body1,
    color: colors.textPrimary,
    minHeight: 50,
    textAlignVertical: 'top',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  moodSaveBtn: {
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  moodSaveText: {
    ...typography.body1,
    color: colors.textOnPrimary,
    fontWeight: '600',
  },

  // === 功能菜单 ===
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // === 底部间距 ===
  bottomSpacer: {
    height: 100,
  },

  // === Toast ===
  toast: {
    position: 'absolute',
    bottom: 100,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
    ...shadows.lg,
  },
  toastText: {
    ...typography.body2,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});
