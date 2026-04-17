import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../components/ScreenContainer';
import { haptics } from '../utils/haptics';
import { AiraOrb } from '../components/AiraOrb';
import { AiraMessage } from '../components/AiraMessage';
import { GradientButton } from '../components/GradientButton';
import { fetchCurriculum, NetworkError } from '../services/lessonService';
import { useUserStore } from '../store/userStore';
import { colors, typography, spacing, radius } from '../theme';
import type { RootStackParamList, CurriculumTopic, CurriculumLesson } from '../types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Topic'>;
  route: RouteProp<RootStackParamList, 'Topic'>;
}

type Phase = 'loading' | 'ready' | 'error';

export function TopicScreen({ navigation, route }: Props) {
  const userId = useUserStore((s) => s.userId);
  const topicName = route.params.topicName;

  const [phase, setPhase] = useState<Phase>('loading');
  const [topic, setTopic] = useState<CurriculumTopic | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const load = useCallback(async () => {
    setPhase('loading');
    setErrorMsg('');
    try {
      const data = await fetchCurriculum(userId);
      const found = data.topics.find((t) => t.name === topicName) ?? null;
      setTopic(found);
      setPhase('ready');
    } catch (err) {
      setErrorMsg(
        err instanceof NetworkError
          ? "Can't reach the server right now."
          : 'Something went wrong loading this topic.'
      );
      setPhase('error');
    }
  }, [userId, topicName]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleLessonPress = (lesson: CurriculumLesson) => {
    if (lesson.status === 'locked') {
      haptics.warning();
      return;
    }
    haptics.tap();
    navigation.navigate('Lesson', { lessonId: lesson.id });
  };

  // --- LOADING ---
  if (phase === 'loading') {
    return (
      <ScreenContainer>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeText}>{'\u2190'}</Text>
          </Pressable>
        </View>
        <View style={styles.center}>
          <AiraOrb size={64} intensity="thinking" />
        </View>
      </ScreenContainer>
    );
  }

  // --- ERROR ---
  if (phase === 'error' || !topic) {
    return (
      <ScreenContainer>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeText}>{'\u2190'}</Text>
          </Pressable>
        </View>
        <View style={styles.center}>
          <AiraOrb size={64} intensity="calm" />
          <AiraMessage message={errorMsg || `I couldn't find the "${topicName}" topic.`} />
          <GradientButton title="Try Again" onPress={load} fullWidth />
        </View>
      </ScreenContainer>
    );
  }

  const progressPct = topic.totalCount > 0 ? (topic.completedCount / topic.totalCount) * 100 : 0;

  return (
    <ScreenContainer scroll>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            haptics.tap();
            navigation.goBack();
          }}
          style={styles.closeBtn}
        >
          <Text style={styles.closeText}>{'\u2190'}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.topicLabel}>TOPIC</Text>
        <Text style={styles.topicTitle}>{topic.name}</Text>
        <Text style={styles.topicSub}>
          {topic.completedCount} of {topic.totalCount} lessons completed
        </Text>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[...colors.gradientPrimary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progressPct}%` }]}
          />
        </View>
      </View>

      {/* Lesson path */}
      <View style={styles.path}>
        {topic.lessons.map((lesson, idx) => (
          <LessonNode
            key={lesson.id}
            lesson={lesson}
            index={idx}
            isLast={idx === topic.lessons.length - 1}
            onPress={() => handleLessonPress(lesson)}
          />
        ))}
      </View>

      <View style={styles.bottomSpacer} />
    </ScreenContainer>
  );
}

interface NodeProps {
  lesson: CurriculumLesson;
  index: number;
  isLast: boolean;
  onPress: () => void;
}

function LessonNode({ lesson, index, isLast, onPress }: NodeProps) {
  // Alternate left/right offset for a path feel
  const offset = index % 2 === 0 ? -20 : 20;

  const isLocked = lesson.status === 'locked';
  const isCompleted = lesson.status === 'completed';

  const icon = isCompleted ? '\u2713' : isLocked ? '\uD83D\uDD12' : String(index + 1);

  return (
    <View style={[nodeStyles.row, { transform: [{ translateX: offset }] }]}>
      <View style={nodeStyles.nodeWrap}>
        <Pressable
          onPress={onPress}
          disabled={isLocked}
          style={({ pressed }) => [
            nodeStyles.node,
            pressed && !isLocked && nodeStyles.nodePressed,
          ]}
        >
          {isCompleted ? (
            <LinearGradient
              colors={[...colors.gradientSuccess]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={nodeStyles.nodeGradient}
            >
              <Text style={nodeStyles.nodeIconLight}>{icon}</Text>
            </LinearGradient>
          ) : isLocked ? (
            <View style={nodeStyles.nodeLocked}>
              <Text style={nodeStyles.nodeIconMuted}>{icon}</Text>
            </View>
          ) : (
            <LinearGradient
              colors={[...colors.gradientPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={nodeStyles.nodeGradient}
            >
              <Text style={nodeStyles.nodeIconLight}>{icon}</Text>
            </LinearGradient>
          )}
        </Pressable>
        {!isLast && <View style={nodeStyles.connector} />}
      </View>

      <Pressable onPress={onPress} disabled={isLocked} style={nodeStyles.cardWrap}>
        <View
          style={[
            nodeStyles.card,
            isLocked && nodeStyles.cardLocked,
            isCompleted && nodeStyles.cardCompleted,
          ]}
        >
          <Text
            style={[nodeStyles.cardTitle, isLocked && nodeStyles.textLocked]}
            numberOfLines={2}
          >
            {lesson.title}
          </Text>
          <View style={nodeStyles.cardMetaRow}>
            <View style={nodeStyles.diffRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    nodeStyles.star,
                    i < lesson.difficulty && !isLocked && nodeStyles.starFilled,
                    i < lesson.difficulty && isLocked && nodeStyles.starLocked,
                  ]}
                />
              ))}
            </View>
            <Text style={[nodeStyles.cardMeta, isLocked && nodeStyles.textLocked]}>
              {isCompleted ? 'Replay' : isLocked ? 'Locked' : `${lesson.questionCount} questions`}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: 18,
  },
  header: {
    marginBottom: spacing.xl,
  },
  topicLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  topicTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  topicSub: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  path: {
    gap: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});

const nodeStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nodeWrap: {
    alignItems: 'center',
  },
  node: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  nodePressed: {
    transform: [{ scale: 0.94 }],
  },
  nodeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeLocked: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeIconLight: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  nodeIconMuted: {
    color: colors.textMuted,
    fontSize: 18,
  },
  connector: {
    width: 2,
    height: spacing.md,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  cardWrap: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLocked: {
    opacity: 0.5,
  },
  cardCompleted: {
    borderColor: colors.success + '60',
  },
  cardTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diffRow: {
    flexDirection: 'row',
    gap: 3,
  },
  star: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  starFilled: {
    backgroundColor: colors.warning,
  },
  starLocked: {
    backgroundColor: colors.textMuted,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  textLocked: {
    color: colors.textMuted,
  },
});
