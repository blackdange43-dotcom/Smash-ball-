import React from 'react';
import { Volume2, VolumeX, Pause, Play, HelpCircle, Flame, ShieldAlert, Award } from 'lucide-react';
import { GameStats, GameStatus } from '../types';

interface ScoreBoardProps {
  stats: GameStats;
  status: GameStatus;
  isMuted: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onOpenHelp: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  stats,
  status,
  isMuted,
  onToggleMute,
  onTogglePause,
  onOpenHelp,
}) => {
  const descentPercent = Math.max(0, Math.min(100, (stats.descentTimer / stats.descentMaxTime) * 100));

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5 shadow-xl text-white">
      {/* Top row: Main statistics & controls */}
      <div className="flex items-center justify-between gap-3">
        {/* Score & High Score */}
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">
              Ball
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400 drop-shadow-sm">
              {stats.score.toLocaleString()}
            </div>
          </div>

          <div className="hidden sm:block h-8 w-px bg-slate-800" />

          <div className="hidden sm:block">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 tracking-wider uppercase">
              <Award className="w-3 h-3 text-amber-400" />
              Rekord
            </div>
            <div className="text-lg font-bold font-mono text-slate-200">
              {stats.highScore.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Center: Wave and Combo */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-slate-800/80 border border-slate-700/80 rounded-xl text-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Toʻlqin</div>
            <div className="text-lg font-black text-indigo-400 font-mono">
              #{stats.wave}
            </div>
          </div>

          {stats.combo > 1 && (
            <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 rounded-xl animate-pulse">
              <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
              <div className="text-sm font-black text-amber-300 font-mono">
                x{stats.combo}
              </div>
            </div>
          )}

          {stats.ballsInPlay > 0 && (
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-slate-800/60 border border-slate-700 rounded-xl">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span className="text-xs font-mono font-bold text-cyan-300">
                {stats.ballsInPlay} shar
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-help"
            onClick={onOpenHelp}
            aria-label="O'yin qo'llanmasi"
            title="Qoidalar va kuchaytirgichlar"
            className="p-2 text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            id="btn-mute"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Ovozni yoqish' : "Ovozni o'chirish"}
            title={isMuted ? 'Ovozni yoqish' : "Ovozni o'chirish"}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {status === 'playing' || status === 'paused' ? (
            <button
              id="btn-pause"
              onClick={onTogglePause}
              aria-label={status === 'paused' ? 'Davom ettirish' : 'Pauza'}
              title={status === 'paused' ? 'Davom ettirish' : 'Pauza'}
              className="p-2 text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
            >
              {status === 'paused' ? (
                <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {/* Bottom row: Endless descent countdown timer */}
      {status === 'playing' && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 whitespace-nowrap">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Yangi qator tushishi:</span>
          </div>

          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-200 rounded-full ${
                stats.descentTimer <= 5
                  ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)] animate-pulse'
                  : 'bg-amber-400'
              }`}
              style={{ width: `${descentPercent}%` }}
            />
          </div>

          <span className="text-[11px] font-mono text-slate-300 w-8 text-right font-medium">
            {stats.descentTimer.toFixed(0)}s
          </span>
        </div>
      )}
    </header>
  );
};
