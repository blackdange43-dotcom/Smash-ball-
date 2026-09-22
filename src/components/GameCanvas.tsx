import React, { useRef, useEffect, useCallback } from 'react';
import {
  Ball,
  Block,
  Paddle,
  PowerUpItem,
  ActiveBuff,
  Particle,
  FloatingText,
  LaserBeam,
  GameStats,
  GameStatus,
  PowerUpType
} from '../types';
import { POWER_UP_CONFIG, getHpColor } from '../gameConfig';
import { sound } from '../audio';

interface GameCanvasProps {
  status: GameStatus;
  stats: GameStats;
  buffs: ActiveBuff[];
  onStatsUpdate: (statsUpdate: Partial<GameStats>) => void;
  onBuffsUpdate: (buffs: ActiveBuff[]) => void;
  onGameOver: () => void;
  onGameStart: () => void;
}

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 860;
const PADDLE_BASE_WIDTH = 105;
const PADDLE_EXPANDED_WIDTH = 165;
const PADDLE_HEIGHT = 16;
const PADDLE_Y = 808;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  status,
  stats,
  buffs,
  onStatsUpdate,
  onBuffsUpdate,
  onGameOver,
  onGameStart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable Game State refs for smooth 60fps loop
  const ballsRef = useRef<Ball[]>([]);
  const blocksRef = useRef<Block[]>([]);
  const powerUpsRef = useRef<PowerUpItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const lasersRef = useRef<LaserBeam[]>([]);
  const paddleRef = useRef<Paddle>({
    x: (CANVAS_WIDTH - PADDLE_BASE_WIDTH) / 2,
    y: PADDLE_Y,
    width: PADDLE_BASE_WIDTH,
    height: PADDLE_HEIGHT,
    targetX: (CANVAS_WIDTH - PADDLE_BASE_WIDTH) / 2,
    baseWidth: PADDLE_BASE_WIDTH,
    expandedWidth: PADDLE_EXPANDED_WIDTH,
    isExpanded: false,
    hasLaser: false,
    color: '#34d399',
  });

  const buffsRef = useRef<ActiveBuff[]>(buffs);
  buffsRef.current = buffs;

  const statsRef = useRef<GameStats>(stats);
  statsRef.current = stats;

  const statusRef = useRef<GameStatus>(status);
  statusRef.current = status;

  const screenShakeRef = useRef<number>(0);
  const lastLaserTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Helper to spawn floating text
  const addFloatingText = (text: string, x: number, y: number, color = '#fbbf24') => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      color,
      alpha: 1,
      scale: 1.2,
      vy: -1.2,
    });
  };

  // Helper to spawn particles
  const addParticles = (
    x: number,
    y: number,
    color: string,
    count = 12,
    speed = 4,
    shape: 'circle' | 'spark' | 'ring' = 'circle'
  ) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = (Math.random() * 0.8 + 0.2) * speed;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        color,
        size: Math.random() * 3.5 + 1.5,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02,
        shape,
      });
    }
  };

  // Generate blocks wave
  const generateWaveBlocks = useCallback((waveNumber: number) => {
    const cols = 7;
    const blockWidth = 78;
    const blockHeight = 32;
    const gap = 8;
    const totalWidth = cols * blockWidth + (cols - 1) * gap;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;
    const startY = 80;
    const rows = Math.min(6, 3 + Math.floor(waveNumber / 2));

    const newBlocks: Block[] = [];

    // Max HP formula scales with wave
    // Wave 1: 1 - 4
    // Wave 2: 2 - 7
    // Wave 3: 3 - 10
    // Wave 5+: up to 15+
    const minHp = Math.min(10, 1 + Math.floor((waveNumber - 1) * 0.8));
    const maxHp = Math.min(20, 4 + waveNumber * 2);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Occasionally skip some blocks for varied organic formations
        if (rows > 4 && r > 1 && Math.random() < 0.15) continue;

        // Determine HP
        let hp = Math.floor(Math.random() * (maxHp - minHp + 1)) + minHp;
        // Boss/Titanium block chance
        if (Math.random() < 0.08) {
          hp = Math.min(25, maxHp + 4);
        }

        const isGift = Math.random() < 0.16; // Guaranteed powerup gift
        const isBomb = !isGift && Math.random() < 0.09; // Explosive block
        const isSplitter = !isGift && !isBomb && Math.random() < 0.07; // Extra mini-balls splitter

        const colors = getHpColor(hp, hp);

        newBlocks.push({
          id: `block-${r}-${c}-${Date.now()}-${Math.random()}`,
          x: startX + c * (blockWidth + gap),
          y: startY + r * (blockHeight + gap),
          width: blockWidth,
          height: blockHeight,
          currentHp: hp,
          maxHp: hp,
          isGift,
          isBomb,
          isSplitter,
          color: colors.fill,
          borderColor: colors.border,
          hitEffectTimer: 0,
        });
      }
    }

    return newBlocks;
  }, []);

  // Spawn an initial ball
  const createBall = (x?: number, y?: number, vx?: number, vy?: number): Ball => {
    const defaultX = paddleRef.current.x + paddleRef.current.width / 2;
    const defaultY = paddleRef.current.y - 12;
    const angle = (Math.random() * 0.6 - 0.3) * Math.PI; // -30 to +30 deg from vertical
    const speed = 7.5;

    return {
      id: Math.random().toString(),
      x: x ?? defaultX,
      y: y ?? defaultY,
      vx: vx ?? speed * Math.sin(angle),
      vy: vy ?? -speed * Math.cos(angle),
      radius: 7.5,
      speed,
      isFireball: buffsRef.current.some((b) => b.type === 'fireball'),
      trail: [],
    };
  };

  // Duplicate / Double balls power-up logic
  const triggerDoubleBall = useCallback(() => {
    const currentBalls = [...ballsRef.current];
    if (currentBalls.length === 0) {
      ballsRef.current = [createBall(), createBall()];
    } else {
      const newBalls: Ball[] = [];
      currentBalls.forEach((b) => {
        newBalls.push(b);
        // Sibling ball diverging by angle
        const speed = Math.hypot(b.vx, b.vy);
        const currentAngle = Math.atan2(b.vy, b.vx);
        const angleA = currentAngle + 0.35;
        const angleB = currentAngle - 0.35;

        newBalls.push({
          ...b,
          id: Math.random().toString(),
          vx: speed * Math.cos(angleA),
          vy: speed * Math.sin(angleA),
          trail: [],
        });

        // If only 1 ball was present, make it triple for extra excitement
        if (currentBalls.length === 1) {
          newBalls.push({
            ...b,
            id: Math.random().toString(),
            vx: speed * Math.cos(angleB),
            vy: speed * Math.sin(angleB),
            trail: [],
          });
        }
      });
      // Cap at 16 balls to prevent unplayable chaos
      ballsRef.current = newBalls.slice(0, 16);
    }

    addFloatingText('2X SHARLAR! ⚡', paddleRef.current.x + paddleRef.current.width / 2, paddleRef.current.y - 30, '#38bdf8');
    sound.playPowerUp();
  }, []);

  // Activate a power up
  const applyPowerUp = useCallback((type: PowerUpType) => {
    const config = POWER_UP_CONFIG[type];
    sound.playPowerUp();

    if (type === 'double_ball') {
      triggerDoubleBall();
      return;
    }

    if (type === 'bomb_blast') {
      // Detonate random cluster of blocks
      screenShakeRef.current = 15;
      sound.playExplosion();
      const blocks = blocksRef.current;
      if (blocks.length > 0) {
        const targetIdx = Math.floor(Math.random() * blocks.length);
        const target = blocks[targetIdx];
        addParticles(target.x + target.width / 2, target.y + target.height / 2, '#eab308', 35, 7, 'spark');
        addFloatingText('BOMBA! 💣', target.x, target.y, '#eab308');

        // Damage blocks in radius 150px
        blocks.forEach((b) => {
          const dist = Math.hypot(b.x + b.width / 2 - target.x, b.y + b.height / 2 - target.y);
          if (dist < 150) {
            b.currentHp = Math.max(0, b.currentHp - 4);
            b.hitEffectTimer = 10;
          }
        });
      }
      return;
    }

    // Active duration buff
    const existing = buffsRef.current.filter((b) => b.type !== type);
    const updated = [...existing, { type, remainingTime: config.duration, totalTime: config.duration }];
    onBuffsUpdate(updated);

    addFloatingText(`${config.label.toUpperCase()}! ${config.icon}`, paddleRef.current.x + paddleRef.current.width / 2, paddleRef.current.y - 30, config.color);

    if (type === 'expand_paddle') {
      paddleRef.current.width = paddleRef.current.expandedWidth;
      paddleRef.current.isExpanded = true;
    }
  }, [triggerDoubleBall, onBuffsUpdate]);

  // Drop down 1 row in Endless mode
  const dropRowEndless = useCallback(() => {
    const rowHeight = 40;
    const blocks = blocksRef.current;

    // Shift all existing blocks down
    blocks.forEach((b) => {
      b.y += rowHeight;
    });

    // Check if any block crossed the paddle line (Game Over trigger!)
    const reachedBottom = blocks.some((b) => b.y + b.height >= paddleRef.current.y - 10);
    if (reachedBottom) {
      sound.playGameOver();
      onGameOver();
      return;
    }

    // Spawn a fresh new top row
    const cols = 7;
    const blockWidth = 78;
    const blockHeight = 32;
    const gap = 8;
    const totalWidth = cols * blockWidth + (cols - 1) * gap;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;
    const startY = 80;

    const wave = statsRef.current.wave;
    const minHp = Math.min(10, 1 + Math.floor((wave - 1) * 0.8));
    const maxHp = Math.min(22, 4 + wave * 2);

    for (let c = 0; c < cols; c++) {
      if (Math.random() < 0.12) continue; // slight randomness
      const hp = Math.floor(Math.random() * (maxHp - minHp + 1)) + minHp;
      const isGift = Math.random() < 0.2;
      const isBomb = !isGift && Math.random() < 0.1;
      const isSplitter = !isGift && !isBomb && Math.random() < 0.08;
      const colors = getHpColor(hp, hp);

      blocks.push({
        id: `block-endless-${Date.now()}-${c}`,
        x: startX + c * (blockWidth + gap),
        y: startY,
        width: blockWidth,
        height: blockHeight,
        currentHp: hp,
        maxHp: hp,
        isGift,
        isBomb,
        isSplitter,
        color: colors.fill,
        borderColor: colors.border,
        hitEffectTimer: 0,
      });
    }

    addFloatingText('YANGI QATOR TUSHDI! ⚠️', CANVAS_WIDTH / 2, 60, '#f59e0b');
    screenShakeRef.current = 6;
  }, [onGameOver]);

  // Restart / Initial Setup
  const initializeGame = useCallback(() => {
    ballsRef.current = [createBall()];
    blocksRef.current = generateWaveBlocks(1);
    powerUpsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    lasersRef.current = [];
    paddleRef.current.width = PADDLE_BASE_WIDTH;
    paddleRef.current.x = (CANVAS_WIDTH - PADDLE_BASE_WIDTH) / 2;
    paddleRef.current.isExpanded = false;
    onBuffsUpdate([]);
    onStatsUpdate({
      score: 0,
      wave: 1,
      combo: 0,
      blocksDestroyed: 0,
      ballsInPlay: 1,
      descentTimer: 18,
      descentMaxTime: 18,
      safetyNetHitsLeft: 0,
    });
  }, [generateWaveBlocks, onBuffsUpdate, onStatsUpdate]);

  // Handle inputs (Pointer / Touch / Keyboard)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      let clientX = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
      } else if ('clientX' in e) {
        clientX = e.clientX;
      }

      const scaleX = CANVAS_WIDTH / rect.width;
      const canvasX = (clientX - rect.left) * scaleX;
      paddleRef.current.targetX = canvasX - paddleRef.current.width / 2;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (statusRef.current !== 'playing') {
        if (e.code === 'Space') {
          onGameStart();
        }
        return;
      }

      const step = 28;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        paddleRef.current.targetX -= step;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        paddleRef.current.targetX += step;
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onGameStart]);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset game state on first load if idle
    if (status === 'idle' && blocksRef.current.length === 0) {
      initializeGame();
    }

    let isRunning = true;

    const gameLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      if (statusRef.current === 'playing') {
        // --- 1. Update Buffs Timers ---
        const activeBuffs = buffsRef.current;
        let buffsChanged = false;
        const remainingBuffs: ActiveBuff[] = [];

        activeBuffs.forEach((buff) => {
          const newTime = buff.remainingTime - dt;
          if (newTime > 0) {
            remainingBuffs.push({ ...buff, remainingTime: newTime });
          } else {
            buffsChanged = true;
            if (buff.type === 'expand_paddle') {
              paddleRef.current.width = paddleRef.current.baseWidth;
              paddleRef.current.isExpanded = false;
            }
          }
        });

        if (buffsChanged || remainingBuffs.length !== activeBuffs.length) {
          onBuffsUpdate(remainingBuffs);
        }

        const isFireballActive = remainingBuffs.some((b) => b.type === 'fireball');
        const isLaserActive = remainingBuffs.some((b) => b.type === 'laser_cannon');
        const isSlowMoActive = remainingBuffs.some((b) => b.type === 'slow_motion');
        const isSafetyNetActive = remainingBuffs.some((b) => b.type === 'safety_net');

        // --- 2. Update Endless Descent Timer ---
        const currentStats = statsRef.current;
        const newDescentTimer = currentStats.descentTimer - dt;
        if (newDescentTimer <= 0) {
          dropRowEndless();
          onStatsUpdate({ descentTimer: currentStats.descentMaxTime });
        } else {
          onStatsUpdate({ descentTimer: newDescentTimer });
        }

        // --- 3. Update Paddle Position ---
        const paddle = paddleRef.current;
        // Smooth lerp
        paddle.x += (paddle.targetX - paddle.x) * 0.24;
        paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - paddle.width, paddle.x));

        // --- 4. Laser Auto-Fire ---
        if (isLaserActive && currentTime - lastLaserTimeRef.current > 320) {
          lastLaserTimeRef.current = currentTime;
          sound.playLaserShoot();
          lasersRef.current.push({
            id: Math.random().toString(),
            x: paddle.x + 8,
            y: paddle.y - 4,
            width: 4,
            height: 18,
            vy: -15,
          });
          lasersRef.current.push({
            id: Math.random().toString(),
            x: paddle.x + paddle.width - 12,
            y: paddle.y - 4,
            width: 4,
            height: 18,
            vy: -15,
          });
        }

        // Update Lasers
        for (let i = lasersRef.current.length - 1; i >= 0; i--) {
          const laser = lasersRef.current[i];
          laser.y += laser.vy;

          if (laser.y < 0) {
            lasersRef.current.splice(i, 1);
            continue;
          }

          // Check hit against blocks
          let laserHit = false;
          for (const block of blocksRef.current) {
            if (
              laser.x + laser.width >= block.x &&
              laser.x <= block.x + block.width &&
              laser.y <= block.y + block.height &&
              laser.y + laser.height >= block.y
            ) {
              laserHit = true;
              block.currentHp -= 1;
              block.hitEffectTimer = 4;
              addParticles(laser.x, laser.y, '#f43f5e', 4, 3, 'spark');
              sound.playBlockHit(1);
              onStatsUpdate({ score: statsRef.current.score + 10 });
              break;
            }
          }
          if (laserHit) {
            lasersRef.current.splice(i, 1);
          }
        }

        // --- 5. Update Balls Physics & Collisions ---
        const balls = ballsRef.current;
        const blocks = blocksRef.current;
        const speedScale = isSlowMoActive ? 0.65 : 1.0;

        for (let i = balls.length - 1; i >= 0; i--) {
          const ball = balls[i];
          ball.isFireball = isFireballActive;

          // Trail
          ball.trail.push({ x: ball.x, y: ball.y, alpha: 0.7 });
          if (ball.trail.length > 8) ball.trail.shift();

          // Move
          ball.x += ball.vx * speedScale;
          ball.y += ball.vy * speedScale;

          // Left/Right Walls
          if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.vx = Math.abs(ball.vx);
            sound.playPaddleBounce();
          } else if (ball.x + ball.radius >= CANVAS_WIDTH) {
            ball.x = CANVAS_WIDTH - ball.radius;
            ball.vx = -Math.abs(ball.vx);
            sound.playPaddleBounce();
          }

          // Top Wall
          if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.vy = Math.abs(ball.vy);
            sound.playPaddleBounce();
          }

          // Bottom Safety Net
          if (isSafetyNetActive && ball.y + ball.radius >= CANVAS_HEIGHT - 20) {
            ball.y = CANVAS_HEIGHT - 20 - ball.radius;
            ball.vy = -Math.abs(ball.vy);
            sound.playPaddleBounce();
            addParticles(ball.x, CANVAS_HEIGHT - 20, '#818cf8', 12, 5, 'ring');
            addFloatingText('HIMOYA! 🛡️', ball.x, CANVAS_HEIGHT - 45, '#818cf8');
          }
          // Bottom Void (Ball fell down)
          else if (ball.y - ball.radius > CANVAS_HEIGHT) {
            balls.splice(i, 1);
            continue;
          }

          // Collision with Paddle
          if (
            ball.vy > 0 &&
            ball.y + ball.radius >= paddle.y &&
            ball.y - ball.radius <= paddle.y + paddle.height &&
            ball.x >= paddle.x - ball.radius &&
            ball.x <= paddle.x + paddle.width + ball.radius
          ) {
            // Calculate angle deflection from paddle center
            const paddleCenter = paddle.x + paddle.width / 2;
            const diff = (ball.x - paddleCenter) / (paddle.width / 2);
            const clampedDiff = Math.max(-0.9, Math.min(0.9, diff));
            const bounceAngle = clampedDiff * (Math.PI * 0.38); // max ~68 deg

            const speed = Math.max(7.5, Math.hypot(ball.vx, ball.vy));
            ball.vx = speed * Math.sin(bounceAngle);
            ball.vy = -Math.abs(speed * Math.cos(bounceAngle));
            ball.y = paddle.y - ball.radius - 1;

            sound.playPaddleBounce();
            addParticles(ball.x, paddle.y, paddle.isExpanded ? '#4ade80' : '#34d399', 8, 3);

            // Reset combo on paddle bounce
            if (statsRef.current.combo > 0) {
              onStatsUpdate({ combo: 0 });
            }
          }

          // Collision with Blocks
          for (let bIdx = blocks.length - 1; bIdx >= 0; bIdx--) {
            const block = blocks[bIdx];

            // Nearest point on AABB
            const nearestX = Math.max(block.x, Math.min(ball.x, block.x + block.width));
            const nearestY = Math.max(block.y, Math.min(ball.y, block.y + block.height));
            const distX = ball.x - nearestX;
            const distY = ball.y - nearestY;
            const distanceSq = distX * distX + distY * distY;

            if (distanceSq <= ball.radius * ball.radius) {
              // Hit detected!
              const damage = ball.isFireball ? 2 : 1;
              block.currentHp -= damage;
              block.hitEffectTimer = 6;

              // Sound & visual
              sound.playBlockHit(block.currentHp);
              addParticles(nearestX, nearestY, block.borderColor, 6, 3, 'spark');

              // Update combo & score
              const newCombo = statsRef.current.combo + 1;
              const comboBonus = Math.max(1, newCombo);
              const pointsEarned = 15 * comboBonus;
              const newScore = statsRef.current.score + pointsEarned;
              const newMaxCombo = Math.max(statsRef.current.maxCombo, newCombo);

              onStatsUpdate({
                score: newScore,
                combo: newCombo,
                maxCombo: newMaxCombo,
                highScore: Math.max(statsRef.current.highScore, newScore),
              });

              if (newCombo > 2 && newCombo % 3 === 0) {
                addFloatingText(`x${newCombo} COMBO! 🔥`, ball.x, ball.y - 15, '#fb923c');
              }

              // Fireball punches through without bouncing!
              if (!ball.isFireball) {
                // Determine collision normal
                const overlapX = ball.radius - Math.abs(distX);
                const overlapY = ball.radius - Math.abs(distY);

                if (overlapX < overlapY) {
                  ball.vx = distX > 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
                } else {
                  ball.vy = distY > 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
                }
              }

              // If block destroyed
              if (block.currentHp <= 0) {
                sound.playBlockDestroyed();
                addParticles(block.x + block.width / 2, block.y + block.height / 2, block.borderColor, 20, 5);

                const blockBonus = 80 * block.maxHp;
                onStatsUpdate({
                  score: statsRef.current.score + blockBonus,
                  blocksDestroyed: statsRef.current.blocksDestroyed + 1,
                });
                addFloatingText(`+${blockBonus}`, block.x + block.width / 2, block.y, '#34d399');

                // Bomb block explosion
                if (block.isBomb) {
                  screenShakeRef.current = 10;
                  sound.playExplosion();
                  addParticles(block.x + block.width / 2, block.y + block.height / 2, '#eab308', 30, 6, 'spark');
                  blocks.forEach((other) => {
                    const dist = Math.hypot(
                      other.x + other.width / 2 - (block.x + block.width / 2),
                      other.y + other.height / 2 - (block.y + block.height / 2)
                    );
                    if (dist < 130 && other.id !== block.id) {
                      other.currentHp = Math.max(0, other.currentHp - 3);
                      other.hitEffectTimer = 6;
                    }
                  });
                }

                // Splitter block
                if (block.isSplitter) {
                  triggerDoubleBall();
                }

                // Drop power-up: Gift block = 100%, Normal = 20%
                const shouldDrop = block.isGift || Math.random() < 0.2;
                if (shouldDrop) {
                  const powerUpKeys: PowerUpType[] = [
                    'double_ball',
                    'expand_paddle',
                    'fireball',
                    'laser_cannon',
                    'safety_net',
                    'bomb_blast',
                    'slow_motion',
                  ];
                  // Weighted random selection
                  let chosenType: PowerUpType;
                  const roll = Math.random();
                  if (roll < 0.28) chosenType = 'double_ball';
                  else if (roll < 0.5) chosenType = 'expand_paddle';
                  else if (roll < 0.65) chosenType = 'fireball';
                  else if (roll < 0.78) chosenType = 'laser_cannon';
                  else if (roll < 0.88) chosenType = 'safety_net';
                  else if (roll < 0.94) chosenType = 'bomb_blast';
                  else chosenType = 'slow_motion';

                  const config = POWER_UP_CONFIG[chosenType];
                  powerUpsRef.current.push({
                    id: Math.random().toString(),
                    x: block.x + block.width / 2 - 17,
                    y: block.y + block.height / 2,
                    width: 34,
                    height: 34,
                    vy: 2.3,
                    type: chosenType,
                    color: config.color,
                    label: config.label,
                    icon: config.icon,
                  });
                }

                // Remove block
                blocks.splice(bIdx, 1);
              }

              break; // Stop checking other blocks for this ball in this frame
            }
          }
        }

        // Update balls in play count
        onStatsUpdate({ ballsInPlay: balls.length });

        // Check if all balls lost
        if (balls.length === 0) {
          sound.playGameOver();
          onGameOver();
        }

        // Check if wave cleared
        if (blocks.length === 0) {
          const nextWave = statsRef.current.wave + 1;
          sound.playWaveAdvance();
          addFloatingText(`TOʻLQIN #${nextWave}! 🎉`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#818cf8');
          blocksRef.current = generateWaveBlocks(nextWave);
          onStatsUpdate({
            wave: nextWave,
            score: statsRef.current.score + 500,
            descentTimer: 18,
          });
        }

        // --- 6. Update Power-Up Items Falling ---
        const powerUps = powerUpsRef.current;
        for (let pIdx = powerUps.length - 1; pIdx >= 0; pIdx--) {
          const p = powerUps[pIdx];
          p.y += p.vy;

          // Check catch by paddle
          if (
            p.y + p.height >= paddle.y &&
            p.y <= paddle.y + paddle.height &&
            p.x + p.width >= paddle.x &&
            p.x <= paddle.x + paddle.width
          ) {
            applyPowerUp(p.type);
            addParticles(p.x + p.width / 2, paddle.y, p.color, 14, 4);
            powerUps.splice(pIdx, 1);
            continue;
          }

          // Off bottom
          if (p.y > CANVAS_HEIGHT) {
            powerUps.splice(pIdx, 1);
          }
        }

        // --- 7. Update Particles ---
        const particles = particlesRef.current;
        for (let pIdx = particles.length - 1; pIdx >= 0; pIdx--) {
          const pt = particles[pIdx];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vy += 0.08; // gravity
          pt.alpha -= pt.decay;
          if (pt.alpha <= 0) {
            particles.splice(pIdx, 1);
          }
        }

        // --- 8. Update Floating Texts ---
        const texts = floatingTextsRef.current;
        for (let tIdx = texts.length - 1; tIdx >= 0; tIdx--) {
          const ft = texts[tIdx];
          ft.y += ft.vy;
          ft.alpha -= 0.018;
          if (ft.alpha <= 0) {
            texts.splice(tIdx, 1);
          }
        }

        // Decay screen shake
        if (screenShakeRef.current > 0) {
          screenShakeRef.current = Math.max(0, screenShakeRef.current - 0.8);
        }
      }

      // ==========================================
      // RENDERING SECTION
      // ==========================================
      ctx.save();

      // Screen shake translation
      if (screenShakeRef.current > 0) {
        const sx = (Math.random() - 0.5) * screenShakeRef.current;
        const sy = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(sx, sy);
      }

      // Background clear
      ctx.fillStyle = '#090d16'; // Deep midnight slate
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background sci-fi grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Danger line for Endless mode (Paddle barrier line)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, PADDLE_Y - 15);
      ctx.lineTo(CANVAS_WIDTH, PADDLE_Y - 15);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Safety Net if active
      if (buffsRef.current.some((b) => b.type === 'safety_net')) {
        ctx.save();
        ctx.shadowColor = '#818cf8';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, CANVAS_HEIGHT - 20);
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 20);
        ctx.stroke();

        ctx.fillStyle = 'rgba(129, 140, 248, 0.15)';
        ctx.fillRect(0, CANVAS_HEIGHT - 24, CANVAS_WIDTH, 8);
        ctx.restore();
      }

      // --- Draw Blocks ---
      const blocks = blocksRef.current;
      for (const block of blocks) {
        const colors = getHpColor(block.currentHp, block.maxHp);
        const isHitFlashing = block.hitEffectTimer > 0;
        if (block.hitEffectTimer > 0) block.hitEffectTimer--;

        ctx.save();

        // Glow
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = isHitFlashing ? 14 : 6;

        // Block Body
        ctx.fillStyle = isHitFlashing ? '#ffffff' : colors.fill;
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;

        // Rounded rect for block
        const r = 6;
        ctx.beginPath();
        ctx.roundRect(block.x, block.y, block.width, block.height, r);
        ctx.fill();
        ctx.stroke();

        // Inner subtle shine gradient
        const shine = ctx.createLinearGradient(block.x, block.y, block.x, block.y + block.height);
        shine.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        shine.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = shine;
        ctx.beginPath();
        ctx.roundRect(block.x, block.y, block.width, block.height / 2, [r, r, 0, 0]);
        ctx.fill();

        // Special Badge/Icon on block
        if (block.isGift) {
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          ctx.fillText('🎁', block.x + block.width - 4, block.y + 3);
        } else if (block.isBomb) {
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          ctx.fillText('💣', block.x + block.width - 4, block.y + 3);
        } else if (block.isSplitter) {
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          ctx.fillText('⚡', block.x + block.width - 4, block.y + 3);
        }

        // Hit Count Number (Center of block)
        ctx.font = '900 15px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isHitFlashing ? '#000000' : '#ffffff';
        ctx.shadowBlur = 0;
        ctx.fillText(
          block.currentHp.toString(),
          block.x + block.width / 2,
          block.y + block.height / 2 + 1
        );

        ctx.restore();
      }

      // --- Draw Falling Power-Ups ---
      const powerUps = powerUpsRef.current;
      for (const p of powerUps) {
        ctx.save();
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;

        // Glowing pill background
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.width, p.height, 12);
        ctx.fill();
        ctx.stroke();

        // Icon inside
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.icon, p.x + p.width / 2, p.y + p.height / 2);
        ctx.restore();
      }

      // --- Draw Lasers ---
      const lasers = lasersRef.current;
      for (const l of lasers) {
        ctx.save();
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(l.x, l.y, l.width, l.height);
        ctx.restore();
      }

      // --- Draw Balls ---
      const balls = ballsRef.current;
      for (const ball of balls) {
        // Ball Trails
        for (let t = 0; t < ball.trail.length; t++) {
          const pt = ball.trail[t];
          const trAlpha = (t / ball.trail.length) * 0.45;
          ctx.fillStyle = ball.isFireball
            ? `rgba(249, 115, 22, ${trAlpha})`
            : `rgba(56, 189, 248, ${trAlpha})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, ball.radius * (0.4 + (t / ball.trail.length) * 0.6), 0, Math.PI * 2);
          ctx.fill();
        }

        // Ball Body
        ctx.save();
        ctx.shadowColor = ball.isFireball ? '#f97316' : '#38bdf8';
        ctx.shadowBlur = ball.isFireball ? 16 : 10;

        ctx.fillStyle = ball.isFireball ? '#ffedd5' : '#ffffff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // --- Draw Paddle (Qalqoncha) ---
      const paddle = paddleRef.current;
      ctx.save();
      const hasLaserBuff = buffsRef.current.some((b) => b.type === 'laser_cannon');
      const paddleGlow = hasLaserBuff ? '#f43f5e' : paddle.isExpanded ? '#4ade80' : '#38bdf8';

      ctx.shadowColor = paddleGlow;
      ctx.shadowBlur = 14;

      // Gradient Fill for paddle
      const paddleGrad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
      paddleGrad.addColorStop(0, hasLaserBuff ? '#f43f5e' : paddle.isExpanded ? '#4ade80' : '#38bdf8');
      paddleGrad.addColorStop(1, hasLaserBuff ? '#9f1239' : paddle.isExpanded ? '#15803d' : '#0369a1');

      ctx.fillStyle = paddleGrad;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
      ctx.fill();
      ctx.stroke();

      // Middle energy core on paddle
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.fillRect(paddle.x + paddle.width / 2 - 12, paddle.y + 4, 24, 3);

      // Blaster mounts on paddle tips if laser active
      if (hasLaserBuff) {
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(paddle.x + 4, paddle.y - 6, 6, 8);
        ctx.fillRect(paddle.x + paddle.width - 10, paddle.y - 6, 6, 8);
      }

      ctx.restore();

      // --- Draw Particles ---
      const particles = particlesRef.current;
      for (const pt of particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- Draw Floating Texts ---
      const texts = floatingTextsRef.current;
      for (const ft of texts) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = '800 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 8;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      ctx.restore(); // Restore shake translation

      if (isRunning) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    status,
    applyPowerUp,
    dropRowEndless,
    generateWaveBlocks,
    initializeGame,
    onBuffsUpdate,
    onGameOver,
    onStatsUpdate,
    triggerDoubleBall,
  ]);

  return (
    <div className="relative w-full max-w-[640px] aspect-[640/860] mx-auto rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-slate-950 select-none touch-none">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Idle / Start Overlay */}
      {status === 'idle' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-3xl animate-bounce">
            ⚡
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            SMASH BALL ENDLESS
          </h1>
          <p className="text-slate-300 text-sm max-w-sm mb-6 leading-relaxed">
            Qalqoncha bilan sharni qaytaring, koʻp urishli baryerlarni buzing, sovgʻalarni ilib oling va rekord oʻrnating!
          </p>
          <button
            id="btn-start-game"
            onClick={onGameStart}
            className="py-4 px-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/25 transition transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            Oʻyinni Boshlash (Space)
          </button>
        </div>
      )}

      {/* Paused Overlay */}
      {status === 'paused' && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">
            Oʻyin Pauzada
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Davom ettirish uchun tugmani bosing
          </p>
          <button
            id="btn-resume-game"
            onClick={onGameStart}
            className="py-3 px-8 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base rounded-2xl shadow-lg transition transform active:scale-95 cursor-pointer"
          >
            Davom Ettirish
          </button>
        </div>
      )}
    </div>
  );
};
