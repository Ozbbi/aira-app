/**
 * Sound effects for AIRA.
 *
 * Design notes:
 * - Uses expo-av Audio.Sound (lazy-required so app doesn't crash if the
 *   package isn't installed yet).
 * - Defensive: if an .mp3 asset is missing or expo-av is absent, we
 *   silently no-op. Sound is a delight, not critical path.
 * - Respects the `soundsEnabled` flag from the user store.
 *
 * To fully enable:
 *   1) `npx expo install expo-av`
 *   2) drop these files into `mobile/assets/sounds/`:
 *        tap.mp3       (~50ms, soft click)
 *        correct.mp3   (~300ms, pleasant chime)
 *        wrong.mp3     (~200ms, low thud, NOT harsh)
 *        levelup.mp3   (~800ms, triumphant flourish)
 *   3) uncomment the `require(...)` lines below in SOUND_SOURCES.
 */

import { useUserStore } from '../store/userStore';

type SoundKey = 'tap' | 'correct' | 'wrong' | 'levelup';

// Lazy-require expo-av; returns null if not installed yet.
let _Audio: any = null;
function getAudio(): any | null {
  if (_Audio) return _Audio;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _Audio = require('expo-av').Audio;
    return _Audio;
  } catch {
    return null;
  }
}

const SOUND_SOURCES: Record<SoundKey, any> = {
  tap: null,
  correct: null,
  wrong: null,
  levelup: null,
  // Uncomment after adding the assets:
  // tap: require('../../assets/sounds/tap.mp3'),
  // correct: require('../../assets/sounds/correct.mp3'),
  // wrong: require('../../assets/sounds/wrong.mp3'),
  // levelup: require('../../assets/sounds/levelup.mp3'),
};

const loadedSounds: Partial<Record<SoundKey, any>> = {};
let initialized = false;

async function init() {
  if (initialized) return;
  initialized = true;
  const Audio = getAudio();
  if (!Audio) return;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
    });
  } catch {}

  for (const key of Object.keys(SOUND_SOURCES) as SoundKey[]) {
    const src = SOUND_SOURCES[key];
    if (!src) continue;
    try {
      const { sound } = await Audio.Sound.createAsync(src, {
        shouldPlay: false,
        volume: 0.5,
      });
      loadedSounds[key] = sound;
    } catch {
      // Missing asset or decoding error — skip silently.
    }
  }
}

async function play(key: SoundKey) {
  const enabled = useUserStore.getState().soundsEnabled;
  if (!enabled) return;

  const Audio = getAudio();
  if (!Audio) return;

  if (!initialized) init().catch(() => {});

  const s = loadedSounds[key];
  if (!s) return;

  try {
    await s.setPositionAsync(0);
    await s.playAsync();
  } catch {}
}

export const sounds = {
  init,
  tap: () => play('tap'),
  correct: () => play('correct'),
  wrong: () => play('wrong'),
  levelup: () => play('levelup'),
};
