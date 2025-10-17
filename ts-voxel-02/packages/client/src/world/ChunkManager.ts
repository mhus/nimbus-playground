/**
 * Chunk Manager (migrated from tmp/voxelsrv/src/lib/gameplay/world.ts)
 */

import type { WebSocketClient } from '../network/WebSocketClient';
import type { Scene } from '@babylonjs/core';
import { ChunkRenderer } from '../rendering/ChunkRenderer';

export interface ChunkData {
  chunkX: number;
  chunkZ: number;
  data: Uint16Array | number[];
  height?: number;
}

/**
 * Manages chunk loading and rendering
 */
export class ChunkManager {
  private socket: WebSocketClient;
  private scene: Scene;
  private chunks: Map<string, ChunkData> = new Map();
  private chunkMeshes: Map<string, any> = new Map();
  private renderer: ChunkRenderer;
  private chunkSize = 32;

  constructor(socket: WebSocketClient, scene: Scene) {
    this.socket = socket;
    this.scene = scene;
    this.renderer = new ChunkRenderer(scene);

    // Listen for chunk data from server
    this.socket.on('chunk_data', (data) => {
      this.onChunkData(data);
    });

    this.socket.on('WorldChunkLoad', (data) => {
      this.onChunkLoad(data);
    });
  }

  /**
   * Request chunks around position
   */
  requestChunksAround(x: number, z: number, radius: number = 3): void {
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkZ = Math.floor(z / this.chunkSize);

    console.log(`[ChunkManager] Requesting chunks around ${chunkX},${chunkZ} (radius ${radius})`);

    for (let cx = chunkX - radius; cx <= chunkX + radius; cx++) {
      for (let cz = chunkZ - radius; cz <= chunkZ + radius; cz++) {
        this.requestChunk(cx, cz);
      }
    }
  }

  /**
   * Request single chunk
   */
  private requestChunk(chunkX: number, chunkZ: number): void {
    const key = this.getChunkKey(chunkX, chunkZ);

    // Don't request if already loaded
    if (this.chunks.has(key)) {
      return;
    }

    console.log(`[ChunkManager] Requesting chunk ${chunkX},${chunkZ}`);
    this.socket.send('request_chunk', { chunkX, chunkZ });
  }

  /**
   * Handle chunk data from server (simple JSON format)
   */
  private onChunkData(data: any): void {
    const { chunkX, chunkZ, data: chunkData } = data;

    if (chunkX === undefined || chunkZ === undefined || !chunkData) {
      console.warn('[ChunkManager] Invalid chunk data received');
      return;
    }

    console.log(`[ChunkManager] Received chunk ${chunkX},${chunkZ} (${chunkData.length} blocks)`);

    const chunk: ChunkData = {
      chunkX,
      chunkZ,
      data: Array.isArray(chunkData) ? new Uint16Array(chunkData) : chunkData,
    };

    const key = this.getChunkKey(chunkX, chunkZ);
    this.chunks.set(key, chunk);

    // Render chunk
    this.renderChunk(chunk);
  }

  /**
   * Handle chunk load (protobuf format from old server)
   */
  private onChunkLoad(data: any): void {
    const { x, z, data: chunkData, height, compressed } = data;

    console.log(`[ChunkManager] Loading chunk ${x},${z} (compressed: ${compressed})`);

    // TODO: Handle decompression if needed
    const chunk: ChunkData = {
      chunkX: x,
      chunkZ: z,
      data: chunkData,
      height: height || 256,
    };

    const key = this.getChunkKey(x, z);
    this.chunks.set(key, chunk);

    // Render chunk
    this.renderChunk(chunk);
  }

  /**
   * Render chunk
   */
  private renderChunk(chunk: ChunkData): void {
    const key = this.getChunkKey(chunk.chunkX, chunk.chunkZ);

    // Remove old mesh if exists
    const oldMesh = this.chunkMeshes.get(key);
    if (oldMesh) {
      oldMesh.dispose();
    }

    // Create new mesh
    const mesh = this.renderer.createChunkMesh(chunk);
    this.chunkMeshes.set(key, mesh);

    console.log(`[ChunkManager] Rendered chunk ${chunk.chunkX},${chunk.chunkZ}`);
  }

  /**
   * Unload chunk
   */
  unloadChunk(chunkX: number, chunkZ: number): void {
    const key = this.getChunkKey(chunkX, chunkZ);

    const mesh = this.chunkMeshes.get(key);
    if (mesh) {
      mesh.dispose();
      this.chunkMeshes.delete(key);
    }

    this.chunks.delete(key);
    console.log(`[ChunkManager] Unloaded chunk ${chunkX},${chunkZ}`);
  }

  /**
   * Get chunk key for map
   */
  private getChunkKey(chunkX: number, chunkZ: number): string {
    return `${chunkX},${chunkZ}`;
  }

  /**
   * Get loaded chunks count
   */
  getLoadedChunksCount(): number {
    return this.chunks.size;
  }

  /**
   * Dispose all chunks
   */
  dispose(): void {
    for (const mesh of this.chunkMeshes.values()) {
      mesh.dispose();
    }
    this.chunkMeshes.clear();
    this.chunks.clear();
  }
}
