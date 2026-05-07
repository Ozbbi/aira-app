import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CODE_LESSONS, CodeLanguage, CodeLevel } from '../data';
import { AiraMascot } from '../components/AiraMascot';
import { colors, radius, spacing, typography } from '../theme';
import { haptics } from '../utils/haptics';
import type { RootStackParamList } from '../types';

/**
 * Code track entry — a small wizard, not a full screen of options.
 *
 * Step 1: pick a language (Python / Java / HTML)
 * Step 2: pick a level (Beginner / Intermediate)
 * Step 3: confirmation card → tap → routes to the matching lesson id
 *
 * Each language has its own gradient theme. The mascot reacts:
 * thinking on language pick, encouraging on level pick, celebrating
 * on confirm.
 */

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
}

interface LangDef {
  id: CodeLanguage;
  label: string;
  emoji: string;
  blurb: string;
  gradient: readonly [string, string, ...string[]];
}

const LANGUAGES: LangDef[] = [
  { id: 'python', label: 'Python', emoji: '🐍', blurb: 'Cleanest start. Used everywhere from data to AI.', gradient: ['#3776AB', '#FFD43B'] as const },
  { id: 'java',   label: 'Java',   emoji: '☕', blurb: 'Strict, structured, the Android & enterprise default.', gradient: ['#F89820', '#5382A1'] as const },
  { id: 'html',   label: 'HTML',   emoji: '🌐', blurb: 'The language of every web page you’ve ever seen.', gradient: ['#E34F26', '#F06529'] as const },
];

const LEVELS: { id: CodeLevel; label: string; sub: string; gradient: readonly [string, string, ...string[]] }[] = [
  { id: 'beginner',     label: 'Beginner',     sub: "I've never written code, or barely.", gradient: ['#10B981', '#06B6D4'] as const },
  { id: 'intermediate', label: 'Intermediate', sub: "I've written some code, want depth.",  gradient: ['#8B5CF6', '#EC4899'] as const },
];

export function CodeTrackScreen({ navigation }: Props) {
  const [language, setLanguage] = useState<CodeLanguage | null>(null);
  const [level, setLevel] = useState<CodeLevel | null>(null);

  const lesson = language && level
    ? CODE_LESSONS.find((l) => l.language === language && l.level === level)
    : undefined;

  const langDef = LANGUAGES.find((l) => l.id === language);

  const onPickLanguage = (id: CodeLanguage) => {
    haptics.select();
    setLanguage(id);
    setLevel(null);
  };
  const onPickLevel = (id: CodeLevel) => {
    haptics.select();
    setLevel(id);
  };
  const onStart = () => {
    if (!lesson) return;
    haptics.medium();
    navigation.navigate('Lesson', { lessonId: lesson.id });
  };

  const stage: 'lang' | 'level' | 'go' = !language ? 'lang' : !level ? 'level' : 'go';
  const mascotMood =
    stage === 'lang' ? 'calm' : stage === 'level' ? 'encouraging' : 'celebrating';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
        <Text style={styles.backIcon}>←</Text>
      </Pressable>

      <Animated.View entering={FadeIn.duration(260)} style={styles.heroWrap}>
        <AiraMascot size={120} mood={mascotMood} />
        <Text style={styles.eyebrow}>LEARN HOW TO CODE</Text>
        <Text style={styles.headline}>
          {stage === 'lang' && 'Which language do you want?'}
          {stage === 'level' && 'How much have you coded before?'}
          {stage === 'go' && "Let's begin."}
        </Text>
        <Text style={styles.sub}>
          {stage === 'lang' && 'Pick one. You can always switch later.'}
          {stage === 'level' && 'Be honest. The lesson is calibrated to your level.'}
          {stage === 'go' && langDef && `${langDef.label} · ${level === 'beginner' ? 'Beginner' : 'Intermediate'} — your first lesson is ready.`}
        </Text>
      </Animated.View>

      {/* STEP 1 — language picker */}
      {stage === 'lang' && (
        <View style={styles.cards}>
          {LANGUAGES.map((l, i) => (
            <Animated.View key={l.id} entering={FadeInDown.duration(260).delay(i * 50)}>
              <Pressable onPress={() => onPickLanguage(l.id)} style={({ pressed }) => [pressed && styles.pressed]}>
                <LinearGradient
                  colors={l.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.langCard}
                >
                  <Text style={styles.langEmoji}>{l.emoji}</Text>
                  <View style={styles.langTextCol}>
                    <Text style={styles.langLabel}>{l.label}</Text>
                    <Text style={styles.langBlurb}>{l.blurb}</Text>
                  </View>
                  <Text style={styles.arrow}>→</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      )}

      {/* STEP 2 — level picker */}
      {stage === 'level' && langDef && (
        <View style={styles.cards}>
          {LEVELS.map((lv, i) => (
            <Animated.View key={lv.id} entering={FadeInDown.duration(260).delay(i * 50)}>
              <Pressable onPress={() => onPickLevel(lv.id)} style={({ pressed }) => [pressed && styles.pressed]}>
                <LinearGradient
                  colors={lv.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.levelCard}
                >
                  <Text style={styles.levelLabel}>{lv.label}</Text>
                  <Text style={styles.levelSub}>{lv.sub}</Text>
                  <Text style={styles.arrow}>→</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ))}
          <Pressable onPress={() => setLanguage(null)} hitSlop={12} style={styles.changeLang}>
            <Text style={styles.changeLangText}>← Change language</Text>
          </Pressable>
        </View>
      )}

      {/* STEP 3 — start the lesson */}
      {stage === 'go' && lesson && langDef && (
        <Animated.View entering={FadeInDown.duration(260)} style={styles.cards}>
          <LinearGradient
            colors={langDef.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.lessonPreview}
          >
            <Text style={styles.lessonEyebrow}>FIRST LESSON</Text>
            <Text style={styles.lessonTitle}>{lesson.title}</Text>
            <Text style={styles.lessonHook}>{lesson.airaIntro}</Text>
          </LinearGradient>

          <Pressable onPress={onStart} style={({ pressed }) => [pressed && styles.pressed]}>
            <LinearGradient
              colors={['#F59E0B', '#EC4899', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startBtn}
            >
              <Text style={styles.startBtnText}>Start lesson →</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => setLevel(null)} hitSlop={12} style={styles.changeLang}>
            <Text style={styles.changeLangText}>← Change level</Text>
          </Pressable>
        </Animated.View>
      )}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 100 },
  back: { paddingVertical: spacing.sm, marginBottom: spacing.sm },
  backIcon: { fontSize: 26, color: colors.textPrimary },

  heroWrap: { alignItems: 'center', marginBottom: spacing.lg, gap: spacing.sm },
  eyebrow: { ...typography.label, color: colors.airaGlow, marginTop: spacing.sm },
  headline: { ...typography.headline, color: colors.textPrimary, textAlign: 'center' },
  sub: { ...typography.body, color: colors.textSecondary, textAlign: 'center', maxWidth: 320 },

  cards: { gap: spacing.md, marginTop: spacing.lg },

  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  langEmoji: { fontSize: 40 },
  langTextCol: { flex: 1, minWidth: 0 },
  langLabel: { ...typography.title, color: '#FFFFFF', marginBottom: 4 },
  langBlurb: { ...typography.body, fontSize: 13, color: 'rgba(255,255,255,0.92)', lineHeight: 18 },
  arrow: { fontSize: 22, color: '#FFFFFF' },

  levelCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  levelLabel: { ...typography.headline, color: '#FFFFFF', marginBottom: 4 },
  levelSub: { ...typography.body, color: 'rgba(255,255,255,0.92)', marginBottom: 8 },

  lessonPreview: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  lessonEyebrow: {
    ...typography.label,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
  },
  lessonTitle: {
    ...typography.title,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  lessonHook: { ...typography.body, color: 'rgba(255,255,255,0.92)' },

  startBtn: {
    paddingVertical: spacing.md + 2,
    borderRadius: radius.full,
    alignItems: 'center',
    shadowColor: '#EC4899',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  startBtnText: { ...typography.button, color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 17 },

  changeLang: { alignSelf: 'center', paddingVertical: spacing.sm },
  changeLangText: { ...typography.caption, color: colors.textSecondary },

  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

  bottomSpace: { height: 40 },
});
