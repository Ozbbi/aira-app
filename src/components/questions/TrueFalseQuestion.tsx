import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { haptics } from '../../utils/haptics';
import { colors, typography, spacing, radius } from '../../theme';

interface TrueFalseQuestionProps {
  question: string;
  selected: boolean | null;
  onSelect: (value: boolean) => void;
  disabled?: boolean;
  correctAnswer?: boolean;
  showResult?: boolean;
}

export function TrueFalseQuestion({
  question,
  selected,
  onSelect,
  disabled = false,
  correctAnswer,
  showResult = false,
}: TrueFalseQuestionProps) {
  const handleSelect = (value: boolean) => {
    if (disabled) return;
    haptics.select();
    onSelect(value);
  };

  const getButtonStyle = (value: boolean) => {
    if (!showResult) {
      return selected === value ? styles.btnSelected : styles.btnDefault;
    }
    if (value === correctAnswer) return styles.btnCorrect;
    if (value === selected && value !== correctAnswer) return styles.btnIncorrect;
    return styles.btnDefault;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.buttons}>
        <Pressable
          onPress={() => handleSelect(true)}
          disabled={disabled}
          style={styles.btnWrapper}
        >
          <View style={[styles.btn, getButtonStyle(true)]}>
            <Text style={styles.btnText}>True</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => handleSelect(false)}
          disabled={disabled}
          style={styles.btnWrapper}
        >
          <View style={[styles.btn, getButtonStyle(false)]}>
            <Text style={styles.btnText}>False</Text>
          </View>
        </Pressable>
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
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  btnWrapper: {
    flex: 1,
  },
  btn: {
    paddingVertical: spacing.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
  },
  btnDefault: {
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  btnSelected: {
    borderColor: colors.purple,
    backgroundColor: colors.bgCardHover,
  },
  btnCorrect: {
    borderColor: colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  btnIncorrect: {
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  btnText: {
    ...typography.h3,
    color: colors.textPrimary,
  },
});
