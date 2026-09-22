import { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { ScoreBoard } from './components/ScoreBoard';
import { ActivePowerUps } from './components/ActivePowerUps';
import { GameOverModal } from './components/GameOverModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { GameStats, GameStatus, ActiveBuff } from './types';
import { sound } from './audio';

const STORAGE_KEY_HIGH_SCORE = 'smash_ball_high_score';

export default function App() {
  const [status, setStatus] = useState<GameStatus>('idle');
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.isMuted);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [buffs, setBuffs] = useState<ActiveBuff[]>([]);

  const [stats, setStats] = useState<GameStats>(() => {
    const savedHighScore = localStorage.getItem(STORAGE_KEY_HIGH_SCORE);
    return {
      score: 0,
      highScore: savedHighScore ? parseInt(savedHighScore, 10) : 0,
      wave: 1,
      combo: 0,
      maxCombo: 0,
      blocksDestroyed: 0,
      ballsInPlay: 1,
      descentTimer: 18,
      descentMaxTime: 18,
      safetyNetHitsLeft: 0,
    };
  });

  const handleStatsUpdate = useCallback((update: Partial<GameStats>) => {
    setStats((prev) => {
      const next = { ...prev, ...update };
      if (next.score > next.highScore) {
        next.highScore = next.score;
        localStorage.setItem(STORAGE_KEY_HIGH_SCORE, next.score.toString());
      }
      return next;
    });
  }, []);

  const handleGameOver = useCallback(() => {
    setStatus('gameover');
    setStats((prev) => {
      const savedHigh = localStorage.getItem(STORAGE_KEY_HIGH_SCORE);
      const prevHigh = savedHigh ? parseInt(savedHigh, 10) : 0;
      if (prev.score > prevHigh && prev.score > 0) {
        setIsNewHighScore(true);
        localStorage.setItem(STORAGE_KEY_HIGH_SCORE, prev.score.toString());
      } else {
        setIsNewHighScore(false);
      }
      return prev;
    });
  }, []);

  const handleStartGame = () => {
    setStatus('playing');
  };

  const handleTogglePause = () => {
    setStatus((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
  };

  const handleRestart = () => {
    setIsNewHighScore(false);
    setBuffs([]);
    setStats((prev) => ({
      score: 0,
      highScore: prev.highScore,
      wave: 1,
      combo: 0,
      maxCombo: 0,
      blocksDestroyed: 0,
      ballsInPlay: 1,
      descentTimer: 18,
      descentMaxTime: 18,
      safetyNetHitsLeft: 0,
    }));
    setStatus('playing');
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Keyboard shortcut listener for Pause (P)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        handleTogglePause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-2 sm:p-4 md:p-6 selection:bg-cyan-500 selection:text-black">
      {/* Container constraint */}
      <main className="w-full max-w-[660px] flex flex-col items-center gap-3">
        {/* Top Header / HUD */}
        <ScoreBoard
          stats={stats}
          status={status}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onTogglePause={handleTogglePause}
          onOpenHelp={() => setShowHelpModal(true)}
        />

        {/* Active Buffs Bar */}
        <div className="w-full min-h-[36px] flex items-center justify-center">
          <ActivePowerUps buffs={buffs} />
        </div>

        {/* Main Canvas Arena */}
        <div className="w-full flex justify-center">
          <GameCanvas
            status={status}
            stats={stats}
            buffs={buffs}
            onStatsUpdate={handleStatsUpdate}
            onBuffsUpdate={setBuffs}
            onGameOver={handleGameOver}
            onGameStart={handleStartGame}
          />
        </div>

        {/* Bottom Quick Controls & Hints */}
        <footer className="w-full py-2 px-3 text-center text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 border-t border-slate-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Boshqaruv:</span>
            <span>Sichqoncha / Touch / A-D strelkalar</span>
          </div>
          <div className="flex items-center gap-3">
            <span>[P] Pauza</span>
            <span>[Space] Boshlash</span>
          </div>
        </footer>
      </main>

      {/* Game Over Modal */}
      {status === 'gameover' && (
        <GameOverModal
          stats={stats}
          isNewHighScore={isNewHighScore}
          onRestart={handleRestart}
        />
      )}

      {/* How To Play Modal */}
      {showHelpModal && (
        <HowToPlayModal onClose={() => setShowHelpModal(false)} />
      )}
    </div>
  );
}
