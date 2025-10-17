/**
 * Main Voxel Server class
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Registry } from './registry/Registry.js';
import { WorldManager } from './world/WorldManager.js';
import { EntityManager } from './entities/EntityManager.js';
import { FlatWorldGenerator } from './world/generators/FlatWorldGenerator.js';
import { NormalWorldGenerator } from './world/generators/NormalWorldGenerator.js';
import { AssetManager } from './assets/AssetManager.js';
import { AssetServer } from './assets/AssetServer.js';
import { ALL_DEFAULT_BLOCKS } from '@voxel-02/core';
import { createRegistrySyncMessage, createAssetManifestMessage } from '@voxel-02/protocol';
import type { World } from './world/World.js';
import * as path from 'path';

export interface ServerConfig {
  port: number;
  httpPort?: number;  // Optional HTTP port for assets (defaults to port + 1)
  worldName: string;
  worldSeed: number;
  generator: 'flat' | 'normal';
  assetsDir?: string;  // Optional assets directory (defaults to './assets')
}

/**
 * Main server class
 */
export class VoxelServer {
  private config: ServerConfig;
  private wss?: WebSocketServer;
  private assetServer?: AssetServer;

  readonly registry: Registry;
  readonly worldManager: WorldManager;
  readonly entityManager: EntityManager;
  readonly assetManager: AssetManager;

  private mainWorld?: World;
  private running = false;

  constructor(config: ServerConfig) {
    this.config = config;

    // Initialize systems
    this.registry = new Registry();
    this.worldManager = new WorldManager(this.registry);
    this.entityManager = new EntityManager();

    // Initialize asset manager
    const assetsDir = config.assetsDir || path.join(process.cwd(), 'assets');
    const httpPort = config.httpPort || config.port + 1;
    const baseUrl = `http://localhost:${httpPort}/assets`;
    this.assetManager = new AssetManager(assetsDir, baseUrl);

    // Register world generators
    this.worldManager.addGenerator('flat', FlatWorldGenerator);
    this.worldManager.addGenerator('normal', NormalWorldGenerator);

    // Register default blocks
    this.registerDefaultBlocks();

    // Register default items
    this.registerDefaultItems();
  }

  /**
   * Register default blocks from @voxel-02/core
   */
  private registerDefaultBlocks(): void {
    console.log(`[Server] Registering ${ALL_DEFAULT_BLOCKS.length} default blocks...`);

    for (const blockType of ALL_DEFAULT_BLOCKS) {
      this.registry.addBlock({
        name: blockType.name,
        solid: blockType.solid !== false,
        transparent: blockType.transparent || false,
        texture: blockType.texture,
        hardness: blockType.hardness || 0,
        miningtime: blockType.miningtime || 0,
        tool: blockType.tool || 'any',
        unbreakable: blockType.unbreakable || false,
      });
    }

    console.log(`[Server] Registered ${ALL_DEFAULT_BLOCKS.length} blocks`);
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

    // Initialize asset manager
    await this.assetManager.initialize();

    // Start asset HTTP server
    const httpPort = this.config.httpPort || this.config.port + 1;
    this.assetServer = new AssetServer(this.assetManager, httpPort);
    await this.assetServer.start();

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
    console.log(`[Server] Asset HTTP server on port ${httpPort}`);
    console.log(`[Server] World: ${this.config.worldName} (seed: ${this.config.worldSeed})`);
    console.log(`[Server] Generator: ${this.config.generator}`);
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    console.log('[Server] Stopping server...');

    this.running = false;

    // Close asset HTTP server
    if (this.assetServer) {
      await this.assetServer.stop();
    }

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

    // Send asset manifest
    this.sendAssetManifest(ws);

    // Send registry sync (dynamic block/item/entity definitions)
    this.sendRegistrySync(ws);
  }

  /**
   * Send asset manifest to client
   */
  private sendAssetManifest(ws: WebSocket): void {
    const manifest = this.assetManager.getManifest();
    const assetMessage = createAssetManifestMessage(manifest);

    ws.send(JSON.stringify(assetMessage));
    console.log(`[Server] Sent asset manifest: ${manifest.assets.length} assets`);
  }

  /**
   * Send registry synchronization to client
   */
  private sendRegistrySync(ws: WebSocket): void {
    const blocks = Array.from(this.registry.getAllBlocks().values());
    const items = Array.from(this.registry.getAllItems().values());

    const registryMessage = createRegistrySyncMessage(
      blocks,
      items,
      [], // No entities yet
      '1.0.0'
    );

    ws.send(JSON.stringify(registryMessage));
    console.log(`[Server] Sent registry sync: ${blocks.length} blocks, ${items.length} items`);
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
      console.log(`[Server] Chunk request: ${chunkX}, ${chunkZ}`);
      const chunk = await this.mainWorld.getChunk([chunkX, chunkZ]);

      console.log(`[Server] Sending chunk ${chunkX}, ${chunkZ} with ${chunk.data.length} blocks`);

      ws.send(JSON.stringify({
        type: 'chunk_data',
        chunkX,
        chunkZ,
        data: Array.from(chunk.data),  // Convert Uint16Array to regular array for JSON
      }));

      console.log(`[Server] Sent chunk ${chunkX}, ${chunkZ}`);
    } catch (error) {
      console.error(`[Server] Failed to send chunk (${chunkX}, ${chunkZ}):`, error);
    }
  }
}
