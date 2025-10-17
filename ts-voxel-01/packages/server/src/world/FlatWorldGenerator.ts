import { CHUNK_SIZE } from '@voxel/core';

/**
 * Flat world generator - creates a flat world with layered terrain
 * Based on voxelsrv-server flat generator
 */
export class FlatWorldGenerator {
  private seed: number;

  // Block IDs
  private readonly BLOCKS = {
    AIR: 0,
    STONE: 1,
    DIRT: 2,
    GRASS: 3,
  };

  // Layer heights
  private readonly GRASS_LEVEL = 50;
  private readonly DIRT_START = 45;
  private readonly BEDROCK_LEVEL = 0;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generate a chunk of the flat world
   */
  generateChunk(chunkX: number, chunkZ: number): Uint8Array {
    const data = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let y = 0; y < CHUNK_SIZE; y++) {
          const worldY = y; // Since we only have one vertical chunk (y=0)
          const index = x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;

          // Layer logic from original flat generator
          if (worldY > this.GRASS_LEVEL) {
            data[index] = this.BLOCKS.AIR;
          } else if (worldY === this.GRASS_LEVEL) {
            data[index] = this.BLOCKS.GRASS;
          } else if (worldY > this.DIRT_START) {
            data[index] = this.BLOCKS.DIRT;
          } else if (worldY === this.BEDROCK_LEVEL) {
            // Bedrock at bottom (if chunk includes y=0)
            data[index] = this.BLOCKS.STONE;
          } else {
            data[index] = this.BLOCKS.STONE;
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
