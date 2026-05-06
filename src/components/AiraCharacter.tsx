import React from 'react';
import { AiraMascot, MascotMood } from './AiraMascot';

/**
 * Legacy `AiraCharacter` API — preserved so the rest of the app doesn't
 * need touching. Internally renders the new `AiraMascot` so every screen
 * gets the proper face character with no per-screen swap.
 *
 * The old `proud` mood maps to `celebrating`.
 */
type LegacyMood = MascotMood | 'proud';

interface Props {
  mood?: LegacyMood;
  size?: number;
}

const moodMap: Record<LegacyMood, MascotMood> = {
  calm: 'calm',
  thinking: 'thinking',
  happy: 'happy',
  celebrating: 'celebrating',
  encouraging: 'encouraging',
  proud: 'celebrating',
};

export function AiraCharacter({ mood = 'calm', size = 120 }: Props) {
  return <AiraMascot size={size} mood={moodMap[mood] ?? 'calm'} />;
}
