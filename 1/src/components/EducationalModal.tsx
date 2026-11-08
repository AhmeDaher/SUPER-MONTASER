import React from 'react';
import { Volume2, Sparkles, X, BookOpen, Compass } from 'lucide-react';
import { AnimalData } from '../engine/types';
import { LearningEngine } from '../engine/learning/LearningEngine';

interface EducationalModalProps {
  animal: AnimalData;
  isTarget: boolean;
  speechText: string;
  missionCompleted: boolean;
  learningEngine: LearningEngine;
  onClose: () => void;
}

export const EducationalModal: React.FC<EducationalModalProps> = ({
  animal,
  isTarget,
  speechText,
  missionCompleted,
  learningEngine,
  onClose,
}) => {
  const content = learningEngine.getAnimalContent(animal.type);

  const getEmoji = () => {
    switch (animal.type) {
      case 'elephant':
        return '🐘';
      case 'lion':
        return '🦁';
      case 'giraffe':
        return '🦒';
      case 'monkey':
        return '🐒';
    }
  };

  const handlePronounce = () => {
    learningEngine.speak(content.word);
  };

  const handleSpell = () => {
    learningEngine.speakSpelling(content.spelling);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-emerald-900/95 to-slate-900/95 border-2 border-amber-400/80 rounded-3xl p-6 shadow-2xl text-white overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow backdrop decorative accent */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all text-white/80 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isTarget
                ? 'bg-amber-400 text-amber-950 font-cartoon'
                : 'bg-emerald-600/80 text-emerald-100 font-cartoon'
            }`}
          >
            {isTarget ? '🎯 Mission Target Found!' : '🌿 Jungle Discovery'}
          </span>
          {missionCompleted && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-400 text-yellow-950 flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> Mission Complete!
            </span>
          )}
        </div>

        {/* Animal Title and Icon */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-4xl shadow-inner">
            {getEmoji()}
          </div>
          <div>
            <h2 className="text-2xl font-bold font-cartoon text-amber-300 leading-tight">
              {animal.name}
            </h2>
            <p className="text-emerald-200 text-sm font-medium">{animal.title}</p>
            <p className="text-xs text-amber-200/80 mt-1 italic">{content.phonics}</p>
          </div>
        </div>

        {/* Spoken Guidance Box */}
        <div className="bg-black/30 border border-white/10 rounded-2xl p-4 mb-5 shadow-inner">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 flex-shrink-0 flex items-center justify-center font-bold text-sm">
              🧭
            </div>
            <div>
              <p className="text-xs text-amber-300/80 font-semibold uppercase tracking-wider mb-0.5">
                Mr. Montaser says:
              </p>
              <p className="text-sm text-emerald-100 leading-relaxed font-medium">
                "{speechText}"
              </p>
            </div>
          </div>
        </div>

        {/* Spelling Word Blocks */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-400" /> English Word Spelling:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 py-2">
            {content.spelling.map((letter, idx) => (
              <div
                key={idx}
                className="w-10 h-12 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 font-black text-xl flex items-center justify-center shadow-md transform hover:scale-105 transition-transform"
              >
                {letter}
              </div>
            ))}
          </div>

          {/* Pronunciation & Phonics Buttons */}
          <div className="flex gap-2.5 mt-3">
            <button
              onClick={handlePronounce}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Volume2 className="w-4 h-4" /> Say Word
            </button>
            <button
              onClick={handleSpell}
              className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 active:scale-98 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              🔤 Spell Letters
            </button>
          </div>
        </div>

        {/* Fun Facts & Habitat Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-amber-300 font-bold mb-1 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> Habitat:
            </p>
            <p className="text-white/80 leading-normal">{content.habitat}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-amber-300 font-bold mb-1 flex items-center gap-1">
              🥗 Diet:
            </p>
            <p className="text-white/80 leading-normal">{content.diet}</p>
          </div>
        </div>

        {/* Educational Fact Note */}
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-3 mb-5">
          <p className="text-xs text-amber-300 font-bold mb-0.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Fun Jungle Fact:
          </p>
          <p className="text-xs text-emerald-100 leading-relaxed">{content.funFact}</p>
        </div>

        {/* Bottom Continue Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-base shadow-xl active:scale-98 transition-all font-cartoon"
        >
          {isTarget ? '🎉 Continue Adventure!' : 'Keep Exploring!'}
        </button>
      </div>
    </div>
  );
};
