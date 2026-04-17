import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';

interface FillBlankQuestionProps {
  question: string;
  value: string;
  onChange: (text: string) => void;
  disabled?: boolean;
  correctAnswer?: string;
  showResult?: boolean;
}

export function FillBlankQuestion({
  question,
  value,
  onChange,
  disabled = false,
  correctAnswer,
  showResult = false,
}: FillBlankQuestionProps) {
  const isCorrect = showResult && value.trim().toLowerCase() === correctAnswer?.trim().toLowerCase();
  const isIncorrect = showResult && !isCorrect;

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            showResult && isCorrect && styles.inputCorrect,
            showResult && isIncorrect && styles.inputIncorrect,
          ]}
          value={value}
          onChangeText={onChange}
          placeholder="Type your answer..."
          placeholderTextColor={colors.textMuted}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
        {showResult && isIncorrect && correctAnswer && (
          <View style={styles.correctRow}>
            <Text style={styles.correctLabel}>Correct answer:</Text>
            <Text style={styles.correctValue}>{correctAnswer}</Text>
          </View>
        )}
      </View>
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
  inputWrapper: {
    gap: spacing.md,
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
    fontSize: 18,
    textAlign: 'center',
  },
  inputCorrect: {
    borderColor: colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  inputIncorrect: {
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  correctRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  correctLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  correctValue: {
    ...typography.bodyBold,
    color: colors.success,
  },
});
