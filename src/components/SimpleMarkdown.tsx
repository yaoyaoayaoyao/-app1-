import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/theme';

/**
 * 简易 Markdown 渲染组件
 * 支持格式：
 * - ## 标题 → 加粗大字
 * - - 列表项 → 带圆点的行
 * - 普通段落 → 正文
 * - 空行 → 段间距
 * - **加粗** → 粗体
 */
interface SimpleMarkdownProps {
  content: string;
}

interface Block {
  type: 'heading' | 'list' | 'paragraph';
  text?: string;
  items?: string[];
}

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 空行跳过
    if (trimmed === '') {
      i++;
      continue;
    }

    // 标题：## xxx
    if (trimmed.startsWith('## ')) {
      blocks.push({
        type: 'heading',
        text: trimmed.replace(/^##\s+/, '').trim(),
      });
      i++;
      continue;
    }

    // 标题：# xxx
    if (trimmed.startsWith('# ')) {
      blocks.push({
        type: 'heading',
        text: trimmed.replace(/^#\s+/, '').trim(),
      });
      i++;
      continue;
    }

    // 列表项：- xxx 或 • xxx
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (t.startsWith('- ') || t.startsWith('• ') || t.startsWith('* ')) {
          items.push(t.replace(/^[-•*]\s*/, '').trim());
          i++;
        } else if (t === '') {
          // 列表中的空行，结束列表
          i++;
          break;
        } else {
          // 非列表项，结束
          break;
        }
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    // 普通段落：收集连续非空行
    const paraLines: string[] = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (t === '' || t.startsWith('## ') || t.startsWith('# ') ||
          t.startsWith('- ') || t.startsWith('• ') || t.startsWith('* ')) {
        break;
      }
      paraLines.push(t);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
    }
  }

  return blocks;
}

/**
 * 渲染带 **加粗** 的文本片段
 */
function renderInlineText(text: string, keyPrefix: string, baseStyle: any) {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let partIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Text key={`${keyPrefix}-t${partIndex}`} style={baseStyle}>
          {text.slice(lastIndex, match.index)}
        </Text>
      );
      partIndex++;
    }
    parts.push(
      <Text key={`${keyPrefix}-b${partIndex}`} style={[baseStyle, { fontWeight: '700' }]}>
        {match[1]}
      </Text>
    );
    partIndex++;
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(
      <Text key={`${keyPrefix}-t${partIndex}`} style={baseStyle}>
        {text.slice(lastIndex)}
      </Text>
    );
  }

  if (parts.length === 0) {
    return <Text style={baseStyle}>{text}</Text>;
  }
  return <Text>{parts}</Text>;
}

export function SimpleMarkdown({ content }: SimpleMarkdownProps) {
  const blocks = parseBlocks(content);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <Text key={`h-${index}`} style={styles.heading}>
              {block.text}
            </Text>
          );
        }
        if (block.type === 'list' && block.items) {
          return (
            <View key={`l-${index}`} style={styles.listContainer}>
              {block.items.map((item, idx) => (
                <View key={`li-${index}-${idx}`} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>
                    {renderInlineText(item, `i-${index}-${idx}`, styles.listText)}
                  </Text>
                </View>
              ))}
            </View>
          );
        }
        if (block.type === 'paragraph') {
          return (
            <Text key={`p-${index}`} style={styles.paragraph}>
              {renderInlineText(block.text || '', `p-${index}`, styles.paragraph)}
            </Text>
          );
        }
        return null;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  heading: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  paragraph: {
    ...typography.body1,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: spacing.xs,
  },
  listContainer: {
    marginBottom: spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 3,
    paddingLeft: spacing.sm,
  },
  bullet: {
    ...typography.body1,
    color: colors.primary,
    marginRight: spacing.sm,
    marginTop: 0,
    lineHeight: 24,
    fontWeight: '700',
  },
  listText: {
    ...typography.body1,
    color: colors.textPrimary,
    lineHeight: 24,
    flex: 1,
  },
});
