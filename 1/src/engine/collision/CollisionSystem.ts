import * as THREE from 'three';

export interface CylinderCollider {
  id: string;
  x: number;
  z: number;
  radius: number;
  height: number;
  type: 'tree' | 'rock' | 'chest' | 'animal' | 'cave_wall';
}

export interface BoxCollider {
  id: string;
  min: THREE.Vector3;
  max: THREE.Vector3;
  elevation: number; // Surface height for walking on top (e.g. bridge deck)
  type: 'bridge' | 'platform';
}

export class CollisionSystem {
  private cylinders: CylinderCollider[] = [];
  private boxes: BoxCollider[] = [];
  private terrainHeightFn: ((x: number, z: number) => number) | null = null;

  public setTerrainHeightFunction(fn: (x: number, z: number) => number) {
    this.terrainHeightFn = fn;
  }

  public addCylinder(collider: CylinderCollider) {
    this.cylinders.push(collider);
  }

  public addBox(collider: BoxCollider) {
    this.boxes.push(collider);
  }

  public clear() {
    this.cylinders = [];
    this.boxes = [];
  }

  public getGroundHeight(x: number, z: number): number {
    let groundY = this.terrainHeightFn ? this.terrainHeightFn(x, z) : 0;

    // Check if on top of any walk-on box colliders (like bridge deck)
    for (let i = 0; i < this.boxes.length; i++) {
      const box = this.boxes[i];
      if (
        x >= box.min.x &&
        x <= box.max.x &&
        z >= box.min.z &&
        z <= box.max.z
      ) {
        if (box.elevation > groundY) {
          groundY = box.elevation;
        }
      }
    }

    return groundY;
  }

  public resolveMovement(
    currentPos: THREE.Vector3,
    desiredPos: THREE.Vector3,
    playerRadius: number = 0.4
  ): THREE.Vector3 {
    const resolved = desiredPos.clone();

    // Check steep cliff height difference
    const currentGroundY = this.getGroundHeight(currentPos.x, currentPos.z);
    const desiredGroundY = this.getGroundHeight(resolved.x, resolved.z);
    const slopeStep = desiredGroundY - currentGroundY;

    // Prevent climbing walls or cliffs steeper than 1.4 units without jumping
    if (slopeStep > 1.4) {
      resolved.x = currentPos.x;
      resolved.z = currentPos.z;
    }

    // Check cylindrical obstacles
    for (let i = 0; i < this.cylinders.length; i++) {
      const c = this.cylinders[i];
      const dx = resolved.x - c.x;
      const dz = resolved.z - c.z;
      const distSq = dx * dx + dz * dz;
      const minDist = playerRadius + c.radius;

      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const push = (minDist - dist);
          resolved.x += (dx / dist) * push;
          resolved.z += (dz / dist) * push;
        } else {
          resolved.x += minDist;
        }
      }
    }

    // World boundary limits
    const worldLimit = 95;
    resolved.x = Math.max(-worldLimit, Math.min(worldLimit, resolved.x));
    resolved.z = Math.max(-worldLimit, Math.min(worldLimit, resolved.z));

    return resolved;
  }
}
