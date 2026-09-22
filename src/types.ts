export type PowerUpType = 
  | 'double_ball'     // Shar double bo'lib ketadi (2x / multi-ball)
  | 'expand_paddle'   // Qalqon 10 soniyaga kengayadi
  | 'laser_cannon'    // Qalqondan lazer otish
  | 'fireball'        // Olovli shar (baryerlarni teshib o'tadi)
  | 'safety_net'      // Pastdagi himoya to'ri (sharlar tushib ketmaydi)
  | 'bomb_blast'      // Yaqin atrofdagi bloklarni portlatish
  | 'slow_motion';    // Harakatni vaqtincha sekinlashtirish

export interface PowerUpItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  type: PowerUpType;
  color: string;
  label: string;
  icon: string;
}

export interface ActiveBuff {
  type: PowerUpType;
  remainingTime: number; // in seconds
  totalTime: number;
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  isFireball: boolean;
  trail: { x: number; y: number; alpha: number }[];
}

export interface Block {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  currentHp: number;
  maxHp: number;
  isGift: boolean;
  isBomb: boolean;
  isSplitter: boolean;
  color: string;
  borderColor: string;
  hitEffectTimer: number; // for flash on hit
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'spark' | 'ring';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
}

export interface LaserBeam {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  baseWidth: number;
  expandedWidth: number;
  isExpanded: boolean;
  hasLaser: boolean;
  color: string;
}

export interface GameStats {
  score: number;
  highScore: number;
  wave: number;
  combo: number;
  maxCombo: number;
  blocksDestroyed: number;
  ballsInPlay: number;
  descentTimer: number; // seconds until next row drops
  descentMaxTime: number;
  safetyNetHitsLeft: number;
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';
