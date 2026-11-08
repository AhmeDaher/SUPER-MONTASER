import * as THREE from 'three';
import { BoxCollider, CylinderCollider } from '../collision/CollisionSystem';
import { CollectibleItem, TreasureChest } from '../types';

export class ProceduralStructures {
  constructor() {}

  // 1. Curved Wooden Rope Bridge spanning the river
  public createWoodenBridge(
    bridgeX: number,
    bridgeZ: number,
    deckElevation: number = 0.5,
    bridgeLength: number = 18.0
  ): { group: THREE.Group; collider: BoxCollider; postColliders: CylinderCollider[] } {
    const group = new THREE.Group();
    group.position.set(bridgeX, deckElevation, bridgeZ);

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      roughness: 0.9,
      flatShading: true,
    });
    const darkWoodMat = new THREE.MeshStandardMaterial({
      color: 0x5d4037,
      roughness: 0.95,
      flatShading: true,
    });
    const ropeMat = new THREE.MeshStandardMaterial({
      color: 0xd7ccc8,
      roughness: 0.8,
    });

    const plankCount = 28;
    const plankWidth = 2.4;
    const plankThickness = 0.16;
    const halfLen = bridgeLength / 2;

    // Wooden planks with slight arch
    for (let i = 0; i < plankCount; i++) {
      const t = i / (plankCount - 1);
      const x = -halfLen + t * bridgeLength;
      // Slight parabola arch
      const archY = Math.sin(t * Math.PI) * 0.45;

      const plankGeom = new THREE.BoxGeometry(bridgeLength / plankCount * 0.88, plankThickness, plankWidth);
      const plank = new THREE.Mesh(plankGeom, i % 2 === 0 ? woodMat : darkWoodMat);
      plank.position.set(x, archY, 0);
      plank.castShadow = true;
      plank.receiveShadow = true;
      group.add(plank);
    }

    // Heavy support beams underneath
    const beamGeom = new THREE.BoxGeometry(bridgeLength * 1.02, 0.28, 0.22);
    const beam1 = new THREE.Mesh(beamGeom, darkWoodMat);
    beam1.position.set(0, -0.15, plankWidth * 0.42);
    beam1.castShadow = true;
    group.add(beam1);

    const beam2 = new THREE.Mesh(beamGeom, darkWoodMat);
    beam2.position.set(0, -0.15, -plankWidth * 0.42);
    beam2.castShadow = true;
    group.add(beam2);

    // Support pillars on banks
    const postColliders: CylinderCollider[] = [];
    const postPositions = [
      { x: -halfLen + 0.5, z: plankWidth * 0.5 },
      { x: -halfLen + 0.5, z: -plankWidth * 0.5 },
      { x: halfLen - 0.5, z: plankWidth * 0.5 },
      { x: halfLen - 0.5, z: -plankWidth * 0.5 },
    ];

    postPositions.forEach((pp, idx) => {
      const postGeom = new THREE.CylinderGeometry(0.18, 0.22, 2.2, 6);
      const post = new THREE.Mesh(postGeom, darkWoodMat);
      post.position.set(pp.x, 0.6, pp.z);
      post.castShadow = true;
      group.add(post);

      postColliders.push({
        id: `bridge_post_${idx}`,
        x: bridgeX + pp.x,
        z: bridgeZ + pp.z,
        radius: 0.25,
        height: 2.2,
        type: 'tree',
      });
    });

    // Rope railings
    const ropeGeom = new THREE.CylinderGeometry(0.04, 0.04, bridgeLength, 5);
    ropeGeom.rotateZ(Math.PI / 2);

    const rope1 = new THREE.Mesh(ropeGeom, ropeMat);
    rope1.position.set(0, 1.1, plankWidth * 0.48);
    group.add(rope1);

    const rope2 = new THREE.Mesh(ropeGeom, ropeMat);
    rope2.position.set(0, 1.1, -plankWidth * 0.48);
    group.add(rope2);

    // Box collider for walk-on bridge deck
    const collider: BoxCollider = {
      id: 'wooden_bridge_deck',
      min: new THREE.Vector3(bridgeX - halfLen - 0.8, deckElevation - 0.5, bridgeZ - plankWidth / 2 - 0.3),
      max: new THREE.Vector3(bridgeX + halfLen + 0.8, deckElevation + 2.5, bridgeZ + plankWidth / 2 + 0.3),
      elevation: deckElevation + 0.2, // Walk height
      type: 'bridge',
    };

    return { group, collider, postColliders };
  }

  // 2. Mysterious Rocky Cave Entrance
  public createCaveEntrance(x: number, y: number, z: number): { group: THREE.Group; colliders: CylinderCollider[] } {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x37474f,
      roughness: 0.95,
      flatShading: true,
    });
    const darkInteriorMat = new THREE.MeshBasicMaterial({
      color: 0x0a0e12,
    });

    // Cave arch pillars and keystone
    const archLeft = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 1), rockMat);
    archLeft.position.set(-2.6, 2.2, 0);
    archLeft.scale.set(1.1, 1.8, 1.4);
    archLeft.castShadow = true;
    group.add(archLeft);

    const archRight = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 1), rockMat);
    archRight.position.set(2.6, 2.2, 0);
    archRight.scale.set(1.1, 1.8, 1.4);
    archRight.castShadow = true;
    group.add(archRight);

    const archTop = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6, 1), rockMat);
    archTop.position.set(0, 4.2, 0);
    archTop.scale.set(2.0, 1.1, 1.3);
    archTop.castShadow = true;
    group.add(archTop);

    // Dark mysterious portal interior
    const portal = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.2), darkInteriorMat);
    portal.position.set(0, 2.1, -1.2);
    group.add(portal);

    // Glowing Magic Crystals
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00b0ff,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });

    const crystalGeom = new THREE.ConeGeometry(0.22, 1.2, 5);
    const c1 = new THREE.Mesh(crystalGeom, crystalMat);
    c1.position.set(-1.8, 0.6, 0.4);
    c1.rotation.z = -0.2;
    group.add(c1);

    const c2 = new THREE.Mesh(crystalGeom, crystalMat);
    c2.position.set(-1.6, 0.4, 0.6);
    c2.scale.set(0.7, 0.7, 0.7);
    c2.rotation.x = 0.25;
    group.add(c2);

    const c3 = new THREE.Mesh(crystalGeom, crystalMat);
    c3.position.set(1.9, 0.7, 0.3);
    c3.rotation.z = 0.18;
    group.add(c3);

    // Subtle blue crystal glow light
    const crystalLight = new THREE.PointLight(0x00e5ff, 2.0, 8);
    crystalLight.position.set(0, 1.5, 0.2);
    group.add(crystalLight);

    const colliders: CylinderCollider[] = [
      { id: 'cave_left_rock', x: x - 2.5, z: z, radius: 1.8, height: 4.0, type: 'cave_wall' },
      { id: 'cave_right_rock', x: x + 2.5, z: z, radius: 1.8, height: 4.0, type: 'cave_wall' },
      { id: 'cave_back_wall', x: x, z: z - 2.0, radius: 2.2, height: 4.0, type: 'cave_wall' },
    ];

    return { group, colliders };
  }

  // 3. Interactive Treasure Chest with animated opening lid
  public createTreasureChest(id: string, x: number, y: number, z: number, rotation: number = 0): TreasureChest {
    const meshGroup = new THREE.Group();
    meshGroup.position.set(x, y, z);
    meshGroup.rotation.y = rotation;

    const chestWidth = 1.2;
    const chestHeight = 0.65;
    const chestDepth = 0.85;

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      roughness: 0.85,
      flatShading: true,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.3,
      metalness: 0.8,
    });

    // Base body
    const baseGeom = new THREE.BoxGeometry(chestWidth, chestHeight, chestDepth);
    const baseMesh = new THREE.Mesh(baseGeom, woodMat);
    baseMesh.position.y = chestHeight / 2;
    baseMesh.castShadow = true;
    meshGroup.add(baseMesh);

    // Gold trim bands on base
    const bandGeom = new THREE.BoxGeometry(chestWidth * 1.02, 0.1, chestDepth * 1.02);
    const band = new THREE.Mesh(bandGeom, goldMat);
    band.position.y = chestHeight * 0.8;
    meshGroup.add(band);

    // Lock clasp
    const claspGeom = new THREE.BoxGeometry(0.18, 0.22, 0.1);
    const clasp = new THREE.Mesh(claspGeom, goldMat);
    clasp.position.set(0, chestHeight * 0.75, chestDepth / 2 + 0.04);
    meshGroup.add(clasp);

    // Animated Lid Group (hinged at the back edge)
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, chestHeight, -chestDepth / 2);

    // Half-cylinder arched lid
    const lidGeom = new THREE.CylinderGeometry(
      chestDepth / 2,
      chestDepth / 2,
      chestWidth,
      12,
      1,
      false,
      0,
      Math.PI
    );
    lidGeom.rotateZ(Math.PI / 2);
    lidGeom.rotateY(-Math.PI / 2);

    const lidMesh = new THREE.Mesh(lidGeom, woodMat);
    lidMesh.position.set(0, 0, chestDepth / 2);
    lidMesh.castShadow = true;
    lidGroup.add(lidMesh);

    // Gold band across lid
    const lidBandGeom = new THREE.CylinderGeometry(
      chestDepth / 2 + 0.02,
      chestDepth / 2 + 0.02,
      0.12,
      12,
      1,
      false,
      0,
      Math.PI
    );
    lidBandGeom.rotateZ(Math.PI / 2);
    lidBandGeom.rotateY(-Math.PI / 2);
    const lidBand = new THREE.Mesh(lidBandGeom, goldMat);
    lidBand.position.set(0, 0, chestDepth / 2);
    lidGroup.add(lidBand);

    meshGroup.add(lidGroup);

    return {
      id,
      position: new THREE.Vector3(x, y, z),
      rotation,
      meshGroup,
      lidMesh: lidGroup,
      isOpen: false,
      openProgress: 0,
      containsStar: true,
      coinCount: 5,
    };
  }

  // 4. Collectible Golden Coin
  public createCollectibleCoin(id: string, x: number, y: number, z: number): CollectibleItem {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffa000,
      emissiveIntensity: 0.25,
      roughness: 0.2,
      metalness: 0.85,
    });

    const coinGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 14);
    coinGeom.rotateX(Math.PI / 2);
    const coin = new THREE.Mesh(coinGeom, goldMat);
    coin.castShadow = true;
    group.add(coin);

    // Star icon embossed in center
    const starGeom = new THREE.ConeGeometry(0.12, 0.1, 5);
    const star = new THREE.Mesh(starGeom, goldMat);
    star.rotation.x = Math.PI / 2;
    star.position.z = 0.05;
    group.add(star);

    return {
      id,
      type: 'coin',
      position: new THREE.Vector3(x, y, z),
      mesh: group,
      collected: false,
      value: 1,
      rotationSpeed: 2.8,
      bobOffset: Math.random() * Math.PI * 2,
    };
  }

  // 5. Collectible Star
  public createCollectibleStar(id: string, x: number, y: number, z: number): CollectibleItem {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const starShape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.45;
    const innerRadius = 0.22;

    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const sx = Math.cos(angle) * radius;
      const sy = Math.sin(angle) * radius;
      if (i === 0) starShape.moveTo(sx, sy);
      else starShape.lineTo(sx, sy);
    }
    starShape.closePath();

    const extrudeSettings = {
      depth: 0.14,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.05,
    };

    const starGeom = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    starGeom.center();

    const starMat = new THREE.MeshStandardMaterial({
      color: 0xffea00,
      emissive: 0xffb300,
      emissiveIntensity: 0.45,
      roughness: 0.15,
      metalness: 0.8,
    });

    const starMesh = new THREE.Mesh(starGeom, starMat);
    starMesh.castShadow = true;
    group.add(starMesh);

    return {
      id,
      type: 'star',
      position: new THREE.Vector3(x, y, z),
      mesh: group,
      collected: false,
      value: 1,
      rotationSpeed: 2.2,
      bobOffset: Math.random() * Math.PI * 2,
    };
  }
}
