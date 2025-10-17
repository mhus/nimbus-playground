import type { WorldConfig } from '@voxel/core';
import { CHUNK_SIZE } from '@voxel/core';
import { chunkPositionToKey } from '@voxel/core';
import { WorldGenerator } from './WorldGenerator.js';

export class World {
  private config: WorldConfig;
  private chunks = new Map<string, Uint8Array>();
  private generator: WorldGenerator;

  constructor(config: WorldConfig) {
    this.config = config;
    this.generator = new WorldGenerator(config.seed);
  }

  getChunk(x: number, y: number, z: number): Uint8Array | undefined {
    const key = chunkPositionToKey(x, y, z);
    let chunk = this.chunks.get(key);

    if (!chunk) {
      chunk = this.generateChunk(x, y, z);
      this.chunks.set(key, chunk);
    }

    return chunk;
  }

  private generateChunk(x: number, y: number, z: number): Uint8Array {
    const chunkSize = this.config.chunkSize;
    const data = new Uint8Array(chunkSize * chunkSize * chunkSize);

    for (let lx = 0; lx < chunkSize; lx++) {
      for (let lz = 0; lz < chunkSize; lz++) {
        const worldX = x * chunkSize + lx;
        const worldZ = z * chunkSize + lz;

        const height = this.generator.getHeight(worldX, worldZ);

        for (let ly = 0; ly < chunkSize; ly++) {
          const worldY = y * chunkSize + ly;
          const index = lx + ly * chunkSize + lz * chunkSize * chunkSize;

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

  setBlock(x: number, y: number, z: number, blockType: number): void {
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkY = Math.floor(y / CHUNK_SIZE);
    const chunkZ = Math.floor(z / CHUNK_SIZE);

    const chunk = this.getChunk(chunkX, chunkY, chunkZ);
    if (!chunk) return;

    const localX = x - chunkX * CHUNK_SIZE;
    const localY = y - chunkY * CHUNK_SIZE;
    const localZ = z - chunkZ * CHUNK_SIZE;

    const index = localX + localY * CHUNK_SIZE + localZ * CHUNK_SIZE * CHUNK_SIZE;
    chunk[index] = blockType;
  }

  getBlock(x: number, y: number, z: number): number {
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkY = Math.floor(y / CHUNK_SIZE);
    const chunkZ = Math.floor(z / CHUNK_SIZE);

    const chunk = this.getChunk(chunkX, chunkY, chunkZ);
    if (!chunk) return 0;

    const localX = x - chunkX * CHUNK_SIZE;
    const localY = y - chunkY * CHUNK_SIZE;
    const localZ = z - chunkZ * CHUNK_SIZE;

    const index = localX + localY * CHUNK_SIZE + localZ * CHUNK_SIZE * CHUNK_SIZE;
    return chunk[index];
  }

  getBlockTypes() {
    return [
      { id: 0, name: 'air', solid: false, transparent: true },
      { id: 1, name: 'stone', solid: true, transparent: false },
      { id: 2, name: 'dirt', solid: true, transparent: false },
      { id: 3, name: 'grass', solid: true, transparent: false },
    ];
  }
}
