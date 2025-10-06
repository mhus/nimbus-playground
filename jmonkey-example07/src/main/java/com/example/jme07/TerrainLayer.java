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
    private Node terrainNode;
    private Map<Vector2f, TerrainQuad> loadedChunks = new HashMap<>();

    private static final int CHUNK_SIZE = 65;
    private static final int VIEW_DISTANCE = 12;
    private static final float GROUND_OFFSET = 2.0f;

    private Vector2f lastCameraChunk = new Vector2f(Float.MAX_VALUE, Float.MAX_VALUE);

    public TerrainLayer(AssetManager assetManager, Node rootNode, Camera cam) {
        super("TerrainLayer", assetManager, rootNode, cam);

        this.terrainNode = new Node("TerrainNode");
        rootNode.attachChild(terrainNode);

        initTileProvider();
        System.out.println("TerrainLayer initialisiert - Chunk-Größe: " + CHUNK_SIZE + ", Sichtweite: " + VIEW_DISTANCE);
    }

    private void initTileProvider() {
        // Basis-Provider: Prozedurales Terrain
        TileProvider baseProvider = new ProceduralTileProvider(12345L, 0.02f, 40f);

        // Wrap mit CrossRoadTileProvider für Straßen
        tileProvider = new CrossRoadTileProvider(baseProvider);

        System.out.println("TileProvider: " + tileProvider.getName());
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
    }

    public float getTerrainHeight(float x, float z) {
        // Berechne den Chunk, in dem sich die Position befindet
        int chunkX = (int) Math.floor(x / (CHUNK_SIZE - 1));
        int chunkZ = (int) Math.floor(z / (CHUNK_SIZE - 1));
        Vector2f chunkCoord = new Vector2f(chunkX, chunkZ);

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

        // Fallback: Berechne Höhe vom TileProvider
        try {
            float localX = x - (chunkX * (CHUNK_SIZE - 1));
            float localZ = z - (chunkZ * (CHUNK_SIZE - 1));

            float[] heightData = tileProvider.getHeightData(chunkX, chunkZ, CHUNK_SIZE);

            int ix = (int) Math.floor(localX);
            int iz = (int) Math.floor(localZ);

            if (ix >= 0 && ix < CHUNK_SIZE - 1 && iz >= 0 && iz < CHUNK_SIZE - 1) {
                float fx = localX - ix;
                float fz = localZ - iz;

                float h00 = heightData[iz * CHUNK_SIZE + ix];
                float h10 = heightData[iz * CHUNK_SIZE + (ix + 1)];
                float h01 = heightData[(iz + 1) * CHUNK_SIZE + ix];
                float h11 = heightData[(iz + 1) * CHUNK_SIZE + (ix + 1)];

                float h0 = h00 * (1 - fx) + h10 * fx;
                float h1 = h01 * (1 - fx) + h11 * fx;

                return h0 * (1 - fz) + h1 * fz;
            }
        } catch (Exception e) {
            // Bei Fehler: Standardhöhe zurückgeben
        }

        return 10f;
    }

    public float getGroundOffset() {
        return GROUND_OFFSET;
    }

    private void updateVisibleChunks(int centerX, int centerZ) {
        System.out.println("Aktualisiere sichtbare Chunks um (" + centerX + ", " + centerZ + ")");

        Map<Vector2f, Boolean> shouldBeLoaded = new HashMap<>();

        for (int x = centerX - VIEW_DISTANCE; x <= centerX + VIEW_DISTANCE; x++) {
            for (int z = centerZ - VIEW_DISTANCE; z <= centerZ + VIEW_DISTANCE; z++) {
                Vector2f chunkCoord = new Vector2f(x, z);
                shouldBeLoaded.put(chunkCoord, true);

                if (!loadedChunks.containsKey(chunkCoord)) {
                    loadChunk(x, z);
                }
            }
        }

        loadedChunks.entrySet().removeIf(entry -> {
            if (!shouldBeLoaded.containsKey(entry.getKey())) {
                System.out.println("Entlade Chunk: " + entry.getKey());
                terrainNode.detachChild(entry.getValue());
                return true;
            }
            return false;
        });

        System.out.println("Geladene Chunks: " + loadedChunks.size());
    }

    private void loadChunk(int chunkX, int chunkZ) {
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

            System.out.println("Chunk geladen: " + name + " at (" + worldX + ", 0, " + worldZ + ")");

        } catch (Exception e) {
            System.err.println("FEHLER beim Laden von Chunk (" + chunkX + ", " + chunkZ + "): " + e.getMessage());
            e.printStackTrace();
        }
    }

    private Material createTerrainMaterial(TerrainTile[] tiles) {
        Material mat = new Material(assetManager, "Common/MatDefs/Terrain/TerrainLighting.j3md");

        // Lade Texturen aus Material-Map
        Map<String, TerrainMaterial> materials = tileProvider.getMaterials();

        // Erstelle dynamisches Array aus verfügbaren Materialien (max 12: 4 AlphaMaps × 3 Kanäle)
        String[] materialKeys = materials.keySet().toArray(new String[0]);

        // Begrenze auf maximal 4 Materialien (TerrainLighting unterstützt max 4 DiffuseMaps)
        int numMaterials = Math.min(4, materialKeys.length);

        // Lade DiffuseMaps
        for (int i = 0; i < numMaterials; i++) {
            String key = materialKeys[i];
            TerrainMaterial terrainMat = materials.get(key);

            if (terrainMat != null) {
                Texture tex = assetManager.loadTexture(terrainMat.getTexturePath());
                tex.setWrap(Texture.WrapMode.Repeat);

                if (i == 0) {
                    mat.setTexture("DiffuseMap", tex);
                    mat.setFloat("DiffuseMap_0_scale", terrainMat.getTextureScale());
                } else {
                    mat.setTexture("DiffuseMap_" + i, tex);
                    mat.setFloat("DiffuseMap_" + i + "_scale", terrainMat.getTextureScale());
                }
            }
        }

        // Erstelle AlphaMaps dynamisch basierend auf Material-Definitionen
        // Bestimme welche AlphaMaps benötigt werden
        int maxAlphaMapIndex = -1;
        for (TerrainMaterial tm : materials.values()) {
            if (tm.getAlphaMapIndex() > maxAlphaMapIndex) {
                maxAlphaMapIndex = tm.getAlphaMapIndex();
            }
        }

        // Erstelle benötigte AlphaMaps
        for (int alphaMapIdx = 0; alphaMapIdx <= maxAlphaMapIndex; alphaMapIdx++) {
            Texture2D alphaTex = new Texture2D(createAlphaMapFromTiles(tiles, materials, alphaMapIdx));
            if (alphaMapIdx == 0) {
                mat.setTexture("AlphaMap", alphaTex);
            } else {
                mat.setTexture("AlphaMap_" + alphaMapIdx, alphaTex);
            }
        }

        return mat;
    }

    /**
     * Erstellt eine AlphaMap für einen bestimmten Index basierend auf Material-Definitionen
     */
    private Image createAlphaMapFromTiles(TerrainTile[] tiles, Map<String, TerrainMaterial> materials, int alphaMapIndex) {
        int alphaMapSize = CHUNK_SIZE;
        ByteBuffer alphaBuffer = BufferUtils.createByteBuffer(alphaMapSize * alphaMapSize * 3);

        for (TerrainTile tile : tiles) {
            String materialKey = tile.getMaterialKey();
            TerrainMaterial material = materials.get(materialKey);

            // Bestimme RGB-Werte basierend auf Material-Definition
            float red = 0f;
            float green = 0f;
            float blue = 0f;

            if (material != null && material.getAlphaMapIndex() == alphaMapIndex) {
                int channel = material.getAlphaMapChannel();
                if (channel == 0) red = 1f;       // R-Kanal
                else if (channel == 1) green = 1f; // G-Kanal
                else if (channel == 2) blue = 1f;  // B-Kanal
            }

            alphaBuffer.put((byte) (red * 255));
            alphaBuffer.put((byte) (green * 255));
            alphaBuffer.put((byte) (blue * 255));
        }

        alphaBuffer.flip();
        return new Image(Image.Format.RGB8, alphaMapSize, alphaMapSize, alphaBuffer, (com.jme3.texture.image.ColorSpace) null);
    }

    private float smoothStep(float t) {
        t = Math.max(0f, Math.min(1f, t));
        return t * t * (3f - 2f * t);
    }

    @Override
    public void cleanup() {
        if (terrainNode != null && terrainNode.getParent() != null) {
            terrainNode.removeFromParent();
        }
    }
}
