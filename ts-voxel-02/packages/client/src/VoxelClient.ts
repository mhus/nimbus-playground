/**
 * Main VoxelClient class
 */

import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder } from '@babylonjs/core';
import { MainMenu, type ServerInfo } from './gui/MainMenu';
import { WebSocketClient } from './network/WebSocketClient';
import { ChunkManager } from './world/ChunkManager';
import { PlayerController } from './player/PlayerController';
import { ClientRegistry } from './registry/ClientRegistry';
import { ClientAssetManager } from './assets/ClientAssetManager';
import { TextureAtlas } from './rendering/TextureAtlas';
import { createDefaultAtlasConfig } from './rendering/defaultAtlasConfig';
import { RegistryMessageType, AssetMessageType, createRegistryAckMessage } from '@voxel-02/protocol';
import type { RegistryMessage, AssetMessage } from '@voxel-02/protocol';

/**
 * Main client class for VoxelSrv
 */
export class VoxelClient {
  private canvas: HTMLCanvasElement;
  private engine?: Engine;
  private scene?: Scene;
  private camera?: FreeCamera;
  private mainMenu?: MainMenu;
  private socket?: WebSocketClient;
  private chunkManager?: ChunkManager;
  private playerController?: PlayerController;
  private registry: ClientRegistry;
  private assetManager: ClientAssetManager;
  private atlas?: TextureAtlas;
  private connected = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.registry = new ClientRegistry();
    this.assetManager = new ClientAssetManager();
  }

  /**
   * Initialize the client
   */
  async init(): Promise<void> {
    console.log('[Client] Initializing...');

    // Create Babylon.js engine
    this.engine = new Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });

    // Create scene
    this.scene = new Scene(this.engine);
    this.scene.clearColor.set(0.5, 0.7, 1.0, 1.0);  // Sky blue

    // Create camera (detached initially, will be positioned on spawn)
    this.camera = new FreeCamera('camera', new Vector3(0, 80, 0), this.scene);
    this.camera.setTarget(new Vector3(10, 79, 10));

    // Create light
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;

    // Initialize texture atlas (will be loaded after server connection provides asset URL)
    console.log('[Client] Preparing texture atlas...');
    this.atlas = new TextureAtlas(this.scene, createDefaultAtlasConfig());
    // Note: Atlas will be loaded after connecting to server and receiving asset manifest
    console.log('[Client] Texture atlas prepared (will load from server)');

    // Resize handler
    window.addEventListener('resize', () => {
      this.engine?.resize();
    });

    // Start render loop
    this.engine.runRenderLoop(() => {
      this.scene?.render();
    });

    // Show main menu
    this.showMainMenu();

    console.log('[Client] Initialized successfully');
  }

  /**
   * Show main menu
   */
  private showMainMenu(): void {
    if (!this.scene) return;

    this.mainMenu = new MainMenu(this.scene);
    this.mainMenu.show((serverInfo: ServerInfo) => {
      this.connectToServer(serverInfo);
    });
  }

  /**
   * Connect to server
   */
  private async connectToServer(serverInfo: ServerInfo): Promise<void> {
    console.log('[Client] Connecting to server:', serverInfo);

    if (!this.scene) {
      console.error('[Client] Scene not initialized');
      return;
    }

    if (serverInfo.address === 'embedded') {
      console.log('[Client] Starting singleplayer (embedded server)...');
      // TODO: Start embedded server
    } else {
      console.log(`[Client] Connecting to ${serverInfo.address}:${serverInfo.port}...`);

      try {
        // Create WebSocket client
        this.socket = new WebSocketClient();
        const serverUrl = `ws://${serverInfo.address}:${serverInfo.port}`;

        // Create chunk manager with atlas and registry
        if (!this.atlas) {
          throw new Error('Texture atlas not initialized');
        }
        this.chunkManager = new ChunkManager(this.socket, this.scene, this.atlas, this.registry);

        // Setup message handlers
        this.setupAssetHandler();
        this.setupRegistryHandler();

        // Connect to server
        await this.socket.connect(serverUrl);

        console.log('[Client] Connected successfully, waiting for registry sync...');

        // Create player controller for physics and collision
        this.playerController = new PlayerController(this.scene, this.camera, this.chunkManager);

        // Setup debug key
        this.setupDebugKey();

        // Listen for disconnect
        this.socket.on('PlayerKick', (data) => {
          console.log('[Client] Disconnected:', data.reason);
          alert(`Disconnected: ${data.reason}`);
          this.disconnect();
        });

      } catch (error) {
        console.error('[Client] Connection failed:', error);
        alert('Failed to connect to server');
        this.showMainMenu();
        return;
      }
    }

    // Enable camera mouse look only (movement handled by PlayerController)
    this.camera?.attachControl(this.canvas, true);
    this.camera!.angularSensibility = 2000;

    // Disable default keyboard controls (PlayerController handles movement)
    this.camera!.keysUp = [];
    this.camera!.keysDown = [];
    this.camera!.keysLeft = [];
    this.camera!.keysRight = [];
    this.camera!.keysUpward = [];
    this.camera!.keysDownward = [];

    this.connected = true;

    // Setup pointer lock on canvas click (must be after connection is established)
    this.setupPointerLock();
  }

  /**
   * Setup asset manifest handler
   */
  private setupAssetHandler(): void {
    if (!this.socket) return;

    // Listen for asset manifest
    this.socket.on(AssetMessageType.ASSET_MANIFEST, async (message: AssetMessage) => {
      if (message.type === AssetMessageType.ASSET_MANIFEST) {
        console.log('[Client] Received asset manifest from server');

        // Load manifest
        await this.assetManager.loadManifest(message.data);

        console.log('[Client] Asset manifest loaded');

        // Load texture atlas from server
        if (this.atlas) {
          // For now, use local atlas until server atlas is generated
          // TODO: Generate atlas on server or load individual textures
          console.log('[Client] Loading local texture atlas (server atlas not yet generated)');
          try {
            await this.atlas.load();
            console.log('[Client] Texture atlas loaded');
          } catch (error) {
            console.error('[Client] Failed to load texture atlas:', error);
          }
        }
      }
    });
  }

  /**
   * Setup registry message handler
   */
  private setupRegistryHandler(): void {
    if (!this.socket) return;

    // Listen for registry sync message
    this.socket.on(RegistryMessageType.REGISTRY_SYNC, (message: RegistryMessage) => {
      if (message.type === RegistryMessageType.REGISTRY_SYNC) {
        console.log('[Client] Received registry sync from server');

        // Load registry data
        this.registry.loadFromServer(
          message.data.blocks,
          message.data.items,
          message.data.entities,
          message.data.version
        );

        // Send acknowledgement
        const ackMessage = createRegistryAckMessage(
          true,
          message.data.version,
          {
            blocks: message.data.blocks.length,
            items: message.data.items.length,
            entities: message.data.entities.length,
          }
        );

        this.socket!.send(JSON.stringify(ackMessage));

        // Now request chunks (registry is loaded)
        console.log('[Client] Registry synced, requesting chunks...');
        this.chunkManager?.requestChunksAround(0, 0, 3);
      }
    });

    // Listen for registry updates
    this.socket.on(RegistryMessageType.REGISTRY_UPDATE, (message: RegistryMessage) => {
      if (message.type === RegistryMessageType.REGISTRY_UPDATE) {
        console.log('[Client] Received registry update from server');
        this.registry.applyUpdate(message.data);
      }
    });
  }

  /**
   * Setup debug key (backslash) for world dump
   */
  private setupDebugKey(): void {
    if (!this.scene) return;

    document.addEventListener('keydown', (event) => {
      if (event.key === '\\') {
        this.dumpWorldDebugInfo();
      }
    });
  }

  /**
   * Dump world debug information to console
   */
  private dumpWorldDebugInfo(): void {
    console.log('\n========================================');
    console.log('🌍 WORLD DEBUG DUMP');
    console.log('========================================\n');

    // Camera/Player position
    if (this.camera) {
      const pos = this.camera.position;
      const blockPos = {
        x: Math.floor(pos.x),
        y: Math.floor(pos.y),
        z: Math.floor(pos.z),
      };
      console.log('📍 Player Position:');
      console.log(`   World: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
      console.log(`   Block: (${blockPos.x}, ${blockPos.y}, ${blockPos.z})`);
      console.log(`   Chunk: (${Math.floor(blockPos.x / 32)}, ${Math.floor(blockPos.z / 32)})`);
    }

    // Player controller info
    if (this.playerController) {
      const mode = this.playerController.getMode();
      console.log(`\n🎮 Player Mode: ${mode.toUpperCase()}`);
    }

    // Chunk manager info
    if (this.chunkManager) {
      const chunkCount = this.chunkManager.getLoadedChunksCount();
      const renderDistance = this.chunkManager.getRenderDistance();
      const playerChunk = this.chunkManager.getPlayerChunk();

      console.log(`\n📦 Chunk Loading:`);
      console.log(`   Loaded Chunks: ${chunkCount}`);
      console.log(`   Render Distance: ${renderDistance} chunks (${renderDistance * 2 + 1}×${renderDistance * 2 + 1} grid)`);
      console.log(`   Player Chunk: (${playerChunk.x}, ${playerChunk.z})`);

      // Access internal chunk data
      const chunks = (this.chunkManager as any).chunks as Map<string, any>;

      console.log('\n📋 Chunk Details:');
      let totalBlocks = 0;
      let totalNonAirBlocks = 0;

      const chunkArray = Array.from(chunks.entries());
      chunkArray.forEach(([key, chunk], index) => {
        const nonAirBlocks = Array.from(chunk.data).filter((id: number) => id !== 0).length;
        totalBlocks += chunk.data.length;
        totalNonAirBlocks += nonAirBlocks;

        if (index < 10) { // Show first 10 chunks
          console.log(`   Chunk ${key}:`);
          console.log(`      Total blocks: ${chunk.data.length}`);
          console.log(`      Non-air blocks: ${nonAirBlocks} (${(nonAirBlocks / chunk.data.length * 100).toFixed(1)}%)`);

          // Count blocks by type
          const blockCounts: Map<number, number> = new Map();
          for (let i = 0; i < chunk.data.length; i++) {
            const blockId = chunk.data[i];
            blockCounts.set(blockId, (blockCounts.get(blockId) || 0) + 1);
          }

          console.log(`      Block types:`);
          blockCounts.forEach((count, blockId) => {
            if (blockId !== 0) {
              const blockName = this.getBlockName(blockId);
              console.log(`         ${blockName} (ID ${blockId}): ${count} blocks`);
            }
          });
        }
      });

      if (chunkArray.length > 10) {
        console.log(`   ... and ${chunkArray.length - 10} more chunks`);
      }

      console.log(`\n📊 Total Statistics:`);
      console.log(`   Total blocks: ${totalBlocks}`);
      console.log(`   Non-air blocks: ${totalNonAirBlocks}`);
      console.log(`   Air blocks: ${totalBlocks - totalNonAirBlocks}`);
      console.log(`   Fill ratio: ${(totalNonAirBlocks / totalBlocks * 100).toFixed(1)}%`);
    }

    // Scene info
    if (this.scene) {
      const meshCount = this.scene.meshes.length;
      const materialCount = this.scene.materials.length;
      const textureCount = this.scene.textures.length;

      console.log(`\n🎨 Rendering Info:`);
      console.log(`   Meshes: ${meshCount}`);
      console.log(`   Materials: ${materialCount}`);
      console.log(`   Textures: ${textureCount}`);

      // Count triangles
      let totalTriangles = 0;
      this.scene.meshes.forEach(mesh => {
        if (mesh.getTotalVertices && mesh.getIndices) {
          const indices = mesh.getIndices();
          if (indices) {
            totalTriangles += indices.length / 3;
          }
        }
      });

      console.log(`   Total triangles: ${totalTriangles.toLocaleString()}`);
    }

    // Performance info
    if (this.engine) {
      const fps = this.engine.getFps();
      console.log(`\n⚡ Performance:`);
      console.log(`   FPS: ${fps.toFixed(1)}`);
    }

    // Connection info
    if (this.socket) {
      const isConnected = this.socket.isConnected();
      const serverUrl = (this.socket as any).server || 'unknown';
      console.log(`\n🌐 Connection:`);
      console.log(`   Status: ${isConnected ? 'Connected' : 'Disconnected'}`);
      console.log(`   Server: ${serverUrl}`);
    }

    console.log('\n========================================');
    console.log('End of debug dump');
    console.log('========================================\n');
  }

  /**
   * Get block name from ID (using registry)
   */
  private getBlockName(blockId: number): string {
    if (blockId === 0) return 'Air';

    const block = this.registry.getBlockByID(blockId);
    return block ? block.name : `Unknown (${blockId})`;
  }

  /**
   * Get client registry (for debugging)
   */
  getRegistry(): ClientRegistry {
    return this.registry;
  }

  /**
   * Setup pointer lock for mouse control
   */
  private setupPointerLock(): void {
    if (!this.canvas || !this.scene) return;

    // Request pointer lock on canvas click
    const clickHandler = () => {
      if (!document.pointerLockElement) {
        this.canvas.requestPointerLock()
          .catch((err) => {
            console.warn('[Client] Pointer lock request failed:', err.message);
          });
      }
    };

    this.canvas.addEventListener('click', clickHandler);

    // Handle pointer lock change
    const lockChangeHandler = () => {
      const isLocked = document.pointerLockElement === this.canvas;
      console.log(`[Client] Pointer lock: ${isLocked ? 'enabled' : 'disabled'}`);
    };

    document.addEventListener('pointerlockchange', lockChangeHandler);

    // ESC key to exit pointer lock
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && document.pointerLockElement) {
        document.exitPointerLock();
      }
    };

    document.addEventListener('keydown', keyHandler);
  }

  /**
   * Disconnect from server
   */
  private disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }

    if (this.chunkManager) {
      this.chunkManager.dispose();
      this.chunkManager = undefined;
    }

    this.connected = false;

    // Exit pointer lock
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    this.showMainMenu();
  }

  /**
   * Get the Babylon.js scene
   */
  getScene(): Scene | undefined {
    return this.scene;
  }

  /**
   * Get the Babylon.js engine
   */
  getEngine(): Engine | undefined {
    return this.engine;
  }

  /**
   * Shutdown the client
   */
  dispose(): void {
    this.scene?.dispose();
    this.engine?.dispose();
  }
}
