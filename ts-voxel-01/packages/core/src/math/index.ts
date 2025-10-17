import type { Vec3 } from '../types/index.js';

export function vec3Distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function chunkPositionToKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}

export function keyToChunkPosition(key: string): { x: number; y: number; z: number } {
  const [x, y, z] = key.split(',').map(Number);
  return { x, y, z };
}
