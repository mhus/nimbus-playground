import { Engine, Scene, FreeCamera, Vector3, HemisphericLight } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { Terrain3DRenderer } from './terrain3d';

// Level-Interface für die Tile-Datenstruktur
interface Level {
    level: number;
    texture?: string;  // Optional für 2D-Texturen
    gltfFile?: string; // Optional für 3D-glTF-Dateien (z.B. "road/roadTile_050.gltf")
    rotation?: number; // Optional: Rotation in Grad (0, 90, 180, 270)
}

// Tile-Interface mit Level-Array
interface Tile {
    levels: Level[];
}

// Struktur für Tile-Koordinaten in der Atlas-Textur
interface TileCoordinates {
    x: number;      // X-Position in Pixeln
    y: number;      // Y-Position in Pixeln
    width: number;  // Breite in Pixeln
    height: number; // Höhe in Pixeln
}

// Tile-Atlas-Konfiguration
interface TileAtlas {
    textureWidth: number;   // Gesamtbreite der Atlas-Textur
    textureHeight: number;  // Gesamthöhe der Atlas-Textur
    tiles: { [key: string]: TileCoordinates }; // Tile-Definitionen
}

// Viewport-Konfiguration für das sichtbare Terrain
interface ViewportConfig {
    viewportCenterX: number;  // Globale X-Koordinate des Viewport-Zentrums
    viewportCenterY: number;  // Globale Y-Koordinate des Viewport-Zentrums
    viewportWidth: number;    // Anzahl der sichtbaren Kacheln in X-Richtung
    viewportHeight: number;   // Anzahl der sichtbaren Kacheln in Y-Richtung
}

// Biom-Information für Terrain-Generierung
interface BiomeInfo {
    baseTexture: string;           // Basis-Textur des Bioms
    vegetationTexture: string | null; // Vegetation/Detail-Textur (optional)
    vegetationThreshold: number;   // Schwellenwert für Vegetation (0-1)
    name: string;                  // Name des Bioms für Vergleiche
}

// Terrain-Daten-Interface für JSON-Serialisierung
interface TerrainData {
    version: string;
    worldSize: number;
    metadata: {
        name: string;
        description: string;
        created: string;
        author?: string;
    };
    tiles: {
        [key: string]: {
            levels: Level[];
        };
    };
    features: {
        lakes: Array<{ x: number; y: number; radius: number; name?: string }>;
        rivers: Array<{
            from: { x: number; y: number };
            to: { x: number; y: number };
            width: number;
            curved?: boolean;
            name?: string;
        }>;
        deserts: Array<{ x: number; y: number; width: number; height: number; name?: string }>;
    };
}

interface RenderCoordinates {
    globalX: number;
    globalY: number;
    localX: number;
    localY: number;
}

// TileProvider-Klasse für das große Terrain
class TileProvider {
    private tileCache: Map<string, Tile>; // Cache für bereits generierte Tiles
    private isGenerated: boolean = false; // Flag ob Terrain bereits generiert wurde
    private worldSize: number = 200; // Dynamische Weltgröße (Standard-Fallback)

    constructor() {
        this.tileCache = new Map();
    }

    /**
     * Generiert das gesamte Terrain beim Start und lädt es in den Cache
     * Diese Methode sollte einmal beim Start aufgerufen werden
     * Versucht zuerst JSON zu laden, falls verfügbar
     */
    public async generateAllTerrain(jsonPath?: string): Promise<void> {
        if (this.isGenerated) {
            console.log('Terrain bereits generiert');
            return;
        }

        // Versuche zuerst JSON zu laden
        if (jsonPath) {
            try {
                await this.loadTerrainFromJson(jsonPath);
                console.log('JSON-Terrain erfolgreich geladen');
                this.manipulateTerrain();
                this.isGenerated = true;
                return;
            } catch (error) {
                console.warn('JSON-Terrain konnte nicht geladen werden, verwende prozedurales Terrain:', error);
            }
        }

    }

    /**
     * Holt ein Tile für die gegebenen globalen Koordinaten aus dem Cache
     * Das Terrain muss vorher mit generateAllTerrain() generiert worden sein
     */
    public getTile(globalX: number, globalY: number): Tile {
        if (!this.isGenerated) {
            throw new Error('Terrain wurde noch nicht generiert! Rufen Sie zuerst generateAllTerrain() auf.');
        }

        const key = `${globalX},${globalY}`;
        const tile = this.tileCache.get(key);

        if (!tile) {
            // Fallback: Ungültige Koordinaten oder Fehler
            console.warn(`Tile nicht gefunden für Koordinaten (${globalX}, ${globalY})`);
            return this.createEmptyTile();
        }

        return tile;
    }

    /**
     * Prüft ob Koordinaten im gültigen Bereich sind
     */
    public isValidCoordinate(globalX: number, globalY: number): boolean {
        return globalX >= 0 && globalX < this.worldSize &&
               globalY >= 0 && globalY < this.worldSize;
    }

    public manipulateTerrain() {
        this.tileCache.set("100,100", { levels: [{ level: 0, texture: 'water' }] });
        this.tileCache.set("99,99", { levels: [{ level: 0, gltfFile: "road/roadTile_050.gltf", rotation: 180 }] });
    }

    /**
     * Lädt Terrain-Daten aus einer JSON-Datei
     */
    public async loadTerrainFromJson(jsonPath: string): Promise<void> {
        try {
            console.log(`Lade Terrain aus JSON: ${jsonPath}`);
            const response = await fetch(jsonPath);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            var terrainData = await response.json();

            if (terrainData) {
                // Weltgröße aus den Terrain-Daten setzen
                this.worldSize = terrainData.worldSize;

                console.log(`Terrain geladen: "${terrainData.metadata.name}"`);
                console.log(`Beschreibung: ${terrainData.metadata.description}`);
                console.log(`Weltgröße: ${terrainData.worldSize}x${terrainData.worldSize}`);
                console.log(`Features: ${terrainData.features.lakes.length} Seen, ${terrainData.features.rivers.length} Flüsse, ${terrainData.features.deserts.length} Wüsten`);
            }

                if (terrainData != null) {
                    // JSON-Terrain-Daten in den Cache schreiben
                    console.log('Schreibe JSON-Terrain-Daten in den Cache...');
                    const startTime = performance.now();

                    // Explizite Tiles aus JSON in den Cache laden
                    for (const [key, tileData] of Object.entries(terrainData.tiles)) {
                        const typedTileData = tileData as { levels: Level[] };
                        this.tileCache.set(key, { levels: typedTileData.levels });
                    }
                }

        } catch (error) {
            console.error('Fehler beim Laden der Terrain-JSON:', error);
            throw error;
        }
    }

    /**
     * Erstellt ein leeres Tile als Fallback
     */
    private createEmptyTile(): Tile {
        return {
            levels: [{ level: 0, texture: 'dirt' }]
        };
    }

    public getWorldSize(): number {
        return this.worldSize;
    }
}

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
    private cameraRotationSpeed: number = 0.02;

    // KONFIGURATION: Zentrale Definition aller Konstanten
    private static readonly TILE_SIZE = 20;

    // Kamera-Konstanten
    private static readonly CAMERA_DISTANCE = 15;
    private static readonly CAMERA_HEIGHT = 8;
    private static readonly CAMERA_ANGLE = 30;

    // 3D-Terrain-Konstanten
    private static readonly TERRAIN_TILE_SIZE = 2; // 3D-Einheiten pro Tile
    public static readonly DEBUG_TILE_BORDERS = true;

    // Tile-Atlas-Konfiguration
    private readonly TILE_ATLAS: TileAtlas = {
        textureWidth: 512,
        textureHeight: 384,
        tiles: {
            'grass_bushes': { x: 350, y: 0, width: 325, height: 225 },
            'grass': { x: 0, y: 275, width: 325, height: 325 },
            'dirt': { x: 0, y: 650, width: 128, height: 128 },
            'water': { x: 0, y: 975, width: 128, height: 128 },
            'dirt_stones': { x: 700, y: 975, width: 128, height: 128 },
        }
    };

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
            this.TILE_ATLAS,
            this.scene,
            App.TERRAIN_TILE_SIZE
        );

        // Atlas für 3D-Renderer laden
        await this.terrain3DRenderer.loadAtlas('/assets/textures.png');

        // Initiales Terrain rendern
        this.terrain3DRenderer.updateViewport(
            this.globalOffsetX,
            this.globalOffsetY,
            this.localOffsetX,
            this.localOffsetY
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
                this.terrain3DRenderer.updateViewport(
                    this.globalOffsetX,
                    this.globalOffsetY,
                    this.localOffsetX,
                    this.localOffsetY
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

                if (rotateLeft || rotateRight) {
                    this.updateCameraPosition();
                }
            }
        };

        // Key-Events (identisch zum Original)
        window.addEventListener('keydown', (event) => {
            // Verhindere Standardverhalten für Pfeiltasten
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code)) {
                event.preventDefault();
            }

            switch (event.code) {
                case 'ArrowRight': moveRight = true; break;
                case 'ArrowLeft': moveLeft = true; break;
                case 'ArrowDown': moveDown = true; break;
                case 'ArrowUp': moveUp = true; break;
                case 'KeyA': rotateLeft = true; break;
                case 'KeyD': rotateRight = true; break;
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
            }
            updateMoving();
        });

        this.scene.registerBeforeRender(() => {
            if (moveRight || moveLeft || moveDown || moveUp || rotateLeft || rotateRight) {
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
            this.globalOffsetY -= 1;
            this.localOffsetY -= App.TERRAIN_TILE_SIZE;
            globalChanged = true;
        } else if (this.localOffsetY < 0) {
            this.globalOffsetY += 1;
            this.localOffsetY += App.TERRAIN_TILE_SIZE;
            globalChanged = true;
        }

        // Weltgrenzen prüfen
        if (globalChanged) {
            const halfTileSize = Math.ceil(App.TILE_SIZE / 2);
            this.globalOffsetX = Math.max(halfTileSize, Math.min(this.tileProvider.getWorldSize() - halfTileSize, this.globalOffsetX));
            this.globalOffsetY = Math.max(halfTileSize, Math.min(this.tileProvider.getWorldSize() - halfTileSize, this.globalOffsetY));
        }
    }

    private updateCameraPosition() {
        this.camera.position.x = App.CAMERA_DISTANCE * Math.cos(this.cameraRotationY);
        this.camera.position.z = App.CAMERA_DISTANCE * Math.sin(this.cameraRotationY);
        this.camera.setTarget(Vector3.Zero());
    }
}

// Anwendung starten, wenn DOM geladen ist
window.addEventListener('DOMContentLoaded', () => {
    new App();
});
