import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { useAIStore, AI_PROVIDERS, type AIConfigEntry, type AIProvider } from '@/stores/ai.store';
import { testConnection } from '@/services/ai.service';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';

export default function AISettingsScreen() {
  const configs = useAIStore((s) => s.configs);
  const addConfig = useAIStore((s) => s.addConfig);
  const updateConfig = useAIStore((s) => s.updateConfig);
  const deleteConfig = useAIStore((s) => s.deleteConfig);
  const moveConfig = useAIStore((s) => s.moveConfig);
  const toggleConfig = useAIStore((s) => s.toggleConfig);
  const resetConfig = useAIStore((s) => s.resetConfig);

  const [showPresets, setShowPresets] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // 每个配置的密钥显示状态
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddFromPreset = (provider: AIProvider) => {
    if (provider.id === 'custom') {
      addConfig({
        name: '新配置',
        apiEndpoint: '',
        apiKey: '',
        model: '',
        enabled: true,
      });
    } else {
      addConfig({
        name: provider.name,
        apiEndpoint: provider.apiEndpoint,
        apiKey: '',
        model: provider.model,
        enabled: true,
      });
    }
    setShowPresets(false);
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(configs);
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('删除配置', `确定要删除「${name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          deleteConfig(id);
          setTestResult(null);
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert('清除所有配置', '确定要清除所有 AI 配置吗？历史总结会保留。', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: () => {
          resetConfig();
          setTestResult(null);
          Alert.alert('已清除', '所有 AI 配置已清除');
        },
      },
    ]);
  };

  return (
    <ScreenWrapper gradient="lavender" safeArea={false}>
      {/* 顶部栏 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>AI 设置</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 说明卡片 */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="robot-happy" size={28} color={colors.accentLavender} />
          <Text style={styles.infoTitle}>AI 总结服务</Text>
          <Text style={styles.infoText}>
            支持多配置轮换，兼容 OpenAI 格式的 API。{'\n'}
            一个配置失败时自动尝试下一个。{'\n'}
            密钥只保存在本地，不会上传。
          </Text>
        </View>

        {/* 添加配置区域 */}
        <View style={styles.addSection}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowPresets(!showPresets)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.textOnPrimary} />
            <Text style={styles.addBtnText}>添加配置</Text>
          </TouchableOpacity>
        </View>

        {/* 预设列表 */}
        {showPresets && (
          <View style={styles.presetList}>
            <Text style={styles.presetListTitle}>选择预设快速添加</Text>
            {AI_PROVIDERS.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={styles.presetItem}
                onPress={() => handleAddFromPreset(provider)}
                activeOpacity={0.7}
              >
                <View style={styles.presetItemLeft}>
                  <Text style={styles.presetItemName}>{provider.name}</Text>
                  <Text style={styles.presetItemDesc}>{provider.description}</Text>
                </View>
                <MaterialCommunityIcons name="plus-circle" size={22} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 配置列表 */}
        {configs.length === 0 ? (
          <View style={styles.emptyConfigCard}>
            <MaterialCommunityIcons name="cloud-off-outline" size={36} color={colors.textHint} />
            <Text style={styles.emptyConfigText}>暂无配置</Text>
            <Text style={styles.emptyConfigSubtext}>
              点击上方"添加配置"按钮开始配置 AI 服务
            </Text>
          </View>
        ) : (
          <View style={styles.configList}>
            {configs.map((config, index) => (
              <ConfigCard
                key={config.id}
                config={config}
                index={index}
                total={configs.length}
                keyVisible={!!visibleKeys[config.id]}
                onToggleKey={() => toggleKeyVisibility(config.id)}
                onUpdate={(partial) => updateConfig(config.id, partial)}
                onToggle={() => toggleConfig(config.id)}
                onMoveUp={() => moveConfig(config.id, 'up')}
                onMoveDown={() => moveConfig(config.id, 'down')}
                onDelete={() => handleDelete(config.id, config.name)}
              />
            ))}
          </View>
        )}

        {/* 测试结果 */}
        {testResult && (
          <View style={[styles.testResult, testResult.success ? styles.testSuccess : styles.testError]}>
            <MaterialCommunityIcons
              name={testResult.success ? 'check-circle' : 'alert-circle'}
              size={20}
              color={testResult.success ? colors.success : colors.error}
            />
            <Text
              style={[
                styles.testResultText,
                { color: testResult.success ? colors.success : colors.error },
              ]}
              numberOfLines={4}
            >
              {testResult.message}
            </Text>
          </View>
        )}

        {/* 测试连接按钮 */}
        <TouchableOpacity
          style={[styles.testBtn, configs.length === 0 && styles.testBtnDisabled]}
          onPress={handleTest}
          disabled={testing || configs.length === 0}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="connection" size={20} color={colors.textPrimary} />
          <Text style={styles.testBtnText}>{testing ? '测试中...' : '测试连接'}</Text>
        </TouchableOpacity>

        {/* 清除所有配置 */}
        {configs.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll} activeOpacity={0.7}>
            <MaterialCommunityIcons name="delete-outline" size={18} color={colors.error} />
            <Text style={styles.clearBtnText}>清除所有 AI 配置</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <LoadingOverlay visible={testing} message="正在测试连接..." />
    </ScreenWrapper>
  );
}

// === 单个配置卡片组件 ===
interface ConfigCardProps {
  config: AIConfigEntry;
  index: number;
  total: number;
  keyVisible: boolean;
  onToggleKey: () => void;
  onUpdate: (partial: Partial<AIConfigEntry>) => void;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

function ConfigCard({
  config,
  index,
  total,
  keyVisible,
  onToggleKey,
  onUpdate,
  onToggle,
  onMoveUp,
  onMoveDown,
  onDelete,
}: ConfigCardProps) {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <View style={[styles.configCard, !config.enabled && styles.configCardDisabled]}>
      {/* 卡片头部 */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityBadgeText}>{index + 1}</Text>
          </View>
          <TextInput
            style={[styles.configNameInput, !config.enabled && styles.textDisabled]}
            value={config.name}
            onChangeText={(text) => onUpdate({ name: text })}
            placeholder="配置名称"
            placeholderTextColor={colors.textHint}
            autoCapitalize="none"
            autoCorrect={false}
            editable={config.enabled}
          />
        </View>
        <Switch
          value={config.enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.surfaceVariant, true: colors.primary + '80' }}
          thumbColor={config.enabled ? colors.primary : colors.textHint}
        />
      </View>

      {/* 配置字段 */}
      <View style={styles.cardBody}>
        {/* API 地址 */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>API 地址</Text>
          <TextInput
            style={[styles.input, !config.enabled && styles.inputDisabled]}
            value={config.apiEndpoint}
            onChangeText={(text) => onUpdate({ apiEndpoint: text })}
            placeholder="https://api.openai.com/v1/chat/completions"
            placeholderTextColor={colors.textHint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={Platform.OS === 'web' ? 'url' : 'default'}
            editable={config.enabled}
          />
        </View>

        {/* API 密钥 */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>API 密钥</Text>
          <View style={styles.keyRow}>
            <TextInput
              style={[styles.input, { flex: 1 }, !config.enabled && styles.inputDisabled]}
              value={config.apiKey}
              onChangeText={(text) => onUpdate({ apiKey: text })}
              placeholder="sk-..."
              placeholderTextColor={colors.textHint}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!keyVisible}
              editable={config.enabled}
            />
            <TouchableOpacity
              style={[styles.eyeBtn, !config.enabled && styles.btnDisabled]}
              onPress={onToggleKey}
              disabled={!config.enabled}
            >
              <MaterialCommunityIcons
                name={keyVisible ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={config.enabled ? colors.textSecondary : colors.textHint}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 模型名 */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>模型名称</Text>
          <TextInput
            style={[styles.input, !config.enabled && styles.inputDisabled]}
            value={config.model}
            onChangeText={(text) => onUpdate({ model: text })}
            placeholder="gpt-4o-mini"
            placeholderTextColor={colors.textHint}
            autoCapitalize="none"
            autoCorrect={false}
            editable={config.enabled}
          />
        </View>
      </View>

      {/* 卡片操作栏 */}
      <View style={styles.cardActions}>
        <View style={styles.moveButtons}>
          <TouchableOpacity
            style={[styles.moveBtn, isFirst && styles.btnDisabled]}
            onPress={onMoveUp}
            disabled={isFirst}
          >
            <MaterialCommunityIcons
              name="chevron-up"
              size={18}
              color={isFirst ? colors.textHint : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.moveBtn, isLast && styles.btnDisabled]}
            onPress={onMoveDown}
            disabled={isLast}
          >
            <MaterialCommunityIcons
              name="chevron-down"
              size={18}
              color={isLast ? colors.textHint : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
          <Text style={styles.deleteBtnText}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    paddingBottom: 100,
  },

  // 说明卡片
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  infoTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // 添加配置
  addSection: {
    marginBottom: spacing.md,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  addBtnText: {
    ...typography.body1,
    color: colors.textOnPrimary,
    fontWeight: '600',
  },

  // 预设列表
  presetList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  presetListTitle: {
    ...typography.label,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  presetItemLeft: {
    flex: 1,
  },
  presetItemName: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  presetItemDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // 空配置提示
  emptyConfigCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  emptyConfigText: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyConfigSubtext: {
    ...typography.body2,
    color: colors.textHint,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // 配置卡片列表
  configList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  configCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  configCardDisabled: {
    opacity: 0.6,
  },

  // 卡片头部
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentLavender + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityBadgeText: {
    ...typography.caption,
    color: colors.accentLavender,
    fontWeight: '700',
  },
  configNameInput: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
    padding: 0,
  },
  textDisabled: {
    color: colors.textHint,
  },

  // 卡片主体
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    paddingTop: spacing.md,
  },

  // 表单字段
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceVariant + '50',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body1,
    color: colors.textPrimary,
  },
  inputDisabled: {
    backgroundColor: colors.surfaceVariant + '30',
    color: colors.textHint,
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eyeBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant + '50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },

  // 卡片操作栏
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  moveButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  moveBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceVariant + '50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  deleteBtnText: {
    ...typography.body2,
    color: colors.error,
  },

  // 测试结果
  testResult: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  testSuccess: {
    backgroundColor: colors.accentMint + '20',
  },
  testError: {
    backgroundColor: colors.error + '15',
  },
  testResultText: {
    ...typography.body2,
    flex: 1,
    lineHeight: 20,
  },

  // 按钮
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  testBtnDisabled: {
    opacity: 0.5,
  },
  testBtnText: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  clearBtnText: {
    ...typography.body2,
    color: colors.error,
  },
});
