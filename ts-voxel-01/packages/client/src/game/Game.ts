import type { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';

import { NetworkClient } from './NetworkClient';
import { WorldRenderer } from './WorldRenderer';
import { InputManager } from './InputManager';

export class Game {
  private engine: Engine;
  private scene: Scene;
  private camera: FreeCamera;
  private networkClient: NetworkClient;
  private worldRenderer: WorldRenderer;
  private inputManager: InputManager;
  private playerId?: string;

  constructor(engine: Engine, canvas: HTMLCanvasElement) {
    this.engine = engine;
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0.5, 0.7, 1.0, 1.0);

    // Create camera
    this.camera = new FreeCamera('camera', new Vector3(0, 70, 0), this.scene);
    this.camera.setTarget(new Vector3(0, 70, 10));
    this.camera.speed = 0.5;
    this.camera.attachControl(canvas, true);

    // Disable default camera controls, we'll handle input manually
    this.camera.inputs.clear();

    // Create light
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
    light.diffuse = new Color3(1, 1, 1);
    light.specular = new Color3(0.5, 0.5, 0.5);
    light.groundColor = new Color3(0.3, 0.3, 0.4);

    // Initialize systems
    this.networkClient = new NetworkClient();
    this.worldRenderer = new WorldRenderer(this.scene);
    this.inputManager = new InputManager(canvas, this.camera);

    // Setup network handlers
    this.setupNetworkHandlers();

    // Setup debug UI update
    this.setupDebugUI();
  }

  private setupNetworkHandlers(): void {
    this.networkClient.on('worldData', (data) => {
      this.playerId = data.playerId;
      this.camera.position = new Vector3(data.spawnPosition.x, data.spawnPosition.y, data.spawnPosition.z);
      console.log('World data received, player ID:', this.playerId);
    });

    this.networkClient.on('chunkData', (data) => {
      this.worldRenderer.addChunk(data.position, data.data);
    });

    this.networkClient.on('blockUpdate', (data) => {
      this.worldRenderer.updateBlock(data.position, data.blockType);
    });
  }

  private setupDebugUI(): void {
    setInterval(() => {
      const fps = this.engine.getFps().toFixed(0);
      const pos = this.camera.position;
      const chunks = this.worldRenderer.getChunkCount();

      document.getElementById('fps')!.textContent = fps;
      document.getElementById('position')!.textContent =
        `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
      document.getElementById('chunks')!.textContent = chunks.toString();
    }, 100);
  }

  connect(serverUrl: string, playerName: string): void {
    this.networkClient.connect(serverUrl, playerName);
  }

  update(): void {
    const deltaTime = this.engine.getDeltaTime() / 1000;

    // Update input and camera
    this.inputManager.update(deltaTime);

    // Send position updates to server
    if (this.playerId && this.networkClient.isConnected()) {
      this.networkClient.sendMove(
        {
          x: this.camera.position.x,
          y: this.camera.position.y,
          z: this.camera.position.z,
        },
        {
          x: this.camera.rotation.x,
          y: this.camera.rotation.y,
        }
      );
    }
  }

  render(): void {
    this.scene.render();
  }
}
