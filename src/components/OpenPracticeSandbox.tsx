import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { palette, radii, space, text, elevation } from '../theme/system';
import { Button } from './Button';
import { AiraMascot } from './AiraMascot';
import type { MascotMood } from './AiraMascot';
import { useUserStore } from '../store/userStore';
import { haptics } from '../utils/haptics';

/**
 * Open Practice — multi-judge prompt evaluator with "Ask Why?" follow-ups.
 *
 * Architecture (per the v16 brief):
 *
 *   1. Four named judges score the user's prompt independently:
 *        Clarity     — sentence structure, length, readability
 *        Specificity — numbers, length caps, banned words, "step by step"
 *        Audience    — names a target reader (CFO, 10-year-old, etc.)
 *        Format      — explicit shape (list, table, JSON, paragraph cap)
 *
 *   2. Each judge returns an internal 0-100 score that we render as
 *      1-5 stars. The overall headline is the average of the 4 star
 *      ratings (1-5, one decimal).
 *
 *   3. Tap any judge row to expand a rationale panel that explains
 *      WHY that judge scored what it did + the specific fix.
 *
 *   4. Three follow-up chips below the judges:
 *        "Why this score?"     — overall reasoning
 *        "How to improve?"     — actionable next steps
 *        "Show me an example"  — exemplar prompt
 *      Free users: 3 follow-ups per sandbox session. Pro: unlimited.
 *      When the user runs out, the chip shows an upgrade nudge.
 *
 *   5. Every submission auto-saves to the user store's sandboxHistory
 *      with the full multi-judge breakdown so Profile > History can
 *      replay it later.
 *
 * The 0-100 single-score API is GONE. No legacy compatibility kept.
 */

interface Props {
  /** The starter or hint shown above the input. */
  prompt: string;
  /** Optional reference example shown when user taps "Show example". */
  exampleAnswer?: string;
  /** The lesson id this sandbox belongs to (for history). */
  lessonId?: string;
  /** Per-lesson follow-up text. Generated fallback used when absent. */
  followUpExplanations?: {
    whyScore?: string;
    howToImprove?: string;
    example?: string;
  };
  /** Called after the user submits and reads their feedback. */
  onContinue?: () => void;
}

export type Judge = 'clarity' | 'specificity' | 'audience' | 'format';

interface JudgeRationale {
  /** WHY the judge scored what it did. */
  why: string;
  /** Concrete tip to improve. */
  tip: string;
}

export interface PromptEvaluation {
  /** Internal 0-100 scores (kept for tooling / future analytics). */
  scores: Record<Judge, number>;
  /** 1-5 stars, rendered. */
  stars: Record<Judge, number>;
  /** Average of the four star ratings, e.g. 3.8. */
  overallStars: number;
  band: 'great' | 'good' | 'try-again';
  /** Per-judge "why + tip" content. */
  rationale: Record<Judge, JudgeRationale>;
}

type FollowUpKey = 'why' | 'improve' | 'example';

const FREE_FOLLOWUP_LIMIT = 3;

const JUDGE_LABELS: Record<Judge, string> = {
  clarity: 'Clarity',
  specificity: 'Specificity',
  audience: 'Audience',
  format: 'Format',
};

export function OpenPracticeSandbox({
  prompt,
  exampleAnswer,
  lessonId,
  followUpExplanations,
  onContinue,
}: Props) {
  const tier = useUserStore((s) => s.tier);
  const addSandboxEntry = useUserStore((s) => s.addSandboxEntry);
  const incrementSandbox = useUserStore((s) => s.incrementSandbox);

  const [draft, setDraft] = useState('');
  const [evaluation, setEvaluation] = useState<PromptEvaluation | null>(null);
  const [showingExample, setShowingExample] = useState(false);
  /** Which judges have their detailed rationale panel open. */
  const [expandedJudges, setExpandedJudges] = useState<Set<Judge>>(new Set());
  /** Which follow-up chips have been opened in this session. */
  const [openedFollowUps, setOpenedFollowUps] = useState<Set<FollowUpKey>>(new Set());
  /** Total follow-ups tapped this session (counts toward free limit). */
  const [followUpsUsed, setFollowUpsUsed] = useState(0);

  const onSubmit = useCallback(() => {
    if (draft.trim().length < 5) return;
    const result = evaluatePrompt(draft);
    setEvaluation(result);
    setExpandedJudges(new Set());
    setOpenedFollowUps(new Set());
    setFollowUpsUsed(0);
    // Save submission to history + bump sandbox counter
    incrementSandbox();
    addSandboxEntry({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      lessonId,
      prompt: draft,
      scores: result.scores,
      overallStars: result.overallStars,
      followUps: [],
    });
    haptics.success();
  }, [draft, addSandboxEntry, incrementSandbox, lessonId]);

  const onTryAgain = useCallback(() => {
    setEvaluation(null);
    setExpandedJudges(new Set());
    setOpenedFollowUps(new Set());
    setFollowUpsUsed(0);
  }, []);

  const toggleJudge = useCallback((judge: Judge) => {
    haptics.select();
    setExpandedJudges((prev) => {
      const next = new Set(prev);
      if (next.has(judge)) next.delete(judge);
      else next.add(judge);
      return next;
    });
  }, []);

  const onFollowUp = useCallback(
    (key: FollowUpKey) => {
      if (openedFollowUps.has(key)) {
        // Toggle closed without spending a follow-up
        setOpenedFollowUps((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        return;
      }
      // Check free-tier follow-up limit
      if (tier !== 'pro' && followUpsUsed >= FREE_FOLLOWUP_LIMIT) {
        haptics.warning();
        return; // The chip renders a "Pro" badge that the user can tap separately
      }
      haptics.tap();
      setOpenedFollowUps((prev) => new Set(prev).add(key));
      setFollowUpsUsed((n) => n + 1);
    },
    [openedFollowUps, followUpsUsed, tier]
  );

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
            placeholderTextColor={palette.textMuted}
            multiline
            maxLength={600}
            editable={!evaluation}
            textAlignVertical="top"
          />
          <View style={styles.inputFooter}>
            <Text style={styles.charCount}>{draft.length} / 600</Text>
            {!evaluation && exampleAnswer ? (
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

        {/* Submit / Feedback */}
        {!evaluation ? (
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
            {/* Ara's Friendly Score — a big animated smiley + one warm line. */}
            <SmileyScore
              evaluation={evaluation}
              expandedJudges={expandedJudges}
              onToggleJudge={toggleJudge}
            />

            <FollowUpRow
              opened={openedFollowUps}
              onTap={onFollowUp}
              followUpsUsed={followUpsUsed}
              tier={tier}
              evaluation={evaluation}
              draft={draft}
              followUpExplanations={followUpExplanations}
            />

            <View style={styles.actions}>
              <Button
                label="Give it another go"
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

/* ─────────────────────────── SmileyScore ─────────────────────────── */

/**
 * Ara's Friendly Score — the user-facing feedback panel.
 *
 *   - Big smiley face that morphs from neutral → happy as overall score rises.
 *   - One short, warm, positive message that targets the weakest judge.
 *   - Ara mascot reacts (encouraging / happy / celebrating).
 *   - "Show details" button reveals the original JudgePanel breakdown
 *     inside a collapsible block (kept for users who want the numbers).
 *
 * Replaces the previous 5-star multi-judge headline. Tone is warm and
 * never punishing — even at low scores the message is encouraging
 * ("You're close! Adding an audience will make it shine.").
 */
function SmileyScore({
  evaluation,
  expandedJudges,
  onToggleJudge,
}: {
  evaluation: PromptEvaluation;
  expandedJudges: Set<Judge>;
  onToggleJudge: (j: Judge) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const { overallStars, band } = evaluation;

  // Mood + smile vary by band.
  const mascotMood: MascotMood =
    band === 'great' ? 'celebrating' :
    band === 'good'  ? 'happy' :
                       'encouraging';

  // Message addresses the weakest judge specifically.
  const weakest = pickLowestJudgeKey(evaluation);
  const headline =
    band === 'great' ? 'Beautiful prompt.' :
    band === 'good'  ? 'Really nice start.' :
                       'You\'re close — keep going!';
  const supportMsg: string = (() => {
    if (band === 'great') return 'You hit every move. Save this one as a template!';
    if (weakest === 'audience') return 'Tiny tweak: tell Ara WHO this is for (e.g. "for a 10th grader"). That makes a huge difference!';
    if (weakest === 'specificity') return 'Add a number or a constraint — like "in 5 bullets" — and Ara can see exactly what you want.';
    if (weakest === 'format') return 'End with "Reply as a list / table" so the answer comes back in the shape you need.';
    return 'Try stretching to a full sentence so Ara has more to work with.';
  })();

  return (
    <View style={styles.feedbackCard}>
      {/* Score row: smiley face + headline + score chip */}
      <View style={styles.smileyRow}>
        <View style={styles.smileyWrap}>
          <AiraMascot size={88} mood={mascotMood} />
        </View>
        <View style={styles.smileyTextCol}>
          <Text style={styles.feedbackTitle}>{headline}</Text>
          <Text style={styles.feedbackSubtitle}>{supportMsg}</Text>
          <View style={styles.scoreChip}>
            <Text style={styles.scoreChipText}>
              {overallStars.toFixed(1)} / 5
            </Text>
          </View>
        </View>
      </View>

      {/* Show details — collapsible breakdown */}
      <Pressable
        onPress={() => setShowDetails((v) => !v)}
        hitSlop={8}
        style={styles.detailsToggle}
      >
        <Text style={styles.detailsToggleText}>
          {showDetails ? 'Hide details' : 'Show details'}
        </Text>
      </Pressable>

      {showDetails ? (
        <Animated.View entering={FadeIn.duration(160)} style={styles.judgesList}>
          {(['clarity', 'specificity', 'audience', 'format'] as Judge[]).map((j) => (
            <JudgeBarRow
              key={j}
              label={JUDGE_LABELS[j]}
              score={evaluation.scores[j]}
              expanded={expandedJudges.has(j)}
              rationale={evaluation.rationale[j]}
              onPress={() => onToggleJudge(j)}
            />
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

/**
 * One judge row in the collapsible "Show details" section. Renders a
 * soft bar (not stars) per the brief.
 */
function JudgeBarRow({
  label,
  score,
  expanded,
  rationale,
  onPress,
}: {
  label: string;
  score: number;
  expanded: boolean;
  rationale: JudgeRationale;
  onPress: () => void;
}) {
  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.judgeRow, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
      >
        <View style={styles.judgeLabelCol}>
          <Text style={styles.judgeLabel}>{label}</Text>
          <View style={styles.judgeBarTrack}>
            <View
              style={[
                styles.judgeBarFill,
                {
                  width: `${score}%`,
                  backgroundColor:
                    score >= 70 ? palette.success :
                    score >= 40 ? palette.brand :
                                  palette.danger,
                },
              ]}
            />
          </View>
        </View>
        <Text style={styles.judgeCaret}>{expanded ? '▴' : '▾'}</Text>
      </Pressable>
      {expanded ? (
        <Animated.View entering={FadeIn.duration(160)} style={styles.judgeRationale}>
          <Text style={styles.rationaleLabel}>WHY</Text>
          <Text style={styles.rationaleText}>{rationale.why}</Text>
          <Text style={[styles.rationaleLabel, { marginTop: space['2'] }]}>NEXT MOVE</Text>
          <Text style={styles.rationaleText}>{rationale.tip}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

function pickLowestJudgeKey(ev: PromptEvaluation): Judge {
  const entries = Object.entries(ev.scores) as [Judge, number][];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
}

/* ─────────────────────────── Judge panel (legacy, unused) ─────────────────────────── */

function JudgePanel({
  evaluation, expanded, onToggle,
}: {
  evaluation: PromptEvaluation;
  expanded: Set<Judge>;
  onToggle: (j: Judge) => void;
}) {
  const { stars, overallStars, band, rationale } = evaluation;
  const headline =
    band === 'great' ? 'Sharp prompt.' :
    band === 'good'  ? 'Solid start.' :
                       "Let's sharpen it.";
  const subhead = `Your prompt scored ${overallStars.toFixed(1)} / 5.`;
  const mascotMood =
    band === 'great' ? 'celebrating' :
    band === 'good'  ? 'encouraging' :
                       'thinking';

  return (
    <View style={styles.feedbackCard}>
      <View style={styles.feedbackHead}>
        <AiraMascot size={56} mood={mascotMood} />
        <View style={styles.feedbackHeadText}>
          <Text style={styles.feedbackTitle}>{headline}</Text>
          <Text style={styles.feedbackSubtitle}>{subhead}</Text>
        </View>
      </View>

      <View style={styles.judgesList}>
        {(['clarity', 'specificity', 'audience', 'format'] as Judge[]).map((j) => (
          <JudgeRow
            key={j}
            label={JUDGE_LABELS[j]}
            stars={stars[j]}
            expanded={expanded.has(j)}
            rationale={rationale[j]}
            onPress={() => onToggle(j)}
          />
        ))}
      </View>
    </View>
  );
}

function JudgeRow({
  label, stars, expanded, rationale, onPress,
}: {
  label: string;
  stars: number;
  expanded: boolean;
  rationale: JudgeRationale;
  onPress: () => void;
}) {
  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.judgeRow, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${label}: ${stars} out of 5 stars. Tap to ${expanded ? 'collapse' : 'expand'} reasoning.`}
      >
        <View style={styles.judgeLabelCol}>
          <Text style={styles.judgeLabel}>{label}</Text>
        </View>
        <View style={styles.judgeStars}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Text
              key={i}
              style={[styles.star, i < stars ? styles.starFilled : styles.starEmpty]}
            >
              {i < stars ? '★' : '☆'}
            </Text>
          ))}
        </View>
        <Text style={styles.judgeCaret}>{expanded ? '▴' : '▾'}</Text>
      </Pressable>
      {expanded ? (
        <Animated.View entering={FadeIn.duration(160)} style={styles.judgeRationale}>
          <Text style={styles.rationaleLabel}>WHY</Text>
          <Text style={styles.rationaleText}>{rationale.why}</Text>
          <Text style={[styles.rationaleLabel, { marginTop: space['2'] }]}>NEXT MOVE</Text>
          <Text style={styles.rationaleText}>{rationale.tip}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

/* ────────────────────────── Ask Why? chips ────────────────────────── */

function FollowUpRow({
  opened, onTap, followUpsUsed, tier, evaluation, draft, followUpExplanations,
}: {
  opened: Set<FollowUpKey>;
  onTap: (key: FollowUpKey) => void;
  followUpsUsed: number;
  tier: 'free' | 'pro';
  evaluation: PromptEvaluation;
  draft: string;
  followUpExplanations?: Props['followUpExplanations'];
}) {
  const remaining = tier === 'pro' ? Infinity : Math.max(0, FREE_FOLLOWUP_LIMIT - followUpsUsed);
  const showLimitBadge = tier !== 'pro';

  const chips: { key: FollowUpKey; label: string; render: () => string }[] = [
    {
      key: 'why',
      label: 'Tell me more',
      render: () => followUpExplanations?.whyScore || fallbackWhy(evaluation),
    },
    {
      key: 'improve',
      label: 'How can I improve?',
      render: () => followUpExplanations?.howToImprove || fallbackHowToImprove(evaluation),
    },
    {
      key: 'example',
      label: 'Show an example',
      render: () => followUpExplanations?.example || fallbackExample(draft),
    },
  ];

  return (
    <View style={styles.followUpBlock}>
      <View style={styles.followUpHead}>
        <Text style={styles.followUpLabel}>ASK ARA</Text>
        {showLimitBadge ? (
          <Text style={styles.followUpRemain}>
            {remaining > 0 ? `${remaining} follow-up${remaining === 1 ? '' : 's'} left` : 'Free limit reached'}
          </Text>
        ) : null}
      </View>

      <View style={styles.chipsRow}>
        {chips.map((c) => {
          const isOpen = opened.has(c.key);
          const locked = !isOpen && tier !== 'pro' && followUpsUsed >= FREE_FOLLOWUP_LIMIT;
          return (
            <Pressable
              key={c.key}
              onPress={() => onTap(c.key)}
              style={({ pressed }) => [
                styles.chip,
                isOpen && styles.chipActive,
                locked && styles.chipLocked,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, isOpen && styles.chipTextActive, locked && styles.chipTextLocked]}>
                {locked ? `${c.label} · Pro` : c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {chips
        .filter((c) => opened.has(c.key))
        .map((c) => (
          <Animated.View key={c.key} entering={FadeIn.duration(160)} style={styles.followUpAnswer}>
            <Text style={styles.followUpAnswerLabel}>{c.label.toUpperCase()}</Text>
            <Text style={styles.followUpAnswerText}>{c.render()}</Text>
          </Animated.View>
        ))}
    </View>
  );
}

/* ────────────────────────── evaluator (pure) ────────────────────────── */

/**
 * Score 0-100 → 1-5 stars. Linear bucketing.
 *   0-19   ⇒ 1
 *   20-39  ⇒ 2
 *   40-59  ⇒ 3
 *   60-79  ⇒ 4
 *   80-100 ⇒ 5
 */
function toStars(score: number): number {
  if (score >= 80) return 5;
  if (score >= 60) return 4;
  if (score >= 40) return 3;
  if (score >= 20) return 2;
  return 1;
}

const AUDIENCE_WORDS = [
  'beginner', 'expert', 'student', 'teacher', 'engineer', 'cfo', 'pm',
  'manager', 'executive', 'developer', 'designer', 'audience', 'reader',
  'kid', 'child', '10-year-old', '10 year old', 'parent', 'investor', 'customer',
  'colleague', 'team', 'recruiter', 'client', 'user', 'doctor', 'nurse', 'founder',
  'senior', 'junior', 'apprentice', 'analyst', 'professor', 'undergrad', 'high school',
];

export function evaluatePrompt(rawDraft: string): PromptEvaluation {
  const draft = rawDraft.trim();
  const lower = draft.toLowerCase();
  const wordCount = draft.split(/\s+/).filter(Boolean).length;
  const hasMultipleSentences = /[.!?].+[.!?]/.test(draft);

  // ---------- Clarity ----------
  let clarity = 50;
  if (wordCount >= 8) clarity += 15;
  if (wordCount >= 18) clarity += 10;
  if (hasMultipleSentences) clarity += 15;
  if (/[.!?]\s/.test(draft)) clarity += 5;
  if (draft === draft.toUpperCase() && draft.length > 10) clarity -= 25;
  if (wordCount > 120) clarity -= 10;
  clarity = clamp(clarity);

  // ---------- Specificity ----------
  let specificity = 30;
  if (/\b\d+\b/.test(draft)) specificity += 20;
  if (/(in \d+ words|under \d+ words|max \d+ words|\d+ bullets|\d+ sentences|\d+ words)/i.test(draft)) specificity += 30;
  if (/\b(specifically|exactly|precisely|step.by.step)\b/i.test(draft)) specificity += 15;
  if (/\b(don't use|avoid|skip|no )\b/i.test(draft)) specificity += 15;
  specificity = clamp(specificity);

  // ---------- Audience ----------
  // Focused on naming WHO the answer is for.
  let audience = 20;
  if (AUDIENCE_WORDS.some((w) => lower.includes(w))) audience += 50;
  if (/\b(act as|you are|imagine you are|roleplay as|pretend you are)\b/i.test(draft)) audience += 20;
  if (/\bfor (a |an |the |my )/i.test(draft)) audience += 15;
  if (/\b(my (situation|goal|audience|context)|i am|i'm|i want to)\b/i.test(draft)) audience += 15;
  audience = clamp(audience);

  // ---------- Format ----------
  let format = 25;
  if (/\b(bullet|bullets|list|numbered list)\b/i.test(draft)) format += 25;
  if (/\btable\b/i.test(draft)) format += 25;
  if (/\b(json|markdown|yaml)\b/i.test(draft)) format += 25;
  if (/\b(paragraph|sentences?|words)\b/i.test(draft) && /\d/.test(draft)) format += 20;
  if (/\b(no intro|no preamble|skip the disclaimer|don't apologi[sz]e)\b/i.test(draft)) format += 15;
  format = clamp(format);

  const scores = { clarity, specificity, audience, format };
  const stars = {
    clarity: toStars(clarity),
    specificity: toStars(specificity),
    audience: toStars(audience),
    format: toStars(format),
  };
  const overallStars = Number(
    (((stars.clarity + stars.specificity + stars.audience + stars.format) / 4).toFixed(1))
  );
  const band: PromptEvaluation['band'] =
    overallStars >= 4.0 ? 'great' :
    overallStars >= 3.0 ? 'good' :
                          'try-again';

  const rationale = {
    clarity: rationaleFor('clarity', clarity, wordCount),
    specificity: rationaleFor('specificity', specificity, wordCount),
    audience: rationaleFor('audience', audience, wordCount),
    format: rationaleFor('format', format, wordCount),
  };

  return { scores, stars, overallStars, band, rationale };
}

function rationaleFor(judge: Judge, score: number, _wordCount: number): JudgeRationale {
  // Score band: low (<40), medium (40-69), high (>=70).
  const band = score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low';
  const lookup: Record<Judge, Record<'low' | 'mid' | 'high', JudgeRationale>> = {
    clarity: {
      low: {
        why: 'Your prompt is too short or fragmented for the AI to grip. Single words and shouting both confuse it.',
        tip: 'Stretch to at least one full sentence. Lower-case unless you mean to shout.',
      },
      mid: {
        why: "There's enough structure for the AI to follow, but the prompt could use one more sentence to set up the ask.",
        tip: 'Add a quick sentence explaining what you actually want done.',
      },
      high: {
        why: 'The prompt reads cleanly and has enough length to anchor the AI.',
        tip: 'Lock this clarity in and move to sharpening Specificity or Audience.',
      },
    },
    specificity: {
      low: {
        why: 'Nothing concrete to anchor the AI: no numbers, no length caps, no constraints.',
        tip: 'Add a count or length: "5 bullets", "under 80 words", "step by step." Numbers anchor.',
      },
      mid: {
        why: 'Some specifics, but the AI still has room to be vague where you wanted sharp.',
        tip: 'Layer one more constraint: a word ban, a maximum length, or a "step by step" instruction.',
      },
      high: {
        why: 'Constraints are well-defined: the AI has to hit your specific targets, not guess.',
        tip: 'Excellent — keep this constraint discipline in every prompt going forward.',
      },
    },
    audience: {
      low: {
        why: 'No named reader. The AI defaults to "average internet expert," which is rarely what you want.',
        tip: 'Add who this is for: "for a busy CFO" / "for a curious 10-year-old" / "for a junior engineer."',
      },
      mid: {
        why: 'Audience is hinted but not committed. AI takes its best guess.',
        tip: 'Name the reader explicitly with one trait: their role + one thing about them.',
      },
      high: {
        why: 'The reader is named, so the AI can pitch tone and depth correctly.',
        tip: 'Optional: layer a second trait ("a CFO who hates jargon") for even sharper output.',
      },
    },
    format: {
      low: {
        why: "No shape requested — the AI will default to a wall of prose, almost never what you want.",
        tip: 'End with the format: "Reply as a 5-bullet list" or "Reply as a 2-column table."',
      },
      mid: {
        why: 'A shape is suggested but loosely. Strong prompts state the shape unambiguously.',
        tip: 'Be explicit: name the format AND the count (5 bullets, 3 sentences, 2-column table).',
      },
      high: {
        why: 'Format is locked in. The AI has no excuse to drift back to essay-with-disclaimers.',
        tip: 'Worth saving this prompt structure as a reusable template.',
      },
    },
  };
  return lookup[judge][band];
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/* ────────────────────── follow-up fallback text ────────────────────── */

function fallbackWhy(ev: PromptEvaluation): string {
  const weakest = pickLowestJudge(ev);
  return (
    `Your overall ${ev.overallStars.toFixed(1)}/5 is the average of four independent judges. ` +
    `The weakest one was ${JUDGE_LABELS[weakest]} — that's where the AI had the least to work with. ` +
    'Strong prompts hit all four: a clear sentence, a named audience, a number or two, and an explicit shape.'
  );
}

function fallbackHowToImprove(ev: PromptEvaluation): string {
  const weakest = pickLowestJudge(ev);
  const tipMap: Record<Judge, string> = {
    clarity:
      'Stretch your prompt to a complete sentence or two. State the task in one clean line, then the constraints in the next.',
    specificity:
      'Add a number. "5 bullets", "under 80 words", "step by step" — pick whichever makes sense. Numbers anchor AI.',
    audience:
      'Name the reader. "For a busy CFO." "For a curious 10-year-old." That single phrase is the cheapest win in prompting.',
    format:
      'End with the format you want. "Reply as a 5-bullet list" or "Reply as a 2-column table" or "Max 80 words."',
  };
  return tipMap[weakest];
}

function fallbackExample(draft: string): string {
  // Build a stronger version using a templated structure.
  const seed = draft.slice(0, 50).replace(/[.!?]+$/, '');
  return (
    'Here\'s the same idea, prompted properly:\n\n' +
    `"${seed || 'Explain compound interest'} — for a curious 10-year-old. ` +
    'Reply as a 4-bullet list, one sentence each. ' +
    'No analogies that involve money — use food. ' +
    'End with one question I should ask next."\n\n' +
    'Notice the four moves: named audience, count + length cap, banned device, and a follow-up nudge.'
  );
}

function pickLowestJudge(ev: PromptEvaluation): Judge {
  const entries = Object.entries(ev.scores) as [Judge, number][];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
}

/* ────────────────────────── styles ────────────────────────── */

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: space['4'], paddingBottom: space['12'] },

  eyebrow: { ...text.label, color: palette.brandSoft, marginBottom: space['1'] },
  title: { ...text.headline, color: palette.textPrimary, marginBottom: space['2'] },
  body: { ...text.body, color: palette.textSecondary, marginBottom: space['5'] },

  inputBlock: { marginBottom: space['4'] },
  input: {
    minHeight: 160,
    borderRadius: radii.md,
    backgroundColor: palette.bgRaised,
    borderColor: palette.border,
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
  charCount: { ...text.caption, color: palette.textMuted },

  exampleBox: {
    marginTop: space['3'],
    backgroundColor: palette.bgRaised2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: space['4'],
  },
  exampleLabel: { ...text.label, color: palette.brandSoft, marginBottom: space['2'] },
  exampleText: { ...text.bodySmall, color: palette.textPrimary },

  actions: { gap: space['3'] },
  feedbackBlock: { gap: space['4'] },

  // Feedback card
  feedbackCard: {
    backgroundColor: palette.bgRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
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
  feedbackTitle: { ...text.title, color: palette.textPrimary, marginBottom: 2 },
  feedbackSubtitle: { ...text.bodySmall, color: palette.textSecondary },

  // SmileyScore styles
  smileyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space['3'], marginBottom: space['2'] },
  smileyWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  smileyTextCol: { flex: 1, minWidth: 0 },
  scoreChip: {
    alignSelf: 'flex-start',
    backgroundColor: palette.brandSoft,
    paddingHorizontal: space['3'],
    paddingVertical: 4,
    borderRadius: radii.full,
    marginTop: space['2'],
  },
  scoreChipText: {
    ...text.bodyEmphasis,
    color: palette.brand,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  detailsToggle: {
    alignSelf: 'flex-end',
    paddingVertical: space['1'],
    paddingHorizontal: space['2'],
  },
  detailsToggleText: {
    ...text.caption,
    color: palette.brand,
    fontFamily: 'Inter_600SemiBold',
  },
  judgeBarTrack: {
    height: 6,
    borderRadius: radii.full,
    backgroundColor: palette.divider,
    overflow: 'hidden',
    marginTop: 4,
  },
  judgeBarFill: { height: '100%', borderRadius: radii.full },

  judgesList: { gap: 4 },
  judgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space['3'],
    minHeight: 48,
  },
  judgeLabelCol: { flex: 1, minWidth: 0 },
  judgeLabel: { ...text.bodyEmphasis, color: palette.textPrimary, fontSize: 15 },
  judgeStars: { flexDirection: 'row', alignItems: 'center', gap: 2, marginHorizontal: space['3'] },
  star: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  starFilled: { color: palette.brandSoft },
  starEmpty: { color: palette.border },
  judgeCaret: { ...text.caption, color: palette.textMuted, width: 18, textAlign: 'right' },
  judgeRationale: {
    paddingHorizontal: space['3'],
    paddingTop: space['1'],
    paddingBottom: space['3'],
  },
  rationaleLabel: { ...text.label, color: palette.textMuted, marginBottom: space['1'] },
  rationaleText: { ...text.bodySmall, color: palette.textPrimary },

  // Follow-up chips
  followUpBlock: { gap: space['3'] },
  followUpHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  followUpLabel: { ...text.label, color: palette.brandSoft },
  followUpRemain: { ...text.caption, color: palette.textMuted },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space['2'],
  },
  chip: {
    paddingHorizontal: space['3'],
    paddingVertical: space['2'],
    borderRadius: radii.full,
    backgroundColor: palette.bgRaised,
    borderColor: palette.border,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: palette.brandWash,
    borderColor: palette.brand,
  },
  chipLocked: {
    opacity: 0.6,
  },
  chipText: { ...text.bodySmall, color: palette.textSecondary, fontFamily: 'Inter_600SemiBold' },
  chipTextActive: { color: palette.textPrimary },
  chipTextLocked: { color: palette.textMuted },

  followUpAnswer: {
    backgroundColor: palette.bgRaised2,
    borderRadius: radii.md,
    padding: space['4'],
    borderLeftColor: palette.brand,
    borderLeftWidth: 3,
  },
  followUpAnswerLabel: { ...text.label, color: palette.brandSoft, marginBottom: space['2'] },
  followUpAnswerText: { ...text.bodySmall, color: palette.textPrimary, lineHeight: 22 },
});
