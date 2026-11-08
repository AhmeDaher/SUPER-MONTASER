import * as THREE from 'three';
import { AudioManager } from '../audio/AudioManager';
import { CollisionSystem } from '../collision/CollisionSystem';
import { CharacterActionState } from '../types';
import { RiggedCharacter } from './ProceduralCharacterFactory';

export interface MovementInput {
  moveX: number; // -1 to 1 (left/right)
  moveZ: number; // -1 to 1 (forward/backward)
  jump: boolean;
  sprint: boolean;
  interact: boolean;
}

export class CharacterController {
  public character: RiggedCharacter;
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public rotation: number = 0;
  public state: CharacterActionState = 'idle';

  private velocityY: number = 0;
  private isGrounded: boolean = true;
  private gravity: number = -24.0;
  private jumpForce: number = 8.5;
  private walkSpeed: number = 4.8;
  private runSpeed: number = 8.2;

  // Animation cycle accumulator
  private animTimer: number = 0;
  private celebrateTimer: number = 0;
  private interactTimer: number = 0;
  private lastFootstepPhase: number = 0;

  private collisionSystem: CollisionSystem;
  private audioManager: AudioManager;

  constructor(
    character: RiggedCharacter,
    collisionSystem: CollisionSystem,
    audioManager: AudioManager,
    initialPosition: THREE.Vector3 = new THREE.Vector3(-5, 0, 25)
  ) {
    this.character = character;
    this.collisionSystem = collisionSystem;
    this.audioManager = audioManager;
    this.position.copy(initialPosition);
    this.character.rootGroup.position.copy(this.position);
  }

  public triggerCelebration() {
    this.state = 'celebrate';
    this.celebrateTimer = 2.4;
  }

  public triggerInteract() {
    this.state = 'interact';
    this.interactTimer = 0.8;
  }

  public update(dt: number, input: MovementInput, cameraYaw: number) {
    // 1. Process Celebrate / Interact locks
    if (this.celebrateTimer > 0) {
      this.celebrateTimer -= dt;
      this.state = 'celebrate';
      this.animateCelebrate(dt);
      return;
    }
    if (this.interactTimer > 0) {
      this.interactTimer -= dt;
      this.state = 'interact';
      this.animateInteract();
      return;
    }

    // 2. Handle Movement Direction relative to Camera View
    let inputLen = Math.hypot(input.moveX, input.moveZ);
    let isMoving = inputLen > 0.08;

    let moveDirX = 0;
    let moveDirZ = 0;

    if (isMoving) {
      // Normalize input
      const normX = input.moveX / inputLen;
      const normZ = input.moveZ / inputLen;

      // Rotate by camera yaw
      moveDirX = normX * Math.cos(cameraYaw) + normZ * Math.sin(cameraYaw);
      moveDirZ = -normX * Math.sin(cameraYaw) + normZ * Math.cos(cameraYaw);

      // Desired character facing angle
      const targetAngle = Math.atan2(moveDirX, moveDirZ);
      // Smooth angular interpolation
      let angleDiff = targetAngle - this.rotation;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.rotation += angleDiff * Math.min(1.0, dt * 14.0);
      this.character.rootGroup.rotation.y = this.rotation;
    }

    // 3. Jump and Gravity
    if (input.jump && this.isGrounded) {
      this.velocityY = this.jumpForce;
      this.isGrounded = false;
      this.state = 'jump';
      this.audioManager.playJump();
    }

    // Apply gravity
    this.velocityY += this.gravity * dt;
    this.position.y += this.velocityY * dt;

    // Ground collision height
    const groundY = this.collisionSystem.getGroundHeight(this.position.x, this.position.z);
    if (this.position.y <= groundY) {
      if (!this.isGrounded && this.velocityY < -2.0) {
        this.audioManager.playLand();
      }
      this.position.y = groundY;
      this.velocityY = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // 4. Horizontal Velocity and Collision Resolution
    if (isMoving) {
      const speed = input.sprint ? this.runSpeed : this.walkSpeed;
      const nextPos = this.position.clone();
      nextPos.x += moveDirX * speed * dt;
      nextPos.z += moveDirZ * speed * dt;

      const resolvedPos = this.collisionSystem.resolveMovement(this.position, nextPos, 0.45);
      this.position.x = resolvedPos.x;
      this.position.z = resolvedPos.z;

      // Ensure grounded elevation matches resolved terrain
      if (this.isGrounded) {
        this.position.y = this.collisionSystem.getGroundHeight(this.position.x, this.position.z);
      }
    }

    this.character.rootGroup.position.copy(this.position);

    // 5. Update State
    if (!this.isGrounded) {
      this.state = this.velocityY > 0 ? 'jump' : 'fall';
    } else if (isMoving) {
      this.state = input.sprint ? 'run' : 'walk';
    } else {
      this.state = 'idle';
    }

    // 6. Run Procedural Animations
    this.animate(dt, isMoving, input.sprint);
  }

  private animate(dt: number, isMoving: boolean, isSprinting: boolean) {
    const c = this.character;

    if (!this.isGrounded) {
      // In-air jump pose
      c.torsoGroup.rotation.x = 0.1;
      c.leftArmGroup.rotation.x = -1.2;
      c.rightArmGroup.rotation.x = -1.2;
      c.leftLegGroup.rotation.x = 0.4;
      c.rightLegGroup.rotation.x = -0.3;
      c.leftCalfGroup.rotation.x = 0.5;
      c.rightCalfGroup.rotation.x = 0.4;
      return;
    }

    if (isMoving) {
      const cycleSpeed = isSprinting ? 12.0 : 7.5;
      this.animTimer += dt * cycleSpeed;

      const stride = Math.sin(this.animTimer);
      const armStride = -stride;

      // Leg swings
      c.leftLegGroup.rotation.x = stride * (isSprinting ? 0.75 : 0.5);
      c.rightLegGroup.rotation.x = -stride * (isSprinting ? 0.75 : 0.5);

      // Knee bend when stepping back
      c.leftCalfGroup.rotation.x = Math.max(0, -stride * 0.7);
      c.rightCalfGroup.rotation.x = Math.max(0, stride * 0.7);

      // Arm swings opposite to legs
      c.leftArmGroup.rotation.x = armStride * (isSprinting ? 0.8 : 0.45);
      c.rightArmGroup.rotation.x = -armStride * (isSprinting ? 0.8 : 0.45);

      // Slight body bob and tilt
      c.torsoGroup.position.y = 1.05 + Math.abs(Math.sin(this.animTimer)) * 0.08;
      c.torsoGroup.rotation.x = isSprinting ? 0.18 : 0.05;
      c.torsoGroup.rotation.y = Math.sin(this.animTimer) * 0.08;

      // Footstep sound trigger on stride peak
      const phase = Math.sin(this.animTimer);
      if (this.lastFootstepPhase < 0 && phase >= 0) {
        this.audioManager.playFootstep();
      }
      this.lastFootstepPhase = phase;
    } else {
      // Idle breathing and relaxed posture
      this.animTimer += dt * 2.0;
      const breath = Math.sin(this.animTimer);

      c.torsoGroup.position.y = 1.05 + breath * 0.02;
      c.torsoGroup.rotation.x = 0;
      c.torsoGroup.rotation.y = 0;

      c.leftLegGroup.rotation.x = 0;
      c.rightLegGroup.rotation.x = 0;
      c.leftCalfGroup.rotation.x = 0;
      c.rightCalfGroup.rotation.x = 0;

      c.leftArmGroup.rotation.x = breath * 0.06;
      c.rightArmGroup.rotation.x = -breath * 0.06;
      c.headGroup.rotation.y = Math.sin(this.animTimer * 0.5) * 0.12;
    }
  }

  private animateCelebrate(dt: number) {
    const c = this.character;
    this.animTimer += dt * 8.0;

    // Victory jump and spin
    c.torsoGroup.position.y = 1.25 + Math.abs(Math.sin(this.animTimer)) * 0.35;
    // Both arms raised high in victory!
    c.leftArmGroup.rotation.x = -2.6 + Math.sin(this.animTimer * 2) * 0.3;
    c.rightArmGroup.rotation.x = -2.6 - Math.sin(this.animTimer * 2) * 0.3;
    c.leftArmGroup.rotation.z = 0.5;
    c.rightArmGroup.rotation.z = -0.5;

    c.headGroup.rotation.x = -0.3; // Looking up proudly
    this.rotation += dt * 3.5;
    this.character.rootGroup.rotation.y = this.rotation;
  }

  private animateInteract() {
    const c = this.character;
    // Reach right arm forward
    c.rightArmGroup.rotation.x = -1.2;
    c.rightForearmGroup.rotation.x = -0.4;
    c.torsoGroup.rotation.x = 0.12;
  }
}
