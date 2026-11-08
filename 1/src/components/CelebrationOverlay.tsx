import React from 'react';
import { Sparkles, Trophy, ArrowRight } from 'lucide-react';

interface CelebrationOverlayProps {
  missionTitle: string;
  rewardCoins: number;
  rewardStars: number;
  badge?: string;
  onNextMission: () => void;
  onDismiss: () => void;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  missionTitle,
  rewardCoins,
  rewardStars,
  badge,
  onNextMission,
  onDismiss,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-md bg-gradient-to-b from-amber-500 via-amber-600 to-emerald-900 border-4 border-yellow-300 rounded-3xl p-6 shadow-2xl text-center text-white overflow-hidden animate-pulse-glow">
        {/* Glow Sparkles */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-yellow-200/30 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-300/30 rounded-full blur-2xl" />

        {/* Trophy Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-yellow-300 text-amber-950 flex items-center justify-center shadow-2xl mb-3 transform -rotate-3 hover:rotate-0 transition-transform">
          <Trophy className="w-12 h-12" />
        </div>

        {/* Title */}
        <h2 className="text-3xl font-black font-cartoon text-yellow-100 drop-shadow-md mb-1">
          MISSION COMPLETED!
        </h2>
        <p className="text-amber-100 text-sm font-semibold mb-4">
          Super job exploring the 3D jungle!
        </p>

        {/* Completed Mission Name */}
        <div className="bg-black/30 border border-white/20 rounded-2xl py-2 px-4 mb-4">
          <p className="text-xs uppercase font-bold text-yellow-300 tracking-wider">
            Completed Objective:
          </p>
          <p className="text-lg font-bold text-white font-cartoon">{missionTitle}</p>
        </div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white/10 border border-white/20 p-2.5 rounded-2xl flex items-center justify-center gap-2">
            <span className="text-2xl">🪙</span>
            <div className="text-left">
              <p className="text-base font-black text-yellow-200 font-cartoon">
                +{rewardCoins}
              </p>
              <p className="text-[10px] text-white/80 uppercase font-bold">Coins Earned</p>
            </div>
          </div>

          <div className="bg-white/10 border border-white/20 p-2.5 rounded-2xl flex items-center justify-center gap-2">
            <span className="text-2xl">⭐</span>
            <div className="text-left">
              <p className="text-base font-black text-yellow-200 font-cartoon">
                +{rewardStars}
              </p>
              <p className="text-[10px] text-white/80 uppercase font-bold">Golden Star</p>
            </div>
          </div>
        </div>

        {/* Badge unlock */}
        {badge && (
          <div className="bg-amber-300/20 border border-amber-300/40 rounded-xl py-2 px-3 mb-5 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <p className="text-xs font-bold text-yellow-100">
              New Badge: <span className="text-yellow-300">{badge}</span>
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onNextMission}
            className="w-full py-3 rounded-2xl bg-yellow-300 hover:bg-yellow-200 text-amber-950 font-black text-base shadow-xl flex items-center justify-center gap-2 font-cartoon transition-all active:scale-98"
          >
            Take Next Mission <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all"
          >
            Keep Exploring Jungle
          </button>
        </div>
      </div>
    </div>
  );
};
