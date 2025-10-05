package com.example.jme07;

import com.jme3.app.SimpleApplication;
import com.jme3.light.AmbientLight;
import com.jme3.light.DirectionalLight;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.math.Vector3f;
import com.jme3.terrain.geomipmap.TerrainGrid;
import com.jme3.terrain.geomipmap.TerrainLodControl;
import com.jme3.terrain.geomipmap.lodcalc.DistanceLodCalculator;
import com.jme3.texture.Texture;

/**
 * Haupt-Anwendung mit dynamischem TerrainGrid.
 */
public class TerrainApp extends SimpleApplication {

    private TerrainGrid terrainGrid;
    private TileProvider tileProvider;

    // TerrainGrid Konfiguration
    // WICHTIG: TOTAL_SIZE muss ein Vielfaches von (PATCH_SIZE - 1) sein!
    private static final int PATCH_SIZE = 65;      // Größe eines einzelnen Patches (2^n + 1)
    private static final int TOTAL_SIZE = 257;     // Gesamtgröße des sichtbaren Terrains (muss 2^n + 1 sein)
    private static final int VIEW_DISTANCE = 2;    // Anzahl der Chunks die geladen werden (in jede Richtung)

    @Override
    public void simpleInitApp() {
        // FPS und Stats anzeigen
        setDisplayFps(true);
        setDisplayStatView(true);

        // Setze Hintergrundfarbe (Himmel)
        viewPort.setBackgroundColor(new ColorRGBA(0.5f, 0.7f, 1.0f, 1.0f));

        // Initialisiere Komponenten
        initTileProvider();
        initLighting();
        initTerrain();

        // Kamera-Position NACH Terrain-Initialisierung
        cam.setLocation(new Vector3f(32, 50, 32));
        cam.lookAt(new Vector3f(64, 10, 64), Vector3f.UNIT_Y);

        // FlyCamera konfigurieren
        flyCam.setMoveSpeed(50f);
        flyCam.setEnabled(true);

        System.out.println("\n=== TerrainApp gestartet ===");
        System.out.println("Steuerung:");
        System.out.println("  WASD     - Bewegen");
        System.out.println("  Maus     - Umsehen");
        System.out.println("  Q/Z      - Hoch/Runter");
        System.out.println("  Shift    - Schneller");
        System.out.println("\nTerrain-Konfiguration:");
        System.out.println("  Patch-Größe: " + PATCH_SIZE);
        System.out.println("  Total-Größe: " + TOTAL_SIZE);
        System.out.println("  Sichtweite: " + VIEW_DISTANCE + " Chunks");
        System.out.println("  Kamera-Position: " + cam.getLocation());
        System.out.println("\nTerrainGrid Debug:");
        System.out.println("  TerrainGrid attached: " + (terrainGrid.getParent() != null));
        System.out.println("  TerrainGrid children: " + terrainGrid.getChildren().size());
        System.out.println("  TerrainGrid local translation: " + terrainGrid.getLocalTranslation());
    }

    /**
     * Initialisiert den TileProvider für die Höhendaten-Generierung
     */
    private void initTileProvider() {
        // Erstelle prozeduralen TileProvider
        long seed = 12345L;
        float scale = 0.02f;        // Skalierung der Noise-Funktion (kleiner = größere Features)
        float heightMultiplier = 50f; // Maximale Höhe des Terrains

        tileProvider = new ProceduralTileProvider(seed, scale, heightMultiplier);
        System.out.println("TileProvider initialisiert: " + tileProvider.getName());
    }

    /**
     * Initialisiert das TerrainGrid mit dynamischem Chunk-Loading
     */
    private void initTerrain() {
        // Erstelle Material für das Terrain
        Material terrainMaterial = createTerrainMaterial();

        // Erstelle TileLoader
        DynamicTerrainTileLoader tileLoader = new DynamicTerrainTileLoader(tileProvider, terrainMaterial);

        // Erstelle TerrainGrid
        terrainGrid = new TerrainGrid(
            "TerrainGrid",
            PATCH_SIZE,
            TOTAL_SIZE,
            tileLoader
        );

        terrainGrid.setMaterial(terrainMaterial);
        terrainGrid.setLocalTranslation(0, 0, 0);

        // LOD-Control für Performance-Optimierung
        TerrainLodControl lodControl = new TerrainLodControl(terrainGrid, cam);
        lodControl.setLodCalculator(new DistanceLodCalculator(PATCH_SIZE, 2.7f));
        terrainGrid.addControl(lodControl);

        // Füge TerrainGrid zur Szene hinzu
        rootNode.attachChild(terrainGrid);

        System.out.println("TerrainGrid erfolgreich initialisiert");
    }

    /**
     * Erstellt ein Material für das Terrain
     */
    private Material createTerrainMaterial() {
        Material mat = new Material(assetManager, "Common/MatDefs/Light/Lighting.j3md");

        // Versuche Textur zu laden
        try {
            Texture grassTexture = assetManager.loadTexture("Textures/Terrain/splat/grass.jpg");
            grassTexture.setWrap(Texture.WrapMode.Repeat);
            mat.setTexture("DiffuseMap", grassTexture);
            mat.setFloat("Shininess", 0.5f);
        } catch (Exception e) {
            // Fallback auf einfache Farbe
            System.out.println("Textur nicht gefunden, verwende Farbe als Fallback");
            mat.setColor("Diffuse", new ColorRGBA(0.3f, 0.6f, 0.2f, 1.0f));
            mat.setColor("Ambient", new ColorRGBA(0.3f, 0.6f, 0.2f, 1.0f));
        }

        return mat;
    }

    /**
     * Initialisiert die Beleuchtung
     */
    private void initLighting() {
        // Ambient Light
        AmbientLight ambient = new AmbientLight();
        ambient.setColor(ColorRGBA.White.mult(0.4f));
        rootNode.addLight(ambient);

        // Directional Light (Sonne)
        DirectionalLight sun = new DirectionalLight();
        sun.setDirection(new Vector3f(-0.5f, -0.7f, -0.3f).normalizeLocal());
        sun.setColor(ColorRGBA.White.mult(1.2f));
        rootNode.addLight(sun);
    }

    private float updateTimer = 0;
    private boolean firstUpdate = true;

    @Override
    public void simpleUpdate(float tpf) {
        updateTimer += tpf;

        // Erste Update-Ausgabe
        if (firstUpdate) {
            System.out.println("\n=== Erste simpleUpdate ===");
            System.out.println("  Kamera: " + cam.getLocation());
            System.out.println("  TerrainGrid children: " + terrainGrid.getChildren().size());
            firstUpdate = false;
        }

        // Alle 2 Sekunden Status ausgeben
        if (updateTimer > 2.0f) {
            System.out.println("\n=== Update (t=" + ((int)updateTimer) + "s) ===");
            System.out.println("  Kamera: " + cam.getLocation());
            System.out.println("  TerrainGrid children: " + terrainGrid.getChildren().size());
            updateTimer = 0;
        }
    }
}
