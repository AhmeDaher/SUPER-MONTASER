import * as THREE from "three";
import { getTerrainHeight, clamp, damp, angleLerp, mulberry32 } from "./utils";

export type AnimalKind = "lion" | "giraffe" | "monkey" | "elephant";

export interface AnimalRig {
  kind: AnimalKind;
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  legs: THREE.Group[];
  tail?: THREE.Group;
  trunk?: THREE.Group;
  ears: THREE.Group[];
  name: string;
}

const std = (color: number, rough = 0.85) => new THREE.MeshStandardMaterial({ color, roughness: rough });

function leg(parent: THREE.Group, x: number, y: number, z: number, len: number, r: number, mat: THREE.Material) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 8), mat);
  m.position.y = -len / 2; m.castShadow = true;
  g.add(m); parent.add(g);
  return g;
}

export class ProceduralAnimalFactory {
  create(kind: AnimalKind): AnimalRig {
    switch (kind) {
      case "lion": return this.lion();
      case "giraffe": return this.giraffe();
      case "monkey": return this.monkey();
      case "elephant": return this.elephant();
    }
  }

  private lion(): AnimalRig {
    const root = new THREE.Group(), body = new THREE.Group();
    root.add(body);
    const tan = std(0xd9a05b), dark = std(0x8a5a2b);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.9, 6, 12), tan);
    torso.rotation.x = Math.PI / 2; torso.position.y = 0.85; torso.castShadow = true; body.add(torso);
    const head = new THREE.Group(); head.position.set(0, 1.05, 0.75); body.add(head);
    // mane
    const mane = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 12), std(0xb06a1f));
    mane.scale.set(1, 1, 0.55); mane.position.z = -0.12; mane.castShadow = true; head.add(mane);
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 12), tan);
    face.position.z = 0.12; face.castShadow = true; head.add(face);
    for (const sx of [-0.13, 0.13]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), std(0x1a1a1a, 0.4));
      eye.position.set(sx, 0.08, 0.42); head.add(eye);
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), dark);
      ear.position.set(sx * 1.9, 0.3, 0.05); head.add(ear);
    }
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), std(0x5b3a1e));
    nose.position.set(0, -0.05, 0.45); head.add(nose);
    const legs = [
      leg(body, -0.26, 0.62, 0.45, 0.55, 0.11, tan), leg(body, 0.26, 0.62, 0.45, 0.55, 0.11, tan),
      leg(body, -0.26, 0.62, -0.5, 0.55, 0.11, tan), leg(body, 0.26, 0.62, -0.5, 0.55, 0.11, tan),
    ];
    const tail = new THREE.Group(); tail.position.set(0, 0.95, -0.75); body.add(tail);
    const tm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.5, 4, 8), tan);
    tm.position.set(0, 0.2, -0.15); tm.rotation.x = 0.7; tail.add(tm);
    const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), dark);
    tuft.position.set(0, 0.42, -0.32); tail.add(tuft);
    return { kind: "lion", root, body, head, legs, tail, ears: [], name: "Lion" };
  }

  private giraffe(): AnimalRig {
    const root = new THREE.Group(), body = new THREE.Group();
    root.add(body);
    const coat = std(0xf2c14e), spot = std(0xa06a2c);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.1, 6, 12), coat);
    torso.rotation.x = Math.PI / 2; torso.position.y = 1.9; torso.castShadow = true; body.add(torso);
    // spots
    const spotGeo = new THREE.SphereGeometry(0.16, 8, 8);
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Mesh(spotGeo, spot);
      const a = (i / 10) * Math.PI * 2;
      s.position.set(Math.cos(a) * 0.48, 1.9 + Math.sin(a) * 0.35, -0.5 + (i % 4) * 0.35);
      s.scale.set(1, 1, 0.4); body.add(s);
    }
    const neck = new THREE.Group(); neck.position.set(0, 2.2, 0.75); body.add(neck);
    const nm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 1.5, 10), coat);
    nm.position.y = 0.7; nm.castShadow = true; neck.add(nm);
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), spot);
      s.position.set(0.12, 0.3 + i * 0.35, 0.12); s.scale.set(1, 1, 0.4); neck.add(s);
    }
    const head = new THREE.Group(); head.position.set(0, 1.5, 0); neck.add(head);
    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.4, 0.6), coat);
    skull.castShadow = true; head.add(skull);
    for (const sx of [-0.1, 0.1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), std(0x1a1a1a, 0.4));
      eye.position.set(sx, 0.08, 0.28); head.add(eye);
      const oss = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.14, 4, 8), spot);
      oss.position.set(sx, 0.3, -0.05); head.add(oss);
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), coat);
      ear.position.set(sx * 2.2, 0.12, -0.1); head.add(ear);
    }
    const legs = [
      leg(body, -0.28, 1.55, 0.55, 1.5, 0.11, coat), leg(body, 0.28, 1.55, 0.55, 1.5, 0.11, coat),
      leg(body, -0.28, 1.55, -0.6, 1.5, 0.11, coat), leg(body, 0.28, 1.55, -0.6, 1.5, 0.11, coat),
    ];
    const tail = new THREE.Group(); tail.position.set(0, 2.1, -0.85); body.add(tail);
    const tm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.7, 4, 8), coat);
    tm.position.y = -0.4; tail.add(tm);
    return { kind: "giraffe", root, body, head, legs, tail, ears: [], name: "Giraffe" };
  }

  private monkey(): AnimalRig {
    const root = new THREE.Group(), body = new THREE.Group();
    root.add(body);
    const fur = std(0x8a5a2b), belly = std(0xd9b48a);
    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 12), fur);
    torso.scale.set(1, 1.1, 0.9); torso.position.y = 0.55; torso.castShadow = true; body.add(torso);
    const tummy = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), belly);
    tummy.position.set(0, 0.5, 0.14); tummy.scale.set(0.85, 1, 0.6); body.add(tummy);
    const head = new THREE.Group(); head.position.set(0, 1.02, 0.05); body.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), fur);
    skull.castShadow = true; head.add(skull);
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), belly);
    face.position.set(0, -0.03, 0.14); face.scale.set(1, 0.9, 0.7); head.add(face);
    for (const sx of [-0.09, 0.09]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), std(0x1a1a1a, 0.4));
      eye.position.set(sx, 0.05, 0.3); head.add(eye);
    }
    const ears: THREE.Group[] = [];
    for (const sx of [-0.28, 0.28]) {
      const g = new THREE.Group(); g.position.set(sx, 0.08, 0);
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), fur);
      e.scale.set(0.5, 1, 1); g.add(e); head.add(g); ears.push(g);
    }
    const legs = [leg(body, -0.16, 0.32, 0, 0.3, 0.08, fur), leg(body, 0.16, 0.32, 0, 0.3, 0.08, fur)];
    const arms = [leg(body, -0.36, 0.78, 0, 0.34, 0.08, fur), leg(body, 0.36, 0.78, 0, 0.34, 0.08, fur)];
    const tail = new THREE.Group(); tail.position.set(0, 0.5, -0.3); body.add(tail);
    const tm = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 16, Math.PI * 1.4), fur);
    tm.position.set(0, 0.25, -0.1); tm.rotation.x = 0.4; tail.add(tm);
    return { kind: "monkey", root, body, head, legs: [...legs, ...arms], tail, ears, name: "Monkey" };
  }

  private elephant(): AnimalRig {
    const root = new THREE.Group(), body = new THREE.Group();
    root.add(body);
    const grey = std(0x9aa3ad), darkGrey = std(0x7d8794);
    const torso = new THREE.Mesh(new THREE.SphereGeometry(1.05, 18, 14), grey);
    torso.scale.set(1, 0.95, 1.35); torso.position.y = 1.7; torso.castShadow = true; body.add(torso);
    const head = new THREE.Group(); head.position.set(0, 2.05, 1.15); body.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 12), grey);
    skull.castShadow = true; head.add(skull);
    // trunk: chained segments
    const trunk = new THREE.Group(); trunk.position.set(0, -0.25, 0.55); head.add(trunk);
    const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.7, 10), grey);
    t1.position.y = -0.3; t1.castShadow = true; trunk.add(t1);
    const t2 = new THREE.Group(); t2.position.y = -0.6; trunk.add(t2);
    const t2m = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.6, 10), grey);
    t2m.position.y = -0.25; t2m.castShadow = true; t2.add(t2m);
    const t3 = new THREE.Group(); t3.position.y = -0.5; t2.add(t3);
    const t3m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.5, 10), grey);
    t3m.position.y = -0.2; t3.add(t3m);
    for (const sx of [-0.3, 0.3]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), std(0x1a1a1a, 0.4));
      eye.position.set(sx, 0.15, 0.6); head.add(eye);
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.55, 8), std(0xfff8e0, 0.4));
      tusk.position.set(sx * 0.7, -0.45, 0.55); tusk.rotation.x = 1.9; head.add(tusk);
    }
    const ears: THREE.Group[] = [];
    for (const sx of [-0.68, 0.68]) {
      const g = new THREE.Group(); g.position.set(sx, 0.15, -0.1); head.add(g);
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), darkGrey);
      e.scale.set(0.35, 1, 1); e.castShadow = true; g.add(e); ears.push(g);
    }
    const legs = [
      leg(body, -0.55, 1.15, 0.7, 1.1, 0.24, grey), leg(body, 0.55, 1.15, 0.7, 1.1, 0.24, grey),
      leg(body, -0.55, 1.15, -0.75, 1.1, 0.24, grey), leg(body, 0.55, 1.15, -0.75, 1.1, 0.24, grey),
    ];
    const tail = new THREE.Group(); tail.position.set(0, 2.0, -1.35); body.add(tail);
    const tm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.7, 4, 8), darkGrey);
    tm.position.y = -0.4; tail.add(tm);
    return { kind: "elephant", root, body, head, legs, tail, trunk, ears, name: "Elephant" };
  }
}

interface AnimalState {
  rig: AnimalRig;
  home: THREE.Vector3;
  target: THREE.Vector3;
  yaw: number;
  mode: "idle" | "walk" | "look" | "react";
  timer: number;
  phase: number;
  reactTimer: number;
  hopY: number; hopV: number;
}

export class AnimalBehaviorSystem {
  animals: AnimalState[] = [];
  private rng = mulberry32(777);

  add(rig: AnimalRig, x: number, z: number) {
    const y = getTerrainHeight(x, z);
    rig.root.position.set(x, y, z);
    rig.root.rotation.y = this.rng() * Math.PI * 2;
    this.animals.push({
      rig, home: new THREE.Vector3(x, y, z), target: new THREE.Vector3(x, y, z),
      yaw: rig.root.rotation.y, mode: "idle", timer: 1 + this.rng() * 3,
      phase: this.rng() * 10, reactTimer: 0, hopY: 0, hopV: 0,
    });
  }

  get(kind: AnimalKind) { return this.animals.find((a) => a.rig.kind === kind); }

  triggerReaction(kind: AnimalKind) {
    const a = this.get(kind);
    if (a) { a.mode = "react"; a.reactTimer = 3.2; }
  }

  update(dt: number, _t: number, playerPos: THREE.Vector3) {
    for (const a of this.animals) {
      const r = a.rig;
      const dPlayer = Math.hypot(r.root.position.x - playerPos.x, r.root.position.z - playerPos.z);
      a.phase += dt;

      // mode logic
      if (a.mode === "react") {
        a.reactTimer -= dt;
        if (a.reactTimer <= 0) { a.mode = "idle"; a.timer = 1; }
      } else if (dPlayer < 7) {
        a.mode = "look";
      } else {
        a.timer -= dt;
        if (a.mode === "idle" && a.timer <= 0) {
          a.mode = "walk";
          const ang = this.rng() * Math.PI * 2, rad = 3 + this.rng() * 7;
          a.target.set(
            clamp(a.home.x + Math.cos(ang) * rad, -62, 62), 0,
            clamp(a.home.z + Math.sin(ang) * rad, -62, 62)
          );
          a.target.y = getTerrainHeight(a.target.x, a.target.z);
          a.timer = 4 + this.rng() * 4;
        } else if (a.mode === "walk" && a.timer <= 0) {
          a.mode = "idle"; a.timer = 2 + this.rng() * 3;
        }
      }

      // movement
      let moving = 0;
      if (a.mode === "walk") {
        const dx = a.target.x - r.root.position.x, dz = a.target.z - r.root.position.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.4) {
          const sp = r.kind === "elephant" ? 1.1 : r.kind === "giraffe" ? 1.6 : r.kind === "monkey" ? 2.2 : 1.8;
          r.root.position.x += (dx / d) * sp * dt;
          r.root.position.z += (dz / d) * sp * dt;
          a.yaw = angleLerp(a.yaw, Math.atan2(dx, dz), 1 - Math.exp(-4 * dt));
          moving = 1;
        } else { a.mode = "idle"; a.timer = 2 + this.rng() * 3; }
      } else if (a.mode === "look") {
        const dx = playerPos.x - r.root.position.x, dz = playerPos.z - r.root.position.z;
        a.yaw = angleLerp(a.yaw, Math.atan2(dx, dz), 1 - Math.exp(-5 * dt));
      }
      r.root.rotation.y = a.yaw;
      r.root.position.y = getTerrainHeight(r.root.position.x, r.root.position.z) + a.hopY;

      // hop physics (monkey excitement / elephant happy hop)
      if (a.hopV !== 0 || a.hopY > 0) {
        a.hopV -= 14 * dt; a.hopY += a.hopV * dt;
        if (a.hopY <= 0) { a.hopY = 0; a.hopV = 0; }
      }
      if (a.mode === "react" && r.kind === "monkey" && a.hopY === 0 && a.hopV === 0) a.hopV = 5;
      if (a.mode === "react" && r.kind === "elephant" && a.hopY === 0 && a.hopV === 0 && Math.random() < 0.02) a.hopV = 3.2;
      if (a.mode === "look" && r.kind === "monkey" && a.hopY === 0 && a.hopV === 0 && Math.random() < 0.008) a.hopV = 4;

      // animation
      const walkSwing = Math.sin(a.phase * (r.kind === "monkey" ? 14 : 7)) * 0.5 * moving;
      r.legs.forEach((l, i) => { l.rotation.x = (i % 2 === 0 ? walkSwing : -walkSwing); });
      r.body.position.y = Math.abs(Math.sin(a.phase * (r.kind === "monkey" ? 14 : 7))) * 0.08 * moving;
      if (r.tail) r.tail.rotation.x = Math.sin(a.phase * 3) * 0.25;
      if (r.kind === "giraffe") r.head.rotation.x = Math.sin(a.phase * 1.2) * 0.08;
      if (r.kind === "monkey") {
        r.ears.forEach((e) => { e.rotation.z = Math.sin(a.phase * 6) * 0.15; });
        r.head.rotation.y = Math.sin(a.phase * 2.4) * 0.25;
      }
      if (r.kind === "elephant") {
        // trunk sway; raise high during reaction
        if (a.mode === "react") {
          r.trunk!.rotation.x = damp(r.trunk!.rotation.x, -1.5, 6, dt);
          r.ears.forEach((e) => { e.rotation.y = Math.sin(a.phase * 14) * 0.5; });
          r.head.rotation.x = -0.25;
        } else {
          r.trunk!.rotation.x = damp(r.trunk!.rotation.x, Math.sin(a.phase * 1.6) * 0.18 + 0.15, 4, dt);
          r.ears.forEach((e) => { e.rotation.y = Math.sin(a.phase * 1.8) * 0.12; });
          r.head.rotation.x = 0;
        }
      }
      if (r.kind === "lion" && a.mode === "react") {
        r.head.rotation.x = -0.4; // roar pose
        r.body.position.y = 0.1;
      } else if (r.kind === "lion") {
        r.head.rotation.x = damp(r.head.rotation.x, 0, 4, dt);
      }
      // look-at-player head tracking
      if (a.mode === "look") {
        const dx = playerPos.x - r.root.position.x, dz = playerPos.z - r.root.position.z;
        const rel = Math.atan2(dx, dz) - a.yaw;
        let norm = ((rel + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        r.head.rotation.y = damp(r.head.rotation.y, clamp(norm, -0.7, 0.7), 6, dt);
      } else {
        r.head.rotation.y = damp(r.head.rotation.y, 0, 4, dt);
      }
    }
  }
}
