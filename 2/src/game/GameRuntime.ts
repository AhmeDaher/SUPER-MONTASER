import * as THREE from "three";
import { WorldGenerator } from "./world";
import { CharacterController } from "./character";
import { ProceduralAnimalFactory, AnimalBehaviorSystem, type AnimalKind } from "./animals";
import {
  AudioManager, MissionSystem, InteractionSystem, CollectibleSystem, RewardManager,
  SaveManager, MobilePerformanceManager, LEARNING, type LearningCard, type PerfStats,
} from "./systems";
import { getTerrainHeight, clamp, damp, CHEST_POS, WATERFALL } from "./utils";

export interface HudState {
  coins: number; stars: number; step: string; progress: number;
  discovered: number; interactLabel: string | null;
  card: LearningCard | null; cardKey: number;
  completed: boolean; started: boolean; elephantFound: boolean;
  stats: PerfStats; hint: string | null;
}

export interface GameCallbacks { onHud: (h: HudState) => void; }

// SceneManager + CameraController + InputManager + GameRuntime in one orchestrator.
export class GameRuntime {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private world = new WorldGenerator();
  private player = new CharacterController();
  private animals = new AnimalBehaviorSystem();
  private audio = new AudioManager();
  private mission = new MissionSystem();
  private interaction = new InteractionSystem();
  private collectibles = new CollectibleSystem();
  private rewards = new RewardManager();
  private save = new SaveManager();
  private perf: MobilePerformanceManager;
  private cb: GameCallbacks;
  private raf = 0;
  private disposed = false;
  private elapsed = 0;

  // camera
  private camYaw = 0; private camPitch = 0.34; private camDist = 9.5;
  private camTarget = new THREE.Vector3();
  // input
  private keys = new Set<string>();
  private joyX = 0; private joyZ = 0;
  private runToggle = false;
  private jumpQueued = false; private interactQueued = false;
  // mission state
  private discoveredShown = new Set<AnimalKind>();
  private card: LearningCard | null = null; private cardKey = 0;
  private interactLabel: string | null = null;
  private hint: string | null = null;
  private hintTimer = 0;
  private started = false; private completed = false;
  private rewardTimer = -1;
  private lastHud = "";
  private saveData = this.save.load();

  constructor(canvas: HTMLCanvasElement, cb: GameCallbacks) {
    this.cb = cb;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 500);
    this.perf = new MobilePerformanceManager((q) => this.applyQuality(q));

    this.world.build(this.scene, 1);
    this.scene.add(this.world.group);
    this.player.setColliders(this.world.colliders);
    this.scene.add(this.player.rig.root);

    const factory = new ProceduralAnimalFactory();
    const placements: [AnimalKind, number, number][] = [
      ["lion", -26, 12],
      ["giraffe", 30, -14],
      ["monkey", -16, -26],
      ["elephant", WATERFALL.x + 7, -36],
    ];
    for (const [kind, x, z] of placements) {
      const rig = factory.create(kind);
      this.animals.add(rig, x, z);
      this.scene.add(rig.root);
    }
    this.rewards.bindChest(this.world.chestLid, this.world.chestGroup);

    this.applyQuality(1);
    this.bindInput();
    this.resize();
    this.loop();
  }

  // ---------- public API (called from React UI) ----------
  startMission() {
    this.started = true;
    this.mission.start();
    this.audio.speak("Find the Elephant! Use the joystick to explore the jungle!");
    this.pushHud(true);
  }
  reset() {
    this.player.reset();
    this.collectibles.reset(this.world.collectibles);
    this.mission = new MissionSystem();
    this.discoveredShown.clear();
    this.card = null; this.completed = false; this.started = false; this.rewardTimer = -1;
    this.rewards.chestOpen = 0;
    this.world.chestLid.rotation.x = 0;
    this.camYaw = 0; this.camPitch = 0.34;
    this.pushHud(true);
  }
  setJoystick(x: number, z: number) { this.joyX = x; this.joyZ = z; }
  pressJump() { this.jumpQueued = true; }
  pressInteract() { this.interactQueued = true; }
  setRun(v: boolean) { this.runToggle = v; }
  orbit(dx: number, dy: number) {
    this.camYaw -= dx * 0.005;
    this.camPitch = clamp(this.camPitch + dy * 0.004, 0.06, 1.15);
  }
  zoom(d: number) { this.camDist = clamp(this.camDist + d, 5, 15); }
  speak(text: string) { this.audio.speak(text); }
  toggleMute() { this.audio.enabled = !this.audio.enabled; return this.audio.enabled; }
  getSave() { return this.saveData; }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.renderer.dispose();
  }

  // ---------- input ----------
  private onResize = () => this.resize();
  private onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    this.keys.add(e.code);
    if (e.code === "Space") { this.jumpQueued = true; e.preventDefault(); }
    if (e.code === "KeyE" || e.code === "Enter") this.interactQueued = true;
  };
  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);
  private bindInput() {
    window.addEventListener("resize", this.onResize);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }
  private resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private applyQuality(q: number) {
    this.perf.applyToRenderer(this.renderer);
    this.renderer.shadowMap.enabled = true; // keep pipeline stable; toggle the light instead
    this.world.applyShadowQuality(q);
    const sun = this.scene.getObjectByName("sun") as THREE.DirectionalLight | undefined;
    if (sun) {
      sun.castShadow = q > 0;
      const size = q === 1 ? 2048 : q === 0.5 ? 1024 : 512;
      if (sun.shadow.mapSize.x !== size) {
        sun.shadow.mapSize.set(size, size);
        if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
      }
    }
  }

  // ---------- main loop ----------
  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed += dt;
    const t = this.elapsed;

    this.update(dt, t);
    this.renderer.render(this.scene, this.camera);
  };

  private update(dt: number, t: number) {
    // input vector
    let ix = this.joyX, iz = this.joyZ;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) ix -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) ix += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) iz -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) iz += 1;
    const mag = Math.hypot(ix, iz);
    if (mag > 1) { ix /= mag; iz /= mag; }
    const run = this.runToggle || this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") || mag > 0.92;

    const wasGrounded = this.player.grounded;
    const prevVy = this.player.vy;
    this.player.update(dt, { x: ix, z: iz, run, jump: this.jumpQueued }, this.camYaw);
    this.jumpQueued = false;
    if (!wasGrounded && this.player.grounded && prevVy < -3) this.audio.land();
    if (this.player.state === "jump" && this.player.vy > 7) this.audio.jump();

    // world + animals
    this.world.update(dt, t);
    this.animals.update(dt, t, this.player.pos);
    this.rewards.update(dt, this.scene);

    // collectible spin/bob
    for (const c of this.world.collectibles) {
      if (c.taken) continue;
      c.mesh.rotation.y += dt * 2.4;
      c.mesh.position.y = c.y + Math.sin(t * 2.5 + c.x) * 0.15;
    }
    this.collectibles.check(this.player.pos, this.world.collectibles, (kind) => {
      if (kind === "coin") this.audio.coin(); else this.audio.star();
      this.pushHud(true);
    });

    // discovery (proximity learning)
    if (this.started && !this.completed) {
      for (const a of this.animals.animals) {
        const d = Math.hypot(a.rig.root.position.x - this.player.pos.x, a.rig.root.position.z - this.player.pos.z);
        if (d < 6 && !this.discoveredShown.has(a.rig.kind)) {
          this.discoveredShown.add(a.rig.kind);
          this.mission.onAnimalDiscovered(a.rig.kind);
          this.showCard(LEARNING[a.rig.kind]);
          this.audio.discover();
          if (a.rig.kind === "lion") this.audio.roar();
          if (a.rig.kind === "elephant") {
            this.audio.speak("You found the Elephant! Walk up to it and press Interact!");
            this.hint = "You found the Elephant! Walk up and press Interact.";
            this.hintTimer = 5;
          } else {
            this.audio.speak(`This is a ${LEARNING[a.rig.kind].word}! ${LEARNING[a.rig.kind].fact} But we are looking for the Elephant!`);
          }
          this.pushHud(true);
        }
      }
    }

    // interaction targets
    const targets: { type: "elephant" | "chest" | "animal"; label: string; kind?: AnimalKind; pos: THREE.Vector3 }[] =
      this.animals.animals.map((a) => ({
        type: a.rig.kind === "elephant" ? ("elephant" as const) : ("animal" as const),
        label: a.rig.kind === "elephant" ? "Say Hello to the Elephant" : `Say Hello to the ${a.rig.name}`,
        kind: a.rig.kind, pos: a.rig.root.position,
      }));
    targets.push({ type: "chest", label: "Open the Treasure Chest", pos: new THREE.Vector3(CHEST_POS.x, 0, CHEST_POS.z) });
    const near = this.interaction.findNearest(this.player.pos, targets);
    this.interactLabel = near ? near.label : null;

    if (this.interactQueued) {
      this.interactQueued = false;
      if (near) this.doInteract(near.type, near.kind);
    }

    // reward sequence timing
    if (this.rewardTimer > 0) {
      this.rewardTimer -= dt;
      if (this.rewardTimer <= 0) {
        this.mission.onRewardDone();
        this.completed = true;
        this.saveData.completions++;
        const timeMs = performance.now() - this.mission.startTime;
        if (!this.saveData.bestTimeMs || timeMs < this.saveData.bestTimeMs) this.saveData.bestTimeMs = Math.round(timeMs);
        this.saveData.coins = Math.max(this.saveData.coins, this.collectibles.coins);
        this.saveData.stars = Math.max(this.saveData.stars, this.collectibles.stars);
        this.save.save(this.saveData);
        this.audio.speak("Hooray! You found the Elephant! Mission complete! Great job!");
        this.pushHud(true);
      }
    }

    if (this.hintTimer > 0) { this.hintTimer -= dt; if (this.hintTimer <= 0) this.hint = null; }

    // camera follow
    this.updateCamera(dt);

    // perf + HUD
    const stats = this.perf.update(dt);
    this.pushHud(false, stats);
  }

  private doInteract(type: "elephant" | "chest" | "animal", kind?: AnimalKind) {
    this.player.interactAnim();
    if (type === "elephant") {
      this.animals.triggerReaction("elephant");
      this.mission.onElephantInteract();
      this.audio.trumpet();
      this.showCard(LEARNING.elephant);
      this.audio.speak("ELEPHANT! El-uh-funt! The elephant says toot toot! You did it!");
      this.rewards.burst(this.scene, this.player.pos.clone().add(new THREE.Vector3(0, 2, 0)), [0xffd93d, 0xff6b9d, 0x6bcbff, 0x95e06c], 90);
      // open chest + celebrate shortly after
      setTimeout(() => {
        if (this.disposed) return;
        this.rewards.openChest();
        this.audio.chest();
        this.rewards.burst(this.scene, new THREE.Vector3(CHEST_POS.x, getTerrainHeight(CHEST_POS.x, CHEST_POS.z) + 2, CHEST_POS.z), [0xffd93d, 0xfff3b0, 0xff8c42], 140);
        this.player.celebrate();
        this.audio.celebrate();
        this.audio.speak("The treasure chest opened! You earned a reward! Great exploring!");
        this.rewardTimer = 3.2;
        this.pushHud(true);
      }, 1400);
    } else if (type === "chest") {
      if (!this.mission.elephantFound) {
        this.audio.speak("This chest is locked! Find the Elephant first!");
        this.hint = "Find the Elephant first, then come back to the chest!";
        this.hintTimer = 4;
      } else if (this.rewards.chestOpen === 0) {
        this.rewards.openChest();
        this.audio.chest();
        this.rewards.burst(this.scene, new THREE.Vector3(CHEST_POS.x, getTerrainHeight(CHEST_POS.x, CHEST_POS.z) + 2, CHEST_POS.z), [0xffd93d, 0xfff3b0], 120);
        this.player.celebrate();
        this.audio.celebrate();
        if (this.mission.step === "found") this.rewardTimer = 3.2;
      }
    } else if (kind) {
      this.animals.triggerReaction(kind);
      if (kind === "lion") this.audio.roar();
      else if (kind === "monkey") this.audio.discover();
      else this.audio.trumpet();
      this.showCard(LEARNING[kind]);
      this.audio.speak(`${LEARNING[kind].word}! ${LEARNING[kind].fact}`);
    }
    this.pushHud(true);
  }

  private showCard(card: LearningCard) {
    this.card = card; this.cardKey++;
  }

  private updateCamera(dt: number) {
    const p = this.player.pos;
    const target = new THREE.Vector3(p.x, p.y + 1.7, p.z);
    this.camTarget.x = damp(this.camTarget.x, target.x, 8, dt);
    this.camTarget.y = damp(this.camTarget.y, target.y, 8, dt);
    this.camTarget.z = damp(this.camTarget.z, target.z, 8, dt);
    const cp = Math.cos(this.camPitch), sp = Math.sin(this.camPitch);
    const desired = new THREE.Vector3(
      this.camTarget.x + Math.sin(this.camYaw) * cp * this.camDist,
      this.camTarget.y + sp * this.camDist,
      this.camTarget.z + Math.cos(this.camYaw) * cp * this.camDist
    );
    // terrain collision: keep camera above ground
    const groundY = getTerrainHeight(desired.x, desired.z) + 0.7;
    if (desired.y < groundY) desired.y = groundY;
    this.camera.position.x = damp(this.camera.position.x, desired.x, 10, dt);
    this.camera.position.y = damp(this.camera.position.y, desired.y, 10, dt);
    this.camera.position.z = damp(this.camera.position.z, desired.z, 10, dt);
    this.camera.lookAt(this.camTarget);
  }

  private pushHud(force: boolean, stats?: PerfStats) {
    const s = stats ?? { fps: 0, frameMs: 0, quality: this.perf.quality, pixelRatio: 0 };
    const h: HudState = {
      coins: this.collectibles.coins, stars: this.collectibles.stars,
      step: this.mission.step, progress: this.mission.progress(),
      discovered: this.mission.discovered.size,
      interactLabel: this.interactLabel, card: this.card, cardKey: this.cardKey,
      completed: this.completed, started: this.started,
      elephantFound: this.mission.elephantFound, stats: s, hint: this.hint,
    };
    const key = JSON.stringify([h.coins, h.stars, h.step, h.progress, h.discovered, h.interactLabel, h.cardKey, h.completed, h.started, h.elephantFound, h.hint, s.fps, s.quality]);
    if (force || key !== this.lastHud) { this.lastHud = key; this.cb.onHud(h); }
  }
}
