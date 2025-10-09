import { Engine, Scene, FreeCamera, Vector3, HemisphericLight } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { Terrain3DRenderer, ViewportConfig } from './terrain3d';
import { GlobalTileAtlas } from './atlas';
import { TileProvider } from './terrain';

class App {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene!: Scene;
    private camera!: FreeCamera;
    private tileProvider: TileProvider;
    private terrain3DRenderer!: Terrain3DRenderer; // Definitive Assignment Assertion
    private viewport: ViewportConfig;

    // Bewegungsparameter
    private globalOffsetX: number = 100;
    private globalOffsetY: number = 100;
    private localOffsetX: number = 0;
    private localOffsetY: number = 0;

    // Kamera-Rotationsparameter
    private cameraRotationY: number = -Math.PI / 2;
    private cameraRotationZ: number = 0; // Z-Rotation für Neigung
    private cameraRotationSpeed: number = 0.02;

    // Debug-Parameter für Untergrund-Ansicht
    private isUndergroundView: boolean = false;
    private originalCameraHeight: number = 0;

    // KONFIGURATION: Zentrale Definition aller Konstanten
    private static readonly TILE_SIZE = 20;

    // Kamera-Konstanten
    private static readonly CAMERA_DISTANCE = 15;
    private static readonly CAMERA_HEIGHT = 8;
    private static readonly CAMERA_ANGLE = 30;

    // 3D-Terrain-Konstanten
    private static readonly TERRAIN_TILE_SIZE = 2; // 3D-Einheiten pro Tile
    public static readonly DEBUG_TILE_BORDERS = true;

    constructor() {
        this.canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
        this.engine = new Engine(this.canvas, true);
        this.tileProvider = new TileProvider();

        // Viewport-Konfiguration
        this.viewport = {
            viewportCenterX: this.globalOffsetX,
            viewportCenterY: this.globalOffsetY,
            viewportWidth: App.TILE_SIZE,
            viewportHeight: App.TILE_SIZE
        };

        // Async Initialisierung
        this.initializeScene();

        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    private async initializeScene(): Promise<void> {
        // Terrain generieren BEVOR die Szene erstellt wird
        console.log('Starte Terrain-Generierung...');
        await this.tileProvider.generateAllTerrain('/assets/terrain.json');

        // Szene erstellen
        this.scene = await this.createScene();

        // 3D-Terrain-Renderer initialisieren (nach Scene-Erstellung)
        this.terrain3DRenderer = new Terrain3DRenderer(
            this.tileProvider,
            this.viewport,
            GlobalTileAtlas.TILE_TEXTURES_ATLAS,
            this.scene,
            App.TERRAIN_TILE_SIZE
        );

        // Atlas für 3D-Renderer laden
        await this.terrain3DRenderer.loadAtlas('/assets/textures.png');

        // Initiales Terrain rendern
        this.terrain3DRenderer.update(
            {
                globalX: this.globalOffsetX,
                globalY: this.globalOffsetY,
                localX: this.localOffsetX,
                localY: this.localOffsetY
            }
        );

        // Keyboard-Events einrichten
        this.setupKeyboardControls();

        // Render-Loop starten
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    private async createScene(): Promise<Scene> {
        // Neue Szene erstellen
        const scene = new Scene(this.engine);

        // Isometrische Kamera
        const angleRad = (App.CAMERA_ANGLE * Math.PI) / 180;
        const cameraX = App.CAMERA_DISTANCE * Math.cos(angleRad);
        const cameraZ = App.CAMERA_DISTANCE * Math.sin(angleRad);

        this.camera = new FreeCamera('camera', new Vector3(cameraX, App.CAMERA_HEIGHT, cameraZ), scene);
        this.camera.inputs.clear();
        this.updateCameraPosition();

        // Licht hinzufügen
        const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
        light.intensity = 0.8;

        // KEIN Ground mehr - das 3D-Terrain ersetzt es vollständig

        return scene;
    }

    private setupKeyboardControls(): void {
        const frameSpeed = 0.05;

        let moveRight = false;
        let moveLeft = false;
        let moveDown = false;
        let moveUp = false;
        let rotateLeft = false;
        let rotateRight = false;
        let tiltUp = false;    // Z-Rotation nach oben
        let tiltDown = false;  // Z-Rotation nach unten

        const updateMoving = () => {
            let moved = false;

            if (moveRight) {
                this.localOffsetX += frameSpeed * Math.cos(this.cameraRotationY + Math.PI / 2);
                this.localOffsetY += frameSpeed * Math.sin(this.cameraRotationY + Math.PI / 2);
                moved = true;
            }
            if (moveLeft) {
                this.localOffsetX -= frameSpeed * Math.cos(this.cameraRotationY + Math.PI / 2);
                this.localOffsetY -= frameSpeed * Math.sin(this.cameraRotationY + Math.PI / 2);
                moved = true;
            }
            if (moveDown) {
                this.localOffsetX += frameSpeed * Math.cos(this.cameraRotationY);
                this.localOffsetY += frameSpeed * Math.sin(this.cameraRotationY);
                moved = true;
            }
            if (moveUp) {
                this.localOffsetX -= frameSpeed * Math.cos(this.cameraRotationY);
                this.localOffsetY -= frameSpeed * Math.sin(this.cameraRotationY);
                moved = true;
            }

            if (moved) {
                this.updateGlobalOffsets();
                // 3D-Terrain-Position sofort aktualisieren
                this.terrain3DRenderer.update(
                    {
                        globalX: this.globalOffsetX,
                        globalY: this.globalOffsetY,
                        localX: this.localOffsetX,
                        localY: this.localOffsetY
                    }
                );
            }

            // Kamera-Rotation
            if (this.camera) {
                if (rotateLeft) {
                    this.cameraRotationY -= this.cameraRotationSpeed;
                    if (this.cameraRotationY < -Math.PI) {
                        this.cameraRotationY += 2 * Math.PI;
                    }
                }
                if (rotateRight) {
                    this.cameraRotationY += this.cameraRotationSpeed;
                    if (this.cameraRotationY > Math.PI) {
                        this.cameraRotationY -= 2 * Math.PI;
                    }
                }

                // Z-Rotation (Kameraneigung)
                if (tiltUp) {
                    this.cameraRotationZ += this.cameraRotationSpeed;
                    // Begrenze die Neigung nach oben
                    if (this.cameraRotationZ > Math.PI / 3) {
                        this.cameraRotationZ = Math.PI / 3;
                    }
                }
                if (tiltDown) {
                    this.cameraRotationZ -= this.cameraRotationSpeed;
                    // Begrenze die Neigung nach unten
                    if (this.cameraRotationZ < -Math.PI / 6) {
                        this.cameraRotationZ = -Math.PI / 6;
                    }
                }

                if (rotateLeft || rotateRight || tiltUp || tiltDown) {
                    this.updateCameraPosition();
                }
            }
        };

        // Key-Events
        window.addEventListener('keydown', (event) => {
            // Verhindere Standardverhalten für alle Steuerungstasten
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyU'].includes(event.code)) {
                event.preventDefault();
            }

            switch (event.code) {
                case 'ArrowRight': moveRight = true; break;
                case 'ArrowLeft': moveLeft = true; break;
                case 'ArrowDown': moveDown = true; break;
                case 'ArrowUp': moveUp = true; break;
                case 'KeyA': rotateLeft = true; break;
                case 'KeyD': rotateRight = true; break;
                case 'KeyW': tiltUp = true; break;      // W für Kamera nach oben neigen
                case 'KeyS': tiltDown = true; break;    // S für Kamera nach unten neigen
                case 'KeyU': this.toggleUndergroundView(); break; // U für Underground-Debug-Ansicht
            }
            updateMoving();
        });

        window.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'ArrowRight': moveRight = false; break;
                case 'ArrowLeft': moveLeft = false; break;
                case 'ArrowDown': moveDown = false; break;
                case 'ArrowUp': moveUp = false; break;
                case 'KeyA': rotateLeft = false; break;
                case 'KeyD': rotateRight = false; break;
                case 'KeyW': tiltUp = false; break;
                case 'KeyS': tiltDown = false; break;
            }
            updateMoving();
        });

        this.scene.registerBeforeRender(() => {
            if (moveRight || moveLeft || moveDown || moveUp || rotateLeft || rotateRight || tiltUp || tiltDown) {
                updateMoving();
            }
        });
    }

    private updateGlobalOffsets(): void {
        let globalChanged = false;

        // X-Achse prüfen
        if (this.localOffsetX >= App.TERRAIN_TILE_SIZE) {
            this.globalOffsetX += 1;
            this.localOffsetX -= App.TERRAIN_TILE_SIZE;
            globalChanged = true;
        } else if (this.localOffsetX < 0) {
            this.globalOffsetX -= 1;
            this.localOffsetX += App.TERRAIN_TILE_SIZE;
            globalChanged = true;
        }

        // Y-Achse prüfen
        if (this.localOffsetY >= App.TERRAIN_TILE_SIZE) {
            this.globalOffsetY += 1;
            this.localOffsetY -= App.TERRAIN_TILE_SIZE;
            globalChanged = true;
        } else if (this.localOffsetY < 0) {
            this.globalOffsetY -= 1;
            this.localOffsetY += App.TERRAIN_TILE_SIZE;
            globalChanged = true;
        }

        // Weltgrenzen prüfen
        if (globalChanged) {
            const halfTileSize = Math.ceil(App.TILE_SIZE / 2);
            this.globalOffsetX = Math.max(halfTileSize, Math.min(this.tileProvider.getWorldSize() - halfTileSize, this.globalOffsetX));
            this.globalOffsetY = Math.max(halfTileSize, Math.min(this.tileProvider.getWorldSize() - halfTileSize, this.globalOffsetY));
            this.terrain3DRenderer.forceRedrawAll({
                globalX: this.globalOffsetX,
                globalY: this.globalOffsetY,
                localX: this.localOffsetX,
                localY: this.localOffsetY
            });
        }
    }

    private updateCameraPosition() {
        // Berechne Position basierend auf Y-Rotation (horizontal um das Zentrum)
        const baseX = App.CAMERA_DISTANCE * Math.cos(this.cameraRotationY);
        const baseZ = App.CAMERA_DISTANCE * Math.sin(this.cameraRotationY);
        
        // Berücksichtige Z-Rotation für Kameraneigung - MIT Abstandsänderung
        const heightOffset = Math.sin(this.cameraRotationZ) * App.CAMERA_DISTANCE;
        const distanceReduction = Math.cos(this.cameraRotationZ);

        // Abstand wird durch Z-Rotation verändert
        this.camera.position.x = baseX * distanceReduction;
        this.camera.position.y = App.CAMERA_HEIGHT + heightOffset;
        this.camera.position.z = baseZ * distanceReduction;
        this.camera.setTarget(Vector3.Zero());
    }

    private toggleUndergroundView(): void {
        this.isUndergroundView = !this.isUndergroundView;

        if (this.isUndergroundView) {
            // Speichere die ursprüngliche Kamerahöhe
            this.originalCameraHeight = this.camera.position.y;

            // Setze die Kamera tiefer für die Untergrundansicht
            this.camera.position.y = 2;
        } else {
            // Stelle die ursprüngliche Kamerahöhe wieder her
            this.camera.position.y = this.originalCameraHeight;
        }

        // Aktualisiere die Terrain-Renderer-Einstellungen
        this.terrain3DRenderer.setUndergroundView(this.isUndergroundView);
    }
}

// Anwendung starten, wenn DOM geladen ist
window.addEventListener('DOMContentLoaded', () => {
    new App();
});
