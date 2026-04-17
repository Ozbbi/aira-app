import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';

interface PromptWriteQuestionProps {
  question: string;
  value: string;
  onChange: (text: string) => void;
  disabled?: boolean;
  keywords?: string[];
  showResult?: boolean;
  isCorrect?: boolean;
}

export function PromptWriteQuestion({
  question,
  value,
  onChange,
  disabled = false,
  keywords,
  showResult = false,
  isCorrect = false,
}: PromptWriteQuestionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      <TextInput
        style={[
          styles.input,
          showResult && isCorrect && styles.inputCorrect,
          showResult && !isCorrect && styles.inputIncorrect,
        ]}
        value={value}
        onChangeText={onChange}
        placeholder="Write your prompt here..."
        placeholderTextColor={colors.textMuted}
        editable={!disabled}
        multiline
        textAlignVertical="top"
        returnKeyType="default"
      />
      <Text style={styles.hint}>
        Write a complete prompt — be specific and conversational.
      </Text>
      {showResult && keywords && keywords.length > 0 && (
        <View style={styles.keywordsRow}>
          <Text style={styles.keywordsLabel}>Key elements:</Text>
          <View style={styles.keywords}>
            {keywords.map((kw) => {
              const found = value.toLowerCase().includes(kw.toLowerCase());
              return (
                <View key={kw} style={[styles.chip, found ? styles.chipFound : styles.chipMissing]}>
                  <Text style={[styles.chipText, found ? styles.chipTextFound : styles.chipTextMissing]}>
                    {kw}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  question: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 120,
  },
  inputCorrect: {
    borderColor: colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  inputIncorrect: {
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  keywordsRow: {
    marginTop: spacing.lg,
  },
  keywordsLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  keywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipFound: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.success,
  },
  chipMissing: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.error,
  },
  chipText: {
    ...typography.caption,
    fontSize: 12,
  },
  chipTextFound: {
    color: colors.success,
  },
  chipTextMissing: {
    color: colors.error,
  },
});
