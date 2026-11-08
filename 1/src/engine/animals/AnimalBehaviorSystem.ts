import * as THREE from 'three';
import { AudioManager } from '../audio/AudioManager';
import { AnimalData } from '../types';

export class AnimalBehaviorSystem {
  private animals: AnimalData[] = [];
  private audioManager: AudioManager;
  private animTimer: number = 0;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
  }

  public registerAnimal(animal: AnimalData) {
    this.animals.push(animal);
  }

  public getAnimals(): AnimalData[] {
    return this.animals;
  }

  public triggerInteractionReaction(animalId: string) {
    const animal = this.animals.find((a) => a.id === animalId);
    if (!animal) return;

    animal.state = 'reacting';
    animal.reactionTimer = 3.2;

    // Play appropriate sound
    if (animal.type === 'elephant') {
      this.audioManager.playElephantTrumpet();
    } else if (animal.type === 'lion') {
      this.audioManager.playLionRoar();
    } else if (animal.type === 'monkey') {
      this.audioManager.playMonkeyChatter();
    } else if (animal.type === 'giraffe') {
      this.audioManager.playGiraffeChime();
    }
  }

  public update(dt: number, playerPos: THREE.Vector3) {
    this.animTimer += dt;

    for (let i = 0; i < this.animals.length; i++) {
      const a = this.animals[i];
      const distToPlayer = a.position.distanceTo(playerPos);

      // Handle reacting state timer
      if (a.reactionTimer > 0) {
        a.reactionTimer -= dt;
        if (a.reactionTimer <= 0) {
          a.state = 'idle';
        }
      }

      // 1. Head tracking towards player when within 14 units
      if (a.headBone) {
        if (distToPlayer < 14) {
          // Calculate angle to player relative to animal's own orientation
          const dx = playerPos.x - a.position.x;
          const dz = playerPos.z - a.position.z;
          const worldAngleToPlayer = Math.atan2(dx, dz);
          let localAngle = worldAngleToPlayer - a.rotation;

          while (localAngle > Math.PI) localAngle -= Math.PI * 2;
          while (localAngle < -Math.PI) localAngle += Math.PI * 2;

          // Clamp head turn angle to natural range (-60 to +60 degrees)
          const clampedYaw = Math.max(-1.1, Math.min(1.1, localAngle));
          a.headBone.rotation.y += (clampedYaw - a.headBone.rotation.y) * Math.min(1.0, dt * 4.0);

          // Slight pitch to look at player height
          const dy = playerPos.y - a.position.y;
          const targetPitch = Math.max(-0.4, Math.min(0.3, dy * 0.15));
          a.headBone.rotation.x += (targetPitch - a.headBone.rotation.x) * Math.min(1.0, dt * 4.0);
        } else {
          // Relax head back to forward
          a.headBone.rotation.y += (0 - a.headBone.rotation.y) * Math.min(1.0, dt * 2.0);
          a.headBone.rotation.x += (0 - a.headBone.rotation.x) * Math.min(1.0, dt * 2.0);
        }
      }

      // 2. Specialized Animal Animations
      switch (a.type) {
        case 'elephant':
          this.animateElephant(a, dt, distToPlayer);
          break;
        case 'lion':
          this.animateLion(a, dt, distToPlayer);
          break;
        case 'giraffe':
          this.animateGiraffe(a, dt, distToPlayer);
          break;
        case 'monkey':
          this.animateMonkey(a, dt, distToPlayer);
          break;
      }
    }
  }

  // --- Elephant Animations ---
  private animateElephant(a: AnimalData, _dt: number, distToPlayer: number) {
    const isReacting = a.state === 'reacting';

    // Ears Flapping
    if (a.earsBones && a.earsBones.length >= 2) {
      const earSpeed = isReacting ? 12.0 : distToPlayer < 8 ? 4.5 : 2.0;
      const earFlap = Math.sin(this.animTimer * earSpeed) * (isReacting ? 0.45 : 0.22);
      a.earsBones[0].rotation.y = earFlap;
      a.earsBones[1].rotation.y = -earFlap;
    }

    // Trunk Raising / Trumpeting or gentle swaying
    if (a.trunkBones && a.trunkBones.length >= 3) {
      if (isReacting) {
        // High triumphant trumpet curl!
        const trumpetCurl = -0.8 + Math.sin(this.animTimer * 10) * 0.25;
        a.trunkBones[0].rotation.x = -0.9;
        a.trunkBones[1].rotation.x = trumpetCurl;
        a.trunkBones[2].rotation.x = trumpetCurl * 0.9;
      } else {
        // Gentle relaxed trunk swing
        const swing = Math.sin(this.animTimer * 2.2) * 0.15;
        a.trunkBones[0].rotation.x = 0.2 + swing;
        a.trunkBones[1].rotation.x = -0.15 + swing * 0.5;
        a.trunkBones[2].rotation.x = -0.25 + swing * 0.3;
      }
    }

    // Tail swish
    if (a.tailBone) {
      a.tailBone.rotation.z = Math.sin(this.animTimer * 2.8) * 0.25;
    }
  }

  // --- Lion Animations ---
  private animateLion(a: AnimalData, _dt: number, _distToPlayer: number) {
    const isReacting = a.state === 'reacting';

    // Tail swishing
    if (a.tailBone) {
      const tailSpeed = isReacting ? 8.0 : 3.0;
      a.tailBone.rotation.y = Math.sin(this.animTimer * tailSpeed) * 0.45;
    }

    // Breathing / Reacting paw movement
    if (a.legsBones && a.legsBones.length >= 2 && isReacting) {
      a.legsBones[0].rotation.x = Math.sin(this.animTimer * 6.0) * 0.3;
    }
  }

  // --- Giraffe Animations ---
  private animateGiraffe(a: AnimalData, _dt: number, distToPlayer: number) {
    const isReacting = a.state === 'reacting';

    // Gentle neck bending down to greet player when reacting or close
    if (a.neckBones && a.neckBones.length >= 1) {
      const targetBend = isReacting ? 0.35 : distToPlayer < 7 ? 0.18 : 0;
      a.neckBones[0].rotation.x += (targetBend - a.neckBones[0].rotation.x) * 0.05;
    }

    // Tail swish
    if (a.tailBone) {
      a.tailBone.rotation.z = Math.sin(this.animTimer * 2.5) * 0.2;
    }
  }

  // --- Monkey Animations ---
  private animateMonkey(a: AnimalData, _dt: number, _distToPlayer: number) {
    const isReacting = a.state === 'reacting';

    // Bobbing / hopping on rock
    if (isReacting) {
      a.meshGroup.position.y = a.position.y + Math.abs(Math.sin(this.animTimer * 10)) * 0.35;
    } else {
      a.meshGroup.position.y = a.position.y + Math.sin(this.animTimer * 2.5) * 0.04;
    }

    // Curled tail swish
    if (a.tailBone) {
      a.tailBone.rotation.z = Math.sin(this.animTimer * 4.0) * 0.3;
    }
  }
}
