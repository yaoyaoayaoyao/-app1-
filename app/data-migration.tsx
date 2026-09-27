import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import {
  detectFormat,
  buildPreview,
  applyMigration,
  categoryLabel,
  type SourceFormat,
  type MigrationPreview,
  type MigrationResult,
} from '@/services/migration.service';
import { pickFileText, exportBackup } from '@/services/backup.service';
import { colors, typography, spacing, borderRadius } from '@/theme';
import type { HabitMode } from '@/types';

type Step = 'choose' | 'paste' | 'preview' | 'done';

export default function DataMigrationScreen() {
  const [step, setStep] = useState<Step>('choose');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [rawText, setRawText] = useState('');
  const [format, setFormat] = useState<SourceFormat | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<MigrationPreview | null>(null);
  const [mode, setMode] = useState<HabitMode>('record');
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeMoods, setIncludeMoods] = useState(true);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePickFile = async () => {
    setLoadingMessage('正在读取文件...');
    setLoading(true);
    setError(null);
    try {
      const picked = await pickFileText();
      if (!picked) {
        setLoading(false);
        return;
      }
      const fmt = detectFormat(picked.text);
      setLoading(false);
      if (!fmt) {
        Alert.alert('读不懂这个文件', '请选择导出的 JSON 备份，或者用「粘贴文本」的方式手动录入。');
        return;
      }
      setRawText(picked.text);
      setFormat(fmt);
      setFileName(picked.name);
      goPreview(picked.text, fmt);
    } catch (e) {
      setLoading(false);
      setError((e as Error).message);
    }
  };

  const handleParseText = () => {
    const text = rawText.trim();
    if (!text) {
      Alert.alert('还没填内容', '把备份文件的内容粘贴到下面的框里，或者每行写「习惯名,日期」。');
      return;
    }
    const fmt = detectFormat(text);
    if (!fmt) {
      Alert.alert('没认出格式', '支持三种：旧版备份 JSON、通用 JSON（习惯名+日期列表）、每行「习惯名,2026-09-23」。');
      return;
    }
    setFormat(fmt);
    setFileName(null);
    goPreview(text, fmt);
  };

  const goPreview = (text: string, fmt: SourceFormat) => {
    try {
      const p = buildPreview(text, fmt);
      setPreview(p);
      setStep('preview');
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      Alert.alert('解析失败', (e as Error).message);
    }
  };

  const handleConfirm = () => {
    if (!preview) return;
    const total = preview.newRecordCount;
    Alert.alert(
      '确认搬家',
      `将新增 ${preview.newHabitCount} 个习惯、${total} 条打卡记录${preview.mergeHabitCount > 0 ? `，合并到已有的 ${preview.mergeHabitCount} 个同名习惯` : ''}。\n\n已有的数据不会被覆盖，重复的日期会自动跳过。`,
      [
        { text: '再看看', style: 'cancel' },
        {
          text: '开始搬家',
          onPress: async () => {
            setLoadingMessage('正在搬家...');
            setLoading(true);
            try {
              const r = await applyMigration(rawText, preview.format, {
                mode,
                includeNotes,
                includeMoods,
              });
              setLoading(false);
              setResult(r);
              setStep('done');
            } catch (e) {
              setLoading(false);
              setError((e as Error).message);
              Alert.alert('搬家失败', (e as Error).message);
            }
          },
        },
      ],
    );
  };

  const handleExport = async () => {
    setLoadingMessage('正在打包备份...');
    setLoading(true);
    try {
      const r = await exportBackup();
      setLoading(false);
      Alert.alert(
        '备份已生成',
        `文件名：${r.fileName}\n大小：约 ${Math.round(r.size / 1024)} KB\n\n可以选择存到网盘、发给自己，换手机时在新 App 里选这个文件就能恢复。`,
      );
    } catch (e) {
      setLoading(false);
      Alert.alert('备份失败', (e as Error).message);
    }
  };

  return (
    <ScreenWrapper gradient="sky" safeArea={false}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => (step === 'choose' ? router.back() : setStep('choose'))}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>数据搬家</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 'choose' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>从别的地方搬过来</Text>
              <TouchableOpacity style={styles.menuItem} onPress={handlePickFile}>
                <MaterialCommunityIcons name="file-outline" size={22} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuText}>选择备份文件</Text>
                  <Text style={styles.menuSub}>从手机里挑一个导出的 JSON 文件</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textHint} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => setStep('paste')}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={22} color={colors.accentMint} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuText}>粘贴文本内容</Text>
                  <Text style={styles.menuSub}>复制文件里的文字，或手动写「习惯名,日期」</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textHint} />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>先把现在的备份一份</Text>
              <TouchableOpacity style={styles.menuItem} onPress={handleExport}>
                <MaterialCommunityIcons name="export" size={22} color={colors.accentWarm} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuText}>导出全部数据</Text>
                  <Text style={styles.menuSub}>换手机、重装 App 时可以靠它恢复</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textHint} />
              </TouchableOpacity>
            </View>

            <View style={styles.tipCard}>
              <MaterialCommunityIcons name="information-outline" size={18} color={colors.primaryDark} />
              <Text style={styles.tipText}>
                搬家只会往里「加」东西，不会删除或覆盖你现在的记录。同名的习惯会合并到同一个上，同一天重复的记录会自动跳过。
              </Text>
            </View>
          </>
        )}

        {step === 'paste' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>粘贴内容</Text>
              <Text style={styles.hint}>
                支持三种写法：{"\n"}
                1. 旧版「随身便签+习惯打卡」导出的 JSON{"\n"}
                2. 通用 JSON：{'[{ "name": "跑步", "dates": ["2026-09-01"] }]'}{"\n"}
                3. 一行一条：跑步,2026-09-01
              </Text>
              <TextInput
                style={styles.textArea}
                value={rawText}
                onChangeText={setRawText}
                multiline
                numberOfLines={12}
                textAlignVertical="top"
                placeholder={'在这里粘贴...\n\n例如：\n吃维生素,2026-09-20\n吃维生素,2026-09-21\n拖地,2026-09-20'}
                placeholderTextColor={colors.textHint}
              />
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleParseText}>
              <Text style={styles.primaryButtonText}>下一步：看看能搬多少</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'preview' && preview && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>搬家预览</Text>
              <View style={styles.statRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{preview.newHabitCount}</Text>
                  <Text style={styles.statLabel}>新增习惯</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{preview.mergeHabitCount}</Text>
                  <Text style={styles.statLabel}>合并同名</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{preview.newRecordCount}</Text>
                  <Text style={styles.statLabel}>新增打卡</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{preview.skipRecordCount}</Text>
                  <Text style={styles.statLabel}>重复跳过</Text>
                </View>
              </View>
              <Text style={styles.formatTag}>
                识别为：{preview.formatLabel}
                {fileName ? ` · ${fileName}` : ''}
              </Text>
            </View>

            {preview.warnings.length > 0 && (
              <View style={styles.tipCard}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.warning} />
                <View style={{ flex: 1 }}>
                  {preview.warnings.slice(0, 6).map((w, i) => (
                    <Text key={i} style={styles.tipText}>
                      · {w}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>这些习惯会搬进来（{preview.habits.length}）</Text>
              {preview.habits.map((h, i) => (
                <View key={`${h.name}_${i}`} style={styles.habitRow}>
                  <View style={[styles.habitIcon, { backgroundColor: h.color }]}>
                    <MaterialCommunityIcons name={h.icon as never} size={18} color={colors.textPrimary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.habitName}>
                      {h.name}
                      {h.isExisting ? ' （已有，合并）' : ''}
                    </Text>
                    <Text style={styles.habitMeta}>
                      {categoryLabel(h.category)}
                      {h.firstDate ? ` · ${h.firstDate} 起` : ''}
                      {h.lastDate && h.lastDate !== h.firstDate ? ` 到 ${h.lastDate}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.habitCount}>
                    {h.newRecordCount}
                    {h.newRecordCount !== h.recordCount ? ` / ${h.recordCount}` : ''} 条
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>搬过来算哪种打卡</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity
                  style={[styles.optionBtn, mode === 'record' && styles.optionBtnActive]}
                  onPress={() => setMode('record')}
                >
                  <Text style={[styles.optionText, mode === 'record' && styles.optionTextActive]}>记录</Text>
                  <Text style={styles.optionSub}>只留痕迹，不占今日必做进度</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionBtn, mode === 'required' && styles.optionBtnActive]}
                  onPress={() => setMode('required')}
                >
                  <Text style={[styles.optionText, mode === 'required' && styles.optionTextActive]}>必做</Text>
                  <Text style={styles.optionSub}>每天都要完成，计入进度</Text>
                </TouchableOpacity>
              </View>
            </View>

            {(preview.noteCount > 0 || preview.moodCount > 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>顺手一起搬</Text>
                {preview.noteCount > 0 && (
                  <TouchableOpacity style={styles.menuItem} onPress={() => setIncludeNotes(!includeNotes)}>
                    <MaterialCommunityIcons name="note-text-outline" size={22} color={colors.accentMint} />
                    <Text style={styles.menuText}>{preview.noteCount} 条便签</Text>
                    <MaterialCommunityIcons
                      name={includeNotes ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={22}
                      color={includeNotes ? colors.primary : colors.textHint}
                    />
                  </TouchableOpacity>
                )}
                {preview.moodCount > 0 && (
                  <TouchableOpacity style={styles.menuItem} onPress={() => setIncludeMoods(!includeMoods)}>
                    <MaterialCommunityIcons name="emoticon-outline" size={22} color={colors.accentWarm} />
                    <Text style={styles.menuText}>{preview.moodCount} 天心情记录</Text>
                    <MaterialCommunityIcons
                      name={includeMoods ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={22}
                      color={includeMoods ? colors.primary : colors.textHint}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.primaryButton} onPress={handleConfirm}>
              <Text style={styles.primaryButtonText}>确认搬家</Text>
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}
          </>
        )}

        {step === 'done' && result && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>搬家完成</Text>
              <View style={styles.doneRow}>
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
                <Text style={styles.doneText}>新增习惯 {result.habitsAdded} 个</Text>
              </View>
              {result.habitsMerged > 0 && (
                <View style={styles.doneRow}>
                  <MaterialCommunityIcons name="merge" size={20} color={colors.primary} />
                  <Text style={styles.doneText}>合并到已有习惯 {result.habitsMerged} 个</Text>
                </View>
              )}
              <View style={styles.doneRow}>
                <MaterialCommunityIcons name="calendar-check" size={20} color={colors.success} />
                <Text style={styles.doneText}>新增打卡记录 {result.recordsAdded} 条</Text>
              </View>
              {result.notesAdded > 0 && (
                <View style={styles.doneRow}>
                  <MaterialCommunityIcons name="note-text" size={20} color={colors.accentMint} />
                  <Text style={styles.doneText}>新增便签 {result.notesAdded} 条</Text>
                </View>
              )}
              {result.moodsAdded > 0 && (
                <View style={styles.doneRow}>
                  <MaterialCommunityIcons name="emoticon" size={20} color={colors.accentWarm} />
                  <Text style={styles.doneText}>新增心情 {result.moodsAdded} 天</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
              <Text style={styles.primaryButtonText}>好了，回去看看</Text>
            </TouchableOpacity>
          </>
        )}
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxl ?? 40 },
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
  menuSub: { ...typography.caption, color: colors.textHint, marginTop: 2 },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tipText: { ...typography.body2, color: colors.textSecondary, flex: 1 },
  hint: { ...typography.body2, color: colors.textSecondary, marginBottom: spacing.md },
  textArea: {
    ...typography.body2,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  primaryButtonText: { ...typography.body1, color: colors.textOnPrimary },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { ...typography.h2, color: colors.primaryDark },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  formatTag: { ...typography.caption, color: colors.textHint, marginTop: spacing.md },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  habitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitName: { ...typography.body2, color: colors.textPrimary },
  habitMeta: { ...typography.caption, color: colors.textHint, marginTop: 2 },
  habitCount: { ...typography.caption, color: colors.primaryDark },
  optionRow: { flexDirection: 'row', gap: spacing.md },
  optionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  optionBtnActive: { borderColor: colors.primary, backgroundColor: colors.surfaceVariant },
  optionText: { ...typography.body1, color: colors.textPrimary },
  optionTextActive: { color: colors.primaryDark },
  optionSub: { ...typography.caption, color: colors.textHint, marginTop: 2 },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  doneText: { ...typography.body1, color: colors.textPrimary },
  errorText: { ...typography.body2, color: colors.error, marginBottom: spacing.lg },
});
