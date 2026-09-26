import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUpdateStore, reloadApp } from '@/stores/update.store';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
}

export function UpdateModal({ visible, onClose }: UpdateModalProps) {
  const updateInfo = useUpdateStore((s) => s.updateInfo);
  const isDownloading = useUpdateStore((s) => s.isDownloading);
  const downloadProgress = useUpdateStore((s) => s.downloadProgress);
  const isDownloaded = useUpdateStore((s) => s.isDownloaded);
  const applyUpdate = useUpdateStore((s) => s.applyUpdate);

  const handleApplyUpdate = async () => {
    await applyUpdate();
  };

  const handleRestart = async () => {
    await reloadApp();
  };

  const handleClose = () => {
    // 下载中不允许关闭
    if (isDownloading) return;
    onClose();
  };

  if (!updateInfo) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* 顶部装饰条 */}
          <View style={styles.topBar} />

          {/* 标题区 */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="package-up" size={32} color={colors.primary} />
            </View>
            <Text style={styles.title}>
              发现新版本 v{updateInfo.version}
            </Text>
            <Text style={styles.dateText}>更新日期：{updateInfo.date}</Text>
          </View>

          {/* 更新日志列表 */}
          <ScrollView
            style={styles.changelogScroll}
            contentContainerStyle={styles.changelogContent}
            showsVerticalScrollIndicator={false}
          >
            {updateInfo.changes.map((change, index) => (
              <View key={index} style={styles.changelogItem}>
                <Text style={styles.changelogIcon}>✨</Text>
                <Text style={styles.changelogText}>{change}</Text>
              </View>
            ))}
          </ScrollView>

          {/* 下载进度条 */}
          {isDownloading && (
            <View style={styles.progressSection}>
              <View style={styles.progressBarWrap}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${downloadProgress}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                正在下载更新... {downloadProgress}%
              </Text>
            </View>
          )}

          {/* 下载完成提示 */}
          {isDownloaded && !isDownloading && (
            <View style={styles.readySection}>
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
              <Text style={styles.readyText}>更新已就绪</Text>
            </View>
          )}

          {/* 按钮区 */}
          <View style={styles.buttonRow}>
            {isDownloaded ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleRestart}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="restart" size={20} color="#FFF" />
                <Text style={styles.primaryButtonText}>重启应用</Text>
              </TouchableOpacity>
            ) : isDownloading ? (
              <View style={[styles.primaryButton, styles.primaryButtonDisabled]}>
                <Text style={styles.primaryButtonText}>下载中...</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>稍后再说</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleApplyUpdate}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="download" size={18} color="#FFF" />
                  <Text style={styles.primaryButtonText}>立即更新</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  topBar: {
    height: 6,
    backgroundColor: colors.primary,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight + '60',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // 更新日志
  changelogScroll: {
    maxHeight: 220,
    paddingHorizontal: spacing.lg,
  },
  changelogContent: {
    paddingVertical: spacing.sm,
  },
  changelogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  changelogIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  changelogText: {
    ...typography.body2,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },

  // 下载进度
  progressSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  progressBarWrap: {
    height: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // 下载完成
  readySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  readyText: {
    ...typography.body1,
    color: colors.success,
    fontWeight: '600',
  },

  // 按钮区
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.textHint,
  },
  primaryButtonText: {
    ...typography.buttonLabel,
    color: '#FFF',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
    ...typography.buttonLabel,
    color: colors.textSecondary,
  },
});
