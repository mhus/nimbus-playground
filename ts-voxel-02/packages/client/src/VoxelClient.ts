/**
 * Main VoxelClient class
 */

import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder } from '@babylonjs/core';
import { MainMenu, type ServerInfo } from './gui/MainMenu';
import { WebSocketClient } from './network/WebSocketClient';
import { ChunkManager } from './world/ChunkManager';
import { PlayerController } from './player/PlayerController';

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

        // Create player controller for physics and collision
        this.playerController = new PlayerController(this.scene, this.camera, this.chunkManager);

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
