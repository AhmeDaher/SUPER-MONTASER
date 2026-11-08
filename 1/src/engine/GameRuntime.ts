import * as THREE from 'three';
import { AnimalBehaviorSystem } from './animals/AnimalBehaviorSystem';
import { AudioManager } from './audio/AudioManager';
import { CameraController } from './camera/CameraController';
import { CharacterController, MovementInput } from './character/CharacterController';
import { ProceduralCharacterFactory } from './character/ProceduralCharacterFactory';
import { CollisionSystem } from './collision/CollisionSystem';
import { CollectibleSystem } from './gameplay/CollectibleSystem';
import { InteractionSystem } from './gameplay/InteractionSystem';
import { MissionSystem } from './gameplay/MissionSystem';
import { RewardManager } from './gameplay/SaveManager';
import { LearningEngine } from './learning/LearningEngine';
import { MobilePerformanceManager } from './performance/MobilePerformanceManager';
import { SceneManager } from './scene/SceneManager';
import { AnimalData, InteractionTarget, PerformanceStats, PerformanceTier } from './types';
import { WorldGenerator } from './world/WorldGenerator';

export interface GameRuntimeCallbacks {
  onInteractionTargetChange: (target: InteractionTarget | null) => void;
  onEducationalDialog: (content: {
    animal: AnimalData;
    isTarget: boolean;
    speechText: string;
    missionCompleted: boolean;
  }) => void;
  onMissionCompleted: (missionTitle: string, rewardCoins: number, rewardStars: number, badge?: string) => void;
  onStatsUpdate: (stats: { coins: number; stars: number }) => void;
  onPerformanceUpdate: (perf: PerformanceStats) => void;
}

export class GameRuntime {
  public renderer: THREE.WebGLRenderer;
  public camera: THREE.PerspectiveCamera;
  public sceneManager: SceneManager;
  public collisionSystem: CollisionSystem;
  public audioManager: AudioManager;
  public learningEngine: LearningEngine;
  public rewardManager: RewardManager;
  public performanceManager: MobilePerformanceManager;

  public worldGenerator: WorldGenerator;
  public characterController: CharacterController;
  public cameraController: CameraController;
  public animalBehaviorSystem: AnimalBehaviorSystem;
  public collectibleSystem: CollectibleSystem;
  public interactionSystem: InteractionSystem;
  public missionSystem: MissionSystem;

  private isRunning: boolean = false;
  private animFrameId: number | null = null;
  private clock: THREE.Clock;
  private canvas: HTMLCanvasElement;
  private callbacks: GameRuntimeCallbacks;

  // Input states
  private keys: Record<string, boolean> = {};
  private touchMoveX: number = 0;
  private touchMoveZ: number = 0;
  private touchJump: boolean = false;
  private touchSprint: boolean = false;

  private isDraggingMouse: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameRuntimeCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // 1. WebGL2 Baseline Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // 2. Performance Manager
    this.performanceManager = new MobilePerformanceManager();
    this.performanceManager.attachRenderer(this.renderer);

    // 3. Scene & Camera
    this.sceneManager = new SceneManager();
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.2, 180);

    // 4. Core Systems
    this.collisionSystem = new CollisionSystem();
    this.audioManager = new AudioManager();
    this.learningEngine = new LearningEngine();
    this.rewardManager = new RewardManager();

    // 5. World Generation
    this.worldGenerator = new WorldGenerator(this.collisionSystem);
    const worldData = this.worldGenerator.generateWorld(this.performanceManager.getFurShellsCount());
    this.sceneManager.scene.add(this.worldGenerator.sceneGroup);

    // 6. Character
    const charFactory = new ProceduralCharacterFactory();
    const characterRig = charFactory.createMrMontaser();
    this.sceneManager.scene.add(characterRig.rootGroup);

    this.characterController = new CharacterController(
      characterRig,
      this.collisionSystem,
      this.audioManager,
      new THREE.Vector3(-5, 0.4, 25) // Initial jungle clearing spawn
    );

    // 7. Camera Controller
    this.cameraController = new CameraController(this.camera, this.collisionSystem);
    this.cameraController.setInitialPosition(this.characterController.position, this.characterController.rotation);

    // 8. Animals
    this.animalBehaviorSystem = new AnimalBehaviorSystem(this.audioManager);
    worldData.animals.forEach((a) => this.animalBehaviorSystem.registerAnimal(a));

    // 9. Collectibles
    this.collectibleSystem = new CollectibleSystem(this.audioManager);
    worldData.collectibles.forEach((c) => this.collectibleSystem.registerItem(c));

    // 10. Interactions & Chests
    this.interactionSystem = new InteractionSystem(this.audioManager);
    worldData.chests.forEach((c) => this.interactionSystem.registerChest(c));
    worldData.animals.forEach((a) => {
      this.interactionSystem.registerTarget({
        type: 'animal',
        id: a.id,
        name: a.name,
        prompt: `Examine ${a.name}`,
        distance: 999,
        position: a.position,
        data: a,
      });
    });

    // 11. Missions
    this.missionSystem = new MissionSystem(this.learningEngine, this.audioManager);

    // 12. Listeners
    this.setupListeners();
  }

  private setupListeners() {
    // Keyboard
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Mouse orbit
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });

    // Window Resize
    window.addEventListener('resize', this.handleResize);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;
    this.audioManager.ensureAudio();

    if (e.code === 'KeyE' || e.code === 'Enter') {
      this.triggerInteract();
    } else if (e.code === 'KeyM') {
      this.audioManager.toggleMute();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private handleMouseDown = (e: MouseEvent) => {
    this.audioManager.ensureAudio();
    this.isDraggingMouse = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDraggingMouse) return;
    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    this.cameraController.rotate(-dx * 0.006, dy * 0.006);
  };

  private handleMouseUp = () => {
    this.isDraggingMouse = false;
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.cameraController.zoom(e.deltaY * 0.01);
  };

  private handleResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.performanceManager.applySettings();
  };

  // Touch controls API for mobile UI
  public setTouchJoystick(x: number, z: number) {
    this.touchMoveX = x;
    this.touchMoveZ = z;
  }

  public setTouchJump(pressed: boolean) {
    this.touchJump = pressed;
  }

  public setTouchSprint(pressed: boolean) {
    this.touchSprint = pressed;
  }

  public rotateCameraByTouch(deltaX: number, deltaY: number) {
    this.cameraController.rotate(-deltaX * 0.008, deltaY * 0.008);
  }

  public triggerInteract() {
    this.characterController.triggerInteract();
    const activeTarget = this.interactionSystem.getActiveTarget();
    if (!activeTarget) return;

    if (activeTarget.type === 'chest') {
      const opened = this.interactionSystem.openChest(activeTarget.id);
      if (opened) {
        this.rewardManager.addCoins(5);
        this.rewardManager.addStars(1);
        this.callbacks.onStatsUpdate(this.rewardManager.getStats());
        this.characterController.triggerCelebration();
      }
    } else if (activeTarget.type === 'animal') {
      const animal = activeTarget.data as AnimalData;
      this.animalBehaviorSystem.triggerInteractionReaction(animal.id);

      // Educational mission discovery check
      const result = this.missionSystem.onAnimalDiscovered(animal.type);
      this.rewardManager.recordAnimalDiscovered(animal.type);

      if (result.missionCompleted) {
        this.characterController.triggerCelebration();
        this.rewardManager.addCoins(result.mission.rewardCoins);
        this.rewardManager.addStars(result.mission.rewardStars);
        this.rewardManager.recordMissionCompleted(result.mission.id, result.mission.badgeName);

        // Also unlock nearby chest if elephant
        if (animal.type === 'elephant') {
          setTimeout(() => {
            this.interactionSystem.openChest('chest_elephant');
          }, 800);
        }

        this.callbacks.onMissionCompleted(
          result.mission.title,
          result.mission.rewardCoins,
          result.mission.rewardStars,
          result.mission.badgeName
        );
      }

      this.callbacks.onEducationalDialog({
        animal,
        isTarget: result.isTarget,
        speechText: result.speechText,
        missionCompleted: result.missionCompleted,
      });

      this.callbacks.onStatsUpdate(this.rewardManager.getStats());
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();

    // Initial mission speech prompt after brief delay
    setTimeout(() => {
      this.missionSystem.speakMissionInstruction();
    }, 1200);

    this.loop();
  }

  private loop = () => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.loop);

    const dt = Math.min(this.clock.getDelta(), 0.1); // Clamp max dt
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Gather Input
    let moveX = 0;
    let moveZ = 0;

    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;

    // Combine keyboard with touch joystick
    moveX += this.touchMoveX;
    moveZ += this.touchMoveZ;

    const input: MovementInput = {
      moveX,
      moveZ,
      jump: Boolean(this.keys['Space'] || this.touchJump),
      sprint: Boolean(this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.touchSprint),
      interact: false,
    };

    // Reset touch jump trigger
    this.touchJump = false;

    // 2. Update Character
    this.characterController.update(dt, input, this.cameraController.yaw);

    // 3. Update Camera
    this.cameraController.update(dt, this.characterController.position, input.sprint);
    this.sceneManager.updateShadowFollow(this.characterController.position);

    // 4. Update World (Water, Flora, Particles)
    this.worldGenerator.update(elapsedTime, dt);

    // 5. Update Animals
    this.animalBehaviorSystem.update(dt, this.characterController.position);

    // 6. Update Collectibles
    this.collectibleSystem.update(dt, this.characterController.position, (item) => {
      if (item.type === 'coin') {
        this.rewardManager.addCoins(item.value);
      } else {
        this.rewardManager.addStars(item.value);
        // Check star collection mission
        const res = this.missionSystem.onStarCollected(this.rewardManager.getStats().stars);
        if (res.missionCompleted && res.mission) {
          this.characterController.triggerCelebration();
          this.rewardManager.recordMissionCompleted(res.mission.id, res.mission.badgeName);
          this.callbacks.onMissionCompleted(res.mission.title, res.mission.rewardCoins, res.mission.rewardStars, res.mission.badgeName);
        }
      }
      this.callbacks.onStatsUpdate(this.rewardManager.getStats());
    });

    // 7. Update Proximity Interactions
    const target = this.interactionSystem.update(dt, this.characterController.position);
    this.callbacks.onInteractionTargetChange(target);

    // 8. Render Frame
    this.renderer.render(this.sceneManager.scene, this.camera);

    // 9. Frame Time Performance update
    const perfStats = this.performanceManager.updateFrame(performance.now());
    this.callbacks.onPerformanceUpdate(perfStats);
  };

  public setGraphicsTier(tier: PerformanceTier) {
    this.performanceManager.setTier(tier);
  }

  public dispose() {
    this.isRunning = false;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('resize', this.handleResize);

    this.audioManager.dispose();
    this.renderer.dispose();
  }
}
