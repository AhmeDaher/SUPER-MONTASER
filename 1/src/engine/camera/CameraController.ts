import * as THREE from 'three';
import { CollisionSystem } from '../collision/CollisionSystem';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  public targetPos: THREE.Vector3 = new THREE.Vector3();
  public currentPos: THREE.Vector3 = new THREE.Vector3();
  public currentLookAt: THREE.Vector3 = new THREE.Vector3();

  public yaw: number = 0;
  public pitch: number = 0.35; // Slight downward look angle
  public distance: number = 6.2;
  public minDistance: number = 2.8;
  public maxDistance: number = 14.0;

  private collisionSystem: CollisionSystem;
  private defaultFov: number = 55;
  private sprintFov: number = 62;

  constructor(camera: THREE.PerspectiveCamera, collisionSystem: CollisionSystem) {
    this.camera = camera;
    this.collisionSystem = collisionSystem;
    this.camera.fov = this.defaultFov;
    this.camera.updateProjectionMatrix();
  }

  public setInitialPosition(charPos: THREE.Vector3, charYaw: number) {
    this.targetPos.copy(charPos);
    this.yaw = charYaw + Math.PI; // Look from behind character
    this.updateImmediate();
  }

  public rotate(deltaYaw: number, deltaPitch: number) {
    this.yaw += deltaYaw;
    this.pitch = Math.max(-0.15, Math.min(1.1, this.pitch + deltaPitch));
  }

  public zoom(delta: number) {
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance + delta));
  }

  public updateImmediate() {
    const lookTarget = this.targetPos.clone();
    lookTarget.y += 1.4; // Look at character chest/head height

    const offsetX = Math.sin(this.yaw) * Math.cos(this.pitch) * this.distance;
    const offsetY = Math.sin(this.pitch) * this.distance;
    const offsetZ = Math.cos(this.yaw) * Math.cos(this.pitch) * this.distance;

    this.currentPos.set(
      lookTarget.x + offsetX,
      lookTarget.y + offsetY,
      lookTarget.z + offsetZ
    );

    this.currentLookAt.copy(lookTarget);
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
  }

  public update(dt: number, charPos: THREE.Vector3, isSprinting: boolean = false) {
    // 1. Target Look Position (Character chest height)
    const targetLook = charPos.clone();
    targetLook.y += 1.4;

    // Smoothly interpolate look target
    this.currentLookAt.lerp(targetLook, Math.min(1.0, dt * 10.0));

    // 2. Ideal Camera Position
    const offsetX = Math.sin(this.yaw) * Math.cos(this.pitch) * this.distance;
    const offsetY = Math.sin(this.pitch) * this.distance;
    const offsetZ = Math.cos(this.yaw) * Math.cos(this.pitch) * this.distance;

    const desiredCamPos = new THREE.Vector3(
      this.currentLookAt.x + offsetX,
      this.currentLookAt.y + offsetY,
      this.currentLookAt.z + offsetZ
    );

    // 3. Terrain Collision Avoidance: Camera must stay above ground!
    const terrainGroundY = this.collisionSystem.getGroundHeight(desiredCamPos.x, desiredCamPos.z);
    const minSafeCamY = terrainGroundY + 0.6;
    if (desiredCamPos.y < minSafeCamY) {
      desiredCamPos.y = minSafeCamY;
    }

    // 4. Smooth Camera Position Damping
    this.currentPos.lerp(desiredCamPos, Math.min(1.0, dt * 8.0));
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);

    // 5. Dynamic FOV on Sprint
    const targetFov = isSprinting ? this.sprintFov : this.defaultFov;
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1.0, dt * 6.0);
      this.camera.updateProjectionMatrix();
    }
  }
}
