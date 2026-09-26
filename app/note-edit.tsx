import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { useNotesStore } from '@/stores/notes.store';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { NOTE_TAG_LABELS } from '@/utils/constants';
import { generateId } from '@/utils/id';
import type { NoteTag, ChecklistItem } from '@/types';

export default function NoteEditScreen() {
  const { noteId } = useLocalSearchParams<{ noteId?: string }>();
  const { notes, addNote, editNote, removeNote, loading } = useNotesStore();

  const existingNote = notes.find((n) => n.id === noteId);
  const isEditing = !!existingNote;

  const [title, setTitle] = useState(existingNote?.title || '');
  const [content, setContent] = useState(existingNote?.content || '');
  const [colorIndex, setColorIndex] = useState(existingNote?.colorIndex ?? 0);
  const [tag, setTag] = useState<NoteTag>(existingNote?.tag || 'plain');
  const [isChecklist, setIsChecklist] = useState(
    existingNote?.checklistItems !== null && existingNote?.checklistItems !== undefined && existingNote?.checklistItems.length > 0,
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>(existingNote?.checklistItems || []);
  const [newItemText, setNewItemText] = useState('');

  const handleSave = async () => {
    if (!title.trim() && !content.trim() && checklist.length === 0) {
      router.back();
      return;
    }

    if (isEditing && existingNote) {
      await editNote(existingNote.id, {
        title: title.trim(),
        content: content.trim(),
        colorIndex,
        tag,
        checklistItems: isChecklist ? checklist : null,
      });
    } else {
      await addNote({
        title: title.trim(),
        content: content.trim(),
        colorIndex,
        tag,
        checklistItems: isChecklist ? checklist : null,
      });
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('删除便签', '确定要删除这条便签吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          if (existingNote) {
            await removeNote(existingNote.id);
          }
          router.back();
        },
      },
    ]);
  };

  const addChecklistItem = () => {
    if (!newItemText.trim()) return;
    setChecklist([...checklist, { id: generateId(), text: newItemText.trim(), done: false }]);
    setNewItemText('');
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(checklist.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  return (
    <ScreenWrapper gradient="mint" safeArea={false}>
      {/* 顶部操作栏 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{isEditing ? '编辑便签' : '新建便签'}</Text>
        <TouchableOpacity onPress={handleSave}>
          <MaterialCommunityIcons name="check" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 颜色选择 */}
        <View style={styles.colorRow}>
          {colors.noteColors.map((color, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.colorDot, { backgroundColor: color }, colorIndex === index && styles.colorDotSelected]}
              onPress={() => setColorIndex(index)}
            />
          ))}
        </View>

        {/* 标题 */}
        <TextInput
          style={styles.titleInput}
          placeholder="标题"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={colors.textHint}
        />

        {/* 清单/文本切换 */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIsChecklist(!isChecklist)}
        >
          <MaterialCommunityIcons
            name={isChecklist ? 'format-list-checks' : 'format-text'}
            size={20}
            color={colors.primary}
          />
          <Text style={styles.toggleText}>{isChecklist ? '清单模式' : '文本模式'}</Text>
        </TouchableOpacity>

        {/* 内容区域 */}
        {isChecklist ? (
          <View style={styles.checklistContainer}>
            {checklist.map((item) => (
              <View key={item.id} style={styles.checklistItemRow}>
                <TouchableOpacity onPress={() => toggleChecklistItem(item.id)}>
                  <MaterialCommunityIcons
                    name={item.done ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={22}
                    color={item.done ? colors.success : colors.textSecondary}
                  />
                </TouchableOpacity>
                <Text style={[styles.checklistItemText, item.done && styles.checklistItemDone]}>{item.text}</Text>
                <TouchableOpacity onPress={() => removeChecklistItem(item.id)}>
                  <MaterialCommunityIcons name="close" size={18} color={colors.textHint} />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.addItemRow}>
              <TextInput
                style={styles.addItemInput}
                placeholder="添加新项目..."
                value={newItemText}
                onChangeText={setNewItemText}
                onSubmitEditing={addChecklistItem}
                placeholderTextColor={colors.textHint}
              />
              <TouchableOpacity onPress={addChecklistItem}>
                <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TextInput
            style={styles.contentInput}
            placeholder="写点什么吧..."
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            placeholderTextColor={colors.textHint}
          />
        )}

        {/* 标签选择 */}
        <Text style={styles.label}>标签</Text>
        <View style={styles.tagRow}>
          {Object.entries(NOTE_TAG_LABELS).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.tagChip, tag === key && styles.tagChipSelected]}
              onPress={() => setTag(key as NoteTag)}
            >
              <Text style={[styles.tagText, tag === key && styles.tagTextSelected]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isEditing && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
            <Text style={styles.deleteText}>删除便签</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <LoadingOverlay visible={loading} message="保存中..." />
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
    marginTop: 40,
  },
  topTitle: { ...typography.h3, color: colors.textPrimary },
  content: { padding: spacing.lg },
  colorRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: colors.textPrimary },
  titleInput: {
    ...typography.h2,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  toggleButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  toggleText: { ...typography.body2, color: colors.primary },
  contentInput: {
    ...typography.body1,
    color: colors.textPrimary,
    minHeight: 200,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  checklistContainer: { gap: spacing.sm, marginBottom: spacing.lg },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  checklistItemText: { ...typography.body1, color: colors.textPrimary, flex: 1 },
  checklistItemDone: { textDecorationLine: 'line-through', color: colors.textHint },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface + '80',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  addItemInput: { ...typography.body1, flex: 1, color: colors.textPrimary },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  tagChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 999, backgroundColor: colors.surface },
  tagChipSelected: { backgroundColor: colors.primary },
  tagText: { ...typography.body2, color: colors.textSecondary },
  tagTextSelected: { color: colors.textOnPrimary },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  deleteText: { ...typography.body1, color: colors.error },
});
