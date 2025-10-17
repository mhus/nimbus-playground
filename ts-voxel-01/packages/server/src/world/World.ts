import type { WorldConfig } from '@voxel/core';
import { CHUNK_SIZE } from '@voxel/core';
import { chunkPositionToKey } from '@voxel/core';
import { WorldGenerator } from './WorldGenerator.js';
import { FlatWorldGenerator } from './FlatWorldGenerator.js';
import { WorldPersistence, type WorldMetadata } from './WorldPersistence.js';

export type GeneratorType = 'flat' | 'normal';

export class World {
  private config: WorldConfig;
  private chunks = new Map<string, Uint8Array>();
  private generator: WorldGenerator | FlatWorldGenerator;
  private generatorType: GeneratorType;
  private persistence: WorldPersistence;
  private autoSaveInterval?: NodeJS.Timeout;
  private modifiedChunks = new Set<string>();

  constructor(config: WorldConfig, generatorType: GeneratorType, worldPath: string) {
    this.config = config;
    this.generatorType = generatorType;
    this.persistence = new WorldPersistence(worldPath);

    // Select generator
    if (generatorType === 'flat') {
      this.generator = new FlatWorldGenerator(config.seed);
    } else {
      this.generator = new WorldGenerator(config.seed);
    }
  }

  async init(): Promise<void> {
    await this.persistence.init();

    // Try to load existing world
    const exists = await this.persistence.worldExists();
    if (exists) {
      await this.loadWorld();
    } else {
      await this.createNewWorld();
    }

    // Start auto-save (every 30 seconds)
    this.startAutoSave();
  }

  private async createNewWorld(): Promise<void> {
    const metadata: WorldMetadata = {
      name: 'world',
      seed: this.config.seed,
      generator: this.generatorType,
      version: 2,
      createdAt: Date.now(),
      chunkSize: this.config.chunkSize,
      worldSize: this.config.worldSize,
    };

    await this.persistence.saveWorldMetadata(metadata);
    console.log(`Created new ${this.generatorType} world with seed ${this.config.seed}`);

    // Generate all chunks immediately
    await this.generateAllChunks();
  }

  private async generateAllChunks(): Promise<void> {
    const chunkCount = this.config.worldSize / this.config.chunkSize;
    const totalChunks = chunkCount * chunkCount;

    console.log(`[World] Generating ${totalChunks} chunks (${chunkCount}x${chunkCount})...`);

    let generatedCount = 0;
    for (let x = 0; x < chunkCount; x++) {
      for (let z = 0; z < chunkCount; z++) {
        const chunkX = x;
        const chunkY = 0; // Only y=0 layer for now
        const chunkZ = z;

        const key = chunkPositionToKey(chunkX, chunkY, chunkZ);
        const chunk = this.generateChunk(chunkX, chunkZ);

        this.chunks.set(key, chunk);
        this.modifiedChunks.add(key);

        generatedCount++;
        if (generatedCount % 10 === 0 || generatedCount === totalChunks) {
          console.log(`[World] Generated ${generatedCount}/${totalChunks} chunks`);
        }
      }
    }

    console.log(`[World] All ${totalChunks} chunks generated, saving to disk...`);
    await this.saveModifiedChunks();
    console.log('[World] Initial world generation complete');
  }

  private async loadWorld(): Promise<void> {
    const metadata = await this.persistence.loadWorldMetadata();
    if (metadata) {
      console.log(`Loaded existing ${metadata.generator} world (seed: ${metadata.seed}, ${metadata.chunkSize}x${metadata.worldSize})`);
      // Update config with loaded metadata
      this.config.seed = metadata.seed;
      this.config.chunkSize = metadata.chunkSize || this.config.chunkSize;
      this.config.worldSize = metadata.worldSize || this.config.worldSize;
      this.generatorType = metadata.generator;

      // Recreate generator with correct type
      if (metadata.generator === 'flat') {
        this.generator = new FlatWorldGenerator(metadata.seed);
      } else {
        this.generator = new WorldGenerator(metadata.seed);
      }
    }
  }

  private startAutoSave(): void {
    console.log('[World] Auto-save enabled (every 30 seconds)');
    this.autoSaveInterval = setInterval(() => {
      console.log('[World] Auto-save triggered');
      this.saveModifiedChunks();
    }, 30000); // 30 seconds
  }

  async saveModifiedChunks(): Promise<void> {
    if (this.modifiedChunks.size === 0) {
      console.log('[World] Auto-save: No modified chunks to save');
      return;
    }

    console.log(`[World] Saving ${this.modifiedChunks.size} modified chunks...`);

    let savedCount = 0;
    for (const key of this.modifiedChunks) {
      const [x, , z] = key.split(',').map(Number);
      const chunk = this.chunks.get(key);

      if (chunk) {
        try {
          await this.persistence.saveChunk(x, z, chunk, {
            version: 2,
            stage: 1,
          });
          savedCount++;
          console.log(`[World]   Saved chunk (${x},${z})`);
        } catch (error) {
          console.error(`[World]   Failed to save chunk (${x},${z}):`, error);
        }
      }
    }

    this.modifiedChunks.clear();
    console.log(`[World] Successfully saved ${savedCount} chunks`);
  }

  async shutdown(): Promise<void> {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    // Save all modified chunks before shutdown
    await this.saveModifiedChunks();
  }

  getChunk(x: number, y: number, z: number): Uint8Array | undefined {
    const key = chunkPositionToKey(x, y, z);
    let chunk = this.chunks.get(key);

    if (!chunk) {
      console.log(`[World] Generating chunk (${x},${y},${z})`);
      // Try to load from disk first, then generate
      chunk = this.loadOrGenerateChunk(x, y, z);
      this.chunks.set(key, chunk);
    }

    return chunk;
  }

  private loadOrGenerateChunk(x: number, y: number, z: number): Uint8Array {
    // For now, we only support y=0 chunks (single vertical layer)
    if (y !== 0) {
      return new Uint8Array(this.config.chunkSize ** 3);
    }

    // Since all chunks are pre-generated, this should normally not happen
    // But as a fallback, we generate the chunk on-demand
    console.log(`[World] Warning: Chunk (${x},${y},${z}) was not pre-generated, generating now`);
    const chunk = this.generateChunk(x, z);

    // Mark newly generated chunk as modified so it will be saved
    const key = chunkPositionToKey(x, y, z);
    this.modifiedChunks.add(key);

    return chunk;
  }

  private generateChunk(x: number, z: number): Uint8Array {
    // Use the generator's generateChunk method
    return this.generator.generateChunk(x, z);
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

    // Mark chunk as modified
    const key = chunkPositionToKey(chunkX, chunkY, chunkZ);
    this.modifiedChunks.add(key);
    console.log(`[World] Block changed at (${x},${y},${z}) - Chunk (${chunkX},${chunkY},${chunkZ}) marked as modified (${this.modifiedChunks.size} total)`);
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
