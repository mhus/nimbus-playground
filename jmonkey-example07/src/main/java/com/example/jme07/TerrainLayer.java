package com.example.jme07;

import com.jme3.asset.AssetManager;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.math.Vector2f;
import com.jme3.math.Vector3f;
import com.jme3.renderer.Camera;
import com.jme3.scene.Node;
import com.jme3.terrain.geomipmap.TerrainLodControl;
import com.jme3.terrain.geomipmap.TerrainQuad;
import com.jme3.terrain.geomipmap.lodcalc.DistanceLodCalculator;
import com.jme3.texture.Texture;
import com.jme3.texture.Texture2D;
import com.jme3.texture.Image;
import com.jme3.util.BufferUtils;

import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * TerrainLayer - Verwaltet das dynamische Terrain mit Chunk-Loading
 */
public class TerrainLayer extends Layer {

    private TileProvider tileProvider;
    private SpriteProvider spriteProvider;
    private ChunkLoader chunkLoader;
    private Node terrainNode;
    private Node waterNode;
    private Node spriteNode;
    private Map<Vector2f, TerrainQuad> loadedChunks = new HashMap<>();
    private Map<Vector2f, com.jme3.scene.Geometry> loadedWaterChunks = new HashMap<>();
    private Map<Vector2f, List<com.jme3.scene.Geometry>> loadedSpriteChunks = new HashMap<>();

    // Cache für Höhendaten (unabhängig vom Rendering)
    private Map<Vector2f, float[]> heightDataCache = new HashMap<>();

    // Set für Chunks die gerade angefordert wurden (um Duplikate zu vermeiden)
    private java.util.Set<Vector2f> requestedChunks = new java.util.HashSet<>();

    private static final int CHUNK_SIZE = 65;
    private static final int VIEW_DISTANCE = 12;
    private static final int SPRITE_NEAR_DISTANCE = 4;   // Volle Sprites (alle Typen)
    private static final int SPRITE_FAR_DISTANCE = 8;    // Nur große Sprites (Bäume, Steine)
    private static final float GROUND_OFFSET = 5.0f;  // Erhöht für bessere Sicht (Augenhöhe + Sicherheitsabstand)
    private static final boolean SHOW_CURRENT_TILE = true;  // true = zeigt aktuelle Tile rot an

    private Vector2f lastCameraChunk = new Vector2f(Float.MAX_VALUE, Float.MAX_VALUE);
    private com.jme3.scene.Geometry currentTileMarker = null;
    private Vector2f lastMarkedTile = new Vector2f(Float.MAX_VALUE, Float.MAX_VALUE);

    // Cache für Materialien und Texturen
    private Material waterMat;
    private Material tileMarkerMat;
    private Map<String, Texture> textureCache = new HashMap<>();
    private Map<String, MaterialMapping> materialMappingCache = new HashMap<>();

    public TerrainLayer(AssetManager assetManager, Node rootNode, Camera cam) {
        super("TerrainLayer", assetManager, rootNode, cam);

        this.terrainNode = new Node("TerrainNode");
        rootNode.attachChild(terrainNode);

        this.waterNode = new Node("WaterNode");
        rootNode.attachChild(waterNode);

        this.spriteNode = new Node("SpriteNode");
        rootNode.attachChild(spriteNode);

        initTileProvider();
        initSpriteProvider();
        initChunkLoader();
        System.out.println("TerrainLayer initialisiert - Chunk-Größe: " + CHUNK_SIZE + ", Sichtweite: " + VIEW_DISTANCE);
    }

    private void initTileProvider() {
        // Basis-Provider: Prozedurales Terrain
        TileProvider baseProvider = new ProceduralTileProvider(12345L, 0.02f, 40f);

        // Wrap mit CrossRoadTileProvider für Straßen
        tileProvider = new CrossRoadTileProvider(new WaterTileProvider(baseProvider));

        System.out.println("TileProvider: " + tileProvider.getName());
    }

    private void initSpriteProvider() {
        // ProceduralSpriteProvider mit gleichem Seed wie Terrain für Konsistenz
        spriteProvider = new ProceduralSpriteProvider(12345L, tileProvider, CHUNK_SIZE);
        System.out.println("SpriteProvider: " + spriteProvider.getName());
    }

    private void initChunkLoader() {
        // Erstelle ChunkLoader mit TileProvider und SpriteProvider
        chunkLoader = new ChunkLoader(tileProvider, spriteProvider);
        System.out.println("ChunkLoader initialisiert (Background-Thread läuft)");
    }

    @Override
    public void update(float tpf) {
        // Chunk-Management
        Vector3f camPos = cam.getLocation();
        int chunkX = (int) Math.floor(camPos.x / (CHUNK_SIZE - 1));
        int chunkZ = (int) Math.floor(camPos.z / (CHUNK_SIZE - 1));
        Vector2f currentChunk = new Vector2f(chunkX, chunkZ);

        if (!currentChunk.equals(lastCameraChunk)) {
            System.out.println("Kamera-Chunk gewechselt: (" + chunkX + ", " + chunkZ + ")");
            updateVisibleChunks(chunkX, chunkZ);
            lastCameraChunk = currentChunk;
        }

        // Prüfe auf fertig geladene Chunks und rendere sie
        checkAndRenderLoadedChunks();

        // Aktualisiere Tile-Marker wenn aktiviert
        if (SHOW_CURRENT_TILE) {
            updateCurrentTileMarker(camPos);
        }
    }

    public float getTerrainHeightAtRange(float x, float z, int range) {
        // Prüfe umliegende Punkte (-1, 0, 1) und nimm das Maximum
        // Das verhindert, dass die Kamera in Löcher fällt
        float maxHeight = Float.NEGATIVE_INFINITY;

        for (int dx = -range; dx <= range; dx++) {
            for (int dz = -range; dz <= range; dz++) {
                float sampleX = x + dx;
                float sampleZ = z + dz;
                float height = getTerrainHeightAt(sampleX, sampleZ);
                if (height > maxHeight) {
                    maxHeight = height;
                }
            }
        }

        return maxHeight;
    }

    public float getTerrainHeightAt(float x, float z) {
        // Berechne den Chunk, in dem sich die Position befindet
        int chunkX = (int) Math.floor(x / (CHUNK_SIZE - 1));
        int chunkZ = (int) Math.floor(z / (CHUNK_SIZE - 1));
        Vector2f chunkCoord = new Vector2f(chunkX, chunkZ);

        // Versuche zuerst vom gerenderten TerrainQuad zu holen
        TerrainQuad terrain = loadedChunks.get(chunkCoord);
        if (terrain != null) {
            try {
                float height = terrain.getHeight(new Vector2f(x, z));
                if (!Float.isNaN(height) && !Float.isInfinite(height)) {
                    return height;
                }
            } catch (Exception e) {
                // Fehler beim Abrufen der Höhe, nutze Fallback
            }
        }

        // Versuche aus Height-Cache zu holen (schneller als TileProvider)
        float[] cachedHeights = heightDataCache.get(chunkCoord);
        if (cachedHeights != null) {
            try {
                float localX = x - (chunkX * (CHUNK_SIZE - 1));
                float localZ = z - (chunkZ * (CHUNK_SIZE - 1));

                int ix = (int) Math.floor(localX);
                int iz = (int) Math.floor(localZ);

                // Clamp auf gültigen Bereich
                if (ix < 0) ix = 0;
                if (ix >= CHUNK_SIZE) ix = CHUNK_SIZE - 1;
                if (iz < 0) iz = 0;
                if (iz >= CHUNK_SIZE) iz = CHUNK_SIZE - 1;

                int index = iz * CHUNK_SIZE + ix;
                if (index < cachedHeights.length) {
                    return cachedHeights[index];
                }
            } catch (Exception e) {
                // Fehler beim Cache-Zugriff, nutze TileProvider
            }
        }

        System.out.println("++++++++++++++++ OHHH NOOOO %d0 %d0".formatted(chunkX, chunkZ));
        // Fallback: Berechne Höhe direkt vom TileProvider (auch für noch nicht gerenderte Chunks)
        try {
            // Lokale Koordinaten im Chunk
            float localX = x - (chunkX * (CHUNK_SIZE - 1));
            float localZ = z - (chunkZ * (CHUNK_SIZE - 1));

            // Hole Tile-Daten vom Provider
            TerrainTile[] tiles = tileProvider.getTileData(chunkX, chunkZ, CHUNK_SIZE);

            // Berechne Array-Index (clamped auf gültigen Bereich)
            int ix = (int) Math.floor(localX);
            int iz = (int) Math.floor(localZ);

            // Clamp auf gültigen Bereich
            if (ix < 0) ix = 0;
            if (ix >= CHUNK_SIZE) ix = CHUNK_SIZE - 1;
            if (iz < 0) iz = 0;
            if (iz >= CHUNK_SIZE) iz = CHUNK_SIZE - 1;

            // Hole direkt die Höhe vom Tile
            int index = iz * CHUNK_SIZE + ix;
            if (index >= 0 && index < tiles.length) {
                return tiles[index].getHeight();
            }
        } catch (Exception e) {
            // Bei Fehler: Standardhöhe zurückgeben
            System.err.println("FEHLER in getTerrainHeightAt(" + x + ", " + z + "): " + e.getMessage());
        }

        System.out.println("++++++++++++++++ RETURN 10f");
        return 10f;
    }

    public float getGroundOffset() {
        return GROUND_OFFSET;
    }

    public float getWaterHeight(float x, float z) {
        // Berechne den Chunk, in dem sich die Position befindet
        int chunkX = (int) Math.floor(x / (CHUNK_SIZE - 1));
        int chunkZ = (int) Math.floor(z / (CHUNK_SIZE - 1));

        try {
            // Hole Tile-Daten
            TerrainTile[] tiles = tileProvider.getTileData(chunkX, chunkZ, CHUNK_SIZE);

            // Berechne lokale Koordinaten
            float localX = x - (chunkX * (CHUNK_SIZE - 1));
            float localZ = z - (chunkZ * (CHUNK_SIZE - 1));

            int ix = (int) Math.floor(localX);
            int iz = (int) Math.floor(localZ);

            if (ix >= 0 && ix < CHUNK_SIZE && iz >= 0 && iz < CHUNK_SIZE) {
                int index = iz * CHUNK_SIZE + ix;
                if (index >= 0 && index < tiles.length) {
                    TerrainTile tile = tiles[index];
                    if (tile.hasWater() && tile.getWater() != null) {
                        return tile.getWater().getWaterHeight();
                    }
                }
            }
        } catch (Exception e) {
            // Bei Fehler: Kein Wasser
        }

        return Float.NEGATIVE_INFINITY; // Kein Wasser an dieser Position
    }

    public float getSpeedMultiplier(float x, float z) {
        // Prüfe umliegende Punkte (-1, 0, 1) und nimm den Durchschnitt
        float totalSpeed = 0f;
        int count = 0;

        for (int dx = -1; dx <= 1; dx++) {
            for (int dz = -1; dz <= 1; dz++) {
                float sampleX = x + dx;
                float sampleZ = z + dz;
                float speed = getSpeedMultiplierAt(sampleX, sampleZ);
                totalSpeed += speed;
                count++;
            }
        }

        return totalSpeed / count;
    }

    private float getSpeedMultiplierAt(float x, float z) {
        // Berechne den Chunk, in dem sich die Position befindet
        int chunkX = (int) Math.floor(x / (CHUNK_SIZE - 1));
        int chunkZ = (int) Math.floor(z / (CHUNK_SIZE - 1));
        Vector2f chunkCoord = new Vector2f(chunkX, chunkZ);

        TerrainQuad terrain = loadedChunks.get(chunkCoord);
        if (terrain != null) {
            try {
                // Berechne lokale Koordinaten im Chunk
                float localX = x - (chunkX * (CHUNK_SIZE - 1));
                float localZ = z - (chunkZ * (CHUNK_SIZE - 1));

                int ix = (int) Math.floor(localX);
                int iz = (int) Math.floor(localZ);

                if (ix >= 0 && ix < CHUNK_SIZE && iz >= 0 && iz < CHUNK_SIZE) {
                    // Hole Speed-Multiplier vom TileProvider
                    TerrainTile[] tiles = tileProvider.getTileData(chunkX, chunkZ, CHUNK_SIZE);
                    int index = iz * CHUNK_SIZE + ix;
                    if (index >= 0 && index < tiles.length) {
                        return tiles[index].getSpeedMultiplier();
                    }
                }
            } catch (Exception e) {
                // Bei Fehler: Default-Speed zurückgeben
            }
        }

        return 1.0f; // Default Speed
    }

    private void updateVisibleChunks(int centerX, int centerZ) {
        System.out.println("Aktualisiere sichtbare Chunks um (" + centerX + ", " + centerZ + ")");

        Map<Vector2f, Boolean> shouldBeLoaded = new HashMap<>();
        Map<Vector2f, Boolean> shouldHaveSprites = new HashMap<>();

        for (int x = centerX - VIEW_DISTANCE; x <= centerX + VIEW_DISTANCE; x++) {
            for (int z = centerZ - VIEW_DISTANCE; z <= centerZ + VIEW_DISTANCE; z++) {
                Vector2f chunkCoord = new Vector2f(x, z);
                shouldBeLoaded.put(chunkCoord, true);

                // Berechne Distanz zum Kamera-Chunk
                int distance = Math.max(Math.abs(x - centerX), Math.abs(z - centerZ));

                // Entscheide ob und welche Sprites geladen werden sollen
                if (distance <= SPRITE_FAR_DISTANCE) {
                    shouldHaveSprites.put(chunkCoord, true);
                }

                if (!loadedChunks.containsKey(chunkCoord)) {
                    // Fordere Chunk an (falls noch nicht angefordert)
                    if (!requestedChunks.contains(chunkCoord)) {
                        chunkLoader.requestChunk(x, z);
                        requestedChunks.add(chunkCoord);
                    }
                } else {
                    // Update Sprites wenn LOD sich geändert hat
                    updateChunkSprites(x, z, centerX, centerZ, chunkCoord);
                }
            }
        }

        loadedChunks.entrySet().removeIf(entry -> {
            if (!shouldBeLoaded.containsKey(entry.getKey())) {
                System.out.println("Entlade Chunk: " + entry.getKey());
                terrainNode.detachChild(entry.getValue());
                requestedChunks.remove(entry.getKey());
                heightDataCache.remove(entry.getKey());  // Entferne auch aus Height-Cache
                chunkLoader.unloadChunk((int)entry.getKey().x, (int)entry.getKey().y);
                return true;
            }
            return false;
        });

        // Entlade auch Wasser-Chunks
        loadedWaterChunks.entrySet().removeIf(entry -> {
            if (!shouldBeLoaded.containsKey(entry.getKey())) {
                System.out.println("Entlade Wasser-Chunk: " + entry.getKey());
                waterNode.detachChild(entry.getValue());
                return true;
            }
            return false;
        });

        // Entlade Sprite-Chunks die außerhalb der Sprite-Distanz sind
        loadedSpriteChunks.entrySet().removeIf(entry -> {
            if (!shouldHaveSprites.containsKey(entry.getKey())) {
                System.out.println("Entlade Sprite-Chunk: " + entry.getKey());
                for (com.jme3.scene.Geometry sprite : entry.getValue()) {
                    spriteNode.detachChild(sprite);
                }
                return true;
            }
            return false;
        });

        System.out.println("Geladene Chunks: " + loadedChunks.size() + ", Wasser-Chunks: " + loadedWaterChunks.size() + ", Sprite-Chunks: " + loadedSpriteChunks.size());
    }

    /**
     * Prüft auf fertig geladene Chunks und rendert sie
     */
    private void checkAndRenderLoadedChunks() {
        // Erstelle Kopie von requestedChunks zum Iterieren (vermeidet ConcurrentModificationException)
        java.util.Set<Vector2f> toCheck = new java.util.HashSet<>(requestedChunks);

        for (Vector2f chunkCoord : toCheck) {
            int chunkX = (int) chunkCoord.x;
            int chunkZ = (int) chunkCoord.y;

            // Hole geladenen Chunk
            LoadedChunk loadedChunk = chunkLoader.getLoadedChunk(chunkX, chunkZ);

            if (loadedChunk != null) {
                // Chunk ist fertig geladen -> rendere ihn
                renderChunk(loadedChunk);
                requestedChunks.remove(chunkCoord);
            }
        }
    }

    /**
     * Rendert einen fertig geladenen Chunk
     */
    private void renderChunk(LoadedChunk loadedChunk) {
        int chunkX = loadedChunk.getChunkX();
        int chunkZ = loadedChunk.getChunkZ();
        Vector2f chunkCoord = new Vector2f(chunkX, chunkZ);

        try {
            // Erstelle Terrain aus geladenen Tiles
            Map<String, TerrainTile> tilesMap = loadedChunk.getTiles();

            // Konvertiere Map zu Array für bestehende Methoden
            TerrainTile[] tiles = new TerrainTile[CHUNK_SIZE * CHUNK_SIZE];
            float[] heightData = new float[CHUNK_SIZE * CHUNK_SIZE];

            for (int z = 0; z < CHUNK_SIZE; z++) {
                for (int x = 0; x < CHUNK_SIZE; x++) {
                    int worldX = chunkX * (CHUNK_SIZE - 1) + x;
                    int worldZ = chunkZ * (CHUNK_SIZE - 1) + z;
                    String key = worldX + "," + worldZ;

                    TerrainTile tile = tilesMap.get(key);
                    if (tile != null) {
                        tiles[z * CHUNK_SIZE + x] = tile;
                        heightData[z * CHUNK_SIZE + x] = tile.getHeight();
                    } else {
                        heightData[z * CHUNK_SIZE + x] = 10f;
                    }
                }
            }

            // Erstelle TerrainQuad
            // TerrainQuad(name, patchSize, totalSize, heightMap)
            // totalSize muss 2^N + 1 sein (z.B. 65, 129, 257)
            TerrainQuad terrain = new TerrainQuad("Chunk_" + chunkX + "_" + chunkZ, 65, CHUNK_SIZE, heightData);
            terrain.setLocalTranslation(chunkX * (CHUNK_SIZE - 1), 0, chunkZ * (CHUNK_SIZE - 1));

            // Material (mit cached Textures)
            Material mat = createTerrainMaterial(tiles);
            terrain.setMaterial(mat);

            // LOD Control
            TerrainLodControl control = new TerrainLodControl(terrain, cam);
            control.setLodCalculator(new DistanceLodCalculator(CHUNK_SIZE, 2.7f));
            terrain.addControl(control);

            terrainNode.attachChild(terrain);
            loadedChunks.put(chunkCoord, terrain);

            // Speichere Höhendaten im Cache
            heightDataCache.put(chunkCoord, heightData);

            // Wasser
            float worldX = chunkX * (CHUNK_SIZE - 1);
            float worldZ = chunkZ * (CHUNK_SIZE - 1);
            createWaterOverlay(chunkX, chunkZ, tiles, worldX, worldZ);

            // Sprites (mit LOD)
            Vector3f camPos = cam.getLocation();
            int centerX = (int) Math.floor(camPos.x / (CHUNK_SIZE - 1));
            int centerZ = (int) Math.floor(camPos.z / (CHUNK_SIZE - 1));
            int distance = Math.max(Math.abs(chunkX - centerX), Math.abs(chunkZ - centerZ));

            if (distance <= SPRITE_FAR_DISTANCE) {
                boolean bigOnly = distance > SPRITE_NEAR_DISTANCE;
                createSpritesFromLoadedChunk(loadedChunk, bigOnly);
            }

            System.out.println("Chunk gerendert: (" + chunkX + ", " + chunkZ + ") - " +
                             (System.currentTimeMillis() - loadedChunk.getLoadTime()) + "ms seit Laden");

        } catch (Exception e) {
            System.err.println("FEHLER beim Rendern von Chunk (" + chunkX + ", " + chunkZ + "): " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Erstellt Sprites aus einem geladenen Chunk
     */
    private void createSpritesFromLoadedChunk(LoadedChunk loadedChunk, boolean bigOnly) {
        int chunkX = loadedChunk.getChunkX();
        int chunkZ = loadedChunk.getChunkZ();
        Vector2f chunkCoord = new Vector2f(chunkX, chunkZ);

        List<Sprite> sprites = loadedChunk.getSprites();
        List<com.jme3.scene.Geometry> geometries = new java.util.ArrayList<>();

        for (Sprite sprite : sprites) {
            // Filtere nach bigOnly
            if (bigOnly && !sprite.isBig()) {
                continue;
            }

            List<com.jme3.scene.Geometry> spriteGeoms = sprite.createGeometries(assetManager, spriteNode);
            geometries.addAll(spriteGeoms);
        }

        loadedSpriteChunks.put(chunkCoord, geometries);
        System.out.println("Sprites gerendert für Chunk (" + chunkX + ", " + chunkZ + "): " + geometries.size() + " Geometries (bigOnly=" + bigOnly + ")");
    }

    private void updateChunkSprites(int chunkX, int chunkZ, int centerX, int centerZ, Vector2f chunkCoord) {
        int distance = Math.max(Math.abs(chunkX - centerX), Math.abs(chunkZ - centerZ));

        // Bestimme ob Sprites geladen sein sollten und welche LOD-Stufe
        boolean shouldHaveSprites = distance <= SPRITE_FAR_DISTANCE;
        boolean bigOnly = distance > SPRITE_NEAR_DISTANCE;
        boolean hasSprites = loadedSpriteChunks.containsKey(chunkCoord);

        if (!shouldHaveSprites && hasSprites) {
            // Entferne Sprites
            List<com.jme3.scene.Geometry> sprites = loadedSpriteChunks.remove(chunkCoord);
            for (com.jme3.scene.Geometry sprite : sprites) {
                spriteNode.detachChild(sprite);
            }
            System.out.println("Sprites entfernt für Chunk (" + chunkX + ", " + chunkZ + ") - zu weit entfernt");
        } else if (shouldHaveSprites && !hasSprites) {
            // Lade Sprites
            try {
                TerrainTile[] tiles = tileProvider.getTileData(chunkX, chunkZ, CHUNK_SIZE);
                createSpriteOverlay(chunkX, chunkZ, tiles, bigOnly);
            } catch (Exception e) {
                System.err.println("FEHLER beim Laden von Sprites für Chunk (" + chunkX + ", " + chunkZ + "): " + e.getMessage());
            }
        }
        // LOD-Update wird nicht durchgeführt (würde Sprites neu erstellen müssen)
    }

    private void loadChunk(int chunkX, int chunkZ, int centerX, int centerZ) {
        System.out.println("Lade Chunk: (" + chunkX + ", " + chunkZ + ")");

        try {
            // Hole Tile-Daten (Höhe + Material + Parameter)
            TerrainTile[] tiles = tileProvider.getTileData(chunkX, chunkZ, CHUNK_SIZE);

            // Extrahiere Höhendaten für TerrainQuad
            float[] heightData = new float[tiles.length];
            for (int i = 0; i < tiles.length; i++) {
                heightData[i] = tiles[i].getHeight();
            }

            String name = "chunk_" + chunkX + "_" + chunkZ;
            TerrainQuad terrain = new TerrainQuad(name, CHUNK_SIZE, CHUNK_SIZE, heightData);

            Material mat = createTerrainMaterial(tiles);
            terrain.setMaterial(mat);

            float worldX = chunkX * (CHUNK_SIZE - 1);
            float worldZ = chunkZ * (CHUNK_SIZE - 1);
            terrain.setLocalTranslation(worldX, 0, worldZ);

            TerrainLodControl lodControl = new TerrainLodControl(terrain, cam);
            lodControl.setLodCalculator(new DistanceLodCalculator(CHUNK_SIZE, 2.7f));
            terrain.addControl(lodControl);

            terrainNode.attachChild(terrain);
            loadedChunks.put(new Vector2f(chunkX, chunkZ), terrain);

            // Erstelle Wasser-Overlay für diesen Chunk
            createWaterOverlay(chunkX, chunkZ, tiles, worldX, worldZ);

            // Erstelle Sprites für diesen Chunk basierend auf Distanz
            int distance = Math.max(Math.abs(chunkX - centerX), Math.abs(chunkZ - centerZ));
            if (distance <= SPRITE_FAR_DISTANCE) {
                boolean bigOnly = distance > SPRITE_NEAR_DISTANCE;
                createSpriteOverlay(chunkX, chunkZ, tiles, bigOnly);
                System.out.println("Sprites geladen für Chunk (" + chunkX + ", " + chunkZ + ") - Distanz: " + distance + ", bigOnly: " + bigOnly);
            } else {
                System.out.println("Keine Sprites für Chunk (" + chunkX + ", " + chunkZ + ") - Distanz: " + distance + " > " + SPRITE_FAR_DISTANCE);
            }

            System.out.println("Chunk geladen: " + name + " at (" + worldX + ", 0, " + worldZ + ")");

        } catch (Exception e) {
            System.err.println("FEHLER beim Laden von Chunk (" + chunkX + ", " + chunkZ + "): " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void createWaterOverlay(int chunkX, int chunkZ, TerrainTile[] tiles, float worldX, float worldZ) {
        // Prüfe ob überhaupt Wasser vorhanden ist
        boolean hasAnyWater = false;
        for (TerrainTile tile : tiles) {
            if (tile.hasWater()) {
                hasAnyWater = true;
                break;
            }
        }

        if (!hasAnyWater) {
            return; // Kein Wasser in diesem Chunk
        }

        // Erstelle Wasser-Mesh (Quad-Plane auf Wasserhöhe)
        // Wir erstellen eine einfache Plane die den ganzen Chunk abdeckt
        com.jme3.scene.shape.Quad waterQuad = new com.jme3.scene.shape.Quad(CHUNK_SIZE - 1, CHUNK_SIZE - 1);
        com.jme3.scene.Geometry waterGeom = new com.jme3.scene.Geometry("water_" + chunkX + "_" + chunkZ, waterQuad);

        // Wasser-Material mit animierten Wellen
        if (waterMat == null) {
            waterMat = new Material(assetManager, "MatDefs/Water.j3md");
            waterMat.setColor("Color", new ColorRGBA(0.2f, 0.4f, 0.8f, 0.5f)); // Halbtransparentes Blau
            waterMat.setFloat("WaveHeight", 0.3f);     // Höhe der Wellen
            waterMat.setFloat("WaveSpeed", 1.0f);      // Geschwindigkeit
            waterMat.setFloat("WaveFrequency", 0.05f); // Frequenz
            waterMat.getAdditionalRenderState().setBlendMode(com.jme3.material.RenderState.BlendMode.Alpha);
            waterMat.getAdditionalRenderState().setDepthWrite(false);
            waterMat.getAdditionalRenderState().setFaceCullMode(com.jme3.material.RenderState.FaceCullMode.Off);
        }
        waterGeom.setMaterial(waterMat);

        // Berechne durchschnittliche Wasserhöhe für diesen Chunk
        float avgWaterHeight = 0f;
        int waterCount = 0;
        for (TerrainTile tile : tiles) {
            if (tile.hasWater() && tile.getWater() != null) {
                avgWaterHeight += tile.getWater().getWaterHeight();
                waterCount++;
            }
        }
        avgWaterHeight = waterCount > 0 ? avgWaterHeight / waterCount : 10f;

        // Positioniere Wasser-Quad
        waterGeom.setLocalTranslation(worldX, avgWaterHeight, worldZ);
        waterGeom.rotate(-com.jme3.math.FastMath.HALF_PI, 0, 0); // Rotiere um horizontal zu liegen

        waterGeom.setQueueBucket(com.jme3.renderer.queue.RenderQueue.Bucket.Transparent);
        waterNode.attachChild(waterGeom);
        loadedWaterChunks.put(new Vector2f(chunkX, chunkZ), waterGeom);

        System.out.println("Wasser-Overlay erstellt für Chunk (" + chunkX + ", " + chunkZ + ") bei Höhe " + avgWaterHeight);
    }

    private Material createTerrainMaterial(TerrainTile[] tiles) {
        Material mat = new Material(assetManager, "Common/MatDefs/Terrain/TerrainLighting.j3md");

        // Lade Materialien vom TileProvider
        Map<String, TerrainMaterial> materials = tileProvider.getMaterials();

        // Erstelle MaterialMappings mit zugewiesenen Indizes
        Map<String, MaterialMapping> materialMappings = createMaterialMappings(materials);

        System.out.println("\n========== Material-Mapping für Chunk ==========");
        System.out.println("Anzahl Materialien verfügbar: " + materials.size());
        System.out.println("Anzahl Materialien geladen: " + materialMappings.size());

        // Lade DiffuseMaps in den Shader (mit Texture-Cache)
        for (MaterialMapping mapping : materialMappings.values()) {
            String texturePath = mapping.getMaterial().getTexturePath();
            Texture tex = textureCache.get(texturePath);

            if (tex == null) {
                tex = assetManager.loadTexture(texturePath);
                tex.setWrap(Texture.WrapMode.Repeat);
                tex.setName("DiffuseMap_" + mapping.getKey());
                textureCache.put(texturePath, tex);
                System.out.println("  Textur geladen und gecacht: " + texturePath);
            }

            mat.setTexture(mapping.getDiffuseMapParamName(), tex);
            mat.setFloat(mapping.getScaleParamName(), mapping.getMaterial().getTextureScale());

            System.out.println("  " + mapping.getDiffuseMapParamName() + " = " + mapping.getKey() +
                " (DiffuseIdx=" + mapping.getAssignedDiffuseMapIndex() +
                ", AlphaMap=" + mapping.getAlphaMapIndex() +
                ", Channel=" + mapping.getAlphaMapChannel() + ")");
        }

        // Erstelle AlphaMaps dynamisch basierend auf MaterialMappings
        Map<Integer, List<String>> alphaMapMaterials = new java.util.HashMap<>();
        for (MaterialMapping mapping : materialMappings.values()) {
            int alphaMapIdx = mapping.getAlphaMapIndex();
            if (alphaMapIdx >= 0) {
                alphaMapMaterials.computeIfAbsent(alphaMapIdx, k -> new java.util.ArrayList<>())
                        .add(mapping.getKey());
            }
        }

        // WICHTIG: AlphaMaps müssen sequenziell sein! Wenn AlphaMap_1 verwendet wird,
        // MUSS auch AlphaMap existieren (auch wenn leer)
        int maxAlphaMapIdx = alphaMapMaterials.keySet().stream().max(Integer::compareTo).orElse(-1);

        // Erstelle ALLE AlphaMaps von 0 bis maxAlphaMapIdx (auch leere)
        for (int alphaMapIdx = 0; alphaMapIdx <= maxAlphaMapIdx; alphaMapIdx++) {
            List<String> materialNames = alphaMapMaterials.get(alphaMapIdx);

            if (materialNames == null) {
                materialNames = new java.util.ArrayList<>();
                System.out.println("  Warnung: AlphaMap " + alphaMapIdx + " ist leer (aber wird trotzdem erstellt)");
            }

            String alphaMapName = materialNames.isEmpty() ?
                "AlphaMap_empty_" + alphaMapIdx :
                "AlphaMap_" + String.join("_", materialNames);

            Texture2D alphaTex = new Texture2D(createAlphaMapFromTiles(tiles, materialMappings, alphaMapIdx));
            alphaTex.setName(alphaMapName);

            // Shader erwartet feste Namen: AlphaMap, AlphaMap_1, AlphaMap_2, AlphaMap_3
            String alphaMapParam = (alphaMapIdx == 0) ? "AlphaMap" : "AlphaMap_" + alphaMapIdx;
            mat.setTexture(alphaMapParam, alphaTex);

            System.out.println("  " + alphaMapParam + " = [" + String.join(", ", materialNames) + "]");
        }

        System.out.println("========== Ende Material-Mapping ==========\n");
        return mat;
    }

    /**
     * Erstellt MaterialMappings mit zugewiesenen DiffuseMap-Indizes (mit Cache)
     */
    private Map<String, MaterialMapping> createMaterialMappings(Map<String, TerrainMaterial> materials) {
        // Prüfe ob MaterialMappings bereits gecacht sind
        if (materialMappingCache.isEmpty()) {
            Map<String, MaterialMapping> mappings = new java.util.LinkedHashMap<>();

            // Sortiere Materialien nach berechnetem DiffuseMap-Index
            String[] materialKeys = materials.keySet().toArray(new String[0]);
            java.util.Arrays.sort(materialKeys, (a, b) ->
                materials.get(a).calculateDiffuseMapIndex() - materials.get(b).calculateDiffuseMapIndex()
            );

            // Begrenze auf maximal 12 Materialien (TerrainLighting Maximum)
            // Aber realistisch: 4 Materialien (erste AlphaMap hat 3, zweite hat 1)
            int numMaterials = Math.min(12, materialKeys.length);

            for (int i = 0; i < numMaterials; i++) {
                String key = materialKeys[i];
                TerrainMaterial material = materials.get(key);

                if (material != null && material.needsDiffuseMap()) {
                    int assignedIndex = material.calculateDiffuseMapIndex();
                    MaterialMapping mapping = new MaterialMapping(material, assignedIndex);
                    mappings.put(key, mapping);
                }
            }

            materialMappingCache.putAll(mappings);
            System.out.println("  MaterialMappings erstellt und gecacht: " + mappings.size() + " Mappings");
        }

        return materialMappingCache;
    }

    /**
     * Erstellt eine AlphaMap für einen bestimmten Index basierend auf MaterialMappings
     */
    private Image createAlphaMapFromTiles(TerrainTile[] tiles, Map<String, MaterialMapping> materialMappings, int alphaMapIndex) {
        int alphaMapSize = CHUNK_SIZE;
        ByteBuffer alphaBuffer = BufferUtils.createByteBuffer(alphaMapSize * alphaMapSize * 3); // RGB

        int redCount = 0, greenCount = 0, blueCount = 0, blackCount = 0;

        for (TerrainTile tile : tiles) {
            String materialKey = tile.getMaterialKey();
            MaterialMapping mapping = materialMappings.get(materialKey);

            // Bestimme RGB-Werte basierend auf MaterialMapping
            float red = 0f;
            float green = 0f;
            float blue = 0f;

            if (mapping != null && mapping.getAlphaMapIndex() == alphaMapIndex) {
                int channel = mapping.getAlphaMapChannel();
                if (channel == 0) { red = 1f; redCount++; }       // R-Kanal
                else if (channel == 1) { green = 1f; greenCount++; } // G-Kanal
                else if (channel == 2) { blue = 1f; blueCount++; }  // B-Kanal
            } else {
                blackCount++;
            }

            alphaBuffer.put((byte) (red * 255));
            alphaBuffer.put((byte) (green * 255));
            alphaBuffer.put((byte) (blue * 255));
        }

        System.out.println("    AlphaMap " + alphaMapIndex + " Statistik: R=" + redCount + ", G=" + greenCount + ", B=" + blueCount + ", Black=" + blackCount);

        alphaBuffer.flip();
        return new Image(Image.Format.RGB8, alphaMapSize, alphaMapSize, alphaBuffer, (com.jme3.texture.image.ColorSpace) null);
    }

    private float smoothStep(float t) {
        t = Math.max(0f, Math.min(1f, t));
        return t * t * (3f - 2f * t);
    }

    private void updateCurrentTileMarker(Vector3f camPos) {
        // Berechne Tile-Position (ganzzahlig)
        int tileX = (int) Math.floor(camPos.x);
        int tileZ = (int) Math.floor(camPos.z);
        Vector2f currentTile = new Vector2f(tileX, tileZ);

        // Prüfe ob wir auf einer neuen Tile sind
        if (!currentTile.equals(lastMarkedTile)) {
            // Berechne Chunk-Position und lokale Tile-Position
            int chunkX = (int) Math.floor((float) tileX / (CHUNK_SIZE - 1));
            int chunkZ = (int) Math.floor((float) tileZ / (CHUNK_SIZE - 1));
            Vector2f chunkCoord = new Vector2f(chunkX, chunkZ);

            TerrainQuad terrain = loadedChunks.get(chunkCoord);
            if (terrain != null) {
                // Berechne lokale Koordinaten innerhalb des Chunks
                int localX = tileX - (chunkX * (CHUNK_SIZE - 1));
                int localZ = tileZ - (chunkZ * (CHUNK_SIZE - 1));

                // Erstelle einen roten Overlay für diese Tile
                createTileOverlay(terrain, localX, localZ, tileX, tileZ);
            }

            lastMarkedTile = currentTile;
        }
    }

    private void createTileOverlay(TerrainQuad terrain, int localX, int localZ, int worldX, int worldZ) {
        // Entferne alten Marker
        if (currentTileMarker != null && currentTileMarker.getParent() != null) {
            currentTileMarker.removeFromParent();
        }

        // Erstelle Quad für eine einzelne Tile (1x1 auf dem Terrain)
        com.jme3.scene.shape.Quad quad = new com.jme3.scene.shape.Quad(1f, 1f);
        currentTileMarker = new com.jme3.scene.Geometry("CurrentTileOverlay", quad);

        // Rotes halbtransparentes Material (gecacht)
        if (tileMarkerMat == null) {
            tileMarkerMat = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
            tileMarkerMat.setColor("Color", new ColorRGBA(1f, 0f, 0f, 0.6f));
            tileMarkerMat.getAdditionalRenderState().setBlendMode(com.jme3.material.RenderState.BlendMode.Alpha);
            tileMarkerMat.getAdditionalRenderState().setDepthWrite(false);
            tileMarkerMat.getAdditionalRenderState().setDepthTest(true);
            tileMarkerMat.getAdditionalRenderState().setPolyOffset(-1f, -1f); // Verhindert Z-Fighting
        }
        currentTileMarker.setMaterial(tileMarkerMat);

        // Positioniere Quad auf dem Terrain (leicht über der Oberfläche)
        float height = getTerrainHeightAt(worldX + 0.5f, worldZ + 0.5f);
        currentTileMarker.setLocalTranslation(worldX, height + 0.05f, worldZ);

        // Rotiere Quad um 90° damit es flach auf dem Boden liegt
        currentTileMarker.rotate(-com.jme3.math.FastMath.HALF_PI, 0, 0);

        currentTileMarker.setQueueBucket(com.jme3.renderer.queue.RenderQueue.Bucket.Transparent);
        rootNode.attachChild(currentTileMarker);
    }

    private void createSpriteOverlay(int chunkX, int chunkZ, TerrainTile[] tiles, boolean bigOnly) {
        List<Sprite> sprites = spriteProvider.getSprites(chunkX, chunkZ, CHUNK_SIZE, tiles);

        if (sprites.isEmpty()) {
            return;
        }

        List<com.jme3.scene.Geometry> spriteGeometries = new java.util.ArrayList<>();

        // Jeder Sprite rendert sich selbst
        for (Sprite sprite : sprites) {
//            if (!bigOnly || sprite.isBig()) {
                List<com.jme3.scene.Geometry> geoms = sprite.createGeometries(assetManager, spriteNode);
                spriteGeometries.addAll(geoms);
//            }
        }

        loadedSpriteChunks.put(new Vector2f(chunkX, chunkZ), spriteGeometries);
        System.out.println("Sprites erstellt für Chunk (" + chunkX + ", " + chunkZ + "): " + sprites.size() + " Sprites");
    }

    @Override
    public void cleanup() {
        if (currentTileMarker != null && currentTileMarker.getParent() != null) {
            currentTileMarker.removeFromParent();
        }
        if (terrainNode != null && terrainNode.getParent() != null) {
            terrainNode.removeFromParent();
        }
        if (waterNode != null && waterNode.getParent() != null) {
            waterNode.removeFromParent();
        }
        if (spriteNode != null && spriteNode.getParent() != null) {
            spriteNode.removeFromParent();
        }
    }
}
