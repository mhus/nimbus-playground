/**
 * Normal (terrain) world generator with simplex noise
 */

import { makeNoise2D } from 'open-simplex-noise';
import type { ChunkData, XZ } from '@voxel-02/core';
import type { WorldGenerator } from './WorldGenerator.js';
import type { Registry } from '../../registry/Registry.js';

/**
 * Terrain generator using simplex noise
 */
export class NormalWorldGenerator implements WorldGenerator {
  readonly name = 'normal';

  private seed: number;
  private registry: Registry;
  private noise2D: ReturnType<typeof makeNoise2D>;

  // Block IDs (resolved from registry)
  private grassBlockID: number = 0;
  private dirtBlockID: number = 0;
  private stoneBlockID: number = 0;
  private sandBlockID: number = 0;

  private waterLevel = 62;
  private baseHeight = 64;
  private heightVariation = 32;

  constructor(seed: number, registry: Registry) {
    this.seed = seed;
    this.registry = registry;
    this.noise2D = makeNoise2D(seed);

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
    this.sandBlockID = this.registry.getBlockID('sand') ?? 0;

    console.log(`[NormalWorldGenerator] Block IDs: grass=${this.grassBlockID}, dirt=${this.dirtBlockID}, stone=${this.stoneBlockID}, sand=${this.sandBlockID}`);
  }

  /**
   * Get height at world position
   */
  private getHeight(worldX: number, worldZ: number): number {
    // Multiple octaves of noise for more interesting terrain
    const scale1 = 0.01;
    const scale2 = 0.05;
    const scale3 = 0.1;

    const noise1 = this.noise2D(worldX * scale1, worldZ * scale1);
    const noise2 = this.noise2D(worldX * scale2, worldZ * scale2);
    const noise3 = this.noise2D(worldX * scale3, worldZ * scale3);

    // Combine octaves
    const combined = (noise1 * 0.6 + noise2 * 0.3 + noise3 * 0.1);

    // Convert to height (noise is in range [-1, 1])
    const height = this.baseHeight + combined * this.heightVariation;

    return Math.floor(height);
  }

  async generateChunk(chunkX: number, chunkZ: number, chunkSize: number, height: number): Promise<ChunkData> {
    const size = chunkSize * chunkSize * height;
    const data = new Uint16Array(size);

    // Generate terrain
    for (let x = 0; x < chunkSize; x++) {
      for (let z = 0; z < chunkSize; z++) {
        const worldX = chunkX * chunkSize + x;
        const worldZ = chunkZ * chunkSize + z;

        const terrainHeight = this.getHeight(worldX, worldZ);

        for (let y = 0; y < height; y++) {
          const index = x + y * chunkSize + z * chunkSize * height;

          if (y < terrainHeight - 5) {
            // Stone layer
            data[index] = this.stoneBlockID;
          } else if (y < terrainHeight - 1) {
            // Dirt layer
            data[index] = this.dirtBlockID;
          } else if (y === terrainHeight - 1) {
            // Grass layer (if above water)
            data[index] = y >= this.waterLevel ? this.grassBlockID : this.dirtBlockID;
          } else if (y < this.waterLevel) {
            // Water (placeholder with air for now)
            data[index] = 0;
          } else {
            // Air
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
