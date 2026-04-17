import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { haptics } from '../../utils/haptics';
import { colors, typography, spacing, radius } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MultipleChoiceQuestionProps {
  question: string;
  options: string[];
  selected: number | null;
  onSelect: (index: number) => void;
  disabled?: boolean;
  correctAnswer?: number;
  showResult?: boolean;
}

interface OptionProps {
  option: string;
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  isIncorrect: boolean;
  showResult: boolean;
  disabled: boolean;
  onPress: () => void;
}

function Option({ option, isSelected, isCorrect, isIncorrect, showResult, disabled, onPress }: OptionProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleIn = () => {
    if (!disabled) scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };
  const handleOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const getOptionStyle = () => {
    if (!showResult) {
      return isSelected ? styles.optionSelected : styles.optionDefault;
    }
    if (isCorrect) return styles.optionCorrect;
    if (isIncorrect) return styles.optionIncorrect;
    return styles.optionDefault;
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handleIn}
      onPressOut={handleOut}
      disabled={disabled}
      style={animStyle}
    >
      <View style={[styles.optionCard, getOptionStyle()]}>
        <View style={styles.optionRow}>
          <View style={[styles.indicator, getOptionStyle()]} />
          <Text style={styles.optionText}>{option}</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export function MultipleChoiceQuestion({
  question,
  options,
  selected,
  onSelect,
  disabled = false,
  correctAnswer,
  showResult = false,
}: MultipleChoiceQuestionProps) {
  const handleSelect = (index: number) => {
    if (disabled) return;
    haptics.select();
    onSelect(index);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.options}>
        {options.map((opt, i) => (
          <Option
            key={i}
            option={opt}
            index={i}
            isSelected={selected === i}
            isCorrect={showResult && i === correctAnswer}
            isIncorrect={showResult && i === selected && i !== correctAnswer}
            showResult={showResult}
            disabled={disabled}
            onPress={() => handleSelect(i)}
          />
        ))}
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
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  options: {
    gap: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  indicator: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionDefault: {
    borderColor: colors.border,
  },
  optionSelected: {
    borderColor: colors.purple,
    backgroundColor: colors.bgCardHover,
  },
  optionCorrect: {
    borderColor: colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  optionIncorrect: {
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  optionText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
});
