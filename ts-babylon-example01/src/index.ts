import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder } from '@babylonjs/core';

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

        // Kamera erstellen (ArcRotateCamera für bessere Kontrolle)
        const camera = new ArcRotateCamera(
            'camera',
            -Math.PI / 2,
            Math.PI / 2.5,
            10,
            Vector3.Zero(),
            scene
        );

        // Kamera-Kontrollen an Canvas anhängen (korrekte Methode ohne 's')
        camera.attachControl(this.canvas, true);

        // Licht hinzufügen
        const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        // Box erstellen (Hello World Objekt)
        const box = MeshBuilder.CreateBox('box', { size: 2 }, scene);
        box.position.y = 1;

        // Boden erstellen
        const ground = MeshBuilder.CreateGround('ground', { width: 6, height: 6 }, scene);

        return scene;
    }
}

// Anwendung starten, wenn DOM geladen ist
window.addEventListener('DOMContentLoaded', () => {
    new App();
});
