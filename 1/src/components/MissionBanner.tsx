import React from 'react';
import { Volume2, ChevronRight, ChevronLeft, Target } from 'lucide-react';
import { Mission } from '../engine/types';

interface MissionBannerProps {
  mission: Mission;
  missionIndex: number;
  totalMissions: number;
  onReplayAudio: () => void;
  onNextMission: () => void;
  onPrevMission: () => void;
}

export const MissionBanner: React.FC<MissionBannerProps> = ({
  mission,
  missionIndex,
  totalMissions,
  onReplayAudio,
  onNextMission,
  onPrevMission,
}) => {
  return (
    <div className="flex items-center gap-2 max-w-lg w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl px-3.5 py-2 shadow-xl pointer-events-auto">
      {/* Target Icon */}
      <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center flex-shrink-0 font-bold shadow-md">
        <Target className="w-5 h-5" />
      </div>

      {/* Mission Text */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 font-cartoon">
            Mission {missionIndex + 1}/{totalMissions}
          </span>
          {mission.completed && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500 text-white rounded-md">
              ✓ Done
            </span>
          )}
        </div>
        <p className="text-sm font-bold text-white truncate font-cartoon">
          {mission.title}
        </p>
        <p className="text-xs text-white/80 truncate leading-tight">
          {mission.instruction}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onReplayAudio}
          title="Hear Instruction Again"
          className="w-8 h-8 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center transition-all"
        >
          <Volume2 className="w-4 h-4" />
        </button>

        <button
          onClick={onPrevMission}
          disabled={missionIndex === 0}
          title="Previous Mission"
          className="w-7 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none active:scale-95 text-white flex items-center justify-center transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onNextMission}
          disabled={missionIndex === totalMissions - 1}
          title="Next Mission"
          className="w-7 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none active:scale-95 text-white flex items-center justify-center transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
