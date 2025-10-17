/**
 * Main Menu GUI
 */

import { AdvancedDynamicTexture, Rectangle, TextBlock, Button, InputText, StackPanel, Control, Image } from '@babylonjs/gui';
import { Scene, MeshBuilder, StandardMaterial, Texture, Vector3 } from '@babylonjs/core';

export interface ServerInfo {
  name: string;
  address: string;
  port: number;
}

/**
 * Main Menu with server selection
 */
export class MainMenu {
  private guiTexture: AdvancedDynamicTexture;
  private mainContainer?: Rectangle;
  private onConnect?: (server: ServerInfo) => void;
  private scene: Scene;
  private testCube?: any;

  constructor(scene: Scene) {
    this.scene = scene;
    // Create fullscreen GUI
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI('MainMenuUI', true, scene);

    // Create test cube with grass texture
    this.createTestCube();
  }

  /**
   * Create test cube with grass texture
   */
  private createTestCube(): void {
    console.log('[MainMenu] Creating test cube with grass texture');

    // Create a simple box - positioned in camera view
    // Camera is at (0, 80, 0) looking at (10, 79, 10)
    const box = MeshBuilder.CreateBox('testCube', { size: 4 }, this.scene);
    box.position = new Vector3(5, 79, 5); // Halfway between camera position and target

    // Create material with grass texture
    const material = new StandardMaterial('testMaterial', this.scene);
    material.diffuseTexture = new Texture('http://localhost:3004/assets/textures/block/grass.png', this.scene);

    box.material = material;
    this.testCube = box;

    // Animate rotation
    this.scene.registerBeforeRender(() => {
      if (this.testCube) {
        this.testCube.rotation.y += 0.01;
        this.testCube.rotation.x += 0.005;
      }
    });

    console.log('[MainMenu] Test cube created at position:', box.position);
  }

  /**
   * Show the main menu
   */
  show(onConnect: (server: ServerInfo) => void): void {
    this.onConnect = onConnect;

    // Main container
    this.mainContainer = new Rectangle('mainContainer');
    this.mainContainer.width = '400px';
    this.mainContainer.height = '550px';
    this.mainContainer.thickness = 2;
    this.mainContainer.cornerRadius = 10;
    this.mainContainer.background = '#1a1a1aee';
    this.mainContainer.color = '#ffffff';

    // Stack for vertical layout
    const stack = new StackPanel('stack');
    stack.width = '100%';
    stack.height = '100%';
    stack.paddingTop = '20px';
    stack.paddingBottom = '20px';

    // Logo
    const logo = new Image('logo', '/textures/logo.png');
    logo.width = '120px';
    logo.height = '120px';
    logo.paddingBottom = '10px';

    // Title
    const title = new TextBlock('title', 'VoxelSrv');
    title.height = '40px';
    title.fontSize = 32;
    title.color = 'white';
    title.fontFamily = 'Arial, sans-serif';
    title.fontWeight = 'bold';
    title.paddingBottom = '5px';

    // Subtitle
    const subtitle = new TextBlock('subtitle', 'TypeScript Edition');
    subtitle.height = '30px';
    subtitle.fontSize = 16;
    subtitle.color = '#aaaaaa';
    subtitle.paddingBottom = '30px';

    // Server Name Label
    const nameLabel = new TextBlock('nameLabel', 'Server Name:');
    nameLabel.height = '25px';
    nameLabel.fontSize = 14;
    nameLabel.color = 'white';
    nameLabel.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    nameLabel.paddingLeft = '40px';
    nameLabel.paddingBottom = '5px';

    // Server Name Input
    const nameInput = new InputText('nameInput');
    nameInput.width = '320px';
    nameInput.height = '40px';
    nameInput.fontSize = 14;
    nameInput.color = 'white';
    nameInput.background = '#333333';
    nameInput.placeholderText = 'My Server';
    nameInput.text = 'Local Server';
    nameInput.thickness = 1;
    nameInput.paddingBottom = '15px';

    // Server Address Label
    const addressLabel = new TextBlock('addressLabel', 'Server Address:');
    addressLabel.height = '25px';
    addressLabel.fontSize = 14;
    addressLabel.color = 'white';
    addressLabel.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    addressLabel.paddingLeft = '40px';
    addressLabel.paddingBottom = '5px';

    // Server Address Input
    const addressInput = new InputText('addressInput');
    addressInput.width = '320px';
    addressInput.height = '40px';
    addressInput.fontSize = 14;
    addressInput.color = 'white';
    addressInput.background = '#333333';
    addressInput.placeholderText = 'localhost';
    addressInput.text = 'localhost';
    addressInput.thickness = 1;
    addressInput.paddingBottom = '15px';

    // Port Label
    const portLabel = new TextBlock('portLabel', 'Port:');
    portLabel.height = '25px';
    portLabel.fontSize = 14;
    portLabel.color = 'white';
    portLabel.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    portLabel.paddingLeft = '40px';
    portLabel.paddingBottom = '5px';

    // Port Input
    const portInput = new InputText('portInput');
    portInput.width = '320px';
    portInput.height = '40px';
    portInput.fontSize = 14;
    portInput.color = 'white';
    portInput.background = '#333333';
    portInput.placeholderText = '3003';
    portInput.text = '3003';
    portInput.thickness = 1;
    portInput.paddingBottom = '25px';

    // Connect Button
    const connectButton = Button.CreateSimpleButton('connectButton', 'Connect to Server');
    connectButton.width = '320px';
    connectButton.height = '50px';
    connectButton.fontSize = 18;
    connectButton.color = 'white';
    connectButton.background = '#4CAF50';
    connectButton.cornerRadius = 5;
    connectButton.thickness = 0;
    connectButton.paddingBottom = '10px';

    connectButton.onPointerEnterObservable.add(() => {
      connectButton.background = '#45a049';
    });

    connectButton.onPointerOutObservable.add(() => {
      connectButton.background = '#4CAF50';
    });

    connectButton.onPointerClickObservable.add(() => {
      const serverInfo: ServerInfo = {
        name: nameInput.text || 'Server',
        address: addressInput.text || 'localhost',
        port: parseInt(portInput.text) || 3001,
      };

      this.hide();
      if (this.onConnect) {
        this.onConnect(serverInfo);
      }
    });

    // Singleplayer Button (Embedded Server)
    const singleplayerButton = Button.CreateSimpleButton('singleplayerButton', 'Play Singleplayer');
    singleplayerButton.width = '320px';
    singleplayerButton.height = '50px';
    singleplayerButton.fontSize = 18;
    singleplayerButton.color = 'white';
    singleplayerButton.background = '#2196F3';
    singleplayerButton.cornerRadius = 5;
    singleplayerButton.thickness = 0;

    singleplayerButton.onPointerEnterObservable.add(() => {
      singleplayerButton.background = '#1976D2';
    });

    singleplayerButton.onPointerOutObservable.add(() => {
      singleplayerButton.background = '#2196F3';
    });

    singleplayerButton.onPointerClickObservable.add(() => {
      // Start embedded server
      const serverInfo: ServerInfo = {
        name: 'Singleplayer',
        address: 'embedded',
        port: 0,
      };

      this.hide();
      if (this.onConnect) {
        this.onConnect(serverInfo);
      }
    });

    // Add all controls to stack
    stack.addControl(logo);
    stack.addControl(title);
    stack.addControl(subtitle);
    stack.addControl(nameLabel);
    stack.addControl(nameInput);
    stack.addControl(addressLabel);
    stack.addControl(addressInput);
    stack.addControl(portLabel);
    stack.addControl(portInput);
    stack.addControl(connectButton);
    stack.addControl(singleplayerButton);

    this.mainContainer.addControl(stack);
    this.guiTexture.addControl(this.mainContainer);
  }

  /**
   * Hide the main menu
   */
  hide(): void {
    if (this.mainContainer) {
      this.guiTexture.removeControl(this.mainContainer);
      this.mainContainer.dispose();
      this.mainContainer = undefined;
    }

    // Remove test cube
    if (this.testCube) {
      this.testCube.dispose();
      this.testCube = undefined;
    }
  }

  /**
   * Check if menu is visible
   */
  isVisible(): boolean {
    return this.mainContainer !== undefined;
  }

  /**
   * Dispose the menu
   */
  dispose(): void {
    this.hide();
    this.guiTexture.dispose();

    // Dispose test cube
    if (this.testCube) {
      this.testCube.dispose();
      this.testCube = undefined;
    }
  }
}
