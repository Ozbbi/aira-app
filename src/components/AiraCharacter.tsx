import React from 'react';
import { AiraMascot, MascotMood, AraState } from './AiraMascot';

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
