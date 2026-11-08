import { useCallback, useEffect, useRef, useState } from "react";
import {
  Coins, Star, Trophy, Play, RotateCcw, Volume2, VolumeX, ArrowBigUp,
  Hand, Zap, ZoomIn, ZoomOut, PawPrint, X, HelpCircle, Gauge, MapPin, Sparkles,
} from "lucide-react";
import { GameRuntime, type HudState } from "./game/GameRuntime";

const ANIMAL_DOTS = ["Lion", "Giraffe", "Monkey", "Elephant"];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const [hud, setHud] = useState<HudState | null>(null);
  const [muted, setMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [dismissedCard, setDismissedCard] = useState(-1);
  const [runOn, setRunOn] = useState(false);
  const joyRef = useRef<{ id: number; cx: number; cy: number } | null>(null);
  const orbitRef = useRef<{ id: number; lx: number; ly: number } | null>(null);
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;
    const rt = new GameRuntime(canvasRef.current, { onHud: (h) => setHud(h) });
    runtimeRef.current = rt;
    return () => { rt.dispose(); runtimeRef.current = null; };
  }, []);

  const rt = () => runtimeRef.current;

  // joystick handlers
  const joyDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = e.currentTarget.getBoundingClientRect();
    joyRef.current = { id: e.pointerId, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  };
  const joyMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const j = joyRef.current;
    if (!j || j.id !== e.pointerId) return;
    let dx = e.clientX - j.cx, dy = e.clientY - j.cy;
    const d = Math.hypot(dx, dy), max = 46;
    if (d > max) { dx = (dx / d) * max; dy = (dy / d) * max; }
    setJoyKnob({ x: dx, y: dy });
    rt()?.setJoystick(dx / max, dy / max);
  };
  const joyUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyRef.current?.id !== e.pointerId) return;
    joyRef.current = null;
    setJoyKnob({ x: 0, y: 0 });
    rt()?.setJoystick(0, 0);
  };

  // orbit drag (right side of screen)
  const orbitDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (orbitRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    orbitRef.current = { id: e.pointerId, lx: e.clientX, ly: e.clientY };
  };
  const orbitMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const o = orbitRef.current;
    if (!o || o.id !== e.pointerId) return;
    rt()?.orbit(e.clientX - o.lx, e.clientY - o.ly);
    o.lx = e.clientX; o.ly = e.clientY;
  };
  const orbitUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (orbitRef.current?.id === e.pointerId) orbitRef.current = null;
  };

  const onWheel = useCallback((e: React.WheelEvent) => {
    rt()?.zoom(e.deltaY > 0 ? 1 : -1);
  }, []);

  const showCard = hud?.card && hud.cardKey !== dismissedCard;
  const save = rt()?.getSave();

  return (
    <div className="fixed inset-0 overflow-hidden bg-emerald-950 font-sans select-none" onWheel={onWheel}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      {/* orbit drag layer (right 55% of screen, behind UI buttons) */}
      <div
        className="absolute inset-y-0 right-0 w-[55%] touch-none"
        onPointerDown={orbitDown} onPointerMove={orbitMove} onPointerUp={orbitUp} onPointerCancel={orbitUp}
      />

      {/* ---------- top HUD ---------- */}
      {hud?.started && !hud.completed && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-2 p-3">
          <div className="flex w-full max-w-3xl items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-sm font-bold text-amber-300 backdrop-blur">
                <Coins className="h-4 w-4" /> {hud.coins}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-sm font-bold text-yellow-200 backdrop-blur">
                <Star className="h-4 w-4" /> {hud.stars}
              </span>
              <span className="hidden items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-emerald-200 backdrop-blur sm:flex">
                <Gauge className="h-3.5 w-3.5" /> {hud.stats.fps} FPS · Q{hud.stats.quality === 1 ? "High" : hud.stats.quality === 0.5 ? "Med" : "Low"}
              </span>
            </div>
            <div className="pointer-events-auto flex items-center gap-1.5">
              <button onClick={() => setShowHelp(true)} className="rounded-full bg-black/55 p-2 text-white backdrop-blur hover:bg-black/70" aria-label="Help">
                <HelpCircle className="h-4 w-4" />
              </button>
              <button onClick={() => { const m = rt()?.toggleMute(); setMuted(m === false); }} className="rounded-full bg-black/55 p-2 text-white backdrop-blur hover:bg-black/70" aria-label="Mute">
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button onClick={() => rt()?.reset()} className="rounded-full bg-black/55 p-2 text-white backdrop-blur hover:bg-black/70" aria-label="Restart">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* mission banner */}
          <div className="w-full max-w-xl rounded-2xl bg-black/55 px-4 py-2.5 backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-extrabold tracking-wide text-white">
                <MapPin className="h-4 w-4 text-amber-300" />
                {hud.elephantFound ? "Say Hello to the Elephant!" : "MISSION: Find the Elephant!"}
              </p>
              <div className="flex items-center gap-1">
                {ANIMAL_DOTS.map((n, i) => (
                  <span key={n} title={n} className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${i < hud.discovered ? "bg-amber-400 text-emerald-950" : "bg-white/20 text-white/70"}`}>
                    <PawPrint className="h-3.5 w-3.5" />
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500" style={{ width: `${hud.progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* hint toast */}
      {hud?.hint && hud.started && !hud.completed && (
        <div className="pointer-events-none absolute inset-x-0 top-36 flex justify-center px-4">
          <p className="rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-emerald-950 shadow-lg">{hud.hint}</p>
        </div>
      )}

      {/* ---------- learning card ---------- */}
      {showCard && hud.card && (
        <div className="absolute inset-x-0 bottom-44 flex justify-center px-4 sm:bottom-40">
          <div className="w-full max-w-md rounded-3xl border-4 bg-white/95 p-5 shadow-2xl backdrop-blur" style={{ borderColor: hud.card.color }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">New Word!</p>
                <h2 className="text-4xl font-black tracking-tight text-slate-900">{hud.card.word}</h2>
                <p className="text-sm font-semibold text-slate-500">say it: {hud.card.phonetic}</p>
              </div>
              <button onClick={() => setDismissedCard(hud.cardKey)} className="rounded-full bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-lg font-bold" style={{ color: hud.card.color }}>{hud.card.sound}</p>
            <p className="mt-1 text-sm text-slate-700">{hud.card.fact}</p>
            <button
              onClick={() => rt()?.speak(`${hud.card!.word}! ${hud.card!.fact}`)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <Volume2 className="h-4 w-4" /> Hear it again
            </button>
          </div>
        </div>
      )}

      {/* ---------- interact prompt ---------- */}
      {hud?.interactLabel && hud.started && !hud.completed && (
        <div className="absolute inset-x-0 bottom-40 flex justify-center sm:bottom-36">
          <button
            onClick={() => rt()?.pressInteract()}
            className="flex animate-bounce items-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-extrabold text-emerald-950 shadow-xl hover:bg-amber-300"
          >
            <Hand className="h-5 w-5" /> {hud.interactLabel} <span className="rounded bg-emerald-950/20 px-1.5 py-0.5 text-xs">E</span>
          </button>
        </div>
      )}

      {/* ---------- touch controls ---------- */}
      {hud?.started && !hud.completed && (
        <>
          {/* joystick */}
          <div
            className="absolute bottom-6 left-5 h-32 w-32 touch-none rounded-full border-2 border-white/30 bg-black/35 backdrop-blur"
            onPointerDown={joyDown} onPointerMove={joyMove} onPointerUp={joyUp} onPointerCancel={joyUp}
          >
            <div
              className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full bg-white/85 shadow-lg"
              style={{ transform: `translate(calc(-50% + ${joyKnob.x}px), calc(-50% + ${joyKnob.y}px))` }}
            />
          </div>

          {/* action buttons */}
          <div className="absolute bottom-6 right-5 flex flex-col items-end gap-3">
            <div className="flex gap-2">
              <button onClick={() => rt()?.zoom(-1.2)} className="rounded-full bg-black/50 p-2.5 text-white backdrop-blur" aria-label="Zoom in"><ZoomIn className="h-5 w-5" /></button>
              <button onClick={() => rt()?.zoom(1.2)} className="rounded-full bg-black/50 p-2.5 text-white backdrop-blur" aria-label="Zoom out"><ZoomOut className="h-5 w-5" /></button>
            </div>
            <div className="flex items-end gap-3">
              <button
                onClick={() => { const v = !runOn; setRunOn(v); rt()?.setRun(v); }}
                className={`flex h-14 w-14 flex-col items-center justify-center rounded-full backdrop-blur ${runOn ? "bg-amber-400 text-emerald-950" : "bg-black/50 text-white"}`}
                aria-label="Run"
              >
                <Zap className="h-6 w-6" /><span className="text-[9px] font-bold">RUN</span>
              </button>
              <button
                onPointerDown={() => rt()?.pressInteract()}
                className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-emerald-500/90 text-white shadow-lg backdrop-blur active:bg-emerald-400"
                aria-label="Interact"
              >
                <Hand className="h-7 w-7" /><span className="text-[9px] font-bold">HI</span>
              </button>
              <button
                onPointerDown={() => rt()?.pressJump()}
                className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-amber-400/90 text-emerald-950 shadow-lg backdrop-blur active:bg-amber-300"
                aria-label="Jump"
              >
                <ArrowBigUp className="h-7 w-7" /><span className="text-[9px] font-bold">JUMP</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ---------- start screen ---------- */}
      {!hud?.started && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-emerald-950/70 via-emerald-900/50 to-emerald-950/80 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white/95 p-6 text-center shadow-2xl backdrop-blur sm:p-8">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
              <PawPrint className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">SUPER MONTASER</h1>
            <p className="mt-1 text-sm font-bold uppercase tracking-widest text-amber-600">Jungle Adventure · Level 1</p>
            <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-left">
              <p className="flex items-center gap-2 font-extrabold text-emerald-900"><Sparkles className="h-4 w-4 text-amber-500" /> Mission: Find the Elephant!</p>
              <p className="mt-1 text-sm text-emerald-800">Explore the jungle with Mr. Montaser. Meet the animals, learn their names, find the Elephant, say hello, and open the treasure chest!</p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-semibold text-slate-600">
              <div className="rounded-xl bg-slate-100 p-2">Joystick<br />to move</div>
              <div className="rounded-xl bg-slate-100 p-2">Drag screen<br />to look</div>
              <div className="rounded-xl bg-slate-100 p-2">WASD + Space<br />on keyboard</div>
            </div>
            {save && save.completions > 0 && (
              <p className="mt-3 text-xs font-semibold text-slate-500">
                Best run: {save.completions} completion{save.completions > 1 ? "s" : ""} · {save.coins} coins · {save.stars} stars
                {save.bestTimeMs ? ` · ${Math.round(save.bestTimeMs / 1000)}s` : ""}
              </p>
            )}
            <button
              onClick={() => rt()?.startMission()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 text-lg font-extrabold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500"
            >
              <Play className="h-6 w-6" /> Start Adventure
            </button>
          </div>
        </div>
      )}

      {/* ---------- completion screen ---------- */}
      {hud?.completed && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white/95 p-6 text-center shadow-2xl backdrop-blur sm:p-8">
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg">
              <Trophy className="h-11 w-11 text-emerald-950" />
            </div>
            <h2 className="text-3xl font-black text-emerald-950">Mission Complete!</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">You found the ELEPHANT and opened the treasure chest. Great exploring, explorer!</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-amber-50 p-3"><Coins className="mx-auto h-5 w-5 text-amber-500" /><p className="mt-1 text-xl font-black text-slate-900">{hud.coins}</p><p className="text-xs text-slate-500">Coins</p></div>
              <div className="rounded-2xl bg-yellow-50 p-3"><Star className="mx-auto h-5 w-5 text-yellow-500" /><p className="mt-1 text-xl font-black text-slate-900">{hud.stars}</p><p className="text-xs text-slate-500">Stars</p></div>
              <div className="rounded-2xl bg-emerald-50 p-3"><PawPrint className="mx-auto h-5 w-5 text-emerald-600" /><p className="mt-1 text-xl font-black text-slate-900">{hud.discovered}/4</p><p className="text-xs text-slate-500">Animals</p></div>
            </div>
            <button
              onClick={() => rt()?.reset()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 font-extrabold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500"
            >
              <RotateCcw className="h-5 w-5" /> Play Again
            </button>
          </div>
        </div>
      )}

      {/* ---------- help modal ---------- */}
      {showHelp && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowHelp(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-emerald-950">How to Play</h3>
              <button onClick={() => setShowHelp(false)} className="rounded-full bg-slate-100 p-1.5 text-slate-600" aria-label="Close help"><X className="h-4 w-4" /></button>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li><b>Move:</b> left joystick (touch) or WASD / arrow keys.</li>
              <li><b>Look around:</b> drag the right side of the screen, or move the mouse while dragging.</li>
              <li><b>Jump:</b> JUMP button or Space.</li>
              <li><b>Run:</b> RUN toggle, Shift, or push the joystick fully.</li>
              <li><b>Interact:</b> HI button or E when a prompt appears.</li>
              <li><b>Zoom:</b> + / − buttons or mouse wheel.</li>
              <li><b>Mission:</b> explore, meet all 4 animals, find the Elephant, say hello, open the chest!</li>
            </ul>
            <button onClick={() => setShowHelp(false)} className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 font-bold text-white hover:bg-emerald-700">Got it!</button>
          </div>
        </div>
      )}
    </div>
  );
}
