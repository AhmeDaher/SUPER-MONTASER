import { useEffect, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  BookOpen,
  Settings,
  FileText,
  Hand,
  ArrowUp,
  Flame,
  HelpCircle,
} from 'lucide-react';
import { GameRuntime } from './engine/GameRuntime';
import {
  AnimalData,
  InteractionTarget,
  PerformanceStats,
  PerformanceTier,
  PlayerStats,
} from './engine/types';
import { TouchJoystick } from './components/TouchJoystick';
import { MissionBanner } from './components/MissionBanner';
import { EducationalModal } from './components/EducationalModal';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { EncyclopediaModal } from './components/EncyclopediaModal';
import { SettingsModal } from './components/SettingsModal';
import { DeliverablesModal } from './components/DeliverablesModal';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);

  // HUD States
  const [stats, setStats] = useState<PlayerStats>({
    coins: 0,
    stars: 0,
    discoveredAnimals: [],
    completedMissions: [],
    unlockedBadges: ['Jungle Scout'],
  });

  const [activeTarget, setActiveTarget] = useState<InteractionTarget | null>(null);
  const [missionIndex, setMissionIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);
  const [showControlsHint, setShowControlsHint] = useState(true);

  // Performance Telemetry
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    fps: 60,
    drawCalls: 0,
    triangles: 0,
    resolutionScale: 1.0,
    tier: 'high',
    furShellsCount: 4,
    grassInstances: 1800,
  });

  // Modal Overlays
  const [educationalDialog, setEducationalDialog] = useState<{
    animal: AnimalData;
    isTarget: boolean;
    speechText: string;
    missionCompleted: boolean;
  } | null>(null);

  const [celebrationData, setCelebrationData] = useState<{
    missionTitle: string;
    rewardCoins: number;
    rewardStars: number;
    badge?: string;
  } | null>(null);

  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeliverables, setShowDeliverables] = useState(false);

  // Touch Camera Swipe tracking
  const cameraTouchRef = useRef<{ id: number | null; lastX: number; lastY: number }>({
    id: null,
    lastX: 0,
    lastY: 0,
  });

  // Initialize WebGL2 Game Runtime
  useEffect(() => {
    if (!canvasRef.current) return;

    const runtime = new GameRuntime(canvasRef.current, {
      onInteractionTargetChange: (target) => {
        setActiveTarget(target);
      },
      onEducationalDialog: (content) => {
        setEducationalDialog(content);
      },
      onMissionCompleted: (title, coins, stars, badge) => {
        setCelebrationData({
          missionTitle: title,
          rewardCoins: coins,
          rewardStars: stars,
          badge,
        });
      },
      onStatsUpdate: (updatedStats) => {
        setStats((prev) => ({ ...prev, ...updatedStats }));
      },
      onPerformanceUpdate: (perf) => {
        setPerformanceStats(perf);
      },
    });

    runtimeRef.current = runtime;
    runtime.start();
    setStats(runtime.rewardManager.getStats());

    // Auto-fade controls hint after 8 seconds
    const hintTimer = setTimeout(() => {
      setShowControlsHint(false);
    }, 8000);

    return () => {
      clearTimeout(hintTimer);
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, []);

  // Handlers
  const handleToggleMute = () => {
    if (!runtimeRef.current) return;
    const muted = runtimeRef.current.audioManager.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectTier = (tier: PerformanceTier) => {
    if (!runtimeRef.current) return;
    runtimeRef.current.setGraphicsTier(tier);
  };

  const handleReplayMissionAudio = () => {
    if (!runtimeRef.current) return;
    runtimeRef.current.missionSystem.speakMissionInstruction();
  };

  const handleNextMission = () => {
    if (!runtimeRef.current) return;
    const missions = runtimeRef.current.missionSystem.getAllMissions();
    const nextIdx = Math.min(missions.length - 1, missionIndex + 1);
    runtimeRef.current.missionSystem.setMission(nextIdx);
    setMissionIndex(nextIdx);
  };

  const handlePrevMission = () => {
    if (!runtimeRef.current) return;
    const prevIdx = Math.max(0, missionIndex - 1);
    runtimeRef.current.missionSystem.setMission(prevIdx);
    setMissionIndex(prevIdx);
  };

  const handleInteract = () => {
    if (!runtimeRef.current) return;
    runtimeRef.current.triggerInteract();
  };

  const handleJump = () => {
    if (!runtimeRef.current) return;
    runtimeRef.current.setTouchJump(true);
  };

  const handleToggleSprint = () => {
    if (!runtimeRef.current) return;
    const next = !isSprinting;
    setIsSprinting(next);
    runtimeRef.current.setTouchSprint(next);
  };

  // Touch Camera drag handler on right portion of canvas
  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    // Only capture touches on upper / right half for camera orbit
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.clientX > window.innerWidth * 0.35 && cameraTouchRef.current.id === null) {
        cameraTouchRef.current.id = touch.identifier;
        cameraTouchRef.current.lastX = touch.clientX;
        cameraTouchRef.current.lastY = touch.clientY;
        break;
      }
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent) => {
    if (cameraTouchRef.current.id === null || !runtimeRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === cameraTouchRef.current.id) {
        const dx = touch.clientX - cameraTouchRef.current.lastX;
        const dy = touch.clientY - cameraTouchRef.current.lastY;
        cameraTouchRef.current.lastX = touch.clientX;
        cameraTouchRef.current.lastY = touch.clientY;

        runtimeRef.current.rotateCameraByTouch(dx, dy);
        break;
      }
    }
  };

  const handleCanvasTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === cameraTouchRef.current.id) {
        cameraTouchRef.current.id = null;
        break;
      }
    }
  };

  const currentMission = runtimeRef.current
    ? runtimeRef.current.missionSystem.getCurrentMission()
    : {
        id: 'mission_elephant',
        title: 'Find the Elephant',
        instruction: 'Find the Elephant! Listen for its trumpet in the jungle.',
        targetAnimal: 'elephant',
        targetType: 'animal',
        targetCount: 1,
        currentCount: 0,
        completed: false,
        rewardCoins: 10,
        rewardStars: 1,
        educationalPrompt: 'Can you find the Elephant?',
      };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-emerald-950 font-sans select-none touch-none"
      onTouchStart={handleCanvasTouchStart}
      onTouchMove={handleCanvasTouchMove}
      onTouchEnd={handleCanvasTouchEnd}
      onTouchCancel={handleCanvasTouchEnd}
    >
      {/* 3D WebGL2 Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* --- TOP HUD LAYER --- */}
      <header className="absolute top-0 inset-x-0 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 pointer-events-none z-20">
        {/* Left: Player Inventory & Title */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Logo / Character Avatar Pill */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl py-1.5 px-3 shadow-lg">
            <span className="text-xl">🤠</span>
            <div>
              <p className="text-xs font-black text-amber-300 font-cartoon leading-none">
                SUPER MONTASER
              </p>
              <p className="text-[10px] text-emerald-200/80 font-bold">Jungle Explorer</p>
            </div>
          </div>

          {/* Coins Pill */}
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl py-1.5 px-3 shadow-lg">
            <span className="text-base">🪙</span>
            <span className="text-sm font-black text-yellow-300 font-cartoon">
              {stats.coins}
            </span>
          </div>

          {/* Stars Pill */}
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl py-1.5 px-3 shadow-lg">
            <span className="text-base">⭐</span>
            <span className="text-sm font-black text-yellow-300 font-cartoon">
              {stats.stars}
            </span>
          </div>
        </div>

        {/* Center: Active Educational Mission Banner */}
        <MissionBanner
          mission={currentMission as any}
          missionIndex={missionIndex}
          totalMissions={runtimeRef.current ? runtimeRef.current.missionSystem.getAllMissions().length : 5}
          onReplayAudio={handleReplayMissionAudio}
          onNextMission={handleNextMission}
          onPrevMission={handlePrevMission}
        />

        {/* Right: Action Icon Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Journal / Discovery Log */}
          <button
            onClick={() => setShowEncyclopedia(true)}
            title="Animal Explorer Journal"
            className="w-10 h-10 rounded-2xl bg-black/40 hover:bg-black/60 active:scale-95 border border-white/20 text-amber-300 flex items-center justify-center transition-all shadow-lg"
          >
            <BookOpen className="w-5 h-5" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="w-10 h-10 rounded-2xl bg-black/40 hover:bg-black/60 active:scale-95 border border-white/20 text-white flex items-center justify-center transition-all shadow-lg"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          {/* Settings & Telemetry */}
          <button
            onClick={() => setShowSettings(true)}
            title="Graphics & Performance"
            className="w-10 h-10 rounded-2xl bg-black/40 hover:bg-black/60 active:scale-95 border border-white/20 text-white flex items-center justify-center transition-all shadow-lg"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Deliverables / Architecture Report */}
          <button
            onClick={() => setShowDeliverables(true)}
            title="Engine Architecture & Deliverables"
            className="w-10 h-10 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-bold flex items-center justify-center transition-all shadow-lg"
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* --- PROXIMITY INTERACTION PROMPT (Center-Bottom) --- */}
      {activeTarget && (
        <div className="absolute bottom-28 sm:bottom-24 inset-x-0 flex justify-center pointer-events-none z-20 animate-bounce">
          <button
            onClick={handleInteract}
            className="pointer-events-auto py-2.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 font-black text-sm shadow-2xl flex items-center gap-2 border-2 border-white/40 active:scale-95 font-cartoon"
          >
            <Hand className="w-5 h-5" />
            <span>{activeTarget.prompt}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-black/20 text-amber-950 font-mono">
              [E]
            </span>
          </button>
        </div>
      )}

      {/* --- BOTTOM LAYER: MOBILE TOUCH CONTROLS --- */}
      <div className="absolute bottom-4 inset-x-4 flex items-end justify-between pointer-events-none z-20">
        {/* Left: Virtual Touch Joystick */}
        <div className="pointer-events-auto">
          <TouchJoystick
            onMove={(x, z) => {
              if (runtimeRef.current) {
                runtimeRef.current.setTouchJoystick(x, z);
              }
            }}
          />
        </div>

        {/* Center: Controls Hint Tooltip */}
        {showControlsHint && (
          <div className="hidden sm:flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/20 text-white text-xs py-1.5 px-4 rounded-xl shadow-lg pointer-events-auto mb-2">
            <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              Use <strong className="text-amber-300">WASD / Arrow Keys</strong> to explore,{' '}
              <strong className="text-amber-300">Space</strong> to Jump, and{' '}
              <strong className="text-amber-300">[E]</strong> to examine animals!
            </span>
            <button
              onClick={() => setShowControlsHint(false)}
              className="text-white/60 hover:text-white font-bold ml-1 text-sm"
            >
              ✕
            </button>
          </div>
        )}

        {/* Right: Touch Action Buttons */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Sprint Toggle */}
          <button
            onClick={handleToggleSprint}
            title="Toggle Sprint"
            className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center transition-all shadow-lg active:scale-90 ${
              isSprinting
                ? 'border-orange-400 bg-orange-500 text-white'
                : 'border-white/30 bg-black/40 text-white/80'
            }`}
          >
            <Flame className="w-6 h-6" />
            <span className="text-[9px] font-bold uppercase mt-0.5">Sprint</span>
          </button>

          {/* Jump Button */}
          <button
            onClick={handleJump}
            title="Jump"
            className="w-16 h-16 rounded-3xl border-2 border-emerald-400/80 bg-emerald-600/80 hover:bg-emerald-500 active:scale-90 text-white flex flex-col items-center justify-center shadow-xl transition-all"
          >
            <ArrowUp className="w-7 h-7" />
            <span className="text-[10px] font-bold uppercase">Jump</span>
          </button>

          {/* Interact / Action Button */}
          <button
            onClick={handleInteract}
            title="Interact"
            className={`w-18 h-18 rounded-3xl border-2 flex flex-col items-center justify-center shadow-2xl transition-all active:scale-90 ${
              activeTarget
                ? 'border-amber-300 bg-gradient-to-b from-amber-400 to-amber-500 text-amber-950 animate-pulse'
                : 'border-white/30 bg-black/40 text-white/60'
            }`}
          >
            <Hand className="w-8 h-8" />
            <span className="text-[10px] font-black uppercase font-cartoon mt-0.5">Action</span>
          </button>
        </div>
      </div>

      {/* --- MODAL DIALOGS --- */}

      {/* 1. Educational Discovery Modal */}
      {educationalDialog && runtimeRef.current && (
        <EducationalModal
          animal={educationalDialog.animal}
          isTarget={educationalDialog.isTarget}
          speechText={educationalDialog.speechText}
          missionCompleted={educationalDialog.missionCompleted}
          learningEngine={runtimeRef.current.learningEngine}
          onClose={() => setEducationalDialog(null)}
        />
      )}

      {/* 2. Celebration Fanfare Modal */}
      {celebrationData && (
        <CelebrationOverlay
          missionTitle={celebrationData.missionTitle}
          rewardCoins={celebrationData.rewardCoins}
          rewardStars={celebrationData.rewardStars}
          badge={celebrationData.badge}
          onNextMission={() => {
            setCelebrationData(null);
            handleNextMission();
          }}
          onDismiss={() => setCelebrationData(null)}
        />
      )}

      {/* 3. Explorer Journal / Encyclopedia */}
      {showEncyclopedia && runtimeRef.current && (
        <EncyclopediaModal
          stats={stats}
          learningEngine={runtimeRef.current.learningEngine}
          onClose={() => setShowEncyclopedia(false)}
        />
      )}

      {/* 4. Settings & Performance Benchmark */}
      {showSettings && runtimeRef.current && (
        <SettingsModal
          performanceStats={performanceStats}
          audioManager={runtimeRef.current.audioManager}
          onSelectTier={handleSelectTier}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* 5. Complete Deliverables & Technical Architecture Report */}
      {showDeliverables && (
        <DeliverablesModal onClose={() => setShowDeliverables(false)} />
      )}
    </div>
  );
}
export default App;
