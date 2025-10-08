import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Texture, Color3, ActionManager, ExecuteCodeAction } from '@babylonjs/core';

// Level-Interface für die Tile-Datenstruktur
interface Level {
    level: number;
    texture: string;
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

// TileProvider-Klasse für das große Terrain
class TileProvider {
    private static readonly WORLD_SIZE = 1000; // Sehr großes Terrain (1000x1000)
    private tileCache: Map<string, Tile>; // Cache für bereits generierte Tiles

    constructor() {
        this.tileCache = new Map();
    }

    /**
     * Holt ein Tile für die gegebenen globalen Koordinaten
     * Verwendet Caching für bessere Performance
     */
    public getTile(globalX: number, globalY: number): Tile {
        const key = `${globalX},${globalY}`;

        // Aus Cache laden falls vorhanden
        if (this.tileCache.has(key)) {
            return this.tileCache.get(key)!;
        }

        // Neues Tile generieren
        const tile = this.generateTile(globalX, globalY);
        this.tileCache.set(key, tile);
        return tile;
    }

    /**
     * Generiert ein neues Tile basierend auf globalen Koordinaten
     */
    private generateTile(globalX: number, globalY: number): Tile {
        // Deterministische Generierung basierend auf Koordinaten
        const seed = this.hashCoordinates(globalX, globalY);
        const random = this.seededRandom(seed);

        const levels: Level[] = [];

        // Basis-Level (0) immer vorhanden
        if (random < 0.6) {
            levels.push({ level: 0, texture: 'grass' });
        } else if (random < 0.8) {
            levels.push({ level: 0, texture: 'dirt' });
        } else {
            levels.push({ level: 0, texture: 'water' });
        }

        // Gelegentlich ein zweites Level hinzufügen
        const secondRandom = this.seededRandom(seed + 1);
        if (secondRandom < 0.3) {
            levels.push({ level: 1, texture: 'grass_bushes' });
        }

        return { levels };
    }

    /**
     * Hash-Funktion für deterministische Zufallszahlen
     */
    private hashCoordinates(x: number, y: number): number {
        let hash = 0;
        const str = `${x},${y}`;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Seeded Random Generator für deterministische Zufallszahlen
     */
    private seededRandom(seed: number): number {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Prüft ob Koordinaten im gültigen Bereich sind
     */
    public isValidCoordinate(globalX: number, globalY: number): boolean {
        return globalX >= 0 && globalX < TileProvider.WORLD_SIZE &&
               globalY >= 0 && globalY < TileProvider.WORLD_SIZE;
    }

    /**
     * Invalidiert Cache für ein Tile (für dynamische Änderungen)
     */
    public invalidateTile(globalX: number, globalY: number): void {
        const key = `${globalX},${globalY}`;
        this.tileCache.delete(key);
    }

    public getWorldSize(): number {
        return TileProvider.WORLD_SIZE;
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

        // Canvas leeren
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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

        this.needsRedraw = false;
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

        // Alle Level der Kachel durchgehen (sortiert nach Level)
        const sortedLevels = [...tile.levels].sort((a, b) => a.level - b.level);

        for (const level of sortedLevels) {
            // Texture-Koordinaten für dieses Level holen
            const coords = this.getTileCoordinates(level.texture);
            if (!coords) continue;

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
}

class App {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene!: Scene;
    private tileMaterial!: StandardMaterial;
    private tileTexture!: Texture;
    private tileProvider: TileProvider;
    private terrainRenderer: TerrainRenderer;
    private viewport: ViewportConfig;

    // Bewegungsparameter
    private globalOffsetX: number = 500; // Start in der Mitte des großen Terrains
    private globalOffsetY: number = 500;
    private moveSpeed: number = 1; // In Tile-Einheiten pro Tastendruck

    // Terrain-Update-System: Entkopplung von Animation und Rendering
    private terrainUpdateRequested: boolean = false;
    private lastTerrainUpdate: number = 0;
    private readonly TERRAIN_UPDATE_THROTTLE = 100; // Minimum 100ms zwischen Updates

    // KONFIGURATION: Zentrale Definition aller Konstanten
    private static readonly TILE_SIZE = 20; // Anzahl der lokal dargestellten Tiles in beide Richtungen

    // Kamera-Konstanten
    private static readonly CAMERA_DISTANCE = 15;  // Entfernung der Kamera vom Zentrum
    private static readonly CAMERA_HEIGHT = 8;     // Höhe der Kamera (flacher = niedriger Wert)
    private static readonly CAMERA_ANGLE = 30;     // Winkel in Grad (0° = horizontal, 90° = von oben)

    // Ground-Konstanten
    private static readonly GROUND_SIZE = 20;          // Größe der Ebene (20x20 Einheiten)
    private static readonly GROUND_SUBDIVISIONS = 30;  // Geometrie-Unterteilungen für glatte Darstellung
    private static readonly DEBUG_TILE_BORDERS = false; // Debug: Kachel-Ränder sichtbar machen

    // Opacity-Konstanten
    private static readonly OPACITY_SIZE = 512;
    private static readonly FADE_DISTANCE = 0.1; // Fade-Bereich vom Rand (0.0 - 0.5)

    // Terrain-Renderer-Konstanten
    private static readonly TILE_PIXEL_SIZE = 32; // Tile-Größe in Pixeln

    // Tile-Atlas-Konfiguration
    private readonly TILE_ATLAS: TileAtlas = {
        textureWidth: 512,
        textureHeight: 384,
        tiles: {
            'grass_bushes': { x: 350, y: 0, width: 325, height: 225 },
            'grass': { x: 0, y: 275, width: 325, height: 325 },
            'dirt_l_grass_r': { x: 350, y: 275, width: 325, height: 325 },
            'dirt_lb_grass_ru': { x: 700, y: 275, width: 325, height: 325 },
            'dirt': { x: 0, y: 650, width: 128, height: 128 },
            'grass_l_dirt_r': { x: 350, y: 650, width: 325, height: 325 },
            'grass_lu_dirt_rb': { x: 700, y: 650, width: 325, height: 325 },
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
                this.terrainUpdateRequested = false;
                this.updateTerrainTexture();

                // Position loggen wenn Update stattfindet
                console.log(`Terrain updated at position: (${Math.round(this.globalOffsetX)}, ${Math.round(this.globalOffsetY)})`);
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

        const camera = new FreeCamera('camera', new Vector3(cameraX, App.CAMERA_HEIGHT, cameraZ), scene);
        camera.setTarget(Vector3.Zero());
        camera.inputs.clear();

        // Licht hinzufügen
        const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
        light.intensity = 0.8;

        // KONFIGURATION: Größe der Ebene und andere Parameter
        const GROUND_SIZE = App.GROUND_SIZE;          // Größe der Ebene (20x20 Einheiten)
        const GROUND_SUBDIVISIONS = App.GROUND_SUBDIVISIONS;  // Geometrie-Unterteilungen für glatte Darstellung
        const DEBUG_TILE_BORDERS = App.DEBUG_TILE_BORDERS; // Debug: Kachel-Ränder sichtbar machen

        // Ebene erstellen
        const ground = MeshBuilder.CreateGround('ground', {
            width: GROUND_SIZE,
            height: GROUND_SIZE,
            subdivisions: GROUND_SUBDIVISIONS
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

        // Textur aus dem gerenderten Canvas erstellen
        this.tileTexture = new Texture('data:' + terrainCanvas.toDataURL(), scene);
        this.tileTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        this.tileTexture.wrapV = Texture.CLAMP_ADDRESSMODE;

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
     */
    private updateTerrainTexture(): void {
        this.terrainRenderer.updateViewport(this.globalOffsetX, this.globalOffsetY);
        const terrainCanvas = this.terrainRenderer.render();

        // Neue Textur erstellen und alte ersetzen
        if (this.tileTexture) {
            this.tileTexture.dispose();
        }

        this.tileTexture = new Texture('data:' + terrainCanvas.toDataURL(), this.scene);
        this.tileTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        this.tileTexture.wrapV = Texture.CLAMP_ADDRESSMODE;

        if (this.tileMaterial) {
            this.tileMaterial.diffuseTexture = this.tileTexture;
        }
    }

    private setupKeyboardControls(): void {
        // Keyboard-Event-Listener für kontinuierliche Bewegung
        const keys: { [key: string]: boolean } = {};

        // Key-Down Events
        window.addEventListener('keydown', (event) => {
            keys[event.code] = true;
        });

        // Key-Up Events
        window.addEventListener('keyup', (event) => {
            keys[event.code] = false;
        });

        // Kontinuierliche Bewegung im Render-Loop
        this.scene.registerBeforeRender(() => {
            let moved = false;

            // Bewegungsgeschwindigkeit pro Frame
            const frameSpeed = App.TILE_SIZE * 0.02; // 2% der Tile-Größe pro Frame für flüssige Bewegung

            // Isometrische Bewegungsrichtungen
            if (keys['ArrowRight']) {
                // "Oben" in isometrischer Sicht
                this.globalOffsetX -= frameSpeed;
                this.globalOffsetY -= frameSpeed;
                moved = true;
            }
            if (keys['ArrowLeft']) {
                // "Unten" in isometrischer Sicht
                this.globalOffsetX += frameSpeed;
                this.globalOffsetY += frameSpeed;
                moved = true;
            }
            if (keys['ArrowDown']) {
                // "Links" in isometrischer Sicht
                this.globalOffsetX += frameSpeed;
                this.globalOffsetY -= frameSpeed;
                moved = true;
            }
            if (keys['ArrowUp']) {
                // "Rechts" in isometrischer Sicht
                this.globalOffsetX -= frameSpeed;
                this.globalOffsetY += frameSpeed;
                moved = true;
            }

            // Grenzen prüfen und Terrain aktualisieren falls bewegt
            if (moved) {
                // Zentrale TILE_SIZE Konstante verwenden für korrekte Viewport-Grenzen
                const halfTileSize = Math.ceil(App.TILE_SIZE / 2);

                this.globalOffsetX = Math.max(halfTileSize, Math.min(this.tileProvider.getWorldSize() - halfTileSize, this.globalOffsetX));
                this.globalOffsetY = Math.max(halfTileSize, Math.min(this.tileProvider.getWorldSize() - halfTileSize, this.globalOffsetY));

                // Terrain neu rendern
                this.requestTerrainUpdate();
            }
        });
    }

    /**
     * Fordert ein Terrain-Update an (entkoppelt vom Rendering)
     */
    private requestTerrainUpdate(): void {
        this.terrainUpdateRequested = true;
    }
}

// Anwendung starten, wenn DOM geladen ist
window.addEventListener('DOMContentLoaded', () => {
    new App();
});
