import * as THREE from 'three';
import { AudioManager } from '../audio/AudioManager';
import { CollectibleItem } from '../types';

export class CollectibleSystem {
  private items: CollectibleItem[] = [];
  private audioManager: AudioManager;
  private animTime: number = 0;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
  }

  public registerItem(item: CollectibleItem) {
    this.items.push(item);
  }

  public getItems(): CollectibleItem[] {
    return this.items;
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    onCollect: (item: CollectibleItem) => void
  ) {
    this.animTime += dt;
    const pickupRadius = 1.6;

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (item.collected) continue;

      // Rotation and gentle floating bob
      item.mesh.rotation.y += dt * item.rotationSpeed;
      const bob = Math.sin(this.animTime * 3.0 + item.bobOffset) * 0.12;
      item.mesh.position.y = item.position.y + bob;

      // Distance check to player
      const dist = playerPos.distanceTo(item.mesh.position);
      if (dist < pickupRadius) {
        item.collected = true;
        item.mesh.visible = false;

        // Play sound
        if (item.type === 'coin') {
          this.audioManager.playCoin();
        } else {
          this.audioManager.playStar();
        }

        onCollect(item);
      }
    }
  }
}
