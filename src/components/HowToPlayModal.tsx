import React from 'react';
import { X, Sparkles, Shield, MousePointer, Keyboard, Trophy } from 'lucide-react';
import { POWER_UP_CONFIG } from '../gameConfig';
import { PowerUpType } from '../types';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  const powerUpKeys = Object.keys(POWER_UP_CONFIG) as PowerUpType[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl text-left relative text-white custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Smash Ball Qoʻllanmasi</h2>
              <p className="text-xs text-slate-400">Oʻyin qoidalari va kuchaytirgichlar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Yopish"
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="py-4 space-y-5 text-sm">
          {/* Section 1: Gameplay concept */}
          <div className="p-3.5 bg-slate-800/60 border border-slate-700/70 rounded-2xl">
            <h3 className="text-sm font-bold text-emerald-400 mb-1.5 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Asosiy Maqsad
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Pastdagi qalqoncha orqali sharni qaytarib, yuqoridagi baryerlarni sindiring. Bloklarning har birida
              uni sindirish uchun zarur boʻlgan urishlar soni yozilgan (masalan, 2 tadan 10+ gacha). Har bir toʻlqinda bloklar kuchi ortib boradi!
            </p>
          </div>

          {/* Section 2: Controls */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Boshqaruv
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center gap-2.5">
                <MousePointer className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-slate-200">Sichqoncha yoki barmoqni surish orqali qalqonni harakatlantiring</span>
              </div>
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center gap-2.5">
                <Keyboard className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-slate-200">Klaviatura strelkalari (◀ ▶) yoki A/D tugmalari</span>
              </div>
            </div>
          </div>

          {/* Section 3: Power-ups */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Sovgʻalar va Kuchaytirgichlar (Power-Ups)
            </h3>
            <div className="space-y-2">
              {powerUpKeys.map((key) => {
                const item = POWER_UP_CONFIG[key];
                return (
                  <div
                    key={key}
                    className="p-2.5 bg-slate-800/70 border border-slate-700/60 rounded-xl flex items-start gap-3"
                  >
                    <span className="text-xl shrink-0 p-1.5 bg-slate-900 rounded-lg">{item.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs" style={{ color: item.color }}>
                          {item.label}
                        </span>
                        {item.duration > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-400">
                            {item.duration} sek
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Endless mode info */}
          <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/60 rounded-2xl flex items-start gap-3">
            <Trophy className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold text-indigo-300 mb-1">Cheksiz (Endless) Rejim</div>
              <p className="text-slate-300 leading-relaxed">
                Har 18 soniyada yangi kuchliroq bloklar qatori tushib keladi. Bloklar pastki qalqon chizigʻiga yetib
                kelishiga yoʻl qoʻymang!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl transition"
          >
            Tushundim, Oʻyinga Qaytish
          </button>
        </div>
      </div>
    </div>
  );
};
