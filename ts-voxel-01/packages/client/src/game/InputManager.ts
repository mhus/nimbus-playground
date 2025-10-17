import type { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export class InputManager {
  private canvas: HTMLCanvasElement;
  private camera: FreeCamera;
  private keys = new Map<string, boolean>();
  private isPointerLocked = false;
  private moveSpeed = 10;
  private lookSpeed = 0.002;

  constructor(canvas: HTMLCanvasElement, camera: FreeCamera) {
    this.canvas = canvas;
    this.camera = camera;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.keys.set(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false);
    });

    // Pointer lock
    this.canvas.addEventListener('click', () => {
      this.canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas;
    });

    // Mouse movement
    document.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;

      this.camera.rotation.y += e.movementX * this.lookSpeed;
      this.camera.rotation.x += e.movementY * this.lookSpeed;

      // Clamp vertical rotation
      this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
    });
  }

  update(deltaTime: number): void {
    if (!this.isPointerLocked) return;

    const speed = this.moveSpeed * deltaTime;

    // Get camera direction
    const forward = this.camera.getDirection(Vector3.Forward());
    const right = this.camera.getDirection(Vector3.Right());

    // Movement
    if (this.keys.get('KeyW')) {
      this.camera.position.addInPlace(forward.scale(speed));
    }
    if (this.keys.get('KeyS')) {
      this.camera.position.subtractInPlace(forward.scale(speed));
    }
    if (this.keys.get('KeyA')) {
      this.camera.position.subtractInPlace(right.scale(speed));
    }
    if (this.keys.get('KeyD')) {
      this.camera.position.addInPlace(right.scale(speed));
    }

    // Vertical movement
    if (this.keys.get('Space')) {
      this.camera.position.y += speed;
    }
    if (this.keys.get('ShiftLeft')) {
      this.camera.position.y -= speed;
    }
  }
}
