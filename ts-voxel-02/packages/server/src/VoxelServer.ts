/**
 * Main Voxel Server class
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Registry } from './registry/Registry.js';
import { WorldManager } from './world/WorldManager.js';
import { EntityManager } from './entities/EntityManager.js';
import { FlatWorldGenerator } from './world/generators/FlatWorldGenerator.js';
import { NormalWorldGenerator } from './world/generators/NormalWorldGenerator.js';
import type { World } from './world/World.js';

export interface ServerConfig {
  port: number;
  worldName: string;
  worldSeed: number;
  generator: 'flat' | 'normal';
}

/**
 * Main server class
 */
export class VoxelServer {
  private config: ServerConfig;
  private wss?: WebSocketServer;

  readonly registry: Registry;
  readonly worldManager: WorldManager;
  readonly entityManager: EntityManager;

  private mainWorld?: World;
  private running = false;

  constructor(config: ServerConfig) {
    this.config = config;

    // Initialize systems
    this.registry = new Registry();
    this.worldManager = new WorldManager();
    this.entityManager = new EntityManager();

    // Register world generators
    this.worldManager.addGenerator('flat', FlatWorldGenerator);
    this.worldManager.addGenerator('normal', NormalWorldGenerator);

    // Register default blocks
    this.registerDefaultBlocks();

    // Register default items
    this.registerDefaultItems();
  }

  /**
   * Register default blocks
   */
  private registerDefaultBlocks(): void {
    this.registry.addBlock({
      id: 1,
      name: 'stone',
      solid: true,
      transparent: false,
      texture: 'stone',
      hardness: 3,
      miningtime: 1.5,
      tool: 'pickaxe',
      unbreakable: false,
    });

    this.registry.addBlock({
      id: 2,
      name: 'dirt',
      solid: true,
      transparent: false,
      texture: 'dirt',
      hardness: 1,
      miningtime: 0.5,
      tool: 'any',
      unbreakable: false,
    });

    this.registry.addBlock({
      id: 3,
      name: 'grass',
      solid: true,
      transparent: false,
      texture: ['grass_top', 'grass_side', 'dirt'],
      hardness: 1,
      miningtime: 0.5,
      tool: 'any',
      unbreakable: false,
    });
  }

  /**
   * Register default items
   */
  private registerDefaultItems(): void {
    this.registry.addItem({
      id: 'stone',
      name: 'Stone',
      stackSize: 64,
      texture: 'stone',
      type: 'ItemBlock',
      block: 'stone',
    });

    this.registry.addItem({
      id: 'dirt',
      name: 'Dirt',
      stackSize: 64,
      texture: 'dirt',
      type: 'ItemBlock',
      block: 'dirt',
    });

    this.registry.addItem({
      id: 'grass',
      name: 'Grass Block',
      stackSize: 64,
      texture: 'grass_top',
      type: 'ItemBlock',
      block: 'grass',
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    console.log('[Server] Starting VoxelSrv server...');

    // Finalize registry
    this.registry.loadPalette();
    this.registry.finalize();

    // Create or load main world
    this.mainWorld = await this.worldManager.load(this.config.worldName);
    if (!this.mainWorld) {
      this.mainWorld = await this.worldManager.create({
        name: this.config.worldName,
        seed: this.config.worldSeed,
        generator: this.config.generator,
        chunkSize: 32,
        worldHeight: 256,
      });
    }

    if (!this.mainWorld) {
      throw new Error('Failed to create or load world');
    }

    // Start WebSocket server
    this.wss = new WebSocketServer({ port: this.config.port });

    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    this.running = true;

    console.log(`[Server] Server started on port ${this.config.port}`);
    console.log(`[Server] World: ${this.config.worldName} (seed: ${this.config.worldSeed})`);
    console.log(`[Server] Generator: ${this.config.generator}`);
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    console.log('[Server] Stopping server...');

    this.running = false;

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }

    // Shutdown worlds
    await this.worldManager.shutdownAll();

    console.log('[Server] Server stopped');
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    console.log('[Server] New client connected');

    ws.on('message', (data: Buffer) => {
      this.handleMessage(ws, data);
    });

    ws.on('close', () => {
      console.log('[Server] Client disconnected');
    });

    ws.on('error', (error) => {
      console.error('[Server] WebSocket error:', error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Welcome to VoxelSrv!',
    }));
  }

  /**
   * Handle incoming message
   */
  private handleMessage(ws: WebSocket, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());
      console.log('[Server] Received message:', message.type);

      // Handle different message types
      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', time: Date.now() }));
          break;

        case 'request_chunk':
          this.handleChunkRequest(ws, message.chunkX, message.chunkZ);
          break;

        default:
          console.warn('[Server] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[Server] Failed to handle message:', error);
    }
  }

  /**
   * Handle chunk request
   */
  private async handleChunkRequest(ws: WebSocket, chunkX: number, chunkZ: number): Promise<void> {
    if (!this.mainWorld) return;

    try {
      const chunk = await this.mainWorld.getChunk([chunkX, chunkZ]);

      ws.send(JSON.stringify({
        type: 'chunk_data',
        chunkX,
        chunkZ,
        data: Array.from(chunk.data),  // Convert Uint16Array to regular array for JSON
      }));
    } catch (error) {
      console.error(`[Server] Failed to send chunk (${chunkX}, ${chunkZ}):`, error);
    }
  }
}
