import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Texture, Color3, ActionManager, ExecuteCodeAction } from '@babylonjs/core';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF';

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
//        this.tileCache.set("99,99", { levels: [{ level: 0, gltfFile: "road/roadTile_050.gltf", rotation: 180 }] });
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

// Terrain-Renderer für dynamisches Kachel-Rendering
class TerrainRenderer {
    private tileProvider: TileProvider;
    private viewport: ViewportConfig;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private atlasImage: HTMLImageElement | null = null;
    private tileAtlas: TileAtlas;
    private tileSize: number;
    private needsRedraw: boolean = true;

    // glTF 2D support - cache für gerenderte glTF-Bilder
    private gltfImageCache: Map<string, HTMLImageElement> = new Map();
    private tempScene: Scene | null = null; // Temporäre Szene für glTF-Rendering
    private tempCamera: FreeCamera | null = null;
    private tempEngine: Engine | null = null;
    private tempCanvas: HTMLCanvasElement | null = null;

    constructor(
        tileProvider: TileProvider,
        viewport: ViewportConfig,
        tileAtlas: TileAtlas,
        tileSize: number = 64
    ) {
        this.tileProvider = tileProvider;
        this.viewport = viewport;
        this.tileAtlas = tileAtlas;
        this.tileSize = tileSize;

        // Canvas für das Terrain erstellen
        this.canvas = document.createElement('canvas');
        this.canvas.width = viewport.viewportWidth * tileSize;
        this.canvas.height = viewport.viewportHeight * tileSize;
        this.ctx = this.canvas.getContext('2d')!;

        // Temporäre Babylon.js Setup für glTF-Rendering
        this.setupTempBabylonScene();
    }

    /**
     * Erstellt eine temporäre Babylon.js Szene für glTF-zu-Bild Rendering
     */
    private setupTempBabylonScene(): void {
        // Temporärer Canvas für glTF-Rendering (klein und versteckt)
        this.tempCanvas = document.createElement('canvas');
        this.tempCanvas.width = 256;
        this.tempCanvas.height = 256;
        this.tempCanvas.style.display = 'none';
        document.body.appendChild(this.tempCanvas);

        // Temporäre Engine und Szene
        this.tempEngine = new Engine(this.tempCanvas, true);
        this.tempScene = new Scene(this.tempEngine);

        // Kamera für isometrische Ansicht
        this.tempCamera = new FreeCamera('tempCamera', new Vector3(3, 3, 3), this.tempScene);
        this.tempCamera.setTarget(Vector3.Zero());

        // Licht
        const light = new HemisphericLight('tempLight', new Vector3(0, 1, 0), this.tempScene);
        light.intensity = 1.0;
    }

    /**
     * Lädt das Atlas-Image
     */
    public async loadAtlas(atlasPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.atlasImage = new Image();
            this.atlasImage.crossOrigin = 'anonymous';
            this.atlasImage.onload = () => {
                this.needsRedraw = true;
                resolve();
            };
            this.atlasImage.onerror = reject;
            this.atlasImage.src = atlasPath;
        });
    }

    /**
     * Aktualisiert die Viewport-Position
     */
    public updateViewport(centerX: number, centerY: number): void {
        if (this.viewport.viewportCenterX !== centerX || this.viewport.viewportCenterY !== centerY) {
            this.viewport.viewportCenterX = centerX;
            this.viewport.viewportCenterY = centerY;
            this.needsRedraw = true;
        }
    }

    /**
     * Rendert das gesamte sichtbare Terrain
     */
    public render(): HTMLCanvasElement {
        if (!this.needsRedraw || !this.atlasImage) {
            return this.canvas;
        }
        this.needsRedraw = false;

        // Bereich der sichtbaren Tiles berechnen
        const startX = Math.floor(this.viewport.viewportCenterX - this.viewport.viewportWidth / 2);
        const startY = Math.floor(this.viewport.viewportCenterY - this.viewport.viewportHeight / 2);
        const endX = startX + this.viewport.viewportWidth;
        const endY = startY + this.viewport.viewportHeight;

        // Tiles sammeln und nach Z-Order sortieren (von oben links nach unten rechts)
        const tilesToRender: Array<{
            globalX: number;
            globalY: number;
            localX: number;
            localY: number;
            tile: Tile;
            zOrder: number;
        }> = [];

        for (let globalY = startY; globalY < endY; globalY++) {
            for (let globalX = startX; globalX < endX; globalX++) {
                if (this.tileProvider.isValidCoordinate(globalX, globalY)) {
                    const tile = this.tileProvider.getTile(globalX, globalY);
                    const localX = globalX - startX;
                    const localY = globalY - startY;

                    // Z-Order berechnen: höhere Y-Werte werden später gezeichnet (weiter vorne)
                    // Bei gleichem Y werden höhere X-Werte später gezeichnet
                    const zOrder = globalY * 10000 + globalX;

                    tilesToRender.push({
                        globalX,
                        globalY,
                        localX,
                        localY,
                        tile,
                        zOrder
                    });
                }
            }
        }

        // Nach Z-Order sortieren (von hinten nach vorne)
        tilesToRender.sort((a, b) => a.zOrder - b.zOrder);

        // Canvas leeren
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Tiles zeichnen
        for (const tileInfo of tilesToRender) {
            this.drawTile(
                tileInfo.tile,
                tileInfo.localX,
                tileInfo.localY,
                tileInfo.globalX,
                tileInfo.globalY
            );
        }

        // Debug: Tile-Ränder und Koordinaten zeichnen wenn aktiviert
        if (App.DEBUG_TILE_BORDERS) {
            this.drawDebugOverlay(tilesToRender);
        }
        return this.canvas;
    }

    /**
     * Zeichnet eine einzelne Kachel
     */
    private drawTile(
        tile: Tile,
        localX: number,
        localY: number,
        globalX: number,
        globalY: number
    ): void {
        const tileX = localX * this.tileSize;
        const tileY = localY * this.tileSize;

        // Sicherheitsprüfung für tile.levels
        if (!tile || !tile.levels || tile.levels.length === 0) {
            console.warn(`Ungültiges Tile an Position (${globalX}, ${globalY}):`, tile);
            return;
        }

        // Alle Level der Kachel durchgehen (sortiert nach Level)
        const sortedLevels = [...tile.levels].sort((a, b) => a.level - b.level);

        for (const level of sortedLevels) {
            // Prüfe ob es sich um ein glTF-Level handelt
            if (level.gltfFile) {
                // 3D glTF-Objekt verarbeiten
                this.handleGltfTile(level, tileX, tileY);
            } else if (level.texture) {
                // 2D-Textur verarbeiten
                this.handle2DTile(level, tileX, tileY);
            }
        }
    }

    /**
     * Verarbeitet ein 2D-Textur-Level
     */
    private handle2DTile(level: Level, tileX: number, tileY: number): void {
        const coords = this.getTileCoordinates(level.texture!);
        if (!coords) return;

        const { x: atlasX, y: atlasY, width: tileWidth, height: tileHeight } = coords;

        // Level-Offset berechnen (isometrischer 3D-Effekt)
        const levelOffsetX = level.level * 2;
        const levelOffsetY = level.level * -2;

        // Tile aus Atlas zeichnen
        this.ctx.drawImage(
            this.atlasImage!,
            atlasX, atlasY, tileWidth, tileHeight,
            tileX + levelOffsetX,
            tileY + levelOffsetY,
            this.tileSize,
            this.tileSize
        );
    }

    /**
     * Verarbeitet ein glTF-3D-Level als 2D-Bild
     */
    private async handleGltfTile(level: Level, tileX: number, tileY: number): Promise<void> {
        if (!level.gltfFile) return;

        try {
            // Cache-Key mit Rotation erstellen
            const cacheKey = `${level.gltfFile}_${level.rotation || 0}`;

            // Prüfe ob bereits im Cache
            let gltfImage = this.gltfImageCache.get(cacheKey);

            if (!gltfImage) {
                // glTF zu Bild rendern und cachen
                gltfImage = await this.renderGltfToImage(level.gltfFile, level.rotation || 0);
                this.gltfImageCache.set(cacheKey, gltfImage);
                console.log(`glTF zu Bild gerendert und gecacht: ${cacheKey}`);
            }

            // Level-Offset berechnen (isometrischer 3D-Effekt)
            const levelOffsetX = level.level * 2;
            const levelOffsetY = level.level * -2;

            // glTF-Bild auf das Terrain-Canvas zeichnen
            this.ctx.drawImage(
                gltfImage,
                tileX + levelOffsetX,
                tileY + levelOffsetY,
                this.tileSize,
                this.tileSize
            );

        } catch (error) {
            console.error(`Fehler beim Rendern von glTF-Datei ${level.gltfFile}:`, error);
        }
    }

    /**
     * Rendert ein glTF-Modell zu einem Bild
     */
    private async renderGltfToImage(gltfFile: string, rotation: number = 0): Promise<HTMLImageElement> {
        if (!this.tempScene || !this.tempEngine || !this.tempCanvas || !this.tempCamera) {
            throw new Error('Temporäre Babylon.js Szene nicht initialisiert');
        }

        try {
            // glTF-Modell in temporäre Szene laden
            const result = await SceneLoader.ImportMeshAsync("", "/assets/", gltfFile, this.tempScene);
            const meshes = result.meshes;

            if (meshes.length === 0) {
                throw new Error('Keine Meshes in glTF-Datei gefunden');
            }

            // Modell zentrieren und skalieren (ohne Rotation)
            this.centerAndScaleMeshes(meshes);

            // Kamera-Position basierend auf Rotation berechnen
            const distance = 5; // Feste Entfernung
            const height = 3;   // Feste Höhe

            // Rotation in Radiant umwandeln und Kamera entsprechend positionieren
            const rotationRad = (rotation * Math.PI) / 180;
            const cameraX = distance * Math.cos(rotationRad);
            const cameraZ = distance * Math.sin(rotationRad);

            // Kamera neu positionieren
            this.tempCamera.position.x = cameraX;
            this.tempCamera.position.y = height;
            this.tempCamera.position.z = cameraZ;
            this.tempCamera.setTarget(Vector3.Zero());

            // Ein Frame rendern
            this.tempScene.render();

            // Canvas zu Bild konvertieren
            const dataUrl = this.tempCanvas.toDataURL();
            const image = new Image();

            return new Promise((resolve, reject) => {
                image.onload = () => {
                    // Meshes nach dem Rendern entfernen
                    meshes.forEach(mesh => mesh.dispose());
                    resolve(image);
                };
                image.onerror = reject;
                image.src = dataUrl;
            });

        } catch (error) {
            console.error(`Fehler beim Rendern von ${gltfFile} zu Bild:`, error);
            throw error;
        }
    }

    /**
     * Zentriert und skaliert Meshes für optimale Darstellung
     */
    private centerAndScaleMeshes(meshes: any[]): void {
        if (meshes.length === 0) return;

        // Bounding Box berechnen
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        meshes.forEach(mesh => {
            if (mesh.getBoundingInfo) {
                const boundingInfo = mesh.getBoundingInfo();
                const min = boundingInfo.minimum;
                const max = boundingInfo.maximum;

                minX = Math.min(minX, min.x);
                maxX = Math.max(maxX, max.x);
                minY = Math.min(minY, min.y);
                maxY = Math.max(maxY, max.y);
                minZ = Math.min(minZ, min.z);
                maxZ = Math.max(maxZ, max.z);
            }
        });

        // Zentrum berechnen
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centerZ = (minZ + maxZ) / 2;

        // Größe berechnen
        const sizeX = maxX - minX;
        const sizeY = maxY - minY;
        const sizeZ = maxZ - minZ;
        const maxSize = Math.max(sizeX, sizeY, sizeZ);

        // Skalierungsfaktor berechnen (Modell soll in 2x2x2 Einheiten passen)
        const scaleFactor = maxSize > 0 ? 2 / maxSize : 1;

        // Meshes zentrieren und skalieren
        meshes.forEach(mesh => {
            // Zentrieren
            mesh.position.x -= centerX;
            mesh.position.y -= centerY;
            mesh.position.z -= centerZ;

            // Skalieren
            mesh.scaling = new Vector3(scaleFactor, scaleFactor, scaleFactor);
        });
    }

    /**
     * Cleanup-Methode - entfernt nicht mehr benötigte 3D-Objekte
     */
    private cleanupInactiveTileObjects(): void {
        // Diese Methode ist jetzt leer, da wir keine 3D-Objekte mehr verwalten
        // glTF-Dateien werden als 2D-Bilder gerendert
    }

    /**
     * Holt Tile-Koordinaten aus dem Atlas
     */
    private getTileCoordinates(textureName: string): TileCoordinates | null {
        return this.tileAtlas.tiles[textureName] || null;
    }

    /**
     * Forciert ein Neuzeichnen
     */
    public forceRedraw(): void {
        this.needsRedraw = true;
    }

    /**
     * Gibt die Canvas-Größe zurück
     */
    public getCanvasSize(): { width: number; height: number } {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }

    /**
     * Zeichnet Debug-Overlay mit Tile-Rändern und Koordinaten
     */
    private drawDebugOverlay(tilesToRender: Array<{
        globalX: number;
        globalY: number;
        localX: number;
        localY: number;
        tile: Tile;
        zOrder: number;
    }>): void {

        // Canvas-Kontext für Debug-Zeichnung vorbereiten
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = 'red';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (const tileInfo of tilesToRender) {
            const tileX = tileInfo.localX * this.tileSize;
            const tileY = tileInfo.localY * this.tileSize;

            // Roten Rahmen um das Tile zeichnen
            this.ctx.strokeRect(tileX, tileY, this.tileSize, this.tileSize);

            // Text mit weißem Hintergrund für bessere Lesbarkeit
            const coordText1 = `${tileInfo.globalX}`;
            const coordText2 = `${tileInfo.globalY}`;

            // Roten Text zeichnen
            this.ctx.fillText(coordText1, tileX + 12, tileY + 7);
            this.ctx.fillText(coordText2, tileX + 12, tileY + 17);
        }
    }
}

class App {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene!: Scene;
    private camera!: FreeCamera; // Kamera-Referenz hinzufügen
    private tileMaterial!: StandardMaterial;
    private tileTexture!: Texture;
    private tileProvider: TileProvider;
    private terrainRenderer: TerrainRenderer;
    private viewport: ViewportConfig;

    // Bewegungsparameter
    private globalOffsetX: number = 100; // Start in der Mitte des großen Terrains
    private globalOffsetY: number = 100;
    private localOffsetX: number = 0; // Lokales Offset für flüssige Bewegung
    private localOffsetY: number = 0; // Lokales Offset für flüssige Bewegung
    private moveSpeed: number = 0.02; // In Tile-Einheiten pro Tastendruck

    // Kamera-Rotationsparameter
    private cameraRotationY: number = -Math.PI / 2; // Rotation um die Y-Achse in Radiant
    private cameraRotationSpeed: number = 0.02; // Rotationsgeschwindigkeit pro Frame

    // Terrain-Update-System: Entkopplung von Animation und Rendering
    private terrainUpdateRequested: RenderCoordinates|null = null;
    private lastTerrainUpdate: number = 0;
    private readonly TERRAIN_UPDATE_THROTTLE = 200; // Erhöht auf 200ms für weniger Updates
    private isUpdatingTerrain: boolean = false; // Flag um gleichzeitige Updates zu verhindern

    // KONFIGURATION: Zentrale Definition aller Konstanten
    private static readonly TILE_SIZE = 20; // Anzahl der lokal dargestellten Tiles in beide Richtungen

    // Kamera-Konstanten
    private static readonly CAMERA_DISTANCE = 15;  // Entfernung der Kamera vom Zentrum
    private static readonly CAMERA_HEIGHT = 8;     // Höhe der Kamera (flacher = niedriger Wert)
    private static readonly CAMERA_ANGLE = 30;     // Winkel in Grad (0° = horizontal, 90° = von oben)

    // Ground-Konstanten
    public static readonly GROUND_SIZE = 40;          // Größe der Ebene (40x40 Einheiten)
    private static readonly GROUND_SUBDIVISIONS = 30;  // Geometrie-Unterteilungen für glatte Darstellung
    public static readonly DEBUG_TILE_BORDERS = true; // Debug: Kachel-Ränder sichtbar machen

    // Opacity-Konstanten
    private static readonly OPACITY_SIZE = 512;
    private static readonly FADE_DISTANCE = 0.1; // Fade-Bereich vom Rand (0.0 - 0.5)

    // Terrain-Renderer-Konstanten
    private static readonly TILE_PIXEL_SIZE = 64; // Tile-Größe in Pixeln

    // Tile-Atlas-Konfiguration - nur vollflächige Texturen
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
        // Canvas-Element aus dem DOM holen
        this.canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

        // Babylon.js Engine initialisieren
        this.engine = new Engine(this.canvas, true);

        // TileProvider initialisieren
        this.tileProvider = new TileProvider();

        // Viewport-Konfiguration
        this.viewport = {
            viewportCenterX: this.globalOffsetX,
            viewportCenterY: this.globalOffsetY,
            viewportWidth: App.TILE_SIZE,   // Verwende TILE_SIZE für Breite
            viewportHeight: App.TILE_SIZE   // Verwende TILE_SIZE für Höhe
        };

        // Terrain-Renderer initialisieren
        this.terrainRenderer = new TerrainRenderer(
            this.tileProvider,
            this.viewport,
            this.TILE_ATLAS,
            App.TILE_PIXEL_SIZE // Tile-Größe in Pixeln
        );

        // Async Initialisierung
        this.initializeScene();

        // Window-Resize-Event behandeln
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    private async initializeScene(): Promise<void> {
        // Atlas laden
        await this.terrainRenderer.loadAtlas('/assets/textures.png');

        // Terrain generieren BEVOR die Szene erstellt wird
        console.log('Starte Terrain-Generierung...');
        await this.tileProvider.generateAllTerrain('/assets/terrain.json');

        // Szene erstellen
        this.scene = await this.createScene();

        // Keyboard-Events einrichten
        this.setupKeyboardControls();

        // Separaten Timer für Terrain-Updates starten
        this.startTerrainUpdateTimer();

        // Render-Loop starten
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    /**
     * Startet einen separaten Timer für Terrain-Updates
     * Entkoppelt von der Render-Loop für bessere Performance
     */
    private startTerrainUpdateTimer(): void {
        setInterval(() => {
            if (this.terrainUpdateRequested) {
                let localRequest = this.terrainUpdateRequested;
                this.terrainUpdateRequested = null;
                this.updateTerrainTexture(localRequest);

                // Position loggen wenn Update stattfindet
//                console.log(`Terrain updated at position: (${Math.round(this.globalOffsetX)}, ${Math.round(this.globalOffsetY)})`);
            }
        }, this.TERRAIN_UPDATE_THROTTLE);
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

        // Ebene erstellen
        const ground = MeshBuilder.CreateGround('ground', {
            width: App.GROUND_SIZE,
            height: App.GROUND_SIZE,
            subdivisions: App.GROUND_SUBDIVISIONS
        }, scene);

        // Material mit dynamischer Textur erstellen
        this.tileMaterial = await this.createDynamicTileMaterial(scene);
        ground.material = this.tileMaterial;

        return scene;
    }

    private async createDynamicTileMaterial(scene: Scene): Promise<StandardMaterial> {
        const material = new StandardMaterial('tileMaterial', scene);

        // Initiales Terrain rendern
        const terrainCanvas = this.terrainRenderer.render();

        // Textur aus dem gerendeten Canvas erstellen
        this.tileTexture = new Texture('data:' + terrainCanvas.toDataURL(), scene);
        this.tileTexture.wrapU = Texture.WRAP_ADDRESSMODE; // Geändert von CLAMP zu WRAP für flüssige Bewegung
        this.tileTexture.wrapV = Texture.WRAP_ADDRESSMODE; // Geändert von CLAMP zu WRAP für flüssige Bewegung

        material.diffuseTexture = this.tileTexture;
        material.specularColor = Color3.Black();

        // Opacity-Textur für Rand-Fade hinzufügen
        const opacityTexture = this.createOpacityTexture(scene);
        material.opacityTexture = opacityTexture;

        return material;
    }

    /**
     * Erstellt eine Opacity-Textur für den Rand-Fade-Effekt
     */
    private createOpacityTexture(scene: Scene): Texture {
        const OPACITY_SIZE = App.OPACITY_SIZE;
        const FADE_DISTANCE = App.FADE_DISTANCE; // Fade-Bereich vom Rand (0.0 - 0.5)

        const canvas = document.createElement('canvas');
        canvas.width = OPACITY_SIZE;
        canvas.height = OPACITY_SIZE;
        const ctx = canvas.getContext('2d')!;

        // ImageData für pixel-genaue Kontrolle
        const imageData = ctx.createImageData(OPACITY_SIZE, OPACITY_SIZE);
        const data = imageData.data;

        const centerX = OPACITY_SIZE / 2;
        const centerY = OPACITY_SIZE / 2;
        const maxRadius = Math.min(centerX, centerY);
        const fadeRadius = maxRadius * (1 - FADE_DISTANCE);

        for (let y = 0; y < OPACITY_SIZE; y++) {
            for (let x = 0; x < OPACITY_SIZE; x++) {
                const index = (y * OPACITY_SIZE + x) * 4;

                // Distanz vom Zentrum
                const dx = x - centerX;
                const dy = y - centerY;
                const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

                let alpha = 1.0;

                if (distanceFromCenter > fadeRadius) {
                    // Fade-Bereich
                    const fadeProgress = (distanceFromCenter - fadeRadius) / (maxRadius - fadeRadius);
                    alpha = 1.0 - Math.min(1.0, fadeProgress);

                    // Weichere Kurve für natürlicheren Fade
                    alpha = alpha * alpha;
                }

                // RGB auf weiß setzen (wird ignoriert bei Opacity-Textur)
                data[index] = 255;     // R
                data[index + 1] = 255; // G
                data[index + 2] = 255; // B
                data[index + 3] = Math.round(alpha * 255); // A
            }
        }

        ctx.putImageData(imageData, 0, 0);

        const opacityTexture = new Texture('data:' + canvas.toDataURL(), scene);
        opacityTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        opacityTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
        opacityTexture.hasAlpha = true;

        return opacityTexture;
    }

    /**
     * Aktualisiert die Terrain-Textur basierend auf der aktuellen Position
     * Asynchrone Version um das Flimmern zu reduzieren
     */
    private async updateTerrainTexture(coordinates : RenderCoordinates): Promise<void> {
        // Verhindert gleichzeitige Updates
        if (this.isUpdatingTerrain) {
            return;
        }
        this.isUpdatingTerrain = true;

        try {

            // 4. JETZT erst Viewport aktualisieren und neues Terrain rendern
            this.terrainRenderer.updateViewport(coordinates.globalX, coordinates.globalY);
            const newTerrainCanvas = this.terrainRenderer.render();

            // 5. Finale Textur mit neuen Kacheln erstellen
            const oldTexture = this.tileTexture;
            this.tileTexture =  await this.createTextureFromCanvas(newTerrainCanvas, coordinates.localX / App.GROUND_SIZE, coordinates.localY / App.GROUND_SIZE);

            if (this.tileMaterial) {
                // Direkte atomare Zuweisung
                this.tileMaterial.diffuseTexture = this.tileTexture;
            }

            // Alte Textur dispose
            if (oldTexture) {
                setTimeout(() => {
                    oldTexture.dispose();
                }, 50);
            }

//            console.log(`🏁 TERRAIN UPDATE END - Final Local: (${this.localOffsetX.toFixed(3)}, ${this.localOffsetY.toFixed(3)})`);
        } catch (error) {
            console.error('Fehler beim Terrain-Update:', error);
        } finally {
            this.isUpdatingTerrain = false;
        }
    }

    /**
     * Erstellt eine Babylon.js Textur aus einem Canvas-Element
     * Asynchrone Version für bessere Performance
     */
    private async createTextureFromCanvas(canvas: HTMLCanvasElement, uOffset: number = 0, vOffset: number = 0): Promise<Texture> {
        return new Promise((resolve) => {
            // Canvas zu Base64 konvertieren (kann bei großen Canvases Zeit dauern)
            setTimeout(() => {
                const dataUrl = canvas.toDataURL();
                const texture = new Texture('data:' + dataUrl, this.scene);
                texture.wrapU = Texture.WRAP_ADDRESSMODE; // Geändert von CLAMP zu WRAP für konsistente Bewegung
                texture.wrapV = Texture.WRAP_ADDRESSMODE; // Geändert von CLAMP zu WRAP für konsistente Bewegung

                // UV-Offsets sofort nach der Erstellung setzen
                texture.uOffset = uOffset;
                texture.vOffset = vOffset;

                resolve(texture);
            }, 0); // Gibt anderen Tasks die Chance zu laufen
        });
    }

    private setupKeyboardControls(): void {
        // Bewegungsgeschwindigkeit pro Frame
        const frameSpeed = 0.05;

        // Kontinuierliche Bewegung für gehaltene Tasten
        let moveRight = false;
        let moveLeft = false;
        let moveDown = false;
        let moveUp = false;
        let rotateLeft = false;
        let rotateRight = false;

        const updateMoving = () => {
            let moved = false;

            // Bewegung nur wenn Keys gedrückt sind
            if (moveRight) {
                // Rechts relativ zur Kamera (90° rechts von Kamerablickrichtung)
                this.localOffsetX += frameSpeed * Math.cos(this.cameraRotationY + Math.PI / 2);
                this.localOffsetY += frameSpeed * Math.sin(this.cameraRotationY + Math.PI / 2);
                // this.localOffsetX -= frameSpeed;
                moved = true;
            }
            if (moveLeft) {
                // Links relativ zur Kamera (90° links von Kamerablickrichtung)
                this.localOffsetX -= frameSpeed * Math.cos(this.cameraRotationY + Math.PI / 2);
                this.localOffsetY -= frameSpeed * Math.sin(this.cameraRotationY + Math.PI / 2);
                // this.localOffsetX += frameSpeed;
                moved = true;
            }
            if (moveDown) {
                // ArrowDown: Zur Kamera hin (entgegengesetzt zur Kamerablickrichtung)
                this.localOffsetX += frameSpeed * Math.cos(this.cameraRotationY);
                this.localOffsetY += frameSpeed * Math.sin(this.cameraRotationY);
                // this.localOffsetY -= frameSpeed;
                moved = true;
            }
            if (moveUp) {
                // ArrowUp: Von der Kamera weg (in Kamerablickrichtung)
                this.localOffsetX -= frameSpeed * Math.cos(this.cameraRotationY);
                this.localOffsetY -= frameSpeed * Math.sin(this.cameraRotationY);
                // this.localOffsetY += frameSpeed;
                moved = true;
            }

            // Lokale Offsets prüfen und bei Bedarf globale Offsets anpassen
            if (moved) {
                this.updateGlobalOffsets();
                if (!this.terrainUpdateRequested && !this.isUpdatingTerrain) {
                    this.updateTextureOffset();
                }
            }

            // Kamera-Rotation
            if (this.camera) {
                if (rotateLeft) {
                    // Nach links drehen
                    this.cameraRotationY -= this.cameraRotationSpeed;
                    if (this.cameraRotationY < -Math.PI) {
                        this.cameraRotationY += 2 * Math.PI;
                    }
                }
                if (rotateRight) {
                    // Nach rechts drehen
                    this.cameraRotationY += this.cameraRotationSpeed;
                    if (this.cameraRotationY > Math.PI) {
                        this.cameraRotationY -= 2 * Math.PI;
                    }
                }

                // Kamera aktualisieren nur wenn Rotation stattgefunden hat
                if (rotateLeft || rotateRight) {
                    this.updateCameraPosition();
                }
            }
        };

        // Key-Down Events - Keys sofort auswerten
        window.addEventListener('keydown', (event) => {
            // Verhindere Standardverhalten für Pfeiltasten
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code)) {
                event.preventDefault();
            }

            switch (event.code) {
                case 'ArrowRight':
                    moveRight = true;
                    break;
                case 'ArrowLeft':
                    moveLeft = true;
                    break;
                case 'ArrowDown':
                    moveDown = true;
                    break;
                case 'ArrowUp':
                    moveUp = true;
                    break;
                case 'KeyA':
                    rotateLeft = true;
                    break;
                case 'KeyD':
                    rotateRight = true;
                    break;
            }
            updateMoving();
        });

        // Key-Up Events - Keys sofort auswerten
        window.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'ArrowRight':
                    moveRight = false;
                    break;
                case 'ArrowLeft':
                    moveLeft = false;
                    break;
                case 'ArrowDown':
                    moveDown = false;
                    break;
                case 'ArrowUp':
                    moveUp = false;
                    break;
                case 'KeyA':
                    rotateLeft = false;
                    break;
                case 'KeyD':
                    rotateRight = false;
                    break;
            }
            updateMoving();
        });

        // Kontinuierliche Bewegung im Render-Loop - nur für gehaltene Tasten
        this.scene.registerBeforeRender(() => {
            if (moveRight || moveLeft || moveDown || moveUp || rotateLeft || rotateRight) {
                updateMoving();
            }
        });
    }

    /**
     * Fordert ein Terrain-Update an (entkoppelt vom Rendering)
     */
    private requestTerrainUpdate(): void {
        this.terrainUpdateRequested = {
            globalX: this.globalOffsetX,
            globalY: this.globalOffsetY,
            localX: this.localOffsetX,
            localY: this.localOffsetY
        };
    }

    /**
     * Aktualisiert die globalen Offsets basierend auf den lokalen Offsets
     * Wird aufgerufen wenn lokale Offsets die GROUND_SIZE Grenzen überschreiten
     */
    private updateGlobalOffsets(): void {
        // Prüfe ob lokale Offsets die Grenzen überschreiten
        let globalChanged = false;

//        console.log(`>>> Offsets before update: Local=(${this.localOffsetX.toFixed(3)}, ${this.localOffsetY.toFixed(3)}) Global=(${this.globalOffsetX}, ${this.globalOffsetY})`);

        // X-Achse prüfen - behalte den Rest-Offset bei
        if (this.localOffsetX >= 2) {
            this.globalOffsetX += 1;
            this.localOffsetX -= 2;
            globalChanged = true;
        } else if (this.localOffsetX < 0) {
            this.globalOffsetX -= 1;
            this.localOffsetX += 2;
            globalChanged = true;
        }

        // Y-Achse prüfen - behalte den Rest-Offset bei
        if (this.localOffsetY >= 2) {
            this.globalOffsetY -= 1;
            this.localOffsetY -= 2;
            globalChanged = true;
        } else if (this.localOffsetY < 0) {
            this.globalOffsetY += 1;
            this.localOffsetY += 2;
            globalChanged = true;
        }

        // Weltgrenzen prüfen
        if (globalChanged) {
            const halfTileSize = Math.ceil(App.TILE_SIZE / 2);
            this.globalOffsetX = Math.max(halfTileSize, Math.min(this.tileProvider.getWorldSize() - halfTileSize, this.globalOffsetX));
            this.globalOffsetY = Math.max(halfTileSize, Math.min(this.tileProvider.getWorldSize() - halfTileSize, this.globalOffsetY));

//            console.log(`🔄 Global offset changed! New: Local=(${this.localOffsetX.toFixed(3)}, ${this.localOffsetY.toFixed(3)}) Global=(${this.globalOffsetX}, ${this.globalOffsetY})`);

            // Terrain-Update anfordern da sich die globale Position geändert hat
            this.requestTerrainUpdate();
        }
//        console.log(`🔄 Offsets after update: Local=(${this.localOffsetX.toFixed(3)}, ${this.localOffsetY.toFixed(3)}) Global=(${this.globalOffsetX}, ${this.globalOffsetY})`);
    }

    /**
     * Aktualisiert das Textur-Offset basierend auf den lokalen Offsets
     * Verschiebt die Textur flüssig ohne Terrain-Update
     */
    private updateTextureOffset(): void {
        // KRITISCHER FIX: Keine UV-Updates während Terrain-Update läuft
        // Das verhindert Race Conditions und Doppel-Updates
        // if (this.isUpdatingTerrain) {
        //     return;
        // }

        if (this.tileMaterial?.diffuseTexture) {
            // Sicherstellen dass wir eine Texture (nicht BaseTexture) haben
            const diffuseTexture = this.tileMaterial.diffuseTexture as Texture;

            // Normalisierte Offset-Werte berechnen (0-1 Bereich)
            const normalizedOffsetX = this.localOffsetX / App.GROUND_SIZE;
            const normalizedOffsetY = this.localOffsetY / App.GROUND_SIZE;

            // UV-Offset setzen für flüssige Bewegung
            diffuseTexture.uOffset = normalizedOffsetX;
            diffuseTexture.vOffset = normalizedOffsetY;

            // Temporäres Debug-Logging für Y-Achsen-Problem
//            console.log(`📍 UV-OFFSET UPDATE - Local: (${this.localOffsetX.toFixed(3)}, ${this.localOffsetY.toFixed(3)}) → UV: (${normalizedOffsetX.toFixed(3)}, ${normalizedOffsetY.toFixed(3)})`);
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
