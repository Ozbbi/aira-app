import React from 'react';
import { AiraMascot, MascotMood } from './AiraMascot';

/**
 * Legacy `AiraOrb` API — preserved so the rest of the app doesn't need
 * touching. Internally renders the new mascot. The old `intensity` prop
 * maps to a mood.
 *
 *   calm        → calm     (idle pages, splash)
 *   thinking    → thinking (loading screens)
 *   celebrating → celebrating
 *   listening   → encouraging
 */
type Intensity = 'calm' | 'thinking' | 'celebrating' | 'listening';

interface Props {
  size?: number;
  intensity?: Intensity;
}

const map: Record<Intensity, MascotMood> = {
  calm: 'calm',
  thinking: 'thinking',
  celebrating: 'celebrating',
  listening: 'encouraging',
};

export function AiraOrb({ size = 120, intensity = 'calm' }: Props) {
  return <AiraMascot size={size} mood={map[intensity]} />;
}
