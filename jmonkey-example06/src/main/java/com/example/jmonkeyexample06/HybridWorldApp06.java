package com.example.jmonkeyexample06;

import com.jme3.app.SimpleApplication;
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
import com.jme3.scene.shape.Box;
import com.jme3.scene.shape.Quad;
import com.jme3.scene.shape.Sphere;
import com.jme3.terrain.geomipmap.TerrainQuad;
import com.jme3.texture.Texture;
import com.jme3.util.BufferUtils;

import java.nio.FloatBuffer;
import java.nio.IntBuffer;

/**
 * Hybrid World App die TileProviderService06 mit erweiterten Rendering-Features kombiniert.
 * Beinhaltet: Dynamisches Terrain, Skybox, Wolken, Nebel, Sonne und Walk/Fly Modus.
 */
public class HybridWorldApp06 extends SimpleApplication implements ActionListener {

    private final TileProviderService06 tileProviderService;
    private Node tileMapNode;
    private final int CHUNK_SIZE = 16;
    private final int VIEW_DISTANCE = 3;
    private final int UNLOAD_DISTANCE = 5;

    // Tracking für geladene Chunks
    private final java.util.Set<String> loadedChunks = new java.util.HashSet<>();
    private final java.util.Map<String, Node> chunkNodes = new java.util.HashMap<>();
    private int lastPlayerChunkX = Integer.MAX_VALUE;
    private int lastPlayerChunkY = Integer.MAX_VALUE;

    // Update-Timer für Chunk-Loading
    private float chunkUpdateTimer = 0f;
    private final float CHUNK_UPDATE_INTERVAL = 0.5f;

    // Walk/Fly Modus Variablen
    private boolean isFlightMode = false;
    private static final String TOGGLE_FLIGHT = "ToggleFlight";
    private static final String JUMP = "Jump";
    private Vector3f velocity = new Vector3f(0, 0, 0);
    private final float GRAVITY = -9.81f;
    private final float GROUND_HEIGHT = 2.0f;
    private final float JUMP_FORCE = 8.0f;
    private boolean isOnGround = false;

    // Atmosphärische Elemente
    private Material cloudMat;
    private Geometry sunGeom;
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

        // Erstelle einen Node für die TileMap
        tileMapNode = new Node("TileMap");
        rootNode.attachChild(tileMapNode);

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

        System.out.println("Hybrid World mit TileProvider geladen!");
        System.out.println("Features: Dynamisches Terrain, Atmosphäre, Walk/Fly Modus");
    }

    private void setupInputMapping() {
        inputManager.addMapping(TOGGLE_FLIGHT, new KeyTrigger(KeyInput.KEY_F));
        inputManager.addMapping(JUMP, new KeyTrigger(KeyInput.KEY_SPACE));
        inputManager.addListener(this, TOGGLE_FLIGHT, JUMP);
    }

    /**
     * Nahbereich: TileProvider-basiertes Terrain mit dynamischem Loading
     */
    private void initNearTerrain() {
        // Lade die initiale TileMap um die Startposition
        updateChunks(true);
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

        cloudMat = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
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
        sunGeom = new Geometry("Sun", sunQuad);

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

    /**
     * Aktualisiert die geladenen Chunks basierend auf der Kameraposition.
     */
    private void updateChunks(boolean forceUpdate) {
        // Berechne aktuelle Chunk-Position der Kamera
        Vector3f camPos = cam.getLocation();
        int currentChunkX = (int) Math.floor(camPos.x / CHUNK_SIZE);
        int currentChunkY = (int) Math.floor(camPos.z / CHUNK_SIZE);

        // Prüfe ob sich die Chunk-Position geändert hat
        if (!forceUpdate && currentChunkX == lastPlayerChunkX && currentChunkY == lastPlayerChunkY) {
            return;
        }

        lastPlayerChunkX = currentChunkX;
        lastPlayerChunkY = currentChunkY;

        // Lade neue Chunks in VIEW_DISTANCE
        for (int dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE; dx++) {
            for (int dy = -VIEW_DISTANCE; dy <= VIEW_DISTANCE; dy++) {
                int chunkX = currentChunkX + dx;
                int chunkY = currentChunkY + dy;

                if (!tileProviderService.isChunkInBounds(chunkX, chunkY)) {
                    continue;
                }

                String chunkKey = chunkX + "," + chunkY;

                if (!loadedChunks.contains(chunkKey)) {
                    loadChunk(chunkX, chunkY);
                    loadedChunks.add(chunkKey);
                }
            }
        }

        // Entlade Chunks die zu weit entfernt sind
        java.util.Iterator<String> iterator = loadedChunks.iterator();
        while (iterator.hasNext()) {
            String chunkKey = iterator.next();
            String[] coords = chunkKey.split(",");
            int chunkX = Integer.parseInt(coords[0]);
            int chunkY = Integer.parseInt(coords[1]);

            int distance = Math.max(
                    Math.abs(chunkX - currentChunkX),
                    Math.abs(chunkY - currentChunkY)
            );

            if (distance > UNLOAD_DISTANCE) {
                unloadChunk(chunkX, chunkY);
                iterator.remove();
            }
        }

        if (forceUpdate || loadedChunks.size() % 10 == 0) {
            System.out.println("Kamera bei Chunk (" + currentChunkX + ", " + currentChunkY +
                    "), Geladene Chunks: " + loadedChunks.size());
        }
    }

    /**
     * Lädt einen einzelnen Chunk und erstellt die 3D-Geometrie mit fließenden Oberflächen.
     */
    private void loadChunk(int chunkX, int chunkY) {
        TileProviderService06.Tile[][] chunk = tileProviderService.loadChunk(chunkX, chunkY, CHUNK_SIZE);

        Node chunkNode = new Node("Chunk_" + chunkX + "_" + chunkY);
        tileMapNode.attachChild(chunkNode);

        String chunkKey = chunkX + "," + chunkY;
        chunkNodes.put(chunkKey, chunkNode);

        for (int x = 0; x < CHUNK_SIZE; x++) {
            for (int y = 0; y < CHUNK_SIZE; y++) {
                TileProviderService06.Tile tile = chunk[x][y];
                createFlowingSurfaceGeometry(tile, chunkNode);
            }
        }
    }

    /**
     * Entlädt einen Chunk und entfernt die Geometrie.
     */
    private void unloadChunk(int chunkX, int chunkY) {
        String chunkKey = chunkX + "," + chunkY;
        Node chunkNode = chunkNodes.get(chunkKey);

        if (chunkNode != null) {
            tileMapNode.detachChild(chunkNode);
            chunkNodes.remove(chunkKey);
            tileProviderService.unloadChunk(chunkX, chunkY);
        }
    }

    /**
     * Erstellt die 3D-Geometrie für ein einzelnes Tile mit fließender Oberfläche.
     */
    private void createFlowingSurfaceGeometry(TileProviderService06.Tile tile, Node parentNode) {
        float tileSize = 1.0f;

        // Erstelle ein custom Mesh für die fließende Oberfläche
        Mesh tileMesh = createTileMesh(tile, tileSize);

        Geometry tileGeom = new Geometry("FlowingTile_" + tile.getX() + "_" + tile.getY(), tileMesh);

        // Material basierend auf Tile-Typ erstellen mit echten Texturen
        Material tileMaterial = new Material(assetManager, "Common/MatDefs/Light/Lighting.j3md");
        TileProviderService06.TileType type = tile.getType();

        // Versuche passende Texturen zu laden basierend auf Biom-Typ
        try {
            String texturePath = getTextureForTileType(type);
            if (texturePath != null) {
                Texture texture = assetManager.loadTexture(texturePath);
                tileMaterial.setTexture("DiffuseMap", texture);
            } else {
                // Fallback auf Farbe
                ColorRGBA color = new ColorRGBA(type.getR(), type.getG(), type.getB(), 1.0f);
                tileMaterial.setColor("Diffuse", color);
            }
        } catch (Exception e) {
            // Fallback auf Farbe falls Textur nicht verfügbar
            ColorRGBA color = new ColorRGBA(type.getR(), type.getG(), type.getB(), 1.0f);
            tileMaterial.setColor("Diffuse", color);
        }

        ColorRGBA ambientColor = new ColorRGBA(type.getR(), type.getG(), type.getB(), 1.0f).mult(0.3f);
        tileMaterial.setColor("Ambient", ambientColor);
        tileMaterial.setFloat("Shininess", 10f);
        tileGeom.setMaterial(tileMaterial);

        // Schatten
        tileGeom.setShadowMode(RenderQueue.ShadowMode.CastAndReceive);

        // Positioniere das Tile in der Welt
        Vector3f position = new Vector3f(
                tile.getX() * tileSize,
                0,
                tile.getY() * tileSize
        );
        tileGeom.setLocalTranslation(position);

        parentNode.attachChild(tileGeom);
    }

    /**
     * Gibt den Textur-Pfad für einen bestimmten Tile-Typ zurück.
     */
    private String getTextureForTileType(TileProviderService06.TileType type) {
        switch (type) {
            case GRASS:
                return "Textures/Terrain/splat/grass.jpg";
            case WATER:
                return "Textures/Effects/Splash/splash.png";
            case SAND:
                return "Textures/Terrain/splat/dirt.jpg";
            case STONE:
                return "Textures/Terrain/splat/road.jpg";
            case SNOW:
                return "Textures/Terrain/splat/snow.jpg";
            case FOREST:
                return "Textures/Terrain/splat/grass.jpg"; // Verwende Gras-Textur für Wald
            case DESERT:
                return "Textures/Terrain/splat/dirt.jpg"; // Verwende Dirt-Textur für Wüste
            case SWAMP:
                return "Textures/Terrain/splat/grass.jpg"; // Verwende Gras-Textur für Sumpf
            default:
                return null; // Fallback auf Farbe
        }
    }

    /**
     * Erstellt ein custom Mesh für ein Tile mit fließender Oberfläche.
     */
    private Mesh createTileMesh(TileProviderService06.Tile tile, float tileSize) {
        Mesh mesh = new Mesh();

        // Definiere die 8 Vertices (4 oben, 4 unten) für das Tile
        float[] vertices = new float[]{
                // Boden-Vertices (Y = 0)
                0, 0, 0,
                tileSize, 0, 0,
                tileSize, 0, tileSize,
                0, 0, tileSize,

                // Oberflächen-Vertices (mit Eckpunkt-Höhen)
                0, tile.getHeightSW(), 0,
                tileSize, tile.getHeightSE(), 0,
                tileSize, tile.getHeightNE(), tileSize,
                0, tile.getHeightNW(), tileSize
        };

        // Definiere die Dreiecke (Faces) für das Mesh
        int[] indices = new int[]{
                // Oberfläche (2 Dreiecke)
                4, 5, 6, 4, 6, 7,
                // Seiten
                0, 1, 5, 0, 5, 4,
                1, 2, 6, 1, 6, 5,
                2, 3, 7, 2, 7, 6,
                3, 0, 4, 3, 4, 7,
                // Boden
                0, 2, 1, 0, 3, 2
        };

        // Setze Vertex-Daten
        FloatBuffer vertexBuffer = BufferUtils.createFloatBuffer(vertices);
        mesh.setBuffer(com.jme3.scene.VertexBuffer.Type.Position, 3, vertexBuffer);

        // Setze Index-Daten
        IntBuffer indexBuffer = BufferUtils.createIntBuffer(indices);
        mesh.setBuffer(com.jme3.scene.VertexBuffer.Type.Index, 3, indexBuffer);

        mesh.updateBound();
        mesh.updateCounts();

        return mesh;
    }

    private float getGroundHeight(Vector3f position) {
        int chunkX = (int) Math.floor(position.x / CHUNK_SIZE);
        int chunkY = (int) Math.floor(position.z / CHUNK_SIZE);

        float localX = position.x - (chunkX * CHUNK_SIZE);
        float localY = position.z - (chunkY * CHUNK_SIZE);

        TileProviderService06.Tile[][] chunk = tileProviderService.getChunk(chunkX, chunkY);
        if (chunk != null) {
            int tileX = (int) Math.floor(localX);
            int tileY = (int) Math.floor(localY);

            if (tileX >= 0 && tileX < CHUNK_SIZE && tileY >= 0 && tileY < CHUNK_SIZE) {
                TileProviderService06.Tile tile = chunk[tileX][tileY];
                if (tile != null) {
                    return tile.getAverageHeight() + GROUND_HEIGHT;
                }
            }
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
        chunkUpdateTimer += tpf;
        cloudTime += tpf;

        // Prüfe regelmäßig ob neue Chunks geladen werden müssen
        if (chunkUpdateTimer >= CHUNK_UPDATE_INTERVAL) {
            chunkUpdateTimer = 0f;
            updateChunks(false);
        }

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
