/**
 * Flat world generator
 */

import type { ChunkData, XZ } from '@voxel-02/core';
import type { WorldGenerator } from './WorldGenerator.js';

/**
 * Simple flat world generator
 */
export class FlatWorldGenerator implements WorldGenerator {
  readonly name = 'flat';

  private seed: number;
  private groundLevel = 64;
  private grassBlockID = 3;
  private dirtBlockID = 2;
  private stoneBlockID = 1;

  constructor(seed: number) {
    this.seed = seed;
  }

  async generateChunk(chunkX: number, chunkZ: number, chunkSize: number, height: number): Promise<ChunkData> {
    const size = chunkSize * chunkSize * height;
    const data = new Uint16Array(size);

    // Fill chunk with blocks
    for (let x = 0; x < chunkSize; x++) {
      for (let z = 0; z < chunkSize; z++) {
        for (let y = 0; y < height; y++) {
          const index = x + y * chunkSize + z * chunkSize * height;

          if (y < this.groundLevel - 5) {
            // Stone layer
            data[index] = this.stoneBlockID;
          } else if (y < this.groundLevel - 1) {
            // Dirt layer
            data[index] = this.dirtBlockID;
          } else if (y === this.groundLevel - 1) {
            // Grass layer
            data[index] = this.grassBlockID;
          } else {
            // Air
            data[index] = 0;
          }
        }
      }
    }

    return {
      id: [chunkX, chunkZ],
      data,
      height,
    };
  }
}
