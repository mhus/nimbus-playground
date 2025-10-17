/**
 * Main VoxelClient class
 */

import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder } from '@babylonjs/core';
import { MainMenu, type ServerInfo } from './gui/MainMenu';
import { WebSocketClient } from './network/WebSocketClient';
import { ChunkManager } from './world/ChunkManager';

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
  private connected = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
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

        // Create chunk manager first
        this.chunkManager = new ChunkManager(this.socket, this.scene);

        // Connect to server
        await this.socket.connect(serverUrl);

        console.log('[Client] Connected successfully, requesting chunks...');

        // Request chunks around spawn (0, 0) immediately after connection
        this.chunkManager.requestChunksAround(0, 0, 3);

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

    // Enable camera controls
    this.camera?.attachControl(this.canvas, true);
    this.camera!.speed = 0.5;
    this.camera!.angularSensibility = 2000;

    this.connected = true;
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
