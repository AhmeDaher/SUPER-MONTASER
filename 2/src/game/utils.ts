// Deterministic RNG + terrain math shared by every system.
// Same seed => same jungle, every run, every device.

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const WORLD_SEED = 20260714;
export const WORLD_SIZE = 140; // playable square, x/z in [-70, 70]
export const HALF = WORLD_SIZE / 2;

// River centre line meanders along Z.
export function riverX(z: number): number {
  return 10 * Math.sin(z * 0.045) + 4 * Math.sin(z * 0.11);
}
export function riverDist(x: number, z: number): number {
  return Math.abs(x - riverX(z));
}

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number): number {
  return valueNoise(x, y) * 0.55 + valueNoise(x * 2.1, y * 2.1) * 0.3 + valueNoise(x * 4.3, y * 4.3) * 0.15;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export const SPAWN = { x: 0, z: 48 };
export const WATERFALL = { x: riverX(-52), z: -52 };
export const CAVE = { x: -38, z: -40 };
export const CHEST_POS = { x: riverX(-44) + 4, z: -44 };
export const BRIDGE_Z = 6;

export function getTerrainHeight(x: number, z: number): number {
  // Rolling hills
  let h = (fbm(x * 0.035 + 10, z * 0.035 + 10) - 0.5) * 5.2;
  h += (fbm(x * 0.09, z * 0.09) - 0.5) * 1.4;

  // River valley carve
  const rd = riverDist(x, z);
  if (rd < 9) {
    const t = 1 - rd / 9;
    h -= t * t * 4.6;
  }

  // Northern plateau (waterfall source)
  h += smoothstep(-38, -58, z) * 5.5;
  // Cave hill bump
  const cd = Math.hypot(x - CAVE.x, z - CAVE.z);
  if (cd < 16) h += (1 - cd / 16) * 4.2;
  // Waterfall cliff: steep drop near waterfall point
  const wd = Math.hypot(x - WATERFALL.x, z - WATERFALL.z);
  if (wd < 10) h += (1 - wd / 10) * 2.0;

  // Flatten spawn clearing
  const sd = Math.hypot(x - SPAWN.x, z - SPAWN.z);
  if (sd < 12) h *= smoothstep(4, 12, sd) * 0.85 + 0.15 * (1 - smoothstep(4, 12, sd)) * 0 + h * 0; // keep gentle
  if (sd < 12) h = h * smoothstep(3, 12, sd) + 0.4 * (1 - smoothstep(3, 12, sd));

  // Containment rim
  const edge = Math.max(Math.abs(x), Math.abs(z));
  if (edge > 58) h += (edge - 58) * 0.35;

  // Bridge deck: flatten river under bridge so planks sit naturally
  const bd = Math.abs(z - BRIDGE_Z);
  if (bd < 5 && rd < 10) h = Math.max(h, 0.9);

  return h;
}

export function clamp(v: number, a: number, b: number) { return Math.min(b, Math.max(a, v)); }
export function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
export function damp(a: number, b: number, lambda: number, dt: number) {
  return lerp(a, b, 1 - Math.exp(-lambda * dt));
}
export function angleLerp(a: number, b: number, t: number) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
export function dist2D(ax: number, az: number, bx: number, bz: number) {
  return Math.hypot(ax - bx, az - bz);
}
