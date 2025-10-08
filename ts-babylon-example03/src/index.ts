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

// TileProvider-Klasse
class TileProvider {
    private static readonly WORLD_SIZE = 50; // Konfigurierbare Ausdehnung des Arrays
    private tileData: Tile[][];

    constructor() {
        this.tileData = [];
        this.generateTileData();
    }

    private generateTileData(): void {
        for (let x = 0; x < TileProvider.WORLD_SIZE; x++) {
            this.tileData[x] = [];
            for (let y = 0; y < TileProvider.WORLD_SIZE; y++) {
                this.tileData[x][y] = this.generateRandomTile(x, y);
            }
        }
    }

    private generateRandomTile(x: number, y: number): Tile {
        const textures = ['grass', 'dirt', 'water', 'grass_bushes'];

        // Einfache Logik für die Tile-Generierung
        const random = Math.random();
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
        if (Math.random() < 0.3) {
            levels.push({ level: 1, texture: 'grass_bushes' });
        }

        return { levels };
    }

    public getTile(x: number, y: number): Tile {
        // Bounds-Checking
        if (x < 0 || x >= TileProvider.WORLD_SIZE || y < 0 || y >= TileProvider.WORLD_SIZE) {
            // Fallback für Koordinaten außerhalb des Arrays
            return { levels: [{ level: 0, texture: 'grass' }] };
        }
        return this.tileData[x][y];
    }

    public getWorldSize(): number {
        return TileProvider.WORLD_SIZE;
    }
}

class App {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene!: Scene;  // Definitive Assignment Assertion hinzufügen
    private tileMaterial!: StandardMaterial;
    private tileTexture!: Texture;
    private tilesAtlasTexture!: Texture; // Neue Atlas-Textur für die 12 Tiles
    private tileProvider: TileProvider; // TileProvider-Instanz hinzufügen

    // Bewegungsparameter
    private offsetX: number = 0;
    private offsetY: number = 0;
    private moveSpeed: number = 0.01;

    // Tile-System Parameter
    private readonly TILES_PER_ROW = 5;    // 4 Tiles pro Reihe in der Atlas-Textur
    private readonly TILES_PER_COLUMN = 3; // 3 Reihen in der Atlas-Textur
    private readonly TOTAL_TILES = 15;     // Insgesamt 12 verschiedene Tiles

    // Tile-Atlas-Konfiguration - hier können Sie die Koordinaten manuell anpassen
    private readonly TILE_ATLAS: TileAtlas = {
        textureWidth: 512,   // Anpassen an Ihre Atlas-Größe
        textureHeight: 384,  // Anpassen an Ihre Atlas-Größe
        tiles: {
            // Beispiel-Koordinaten - passen Sie diese an Ihre Atlas-Textur an
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

    // Tile-Namen für einfache Referenzierung
    private readonly TILE_NAMES = {
        GRASS: 'grass',
        GRASS_BUSHES: 'grass_bushes',
        DIRT_GRASS_L: 'dirt_grass_l',
        GRASS_DIRT_R: 'grass_dirt_r',
        DIRT_GRASS_T: 'dirt_grass_t',
        DIRT_CORNER_TR: 'dirt_corner_tr',
        GRASS_CORNER_BL: 'grass_corner_bl',
        GRASS_CORNER_TL: 'grass_corner_tl',
        WATER: 'water',
        DIRT: 'dirt',
        DIRT_STONES: 'dirt_stones',
        GRASS_BOX: 'grass_box'
    } as const;

    constructor() {
        // Canvas-Element aus dem DOM holen
        this.canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

        // Babylon.js Engine initialisieren
        this.engine = new Engine(this.canvas, true);

        // TileProvider initialisieren
        this.tileProvider = new TileProvider();

        // Szene async erstellen
        this.initializeScene();

        // Window-Resize-Event behandeln
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    private async initializeScene(): Promise<void> {
        // Szene erstellen
        this.scene = await this.createScene();

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

        // KONFIGURATION: Kamera-Winkel und Position
        const CAMERA_DISTANCE = 15;     // Entfernung der Kamera vom Zentrum
        const CAMERA_HEIGHT = 8;        // Höhe der Kamera (flacher = niedriger Wert)
        const CAMERA_ANGLE = 30;        // Winkel in Grad (0° = horizontal, 90° = von oben)

        // Isometrische Kamera erstellen mit konfigurierbarem Winkel
        const angleRad = (CAMERA_ANGLE * Math.PI) / 180; // Grad zu Radiant
        const cameraX = CAMERA_DISTANCE * Math.cos(angleRad);
        const cameraZ = CAMERA_DISTANCE * Math.sin(angleRad);

        const camera = new FreeCamera('camera', new Vector3(cameraX, CAMERA_HEIGHT, cameraZ), scene);
        camera.setTarget(Vector3.Zero());

        // Kamera-Kontrollen deaktivieren für fixe isometrische Sicht
        camera.inputs.clear();

        // Licht hinzufügen
        const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
        light.intensity = 0.8;

        // KONFIGURATION: Größe der Ebene und Anzahl der Kacheln
        const GROUND_SIZE = 20;          // Größe der Ebene (20x20 Einheiten)
        const GROUND_SUBDIVISIONS = 30;  // Geometrie-Unterteilungen für glatte Darstellung
        const TILE_REPEAT = 15;          // Anzahl der Kachel-Wiederholungen
        const DEBUG_TILE_BORDERS = false; // Debug: Kachel-Ränder sichtbar machen

        // Große Ebene für das Gitter erstellen
        const ground = MeshBuilder.CreateGround('ground', {
            width: GROUND_SIZE,
            height: GROUND_SIZE,
            subdivisions: GROUND_SUBDIVISIONS
        }, scene);

        // Kachel-Material erstellen und speichern (async)
        this.tileMaterial = await this.createTileMaterial(scene, TILE_REPEAT, DEBUG_TILE_BORDERS);
        ground.material = this.tileMaterial;

        return scene;
    }

    private async createTileMaterial(scene: Scene, tileRepeat: number, debugTileBorders: boolean): Promise<StandardMaterial> {
        const material = new StandardMaterial('tileMaterial', scene);

        // Atlas-Textur mit den 12 Tiles laden - mit Cache-Busting
        const cacheBuster = Date.now();
        this.tilesAtlasTexture = new Texture(`/assets/textures.png?v=${cacheBuster}`, scene);
        this.tilesAtlasTexture.wrapU = Texture.WRAP_ADDRESSMODE;
        this.tilesAtlasTexture.wrapV = Texture.WRAP_ADDRESSMODE;

        // Warten bis Atlas geladen ist, dann Tile-Pattern erstellen
        await new Promise<void>((resolve) => {
            this.tilesAtlasTexture.onLoadObservable.addOnce(async () => {
                this.tileTexture = await this.createTilePatternTexture(scene, tileRepeat, debugTileBorders);
                resolve();
            });
        });

        material.diffuseTexture = this.tileTexture;
        material.specularColor = Color3.Black();

        // Opacity-Textur für Rand-Fade erstellen
        const opacityTexture = this.createOpacityTexture(scene);
        material.opacityTexture = opacityTexture;

        return material;
    }

    private async createTilePatternTexture(scene: Scene, tileRepeat: number, debugTileBorders: boolean = false): Promise<Texture> {
        const PATTERN_SIZE = 512;
        const TILES_IN_PATTERN = tileRepeat;
        const TILE_SIZE = PATTERN_SIZE / TILES_IN_PATTERN;

        const canvas = document.createElement('canvas');
        canvas.width = PATTERN_SIZE;
        canvas.height = PATTERN_SIZE;
        const ctx = canvas.getContext('2d')!;

        // Atlas-Image laden und warten bis es fertig ist
        const atlasImage = new Image();
        atlasImage.crossOrigin = 'anonymous';

        // Cache-Busting für das Atlas-Image
        const cacheBuster = Date.now();

        await new Promise<void>((resolve, reject) => {
            atlasImage.onload = () => resolve();
            atlasImage.onerror = () => reject(new Error('Failed to load atlas image'));
            atlasImage.src = `/assets/textures.png?v=${cacheBuster}`;
        });

        // Tile-Pattern erstellen
        for (let y = 0; y < TILES_IN_PATTERN; y++) {
            for (let x = 0; x < TILES_IN_PATTERN; x++) {
                // Tile-Typ für diese Position bestimmen
                const tileIndex = this.getTileForPosition(x, y);
                const { x: atlasX, y: atlasY, width: tileWidth, height: tileHeight } = this.getTileCoordinates(tileIndex);

                // Tile aus Atlas in Pattern kopieren
                ctx.drawImage(
                    atlasImage,
                    atlasX, atlasY, tileWidth, tileHeight,
                    x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE
                );

                // Debug: Kachel-Ränder zeichnen
                if (debugTileBorders) {
                    ctx.strokeStyle = '#ff0000'; // Rote Ränder
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

                    // Optional: Tile-Index in der Ecke anzeigen
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '12px Arial';
                    ctx.fillText(
                        `${tileIndex}`,
                        x * TILE_SIZE + 5,
                        y * TILE_SIZE + 15
                    );
                    ctx.fillText(
                        `(${x},${y})`,
                        x * TILE_SIZE + 5,
                        y * TILE_SIZE + 30
                    );
                }
            }
        }

        // Finale Textur erstellen
        const texture = new Texture('data:' + canvas.toDataURL(), scene);
        texture.uOffset = 0;
        texture.vOffset = 0;
        texture.uScale = 1;
        texture.vScale = 1;
        texture.wrapU = Texture.WRAP_ADDRESSMODE;
        texture.wrapV = Texture.WRAP_ADDRESSMODE;

        return texture;
    }

    private getTileCoordinates(tileName: string): TileCoordinates {
        // Tile-Koordinaten aus der Atlas-Definition holen
        const coords = this.TILE_ATLAS.tiles[tileName];
        if (!coords) {
            console.warn(`Tile '${tileName}' nicht gefunden, verwende Standard-Grass`);
            return this.TILE_ATLAS.tiles[this.TILE_NAMES.GRASS];
        }
        return coords;
    }

    private getTileForPosition(x: number, y: number): string {
        // TileProvider verwenden um Tile-Daten zu erhalten
        const tile = this.tileProvider.getTile(x, y);

        // Nur das erste Level verwenden (Level 0)
        if (tile.levels.length > 0) {
            return tile.levels[0].texture;
        }

        // Fallback auf Grass falls keine Level vorhanden
        return this.TILE_NAMES.GRASS;
    }
    private createOpacityTexture(scene: Scene): Texture {
        const OPACITY_SIZE = 512;
        const FADE_DISTANCE = 0.1; // Fade-Bereich vom Rand (0.0 - 0.5)

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

    private setupKeyboardControls(): void {
        // Action Manager für Keyboard-Events
        this.scene.actionManager = new ActionManager(this.scene);

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

            // Isometrische Bewegungsrichtungen (diagonal)
            // In isometrischer Sicht entsprechen die Pfeiltasten diagonalen Bewegungen
            const diagonalSpeed = this.moveSpeed * 0.707; // √2/2 für 45° Diagonale

            // Pfeiltasten mit isometrischen Bewegungsrichtungen
            if (keys['ArrowUp']) {
                // "Oben" in isometrischer Sicht = diagonal nach links-unten
                this.offsetX -= diagonalSpeed;
                this.offsetY -= diagonalSpeed;
                moved = true;
            }
            if (keys['ArrowDown']) {
                // "Unten" in isometrischer Sicht = diagonal nach rechts-oben
                this.offsetX += diagonalSpeed;
                this.offsetY += diagonalSpeed;
                moved = true;
            }
            if (keys['ArrowLeft']) {
                // "Links" in isometrischer Sicht = diagonal nach links-oben
                this.offsetX += diagonalSpeed;
                this.offsetY -= diagonalSpeed;
                moved = true;
            }
            if (keys['ArrowRight']) {
                // "Rechts" in isometrischer Sicht = diagonal nach rechts-unten
                this.offsetX -= diagonalSpeed;
                this.offsetY += diagonalSpeed;
                moved = true;
            }

            // Textur-Offsets aktualisieren falls bewegt wurde
            if (moved) {
                this.updateTextureOffsets();
            }
        });
    }

    private updateTextureOffsets(): void {
        if (this.tileTexture) {
            // Wrap-around für nahtlose Wiederholung
            this.tileTexture.uOffset = this.offsetX % 1;
            this.tileTexture.vOffset = this.offsetY % 1;
        }
    }
}

// Anwendung starten, wenn DOM geladen ist
window.addEventListener('DOMContentLoaded', () => {
    new App();
});
