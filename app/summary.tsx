import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { Mascot } from '@/components/Mascot';
import { SimpleMarkdown } from '@/components/SimpleMarkdown';
import { useAIStore, type SummaryRecord } from '@/stores/ai.store';
import { generateSummary, shareSummary } from '@/services/ai.service';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import type { SummaryPeriod } from '@/types';

export default function SummaryScreen() {
  const isConfigured = useAIStore((s) => s.isConfigured);
  const summaries = useAIStore((s) => s.summaries);
  const deleteSummary = useAIStore((s) => s.deleteSummary);

  const [selectedPeriod, setSelectedPeriod] = useState<SummaryPeriod>('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSummary, setCurrentSummary] = useState<SummaryRecord | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const periodConfig: Record<SummaryPeriod, { label: string; icon: string }> = {
    daily: { label: '今日', icon: 'calendar-today' },
    weekly: { label: '本周', icon: 'calendar-week' },
    monthly: { label: '本月', icon: 'calendar-month' },
  };

  const handleGenerate = useCallback(async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    // 创建 AbortController 支持取消
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const record = await generateSummary(selectedPeriod, controller.signal);
      setCurrentSummary(record);
    } catch (e) {
      const msg = (e as Error).message || '生成失败';
      // 如果是取消导致的错误，不显示
      if (msg.includes('abort') || msg.includes('Abort')) {
        setError(null);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [loading, selectedPeriod]);

  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
  };

  const handleShare = async (record: SummaryRecord) => {
    try {
      const msg = await shareSummary(record);
      Alert.alert(msg);
    } catch (e) {
      Alert.alert('分享失败', (e as Error).message);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('删除总结', '确定要删除这条总结吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          deleteSummary(id);
          if (currentSummary?.id === id) {
            setCurrentSummary(null);
          }
        },
      },
    ]);
  };

  // 显示总结内容（当前生成的或选中的历史记录）
  const displaySummary = currentSummary || summaries.find((s) => s.id === expandedId) || null;

  return (
    <ScreenWrapper gradient="lavender">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 头部 */}
        <View style={styles.header}>
          <Mascot size={80} expression="happy" />
          <Text style={styles.title}>AI总结</Text>
          <Text style={styles.subtitle}>让玉桂狗帮你回顾每一天</Text>
        </View>

        {/* 周期选择 */}
        <View style={styles.periodRow}>
          {(['daily', 'weekly', 'monthly'] as SummaryPeriod[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodChip, selectedPeriod === p && styles.periodChipSelected]}
              onPress={() => {
                setSelectedPeriod(p);
                setCurrentSummary(null);
                setError(null);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={periodConfig[p].icon as any}
                size={18}
                color={selectedPeriod === p ? colors.textOnPrimary : colors.textSecondary}
              />
              <Text style={[styles.periodText, selectedPeriod === p && styles.periodTextSelected]}>
                {periodConfig[p].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 未配置 AI 时的提示 */}
        {!isConfigured ? (
          <View style={styles.configPromptCard}>
            <View style={styles.configPromptIconWrap}>
              <MaterialCommunityIcons name="robot-confused-outline" size={40} color={colors.accentLavender} />
            </View>
            <Text style={styles.configPromptTitle}>需要配置 AI 服务</Text>
            <Text style={styles.configPromptText}>
              AI 总结功能需要联网调用 AI API。{'\n'}
              请先配置你的 API 密钥，支持 OpenAI、{'\n'}
              DeepSeek 等兼容格式。密钥只保存在本地。
            </Text>
            <TouchableOpacity
              style={styles.configBtn}
              onPress={() => router.push('/ai-settings' as any)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="cog" size={20} color={colors.textOnPrimary} />
              <Text style={styles.configBtnText}>去配置</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* 生成总结按钮 */}
            {!displaySummary && !loading && !error && (
              <LinearGradient
                colors={[colors.accentLavender, colors.primary]}
                style={styles.generateBtn}
              >
                <TouchableOpacity
                  onPress={handleGenerate}
                  activeOpacity={0.85}
                  style={styles.generateBtnInner}
                >
                  <MaterialCommunityIcons name={"sparkles" as any} size={24} color={colors.textOnPrimary} />
                  <Text style={styles.generateBtnText}>生成{periodConfig[selectedPeriod].label}总结</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}

            {/* Loading 状态 */}
            {loading && (
              <View style={styles.loadingCard}>
                <Mascot size={100} expression="excited" animated={true} />
                <Text style={styles.loadingText}>玉桂狗正在认真总结中...</Text>
                <Text style={styles.loadingSubtext}>这可能需要几秒钟</Text>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>取消</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 错误提示 */}
            {error && !loading && (
              <View style={styles.errorCard}>
                <MaterialCommunityIcons name="alert-circle-outline" size={32} color={colors.error} />
                <Text style={styles.errorTitle}>生成失败</Text>
                <Text style={styles.errorText}>{error}</Text>
                {error.includes('密钥') || error.includes('配置') ? (
                  <TouchableOpacity
                    style={styles.errorConfigBtn}
                    onPress={() => router.push('/ai-settings' as any)}
                  >
                    <Text style={styles.errorConfigBtnText}>去配置</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={handleGenerate}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="refresh" size={18} color={colors.textOnPrimary} />
                    <Text style={styles.retryBtnText}>重试</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 总结内容展示 */}
            {displaySummary && !loading && (
              <View style={styles.summaryCard}>
                {/* 日期标签 */}
                <View style={styles.summaryHeader}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateBadgeText}>{displaySummary.date}</Text>
                  </View>
                  <View style={styles.summaryActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleShare(displaySummary)}
                    >
                      <MaterialCommunityIcons name="share-variant" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        setCurrentSummary(null);
                        setExpandedId(null);
                      }}
                    >
                      <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Markdown 内容 */}
                <SimpleMarkdown content={displaySummary.content} />

                {/* 情绪标签 */}
                {displaySummary.mood && (
                  <View style={styles.moodTag}>
                    <Text style={styles.moodTagLabel}>💕 {displaySummary.mood}</Text>
                  </View>
                )}

                {/* 重新生成按钮 */}
                <TouchableOpacity
                  style={styles.regenBtn}
                  onPress={() => {
                    setCurrentSummary(null);
                    setTimeout(handleGenerate, 100);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="refresh" size={18} color={colors.primary} />
                  <Text style={styles.regenBtnText}>重新生成</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 历史总结列表 */}
            {!loading && summaries.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.historyTitle}>历史总结</Text>
                {summaries
                  .filter((s) => s.id !== displaySummary?.id)
                  .map((record) => {
                    const isExpanded = expandedId === record.id;
                    return (
                      <View key={record.id} style={styles.historyItem}>
                        <TouchableOpacity
                          style={styles.historyItemHeader}
                          onPress={() => {
                            if (isExpanded) {
                              setExpandedId(null);
                              setCurrentSummary(null);
                            } else {
                              setExpandedId(record.id);
                              setCurrentSummary(null);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.historyPeriodBadge}>
                            <Text style={styles.historyPeriodText}>
                              {periodConfig[record.period].label}
                            </Text>
                          </View>
                          <View style={styles.historyDateWrap}>
                            <Text style={styles.historyDateText}>{record.date}</Text>
                            <Text style={styles.historyMoodPreview}>{record.mood}</Text>
                          </View>
                          <MaterialCommunityIcons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={colors.textHint}
                          />
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={styles.historyExpanded}>
                            <SimpleMarkdown content={record.content} />
                            <View style={styles.historyItemActions}>
                              <TouchableOpacity
                                style={styles.historyActionBtn}
                                onPress={() => handleShare(record)}
                              >
                                <MaterialCommunityIcons name="share-variant" size={16} color={colors.primary} />
                                <Text style={styles.historyActionText}>分享</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.historyActionBtn, { borderColor: colors.error + '30' }]}
                                onPress={() => handleDelete(record.id)}
                              >
                                <MaterialCommunityIcons name="delete-outline" size={16} color={colors.error} />
                                <Text style={[styles.historyActionText, { color: colors.error }]}>删除</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
              </View>
            )}

            {/* 空状态 */}
            {!loading && !displaySummary && !error && summaries.length === 0 && (
              <View style={styles.emptyState}>
                <Mascot size={100} expression="sleepy" />
                <Text style={styles.emptyText}>
                  还没有{periodConfig[selectedPeriod].label}的总结哦~{'\n'}
                  点击上方按钮生成第一份总结吧！
                </Text>
              </View>
            )}
          </>
        )}

        {/* 底部 */}
        <View style={styles.bottomMascot}>
          <Mascot size={100} expression="sleepy" />
          <Text style={styles.bottomText}>玉桂狗会一直陪着你~</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
    paddingTop: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  periodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  periodChipSelected: {
    backgroundColor: colors.primary,
  },
  periodText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  periodTextSelected: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },

  // 未配置提示
  configPromptCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  configPromptIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentLavender + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  configPromptTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  configPromptText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  configBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  configBtnText: {
    ...typography.buttonLabel,
    color: colors.textOnPrimary,
  },

  // 生成按钮
  generateBtn: {
    borderRadius: borderRadius.pill,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  generateBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  generateBtnText: {
    ...typography.buttonLabel,
    color: colors.textOnPrimary,
    fontSize: 17,
  },

  // Loading
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  loadingText: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  loadingSubtext: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  cancelBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surfaceVariant,
  },
  cancelBtnText: {
    ...typography.body2,
    color: colors.textSecondary,
  },

  // 错误
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.error,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  errorText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  errorConfigBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  errorConfigBtnText: {
    ...typography.buttonLabel,
    color: colors.textOnPrimary,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  retryBtnText: {
    ...typography.buttonLabel,
    color: colors.textOnPrimary,
  },

  // 总结卡片
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateBadge: {
    backgroundColor: colors.accentLavender + '20',
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  dateBadgeText: {
    ...typography.label,
    color: colors.accentLavender,
    fontWeight: '600',
  },
  summaryActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodTag: {
    marginTop: spacing.md,
    backgroundColor: colors.accentWarm + '20',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  moodTagLabel: {
    ...typography.body2,
    color: colors.accentWarm,
    fontWeight: '600',
  },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surfaceVariant,
  },
  regenBtnText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },

  // 历史总结
  historySection: {
    marginBottom: spacing.lg,
  },
  historyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  historyItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.sm,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  historyPeriodBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  historyPeriodText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  historyDateWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyDateText: {
    ...typography.body2,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  historyMoodPreview: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  historyExpanded: {
    padding: spacing.md,
    paddingTop: 0,
  },
  historyItemActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    justifyContent: 'flex-end',
  },
  historyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  historyActionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },

  // 空状态
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.md,
  },

  // 底部
  bottomMascot: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  bottomText: {
    ...typography.body2,
    color: colors.textHint,
    marginTop: spacing.sm,
  },
});
