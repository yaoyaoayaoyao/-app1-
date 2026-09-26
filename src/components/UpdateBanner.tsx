import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUpdateStore, reloadApp } from '@/stores/update.store';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';

// Android 需要手动启用 LayoutAnimation
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function UpdateBanner() {
  const hasUpdate = useUpdateStore((s) => s.hasUpdate);
  const updateInfo = useUpdateStore((s) => s.updateInfo);
  const isDismissed = useUpdateStore((s) => s.isDismissed);
  const dismissUpdate = useUpdateStore((s) => s.dismissUpdate);
  const isDownloading = useUpdateStore((s) => s.isDownloading);
  const downloadProgress = useUpdateStore((s) => s.downloadProgress);
  const isDownloaded = useUpdateStore((s) => s.isDownloaded);
  const applyUpdate = useUpdateStore((s) => s.applyUpdate);

  const [expanded, setExpanded] = useState(false);

  // 不显示条件：无更新 / 已忽略 / 已下载完成（交给 Modal 处理重启）
  if (!hasUpdate || isDismissed || isDownloaded) return null;

  const handleToggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const handleApplyUpdate = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await applyUpdate();
  };

  const handleDismiss = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    dismissUpdate();
  };

  const versionLabel = updateInfo ? `v${updateInfo.version}` : '';

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#FFB5C5', '#FF9EB3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* 顶部摘要行 */}
        <TouchableOpacity
          style={styles.headerRow}
          onPress={handleToggleExpand}
          activeOpacity={0.8}
        >
          <Text style={styles.newIcon}>🆕</Text>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              发现新版本 {versionLabel}
            </Text>
            <Text style={styles.headerSubtitle}>点击查看更新内容</Text>
          </View>
          {isDownloading ? (
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>{downloadProgress}%</Text>
            </View>
          ) : (
            <MaterialCommunityIcons
              name={expanded ? 'chevron-up' : 'chevron-right'}
              size={22}
              color="#FFF"
            />
          )}
          {/* 关闭按钮 */}
          {!isDownloading && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleDismiss}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="close" size={16} color="#FFF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* 下载进度条 */}
        {isDownloading && (
          <View style={styles.progressBarWrap}>
            <View
              style={[styles.progressBarFill, { width: `${downloadProgress}%` }]}
            />
          </View>
        )}

        {/* 展开内容：更新日志 + 更新按钮 */}
        {expanded && !isDownloading && (
          <View style={styles.expandedContent}>
            {/* 更新日期 */}
            {updateInfo && (
              <Text style={styles.updateDate}>
                更新日期：{updateInfo.date}
              </Text>
            )}

            {/* 更新日志列表 */}
            <View style={styles.changelogList}>
              {updateInfo?.changes.map((change, index) => (
                <View key={index} style={styles.changelogItem}>
                  <Text style={styles.changelogDot}>✨</Text>
                  <Text style={styles.changelogText}>{change}</Text>
                </View>
              ))}
            </View>

            {/* 立即更新按钮 */}
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleApplyUpdate}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="download" size={18} color="#FF6B85" />
              <Text style={styles.updateButtonText}>立即更新</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  } as ViewStyle,
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newIcon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    ...typography.body1,
    color: '#FFF',
    fontWeight: '700',
  },
  headerSubtitle: {
    ...typography.caption,
    color: '#FFFFFFCC',
    marginTop: 2,
  },
  progressBadge: {
    backgroundColor: '#FFFFFF40',
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  progressText: {
    ...typography.caption,
    color: '#FFF',
    fontWeight: '700',
  },
  closeBtn: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },

  // 进度条
  progressBarWrap: {
    height: 6,
    backgroundColor: '#FFFFFF40',
    borderRadius: 3,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 3,
  },

  // 展开内容
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF30',
  },
  updateDate: {
    ...typography.caption,
    color: '#FFFFFFCC',
    marginBottom: spacing.sm,
  },
  changelogList: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  changelogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  changelogDot: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  changelogText: {
    ...typography.body2,
    color: '#FFF',
    flex: 1,
    lineHeight: 22,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  updateButtonText: {
    ...typography.buttonLabel,
    color: '#FF6B85',
  },
});
