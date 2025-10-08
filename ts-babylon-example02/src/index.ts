import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Texture, Color3 } from '@babylonjs/core';

class App {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;

    constructor() {
        // Canvas-Element aus dem DOM holen
        this.canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

        // Babylon.js Engine initialisieren
        this.engine = new Engine(this.canvas, true);

        // Szene erstellen
        this.scene = this.createScene();

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

        // const CAMERA_ANGLE = 15;   // Sehr flach, fast horizontal
        // const CAMERA_ANGLE = 30;   // Flach isometrisch (aktuell)
        // const CAMERA_ANGLE = 45;   // Standard isometrisch
        // const CAMERA_ANGLE = 60;   // Steil isometrisch
        // const CAMERA_ANGLE = 90;   // Von oben (Top-Down)

        // KONFIGURATION: Kamera-Winkel und Position
        const CAMERA_DISTANCE = 18;     // Entfernung der Kamera vom Zentrum
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
        const TILE_REPEAT = 5;          // Anzahl der Kachel-Wiederholungen (10x10 = 100 Kacheln)

        // Große Ebene für das Gitter erstellen
        const ground = MeshBuilder.CreateGround('ground', {
            width: GROUND_SIZE,
            height: GROUND_SIZE,
            subdivisions: GROUND_SUBDIVISIONS
        }, scene);

        // Kachel-Material erstellen
        const tileMaterial = this.createTileMaterial(scene, TILE_REPEAT);
        ground.material = tileMaterial;

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

        // Canvas als Textur verwenden
        const texture = new Texture('data:' + canvas.toDataURL(), scene);
        texture.uOffset = 0;
        texture.vOffset = 0;
        texture.uScale = tileRepeat; // Kacheln wiederholen
        texture.vScale = tileRepeat;

        material.diffuseTexture = texture;
        material.specularColor = Color3.Black(); // Keine Spiegelung

        return material;
    }
}

// Anwendung starten, wenn DOM geladen ist
window.addEventListener('DOMContentLoaded', () => {
    new App();
});
