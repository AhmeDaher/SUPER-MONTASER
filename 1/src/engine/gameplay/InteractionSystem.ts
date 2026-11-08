import * as THREE from 'three';
import { AudioManager } from '../audio/AudioManager';
import { InteractionTarget, TreasureChest } from '../types';

export class InteractionSystem {
  private targets: InteractionTarget[] = [];
  private chests: TreasureChest[] = [];
  private activeTarget: InteractionTarget | null = null;
  private audioManager: AudioManager;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
  }

  public registerChest(chest: TreasureChest) {
    this.chests.push(chest);
    this.targets.push({
      type: 'chest',
      id: chest.id,
      name: 'Ancient Jungle Chest',
      prompt: chest.isOpen ? 'Chest Already Opened' : 'Open Treasure Chest',
      distance: 999,
      position: chest.position,
      data: chest,
    });
  }

  public registerTarget(target: InteractionTarget) {
    this.targets.push(target);
  }

  public getActiveTarget(): InteractionTarget | null {
    return this.activeTarget;
  }

  public update(dt: number, playerPos: THREE.Vector3): InteractionTarget | null {
    const maxInteractDist = 4.8;
    let closestDist = maxInteractDist;
    let closest: InteractionTarget | null = null;

    for (let i = 0; i < this.targets.length; i++) {
      const t = this.targets[i];
      const dist = playerPos.distanceTo(t.position);
      t.distance = dist;

      if (dist < closestDist) {
        // If chest is already open, skip or update prompt
        if (t.type === 'chest' && t.data?.isOpen) {
          continue;
        }
        closestDist = dist;
        closest = t;
      }
    }

    this.activeTarget = closest;

    // Animate opening chests
    for (let i = 0; i < this.chests.length; i++) {
      const chest = this.chests[i];
      if (chest.isOpen && chest.openProgress < 1.0) {
        chest.openProgress = Math.min(1.0, chest.openProgress + dt * 2.5);
        // Rotate lid open backward around hinge
        chest.lidMesh.rotation.x = -chest.openProgress * 1.8;
      }
    }

    return this.activeTarget;
  }

  public openChest(chestId: string): boolean {
    const chest = this.chests.find((c) => c.id === chestId);
    if (!chest || chest.isOpen) return false;

    chest.isOpen = true;
    this.audioManager.playChestOpen();
    return true;
  }
}
