/**
 * Player Controller - Handles player movement, collision, gravity
 */

import { Vector3, Scene, FreeCamera, KeyboardEventTypes } from '@babylonjs/core';
import type { ChunkManager } from '../world/ChunkManager';

export enum MovementMode {
  WALK = 'walk',
  FLIGHT = 'flight',
}

/**
 * Controls player movement with collision detection and gravity
 */
export class PlayerController {
  private scene: Scene;
  private camera: FreeCamera;
  private chunkManager: ChunkManager;

  private mode: MovementMode = MovementMode.FLIGHT;
  private velocity: Vector3 = Vector3.Zero();

  // Movement settings
  private walkSpeed = 4.3; // Blocks per second
  private flySpeed = 10.5; // Blocks per second
  private jumpVelocity = 8.0;
  private gravity = -26.0; // Blocks per second^2

  // Player dimensions
  private playerHeight = 1.8;
  private playerWidth = 0.6;
  private eyeHeight = 1.62; // Distance from feet to camera

  // State
  private isOnGround = false;
  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private moveUp = false;
  private moveDown = false;
  private wantJump = false;
  private turnLeft = false;
  private turnRight = false;

  // Camera rotation settings
  private turnSpeed = 1.5; // Radians per second

  constructor(scene: Scene, camera: FreeCamera, chunkManager: ChunkManager) {
    this.scene = scene;
    this.camera = camera;
    this.chunkManager = chunkManager;

    this.setupControls();
    this.startUpdateLoop();

    console.log('[PlayerController] Initialized in FLIGHT mode');
  }

  /**
   * Setup keyboard controls
   */
  private setupControls(): void {
    this.scene.onKeyboardObservable.add((kbInfo) => {
      const key = kbInfo.event.key.toLowerCase();
      const isDown = kbInfo.type === KeyboardEventTypes.KEYDOWN;

      switch (key) {
        case 'w':
          this.moveForward = isDown;
          break;
        case 's':
          this.moveBackward = isDown;
          break;
        case 'a':
          this.moveLeft = isDown;
          break;
        case 'd':
          this.moveRight = isDown;
          break;
        case ' ':
          if (this.mode === MovementMode.WALK) {
            this.wantJump = isDown;
          } else {
            this.moveUp = isDown;
          }
          break;
        case 'shift':
          if (this.mode === MovementMode.FLIGHT) {
            this.moveDown = isDown;
          }
          break;
        case 'f':
          if (isDown) {
            this.toggleMode();
          }
          break;
        case 'q':
          this.turnLeft = isDown;
          break;
        case 'e':
          this.turnRight = isDown;
          break;
      }
    });
  }

  /**
   * Toggle between walk and flight mode
   */
  private toggleMode(): void {
    if (this.mode === MovementMode.WALK) {
      this.mode = MovementMode.FLIGHT;
      this.velocity.y = 0; // Cancel gravity
      console.log('[PlayerController] Switched to FLIGHT mode');
    } else {
      this.mode = MovementMode.WALK;
      console.log('[PlayerController] Switched to WALK mode');
    }
  }

  /**
   * Start update loop
   */
  private startUpdateLoop(): void {
    let lastTime = performance.now();

    this.scene.onBeforeRenderObservable.add(() => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      this.update(deltaTime);
    });
  }

  /**
   * Update player physics and movement
   */
  private update(deltaTime: number): void {
    // Cap delta time to prevent large jumps
    deltaTime = Math.min(deltaTime, 0.1);

    // Handle camera rotation
    this.updateCameraRotation(deltaTime);

    if (this.mode === MovementMode.WALK) {
      this.updateWalkMode(deltaTime);
    } else {
      this.updateFlightMode(deltaTime);
    }
  }

  /**
   * Update camera rotation from keyboard input
   */
  private updateCameraRotation(deltaTime: number): void {
    if (this.turnLeft) {
      this.camera.rotation.y -= this.turnSpeed * deltaTime;
    }
    if (this.turnRight) {
      this.camera.rotation.y += this.turnSpeed * deltaTime;
    }
  }

  /**
   * Update walk mode (with gravity and collision)
   */
  private updateWalkMode(deltaTime: number): void {
    // Apply gravity
    this.velocity.y += this.gravity * deltaTime;

    // Get movement input
    const moveDirection = this.getMovementDirection();

    // Apply horizontal movement
    const speed = this.walkSpeed;
    const moveVelocity = moveDirection.scale(speed);

    // Combine velocities
    const targetPosition = this.camera.position.clone();
    targetPosition.x += moveVelocity.x * deltaTime;
    targetPosition.y += this.velocity.y * deltaTime;
    targetPosition.z += moveVelocity.z * deltaTime;

    // Check collision and adjust position
    const finalPosition = this.handleCollision(this.camera.position, targetPosition);

    // Update camera position
    this.camera.position.copyFrom(finalPosition);

    // Check if on ground
    this.isOnGround = this.checkGround();

    // Handle jumping
    if (this.wantJump && this.isOnGround) {
      this.velocity.y = this.jumpVelocity;
      this.isOnGround = false;
      this.wantJump = false;
    }

    // Stop falling if on ground
    if (this.isOnGround && this.velocity.y < 0) {
      this.velocity.y = 0;
    }
  }

  /**
   * Update flight mode (no gravity, free movement in look direction)
   */
  private updateFlightMode(deltaTime: number): void {
    // Get movement input with full 3D direction (includes vertical component)
    const moveDirection = this.getFlightMovementDirection();

    // Add additional vertical movement for space/shift
    if (this.moveUp) {
      moveDirection.y += 1;
    }
    if (this.moveDown) {
      moveDirection.y -= 1;
    }

    // Normalize if moving
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
    }

    // Apply movement
    const speed = this.flySpeed;
    const targetPosition = this.camera.position.clone();
    targetPosition.addInPlace(moveDirection.scale(speed * deltaTime));

    // Check collision (still prevent going through blocks)
    const finalPosition = this.handleCollision(this.camera.position, targetPosition);

    // Update camera position
    this.camera.position.copyFrom(finalPosition);
  }

  /**
   * Get movement direction from input (walk mode - horizontal only)
   */
  private getMovementDirection(): Vector3 {
    const direction = Vector3.Zero();

    // Get camera forward and right vectors (only horizontal)
    const forward = this.camera.getDirection(Vector3.Forward());
    forward.y = 0;
    forward.normalize();

    const right = this.camera.getDirection(Vector3.Right());
    right.y = 0;
    right.normalize();

    // Apply input
    if (this.moveForward) {
      direction.addInPlace(forward);
    }
    if (this.moveBackward) {
      direction.subtractInPlace(forward);
    }
    if (this.moveLeft) {
      direction.subtractInPlace(right);
    }
    if (this.moveRight) {
      direction.addInPlace(right);
    }

    return direction;
  }

  /**
   * Get movement direction for flight mode (includes vertical component)
   */
  private getFlightMovementDirection(): Vector3 {
    const direction = Vector3.Zero();

    // Get camera forward and right vectors (with vertical component!)
    const forward = this.camera.getDirection(Vector3.Forward());
    const right = this.camera.getDirection(Vector3.Right());

    // Apply input
    if (this.moveForward) {
      direction.addInPlace(forward);
    }
    if (this.moveBackward) {
      direction.subtractInPlace(forward);
    }
    if (this.moveLeft) {
      direction.subtractInPlace(right);
    }
    if (this.moveRight) {
      direction.addInPlace(right);
    }

    return direction;
  }

  /**
   * Handle collision detection
   */
  private handleCollision(fromPos: Vector3, toPos: Vector3): Vector3 {
    const finalPos = toPos.clone();

    // Check collision in each axis separately
    // This allows sliding along walls

    // X axis
    const testX = new Vector3(toPos.x, fromPos.y, fromPos.z);
    if (this.checkCollisionAtPosition(testX)) {
      finalPos.x = fromPos.x;
    }

    // Y axis
    const testY = new Vector3(finalPos.x, toPos.y, fromPos.z);
    if (this.checkCollisionAtPosition(testY)) {
      finalPos.y = fromPos.y;

      // If hitting ceiling, cancel upward velocity
      if (toPos.y > fromPos.y) {
        this.velocity.y = Math.min(0, this.velocity.y);
      }

      // If hitting ground, we're on ground
      if (toPos.y < fromPos.y) {
        this.isOnGround = true;
        this.velocity.y = 0;
      }
    }

    // Z axis
    const testZ = new Vector3(finalPos.x, finalPos.y, toPos.z);
    if (this.checkCollisionAtPosition(testZ)) {
      finalPos.z = fromPos.z;
    }

    return finalPos;
  }

  /**
   * Check if position collides with solid blocks
   */
  private checkCollisionAtPosition(position: Vector3): boolean {
    // Check multiple points on player bounding box
    const points = [
      // Feet level
      new Vector3(position.x - this.playerWidth/2, position.y - this.eyeHeight, position.z - this.playerWidth/2),
      new Vector3(position.x + this.playerWidth/2, position.y - this.eyeHeight, position.z - this.playerWidth/2),
      new Vector3(position.x - this.playerWidth/2, position.y - this.eyeHeight, position.z + this.playerWidth/2),
      new Vector3(position.x + this.playerWidth/2, position.y - this.eyeHeight, position.z + this.playerWidth/2),

      // Head level
      new Vector3(position.x - this.playerWidth/2, position.y - this.eyeHeight + this.playerHeight, position.z - this.playerWidth/2),
      new Vector3(position.x + this.playerWidth/2, position.y - this.eyeHeight + this.playerHeight, position.z - this.playerWidth/2),
      new Vector3(position.x - this.playerWidth/2, position.y - this.eyeHeight + this.playerHeight, position.z + this.playerWidth/2),
      new Vector3(position.x + this.playerWidth/2, position.y - this.eyeHeight + this.playerHeight, position.z + this.playerWidth/2),

      // Middle level
      new Vector3(position.x, position.y - this.eyeHeight + this.playerHeight/2, position.z),
    ];

    for (const point of points) {
      if (this.isBlockSolid(point)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if on ground
   */
  private checkGround(): boolean {
    // Check slightly below feet
    const feetPos = this.camera.position.clone();
    feetPos.y -= this.eyeHeight + 0.1; // Slightly below feet

    return this.isBlockSolid(feetPos);
  }

  /**
   * Check if block at world position is solid
   */
  private isBlockSolid(worldPos: Vector3): boolean {
    // Get block coordinates
    const blockX = Math.floor(worldPos.x);
    const blockY = Math.floor(worldPos.y);
    const blockZ = Math.floor(worldPos.z);

    // Get chunk coordinates
    const chunkX = Math.floor(blockX / 32);
    const chunkZ = Math.floor(blockZ / 32);

    // Get local block coordinates within chunk
    const localX = blockX - chunkX * 32;
    const localZ = blockZ - chunkZ * 32;

    // Get chunk data
    const chunkKey = `${chunkX},${chunkZ}`;
    const chunk = (this.chunkManager as any).chunks.get(chunkKey);

    if (!chunk) {
      // Chunk not loaded, assume solid
      return true;
    }

    // Check if block coordinates are valid
    if (localX < 0 || localX >= 32 || localZ < 0 || localZ >= 32 || blockY < 0 || blockY >= 256) {
      return false;
    }

    // Get block ID
    const index = localX + blockY * 32 + localZ * 32 * 256;
    const blockId = chunk.data[index];

    // Block ID 0 is air
    return blockId !== 0;
  }

  /**
   * Get current movement mode
   */
  getMode(): MovementMode {
    return this.mode;
  }

  /**
   * Set movement mode
   */
  setMode(mode: MovementMode): void {
    if (this.mode !== mode) {
      this.mode = mode;
      if (mode === MovementMode.FLIGHT) {
        this.velocity.y = 0;
      }
      console.log(`[PlayerController] Mode set to ${mode}`);
    }
  }
}
