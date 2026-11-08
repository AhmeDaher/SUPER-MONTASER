import * as THREE from 'three';
import { ProceduralAnimalFactory } from '../animals/ProceduralAnimalFactory';
import { CollisionSystem } from '../collision/CollisionSystem';
import { AnimalData, CollectibleItem, TreasureChest } from '../types';
import { ProceduralFlora } from './ProceduralFlora';
import { ProceduralStructures } from './ProceduralStructures';
import { ProceduralTerrain } from './ProceduralTerrain';
import { ProceduralWater } from './ProceduralWater';

export class WorldGenerator {
  public terrain: ProceduralTerrain;
  public water: ProceduralWater;
  public flora: ProceduralFlora;
  public structures: ProceduralStructures;
  public animalFactory: ProceduralAnimalFactory;

  public sceneGroup: THREE.Group;
  public animals: AnimalData[] = [];
  public chests: TreasureChest[] = [];
  public collectibles: CollectibleItem[] = [];

  // Environmental particles
  public fireflies: THREE.Points | null = null;
  public butterflies: THREE.Group[] = [];

  private collisionSystem: CollisionSystem;

  constructor(collisionSystem: CollisionSystem) {
    this.collisionSystem = collisionSystem;
    this.sceneGroup = new THREE.Group();
    this.terrain = new ProceduralTerrain();
    this.water = new ProceduralWater();
    this.flora = new ProceduralFlora();
    this.structures = new ProceduralStructures();
    this.animalFactory = new ProceduralAnimalFactory();
  }

  public generateWorld(furShellCount: number = 4): {
    animals: AnimalData[];
    chests: TreasureChest[];
    collectibles: CollectibleItem[];
  } {
    // 1. Terrain
    this.collisionSystem.setTerrainHeightFunction((x, z) => this.terrain.getHeight(x, z));
    const terrainMesh = this.terrain.createTerrainMesh();
    this.sceneGroup.add(terrainMesh);

    // 2. Winding River & Waterfall
    const riverMesh = this.water.createRiver((z) => this.terrain.getRiverCenter(z));
    this.sceneGroup.add(riverMesh);

    // Waterfall cliff at northern end
    const waterfallX = this.terrain.getRiverCenter(-42);
    const waterfallMesh = this.water.createWaterfall(waterfallX, -42, 10.5, -0.2);
    this.sceneGroup.add(waterfallMesh);
    if (this.water.mistParticles) {
      this.sceneGroup.add(this.water.mistParticles);
    }

    // 3. Wooden Rope Bridge spanning river at z = 0
    const bridgeX = this.terrain.getRiverCenter(0);
    const bridgeResult = this.structures.createWoodenBridge(bridgeX, 0, 0.45, 17.0);
    this.sceneGroup.add(bridgeResult.group);
    this.collisionSystem.addBox(bridgeResult.collider);
    bridgeResult.postColliders.forEach((pc) => this.collisionSystem.addCylinder(pc));

    // 4. Mysterious Cave Entrance at x: 42, z: -32
    const caveGroundY = this.terrain.getHeight(42, -32);
    const caveResult = this.structures.createCaveEntrance(42, caveGroundY, -32);
    this.sceneGroup.add(caveResult.group);
    caveResult.colliders.forEach((c) => this.collisionSystem.addCylinder(c));

    // 5. Populate Procedural Trees & Rocks (deterministic placement)
    this.populateFoliageAndRocks();

    // 6. Interactive Treasure Chests
    // Chest A: Near Elephant Glade (Mission reward chest!)
    const chestA = this.structures.createTreasureChest('chest_elephant', -28, this.terrain.getHeight(-28, -12), -12, 0.6);
    this.sceneGroup.add(chestA.meshGroup);
    this.chests.push(chestA);
    this.collisionSystem.addCylinder({ id: 'chest_a', x: -28, z: -12, radius: 0.8, height: 1.0, type: 'chest' });

    // Chest B: Inside Cave Entrance
    const chestB = this.structures.createTreasureChest('chest_cave', 42, caveGroundY, -30.5, 0);
    this.sceneGroup.add(chestB.meshGroup);
    this.chests.push(chestB);
    this.collisionSystem.addCylinder({ id: 'chest_b', x: 42, z: -30.5, radius: 0.8, height: 1.0, type: 'chest' });

    // Chest C: Hidden on Waterfall Plateau
    const chestC = this.structures.createTreasureChest('chest_waterfall', -14, this.terrain.getHeight(-14, -48), -48, -1.2);
    this.sceneGroup.add(chestC.meshGroup);
    this.chests.push(chestC);
    this.collisionSystem.addCylinder({ id: 'chest_c', x: -14, z: -48, radius: 0.8, height: 1.0, type: 'chest' });

    // 7. Collectible Coins & Stars
    this.placeCollectibles();

    // 8. Procedural Wildlife Animals
    this.populateAnimals(furShellCount);

    // 9. Environmental Details (Fireflies & Butterflies)
    this.createEnvironmentalParticles();

    return {
      animals: this.animals,
      chests: this.chests,
      collectibles: this.collectibles,
    };
  }

  private populateFoliageAndRocks() {
    const grassPositions: THREE.Vector3[] = [];

    // Deterministic random generator for reproducible tree layout
    let seed = 42;
    const prng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Plant trees across jungle
    const treeCount = 65;
    for (let i = 0; i < treeCount; i++) {
      const x = (prng() - 0.5) * 140;
      const z = (prng() - 0.5) * 140;

      // Don't place trees in river or waterfall pool
      const riverX = this.terrain.getRiverCenter(z);
      if (Math.abs(x - riverX) < 8.0 && z > -45) continue;
      // Don't place on starting spawn area
      if (Math.hypot(x - (-5), z - 25) < 7.0) continue;

      const y = this.terrain.getHeight(x, z);
      if (y > 10.0) continue; // Skip steep cliffs

      const treeType = prng();
      let treeGroup: THREE.Group;
      let radius = 0.8;

      if (treeType < 0.42) {
        treeGroup = this.flora.createPalmTree();
        radius = 0.6;
      } else if (treeType < 0.8) {
        treeGroup = this.flora.createBanyanTree();
        radius = 1.2;
      } else {
        treeGroup = this.flora.createAcaciaTree();
        radius = 0.7;
      }

      treeGroup.position.set(x, y, z);
      treeGroup.rotation.y = prng() * Math.PI * 2;
      const s = 0.85 + prng() * 0.4;
      treeGroup.scale.set(s, s, s);

      this.sceneGroup.add(treeGroup);
      this.collisionSystem.addCylinder({
        id: `tree_${i}`,
        x,
        z,
        radius: radius * s,
        height: 6.0,
        type: 'tree',
      });
    }

    // Place Ferns and Boulders
    for (let f = 0; f < 35; f++) {
      const x = (prng() - 0.5) * 120;
      const z = (prng() - 0.5) * 120;
      const y = this.terrain.getHeight(x, z);
      const fern = this.flora.createFern();
      fern.position.set(x, y, z);
      fern.scale.setScalar(0.7 + prng() * 0.5);
      this.sceneGroup.add(fern);
    }

    // Rocks
    for (let r = 0; r < 24; r++) {
      const x = (prng() - 0.5) * 130;
      const z = (prng() - 0.5) * 130;
      const y = this.terrain.getHeight(x, z);
      const rock = this.flora.createRock(0.8 + prng() * 1.2);
      rock.position.set(x, y + 0.3, z);
      rock.rotation.set(prng(), prng(), prng());
      this.sceneGroup.add(rock);

      this.collisionSystem.addCylinder({
        id: `rock_${r}`,
        x,
        z,
        radius: 0.9,
        height: 1.5,
        type: 'rock',
      });
    }

    // Generate instanced grass positions
    for (let g = 0; g < 2200; g++) {
      const x = (prng() - 0.5) * 130;
      const z = (prng() - 0.5) * 130;
      const riverX = this.terrain.getRiverCenter(z);
      if (Math.abs(x - riverX) < 7.0 && z > -45) continue;

      const y = this.terrain.getHeight(x, z);
      if (y > 8.0) continue; // Not on high cliffs
      grassPositions.push(new THREE.Vector3(x, y, z));
    }

    const instancedGrass = this.flora.createInstancedGrass(grassPositions, 1800);
    this.sceneGroup.add(instancedGrass);
  }

  private placeCollectibles() {
    // Coins scattered along paths and scenic vistas
    const coinLocations = [
      { x: -3, z: 20 },
      { x: -1, z: 12 },
      { x: 3, z: 5 },
      { x: -6, z: -8 },
      { x: -16, z: -12 },
      { x: -20, z: -18 },
      { x: 12, z: 10 },
      { x: 20, z: 8 },
      { x: 18, z: -6 },
      { x: 25, z: -18 },
      { x: 34, z: -25 },
      { x: -18, z: -35 },
    ];

    coinLocations.forEach((c, idx) => {
      const y = this.terrain.getHeight(c.x, c.z) + 0.5;
      const coin = this.structures.createCollectibleCoin(`coin_${idx}`, c.x, y, c.z);
      this.sceneGroup.add(coin.mesh);
      this.collectibles.push(coin);
    });

    // Golden Stars placed in rewarding exploratory locations
    const starLocations = [
      { x: 0, z: 0, desc: 'Wooden Bridge Center' },
      { x: -24, z: -18, desc: 'Near Tembo the Elephant' },
      { x: 24, z: 14, desc: 'Near Simba the Lion' },
      { x: 30, z: -10, desc: 'Near Twiga the Giraffe' },
      { x: -10, z: 3, desc: 'Near Kiki the Monkey' },
      { x: 42, z: -32, desc: 'At Mysterious Cave Entrance' },
      { x: -14, z: -46, desc: 'At Waterfall Plunge Overlook' },
    ];

    starLocations.forEach((s, idx) => {
      // For bridge center, elevate above bridge deck
      let y = this.terrain.getHeight(s.x, s.z) + 0.9;
      if (s.x === 0 && s.z === 0) {
        y = 1.4; // High on bridge
      }
      const star = this.structures.createCollectibleStar(`star_${idx}`, s.x, y, s.z);
      this.sceneGroup.add(star.mesh);
      this.collectibles.push(star);
    });
  }

  private populateAnimals(furShellCount: number) {
    // 1. ELEPHANT: In peaceful jungle glade at x: -24, z: -15
    const elephantY = this.terrain.getHeight(-24, -15);
    const elephant = this.animalFactory.createElephant('animal_elephant', -24, elephantY, -15, 0.4);
    this.sceneGroup.add(elephant.meshGroup);
    this.animals.push(elephant);
    this.collisionSystem.addCylinder({ id: 'elephant_col', x: -24, z: -15, radius: 1.8, height: 3.5, type: 'animal' });

    // 2. LION: On sunlit plateau at x: 22, z: 12
    const lionY = this.terrain.getHeight(22, 12);
    const lion = this.animalFactory.createLion('animal_lion', 22, lionY, 12, -1.8, furShellCount);
    this.sceneGroup.add(lion.meshGroup);
    this.animals.push(lion);
    this.collisionSystem.addCylinder({ id: 'lion_col', x: 22, z: 12, radius: 1.2, height: 2.2, type: 'animal' });

    // 3. GIRAFFE: In tall acacia grove at x: 28, z: -12
    const giraffeY = this.terrain.getHeight(28, -12);
    const giraffe = this.animalFactory.createGiraffe('animal_giraffe', 28, giraffeY, -12, -0.6);
    this.sceneGroup.add(giraffe.meshGroup);
    this.animals.push(giraffe);
    this.collisionSystem.addCylinder({ id: 'giraffe_col', x: 28, z: -12, radius: 1.1, height: 4.8, type: 'animal' });

    // 4. MONKEY: On mossy boulder near river at x: -8, z: 2
    const monkeyY = this.terrain.getHeight(-8, 2);
    const monkey = this.animalFactory.createMonkey('animal_monkey', -8, monkeyY, 2, 1.2);
    this.sceneGroup.add(monkey.meshGroup);
    this.animals.push(monkey);
    this.collisionSystem.addCylinder({ id: 'monkey_col', x: -8, z: 2, radius: 0.8, height: 1.8, type: 'animal' });
  }

  private createEnvironmentalParticles() {
    // 1. Glowing Jungle Fireflies
    const count = 90;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      const y = this.terrain.getHeight(x, z) + 0.8 + Math.random() * 2.5;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xccff00,
      size: 0.35,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.fireflies = new THREE.Points(geom, mat);
    this.sceneGroup.add(this.fireflies);

    // 2. Fluttering Jungle Butterflies
    for (let b = 0; b < 6; b++) {
      const bGroup = new THREE.Group();
      const wingMat = new THREE.MeshBasicMaterial({
        color: b % 2 === 0 ? 0x00e5ff : 0xff9100,
        side: THREE.DoubleSide,
      });

      const wingGeom = new THREE.PlaneGeometry(0.18, 0.22);
      wingGeom.translate(0.09, 0, 0);

      const leftWing = new THREE.Mesh(wingGeom, wingMat);
      leftWing.name = 'leftWing';
      bGroup.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeom, wingMat);
      rightWing.name = 'rightWing';
      rightWing.rotation.y = Math.PI;
      bGroup.add(rightWing);

      const bx = -15 + b * 6;
      const bz = 10 + (b % 3) * 6;
      const by = this.terrain.getHeight(bx, bz) + 1.2;
      bGroup.position.set(bx, by, bz);

      this.butterflies.push(bGroup);
      this.sceneGroup.add(bGroup);
    }
  }

  public update(time: number, dt: number) {
    this.water.update(time);
    this.flora.update(time);

    // Animate fireflies bobbing
    if (this.fireflies) {
      const posAttr = this.fireflies.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const oy = posAttr.getY(i);
        posAttr.setY(i, oy + Math.sin(time * 2.0 + i) * 0.008);
      }
      posAttr.needsUpdate = true;
    }

    // Animate butterflies fluttering
    for (let b = 0; b < this.butterflies.length; b++) {
      const bf = this.butterflies[b];
      const flap = Math.sin(time * 18.0 + b) * 0.9;
      const lw = bf.getObjectByName('leftWing');
      const rw = bf.getObjectByName('rightWing');
      if (lw && rw) {
        lw.rotation.y = flap;
        rw.rotation.y = Math.PI - flap;
      }
      // Gentle circular flight
      bf.position.x += Math.cos(time * 0.8 + b) * dt * 0.8;
      bf.position.z += Math.sin(time * 0.8 + b) * dt * 0.8;
      bf.rotation.y = time * 0.8 + b;
    }
  }
}
