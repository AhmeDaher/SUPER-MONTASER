import * as THREE from "three";
import type { AnimalKind } from "./animals";
import type { Collider, CollectibleVisual } from "./world";
import { clamp } from "./utils";

// ---------------- AudioManager (procedural WebAudio + speech) ----------------
export class AudioManager {
  private ctx: AudioContext | null = null;
  enabled = true;

  private ac(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return this.ctx;
    } catch { return null; }
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol = 0.18, when = 0, slideTo?: number) {
    const ctx = this.ac(); if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  click() { this.tone(700, 0.08, "sine", 0.12); }
  coin() { this.tone(988, 0.09, "square", 0.1); this.tone(1319, 0.16, "square", 0.1, 0.07); }
  star() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.14, "triangle", 0.14, i * 0.07)); }
  jump() { this.tone(300, 0.18, "sine", 0.14, 0, 620); }
  land() { this.tone(160, 0.12, "sine", 0.12, 0, 90); }
  discover() { [440, 554, 659].forEach((f, i) => this.tone(f, 0.16, "triangle", 0.13, i * 0.08)); }
  trumpet() { this.tone(220, 0.5, "sawtooth", 0.12, 0, 440); this.tone(330, 0.4, "sawtooth", 0.1, 0.15, 660); }
  roar() { this.tone(110, 0.6, "sawtooth", 0.14, 0, 70); this.tone(82, 0.5, "square", 0.1, 0.1, 55); }
  chest() { [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.22, "triangle", 0.14, i * 0.1)); }
  celebrate() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.2, "triangle", 0.14, i * 0.11)); }

  speak(text: string) {
    if (!this.enabled) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.92; u.pitch = 1.1; u.volume = 0.95;
      window.speechSynthesis.speak(u);
    } catch { /* speech unavailable — visuals still teach */ }
  }
}

// ---------------- LearningEngine ----------------
export interface LearningCard {
  kind: AnimalKind; word: string; phonetic: string; sound: string; fact: string; color: string;
}
export const LEARNING: Record<AnimalKind, LearningCard> = {
  lion: { kind: "lion", word: "LION", phonetic: "LYE-un", sound: "Roar!", fact: "A lion is a big cat. It says ROAR!", color: "#f59e0b" },
  giraffe: { kind: "giraffe", word: "GIRAFFE", phonetic: "juh-RAF", sound: "Munch munch!", fact: "A giraffe has a very long neck. It eats leaves from tall trees!", color: "#eab308" },
  monkey: { kind: "monkey", word: "MONKEY", phonetic: "MUNG-kee", sound: "Ooh ooh ah ah!", fact: "A monkey loves to jump and play in the trees!", color: "#a16207" },
  elephant: { kind: "elephant", word: "ELEPHANT", phonetic: "EL-uh-funt", sound: "Toot toot!", fact: "An elephant is the biggest animal. It has a long trunk!", color: "#64748b" },
};

// ---------------- MissionSystem ----------------
export type MissionStep = "intro" | "explore" | "found" | "reward" | "complete";
export class MissionSystem {
  step: MissionStep = "intro";
  discovered = new Set<AnimalKind>();
  elephantFound = false;
  startTime = 0;

  start() { this.step = "explore"; this.startTime = performance.now(); }
  onAnimalDiscovered(kind: AnimalKind) {
    this.discovered.add(kind);
    if (kind === "elephant") this.elephantFound = true;
  }
  onElephantInteract() { if (this.step === "explore") this.step = "found"; }
  onRewardDone() { this.step = "complete"; }
  progress(): number {
    if (this.step === "complete") return 100;
    if (this.step === "found" || this.step === "reward") return 90;
    return Math.round((this.discovered.size / 4) * 70);
  }
}

// ---------------- InteractionSystem ----------------
export interface Interactable { type: "elephant" | "chest" | "animal"; label: string; kind?: AnimalKind; pos: THREE.Vector3; }
export class InteractionSystem {
  findNearest(player: THREE.Vector3, targets: Interactable[], maxDist = 4.2): Interactable | null {
    let best: Interactable | null = null, bd = maxDist;
    for (const t of targets) {
      const d = Math.hypot(player.x - t.pos.x, player.z - t.pos.z);
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  }
}

// ---------------- CollectibleSystem ----------------
export class CollectibleSystem {
  coins = 0; stars = 0;
  check(player: THREE.Vector3, items: CollectibleVisual[], onCollect: (kind: "coin" | "star") => void) {
    for (const c of items) {
      if (c.taken) continue;
      const d = Math.hypot(player.x - c.x, player.z - c.z);
      if (d < 1.5 && Math.abs(player.y + 1 - c.y) < 2.2) {
        c.taken = true; c.mesh.visible = false;
        if (c.kind === "coin") this.coins++; else this.stars++;
        onCollect(c.kind);
      }
    }
  }
  reset(items: CollectibleVisual[]) {
    this.coins = 0; this.stars = 0;
    items.forEach((c) => { c.taken = false; c.mesh.visible = true; });
  }
}

// ---------------- RewardManager ----------------
export class RewardManager {
  private bursts: { points: THREE.Points; vel: Float32Array; life: number }[] = [];
  chestOpen = 0; // 0 closed → 1 open
  private lid: THREE.Group | null = null;
  private gem: THREE.Mesh | null = null;

  bindChest(lid: THREE.Group, group: THREE.Group) {
    this.lid = lid;
    this.gem = group.getObjectByName("chestGem") as THREE.Mesh | null;
  }

  burst(scene: THREE.Scene, pos: THREE.Vector3, colors: number[], count = 120) {
    const geo = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3), v = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      p[i * 3] = pos.x; p[i * 3 + 1] = pos.y; p[i * 3 + 2] = pos.z;
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 5;
      v[i * 3] = Math.cos(a) * sp; v[i * 3 + 1] = 4 + Math.random() * 6; v[i * 3 + 2] = Math.sin(a) * sp;
      c.setHex(colors[i % colors.length]);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: 0.28, vertexColors: true, transparent: true, opacity: 1, depthWrite: false });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    this.bursts.push({ points, vel: v, life: 2.2 });
  }

  openChest() { this.chestOpen = 1; }

  update(dt: number, scene: THREE.Scene) {
    if (this.lid && this.chestOpen > 0) {
      this.lid.rotation.x = THREE.MathUtils.lerp(this.lid.rotation.x, -1.9, 1 - Math.exp(-3 * dt));
      if (this.gem) {
        this.gem.position.y = 1.2 + Math.sin(performance.now() * 0.004) * 0.15;
        (this.gem.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2 + Math.sin(performance.now() * 0.006) * 0.5;
      }
    }
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.life -= dt;
      const pos = b.points.geometry.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        b.vel[j * 3 + 1] -= 9 * dt;
        pos.setXYZ(j,
          pos.getX(j) + b.vel[j * 3] * dt,
          Math.max(pos.getY(j) + b.vel[j * 3 + 1] * dt, 0.2),
          pos.getZ(j) + b.vel[j * 3 + 2] * dt);
      }
      pos.needsUpdate = true;
      (b.points.material as THREE.PointsMaterial).opacity = clamp(b.life / 1.2, 0, 1);
      if (b.life <= 0) {
        scene.remove(b.points);
        b.points.geometry.dispose();
        (b.points.material as THREE.Material).dispose();
        this.bursts.splice(i, 1);
      }
    }
  }
}

// ---------------- SaveManager ----------------
export interface SaveData { coins: number; stars: number; completions: number; bestTimeMs: number | null; }
export class SaveManager {
  private key = "super-montaser-save-v1";
  load(): SaveData {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) return JSON.parse(raw) as SaveData;
    } catch { /* ignore */ }
    return { coins: 0, stars: 0, completions: 0, bestTimeMs: null };
  }
  save(d: SaveData) { try { localStorage.setItem(this.key, JSON.stringify(d)); } catch { /* ignore */ } }
}

// ---------------- MobilePerformanceManager ----------------
export interface PerfStats { fps: number; frameMs: number; quality: number; pixelRatio: number; }
export class MobilePerformanceManager {
  private frames = 0; private acc = 0; private fps = 60; private frameMs = 16;
  quality = 1; // 1 high, 0.5 medium, 0 low
  private lowStreak = 0; private highStreak = 0;
  private onChange: (q: number) => void;

  constructor(onChange: (q: number) => void) { this.onChange = onChange; }

  update(dt: number): PerfStats {
    this.frames++; this.acc += dt;
    if (this.acc >= 0.5) {
      this.fps = this.frames / this.acc;
      this.frameMs = (this.acc / this.frames) * 1000;
      this.frames = 0; this.acc = 0;
      if (this.fps < 42 && this.quality > 0) {
        if (++this.lowStreak >= 2) { this.quality = this.quality === 1 ? 0.5 : 0; this.lowStreak = 0; this.onChange(this.quality); }
      } else if (this.fps > 58 && this.quality < 1) {
        if (++this.highStreak >= 6) { this.quality = this.quality === 0 ? 0.5 : 1; this.highStreak = 0; this.onChange(this.quality); }
      } else { this.lowStreak = 0; this.highStreak = 0; }
    }
    return { fps: Math.round(this.fps), frameMs: Math.round(this.frameMs * 10) / 10, quality: this.quality, pixelRatio: 0 };
  }

  applyToRenderer(renderer: THREE.WebGLRenderer) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pr = this.quality === 1 ? dpr : this.quality === 0.5 ? Math.min(dpr, 1.25) : 1;
    renderer.setPixelRatio(pr);
  }
}

// ---------------- CollisionSystem ----------------
export class CollisionSystem {
  static resolve(pos: THREE.Vector3, colliders: Collider[], radius = 0.55) {
    for (const c of colliders) {
      const dx = pos.x - c.x, dz = pos.z - c.z;
      const d = Math.hypot(dx, dz);
      const min = c.r + radius;
      if (d > 0.001 && d < min) {
        pos.x = c.x + (dx / d) * min;
        pos.z = c.z + (dz / d) * min;
      }
    }
    pos.x = clamp(pos.x, -66, 66);
    pos.z = clamp(pos.z, -66, 66);
  }
}
