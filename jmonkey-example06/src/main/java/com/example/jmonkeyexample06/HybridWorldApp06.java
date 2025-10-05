package com.example.jmonkeyexample06;

import com.jme3.app.SimpleApplication;
import com.jme3.export.JmeExporter;
import com.jme3.export.JmeImporter;
import com.jme3.input.KeyInput;
import com.jme3.input.controls.ActionListener;
import com.jme3.input.controls.KeyTrigger;
import com.jme3.light.AmbientLight;
import com.jme3.light.DirectionalLight;
import com.jme3.material.Material;
import com.jme3.material.RenderState;
import com.jme3.math.*;
import com.jme3.post.FilterPostProcessor;
import com.jme3.post.filters.FogFilter;
import com.jme3.renderer.queue.RenderQueue;
import com.jme3.scene.*;
import com.jme3.scene.control.BillboardControl;
import com.jme3.scene.shape.Quad;
import com.jme3.scene.shape.Sphere;
import com.jme3.terrain.geomipmap.TerrainGrid;
import com.jme3.terrain.geomipmap.TerrainLodControl;
import com.jme3.terrain.geomipmap.TerrainGridTileLoader;
import com.jme3.terrain.geomipmap.TerrainQuad;
import com.jme3.terrain.heightmap.AbstractHeightMap;
import com.jme3.texture.Texture;

import java.io.IOException;

/**
 * Hybrid World App die TileProviderService06 mit TerrainGrid kombiniert.
 * Beinhaltet: Dynamisches TerrainGrid, Skybox, Wolken, Nebel, Sonne und Walk/Fly Modus.
 */
public class HybridWorldApp06 extends SimpleApplication implements ActionListener {

    private final TileProviderService06 tileProviderService;
    private TerrainGrid terrainGrid;
    private final int PATCH_SIZE = 65; // Muss eine 2^n+1 Größe sein (33, 65, 129, etc.)
    private final int TOTAL_SIZE = 513; // Gesamtgröße des Terrains

    // Walk/Fly Modus Variablen
    private boolean isFlightMode = false;
    private static final String TOGGLE_FLIGHT = "ToggleFlight";
    private static final String JUMP = "Jump";
    private final Vector3f velocity = new Vector3f(0, 0, 0);
    private final float GRAVITY = -9.81f;
    private final float GROUND_HEIGHT = 2.0f;
    private final float JUMP_FORCE = 8.0f;
    private boolean isOnGround = false;

    // Atmosphärische Elemente
    private Node cloudNode;
    private float cloudTime = 0;

    public HybridWorldApp06(TileProviderService06 tileProviderService) {
        this.tileProviderService = tileProviderService;
    }

    @Override
    public void simpleInitApp() {
        // Deaktiviere FPS und Statistik-Anzeige für saubere Darstellung
        setDisplayFps(true);
        setDisplayStatView(true);

        // Input-Mapping
        setupInputMapping();

        // Setze initiale Kamera-Position
        cam.setLocation(new Vector3f(0, 15, 0));
        cam.lookAt(new Vector3f(8, 2, 8), Vector3f.UNIT_Y);

        // Aktiviere Fly-Kamera für Navigation
        flyCam.setEnabled(true);
        flyCam.setMoveSpeed(12f);

        // Initialisiere alle Systeme
        initNearTerrain();
        initMidRange();
        initSky();
        initClouds();
        initSun();
        initFog();

        // Starte im Walk-Modus
        setWalkMode();

        System.out.println("Hybrid World mit TerrainGrid geladen!");
        System.out.println("Features: Dynamisches TerrainGrid, Atmosphäre, Walk/Fly Modus");
    }

    private void setupInputMapping() {
        inputManager.addMapping(TOGGLE_FLIGHT, new KeyTrigger(KeyInput.KEY_F));
        inputManager.addMapping(JUMP, new KeyTrigger(KeyInput.KEY_SPACE));
        inputManager.addListener(this, TOGGLE_FLIGHT, JUMP);
    }

    /**
     * Nahbereich: TerrainGrid-basiertes Terrain mit dynamischem Loading
     */
    private void initNearTerrain() {
        // Erstelle einen Custom Terrain Tile Loader für unseren TileProvider
        TileProviderTerrainTileLoader tileLoader = new TileProviderTerrainTileLoader();

        // Erstelle TerrainGrid
        terrainGrid = new TerrainGrid("TerrainGrid", PATCH_SIZE, TOTAL_SIZE, tileLoader);

        // Setze Material NACH der TerrainGrid Erstellung
        Material terrainMaterial = createTerrainMaterial();
        terrainGrid.setMaterial(terrainMaterial);

        terrainGrid.setLocalTranslation(0, 0, 0);
        terrainGrid.setLocalScale(1f, 1f, 1f);

        // Füge LOD Control hinzu für bessere Performance
        TerrainLodControl lodControl = new TerrainLodControl(terrainGrid, getCamera());
        terrainGrid.addControl(lodControl);

        rootNode.attachChild(terrainGrid);

        System.out.println("TerrainGrid initialisiert mit Patch-Größe: " + PATCH_SIZE);
        System.out.println("TerrainGrid Position: " + terrainGrid.getLocalTranslation());
    }

    /**
     * Erstellt ein Material für das Terrain mit Texturen basierend auf Höhe
     */
    private Material createTerrainMaterial() {
        // Fallback auf einfaches Material da die Terrain-Shader Alpha-Maps benötigen
        Material terrainMaterial = new Material(assetManager, "Common/MatDefs/Light/Lighting.j3md");

        try {
            Texture grass = assetManager.loadTexture("Textures/Terrain/splat/grass.jpg");
            grass.setWrap(Texture.WrapMode.Repeat);
            terrainMaterial.setTexture("DiffuseMap", grass);
        } catch (Exception e) {
            System.out.println("Terrain-Texturen nicht verfügbar: " + e.getMessage());
            terrainMaterial.setColor("Diffuse", ColorRGBA.Green);
        }

        terrainMaterial.setColor("Ambient", ColorRGBA.Green.mult(0.3f));
        terrainMaterial.setFloat("Shininess", 10f);

        return terrainMaterial;
    }

    /**
     * Custom Terrain Tile Loader der unseren TileProvider verwendet
     */
    private class TileProviderTerrainTileLoader implements TerrainGridTileLoader {

        private int quadSize = PATCH_SIZE;

        @Override
        public TerrainQuad getTerrainQuadAt(Vector3f location) {
            // Debug-Ausgabe
            System.out.println("Lade TerrainQuad für Position: " + location);

            // Konvertiere World-Position zu Chunk-Koordinaten
            int chunkX = (int) Math.floor(location.x / quadSize);
            int chunkY = (int) Math.floor(location.z / quadSize);

            System.out.println("Chunk-Koordinaten: (" + chunkX + ", " + chunkY + ")");

            // Erstelle HeightMap für diesen Chunk
            TileProviderHeightMap heightMap = new TileProviderHeightMap(chunkX, chunkY, quadSize);

            // Prüfe ob HeightMap valide Daten hat
            if (heightMap.getHeightMap() == null || heightMap.getHeightMap().length == 0) {
                System.out.println("FEHLER: HeightMap ist leer!");
                return null;
            }

            // Erstelle TerrainQuad aus der HeightMap
            // Die Größe (quadSize+1) muss der tatsächlichen heightMap-Größe entsprechen
            TerrainQuad terrain = new TerrainQuad("terrain_" + chunkX + "_" + chunkY, quadSize, heightMap.getSize(), heightMap.getHeightMap());
            terrain.setMaterial(createTerrainMaterial());

            System.out.println("TerrainQuad erstellt: " + terrain.getName());
            return terrain;
        }

        @Override
        public void setPatchSize(int patchSize) {
            // Die Patch-Größe sollte eine 2^n+1 Größe sein (33, 65, 129, etc.)
            if (patchSize < 3) {
                throw new IllegalArgumentException("Patch-Größe muss mindestens 3 sein");
            }
            // Überprüfe ob es eine gültige 2^n+1 Größe ist
            int n = patchSize - 1;
            if ((n & (n - 1)) != 0) {
                System.out.println("Warnung: Patch-Größe " + patchSize + " ist nicht optimal (sollte 2^n+1 sein)");
            }
            this.quadSize = patchSize;
            System.out.println("Patch-Größe gesetzt auf: " + patchSize);
        }

        @Override
        public void setQuadSize(int quadSize) {
            this.quadSize = quadSize;
        }

        @Override
        public void write(JmeExporter ex) throws IOException {
            // Exportiere die Konfiguration des TileLoaders
            if (ex != null) {
                ex.getCapsule(this).write(quadSize, "quadSize", PATCH_SIZE);
            }
        }

        @Override
        public void read(JmeImporter im) throws IOException {
            // Importiere die Konfiguration des TileLoaders
            if (im != null) {
                this.quadSize = im.getCapsule(this).readInt("quadSize", PATCH_SIZE);
            }
        }
    }

    /**
     * Custom HeightMap die Daten vom TileProvider bezieht
     */
    private class TileProviderHeightMap extends AbstractHeightMap {
        private final int chunkX, chunkY;

        public TileProviderHeightMap(int chunkX, int chunkY, int size) {
            this.chunkX = chunkX;
            this.chunkY = chunkY;
            this.size = size;
            load();
        }

        @Override
        public boolean load() {
            System.out.println("Lade HeightMap für Chunk (" + chunkX + ", " + chunkY + ") mit Größe " + size);

            heightData = new float[size * size];

            try {
                // Lade Chunk-Daten vom TileProvider
                TileProviderService06.Tile[][] chunk = tileProviderService.loadChunk(chunkX, chunkY, size);

                System.out.println("Chunk geladen: " + chunk.length + "x" + chunk[0].length);

                for (int y = 0; y < size; y++) {
                    for (int x = 0; x < size; x++) {
                        int index = y * size + x;

                        if (y < chunk.length && x < chunk[0].length && chunk[y][x] != null) {
                            TileProviderService06.Tile tile = chunk[y][x];
                            // Verwende Durchschnittshöhe des Tiles und skaliere sie
                            float height = tile.getAverageHeight() * 20f; // Stärkere Skalierung für sichtbare Höhenunterschiede
                            heightData[index] = height;
                        } else {
                            // Fallback: Erstelle einfache Höhenvariationen
                            float height = (float) (Math.sin(x * 0.1) * Math.cos(y * 0.1) * 5 + 10);
                            heightData[index] = height;
                        }
                    }
                }

                System.out.println("HeightData generiert: " + heightData.length + " Punkte");

                // Debug: Zeige erste paar Höhenwerte
                System.out.print("Erste Höhenwerte: ");
                for (int i = 0; i < Math.min(10, heightData.length); i++) {
                    System.out.print(heightData[i] + " ");
                }
                System.out.println();

                return true;

            } catch (Exception e) {
                System.out.println("FEHLER beim Laden der HeightMap: " + e.getMessage());
                e.printStackTrace();

                // Fallback: Erstelle flaches Terrain mit leichten Variationen
                for (int i = 0; i < heightData.length; i++) {
                    heightData[i] = 10f + (float) (Math.random() * 5);
                }
                return true;
            }
        }
    }

    /**
     * Mittelbereich: Grobes Quad mit einfacher Textur für entfernte Bereiche
     */
    private void initMidRange() {
        Quad midQuad = new Quad(4000, 4000);
        Geometry midRange = new Geometry("midRange", midQuad);

        Material midMat = new Material(assetManager, "Common/MatDefs/Light/Lighting.j3md");

        // Verwende eine echte Textur aus jme3-testdata
        try {
            Texture grassTexture = assetManager.loadTexture("Textures/Terrain/splat/grass.jpg");
            grassTexture.setWrap(Texture.WrapMode.Repeat);
            midMat.setTexture("DiffuseMap", grassTexture);
        } catch (Exception e) {
            // Fallback auf Farbe falls Textur nicht verfügbar
            midMat.setColor("Diffuse", new ColorRGBA(0.4f, 0.6f, 0.2f, 1.0f));
        }

        midMat.setColor("Ambient", ColorRGBA.Green.mult(0.3f));

        midRange.setMaterial(midMat);
        midRange.setLocalTranslation(-2000, -60, -2000);
        midRange.rotate(-FastMath.HALF_PI, 0, 0);

        rootNode.attachChild(midRange);
    }

    /**
     * Fernbereich: Skybox
     */
    private void initSky() {
        // Erstelle prozedurales Skybox
        Sphere skyDome = new Sphere(32, 32, 8000, true, false);
        Geometry sky = new Geometry("Sky", skyDome);

        Material skyMat = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
        skyMat.setColor("Color", new ColorRGBA(0.5f, 0.7f, 1.0f, 1.0f));

        sky.setMaterial(skyMat);
        sky.setQueueBucket(RenderQueue.Bucket.Sky);
        sky.setCullHint(Spatial.CullHint.Never);

        rootNode.attachChild(sky);
    }

    /**
     * Wolken: Große Kugel mit transparenter Textur
     */
    private void initClouds() {
        cloudNode = new Node("Clouds");

        Sphere cloudDome = new Sphere(32, 32, 5000);
        Geometry clouds = new Geometry("clouds", cloudDome);

        Material cloudMat = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
        cloudMat.setColor("Color", new ColorRGBA(1, 1, 1, 0.5f));
        cloudMat.getAdditionalRenderState().setBlendMode(RenderState.BlendMode.Alpha);

        clouds.setMaterial(cloudMat);
        clouds.setQueueBucket(RenderQueue.Bucket.Sky);
        cloudNode.attachChild(clouds);
        rootNode.attachChild(cloudNode);
    }

    /**
     * Sonne: DirectionalLight + Billboard
     */
    private void initSun() {
        // Ambient Light
        AmbientLight ambient = new AmbientLight();
        ambient.setColor(ColorRGBA.White.mult(0.3f));
        rootNode.addLight(ambient);

        // Directional Light (Sonne)
        DirectionalLight sun = new DirectionalLight();
        sun.setDirection(new Vector3f(-0.5f, -0.7f, -0.3f).normalizeLocal());
        sun.setColor(ColorRGBA.White.mult(1.5f));
        rootNode.addLight(sun);

        // Sichtbare Sonne als Billboard
        Quad sunQuad = new Quad(200, 200);
        Geometry sunGeom = new Geometry("Sun", sunQuad);

        Material sunMat = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
        sunMat.setColor("Color", new ColorRGBA(1.0f, 1.0f, 0.7f, 1.0f));
        sunMat.getAdditionalRenderState().setBlendMode(RenderState.BlendMode.Alpha);

        sunGeom.setMaterial(sunMat);
        sunGeom.setQueueBucket(RenderQueue.Bucket.Transparent);
        sunGeom.addControl(new BillboardControl());

        sunGeom.setLocalTranslation(0, 1000, -3000);
        rootNode.attachChild(sunGeom);
    }

    /**
     * Nebel für atmosphärische Effekte
     */
    private void initFog() {
        try {
            FilterPostProcessor fpp = new FilterPostProcessor(assetManager);

            FogFilter fog = new FogFilter();
            fog.setFogColor(new ColorRGBA(0.8f, 0.9f, 1f, 1.0f));
            fog.setFogDistance(600);
            fog.setFogDensity(1.5f);
            fpp.addFilter(fog);

            viewPort.addProcessor(fpp);
        } catch (Exception e) {
            System.out.println("Nebel-Effekte nicht verfügbar: " + e.getMessage());
        }
    }

    private float getGroundHeight(Vector3f position) {
        // Verwende TerrainGrid für Höhenabfrage
        if (terrainGrid != null) {
            float height = terrainGrid.getHeight(new Vector2f(position.x, position.z));
            return height + GROUND_HEIGHT;
        }
        return GROUND_HEIGHT;
    }

    @Override
    public void onAction(String name, boolean isPressed, float tpf) {
        if (name.equals(TOGGLE_FLIGHT) && isPressed) {
            toggleFlightMode();
        } else if (name.equals(JUMP) && isPressed && !isFlightMode) {
            jump();
        }
    }

    private void toggleFlightMode() {
        isFlightMode = !isFlightMode;

        if (isFlightMode) {
            setFlightMode();
            System.out.println("Fly-Modus aktiviert");
        } else {
            setWalkMode();
            System.out.println("Walk-Modus aktiviert");
        }
    }

    private void setFlightMode() {
        isFlightMode = true;
        velocity.set(0, 0, 0);
    }

    private void setWalkMode() {
        isFlightMode = false;
    }

    private void jump() {
        if (isOnGround) {
            velocity.y = JUMP_FORCE;
            isOnGround = false;
            System.out.println("Sprung!");
        }
    }

    @Override
    public void simpleUpdate(float tpf) {
        cloudTime += tpf;

        // TerrainGrid handhabt das Chunk-Loading automatisch!
        // Keine manuellen updateChunks() Aufrufe mehr nötig!

        // Animiere Wolken
        if (cloudNode != null) {
            cloudNode.rotate(0, tpf * 0.005f, 0);
        }

        // Walk-Modus Physik
        if (!isFlightMode) {
            Vector3f camPos = cam.getLocation();
            float groundHeight = getGroundHeight(camPos);

            if (camPos.y > groundHeight) {
                velocity.y += GRAVITY * tpf;
                isOnGround = false;
            } else {
                camPos.y = groundHeight;
                velocity.y = 0;
                isOnGround = true;
            }

            if (!isOnGround) {
                camPos.y += velocity.y * tpf;
                if (camPos.y <= groundHeight) {
                    camPos.y = groundHeight;
                    velocity.y = 0;
                    isOnGround = true;
                }
            }

            cam.setLocation(camPos);
        }
    }
}
