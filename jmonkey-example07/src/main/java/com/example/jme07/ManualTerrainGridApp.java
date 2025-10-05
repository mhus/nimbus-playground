package com.example.jme07;

import com.jme3.app.SimpleApplication;
import com.jme3.light.AmbientLight;
import com.jme3.light.DirectionalLight;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.math.Vector2f;
import com.jme3.math.Vector3f;
import com.jme3.scene.Node;
import com.jme3.terrain.geomipmap.TerrainQuad;
import com.jme3.texture.Texture;

import java.util.HashMap;
import java.util.Map;

/**
 * Manuelles dynamisches Terrain-Loading ohne TerrainGrid.
 * Wir verwalten die Chunks selbst basierend auf der Kamera-Position.
 */
public class ManualTerrainGridApp extends SimpleApplication {

    private TileProvider tileProvider;
    private Node terrainNode;
    private Map<Vector2f, TerrainQuad> loadedChunks = new HashMap<>();

    private static final int CHUNK_SIZE = 65;
    private static final int VIEW_DISTANCE = 3; // Chunks in jede Richtung

    private Vector2f lastCameraChunk = new Vector2f(Float.MAX_VALUE, Float.MAX_VALUE);

    @Override
    public void simpleInitApp() {
        setDisplayFps(true);
        setDisplayStatView(true);

        viewPort.setBackgroundColor(new ColorRGBA(0.5f, 0.7f, 1.0f, 1.0f));

        terrainNode = new Node("TerrainNode");
        rootNode.attachChild(terrainNode);

        initTileProvider();
        initLighting();

        // Kamera
        cam.setLocation(new Vector3f(64, 80, 64));
        cam.lookAt(new Vector3f(128, 0, 128), Vector3f.UNIT_Y);
        flyCam.setMoveSpeed(50f);

        System.out.println("\n=== ManualTerrainGridApp gestartet ===");
        System.out.println("Chunk-Größe: " + CHUNK_SIZE);
        System.out.println("Sichtweite: " + VIEW_DISTANCE + " Chunks");
    }

    private void initTileProvider() {
        tileProvider = new ProceduralTileProvider(12345L, 0.02f, 40f);
        System.out.println("TileProvider: " + tileProvider.getName());
    }

    private void initLighting() {
        AmbientLight ambient = new AmbientLight();
        ambient.setColor(ColorRGBA.White.mult(0.5f));
        rootNode.addLight(ambient);

        DirectionalLight sun = new DirectionalLight();
        sun.setDirection(new Vector3f(-0.5f, -0.7f, -0.3f).normalizeLocal());
        sun.setColor(ColorRGBA.White.mult(1.5f));
        rootNode.addLight(sun);
    }

    @Override
    public void simpleUpdate(float tpf) {
        // Berechne aktuellen Chunk der Kamera
        Vector3f camPos = cam.getLocation();
        int chunkX = (int) Math.floor(camPos.x / (CHUNK_SIZE - 1));
        int chunkZ = (int) Math.floor(camPos.z / (CHUNK_SIZE - 1));
        Vector2f currentChunk = new Vector2f(chunkX, chunkZ);

        // Prüfe ob wir einen neuen Chunk betreten haben
        if (!currentChunk.equals(lastCameraChunk)) {
            System.out.println("Kamera-Chunk gewechselt: (" + chunkX + ", " + chunkZ + ")");
            updateVisibleChunks(chunkX, chunkZ);
            lastCameraChunk = currentChunk;
        }
    }

    private void updateVisibleChunks(int centerX, int centerZ) {
        System.out.println("Aktualisiere sichtbare Chunks um (" + centerX + ", " + centerZ + ")");

        // Sammle alle Chunks die geladen sein sollten
        Map<Vector2f, Boolean> shouldBeLoaded = new HashMap<>();

        for (int x = centerX - VIEW_DISTANCE; x <= centerX + VIEW_DISTANCE; x++) {
            for (int z = centerZ - VIEW_DISTANCE; z <= centerZ + VIEW_DISTANCE; z++) {
                Vector2f chunkCoord = new Vector2f(x, z);
                shouldBeLoaded.put(chunkCoord, true);

                // Lade Chunk wenn nicht vorhanden
                if (!loadedChunks.containsKey(chunkCoord)) {
                    loadChunk(x, z);
                }
            }
        }

        // Entlade Chunks die zu weit weg sind
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
            // Hole Höhendaten
            float[] heightData = tileProvider.getHeightData(chunkX, chunkZ, CHUNK_SIZE);

            // Erstelle TerrainQuad
            String name = "chunk_" + chunkX + "_" + chunkZ;
            TerrainQuad terrain = new TerrainQuad(name, CHUNK_SIZE, CHUNK_SIZE, heightData);

            // Material
            Material mat = new Material(assetManager, "Common/MatDefs/Light/Lighting.j3md");

            try {
                Texture grass = assetManager.loadTexture("Textures/Terrain/splat/grass.jpg");
                grass.setWrap(Texture.WrapMode.Repeat);
                mat.setTexture("DiffuseMap", grass);
                mat.setFloat("Shininess", 1f);
            } catch (Exception e) {
                mat.setColor("Diffuse", new ColorRGBA(0.3f, 0.7f, 0.3f, 1.0f));
                mat.setColor("Ambient", new ColorRGBA(0.2f, 0.5f, 0.2f, 1.0f));
            }

            terrain.setMaterial(mat);

            // Positioniere den Chunk in der Welt
            float worldX = chunkX * (CHUNK_SIZE - 1);
            float worldZ = chunkZ * (CHUNK_SIZE - 1);
            terrain.setLocalTranslation(worldX, 0, worldZ);

            // Füge zur Szene hinzu
            terrainNode.attachChild(terrain);
            loadedChunks.put(new Vector2f(chunkX, chunkZ), terrain);

            System.out.println("Chunk geladen: " + name + " at (" + worldX + ", 0, " + worldZ + ")");

        } catch (Exception e) {
            System.err.println("FEHLER beim Laden von Chunk (" + chunkX + ", " + chunkZ + "): " + e.getMessage());
            e.printStackTrace();
        }
    }
}
