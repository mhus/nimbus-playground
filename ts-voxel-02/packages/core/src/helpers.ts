/**
 * Helper functions for coordinate transformations
 */

import type { XYZ, XZ } from './types.js';

/**
 * Chunk size (blocks per chunk dimension)
 */
export const CHUNK_SIZE = 32;

/**
 * Converts global world coordinates to chunk ID and local position
 * @param pos Global position [x, y, z]
 * @returns Object with chunk ID and local position within chunk
 */
export function globalToChunk(pos: XYZ): { id: XZ; pos: XYZ } {
  const xc = Math.floor(pos[0] / CHUNK_SIZE);
  const zc = Math.floor(pos[2] / CHUNK_SIZE);

  let xl = pos[0] % CHUNK_SIZE;
  let yl = pos[1];
  let zl = pos[2] % CHUNK_SIZE;

  if (xl < 0) xl = xl + CHUNK_SIZE;
  if (zl < 0) zl = zl + CHUNK_SIZE;

  return {
    id: [xc, zc],
    pos: [xl, yl, zl],
  };
}

/**
 * Gets chunk ID from global coordinates
 * @param pos Global position [x, y, z]
 * @returns Chunk ID [chunkX, chunkZ]
 */
export function chunkIDFromGlobal(pos: XYZ): XZ {
  const xz: XZ = [
    Math.floor(pos[0] / CHUNK_SIZE),
    Math.floor(pos[2] / CHUNK_SIZE)
  ];

  if (xz[0] < 0) xz[0] = xz[0] + CHUNK_SIZE;
  if (xz[1] < 0) xz[1] = xz[1] + CHUNK_SIZE;

  return xz;
}

/**
 * Converts global coordinates to local chunk coordinates
 * @param pos Global position [x, y, z]
 * @returns Local position within chunk [x, y, z]
 */
export function globalToLocal(pos: XYZ): XYZ {
  return [pos[0] % CHUNK_SIZE, pos[1], pos[2] % CHUNK_SIZE];
}

/**
 * Generates a random seed for world generation
 * @returns Random number suitable for use as a seed
 */
export function getRandomSeed(): number {
  return Math.random() * (9007199254740990 + 9007199254740990) - 9007199254740991;
}

/**
 * Validates that a chunk ID is valid
 * @param id Chunk ID [x, z]
 * @returns True if valid, false otherwise
 */
export function validateChunkID(id: number[]): boolean {
  if (id == null || id == undefined) return false;
  if (id[0] == null || id[0] == undefined) return false;
  if (id[1] == null || id[1] == undefined) return false;
  return true;
}

/**
 * Creates a string key from chunk ID for use in maps
 * @param chunkX Chunk X coordinate
 * @param chunkZ Chunk Z coordinate
 * @returns String key "x,z"
 */
export function chunkIDToKey(chunkX: number, chunkZ: number): string {
  return `${chunkX},${chunkZ}`;
}

/**
 * Parses a chunk key back to chunk ID
 * @param key String key "x,z"
 * @returns Chunk ID [x, z]
 */
export function keyToChunkID(key: string): XZ {
  const parts = key.split(',').map(Number);
  return [parts[0], parts[1]];
}
