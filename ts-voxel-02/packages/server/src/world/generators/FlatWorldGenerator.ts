/**
 * Flat world generator
 */

import type { ChunkData, XZ } from '@voxel-02/core';
import type { WorldGenerator } from './WorldGenerator.js';
import type { Registry } from '../../registry/Registry.js';

/**
 * Simple flat world generator
 */
export class FlatWorldGenerator implements WorldGenerator {
  readonly name = 'flat';

  private seed: number;
  private registry: Registry;
  private groundLevel = 64;

  // Block IDs (resolved from registry)
  private grassBlockID: number = 0;
  private dirtBlockID: number = 0;
  private stoneBlockID: number = 0;

  constructor(seed: number, registry: Registry) {
    this.seed = seed;
    this.registry = registry;

    // Resolve block IDs from registry
    this.resolveBlockIDs();
  }

  /**
   * Resolve block names to IDs from registry
   */
  private resolveBlockIDs(): void {
    this.grassBlockID = this.registry.getBlockID('grass') ?? 0;
    this.dirtBlockID = this.registry.getBlockID('dirt') ?? 0;
    this.stoneBlockID = this.registry.getBlockID('stone') ?? 0;

    console.log(`[FlatWorldGenerator] Block IDs: grass=${this.grassBlockID}, dirt=${this.dirtBlockID}, stone=${this.stoneBlockID}`);
  }

  async generateChunk(chunkX: number, chunkZ: number, chunkSize: number, height: number): Promise<ChunkData> {
    const size = chunkSize * chunkSize * height;
    const data = new Uint16Array(size);

    // Generate flat terrain (only top 2 layers)
    for (let x = 0; x < chunkSize; x++) {
      for (let z = 0; z < chunkSize; z++) {
        for (let y = 0; y < height; y++) {
          const index = x + y * chunkSize + z * chunkSize * height;

          if (y === this.groundLevel - 1) {
            // Top layer: Grass
            data[index] = this.grassBlockID;
          } else if (y === this.groundLevel - 2) {
            // Second layer: Dirt
            data[index] = this.dirtBlockID;
          } else {
            // Everything else: Air
            data[index] = 0;
          }
        }
      }
    }

    return {
      chunkX,
      chunkZ,
      data,
      height,
    };
  }
}
