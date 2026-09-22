import { PowerUpType } from './types';

export const POWER_UP_CONFIG: Record<
  PowerUpType,
  { label: string; color: string; duration: number; icon: string; description: string }
> = {
  double_ball: {
    label: '2x Sharlar',
    color: '#38bdf8',
    duration: 0, // instant
    icon: '⚡',
    description: 'Maydondagi barcha sharlarni ikkiga koʻpaytiradi!'
  },
  expand_paddle: {
    label: 'Keng Qalqon',
    color: '#4ade80',
    duration: 10,
    icon: '↔️',
    description: '10 soniyaga qalqonni 50% ga kengaytiradi!'
  },
  laser_cannon: {
    label: 'Lazer Qurol',
    color: '#f43f5e',
    duration: 8,
    icon: '🔫',
    description: 'Qalqon avtomatik lazer otib bloklarni teshib tashlaydi!'
  },
  fireball: {
    label: 'Olovli Shar',
    color: '#fb923c',
    duration: 8,
    icon: '🔥',
    description: 'Sharlar toʻxtovsiz bloklarni kuydirib, teshib oʻtadi!'
  },
  safety_net: {
    label: 'Himoya Toʻri',
    color: '#818cf8',
    duration: 15,
    icon: '🛡️',
    description: 'Pastki qismga sharlarni qutqaruvchi plazma toʻsiq qoʻyadi!'
  },
  bomb_blast: {
    label: 'Katta Bomba',
    color: '#eab308',
    duration: 0,
    icon: '💣',
    description: 'Atrofdagi bir nechta bloklarni darhol portlatadi!'
  },
  slow_motion: {
    label: 'Sekin Harakat',
    color: '#c084fc',
    duration: 6,
    icon: '⏳',
    description: 'Sharlarning tezligini vaqtincha pasaytirib, boshqaruvni osonlashtiradi!'
  }
};

export function getHpColor(currentHp: number, maxHp: number): { fill: string; border: string; glow: string } {
  if (currentHp <= 1) {
    return { fill: '#059669', border: '#34d399', glow: 'rgba(52, 211, 153, 0.4)' };
  } else if (currentHp === 2) {
    return { fill: '#0284c7', border: '#38bdf8', glow: 'rgba(56, 189, 248, 0.4)' };
  } else if (currentHp === 3) {
    return { fill: '#2563eb', border: '#60a5fa', glow: 'rgba(96, 165, 250, 0.4)' };
  } else if (currentHp <= 5) {
    return { fill: '#7c3aed', border: '#a78bfa', glow: 'rgba(167, 139, 250, 0.4)' };
  } else if (currentHp <= 7) {
    return { fill: '#db2777', border: '#f472b6', glow: 'rgba(244, 114, 182, 0.4)' };
  } else if (currentHp <= 9) {
    return { fill: '#ea580c', border: '#fb923c', glow: 'rgba(251, 146, 60, 0.4)' };
  } else if (currentHp <= 14) {
    return { fill: '#dc2626', border: '#f87171', glow: 'rgba(248, 113, 113, 0.5)' };
  } else {
    // 15+ HP Boss blocks
    return { fill: '#b45309', border: '#fbbf24', glow: 'rgba(251, 191, 36, 0.6)' };
  }
}
