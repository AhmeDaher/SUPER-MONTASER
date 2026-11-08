import React, { useState } from 'react';
import { X, Award, Volume2, CheckCircle2 } from 'lucide-react';
import { LearningEngine } from '../engine/learning/LearningEngine';
import { PlayerStats } from '../engine/types';

interface EncyclopediaModalProps {
  stats: PlayerStats;
  learningEngine: LearningEngine;
  onClose: () => void;
}

export const EncyclopediaModal: React.FC<EncyclopediaModalProps> = ({
  stats,
  learningEngine,
  onClose,
}) => {
  const animals = learningEngine.getAllAnimals();
  const [selectedAnimal, setSelectedAnimal] = useState(animals[0]);

  const getAnimalEmoji = (type: string) => {
    switch (type) {
      case 'elephant':
        return '🐘';
      case 'lion':
        return '🦁';
      case 'giraffe':
        return '🦒';
      case 'monkey':
        return '🐒';
      default:
        return '🐾';
    }
  };

  const isDiscovered = (type: any) => stats.discoveredAnimals.includes(type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-emerald-950 to-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 shadow-2xl text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-xl">
              📖
            </div>
            <div>
              <h2 className="text-xl font-bold font-cartoon text-amber-300">
                Jungle Explorer Journal
              </h2>
              <p className="text-xs text-white/70">
                Discovered: {stats.discoveredAnimals.length} of 4 Animals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content split */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 overflow-y-auto">
          {/* Left list of animals */}
          <div className="flex flex-col gap-2.5">
            {animals.map((a) => {
              const discovered = isDiscovered(a.type);
              const selected = selectedAnimal.type === a.type;
              return (
                <button
                  key={a.type}
                  onClick={() => setSelectedAnimal(a)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    selected
                      ? 'border-amber-400 bg-amber-400/20 shadow-md'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center text-2xl flex-shrink-0">
                    {discovered ? getAnimalEmoji(a.type) : '❓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white truncate font-cartoon">
                      {discovered ? a.word : 'Unknown Creature'}
                    </p>
                    <p className="text-xs text-emerald-200/70 truncate">
                      {discovered ? 'Discovered ✓' : 'Explore to find'}
                    </p>
                  </div>
                  {discovered && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                </button>
              );
            })}

            {/* Badges Box */}
            <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" /> Explorer Badges:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {stats.unlockedBadges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-amber-400/20 border border-amber-400/40 text-amber-200 rounded-lg text-[11px] font-bold"
                  >
                    🏅 {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right animal details */}
          <div className="md:col-span-2 bg-black/30 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
            {isDiscovered(selectedAnimal.type) ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-3xl">
                    {getAnimalEmoji(selectedAnimal.type)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold font-cartoon text-amber-300">
                      {selectedAnimal.word}
                    </h3>
                    <p className="text-xs text-emerald-200">{selectedAnimal.phonics}</p>
                  </div>
                </div>

                {/* Spelling Blocks */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedAnimal.spelling.map((letter, idx) => (
                    <span
                      key={idx}
                      className="w-8 h-9 rounded-lg bg-amber-400 text-amber-950 font-bold text-base flex items-center justify-center shadow"
                    >
                      {letter}
                    </span>
                  ))}
                  <button
                    onClick={() => learningEngine.speak(selectedAnimal.word)}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 ml-2 transition-all"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Pronounce
                  </button>
                </div>

                <div className="space-y-2.5 text-xs text-white/90">
                  <div className="bg-white/5 p-3 rounded-xl">
                    <p className="text-amber-300 font-bold mb-0.5">🌟 Fun Fact:</p>
                    <p className="leading-relaxed">{selectedAnimal.funFact}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 p-2.5 rounded-xl">
                      <p className="text-amber-300 font-bold mb-0.5">📍 Habitat:</p>
                      <p>{selectedAnimal.habitat}</p>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded-xl">
                      <p className="text-amber-300 font-bold mb-0.5">🥗 Diet:</p>
                      <p>{selectedAnimal.diet}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/60">
                <div className="text-5xl mb-3">🧭</div>
                <h4 className="text-base font-bold text-white mb-1 font-cartoon">
                  Not Yet Discovered
                </h4>
                <p className="text-xs max-w-xs leading-relaxed">
                  Explore the 3D jungle, cross the wooden rope bridge, and search near the river and trees to discover this animal!
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="mt-4 w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm transition-all"
            >
              Back to Adventure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
