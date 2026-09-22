import React from 'react';
import { RotateCcw, Trophy, Award, Target, Flame } from 'lucide-react';
import { GameStats } from '../types';

interface GameOverModalProps {
  stats: GameStats;
  isNewHighScore: boolean;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  isNewHighScore,
  onRestart,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/20 blur-3xl rounded-full pointer-events-none" />

        <div className="w-16 h-16 mx-auto mb-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight mb-1">
          Oʻyin Yakunlandi!
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Baryerlar pastki himoya chizigʻiga yetib keldi yoki barcha sharlar tushib ketdi.
        </p>

        {isNewHighScore && (
          <div className="mb-6 p-3 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/50 rounded-2xl flex items-center justify-center gap-2 text-amber-300 font-bold animate-pulse">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Yangi Rekord Oʻrnatildi! 🎉</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <div className="text-xs text-slate-400 font-medium mb-1">Toʻplangan Ball</div>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {stats.score.toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <div className="text-xs text-slate-400 font-medium mb-1">Eng Yuqori Ball</div>
            <div className="text-2xl font-black font-mono text-slate-200">
              {stats.highScore.toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center gap-3 text-left">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Yetib kelingan toʻlqin</div>
              <div className="text-lg font-bold font-mono text-white">#{stats.wave}</div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center gap-3 text-left">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Buzilgan bloklar</div>
              <div className="text-lg font-bold font-mono text-white">
                {stats.blocksDestroyed} ta
              </div>
            </div>
          </div>
        </div>

        {/* Restart Button */}
        <button
          id="btn-game-over-restart"
          onClick={onRestart}
          className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-lg rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-3 transition transform active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5 stroke-[2.5]" />
          <span>Qaytadan Boshlash</span>
        </button>
      </div>
    </div>
  );
};
