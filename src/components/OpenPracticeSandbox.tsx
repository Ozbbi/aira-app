import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { palette, radii, space, text, elevation } from '../theme/system';
import { Button } from './Button';
import { AiraMascot } from './AiraMascot';

/**
 * Open Practice — rule-based, client-side prompt evaluator.
 *
 * Per the brief: "the user writes a prompt to an embedded AI and
 * receives instant tutor feedback on their prompt quality." The brief
 * also says "design the service layer so it can be swapped with real
 * API endpoints later."
 *
 * Architecture: a pure scoring function (`evaluatePrompt`) returns a
 * `PromptEvaluation`. A future commit can replace the function body
 * with a real API call without touching the UI. Same shape returned.
 *
 * What we score (each 0-100):
 *   • Clarity         — readable, complete sentences, not too short
 *   • Specificity     — names audience, numbers, concrete nouns
 *   • Context         — gives the AI a role / scenario / examples
 *   • Format          — explicitly asks for a shape (list, table, count)
 *
 * Plus an overall band: green (≥75 avg) / amber (50–74) / red (<50).
 *
 * Honest caveat: rule-based scoring is an approximation. Real Claude
 * grading would be more nuanced. But this is good enough to teach the
 * user the *shape* of a strong prompt — which is the lesson.
 */

interface Props {
  /** The starter or hint shown above the input. */
  prompt: string;
  /** Optional reference example shown when user taps "Show example". */
  exampleAnswer?: string;
  /** Called after the user submits and reads their feedback. */
  onContinue?: () => void;
}

export interface PromptEvaluation {
  scores: {
    clarity: number;
    specificity: number;
    context: number;
    format: number;
  };
  overall: number;
  band: 'great' | 'good' | 'try-again';
  tips: string[];
}

export function OpenPracticeSandbox({ prompt, exampleAnswer, onContinue }: Props) {
  const [draft, setDraft] = useState('');
  const [submitted, setSubmitted] = useState<PromptEvaluation | null>(null);
  const [showingExample, setShowingExample] = useState(false);

  const onSubmit = useCallback(() => {
    if (draft.trim().length < 5) return;
    const evalResult = evaluatePrompt(draft);
    setSubmitted(evalResult);
  }, [draft]);

  const onTryAgain = useCallback(() => {
    setSubmitted(null);
  }, []);

  const charsLeft = 600 - draft.length;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(220)}>
          <Text style={styles.eyebrow}>OPEN PRACTICE</Text>
          <Text style={styles.title}>Try it yourself</Text>
          <Text style={styles.body}>{prompt}</Text>
        </Animated.View>

        {/* Input */}
        <Animated.View entering={FadeInDown.duration(220).delay(80)} style={styles.inputBlock}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Write your prompt here…"
            placeholderTextColor={palette.textDisabled}
            multiline
            maxLength={600}
            editable={!submitted}
            textAlignVertical="top"
          />
          <View style={styles.inputFooter}>
            <Text style={styles.charCount}>
              {draft.length} / 600
            </Text>
            {!submitted && exampleAnswer ? (
              <Button
                label={showingExample ? 'Hide example' : 'Show example'}
                onPress={() => setShowingExample((v) => !v)}
                variant="tertiary"
                size="sm"
              />
            ) : null}
          </View>

          {showingExample && exampleAnswer ? (
            <Animated.View entering={FadeIn.duration(180)} style={styles.exampleBox}>
              <Text style={styles.exampleLabel}>EXAMPLE</Text>
              <Text style={styles.exampleText}>{exampleAnswer}</Text>
            </Animated.View>
          ) : null}
        </Animated.View>

        {/* Actions */}
        {!submitted ? (
          <Animated.View entering={FadeInDown.duration(220).delay(140)} style={styles.actions}>
            <Button
              label="Get feedback"
              onPress={onSubmit}
              variant="primary"
              size="lg"
              fullWidth
              disabled={draft.trim().length < 5}
              hapticOnPress="medium"
            />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(220)} style={styles.feedbackBlock}>
            <FeedbackPanel evaluation={submitted} />
            <View style={styles.actions}>
              <Button
                label="Try a stronger version"
                onPress={onTryAgain}
                variant="secondary"
                size="md"
                fullWidth
              />
              {onContinue ? (
                <Button
                  label="Continue lesson"
                  onPress={onContinue}
                  variant="primary"
                  size="md"
                  fullWidth
                  trailingIcon="arrow-right"
                  style={styles.continueBtn}
                  hapticOnPress="medium"
                />
              ) : null}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ────────────────────────── feedback panel ────────────────────────── */

function FeedbackPanel({ evaluation }: { evaluation: PromptEvaluation }) {
  const { scores, band, tips } = evaluation;
  const headline =
    band === 'great' ? 'Sharp prompt.' : band === 'good' ? 'Solid start.' : 'Let\'s sharpen it.';
  const subhead =
    band === 'great' ? 'You hit specificity, context, and format.'
    : band === 'good' ? 'A couple of moves away from a great prompt.'
    : 'Three quick wins will lift this fast.';

  return (
    <View style={styles.feedbackCard}>
      <View style={styles.feedbackHead}>
        <AiraMascot size={56} mood={band === 'great' ? 'celebrating' : band === 'good' ? 'encouraging' : 'thinking'} />
        <View style={styles.feedbackHeadText}>
          <Text style={styles.feedbackTitle}>{headline}</Text>
          <Text style={styles.feedbackSubtitle}>{subhead}</Text>
        </View>
      </View>

      <View style={styles.scoresGrid}>
        <ScoreBar label="Clarity" value={scores.clarity} />
        <ScoreBar label="Specificity" value={scores.specificity} />
        <ScoreBar label="Context" value={scores.context} />
        <ScoreBar label="Format" value={scores.format} />
      </View>

      {tips.length > 0 ? (
        <View style={styles.tipsBlock}>
          <Text style={styles.tipsLabel}>NEXT MOVES</Text>
          {tips.map((t, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{t}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const colour = value >= 75 ? palette.success : value >= 50 ? palette.orange : palette.error;
  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreLabelRow}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={[styles.scoreValue, { color: colour }]}>{value}</Text>
      </View>
      <View style={styles.scoreTrack}>
        <View style={[styles.scoreFill, { width: `${value}%`, backgroundColor: colour }]} />
      </View>
    </View>
  );
}

/* ────────────────────────── evaluator (pure) ────────────────────────── */

/**
 * Rule-based scoring. Each dimension returns 0-100. Designed to teach
 * the user the *shape* of a strong prompt; real Claude grading later
 * will return the same shape.
 */
export function evaluatePrompt(rawDraft: string): PromptEvaluation {
  const draft = rawDraft.trim();
  const lower = draft.toLowerCase();
  const wordCount = draft.split(/\s+/).filter(Boolean).length;
  const hasMultipleSentences = /[.!?].+[.!?]/.test(draft);

  // ---------- Clarity ----------
  // Reward: complete sentences, reasonable length (not 1 word, not 500).
  // Penalise: all-caps, single fragment, gibberish.
  let clarity = 50;
  if (wordCount >= 8) clarity += 15;
  if (wordCount >= 18) clarity += 10;
  if (hasMultipleSentences) clarity += 15;
  if (/[.!?]\s/.test(draft)) clarity += 5;
  if (draft === draft.toUpperCase() && draft.length > 10) clarity -= 25; // shouting
  if (wordCount > 120) clarity -= 10; // probably bloated
  clarity = clamp(clarity);

  // ---------- Specificity ----------
  // Look for: numbers, named audiences, specific nouns, length caps.
  let specificity = 30;
  if (/\b\d+\b/.test(draft)) specificity += 20; // any number
  const audienceWords = [
    'beginner', 'expert', 'student', 'teacher', 'engineer', 'cfo', 'pm',
    'manager', 'executive', 'developer', 'designer', 'audience', 'reader',
    'kid', 'child', '10-year-old', '10 year old', 'parent', 'investor', 'customer',
  ];
  if (audienceWords.some((w) => lower.includes(w))) specificity += 25;
  if (/(in \d+ words|under \d+ words|max \d+ words|\d+ bullets|\d+ sentences|\d+ words)/i.test(draft)) specificity += 25;
  if (/\b(specifically|exactly|precisely|step.by.step)\b/i.test(draft)) specificity += 10;
  specificity = clamp(specificity);

  // ---------- Context ----------
  // Look for: role priming, scenario, examples, "I am X / my situation".
  let context = 20;
  if (/\b(act as|you are|imagine you are|roleplay as|pretend you are)\b/i.test(draft)) context += 30;
  if (/\b(my (situation|goal|audience|context)|i am|i'm|i want to)\b/i.test(draft)) context += 25;
  if (/\b(for example|e\.g\.|like this|here's an example)\b/i.test(draft)) context += 15;
  if (/\b(constraint|requirement|rule|must|should not|don't use)\b/i.test(draft)) context += 15;
  context = clamp(context);

  // ---------- Format ----------
  // Look for explicit shape: bullet list, table, JSON, paragraph cap, sentence count.
  let format = 25;
  if (/\b(bullet|bullets|list|numbered list)\b/i.test(draft)) format += 25;
  if (/\btable\b/i.test(draft)) format += 25;
  if (/\b(json|markdown|yaml)\b/i.test(draft)) format += 25;
  if (/\b(paragraph|sentences?|words)\b/i.test(draft) && /\d/.test(draft)) format += 20;
  if (/\b(no intro|no preamble|skip the disclaimer|don't apologi[sz]e)\b/i.test(draft)) format += 15;
  format = clamp(format);

  const overall = Math.round((clarity + specificity + context + format) / 4);
  const band: PromptEvaluation['band'] = overall >= 75 ? 'great' : overall >= 50 ? 'good' : 'try-again';

  // ---------- Tips ----------
  const tips: string[] = [];
  if (specificity < 65) tips.push('Add a number or a named audience. "For a busy CFO" beats "for someone."');
  if (context < 60) tips.push('Open with "Act as a [role]" or one sentence about your situation.');
  if (format < 60) tips.push('End with the shape you want: "Reply as a 5-bullet list" or "Max 80 words."');
  if (clarity < 60 && wordCount < 10) tips.push('Stretch to a full sentence — single phrases are too thin.');
  if (clarity < 60 && wordCount > 120) tips.push('Trim — long prompts often produce vaguer answers.');

  return {
    scores: { clarity, specificity, context, format },
    overall,
    band,
    tips: tips.slice(0, 3),
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/* ────────────────────────── styles ────────────────────────── */

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: space['4'], paddingBottom: space['12'] },

  eyebrow: { ...text.label, color: palette.cyanGlow, marginBottom: space['1'] },
  title: { ...text.headline, color: palette.textPrimary, marginBottom: space['2'] },
  body: { ...text.body, color: palette.textSecondary, marginBottom: space['5'] },

  inputBlock: { marginBottom: space['4'] },
  input: {
    minHeight: 160,
    borderRadius: radii.md,
    backgroundColor: palette.cardSurface,
    borderColor: palette.divider,
    borderWidth: 1,
    padding: space['4'],
    color: palette.textPrimary,
    ...text.body,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space['2'],
  },
  charCount: { ...text.caption, color: palette.textDisabled },

  exampleBox: {
    marginTop: space['3'],
    backgroundColor: palette.elevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.divider,
    padding: space['4'],
  },
  exampleLabel: { ...text.label, color: palette.cyanGlow, marginBottom: space['2'] },
  exampleText: { ...text.caption, color: palette.textPrimary },

  actions: { gap: space['3'] },
  continueBtn: {},

  feedbackBlock: { gap: space['4'] },
  feedbackCard: {
    backgroundColor: palette.cardSurface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.divider,
    padding: space['5'],
    ...elevation.sm,
  },
  feedbackHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space['3'],
    marginBottom: space['4'],
  },
  feedbackHeadText: { flex: 1, minWidth: 0 },
  feedbackTitle: { ...text.headline, color: palette.textPrimary, marginBottom: 2 },
  feedbackSubtitle: { ...text.caption, color: palette.textSecondary },

  scoresGrid: { gap: space['3'], marginBottom: space['4'] },
  scoreRow: {},
  scoreLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  scoreLabel: { ...text.caption, color: palette.textPrimary },
  scoreValue: { ...text.bodyBold, fontSize: 14 },
  scoreTrack: {
    height: 6,
    borderRadius: radii.full,
    backgroundColor: palette.elevated,
    overflow: 'hidden',
  },
  scoreFill: { height: '100%', borderRadius: radii.full },

  tipsBlock: {
    paddingTop: space['3'],
    borderTopColor: palette.divider,
    borderTopWidth: 1,
  },
  tipsLabel: { ...text.label, color: palette.textDisabled, marginBottom: space['2'] },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: space['2'], gap: space['2'] },
  tipBullet: { ...text.body, color: palette.cyan },
  tipText: { ...text.caption, color: palette.textPrimary, flex: 1 },
});
