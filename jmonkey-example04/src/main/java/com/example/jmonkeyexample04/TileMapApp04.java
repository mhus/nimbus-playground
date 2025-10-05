package com.example.jmonkeyexample04;

import com.jme3.app.SimpleApplication;
import com.jme3.input.CameraInput;
import com.jme3.input.MouseInput;
import com.jme3.input.controls.MouseAxisTrigger;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.math.Vector3f;
import com.jme3.scene.Geometry;
import com.jme3.scene.Mesh;
import com.jme3.scene.Node;
import com.jme3.scene.VertexBuffer;
import com.jme3.util.BufferUtils;
import com.jme3.input.KeyInput;
import com.jme3.input.controls.ActionListener;
import com.jme3.input.controls.KeyTrigger;

import java.nio.FloatBuffer;
import java.nio.IntBuffer;

/**
 * jMonkey Engine Anwendungsklasse für TileMap-Darstellung mit fließenden Oberflächen.
 */
public class TileMapApp04 extends SimpleApplication implements ActionListener {

    private final TileProviderService04 tileProviderService;
    private Node tileMapNode;
    private final int CHUNK_SIZE = 16;
    private final int VIEW_DISTANCE = 3; // Anzahl der Chunks in jede Richtung
    private final int UNLOAD_DISTANCE = 5; // Entfernung zum Entladen von Chunks

    // Tracking für geladene Chunks
    private final java.util.Set<String> loadedChunks = new java.util.HashSet<>();
    private final java.util.Map<String, Node> chunkNodes = new java.util.HashMap<>();
    private int lastPlayerChunkX = Integer.MAX_VALUE;
    private int lastPlayerChunkY = Integer.MAX_VALUE;

    // Update-Timer für Chunk-Loading
    private float chunkUpdateTimer = 0f;
    private final float CHUNK_UPDATE_INTERVAL = 0.5f; // Alle 0.5 Sekunden prüfen

    // Fly/Walk Modus Variablen
    private boolean isFlightMode = false; // Default ist Walk-Modus
    private static final String TOGGLE_FLIGHT = "ToggleFlight";
    private static final String JUMP = "Jump";
    private Vector3f velocity = new Vector3f(0, 0, 0);
    private final float GRAVITY = -9.81f;
    private final float GROUND_HEIGHT = 2.0f; // Mindesthöhe über Grund
    private final float JUMP_FORCE = 8.0f; // Sprungkraft
    private boolean isOnGround = false;

    public TileMapApp04(TileProviderService04 tileProviderService) {
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

        // Setze initiale Kamera-Position
        cam.setLocation(new Vector3f(0, 15, 0)); // Startposition über dem Zentrum
        cam.lookAt(new Vector3f(8, 2, 8), Vector3f.UNIT_Y);

        // Aktiviere Fly-Kamera für Navigation, aber starte im Walk-Modus
        flyCam.setEnabled(true);
        flyCam.setMoveSpeed(12f); // Schnellere Bewegung für große Welt

        // Input-Mapping für F-Taste hinzufügen
        setupInputMapping();

        // Lade die initiale TileMap um die Startposition
        updateChunks(true);

        System.out.println("jMonkey Engine TileMap mit großem Terrain geladen! (Standalone)");
        System.out.println("Weltgröße: " + (tileProviderService.isChunkInBounds(50, 50) ? "200x200 Chunks" : "Unlimited"));
        System.out.println("Tile-Legende:");
        for (TileProviderService04.TileType type : TileProviderService04.TileType.values()) {
            System.out.println("  " + tileProviderService.getTileInfo(type));
        }
        System.out.println("Navigation: WASD + Maus für Kamera-Bewegung");
        System.out.println("F-Taste: Wechsel zwischen Walk- und Fly-Modus (Standard: Walk)");
        System.out.println("Space-Taste: Springen (nur im Walk-Modus)");
        System.out.println("Features: Dynamisches Chunk-Loading, fließende Oberflächen, großes Fenster");

        inputManager.addMapping(CameraInput.FLYCAM_FORWARD, new KeyTrigger(KeyInput.KEY_UP));

        inputManager.addMapping(CameraInput.FLYCAM_BACKWARD, new KeyTrigger(KeyInput.KEY_DOWN));

        // Starte im Walk-Modus
        setWalkMode();
    }

    /**
     * Konfiguriert das Input-Mapping für die F-Taste.
     */
    private void setupInputMapping() {
        inputManager.addMapping(TOGGLE_FLIGHT, new KeyTrigger(KeyInput.KEY_F));
        inputManager.addMapping(JUMP, new KeyTrigger(KeyInput.KEY_SPACE));
        inputManager.addListener(this, TOGGLE_FLIGHT, JUMP);
    }

    /**
     * Behandelt Input-Events.
     */
    @Override
    public void onAction(String name, boolean isPressed, float tpf) {
        if (name.equals(TOGGLE_FLIGHT) && isPressed) {
            toggleFlightMode();
        } else if (name.equals(JUMP) && isPressed && !isFlightMode) {
            jump();
        }
    }

    /**
     * Wechselt zwischen Fly- und Walk-Modus.
     */
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

    /**
     * Aktiviert den Fly-Modus.
     */
    private void setFlightMode() {
        isFlightMode = true;
        velocity.set(0, 0, 0); // Reset velocity
    }

    /**
     * Aktiviert den Walk-Modus mit Gravitation.
     */
    private void setWalkMode() {
        isFlightMode = false;
        // Velocity wird in simpleUpdate verwaltet
    }

    /**
     * Berechnet die Bodenhöhe an der aktuellen Kameraposition.
     */
    private float getGroundHeight(Vector3f position) {
        // Berechne Chunk-Position
        int chunkX = (int) Math.floor(position.x / CHUNK_SIZE);
        int chunkY = (int) Math.floor(position.z / CHUNK_SIZE);

        // Berechne lokale Position im Chunk
        float localX = position.x - (chunkX * CHUNK_SIZE);
        float localY = position.z - (chunkY * CHUNK_SIZE);

        // Hole Tile-Daten
        TileProviderService04.Tile[][] chunk = tileProviderService.getChunk(chunkX, chunkY);
        if (chunk != null) {
            int tileX = (int) Math.floor(localX);
            int tileY = (int) Math.floor(localY);

            if (tileX >= 0 && tileX < CHUNK_SIZE && tileY >= 0 && tileY < CHUNK_SIZE) {
                TileProviderService04.Tile tile = chunk[tileX][tileY];
                if (tile != null) {
                    // Interpoliere Höhe basierend auf Position im Tile
                    float dx = localX - tileX;
                    float dy = localY - tileY;

                    // Bilineare Interpolation der Eckpunkte
                    float heightSW = tile.getHeightSW();
                    float heightSE = tile.getHeightSE();
                    float heightNW = tile.getHeightNW();
                    float heightNE = tile.getHeightNE();

                    float heightS = heightSW + (heightSE - heightSW) * dx;
                    float heightN = heightNW + (heightNE - heightNW) * dx;
                    float height = heightS + (heightN - heightS) * dy;

                    return height + GROUND_HEIGHT;
                }
            }
        }

        return GROUND_HEIGHT; // Fallback-Höhe
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
            return; // Keine Änderung
        }

        lastPlayerChunkX = currentChunkX;
        lastPlayerChunkY = currentChunkY;

        // Lade neue Chunks in VIEW_DISTANCE
        java.util.Set<String> chunksToLoad = new java.util.HashSet<>();
        for (int dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE; dx++) {
            for (int dy = -VIEW_DISTANCE; dy <= VIEW_DISTANCE; dy++) {
                int chunkX = currentChunkX + dx;
                int chunkY = currentChunkY + dy;

                // Prüfe Weltgrenzen
                if (!tileProviderService.isChunkInBounds(chunkX, chunkY)) {
                    continue;
                }

                String chunkKey = chunkX + "," + chunkY;
                chunksToLoad.add(chunkKey);

                // Lade Chunk falls noch nicht geladen
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

        // Debug-Ausgabe
        if (forceUpdate || loadedChunks.size() % 10 == 0) {
            System.out.println("Kamera bei Chunk (" + currentChunkX + ", " + currentChunkY +
                    "), Geladene Chunks: " + loadedChunks.size() +
                    ", Service Chunks: " + tileProviderService.getLoadedChunkCount());
        }
    }

    /**
     * Lädt einen einzelnen Chunk und erstellt die 3D-Geometrie mit fließenden Oberflächen.
     */
    private void loadChunk(int chunkX, int chunkY) {
        TileProviderService04.Tile[][] chunk = tileProviderService.loadChunk(chunkX, chunkY, CHUNK_SIZE);

        Node chunkNode = new Node("Chunk_" + chunkX + "_" + chunkY);
        tileMapNode.attachChild(chunkNode);

        String chunkKey = chunkX + "," + chunkY;
        chunkNodes.put(chunkKey, chunkNode);

        for (int x = 0; x < CHUNK_SIZE; x++) {
            for (int y = 0; y < CHUNK_SIZE; y++) {
                TileProviderService04.Tile tile = chunk[x][y];
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
            // Entferne aus der Szene
            tileMapNode.detachChild(chunkNode);
            chunkNodes.remove(chunkKey);

            // Entlade aus dem Service (optional, für Speicher-Management)
            tileProviderService.unloadChunk(chunkX, chunkY);
        }
    }

    /**
     * Erstellt die 3D-Geometrie für ein einzelnes Tile mit fließender Oberfläche.
     */
    private void createFlowingSurfaceGeometry(TileProviderService04.Tile tile, Node parentNode) {
        float tileSize = 1.0f;

        // Erstelle ein custom Mesh für die fließende Oberfläche
        Mesh tileMesh = createTileMesh(tile, tileSize);

        Geometry tileGeom = new Geometry("FlowingTile_" + tile.getX() + "_" + tile.getY(), tileMesh);

        // Material basierend auf Tile-Typ erstellen
        Material tileMaterial = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
        TileProviderService04.TileType type = tile.getType();
        ColorRGBA color = new ColorRGBA(type.getR(), type.getG(), type.getB(), 1.0f);
        tileMaterial.setColor("Color", color);
        tileGeom.setMaterial(tileMaterial);

        // Positioniere das Tile in der Welt
        Vector3f position = new Vector3f(
                tile.getX() * tileSize,
                0, // Basis-Position, Höhen sind im Mesh definiert
                tile.getY() * tileSize
        );
        tileGeom.setLocalTranslation(position);

        // Füge das Tile zum Chunk-Node hinzu
        parentNode.attachChild(tileGeom);
    }

    /**
     * Erstellt ein custom Mesh für ein Tile mit fließender Oberfläche basierend auf Eckpunkt-Höhen.
     */
    private Mesh createTileMesh(TileProviderService04.Tile tile, float tileSize) {
        Mesh mesh = new Mesh();

        // Definiere die 8 Vertices (4 oben, 4 unten) für das Tile
        float[] vertices = new float[]{
                // Boden-Vertices (Y = 0)
                0, 0, 0,         // 0: SW unten
                tileSize, 0, 0,         // 1: SE unten
                tileSize, 0, tileSize,  // 2: NE unten
                0, 0, tileSize,  // 3: NW unten

                // Oberflächen-Vertices (mit Eckpunkt-Höhen)
                0, tile.getHeightSW(), 0,         // 4: SW oben
                tileSize, tile.getHeightSE(), 0,         // 5: SE oben
                tileSize, tile.getHeightNE(), tileSize,  // 6: NE oben
                0, tile.getHeightNW(), tileSize   // 7: NW oben
        };

        // Definiere die Dreiecke (Faces) für das Mesh
        int[] indices = new int[]{
                // Oberfläche (2 Dreiecke)
                4, 5, 6,    // Dreieck 1: SW-SE-NE
                4, 6, 7,    // Dreieck 2: SW-NE-NW

                // Seiten (je 2 Dreiecke pro Seite)
                // Süd-Seite
                0, 1, 5, 0, 5, 4,
                // Ost-Seite
                1, 2, 6, 1, 6, 5,
                // Nord-Seite
                2, 3, 7, 2, 7, 6,
                // West-Seite
                3, 0, 4, 3, 4, 7,

                // Boden
                0, 2, 1, 0, 3, 2
        };

        // Setze Vertex-Daten
        FloatBuffer vertexBuffer = BufferUtils.createFloatBuffer(vertices);
        mesh.setBuffer(VertexBuffer.Type.Position, 3, vertexBuffer);

        // Setze Index-Daten
        IntBuffer indexBuffer = BufferUtils.createIntBuffer(indices);
        mesh.setBuffer(VertexBuffer.Type.Index, 3, indexBuffer);

        // Berechne Normalen für korrekte Beleuchtung
        mesh.updateBound();
        mesh.updateCounts();

        return mesh;
    }

    @Override
    public void simpleUpdate(float tpf) {
        chunkUpdateTimer += tpf;

        // Prüfe regelmäßig ob neue Chunks geladen werden müssen
        if (chunkUpdateTimer >= CHUNK_UPDATE_INTERVAL) {
            chunkUpdateTimer = 0f;
            updateChunks(false);
        }

        // Walk-Modus Physik
        if (!isFlightMode) {
            Vector3f camPos = cam.getLocation();
            float groundHeight = getGroundHeight(camPos);

            // Anwenden der Gravitation
            if (camPos.y > groundHeight) {
                velocity.y += GRAVITY * tpf;
                isOnGround = false;
            } else {
                // Kamera ist am Boden
                camPos.y = groundHeight;
                velocity.y = 0;
                isOnGround = true;
            }

            // Anwenden der vertikalen Bewegung
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

    /**
     * Führt einen Sprung aus (nur im Walk-Modus verfügbar).
     */
    private void jump() {
        if (isOnGround) {
            velocity.y = JUMP_FORCE;
            isOnGround = false;
            System.out.println("Sprung!");
        }
    }
}
