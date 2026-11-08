import React from 'react';
import { X, Volume2, VolumeX, Music, Cpu, Gamepad2 } from 'lucide-react';
import { AudioManager } from '../engine/audio/AudioManager';
import { PerformanceStats, PerformanceTier } from '../engine/types';

interface SettingsModalProps {
  performanceStats: PerformanceStats;
  audioManager: AudioManager;
  onSelectTier: (tier: PerformanceTier) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  performanceStats,
  audioManager,
  onSelectTier,
  onClose,
}) => {
  const [muted, setMuted] = React.useState(audioManager.getMuted());
  const [music, setMusic] = React.useState(audioManager.isMusicPlaying());

  const handleToggleMute = () => {
    const isMuted = audioManager.toggleMute();
    setMuted(isMuted);
  };

  const handleToggleMusic = () => {
    const isPlaying = audioManager.toggleMusic();
    setMusic(isPlaying);
  };

  const tiers: { id: PerformanceTier; label: string; desc: string }[] = [
    { id: 'low', label: 'Low', desc: 'Max FPS for entry-level Android devices. Stylized tufts.' },
    { id: 'medium', label: 'Medium', desc: 'Balanced for standard phones. 85% scale, procedural tufts.' },
    { id: 'high', label: 'High', desc: 'Full 1080p resolution, soft shadows, 6-shell fur, dense grass.' },
    { id: 'ultra', label: 'Ultra', desc: 'Maximum quality, 12-layer volumetric fur shells, 3.5k grass.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-emerald-950 border-2 border-white/20 rounded-3xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
              ⚙️
            </div>
            <div>
              <h2 className="text-xl font-bold font-cartoon text-amber-300">
                Engine Settings & Performance
              </h2>
              <p className="text-xs text-white/70">Mobile Graphics & Hardware Safeguards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Hardware Telemetry */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-5">
          <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-emerald-400" /> Live WebGL2 Telemetry:
          </p>
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-lg font-black text-emerald-400 font-cartoon">
                {performanceStats.fps}
              </p>
              <p className="text-[10px] text-white/60 uppercase">FPS</p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-lg font-black text-amber-300 font-cartoon">
                {Math.round(performanceStats.resolutionScale * 100)}%
              </p>
              <p className="text-[10px] text-white/60 uppercase">Render Scale</p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-lg font-black text-sky-300 font-cartoon">
                {performanceStats.drawCalls}
              </p>
              <p className="text-[10px] text-white/60 uppercase">Draw Calls</p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-sm font-bold text-white/90">
                {performanceStats.triangles > 1000
                  ? `${(performanceStats.triangles / 1000).toFixed(1)}k`
                  : performanceStats.triangles}
              </p>
              <p className="text-[10px] text-white/60 uppercase">Triangles</p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-sm font-bold text-amber-300">
                {performanceStats.furShellsCount} Shells
              </p>
              <p className="text-[10px] text-white/60 uppercase">Fur Simulation</p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-sm font-bold text-emerald-300">
                {performanceStats.grassInstances}
              </p>
              <p className="text-[10px] text-white/60 uppercase">Grass Blades</p>
            </div>
          </div>
        </div>

        {/* Graphics Quality Preset Selector */}
        <div className="mb-5">
          <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">
            Graphics Tier (Adaptive Scaling Active):
          </p>
          <div className="grid grid-cols-2 gap-2">
            {tiers.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelectTier(t.id)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  performanceStats.tier === t.id
                    ? 'border-amber-400 bg-amber-400/20 shadow-md ring-1 ring-amber-400'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <p className="font-bold text-sm text-white font-cartoon">{t.label}</p>
                <p className="text-[11px] text-white/70 leading-tight mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Audio Toggles */}
        <div className="mb-5">
          <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">
            Sound & Atmosphere:
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={handleToggleMute}
              className={`flex-1 py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                muted
                  ? 'border-red-500/50 bg-red-500/20 text-red-200'
                  : 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200'
              }`}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {muted ? 'Audio Muted' : 'Sound Active'}
            </button>
            <button
              onClick={handleToggleMusic}
              className={`flex-1 py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                music
                  ? 'border-amber-400/50 bg-amber-400/20 text-amber-200'
                  : 'border-white/10 bg-white/5 text-white/70'
              }`}
            >
              <Music className="w-4 h-4" />
              {music ? 'Music: ON' : 'Music: OFF'}
            </button>
          </div>
        </div>

        {/* Controls Guide */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-5 text-xs">
          <p className="font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Gamepad2 className="w-4 h-4" /> Controls Reference:
          </p>
          <div className="grid grid-cols-2 gap-2 text-white/80">
            <div>
              <p className="font-bold text-white">Desktop Keyboard & Mouse:</p>
              <p>• Move: <span className="text-amber-300">W A S D / Arrows</span></p>
              <p>• Jump: <span className="text-amber-300">Spacebar</span></p>
              <p>• Sprint: <span className="text-amber-300">Shift</span></p>
              <p>• Interact: <span className="text-amber-300">E / Enter</span></p>
              <p>• Camera Orbit: <span className="text-amber-300">Mouse Drag</span></p>
            </div>
            <div>
              <p className="font-bold text-white">Mobile Touchscreen:</p>
              <p>• Move: <span className="text-amber-300">Left Virtual Thumbstick</span></p>
              <p>• Jump: <span className="text-amber-300">Right Jump Button</span></p>
              <p>• Sprint: <span className="text-amber-300">Sprint Toggle</span></p>
              <p>• Action: <span className="text-amber-300">Action Button</span></p>
              <p>• Orbit: <span className="text-amber-300">Swipe Screen</span></p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm transition-all font-cartoon"
        >
          Save & Return to Jungle
        </button>
      </div>
    </div>
  );
};
