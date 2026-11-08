import * as THREE from 'three';

// Simplex-style pseudo noise function
function pseudoNoise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;

  // Cubic Hermite curve
  const u = fx * fx * (3.0 - 2.0 * fx);
  const v = fy * fy * (3.0 - 2.0 * fy);

  const a = pseudoNoise(i, j);
  const b = pseudoNoise(i + 1, j);
  const c = pseudoNoise(i, j + 1);
  const d = pseudoNoise(i + 1, j + 1);

  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function fractalNoise(x: number, y: number, octaves: number = 4): number {
  let val = 0;
  let freq = 1;
  let amp = 1;
  let maxAmp = 0;

  for (let o = 0; o < octaves; o++) {
    val += smoothNoise(x * freq, y * freq) * amp;
    maxAmp += amp;
    freq *= 2.1;
    amp *= 0.48;
  }

  return val / maxAmp;
}

export class ProceduralTerrain {
  private mesh: THREE.Mesh | null = null;
  public readonly width: number = 200;
  public readonly depth: number = 200;
  public readonly segments: number = 120;

  constructor() {}

  // River spline center calculation: returns x coordinate of river center for a given z
  public getRiverCenter(z: number): number {
    return Math.sin(z * 0.04) * 18 - 8;
  }

  // Exact elevation calculation at any world point (x, z)
  public getHeight(x: number, z: number): number {
    // 1. Base rolling hills
    const scale = 0.025;
    const baseElevation = fractalNoise(x * scale + 10, z * scale + 10, 4) * 8 - 2;

    // 2. Waterfall Cliff at the northern section (z around -45 to -60, x around -25 to -5)
    const distToCliff = Math.hypot(x - (-15), z - (-48));
    let cliffElevation = 0;
    if (distToCliff < 22) {
      const factor = Math.max(0, 1 - distToCliff / 22);
      cliffElevation = factor * factor * 14;
    }

    // 3. Cave mountain ridge on eastern side (x around 35 to 55, z around -25 to -45)
    const distToCave = Math.hypot(x - 45, z - (-32));
    let caveRidge = 0;
    if (distToCave < 28) {
      const f = Math.max(0, 1 - distToCave / 28);
      caveRidge = f * 12;
    }

    let y = baseElevation + cliffElevation + caveRidge;

    // 4. River Trench carving
    // River runs along getRiverCenter(z)
    const riverX = this.getRiverCenter(z);
    const distToRiver = Math.abs(x - riverX);
    const riverWidth = 7.5;

    // Don't carve river on the high waterfall plateau top
    if (z > -40) {
      if (distToRiver < riverWidth) {
        // Smooth parabolic riverbed trench
        const riverFactor = 1 - (distToRiver / riverWidth);
        const depth = 2.4 * Math.sin(riverFactor * Math.PI * 0.5);
        y -= depth;
        // Flatten riverbed around y = -1.2
        if (y < -1.4) y = -1.4 + (y + 1.4) * 0.2;
      }
    } else if (distToRiver < 5 && z > -48) {
      // Waterfall plunge pool carving
      const poolFactor = Math.max(0, 1 - Math.hypot(x - riverX, z - (-42)) / 8);
      y -= poolFactor * 2.8;
    }

    // 5. Gentle clearing for starting zone near (x: -5, z: 25)
    const distToSpawn = Math.hypot(x - (-5), z - 25);
    if (distToSpawn < 16) {
      const factor = 1 - distToSpawn / 16;
      y = y * (1 - factor * 0.7) + 0.4 * (factor * 0.7);
    }

    // 6. World boundary mountains so player stays inside lush bowl
    const distFromCenter = Math.hypot(x, z);
    if (distFromCenter > 70) {
      const edgeFactor = (distFromCenter - 70) / 30;
      y += edgeFactor * edgeFactor * 20;
    }

    return y;
  }

  public createTerrainMesh(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(
      this.width,
      this.depth,
      this.segments,
      this.segments
    );
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    // Color palettes
    const colorLushGrass = new THREE.Color('#388e3c');
    const colorBrightGrass = new THREE.Color('#558b2f');
    const colorSand = new THREE.Color('#d7ccc8');
    const colorRock = new THREE.Color('#5d4037');
    const colorCliff = new THREE.Color('#424242');
    const colorMoss = new THREE.Color('#2e7d32');

    const tempColor = new THREE.Color();

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const y = this.getHeight(x, z);
      positions.setY(i, y);

      // Procedural color determination based on height, slope and river proximity
      const riverX = this.getRiverCenter(z);
      const distToRiver = Math.abs(x - riverX);

      // Sand near river
      if (distToRiver < 8.5 && z > -40 && y < 0.2) {
        tempColor.copy(colorSand);
      } else if (y > 9) {
        // High rocky peaks
        tempColor.copy(colorCliff);
      } else if (y > 5.5) {
        // Mountain rock with moss
        tempColor.copy(colorRock).lerp(colorMoss, 0.4);
      } else if ((x + z) % 3 > 1.4) {
        tempColor.copy(colorBrightGrass);
      } else {
        tempColor.copy(colorLushGrass);
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true, // Gives charming low-poly adventure aesthetic
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;

    return this.mesh;
  }
}
