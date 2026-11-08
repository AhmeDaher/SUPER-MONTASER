import * as THREE from 'three';

export type PerformanceTier = 'low' | 'medium' | 'high' | 'ultra';

export type CharacterActionState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'fall'
  | 'land'
  | 'celebrate'
  | 'interact';

export type AnimalType = 'lion' | 'giraffe' | 'monkey' | 'elephant';

export type AnimalActionState =
  | 'idle'
  | 'wander'
  | 'lookAtPlayer'
  | 'reacting'
  | 'celebrating';

export interface AnimalData {
  id: string;
  type: AnimalType;
  name: string;
  title: string;
  position: THREE.Vector3;
  rotation: number;
  meshGroup: THREE.Group;
  headBone?: THREE.Group;
  tailBone?: THREE.Group;
  trunkBones?: THREE.Group[];
  earsBones?: THREE.Group[];
  legsBones?: THREE.Group[];
  neckBones?: THREE.Group[];
  state: AnimalActionState;
  targetLookPos: THREE.Vector3;
  wanderTimer: number;
  reactionTimer: number;
  spelling: string[];
  phonics: string;
  funFact: string;
  description: string;
  soundName: string;
}

export interface CollectibleItem {
  id: string;
  type: 'coin' | 'star';
  position: THREE.Vector3;
  mesh: THREE.Group;
  collected: boolean;
  value: number;
  rotationSpeed: number;
  bobOffset: number;
}

export interface TreasureChest {
  id: string;
  position: THREE.Vector3;
  rotation: number;
  meshGroup: THREE.Group;
  lidMesh: THREE.Group;
  isOpen: boolean;
  openProgress: number; // 0 to 1
  containsStar: boolean;
  coinCount: number;
}

export interface Mission {
  id: string;
  title: string;
  instruction: string;
  targetAnimal: AnimalType | null;
  targetType: 'animal' | 'collect_stars' | 'chest' | 'explore_cave';
  targetCount: number;
  currentCount: number;
  completed: boolean;
  rewardCoins: number;
  rewardStars: number;
  badgeName?: string;
  educationalPrompt: string;
}

export interface PlayerStats {
  coins: number;
  stars: number;
  discoveredAnimals: AnimalType[];
  completedMissions: string[];
  unlockedBadges: string[];
}

export interface PerformanceStats {
  fps: number;
  drawCalls: number;
  triangles: number;
  resolutionScale: number;
  tier: PerformanceTier;
  furShellsCount: number;
  grassInstances: number;
}

export interface InteractionTarget {
  type: 'animal' | 'chest' | 'cave' | 'bridge';
  id: string;
  name: string;
  prompt: string;
  distance: number;
  position: THREE.Vector3;
  data?: any;
}
