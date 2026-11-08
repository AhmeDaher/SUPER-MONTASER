import * as THREE from "three";
import { getTerrainHeight, riverX, BRIDGE_Z, clamp, damp, angleLerp } from "./utils";
import type { Collider } from "./world";

export type CharState = "idle" | "walk" | "run" | "jump" | "fall" | "land" | "celebrate" | "interact";

export interface CharRig {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group; armR: THREE.Group;
  legL: THREE.Group; legR: THREE.Group;
  torso: THREE.Mesh;
}

// Procedural cartoon character factory — swap this with a GLTF loader later
// without touching the controller (same rig contract).
export class ProceduralCharacterFactory {
  create(): CharRig {
    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);

    const skin = new THREE.MeshStandardMaterial({ color: 0xffc99a, roughness: 0.7 });
    const shirt = new THREE.MeshStandardMaterial({ color: 0x1fb6a6, roughness: 0.8 });
    const shorts = new THREE.MeshStandardMaterial({ color: 0x2b50c8, roughness: 0.85 });
    const shoe = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.6 });
    const pack = new THREE.MeshStandardMaterial({ color: 0xff8c42, roughness: 0.8 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.7 });

    // torso
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.42, 6, 12), shirt);
    torso.position.y = 0.95; torso.castShadow = true;
    body.add(torso);
    // belt + shorts
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.14, 12), new THREE.MeshStandardMaterial({ color: 0x5b3a1e, roughness: 0.9 }));
    belt.position.y = 0.66; body.add(belt);
    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.3, 12), shorts);
    hips.position.y = 0.5; hips.castShadow = true; body.add(hips);

    // backpack
    const bp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.3), pack);
    bp.position.set(0, 1.0, -0.42); bp.castShadow = true; body.add(bp);
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.55, 8), new THREE.MeshStandardMaterial({ color: 0xffe066, roughness: 0.9 }));
    roll.rotation.z = Math.PI / 2; roll.position.set(0, 1.38, -0.42); body.add(roll);
    for (const sx of [-0.16, 0.16]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.5, 0.05), new THREE.MeshStandardMaterial({ color: 0x5b3a1e, roughness: 0.9 }));
      strap.position.set(sx, 1.05, -0.22); body.add(strap);
    }

    // head
    const head = new THREE.Group();
    head.position.y = 1.62;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), skin);
    skull.castShadow = true; head.add(skull);
    // eyes
    for (const sx of [-0.13, 0.13]) {
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }));
      white.position.set(sx, 0.05, 0.28); head.add(white);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3 }));
      pupil.position.set(sx, 0.05, 0.35); head.add(pupil);
    }
    // smile
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.028, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0x8a4b2a, roughness: 0.6 }));
    smile.position.set(0, -0.08, 0.29); smile.rotation.x = 0.15; smile.rotation.z = Math.PI;
    head.add(smile);
    // cheeks
    for (const sx of [-0.2, 0.2]) {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshStandardMaterial({ color: 0xff9d9d, roughness: 0.8 }));
      cheek.position.set(sx, -0.06, 0.24); head.add(cheek);
    }
    // nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), skin);
    nose.position.set(0, -0.02, 0.34); head.add(nose);
    // cap
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), capMat);
    cap.position.y = 0.06; cap.castShadow = true; head.add(cap);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16, 1, false, -Math.PI / 2.4, Math.PI / 1.2), capMat);
    brim.position.set(0, 0.16, 0.3); brim.rotation.x = 0.25; head.add(brim);
    const button = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffe066, roughness: 0.5 }));
    button.position.y = 0.4; head.add(button);
    body.add(head);

    // arms (pivot at shoulder)
    const mkArm = (side: number) => {
      const g = new THREE.Group();
      g.position.set(0.46 * side, 1.28, 0);
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.3, 4, 8), shirt);
      upper.position.y = -0.22; upper.castShadow = true; g.add(upper);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), skin);
      hand.position.y = -0.48; hand.castShadow = true; g.add(hand);
      body.add(g);
      return g;
    };
    const armL = mkArm(-1), armR = mkArm(1);

    // legs (pivot at hip)
    const mkLeg = (side: number) => {
      const g = new THREE.Group();
      g.position.set(0.18 * side, 0.42, 0);
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.3, 4, 8), skin);
      leg.position.y = -0.2; leg.castShadow = true; g.add(leg);
      const sh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.34), shoe);
      sh.position.set(0, -0.44, 0.06); sh.castShadow = true; g.add(sh);
      body.add(g);
      return g;
    };
    const legL = mkLeg(-1), legR = mkLeg(1);

    return { root, body, head, armL, armR, legL, legR, torso };
  }
}

export interface MoveInput { x: number; z: number; run: boolean; jump: boolean; }

export class CharacterController {
  rig: CharRig;
  pos = new THREE.Vector3(0, 0, 48);
  vel = new THREE.Vector3();
  yaw = Math.PI; // face -Z (north, into the jungle)
  vy = 0;
  grounded = true;
  state: CharState = "idle";
  speed = 0;
  private walkPhase = 0;
  private stateTime = 0;
  private landTimer = 0;
  private celebrateTimer = 0;
  private interactTimer = 0;
  private wasGrounded = true;
  private colliders: Collider[] = [];

  constructor() {
    this.rig = new ProceduralCharacterFactory().create();
    this.pos.y = this.groundAt(this.pos.x, this.pos.z);
    this.rig.root.position.copy(this.pos);
    this.rig.root.rotation.y = this.yaw;
  }

  setColliders(c: Collider[]) { this.colliders = c; }

  groundAt(x: number, z: number): number {
    // bridge deck
    if (Math.abs(z - BRIDGE_Z) < 1.9 && Math.abs(x - riverX(BRIDGE_Z)) < 9) return 1.52;
    return getTerrainHeight(x, z);
  }

  celebrate() { this.celebrateTimer = 2.6; }
  interactAnim() { this.interactTimer = 1.4; }

  reset() {
    this.pos.set(0, 0, 48);
    this.pos.y = this.groundAt(0, 48);
    this.vel.set(0, 0, 0); this.vy = 0; this.yaw = Math.PI;
    this.celebrateTimer = 0; this.interactTimer = 0;
  }

  update(dt: number, input: MoveInput, camYaw: number) {
    this.stateTime += dt;
    if (this.celebrateTimer > 0) this.celebrateTimer -= dt;
    if (this.interactTimer > 0) this.interactTimer -= dt;
    if (this.landTimer > 0) this.landTimer -= dt;

    // camera-relative movement (camYaw=0 => camera behind player at +Z, forward = -Z)
    const sin = Math.sin(camYaw), cos = Math.cos(camYaw);
    const wx = input.x * cos + input.z * sin;
    const wz = -input.x * sin + input.z * cos;
    const mag = Math.hypot(wx, wz);
    const maxSpeed = input.run ? 8.6 : 5.0;
    const targetVx = mag > 0.01 ? (wx / Math.max(mag, 1)) * maxSpeed * Math.min(mag, 1) : 0;
    const targetVz = mag > 0.01 ? (wz / Math.max(mag, 1)) * maxSpeed * Math.min(mag, 1) : 0;
    const accel = this.grounded ? 14 : 5;
    this.vel.x = damp(this.vel.x, targetVx, accel, dt);
    this.vel.z = damp(this.vel.z, targetVz, accel, dt);
    this.speed = Math.hypot(this.vel.x, this.vel.z);

    // jump
    if (input.jump && this.grounded) {
      this.vy = 8.8; this.grounded = false;
    }
    // gravity
    if (!this.grounded) this.vy -= 24 * dt;

    // integrate
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    this.pos.y += this.vy * dt;

    // world bounds
    this.pos.x = clamp(this.pos.x, -66, 66);
    this.pos.z = clamp(this.pos.z, -66, 66);

    // collider push-out
    for (const c of this.colliders) {
      const dx = this.pos.x - c.x, dz = this.pos.z - c.z;
      const d = Math.hypot(dx, dz);
      const min = c.r + 0.55;
      if (d > 0.001 && d < min) {
        this.pos.x = c.x + (dx / d) * min;
        this.pos.z = c.z + (dz / d) * min;
      }
    }

    // ground
    const g = this.groundAt(this.pos.x, this.pos.z);
    if (this.pos.y <= g) {
      if (!this.wasGrounded && this.vy < -3) this.landTimer = 0.35;
      this.pos.y = g; this.vy = 0; this.grounded = true;
    } else {
      this.grounded = this.pos.y <= g + 0.02;
    }
    this.wasGrounded = this.grounded;

    // facing
    if (this.speed > 0.6) {
      const targetYaw = Math.atan2(this.vel.x, this.vel.z);
      this.yaw = angleLerp(this.yaw, targetYaw, 1 - Math.exp(-10 * dt));
    }

    // state machine
    if (this.celebrateTimer > 0) this.state = "celebrate";
    else if (this.interactTimer > 0) this.state = "interact";
    else if (!this.grounded) this.state = this.vy > 0 ? "jump" : "fall";
    else if (this.landTimer > 0) this.state = "land";
    else if (this.speed > 6.2) this.state = "run";
    else if (this.speed > 0.5) this.state = "walk";
    else this.state = "idle";

    this.animate(dt);
    this.rig.root.position.copy(this.pos);
    this.rig.root.rotation.y = this.yaw;
  }

  private animate(dt: number) {
    const r = this.rig;
    const s = this.state;
    const speedNorm = clamp(this.speed / 8.6, 0, 1);
    this.walkPhase += dt * (4 + this.speed * 2.2) * (s === "walk" || s === "run" ? 1 : 0);
    const ph = this.walkPhase;
    const swing = Math.sin(ph) * (0.25 + speedNorm * 0.55);

    // defaults (idle breathing)
    const breathe = Math.sin(this.stateTime * 2.2) * 0.02;
    r.body.position.y = breathe;
    r.body.rotation.x = 0;
    r.body.scale.set(1, 1, 1);
    r.armL.rotation.x = Math.sin(this.stateTime * 2.2) * 0.06;
    r.armR.rotation.x = -Math.sin(this.stateTime * 2.2) * 0.06;
    r.armL.rotation.z = 0.12; r.armR.rotation.z = -0.12;
    r.legL.rotation.x = 0; r.legR.rotation.x = 0;
    r.head.rotation.x = 0; r.head.rotation.y = 0;

    if (s === "walk" || s === "run") {
      r.armL.rotation.x = swing;
      r.armR.rotation.x = -swing;
      r.legL.rotation.x = -swing * 1.05;
      r.legR.rotation.x = swing * 1.05;
      r.body.position.y = Math.abs(Math.sin(ph)) * 0.09;
      r.body.rotation.x = s === "run" ? 0.16 : 0.05;
      r.head.rotation.x = s === "run" ? -0.08 : 0;
    } else if (s === "jump") {
      r.armL.rotation.x = -2.4; r.armR.rotation.x = -2.4;
      r.armL.rotation.z = 0.5; r.armR.rotation.z = -0.5;
      r.legL.rotation.x = 0.5; r.legR.rotation.x = -0.35;
      r.body.position.y = 0.05;
    } else if (s === "fall") {
      r.armL.rotation.x = -1.2; r.armR.rotation.x = -1.2;
      r.legL.rotation.x = 0.25; r.legR.rotation.x = 0.25;
    } else if (s === "land") {
      const k = this.landTimer / 0.35;
      r.body.scale.set(1 + (1 - k) * 0.12, 1 - (1 - k) * 0.18, 1 + (1 - k) * 0.12);
      r.body.position.y = -(1 - k) * 0.12;
      r.armL.rotation.x = 0.7; r.armR.rotation.x = 0.7;
    } else if (s === "celebrate") {
      const bounce = Math.abs(Math.sin(this.stateTime * 7)) * 0.28;
      r.body.position.y = bounce;
      r.armL.rotation.x = -2.9 + Math.sin(this.stateTime * 10) * 0.25;
      r.armR.rotation.x = -2.9 - Math.sin(this.stateTime * 10) * 0.25;
      r.armL.rotation.z = 0.45; r.armR.rotation.z = -0.45;
      r.legL.rotation.x = Math.sin(this.stateTime * 7) * 0.2;
      r.legR.rotation.x = -Math.sin(this.stateTime * 7) * 0.2;
      r.head.rotation.x = -0.12;
    } else if (s === "interact") {
      // friendly wave
      r.armR.rotation.x = -2.2;
      r.armR.rotation.z = -0.3 + Math.sin(this.stateTime * 12) * 0.35;
      r.armL.rotation.x = 0.2;
      r.head.rotation.x = -0.06;
    }
  }
}
