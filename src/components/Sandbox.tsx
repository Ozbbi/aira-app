import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { AiraMascot } from './AiraMascot';
import { colors, typography, spacing, radius, elevation } from '../theme';
import { useUserStore } from '../store/userStore';

interface SandboxProps {
  topic: string;
  focusSkill: 'clarity' | 'specificity' | 'context' | 'formatting' | 'iteration';
  scenario: string;
  onComplete: (score: number) => void;
}

interface EvalResult {
  score: number;
  stars: number;
  tip: string;
  breakdown: { label: string; score: number }[];
}

function evaluatePrompt(text: string, focusSkill: string): EvalResult {
  const words = text.trim().split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(Boolean).length;
  const hasQuestion = text.includes('?');
  const hasExamples = /example|e\.g\.|for instance|such as|like this/i.test(text);
  const hasAudience = /for a|to a|aimed at|written for|explain to/i.test(text);
  const hasFormat = /bullet|list|table|paragraph|step|format|markdown|json/i.test(text);
  const hasConstraint = /must|should|don't|avoid|limit|at most|no more than|keep it/i.test(text);
  const hasContext = /because|since|context|background|i need|i'm working|my goal/i.test(text);
  const hasIteration = /revise|improve|refine|make it|change|adjust|try again/i.test(text);

  let clarity = 30;
  if (words >= 10) clarity += 15;
  if (words >= 20) clarity += 10;
  if (sentences >= 2) clarity += 15;
  if (hasQuestion) clarity += 10;
  if (words <= 5) clarity = 15;

  let specificity = 25;
  if (hasExamples) specificity += 25;
  if (hasConstraint) specificity += 20;
  if (words >= 15) specificity += 10;

  let context = 20;
  if (hasAudience) context += 30;
  if (hasContext) context += 25;

  let formatting = 20;
  if (hasFormat) formatting += 35;
  if (sentences >= 3) formatting += 15;

  let iteration = 20;
  if (hasIteration) iteration += 35;
  if (hasExamples && hasConstraint) iteration += 15;

  const scores: Record<string, number> = { clarity, specificity, context, formatting, iteration };
  const focusScore = Math.min(100, scores[focusSkill] || 40);
  const avg = Math.min(100, Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 5));
  const stars = avg >= 80 ? 5 : avg >= 60 ? 4 : avg >= 40 ? 3 : avg >= 25 ? 2 : 1;

  const tips: Record<string, string> = {
    clarity: words < 10
      ? 'Your prompt is very short. Try adding more detail about what you want.'
      : hasQuestion
        ? 'Good use of a question. Try adding constraints to narrow the output.'
        : 'Try structuring your prompt as a clear question or instruction.',
    specificity: hasExamples
      ? 'Great use of examples. You could add output constraints for even better results.'
      : 'Try adding 1-2 specific examples of what you want.',
    context: hasAudience
      ? 'Nice audience targeting. Adding background context would strengthen it further.'
      : 'Try adding "for a [specific audience]" to your prompt.',
    formatting: hasFormat
      ? 'Good format specification. Consider adding length constraints too.'
      : 'Tell the AI how to format its response (e.g., "as a bullet list").',
    iteration: hasIteration
      ? 'You are refining well. Try comparing two approaches side by side.'
      : 'Try asking the AI to improve or revise what it already generated.',
  };

  return {
    score: avg,
    stars,
    tip: tips[focusSkill],
    breakdown: [
      { label: 'Clarity', score: Math.min(100, clarity) },
      { label: 'Specificity', score: Math.min(100, specificity) },
      { label: 'Context', score: Math.min(100, context) },
      { label: 'Formatting', score: Math.min(100, formatting) },
      { label: 'Iteration', score: Math.min(100, iteration) },
    ],
  };
}

export function Sandbox({ topic, focusSkill, scenario, onComplete }: SandboxProps) {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<EvalResult | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const incrementSandbox = useUserStore((s) => s.incrementSandbox);
  const updateSkillScore = useUserStore((s) => s.updateSkillScore);

  const handleSubmit = () => {
    if (prompt.trim().length < 5) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const evaluation = evaluatePrompt(prompt, focusSkill);
    setResult(evaluation);
    setSubmitted(true);
    incrementSandbox();
    updateSkillScore(focusSkill, evaluation.breakdown.find((b) => b.label.toLowerCase() === focusSkill)?.score ?? 40);
  };

  const handleRetry = () => {
    setResult(null);
    setSubmitted(false);
  };

  const handleDone = () => {
    onComplete(result?.score ?? 0);
  };

  return (
    <View style={styles.container}>
      {/* Scenario context */}
      <View style={styles.scenarioBar}>
        <Text style={styles.scenarioLabel}>SANDBOX: {topic.toUpperCase()}</Text>
        <Text style={styles.scenarioText}>{scenario}</Text>
      </View>

      {/* Prompt input - top half */}
      <View style={styles.promptSection}>
        <TextInput
          style={styles.promptInput}
          placeholder="Write your prompt here..."
          placeholderTextColor={colors.textDisabled}
          value={prompt}
          onChangeText={setPrompt}
          multiline
          textAlignVertical="top"
          editable={!submitted}
        />
      </View>

      {/* AI Response / Evaluation - bottom half */}
      <ScrollView style={styles.responseSection} contentContainerStyle={styles.responseContent}>
        {!submitted ? (
          <View style={styles.responsePlaceholder}>
            <AiraMascot size={48} state="listening" />
            <Text style={styles.placeholderText}>Write your prompt above and tap Submit.</Text>
          </View>
        ) : result ? (
          <Animated.View entering={FadeIn.duration(300)}>
            {/* Star rating */}
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Text key={i} style={[styles.star, i < result.stars && styles.starFilled]}>
                  {i < result.stars ? '★' : '☆'}
                </Text>
              ))}
              <Text style={styles.scoreText}>{result.score}/100</Text>
            </View>

            {/* Ara feedback */}
            <View style={styles.araFeedback}>
              <AiraMascot size={40} state={result.stars >= 4 ? 'success' : 'thinking'} />
              <View style={styles.araBubble}>
                <Text style={styles.araTip}>{result.tip}</Text>
              </View>
            </View>

            {/* Breakdown bars */}
            <View style={styles.breakdownSection}>
              {result.breakdown.map((b) => (
                <View key={b.label} style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, b.label.toLowerCase() === focusSkill && styles.breakdownLabelFocus]}>
                    {b.label}
                  </Text>
                  <View style={styles.breakdownBar}>
                    <View style={[styles.breakdownFill, { width: `${b.score}%` }]} />
                  </View>
                  <Text style={styles.breakdownScore}>{b.score}</Text>
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <Pressable style={styles.retryBtn} onPress={handleRetry}>
                <Text style={styles.retryBtnText}>Edit & Retry</Text>
              </Pressable>
              <Pressable style={styles.doneBtn} onPress={handleDone}>
                <Text style={styles.doneBtnText}>Continue →</Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Submit button */}
      {!submitted && (
        <Pressable
          style={[styles.submitBtn, prompt.trim().length < 5 && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={prompt.trim().length < 5}
        >
          <Text style={styles.submitBtnText}>Submit</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  scenarioBar: { padding: 16, backgroundColor: colors.cardSurface, borderBottomWidth: 1, borderBottomColor: colors.divider },
  scenarioLabel: { ...typography.label, color: colors.cyan, marginBottom: 4 },
  scenarioText: { ...typography.body, fontSize: 14, color: colors.textSecondary },

  promptSection: { flex: 1, padding: 16 },
  promptInput: {
    flex: 1, backgroundColor: colors.cardSurface, borderRadius: radius.md,
    padding: 16, ...typography.code, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.divider, fontFamily: 'JetBrainsMono_400Regular',
  },

  responseSection: { flex: 1, borderTopWidth: 1, borderTopColor: colors.divider },
  responseContent: { padding: 16 },

  responsePlaceholder: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  placeholderText: { ...typography.body, color: colors.textDisabled, textAlign: 'center' },

  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  star: { fontSize: 24, color: colors.textDisabled },
  starFilled: { color: colors.orange },
  scoreText: { ...typography.bodyBold, color: colors.textPrimary, marginLeft: 8 },

  araFeedback: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  araBubble: {
    flex: 1, backgroundColor: colors.cardSurface, borderRadius: radius.md,
    padding: 14, borderWidth: 1, borderColor: colors.divider,
  },
  araTip: { ...typography.body, fontSize: 14, color: colors.textPrimary, lineHeight: 20 },

  breakdownSection: { gap: 10, marginBottom: 20 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownLabel: { ...typography.caption, color: colors.textSecondary, width: 80 },
  breakdownLabelFocus: { color: colors.cyan, fontFamily: 'Inter_700Bold' },
  breakdownBar: { flex: 1, height: 6, backgroundColor: colors.divider, borderRadius: 3, overflow: 'hidden' },
  breakdownFill: { height: '100%', backgroundColor: colors.cyan, borderRadius: 3 },
  breakdownScore: { ...typography.caption, color: colors.textSecondary, width: 30, textAlign: 'right' },

  actionRow: { flexDirection: 'row', gap: 12 },
  retryBtn: {
    flex: 1, padding: 14, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.cyan, alignItems: 'center',
  },
  retryBtnText: { ...typography.button, color: colors.cyan },
  doneBtn: {
    flex: 1, padding: 14, borderRadius: radius.md,
    backgroundColor: colors.cyan, alignItems: 'center', ...elevation.cyanGlow,
  },
  doneBtnText: { ...typography.button, color: colors.bg },

  submitBtn: {
    margin: 16, padding: 16, borderRadius: radius.md,
    backgroundColor: colors.cyan, alignItems: 'center', height: 52,
    justifyContent: 'center', ...elevation.cyanGlow,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { ...typography.button, color: colors.bg },
});
