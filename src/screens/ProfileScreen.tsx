import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Switch, ScrollView, TextInput, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PencilSimple, SpeakerHigh, Vibrate, Bell, Eye, SignOut, Trash } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AiraMascot } from '../components/AiraMascot';
import { totalDueAcrossDecks } from '../data/flashcards';
import { colors, typography, spacing, radius, elevation } from '../theme';
import type { RootStackParamList } from '../types';
import { useUserStore } from '../store/userStore';

export function ProfileScreen() {
  const {
    name, email, xp, level, totalLessonsCompleted, bookmarks,
    soundsEnabled, hapticsEnabled, showMascot, notificationsEnabled,
  } = useUserStore();
  const setUser = useUserStore((s) => s.setUser);
  const resetStore = useUserStore((s) => s.resetStore);

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(name);
  const [resetStep, setResetStep] = useState(0);
  const [resetText, setResetText] = useState('');

  const handleSaveName = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUser({ name: newName.trim() });
    setEditingName(false);
  };

  const handleResetProgress = () => {
    if (resetStep === 0) {
      Alert.alert('Reset Progress', 'Are you sure? This action cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: () => setResetStep(1) },
      ]);
    } else if (resetStep === 1) {
      Alert.alert(
        'Final Warning',
        'This cannot be undone. All XP, streaks, and lessons will be lost.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setResetStep(0) },
          { text: 'I understand', style: 'destructive', onPress: () => setResetStep(2) },
        ],
      );
    }
  };

  const handleConfirmReset = () => {
    if (resetText.toUpperCase() === 'RESET') {
      resetStore();
      setResetStep(0);
      setResetText('');
    }
  };

  const initial = (name || 'A').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar + Name */}
        <Animated.View entering={FadeInDown.duration(250)} style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
          <Pressable onPress={() => setEditingName(true)} style={styles.nameRow}>
            <Text style={styles.profileName}>{name || 'Set your name'}</Text>
            <PencilSimple size={16} color={colors.textDisabled} />
          </Pressable>
          {email ? <Text style={styles.profileEmail}>{email}</Text> : null}
        </Animated.View>

        {/* Saved Insights */}
        <Animated.View entering={FadeInDown.duration(250).delay(40)} style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Insights</Text>
          {bookmarks.length === 0 ? (
            <View style={styles.emptyCard}>
              <AiraMascot size={48} state="idle" />
              <Text style={styles.emptyText}>
                Save insights from your home feed to read them here.
              </Text>
            </View>
          ) : (
            <View style={styles.savedGrid}>
              {bookmarks.slice(0, 6).map((id) => (
                <View key={id} style={styles.savedCard}>
                  <Text style={styles.savedText} numberOfLines={2}>Insight #{id}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* My Flashcards entry */}
        <MyFlashcardsRow />

        {/* Sandbox history */}
        <SandboxHistorySection />

        {/* Portfolio */}
        <Animated.View entering={FadeInDown.duration(250).delay(80)} style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio Projects</Text>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Your first capstone project will appear here.</Text>
          </View>
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInDown.duration(250).delay(120)} style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <SettingToggle
            icon={<SpeakerHigh size={20} color={colors.textSecondary} />}
            label="Sound Effects"
            value={soundsEnabled}
            onToggle={(v) => setUser({ soundsEnabled: v })}
          />
          <SettingToggle
            icon={<Vibrate size={20} color={colors.textSecondary} />}
            label="Haptics"
            value={hapticsEnabled}
            onToggle={(v) => setUser({ hapticsEnabled: v })}
          />
          <SettingToggle
            icon={<Eye size={20} color={colors.textSecondary} />}
            label="Show Mascot"
            value={showMascot}
            onToggle={(v) => setUser({ showMascot: v })}
          />
          <SettingToggle
            icon={<Bell size={20} color={colors.textSecondary} />}
            label="Notifications"
            value={notificationsEnabled}
            onToggle={(v) => setUser({ notificationsEnabled: v })}
          />

          <Pressable style={styles.settingRowDestructive} onPress={handleResetProgress}>
            <Trash size={20} color={colors.error} />
            <Text style={styles.settingLabelDestructive}>Reset Progress</Text>
          </Pressable>
        </Animated.View>

        {/* Reset Step 3 */}
        {resetStep === 2 && (
          <Animated.View entering={FadeInDown.duration(200)} style={styles.resetConfirmCard}>
            <Text style={styles.resetConfirmText}>Type "RESET" to confirm:</Text>
            <TextInput
              style={styles.resetInput}
              value={resetText}
              onChangeText={setResetText}
              placeholder="RESET"
              placeholderTextColor={colors.textDisabled}
              autoCapitalize="characters"
            />
            <Pressable
              style={[styles.resetBtn, resetText.toUpperCase() !== 'RESET' && styles.resetBtnDisabled]}
              onPress={handleConfirmReset}
              disabled={resetText.toUpperCase() !== 'RESET'}
            >
              <Text style={styles.resetBtnText}>Confirm Reset</Text>
            </Pressable>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />

        {/* Edit Name Modal */}
        <Modal visible={editingName} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Name</Text>
              <TextInput
                style={styles.modalInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Your name"
                placeholderTextColor={colors.textDisabled}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <Pressable style={styles.modalBtnCancel} onPress={() => { setEditingName(false); setNewName(name); }}>
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.modalBtnSave} onPress={handleSaveName}>
                  <Text style={styles.modalBtnTextSave}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingToggle({ icon, label, value, onToggle }: { icon: React.ReactNode; label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.settingRow}>
      {icon}
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.divider, true: colors.cyan }}
        thumbColor={colors.textPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: spacing.lg },

  // Profile header
  profileHeader: { alignItems: 'center', marginBottom: spacing.xxl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.cardSurface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.cyan, marginBottom: spacing.md,
  },
  avatarLetter: { fontFamily: 'Inter_700Bold', fontSize: 32, color: colors.cyan },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  profileName: { ...typography.headline, color: colors.textPrimary },
  profileEmail: { ...typography.caption, color: colors.textSecondary },

  // Sections
  section: { marginBottom: spacing.xxl },
  sectionTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.md },

  // Empty states
  emptyCard: {
    backgroundColor: colors.cardSurface, borderRadius: radius.lg,
    padding: 20, alignItems: 'center', gap: 12, ...elevation.sm,
  },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },

  // Saved
  savedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  savedCard: {
    width: '47%', backgroundColor: colors.cardSurface, borderRadius: radius.md,
    padding: 14, ...elevation.sm,
  },
  savedText: { ...typography.caption, color: colors.textPrimary },

  // Settings
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.cardSurface, borderRadius: radius.md,
    padding: 16, marginBottom: spacing.sm,
  },
  settingLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  settingRowDestructive: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.cardSurface, borderRadius: radius.md,
    padding: 16, marginTop: spacing.md,
    borderWidth: 1, borderColor: colors.error,
  },
  settingLabelDestructive: { ...typography.body, color: colors.error, flex: 1 },

  // Reset confirmation
  resetConfirmCard: {
    backgroundColor: colors.cardSurface, borderRadius: radius.lg,
    padding: 20, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.error,
  },
  resetConfirmText: { ...typography.body, color: colors.error, marginBottom: spacing.md },
  resetInput: {
    backgroundColor: colors.bg, borderRadius: radius.md, padding: 14,
    ...typography.body, color: colors.textPrimary, borderWidth: 1, borderColor: colors.divider,
    marginBottom: spacing.md, textAlign: 'center',
  },
  resetBtn: {
    backgroundColor: colors.error, borderRadius: radius.md,
    padding: 14, alignItems: 'center',
  },
  resetBtnDisabled: { opacity: 0.4 },
  resetBtnText: { ...typography.button, color: '#FFFFFF' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: colors.cardSurface, borderRadius: radius.lg, padding: 24 },
  modalTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.lg },
  modalInput: {
    backgroundColor: colors.bg, borderRadius: radius.md, padding: 14,
    ...typography.body, color: colors.textPrimary, borderWidth: 1, borderColor: colors.divider,
    marginBottom: spacing.lg,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtnCancel: { flex: 1, padding: 14, borderRadius: radius.md, backgroundColor: colors.bg, alignItems: 'center' },
  modalBtnSave: { flex: 1, padding: 14, borderRadius: radius.md, backgroundColor: colors.cyan, alignItems: 'center' },
  modalBtnText: { ...typography.button, color: colors.textSecondary },
  modalBtnTextSave: { ...typography.button, color: colors.bg },

  // Sandbox history
  historyFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  historyChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
  },
  historyChipActive: {
    backgroundColor: colors.bgCardHover,
    borderColor: colors.airaCore,
  },
  historyChipText: { ...typography.caption, color: colors.textSecondary },
  historyChipTextActive: { color: colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  historySearch: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  historyEntry: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  historyEntryHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  historyEntryDate: { ...typography.caption, color: colors.textMuted },
  historyEntryStars: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.airaGlow,
  },
  historyEntryPrompt: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },

  // My Flashcards row
  flashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 72,
  },
  flashRowLeft: { flex: 1, minWidth: 0, gap: 2 },
  flashRowTitle: { ...typography.body, color: colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  flashRowSub: { ...typography.caption, color: colors.textSecondary },
  flashRowChevron: { ...typography.headline, color: colors.textMuted, paddingLeft: spacing.sm },
});

/* ─────────────────────── My Flashcards Row ─────────────────────── */

function MyFlashcardsRow() {
  const decks = useUserStore((s) => s.flashcardDecks);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const due = totalDueAcrossDecks(decks);

  return (
    <Animated.View entering={FadeInDown.duration(250).delay(60)} style={styles.section}>
      <Text style={styles.sectionTitle}>My Flashcards</Text>
      <Pressable
        onPress={() => navigation.navigate('Flashcards')}
        style={({ pressed }) => [styles.flashRow, pressed && { opacity: 0.95 }]}
      >
        <View style={styles.flashRowLeft}>
          <Text style={styles.flashRowTitle}>
            {decks.length === 0
              ? 'No decks yet'
              : `${decks.length} deck${decks.length === 1 ? '' : 's'}`}
          </Text>
          <Text style={styles.flashRowSub}>
            {decks.length === 0
              ? 'Finish a lesson and tap “Create Flashcards” to spawn your first deck.'
              : due > 0
                ? `${due} card${due === 1 ? '' : 's'} due today`
                : 'All caught up · review anyway from the deck list'}
          </Text>
        </View>
        <Text style={styles.flashRowChevron}>›</Text>
      </Pressable>
    </Animated.View>
  );
}

/* ─────────────────────── Sandbox History Section ─────────────────────── */

type HistoryFilter = 'all' | '7d' | '30d';

function SandboxHistorySection() {
  const history = useUserStore((s) => s.sandboxHistory);
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [q, setQ] = useState('');

  const filtered = React.useMemo(() => {
    const now = Date.now();
    const cutoff =
      filter === '7d' ? now - 7 * 86400_000 :
      filter === '30d' ? now - 30 * 86400_000 :
      -Infinity;
    return history
      .filter((e) => new Date(e.timestamp).getTime() >= cutoff)
      .filter((e) =>
        q.trim().length === 0
          ? true
          : e.prompt.toLowerCase().includes(q.trim().toLowerCase()) ||
            (e.lessonId || '').toLowerCase().includes(q.trim().toLowerCase())
      )
      .slice(0, 20);
  }, [history, filter, q]);

  return (
    <Animated.View entering={FadeInDown.duration(250).delay(70)} style={styles.section}>
      <Text style={styles.sectionTitle}>Sandbox History</Text>

      {history.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Your sandbox submissions will appear here with their full multi-judge breakdown.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.historyFilters}>
            {(['all', '7d', '30d'] as HistoryFilter[]).map((f) => {
              const active = filter === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  style={[styles.historyChip, active && styles.historyChipActive]}
                >
                  <Text style={[styles.historyChipText, active && styles.historyChipTextActive]}>
                    {f === 'all' ? 'All' : f === '7d' ? 'Last 7 days' : 'Last 30 days'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by prompt or lesson…"
            placeholderTextColor={colors.textMuted}
            style={styles.historySearch}
          />
          {filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No submissions match this filter.</Text>
            </View>
          ) : (
            filtered.map((entry) => (
              <View key={entry.id} style={styles.historyEntry}>
                <View style={styles.historyEntryHead}>
                  <Text style={styles.historyEntryDate}>
                    {new Date(entry.timestamp).toLocaleDateString()} ·{' '}
                    {entry.lessonId || 'free practice'}
                  </Text>
                  <Text style={styles.historyEntryStars}>
                    {entry.overallStars.toFixed(1)} ★
                  </Text>
                </View>
                <Text style={styles.historyEntryPrompt} numberOfLines={3}>
                  {entry.prompt}
                </Text>
              </View>
            ))
          )}
        </>
      )}
    </Animated.View>
  );
}
