import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Texture, Color3, ActionManager, ExecuteCodeAction } from '@babylonjs/core';

class App {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;
    private tileMaterial!: StandardMaterial;  // Definitive Assignment Assertion
    private tileTexture!: Texture;            // Definitive Assignment Assertion

    // Bewegungsparameter
    private offsetX: number = 0;
    private offsetY: number = 0;
    private moveSpeed: number = 0.02;  // Langsamere Bewegung für bessere Kontrolle

    constructor() {
        // Canvas-Element aus dem DOM holen
        this.canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

        // Babylon.js Engine initialisieren
        this.engine = new Engine(this.canvas, true);

        // Szene erstellen
        this.scene = this.createScene();

        // Keyboard-Events einrichten
        this.setupKeyboardControls();

        // Render-Loop starten
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        // Window-Resize-Event behandeln
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    private createScene(): Scene {
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

        // Kachel-Material erstellen und speichern
        this.tileMaterial = this.createTileMaterial(scene, TILE_REPEAT);
        ground.material = this.tileMaterial;

        return scene;
    }

    private createTileMaterial(scene: Scene, tileRepeat: number): StandardMaterial {
        const material = new StandardMaterial('tileMaterial', scene);

        // KONFIGURATION: Gitter-Details pro Kachel
        const TEXTURE_SIZE = 256;        // Auflösung der Textur (höher = schärfer)
        const GRID_DIVISIONS = 4;        // Anzahl Gitterlinien pro Kachel (4x4 Raster)
        const GRID_COLOR = '#333333';    // Farbe der Gitterlinien
        const BACKGROUND_COLOR = '#f0f0f0'; // Hintergrundfarbe der Kacheln
        const LINE_WIDTH = 2;            // Dicke der Gitterlinien

        // Einfaches Kachel-Pattern mit Canvas erstellen
        const canvas = document.createElement('canvas');
        canvas.width = TEXTURE_SIZE;
        canvas.height = TEXTURE_SIZE;
        const ctx = canvas.getContext('2d')!;

        // Hintergrund
        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

        // Gitterlinien zeichnen
        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = LINE_WIDTH;

        const gridSize = TEXTURE_SIZE / GRID_DIVISIONS;

        // Vertikale Linien
        for (let x = 0; x <= TEXTURE_SIZE; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, TEXTURE_SIZE);
            ctx.stroke();
        }

        // Horizontale Linien
        for (let y = 0; y <= TEXTURE_SIZE; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(TEXTURE_SIZE, y);
            ctx.stroke();
        }

        // Canvas als Textur verwenden (ohne Fade-Effekt)
        this.tileTexture = new Texture('data:' + canvas.toDataURL(), scene);
        this.tileTexture.uOffset = 0;
        this.tileTexture.vOffset = 0;
        this.tileTexture.uScale = tileRepeat;
        this.tileTexture.vScale = tileRepeat;
        this.tileTexture.wrapU = Texture.WRAP_ADDRESSMODE;
        this.tileTexture.wrapV = Texture.WRAP_ADDRESSMODE;

        material.diffuseTexture = this.tileTexture;
        material.specularColor = Color3.Black(); // Keine Spiegelung

        // Opacity-Textur für Rand-Fade erstellen
        const opacityTexture = this.createOpacityTexture(scene);
        material.opacityTexture = opacityTexture;

        return material;
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
