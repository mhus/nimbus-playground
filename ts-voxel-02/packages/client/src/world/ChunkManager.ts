/**
 * Chunk Manager (migrated from tmp/voxelsrv/src/lib/gameplay/world.ts)
 */

import type { WebSocketClient } from '../network/WebSocketClient';
import type { Scene } from '@babylonjs/core';
import { ChunkRenderer } from '../rendering/ChunkRenderer';
import type { TextureAtlas } from '../rendering/TextureAtlas';
import type { ClientRegistry } from '../registry/ClientRegistry';
import type { ChunkData } from '@voxel-02/core';

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

  // Dynamic loading settings - browser-specific values
  private renderDistance = this.getBrowserSpecificRenderDistance();
  private unloadDistance = this.getBrowserSpecificUnloadDistance();
  private lastPlayerChunk: { x: number, z: number } = { x: 0, z: 0 };
  private updateInterval = 1000; // Check for new chunks every 1 second
  private lastUpdateTime = 0;

  /**
   * Detect if browser is Safari
   */
  private isSafari(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium');
  }

  /**
   * Get browser-specific render distance
   * Safari: 3, Chrome: 1
   */
  private getBrowserSpecificRenderDistance(): number {
    return this.isSafari() ? 3 : 2;
  }

  /**
   * Get browser-specific unload distance
   * Safari: 4, Chrome: 2
   */
  private getBrowserSpecificUnloadDistance(): number {
    return this.isSafari() ? 4 : 3;
  }

  constructor(socket: WebSocketClient, scene: Scene, atlas: TextureAtlas, registry: ClientRegistry) {
    this.socket = socket;
    this.scene = scene;
    this.renderer = new ChunkRenderer(scene, atlas, registry);

    // Log browser-specific settings
    console.log(`[ChunkManager] Browser detected: ${this.isSafari() ? 'Safari' : 'Chrome/Other'}`);
    console.log(`[ChunkManager] Render distance: ${this.renderDistance}, Unload distance: ${this.unloadDistance}`);

    // Listen for chunk data from server
    this.socket.on('chunk_data', (data) => {
      this.onChunkData(data);
    });

    this.socket.on('WorldChunkLoad', (data) => {
      this.onChunkLoad(data);
    });

    // Start update loop for dynamic chunk loading
    this.startUpdateLoop();
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
  private async renderChunk(chunk: ChunkData): Promise<void> {
    console.log(`[ChunkManager] Starting to render chunk ${chunk.chunkX},${chunk.chunkZ}`);

    const key = this.getChunkKey(chunk.chunkX, chunk.chunkZ);

    // Remove old mesh if exists
    const oldMesh = this.chunkMeshes.get(key);
    if (oldMesh) {
      oldMesh.dispose();
    }

    try {
      // Create new mesh (async - loads textures into atlas)
      console.log(`[ChunkManager] Calling createChunkMesh for ${chunk.chunkX},${chunk.chunkZ}`);
      const mesh = await this.renderer.createChunkMesh(chunk);
      this.chunkMeshes.set(key, mesh);

      console.log(`[ChunkManager] Rendered chunk ${chunk.chunkX},${chunk.chunkZ}`);
    } catch (error) {
      console.error(`[ChunkManager] Error rendering chunk ${chunk.chunkX},${chunk.chunkZ}:`, error);
    }
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
   * Start update loop for dynamic chunk loading
   */
  private startUpdateLoop(): void {
    this.scene.onBeforeRenderObservable.add(() => {
      const currentTime = performance.now();
      if (currentTime - this.lastUpdateTime > this.updateInterval) {
        this.lastUpdateTime = currentTime;
        this.updateChunks();
      }
    });
  }

  /**
   * Update chunks based on camera position
   */
  updateChunksAroundPosition(worldX: number, worldZ: number): void {
    const chunkX = Math.floor(worldX / this.chunkSize);
    const chunkZ = Math.floor(worldZ / this.chunkSize);

    // Check if player moved to a new chunk
    if (chunkX !== this.lastPlayerChunk.x || chunkZ !== this.lastPlayerChunk.z) {
      console.log(`[ChunkManager] Player moved to chunk (${chunkX}, ${chunkZ})`);
      this.lastPlayerChunk = { x: chunkX, z: chunkZ };

      // Request new chunks
      this.requestChunksAround(worldX, worldZ, this.renderDistance);

      // Unload far chunks
      this.unloadDistantChunks(chunkX, chunkZ);
    }
  }

  /**
   * Update chunks (called periodically)
   */
  private updateChunks(): void {
    // Get camera position from scene
    const camera = this.scene.activeCamera;
    if (!camera) return;

    const position = camera.position;
    this.updateChunksAroundPosition(position.x, position.z);
  }

  /**
   * Unload chunks that are too far from player
   */
  private unloadDistantChunks(playerChunkX: number, playerChunkZ: number): void {
    const chunksToUnload: string[] = [];

    for (const [key, chunk] of this.chunks.entries()) {
      const dx = Math.abs(chunk.chunkX - playerChunkX);
      const dz = Math.abs(chunk.chunkZ - playerChunkZ);
      const distance = Math.max(dx, dz);

      if (distance > this.unloadDistance) {
        chunksToUnload.push(key);
      }
    }

    for (const key of chunksToUnload) {
      const parts = key.split(',');
      const chunkX = parseInt(parts[0]);
      const chunkZ = parseInt(parts[1]);
      this.unloadChunk(chunkX, chunkZ);
    }

    if (chunksToUnload.length > 0) {
      console.log(`[ChunkManager] Unloaded ${chunksToUnload.length} distant chunks`);
    }
  }

  /**
   * Set render distance (how many chunks to load around player)
   */
  setRenderDistance(distance: number): void {
    this.renderDistance = distance;
    console.log(`[ChunkManager] Render distance set to ${distance} chunks`);
  }

  /**
   * Set unload distance (chunks further than this will be unloaded)
   */
  setUnloadDistance(distance: number): void {
    this.unloadDistance = distance;
    console.log(`[ChunkManager] Unload distance set to ${distance} chunks`);
  }

  /**
   * Get render distance
   */
  getRenderDistance(): number {
    return this.renderDistance;
  }

  /**
   * Get current player chunk
   */
  getPlayerChunk(): { x: number, z: number } {
    return { ...this.lastPlayerChunk };
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
