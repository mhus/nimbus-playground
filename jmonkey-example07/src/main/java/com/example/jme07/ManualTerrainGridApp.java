package com.example.jme07;

import com.jme3.app.SimpleApplication;
import com.jme3.input.KeyInput;
import com.jme3.input.MouseInput;
import com.jme3.input.controls.ActionListener;
import com.jme3.input.controls.AnalogListener;
import com.jme3.input.controls.KeyTrigger;
import com.jme3.input.controls.MouseAxisTrigger;
import com.jme3.light.AmbientLight;
import com.jme3.light.DirectionalLight;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.math.FastMath;
import com.jme3.math.Quaternion;
import com.jme3.math.Vector2f;
import com.jme3.math.Vector3f;
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
    private static final int VIEW_DISTANCE = 12; // Chunks in jede Richtung (erhöht für größere Sichtweite)

    private Vector2f lastCameraChunk = new Vector2f(Float.MAX_VALUE, Float.MAX_VALUE);

    // Movement modes
    private boolean isWalkMode = true; // Default: Walk Mode
    private static final float GRAVITY = -30f;
    private float verticalVelocity = 0f;
    private static final float GROUND_OFFSET = 2.0f; // Höhe über dem Terrain

    @Override
    public void simpleInitApp() {
        setDisplayFps(true);
        setDisplayStatView(true);

        viewPort.setBackgroundColor(new ColorRGBA(0.5f, 0.7f, 1.0f, 1.0f));

        terrainNode = new Node("TerrainNode");
        rootNode.attachChild(terrainNode);

        initTileProvider();
        initLighting();
        initKeys();

        // Kamera
        cam.setLocation(new Vector3f(64, 80, 64));
        cam.lookAt(new Vector3f(128, 0, 128), Vector3f.UNIT_Y);
        flyCam.setMoveSpeed(50f);

        System.out.println("\n=== ManualTerrainGridApp gestartet ===");
        System.out.println("Chunk-Größe: " + CHUNK_SIZE);
        System.out.println("Sichtweite: " + VIEW_DISTANCE + " Chunks");
        System.out.println("Modus: WALK MODE (Drücke 'F' zum Umschalten)");
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

    private void initKeys() {
        // Toggle zwischen Walk und Flight Mode mit 'F'
        inputManager.addMapping("ToggleMode", new KeyTrigger(KeyInput.KEY_F));
        inputManager.addListener(actionListener, "ToggleMode");
    }

    private final ActionListener actionListener = new ActionListener() {
        @Override
        public void onAction(String name, boolean isPressed, float tpf) {
            if (name.equals("ToggleMode") && isPressed) {
                isWalkMode = !isWalkMode;
                String mode = isWalkMode ? "WALK MODE" : "FLIGHT MODE";
                System.out.println("Modus gewechselt zu: " + mode);

                if (!isWalkMode) {
                    // Im Flight Mode: Vertikale Geschwindigkeit zurücksetzen
                    verticalVelocity = 0f;
                }
            }
        }
    };

    @Override
    public void simpleUpdate(float tpf) {
        // Chunk-Management zuerst
        Vector3f camPos = cam.getLocation();
        int chunkX = (int) Math.floor(camPos.x / (CHUNK_SIZE - 1));
        int chunkZ = (int) Math.floor(camPos.z / (CHUNK_SIZE - 1));
        Vector2f currentChunk = new Vector2f(chunkX, chunkZ);

        if (!currentChunk.equals(lastCameraChunk)) {
            System.out.println("Kamera-Chunk gewechselt: (" + chunkX + ", " + chunkZ + ")");
            updateVisibleChunks(chunkX, chunkZ);
            lastCameraChunk = currentChunk;
        }

        // Walk-Modus Physik (wie in example04)
        if (isWalkMode) {
            camPos = cam.getLocation();
            float terrainHeight = getTerrainHeight(camPos.x, camPos.z);
            float groundHeight = terrainHeight + GROUND_OFFSET;

            // Anwenden der Gravitation wenn über dem Boden
            if (camPos.y > groundHeight) {
                verticalVelocity += GRAVITY * tpf;
            } else {
                // Kamera ist am Boden
                camPos.y = groundHeight;
                verticalVelocity = 0;
            }

            // Anwenden der vertikalen Bewegung
            if (camPos.y > groundHeight) {
                camPos.y += verticalVelocity * tpf;
                if (camPos.y <= groundHeight) {
                    camPos.y = groundHeight;
                    verticalVelocity = 0;
                }
            }

            cam.setLocation(camPos);
        } else {
            // Im Flight Mode: Stelle sicher, dass wir nicht unter dem Terrain sind
            camPos = cam.getLocation();
            float terrainHeight = getTerrainHeight(camPos.x, camPos.z);
            float groundHeight = terrainHeight + GROUND_OFFSET;

            if (camPos.y < groundHeight) {
                camPos.y = groundHeight;
                cam.setLocation(camPos);
            }
        }
    }

    private Material createTerrainMaterial(float[] heightData) {
        // TerrainLighting Material mit Texture Splatting basierend auf absoluten Höhen
        Material mat = new Material(assetManager, "Common/MatDefs/Terrain/TerrainLighting.j3md");

        // Lade und konfiguriere Texturen mit GROSSER Wiederholung (wie ursprüngliches Gras)
        Texture grass = assetManager.loadTexture("Textures/Terrain/splat/grass.jpg");
        grass.setWrap(Texture.WrapMode.Repeat);

        Texture dirt = assetManager.loadTexture("Textures/Terrain/splat/dirt.jpg");
        dirt.setWrap(Texture.WrapMode.Repeat);

        Texture rock = assetManager.loadTexture("Textures/Terrain/splat/road.jpg");
        rock.setWrap(Texture.WrapMode.Repeat);

        // WICHTIG: Texture Scale bestimmt wie oft die Textur wiederholt wird
        // KLEINE Werte = Textur ist über VIELE Einheiten gespannt (weniger kachelig)
        mat.setFloat("DiffuseMap_0_scale", 1f);  // Sand - über ganze Chunks gespannt
        mat.setFloat("DiffuseMap_1_scale", 1f);  // Gras - über ganze Chunks gespannt
        mat.setFloat("DiffuseMap_2_scale", 1f);  // Stein - über ganze Chunks gespannt

        mat.setTexture("DiffuseMap", dirt);     // Texture 0: Sand/Dirt (rot im Alpha)
        mat.setTexture("DiffuseMap_1", grass);  // Texture 1: Gras (grün im Alpha)
        mat.setTexture("DiffuseMap_2", rock);   // Texture 2: Stein (blau im Alpha)

        // Alpha Map basierend auf ABSOLUTEN Höhenwerten erstellen
        Texture2D alphaMap = new Texture2D(createAlphaMapAbsolute(heightData));
        mat.setTexture("AlphaMap", alphaMap);

        return mat;
    }

    private Image createAlphaMapAbsolute(float[] heightData) {
        // Alpha-Map mit ABSOLUTEN Höhenwerten - alle Chunks verwenden die gleichen Grenzen
        int alphaMapSize = CHUNK_SIZE;
        ByteBuffer alphaBuffer = BufferUtils.createByteBuffer(alphaMapSize * alphaMapSize * 3);

        // FESTE, absolute Höhengrenzen für die gesamte Welt
        final float SAND_HEIGHT = 8f;      // Bis 8 Einheiten: Sand
        final float GRASS_HEIGHT = 25f;    // 8-25 Einheiten: Gras
        // Über 25: Stein

        final float BLEND_DISTANCE = 10f;  // Große Übergangszone

        for (int i = 0; i < heightData.length; i++) {
            float height = heightData[i];

            float sandAmount = 0f;
            float grassAmount = 0f;
            float rockAmount = 0f;

            // Berechne Texturmischung mit weichen Übergängen
            if (height <= SAND_HEIGHT - BLEND_DISTANCE/2) {
                sandAmount = 1f;
            } else if (height < SAND_HEIGHT + BLEND_DISTANCE/2) {
                // Übergang Sand -> Gras
                float t = (height - (SAND_HEIGHT - BLEND_DISTANCE/2)) / BLEND_DISTANCE;
                t = smoothStep(t);
                sandAmount = 1f - t;
                grassAmount = t;
            } else if (height < GRASS_HEIGHT - BLEND_DISTANCE/2) {
                grassAmount = 1f;
            } else if (height < GRASS_HEIGHT + BLEND_DISTANCE/2) {
                // Übergang Gras -> Stein
                float t = (height - (GRASS_HEIGHT - BLEND_DISTANCE/2)) / BLEND_DISTANCE;
                t = smoothStep(t);
                grassAmount = 1f - t;
                rockAmount = t;
            } else {
                rockAmount = 1f;
            }

            byte red = (byte) (sandAmount * 255);
            byte green = (byte) (grassAmount * 255);
            byte blue = (byte) (rockAmount * 255);

            alphaBuffer.put(red).put(green).put(blue);
        }

        alphaBuffer.flip();
        return new Image(Image.Format.RGB8, alphaMapSize, alphaMapSize, alphaBuffer, (com.jme3.texture.image.ColorSpace) null);
    }

    private float smoothStep(float t) {
        // Smoothstep für weichere Übergänge
        t = Math.max(0f, Math.min(1f, t)); // Clamp to 0-1
        return t * t * (3f - 2f * t);
    }

    private float getTerrainHeight(float x, float z) {
        // Berechne den Chunk, in dem sich die Position befindet
        int chunkX = (int) Math.floor(x / (CHUNK_SIZE - 1));
        int chunkZ = (int) Math.floor(z / (CHUNK_SIZE - 1));
        Vector2f chunkCoord = new Vector2f(chunkX, chunkZ);

        TerrainQuad terrain = loadedChunks.get(chunkCoord);
        if (terrain != null) {
            try {
                // TerrainQuad.getHeight() erwartet Weltkoordinaten
                float height = terrain.getHeight(new Vector2f(x, z));
                // Prüfe ob gültiger Wert zurückgegeben wurde
                if (!Float.isNaN(height) && !Float.isInfinite(height)) {
                    return height;
                }
            } catch (Exception e) {
                // Fehler beim Abrufen der Höhe, nutze Fallback
            }
        }

        // Fallback: Berechne Höhe vom TileProvider
        try {
            // Lokale Position im Chunk
            float localX = x - (chunkX * (CHUNK_SIZE - 1));
            float localZ = z - (chunkZ * (CHUNK_SIZE - 1));

            // Hole Höhendaten für diesen Chunk
            float[] heightData = tileProvider.getHeightData(chunkX, chunkZ, CHUNK_SIZE);

            // Interpoliere die Höhe
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

        return 10f; // Fallback - höhere Höhe als Sicherheitsnetz
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

            // Material mit Texture Splatting für verschiedene Höhenstufen
            Material mat = createTerrainMaterial(heightData);
            terrain.setMaterial(mat);

            // Positioniere den Chunk in der Welt
            float worldX = chunkX * (CHUNK_SIZE - 1);
            float worldZ = chunkZ * (CHUNK_SIZE - 1);
            terrain.setLocalTranslation(worldX, 0, worldZ);

            // LOD (Level of Detail) für bessere Performance
            // Entfernte Chunks werden mit weniger Detail gerendert
            TerrainLodControl lodControl = new TerrainLodControl(terrain, cam);
            lodControl.setLodCalculator(new DistanceLodCalculator(CHUNK_SIZE, 2.7f));
            terrain.addControl(lodControl);

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
