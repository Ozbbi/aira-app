import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { TopicScreen } from '../screens/TopicScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { TrackDetailScreen } from '../screens/TrackDetailScreen';
import { LearningMapScreen } from '../screens/LearningMapScreen';
import { CodeTrackScreen } from '../screens/CodeTrackScreen';
import { PromptOrNotScreen } from '../screens/PromptOrNotScreen';
import { FlashcardsScreen } from '../screens/FlashcardsScreen';
import { FlashcardReviewScreen } from '../screens/FlashcardReviewScreen';
import { NotebookScreen } from '../screens/NotebookScreen';
import { MockExamScreen } from '../screens/MockExamScreen';
import { TabNavigator } from './TabNavigator';
import { useUserStore } from '../store/userStore';
import { colors } from '../theme';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const userId = useUserStore((s) => s.userId);

  const authToken = useUserStore((s) => s.authToken);

  // Skip onboarding if user has a session (auth token or anonymous offline id)
  const hasUser = userId.length > 0;

  return (
    <Stack.Navigator
      initialRouteName={hasUser ? 'MainTabs' : 'Onboarding'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ animation: 'fade', animationDuration: 300 }}
      />
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ animation: 'fade', animationDuration: 300 }}
      />
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ animation: 'fade', animationDuration: 300 }}
      />
      <Stack.Screen name="Topic" component={TopicScreen} />
      <Stack.Screen
        name="Lesson"
        component={LessonScreen}
        options={{ animation: 'slide_from_bottom', animationDuration: 350 }}
      />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom', animationDuration: 400 }}
      />
      <Stack.Screen
        name="TrackDetail"
        component={TrackDetailScreen}
      />
      <Stack.Screen
        name="LearningMap"
        component={LearningMapScreen}
      />
      <Stack.Screen
        name="CodeTrack"
        component={CodeTrackScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PromptOrNot"
        component={PromptOrNotScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="Flashcards"
        component={FlashcardsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="FlashcardReview"
        component={FlashcardReviewScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="Notebook"
        component={NotebookScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="MockExam"
        component={MockExamScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  );
}
