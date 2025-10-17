/**
 * World class - represents a single world with chunks
 */

import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';
import type { XYZ, XZ, WorldMetadata, ChunkData } from '@voxel-02/core';
import { chunkIDToKey, keyToChunkID, globalToChunk, CHUNK_SIZE } from '@voxel-02/core';
import type { WorldGenerator } from './generators/WorldGenerator.js';

const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);

interface ChunkMetadata {
  version: number;
  stage: number;
  lastUse: number;
  forceload: boolean;
}

/**
 * Represents a single world
 */
export class World {
  private metadata: WorldMetadata;
  private generator: WorldGenerator;
  private worldPath: string;
  private chunksPath: string;

  private chunks: Map<string, ChunkData> = new Map();
  private chunkMetadata: Map<string, ChunkMetadata> = new Map();
  private modifiedChunks: Set<string> = new Set();

  private autoSaveInterval?: NodeJS.Timeout;
  private unloadInterval?: NodeJS.Timeout;

  private entities: Map<string, any> = new Map();

  constructor(metadata: WorldMetadata, generator: WorldGenerator, worldsDir: string) {
    this.metadata = metadata;
    this.generator = generator;
    this.worldPath = path.join(worldsDir, metadata.name);
    this.chunksPath = path.join(this.worldPath, 'chunks');
  }

  /**
   * Initialize world (load or create)
   */
  async init(): Promise<void> {
    // Ensure directories exist
    if (!fs.existsSync(this.worldPath)) {
      fs.mkdirSync(this.worldPath, { recursive: true });
    }
    if (!fs.existsSync(this.chunksPath)) {
      fs.mkdirSync(this.chunksPath, { recursive: true });
    }

    // Save metadata
    await this.saveMetadata();

    // Start auto-save (every 30 seconds)
    this.autoSaveInterval = setInterval(() => {
      this.autoSave();
    }, 30000);

    // Start chunk unload (every 5 seconds)
    this.unloadInterval = setInterval(() => {
      this.unloadOldChunks();
    }, 5000);

    console.log(`[World:${this.metadata.name}] Initialized`);
  }

  /**
   * Save world metadata
   */
  private async saveMetadata(): Promise<void> {
    const metadataPath = path.join(this.worldPath, 'world.json');
    const data = JSON.stringify(this.metadata, null, 2);
    fs.writeFileSync(metadataPath, data);
  }

  /**
   * Get a chunk (load or generate if needed)
   */
  async getChunk(chunkID: XZ): Promise<ChunkData> {
    const key = chunkIDToKey(chunkID[0], chunkID[1]);

    // Already loaded?
    if (this.chunks.has(key)) {
      this.touchChunk(key);
      return this.chunks.get(key)!;
    }

    // Try to load from disk
    if (await this.chunkExistsOnDisk(chunkID)) {
      const chunk = await this.loadChunk(chunkID);
      this.chunks.set(key, chunk);
      this.chunkMetadata.set(key, {
        version: 2,
        stage: 1,
        lastUse: Date.now(),
        forceload: false,
      });
      return chunk;
    }

    // Generate new chunk
    console.log(`[World:${this.metadata.name}] Generating chunk ${key}`);
    const chunk = await this.generator.generateChunk(chunkID[0], chunkID[1], this.metadata.chunkSize, this.metadata.worldHeight);
    this.chunks.set(key, chunk);
    this.chunkMetadata.set(key, {
      version: 2,
      stage: 1,
      lastUse: Date.now(),
      forceload: false,
    });
    this.modifiedChunks.add(key);

    return chunk;
  }

  /**
   * Check if chunk exists on disk
   */
  private async chunkExistsOnDisk(chunkID: XZ): Promise<boolean> {
    const key = chunkIDToKey(chunkID[0], chunkID[1]);
    const chunkPath = path.join(this.chunksPath, `${key}.chk`);
    return fs.existsSync(chunkPath);
  }

  /**
   * Load chunk from disk
   */
  private async loadChunk(chunkID: XZ): Promise<ChunkData> {
    const key = chunkIDToKey(chunkID[0], chunkID[1]);
    const chunkPath = path.join(this.chunksPath, `${key}.chk`);

    const compressedData = fs.readFileSync(chunkPath);
    const data = await inflate(compressedData);

    // Simple format: just the raw Uint16Array
    const blockData = new Uint16Array(data.buffer, data.byteOffset, data.byteLength / 2);

    return {
      chunkX: chunkID[0],
      chunkZ: chunkID[1],
      data: blockData,
      height: this.metadata.worldHeight,
    };
  }

  /**
   * Save chunk to disk
   */
  private async saveChunk(chunkID: XZ): Promise<void> {
    const key = chunkIDToKey(chunkID[0], chunkID[1]);
    const chunk = this.chunks.get(key);
    if (!chunk) return;

    const chunkPath = path.join(this.chunksPath, `${key}.chk`);

    // Simple format: just compress the raw Uint16Array
    const buffer = chunk.data instanceof Uint16Array
      ? Buffer.from(chunk.data.buffer, chunk.data.byteOffset, chunk.data.byteLength)
      : Buffer.from(new Uint16Array(chunk.data).buffer);
    const compressed = await deflate(buffer);

    fs.writeFileSync(chunkPath, compressed);
  }

  /**
   * Mark chunk as recently used
   */
  private touchChunk(key: string): void {
    const meta = this.chunkMetadata.get(key);
    if (meta) {
      meta.lastUse = Date.now();
    }
  }

  /**
   * Get block at world position
   */
  async getBlock(pos: XYZ): Promise<number> {
    const chunkInfo = globalToChunk(pos);
    const chunk = await this.getChunk(chunkInfo.id);

    const [lx, ly, lz] = chunkInfo.pos;
    const index = lx + ly * this.metadata.chunkSize + lz * this.metadata.chunkSize * this.metadata.chunkSize;

    return chunk.data[index] || 0;
  }

  /**
   * Set block at world position
   */
  async setBlock(pos: XYZ, blockID: number): Promise<void> {
    const chunkInfo = globalToChunk(pos);
    const chunk = await this.getChunk(chunkInfo.id);

    const [lx, ly, lz] = chunkInfo.pos;
    const index = lx + ly * this.metadata.chunkSize + lz * this.metadata.chunkSize * this.metadata.chunkSize;

    chunk.data[index] = blockID;

    const key = chunkIDToKey(chunkInfo.id[0], chunkInfo.id[1]);
    this.modifiedChunks.add(key);
  }

  /**
   * Auto-save modified chunks
   */
  private async autoSave(): Promise<void> {
    if (this.modifiedChunks.size === 0) return;

    console.log(`[World:${this.metadata.name}] Auto-saving ${this.modifiedChunks.size} chunks...`);

    const promises: Promise<void>[] = [];
    for (const key of this.modifiedChunks) {
      const chunkID = keyToChunkID(key);
      promises.push(this.saveChunk(chunkID));
    }

    await Promise.all(promises);
    this.modifiedChunks.clear();
    console.log(`[World:${this.metadata.name}] Auto-save complete`);
  }

  /**
   * Unload old chunks that haven't been used recently
   */
  private async unloadOldChunks(): Promise<void> {
    const now = Date.now();
    const maxAge = 60000; // 60 seconds

    const toUnload: string[] = [];

    for (const [key, meta] of this.chunkMetadata.entries()) {
      if (!meta.forceload && now - meta.lastUse > maxAge) {
        toUnload.push(key);
      }
    }

    for (const key of toUnload) {
      // Save if modified
      if (this.modifiedChunks.has(key)) {
        const chunkID = keyToChunkID(key);
        await this.saveChunk(chunkID);
        this.modifiedChunks.delete(key);
      }

      this.chunks.delete(key);
      this.chunkMetadata.delete(key);
    }

    if (toUnload.length > 0) {
      console.log(`[World:${this.metadata.name}] Unloaded ${toUnload.length} old chunks`);
    }
  }

  /**
   * Get world metadata
   */
  getMetadata(): WorldMetadata {
    return { ...this.metadata };
  }

  /**
   * Get world name
   */
  getName(): string {
    return this.metadata.name;
  }

  /**
   * Shutdown world (save and cleanup)
   */
  async shutdown(): Promise<void> {
    console.log(`[World:${this.metadata.name}] Shutting down...`);

    // Stop intervals
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    if (this.unloadInterval) {
      clearInterval(this.unloadInterval);
    }

    // Save all modified chunks
    await this.autoSave();

    console.log(`[World:${this.metadata.name}] Shut down complete`);
  }
}
