import * as THREE from "three";
import {
  mulberry32, WORLD_SEED, WORLD_SIZE, getTerrainHeight, riverDist, riverX,
  SPAWN, WATERFALL, CAVE, CHEST_POS, BRIDGE_Z, clamp,
} from "./utils";

export interface Collider { x: number; z: number; r: number; }
export interface CollectibleVisual {
  kind: "coin" | "star";
  mesh: THREE.Object3D;
  x: number; y: number; z: number;
  taken: boolean;
}

const WATER_Y = -0.55;

export class WorldGenerator {
  group = new THREE.Group();
  colliders: Collider[] = [];
  collectibles: CollectibleVisual[] = [];
  chestLid!: THREE.Group;
  chestGroup!: THREE.Group;
  private waterMat!: THREE.ShaderMaterial;
  private fallMat!: THREE.ShaderMaterial;
  private foam!: THREE.Points;
  private clouds: THREE.InstancedMesh[] = [];
  private butterflies: { g: THREE.Group; w1: THREE.Group; w2: THREE.Group; cx: number; cz: number; ph: number }[] = [];
  private mist: THREE.Sprite[] = [];
  private rng = mulberry32(WORLD_SEED);

  build(scene: THREE.Scene, shadowQuality: number) {
    this.buildSky(scene);
    this.buildLights(scene);
    this.buildTerrain();
    this.buildWater();
    this.buildWaterfall();
    this.buildBridge();
    this.buildCave();
    this.buildVegetation();
    this.buildChest();
    this.buildCollectibles();
    this.buildLife();
    this.applyShadowQuality(shadowQuality);
  }

  applyShadowQuality(q: number) {
    this.group.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        const mat = m.material as THREE.Material | THREE.Material[];
        const mats = Array.isArray(mat) ? mat : [mat];
        // never let transparent / shader surfaces (water, waterfall, sky) cast shadows
        const noCast = mats.some((mm) => mm.transparent || mm instanceof THREE.ShaderMaterial);
        m.castShadow = q > 0 && !noCast;
        m.receiveShadow = true;
      }
    });
  }

  // ---------- sky & lights ----------
  private buildSky(scene: THREE.Scene) {
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x9fd8ef, 55, 150);
    const skyGeo = new THREE.SphereGeometry(400, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x3d9be9) }, bot: { value: new THREE.Color(0xcdf3ff) } },
      vertexShader: `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 bot;
        void main(){ float h=normalize(vP).y*0.5+0.5; gl_FragColor=vec4(mix(bot,top,pow(max(h,0.0),0.8)),1.0); }`,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    sky.frustumCulled = false;
    scene.add(sky);
  }

  private buildLights(scene: THREE.Scene) {
    const hemi = new THREE.HemisphereLight(0xbfe8ff, 0x4a7c3a, 0.95);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2d8, 1.9);
    sun.position.set(45, 70, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -75; sun.shadow.camera.right = 75;
    sun.shadow.camera.top = 75; sun.shadow.camera.bottom = -75;
    sun.shadow.camera.far = 200;
    sun.shadow.bias = -0.0004;
    sun.name = "sun";
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  }

  // ---------- terrain ----------
  private buildTerrain() {
    const seg = 150;
    const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const cGrass = new THREE.Color(0x58b368), cGrass2 = new THREE.Color(0x3f9e57);
    const cSand = new THREE.Color(0xe8d28a), cRock = new THREE.Color(0x8d8d94);
    const cPath = new THREE.Color(0xc9a86a), cDark = new THREE.Color(0x2f7d46);
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = getTerrainHeight(x, z);
      pos.setY(i, h);
      const rd = riverDist(x, z);
      const n = this.rng();
      if (rd < 5.2) tmp.copy(cSand);
      else if (h > 4.2) tmp.copy(cRock).lerp(cGrass, clamp(1 - (h - 4.2) / 3, 0, 1));
      else if (Math.abs(z - BRIDGE_Z) < 2.2 && Math.abs(x) < 22) tmp.copy(cPath);
      else tmp.copy(cGrass).lerp(cGrass2, n).lerp(cDark, clamp((2.2 - h) * 0.12, 0, 0.5));
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.group.add(mesh);
  }

  // ---------- river water ----------
  private buildWater() {
    const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 1, 1);
    geo.rotateX(-Math.PI / 2);
    this.waterMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `varying vec2 vUv; varying vec3 vW; uniform float uTime;
        void main(){
          float flow = sin(vW.x*2.2 + vW.z*0.6 - uTime*2.4)*0.5+0.5;
          float flow2 = sin(vW.x*5.0 - vW.z*1.4 - uTime*3.6)*0.5+0.5;
          vec3 deep = vec3(0.05,0.42,0.62); vec3 shal = vec3(0.25,0.75,0.85);
          vec3 col = mix(deep, shal, flow*0.45 + flow2*0.2);
          col += vec3(0.10)*smoothstep(0.75,1.0,flow2);
          gl_FragColor = vec4(col, 0.88);
        }`,
    });
    const water = new THREE.Mesh(geo, this.waterMat);
    water.position.y = WATER_Y;
    water.renderOrder = 2;
    this.group.add(water);
  }

  // ---------- waterfall ----------
  private buildWaterfall() {
    const wx = WATERFALL.x, wz = WATERFALL.z;
    const topY = getTerrainHeight(wx, wz + 4) + 1.2;
    const botY = WATER_Y + 0.2;
    const h = topY - botY;
    // cliff face
    const cliff = new THREE.Mesh(
      new THREE.BoxGeometry(9, h + 2, 3),
      new THREE.MeshStandardMaterial({ color: 0x8d8d94, roughness: 1 })
    );
    cliff.position.set(wx, botY + h / 2 - 0.5, wz - 1.5);
    cliff.castShadow = true; cliff.receiveShadow = true;
    this.group.add(cliff);
    this.colliders.push({ x: wx, z: wz - 1.5, r: 5 });

    // falling sheet
    this.fallMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform float uTime;
        void main(){
          float s = sin(vUv.x*60.0 + sin(vUv.y*40.0 - uTime*9.0)*2.0)*0.5+0.5;
          float streak = sin(vUv.x*140.0 - uTime*5.0)*0.5+0.5;
          float a = 0.55 + s*0.35 + streak*0.15;
          a *= smoothstep(0.0,0.12,vUv.y)*smoothstep(1.0,0.85,vUv.y);
          vec3 col = mix(vec3(0.75,0.92,1.0), vec3(0.35,0.75,0.95), s);
          gl_FragColor = vec4(col, a);
        }`,
    });
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(7.5, h), this.fallMat);
    fall.position.set(wx, botY + h / 2, wz + 0.2);
    fall.renderOrder = 3;
    this.group.add(fall);

    // foam pool
    const foamGeo = new THREE.CircleGeometry(4.2, 24);
    foamGeo.rotateX(-Math.PI / 2);
    const foamMat = new THREE.MeshBasicMaterial({ color: 0xeafcff, transparent: true, opacity: 0.75, depthWrite: false });
    const pool = new THREE.Mesh(foamGeo, foamMat);
    pool.position.set(wx, WATER_Y + 0.12, wz + 2.2);
    pool.renderOrder = 3;
    this.group.add(pool);

    // foam particles
    const N = 260;
    const p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      p[i * 3] = wx + (this.rng() - 0.5) * 7;
      p[i * 3 + 1] = botY + this.rng() * h;
      p[i * 3 + 2] = wz + 0.4 + this.rng() * 1.2;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(p, 3));
    this.foam = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xdffaff, size: 0.22, transparent: true, opacity: 0.85, depthWrite: false }));
    this.group.add(this.foam);

    // mist sprites
    const mistTex = this.makeSoftCircleTexture();
    for (let i = 0; i < 5; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex, transparent: true, opacity: 0.28, depthWrite: false }));
      sp.position.set(wx + (this.rng() - 0.5) * 6, botY + 0.8 + this.rng() * 1.5, wz + 2.5);
      sp.scale.setScalar(3.5 + this.rng() * 2.5);
      this.mist.push(sp);
      this.group.add(sp);
    }
  }

  private makeSoftCircleTexture(): THREE.Texture {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, "rgba(255,255,255,0.9)"); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  // ---------- bridge ----------
  private buildBridge() {
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x9a6b3f, roughness: 0.9 });
    const woodDark = new THREE.MeshStandardMaterial({ color: 0x7a5228, roughness: 0.9 });
    const deckY = 1.35;
    const span = 16;
    for (let i = 0; i < 11; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.18, 3.4), i % 2 ? wood : woodDark);
      plank.position.set(riverX(BRIDGE_Z) - span / 2 + i * (span / 10), deckY, BRIDGE_Z);
      plank.castShadow = true; plank.receiveShadow = true;
      g.add(plank);
    }
    for (const side of [-1.7, 1.7]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(span + 1, 0.16, 0.16), woodDark);
      rail.position.set(riverX(BRIDGE_Z), deckY + 1.0, BRIDGE_Z + side);
      rail.castShadow = true;
      g.add(rail);
      for (let i = 0; i < 5; i++) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 0.18), wood);
        post.position.set(riverX(BRIDGE_Z) - span / 2 + i * (span / 4), deckY + 0.5, BRIDGE_Z + side);
        post.castShadow = true;
        g.add(post);
      }
    }
    for (const sx of [-span / 2, span / 2]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.6, 8), woodDark);
      leg.position.set(riverX(BRIDGE_Z) + sx, deckY - 1.2, BRIDGE_Z);
      leg.castShadow = true;
      g.add(leg);
    }
    this.group.add(g);
  }

  // ---------- cave ----------
  private buildCave() {
    const { x, z } = CAVE;
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x7c7f88, roughness: 1, flatShading: true });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 1 });
    const arch = new THREE.Group();
    // ring of boulders forming entrance
    const ring: [number, number, number, number][] = [
      [-4.2, 1.2, 0, 2.4], [-2.6, 3.4, 0, 2.2], [0, 4.4, 0, 2.6], [2.6, 3.4, 0, 2.2], [4.2, 1.2, 0, 2.4],
      [-4.6, 0.6, 1.6, 2.0], [4.6, 0.6, 1.6, 2.0],
    ];
    for (const [ox, oy, oz, s] of ring) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
      rock.position.set(x + ox, oy, z + oz);
      rock.rotation.set(this.rng() * 3, this.rng() * 3, this.rng() * 3);
      rock.castShadow = true; rock.receiveShadow = true;
      arch.add(rock);
    }
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(3.4, 24), darkMat);
    mouth.position.set(x, 1.9, z + 1.2);
    arch.add(mouth);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(3.6, 24), new THREE.MeshStandardMaterial({ color: 0x3a3a42, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(x, 0.15, z + 1.2);
    arch.add(floor);
    // crystals
    const cryMat = new THREE.MeshStandardMaterial({ color: 0x7ef0ff, emissive: 0x2fb9d8, emissiveIntensity: 0.9, roughness: 0.2 });
    for (let i = 0; i < 6; i++) {
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.35 + this.rng() * 0.4, 0), cryMat);
      c.position.set(x + (this.rng() - 0.5) * 6, 0.5 + this.rng() * 0.5, z + 2.5 + this.rng() * 2);
      c.castShadow = true;
      arch.add(c);
    }
    this.group.add(arch);
    this.colliders.push({ x, z: z + 1.2, r: 4.6 });
  }

  // ---------- vegetation (instanced) ----------
  private buildVegetation() {
    const dummy = new THREE.Object3D();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a4a26, roughness: 1 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e8b47, roughness: 0.9, flatShading: true });
    const palmMat = new THREE.MeshStandardMaterial({ color: 0x3fae5a, roughness: 0.9, flatShading: true });

    const roundSpots: { x: number; z: number; s: number }[] = [];
    const palmSpots: { x: number; z: number; s: number }[] = [];
    const pineSpots: { x: number; z: number; s: number }[] = [];
    let guard = 0;
    while (roundSpots.length < 46 && guard++ < 3000) {
      const x = (this.rng() - 0.5) * 124, z = (this.rng() - 0.5) * 124;
      if (!this.clearOf(x, z, 6)) continue;
      roundSpots.push({ x, z, s: 0.8 + this.rng() * 0.7 });
    }
    guard = 0;
    while (palmSpots.length < 26 && guard++ < 3000) {
      const x = (this.rng() - 0.5) * 124, z = (this.rng() - 0.5) * 124;
      if (!this.clearOf(x, z, 6)) continue;
      palmSpots.push({ x, z, s: 0.8 + this.rng() * 0.6 });
    }
    guard = 0;
    while (pineSpots.length < 30 && guard++ < 3000) {
      const x = (this.rng() - 0.5) * 124, z = (this.rng() - 0.5) * 124;
      if (!this.clearOf(x, z, 6)) continue;
      pineSpots.push({ x, z, s: 0.8 + this.rng() * 0.7 });
    }

    // round trees: trunk + canopy
    const rt = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.32, 0.5, 3.2, 7), trunkMat, roundSpots.length);
    const rc = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.1, 1), leafMat, roundSpots.length);
    roundSpots.forEach((p, i) => {
      const y = getTerrainHeight(p.x, p.z);
      dummy.position.set(p.x, y + 1.6 * p.s, p.z); dummy.scale.setScalar(p.s); dummy.rotation.set(0, this.rng() * 6, 0);
      dummy.updateMatrix(); rt.setMatrixAt(i, dummy.matrix);
      dummy.position.set(p.x, y + (3.2 + 1.4) * p.s, p.z); dummy.updateMatrix(); rc.setMatrixAt(i, dummy.matrix);
      this.colliders.push({ x: p.x, z: p.z, r: 0.9 * p.s });
    });
    rt.castShadow = rc.castShadow = true; rt.receiveShadow = rc.receiveShadow = true;
    this.group.add(rt, rc);

    // palms: leaning trunk + fronds
    const pt = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.38, 4.4, 7), trunkMat, palmSpots.length);
    const pf = new THREE.InstancedMesh(new THREE.ConeGeometry(2.6, 1.1, 6), palmMat, palmSpots.length);
    palmSpots.forEach((p, i) => {
      const y = getTerrainHeight(p.x, p.z);
      const lean = (this.rng() - 0.5) * 0.35;
      dummy.position.set(p.x, y + 2.2 * p.s, p.z); dummy.scale.setScalar(p.s);
      dummy.rotation.set(lean, this.rng() * 6, lean * 0.6); dummy.updateMatrix(); pt.setMatrixAt(i, dummy.matrix);
      dummy.position.set(p.x + lean * 3, y + 4.6 * p.s, p.z); dummy.rotation.set(0, this.rng() * 6, 0);
      dummy.updateMatrix(); pf.setMatrixAt(i, dummy.matrix);
      this.colliders.push({ x: p.x, z: p.z, r: 0.8 * p.s });
    });
    pt.castShadow = pf.castShadow = true;
    this.group.add(pt, pf);

    // pines: trunk + cone
    const nt = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.42, 2.2, 7), trunkMat, pineSpots.length);
    const nc = new THREE.InstancedMesh(new THREE.ConeGeometry(1.7, 4.2, 8), new THREE.MeshStandardMaterial({ color: 0x1f6b3a, roughness: 0.9, flatShading: true }), pineSpots.length);
    pineSpots.forEach((p, i) => {
      const y = getTerrainHeight(p.x, p.z);
      dummy.position.set(p.x, y + 1.1 * p.s, p.z); dummy.scale.setScalar(p.s); dummy.rotation.set(0, this.rng() * 6, 0);
      dummy.updateMatrix(); nt.setMatrixAt(i, dummy.matrix);
      dummy.position.set(p.x, y + (2.2 + 1.8) * p.s, p.z); dummy.updateMatrix(); nc.setMatrixAt(i, dummy.matrix);
      this.colliders.push({ x: p.x, z: p.z, r: 0.8 * p.s });
    });
    nt.castShadow = nc.castShadow = true;
    this.group.add(nt, nc);

    // rocks
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x9a9da5, roughness: 1, flatShading: true });
    const rocks: { x: number; z: number; s: number }[] = [];
    guard = 0;
    while (rocks.length < 55 && guard++ < 3000) {
      const x = (this.rng() - 0.5) * 126, z = (this.rng() - 0.5) * 126;
      if (!this.clearOf(x, z, 3.5)) continue;
      rocks.push({ x, z, s: 0.4 + this.rng() * 1.1 });
    }
    const rockMesh = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), rockMat, rocks.length);
    rocks.forEach((p, i) => {
      dummy.position.set(p.x, getTerrainHeight(p.x, p.z) + 0.2 * p.s, p.z);
      dummy.scale.setScalar(p.s); dummy.rotation.set(this.rng() * 3, this.rng() * 3, this.rng() * 3);
      dummy.updateMatrix(); rockMesh.setMatrixAt(i, dummy.matrix);
      if (p.s > 0.7) this.colliders.push({ x: p.x, z: p.z, r: p.s * 0.9 });
    });
    rockMesh.castShadow = rockMesh.receiveShadow = true;
    this.group.add(rockMesh);

    // grass tufts
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x4cc05e, roughness: 1, flatShading: true });
    const grass = new THREE.InstancedMesh(new THREE.ConeGeometry(0.28, 0.9, 5), grassMat, 900);
    for (let i = 0; i < 900; i++) {
      const x = (this.rng() - 0.5) * 128, z = (this.rng() - 0.5) * 128;
      dummy.position.set(x, getTerrainHeight(x, z) + 0.4, z);
      dummy.scale.set(0.7 + this.rng(), 0.7 + this.rng() * 1.1, 0.7 + this.rng());
      dummy.rotation.set((this.rng() - 0.5) * 0.3, this.rng() * 6, (this.rng() - 0.5) * 0.3);
      dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
    }
    this.group.add(grass);

    // flowers
    const flowerCols = [0xff6b9d, 0xffd93d, 0xff8c42, 0xc77dff, 0xffffff];
    const flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 6, 6), new THREE.MeshStandardMaterial({ roughness: 0.6 }), 160);
    const fc = new THREE.Color();
    for (let i = 0; i < 160; i++) {
      const x = (this.rng() - 0.5) * 124, z = (this.rng() - 0.5) * 124;
      dummy.position.set(x, getTerrainHeight(x, z) + 0.35, z);
      dummy.scale.setScalar(0.8 + this.rng() * 0.7); dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix(); flowers.setMatrixAt(i, dummy.matrix);
      flowers.setColorAt(i, fc.setHex(flowerCols[i % flowerCols.length]));
    }
    this.group.add(flowers);

    // bushes
    const bush = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.9, 1), new THREE.MeshStandardMaterial({ color: 0x2f9e44, roughness: 1, flatShading: true }), 40);
    for (let i = 0; i < 40; i++) {
      const x = (this.rng() - 0.5) * 122, z = (this.rng() - 0.5) * 122;
      if (!this.clearOf(x, z, 3)) { dummy.position.set(x, -50, z); }
      else dummy.position.set(x, getTerrainHeight(x, z) + 0.5, z);
      dummy.scale.setScalar(0.7 + this.rng() * 0.9); dummy.rotation.set(0, this.rng() * 6, 0);
      dummy.updateMatrix(); bush.setMatrixAt(i, dummy.matrix);
    }
    bush.castShadow = true;
    this.group.add(bush);

    // clouds
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.92, flatShading: true });
    for (let c = 0; c < 3; c++) {
      const cloud = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(3, 1), cloudMat, 7);
      for (let i = 0; i < 7; i++) {
        dummy.position.set((this.rng() - 0.5) * 120 + (i - 3) * 4, 34 + this.rng() * 8, (this.rng() - 0.5) * 120);
        dummy.scale.set(1 + this.rng(), 0.55, 1 + this.rng() * 0.6);
        dummy.rotation.set(0, this.rng() * 6, 0);
        dummy.updateMatrix(); cloud.setMatrixAt(i, dummy.matrix);
      }
      this.clouds.push(cloud);
      this.group.add(cloud);
    }
  }

  private clearOf(x: number, z: number, pad: number): boolean {
    if (riverDist(x, z) < 7.5 + pad) return false;
    if (Math.hypot(x - SPAWN.x, z - SPAWN.z) < 7) return false;
    if (Math.hypot(x - WATERFALL.x, z - WATERFALL.z) < 9) return false;
    if (Math.hypot(x - CAVE.x, z - CAVE.z) < 8) return false;
    if (Math.hypot(x - CHEST_POS.x, z - CHEST_POS.z) < 6) return false;
    if (Math.abs(z - BRIDGE_Z) < 4 && Math.abs(x - riverX(BRIDGE_Z)) < 12) return false;
    return true;
  }

  // ---------- treasure chest ----------
  private buildChest() {
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.85 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xffc93c, roughness: 0.35, metalness: 0.6 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.4), wood);
    base.position.y = 0.55; base.castShadow = true;
    g.add(base);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.18, 1.5), gold);
    trim.position.y = 1.05; g.add(trim);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.15), gold);
    lock.position.set(0, 1.0, 0.75); g.add(lock);
    this.chestLid = new THREE.Group();
    this.chestLid.position.set(0, 1.1, -0.7);
    const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 1.4), wood);
    lidMesh.position.set(0, 0.35, 0.7); lidMesh.castShadow = true;
    const lidTrim = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.16, 1.5), gold);
    lidTrim.position.set(0, 0.05, 0.7);
    this.chestLid.add(lidMesh, lidTrim);
    g.add(this.chestLid);
    // glow gems inside
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0xffaa00, emissiveIntensity: 1.2 }));
    gem.position.y = 1.2; gem.name = "chestGem";
    g.add(gem);
    g.position.set(CHEST_POS.x, getTerrainHeight(CHEST_POS.x, CHEST_POS.z), CHEST_POS.z);
    g.rotation.y = 0.6;
    this.chestGroup = g;
    this.group.add(g);
    this.colliders.push({ x: CHEST_POS.x, z: CHEST_POS.z, r: 1.6 });
  }

  // ---------- collectibles ----------
  private buildCollectibles() {
    const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 18);
    coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd93d, roughness: 0.25, metalness: 0.7, emissive: 0xaa7700, emissiveIntensity: 0.35 });
    const starGeo = new THREE.OctahedronGeometry(0.5, 0);
    const starMat = new THREE.MeshStandardMaterial({ color: 0xffe066, roughness: 0.3, emissive: 0xffaa00, emissiveIntensity: 0.7 });
    const spots: { kind: "coin" | "star"; x: number; z: number }[] = [];
    // coins along exploration paths
    const coinSpots: [number, number][] = [
      [4, 38], [-6, 30], [12, 22], [-14, 18], [18, 8], [-20, 2], [8, -8], [-8, -14],
      [16, -22], [-24, -18], [2, -30], [10, -36],
    ];
    coinSpots.forEach(([x, z]) => spots.push({ kind: "coin", x, z }));
    const starSpots: [number, number][] = [[-30, 8], [26, -6], [-18, -32], [22, -30], [0, -20]];
    starSpots.forEach(([x, z]) => spots.push({ kind: "star", x, z }));
    for (const s of spots) {
      const mesh = s.kind === "coin" ? new THREE.Mesh(coinGeo, coinMat) : new THREE.Mesh(starGeo, starMat);
      const y = getTerrainHeight(s.x, s.z) + 1.1;
      mesh.position.set(s.x, y, s.z);
      mesh.castShadow = true;
      this.group.add(mesh);
      this.collectibles.push({ kind: s.kind, mesh, x: s.x, y, z: s.z, taken: false });
    }
  }

  // ---------- butterflies ----------
  private buildLife() {
    const cols = [0xff8fab, 0xffd166, 0x8ecae6, 0xc77dff];
    for (let i = 0; i < 8; i++) {
      const g = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide });
      const w1 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), mat);
      const w2 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), mat);
      w1.position.x = -0.25; w2.position.x = 0.25;
      const p1 = new THREE.Group(); p1.add(w1);
      const p2 = new THREE.Group(); p2.add(w2);
      g.add(p1, p2);
      const cx = (this.rng() - 0.5) * 80, cz = (this.rng() - 0.5) * 80;
      this.butterflies.push({ g, w1: p1, w2: p2, cx, cz, ph: this.rng() * 10 });
      this.group.add(g);
    }
  }

  update(dt: number, t: number) {
    this.waterMat.uniforms.uTime.value = t;
    this.fallMat.uniforms.uTime.value = t;
    // foam churn
    const fp = this.foam.geometry.attributes.position;
    for (let i = 0; i < fp.count; i++) {
      let y = fp.getY(i) + dt * 3.2;
      if (y > getTerrainHeight(WATERFALL.x, WATERFALL.z) + 1.0) y = WATER_Y + 0.3;
      fp.setY(i, y);
    }
    fp.needsUpdate = true;
    // clouds drift
    for (const c of this.clouds) {
      c.position.x = Math.sin(t * 0.02 + c.id) * 6;
    }
    // mist pulse
    this.mist.forEach((m, i) => {
      (m.material as THREE.SpriteMaterial).opacity = 0.2 + Math.sin(t * 1.3 + i * 1.7) * 0.1;
    });
    // butterflies
    for (const b of this.butterflies) {
      const a = t * 0.35 + b.ph;
      b.g.position.set(b.cx + Math.cos(a) * 5, getTerrainHeight(b.cx, b.cz) + 1.6 + Math.sin(t * 2 + b.ph) * 0.5, b.cz + Math.sin(a) * 5);
      b.g.rotation.y = -a;
      const flap = Math.sin(t * 18 + b.ph) * 0.9;
      b.w1.rotation.y = flap; b.w2.rotation.y = -flap;
    }
  }
}
