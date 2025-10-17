import { makeNoise2D } from 'open-simplex-noise';
import { CHUNK_SIZE } from '@voxel/core';

/**
 * Normal/Hilly world generator with terrain variation
 */
export class WorldGenerator {
  private noise2D: ReturnType<typeof makeNoise2D>;
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
    this.noise2D = makeNoise2D(seed);
  }

  getHeight(x: number, z: number): number {
    const scale = 0.02;
    const noise = this.noise2D(x * scale, z * scale);

    // Map noise [-1, 1] to height [32, 96]
    const baseHeight = 64;
    const amplitude = 32;

    return Math.floor(baseHeight + noise * amplitude);
  }

  /**
   * Generate a chunk with hilly terrain
   */
  generateChunk(chunkX: number, chunkZ: number): Uint8Array {
    console.log(`[WorldGenerator] Generating chunk at (${chunkX}, ${chunkZ})`);
    const data = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const worldX = chunkX * CHUNK_SIZE + x;
        const worldZ = chunkZ * CHUNK_SIZE + z;
        const height = this.getHeight(worldX, worldZ);

        for (let y = 0; y < CHUNK_SIZE; y++) {
          const worldY = y;
          const index = x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;

          if (worldY < height - 4) {
            data[index] = 1; // Stone
          } else if (worldY < height - 1) {
            data[index] = 2; // Dirt
          } else if (worldY < height) {
            data[index] = 3; // Grass
          } else {
            data[index] = 0; // Air
          }
        }
      }
    }

    return data;
  }

  getSeed(): number {
    return this.seed;
  }
}
