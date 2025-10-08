import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Texture, Color3, ActionManager, ExecuteCodeAction } from '@babylonjs/core';

class App {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene!: Scene;  // Definitive Assignment Assertion hinzufügen
    private tileMaterial!: StandardMaterial;
    private tileTexture!: Texture;
    private tilesAtlasTexture!: Texture; // Neue Atlas-Textur für die 12 Tiles

    // Bewegungsparameter
    private offsetX: number = 0;
    private offsetY: number = 0;
    private moveSpeed: number = 0.01;

    // Tile-System Parameter
    private readonly TILES_PER_ROW = 4;    // 4 Tiles pro Reihe in der Atlas-Textur
    private readonly TILES_PER_COLUMN = 3; // 3 Reihen in der Atlas-Textur
    private readonly TOTAL_TILES = 12;     // Insgesamt 12 verschiedene Tiles

    constructor() {
        // Canvas-Element aus dem DOM holen
        this.canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

        // Babylon.js Engine initialisieren
        this.engine = new Engine(this.canvas, true);

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
        const TILE_REPEAT = 5;          // Anzahl der Kachel-Wiederholungen

        // Große Ebene für das Gitter erstellen
        const ground = MeshBuilder.CreateGround('ground', {
            width: GROUND_SIZE,
            height: GROUND_SIZE,
            subdivisions: GROUND_SUBDIVISIONS
        }, scene);

        // Kachel-Material erstellen und speichern (async)
        this.tileMaterial = await this.createTileMaterial(scene, TILE_REPEAT);
        ground.material = this.tileMaterial;

        return scene;
    }

    private async createTileMaterial(scene: Scene, tileRepeat: number): Promise<StandardMaterial> {
        const material = new StandardMaterial('tileMaterial', scene);

        // Atlas-Textur mit den 12 Tiles laden
        this.tilesAtlasTexture = new Texture('./assets/tiles-textures.png', scene);
        this.tilesAtlasTexture.wrapU = Texture.WRAP_ADDRESSMODE;
        this.tilesAtlasTexture.wrapV = Texture.WRAP_ADDRESSMODE;

        // Warten bis Atlas geladen ist, dann Tile-Pattern erstellen
        await new Promise<void>((resolve) => {
            this.tilesAtlasTexture.onLoadObservable.addOnce(async () => {
                this.tileTexture = await this.createTilePatternTexture(scene, tileRepeat);
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

    private async createTilePatternTexture(scene: Scene, tileRepeat: number): Promise<Texture> {
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

        await new Promise<void>((resolve, reject) => {
            atlasImage.onload = () => resolve();
            atlasImage.onerror = () => reject(new Error('Failed to load atlas image'));
            atlasImage.src = './assets/tiles-textures.png';
        });

        const tileWidth = atlasImage.width / this.TILES_PER_ROW;
        const tileHeight = atlasImage.height / this.TILES_PER_COLUMN;

        // Tile-Pattern erstellen
        for (let y = 0; y < TILES_IN_PATTERN; y++) {
            for (let x = 0; x < TILES_IN_PATTERN; x++) {
                // Tile-Typ für diese Position bestimmen
                const tileIndex = this.getTileForPosition(x, y);
                const atlasX = (tileIndex % this.TILES_PER_ROW) * tileWidth;
                const atlasY = Math.floor(tileIndex / this.TILES_PER_ROW) * tileHeight;

                // Tile aus Atlas in Pattern kopieren
                ctx.drawImage(
                    atlasImage,
                    atlasX, atlasY, tileWidth, tileHeight,
                    x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE
                );
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

    private getTileForPosition(x: number, y: number): number {
        // Einfache Logik für verschiedene Tile-Typen basierend auf Position
        // Hier kannst du komplexere Terrain-Generierung implementieren

        // Basis-Tiles definieren (0-11 entsprechend der 12 Tiles)
        const GRASS = 0;           // grass
        const GRASS_BUSHES = 1;    // grass mit grasbüscheln
        const DIRT_GRASS_L = 2;    // links dirt, rechts grass
        const GRASS_DIRT_R = 3;    // links grass, rechts dirt
        const DIRT_GRASS_T = 4;    // unten dirt, oben grass
        const DIRT_CORNER_TR = 5;  // spitze oben rechts dirt, rest grass
        const GRASS_CORNER_BL = 6; // spitze unten links grass, rest dirt
        const GRASS_CORNER_TL = 7; // spitze oben links grass, rest dirt
        const WATER = 8;           // wasser
        const DIRT = 9;            // dirt
        const DIRT_STONES = 10;    // dirt mit steinen
        const GRASS_BOX = 11;      // grass mit box

        // Einfaches Muster für Demo
        const seed = (x * 7 + y * 13) % 100;

        if (seed < 5) return WATER;
        if (seed < 15) return DIRT;
        if (seed < 20) return DIRT_STONES;
        if (seed < 25) return GRASS_BOX;
        if (seed < 35) return GRASS_BUSHES;
        if (seed < 45) return DIRT_GRASS_L;
        if (seed < 55) return GRASS_DIRT_R;
        if (seed < 65) return DIRT_GRASS_T;
        if (seed < 75) return DIRT_CORNER_TR;
        if (seed < 85) return GRASS_CORNER_BL;
        if (seed < 95) return GRASS_CORNER_TL;

        return GRASS; // Standard: grass
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
