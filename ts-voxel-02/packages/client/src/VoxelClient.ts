/**
 * Main VoxelClient class
 */

import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder } from '@babylonjs/core';
import { MainMenu, type ServerInfo } from './gui/MainMenu';

/**
 * Main client class for VoxelSrv
 */
export class VoxelClient {
  private canvas: HTMLCanvasElement;
  private engine?: Engine;
  private scene?: Scene;
  private camera?: FreeCamera;
  private mainMenu?: MainMenu;
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

    // Create camera (detached initially)
    this.camera = new FreeCamera('camera', new Vector3(0, 10, -20), this.scene);
    this.camera.setTarget(Vector3.Zero());

    // Create light
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;

    // Create placeholder ground
    const ground = MeshBuilder.CreateGround('ground', { width: 100, height: 100 }, this.scene);

    // Create placeholder box
    const box = MeshBuilder.CreateBox('box', { size: 2 }, this.scene);
    box.position.y = 1;

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

    if (serverInfo.address === 'embedded') {
      console.log('[Client] Starting singleplayer (embedded server)...');
      // TODO: Start embedded server
    } else {
      console.log(`[Client] Connecting to ${serverInfo.address}:${serverInfo.port}...`);
      // TODO: Connect via WebSocket
    }

    // Enable camera controls
    this.camera?.attachControl(this.canvas, true);
    this.camera!.speed = 0.5;
    this.camera!.angularSensibility = 2000;

    this.connected = true;
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
