package com.example.jme07;

import com.jme3.app.SimpleApplication;
import com.jme3.input.KeyInput;
import com.jme3.input.MouseInput;
import com.jme3.input.controls.ActionListener;
import com.jme3.input.controls.AnalogListener;
import com.jme3.input.controls.KeyTrigger;
import com.jme3.input.controls.MouseAxisTrigger;
import com.jme3.material.Material;
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

    // Layer System
    private SkyLayer skyLayer;
    private BackdropLayer backdropLayer;
    private EffectLayer effectLayer;

    // Fog Configuration
    private static final boolean USE_SMOOTH_FOG = true; // true = weicher Nebel-Verlauf, false = deutliche Boxen
    private Node fogNode;

    @Override
    public void simpleInitApp() {
        setDisplayFps(true);
        setDisplayStatView(true);

        terrainNode = new Node("TerrainNode");
        rootNode.attachChild(terrainNode);

        initTileProvider();
        initKeys();
        initLayers();

        // Kamera
        cam.setLocation(new Vector3f(64, 80, 64));
        cam.lookAt(new Vector3f(128, 0, 128), Vector3f.UNIT_Y);
        flyCam.setMoveSpeed(50f);

        System.out.println("\n=== ManualTerrainGridApp gestartet ===");
        System.out.println("Chunk-Größe: " + CHUNK_SIZE);
        System.out.println("Sichtweite: " + VIEW_DISTANCE + " Chunks");
        System.out.println("Modus: WALK MODE (Drücke 'F' zum Umschalten)");
    }

    private void initLayers() {
        // Layer-System: Sky -> Backdrop -> Fog
        // Reihenfolge wichtig für korrektes Rendering

        // 1. Sky Layer - Himmel im Hintergrund mit Sonnen-Glow
        skyLayer = new SkyLayer(assetManager, rootNode, cam, viewPort);

        // 2. Backdrop Layer - Ferne Berge/Landschaft
        backdropLayer = new BackdropLayer(assetManager, rootNode, cam);

        // 3. Effect Layer - Vorerst deaktiviert, da nicht sichtbar
        // effectLayer = new EffectLayer(assetManager, viewPort);

        // Stattdessen: Test mit einfacher sichtbarer Geometrie
        createTestFog();
    }

    private void initTileProvider() {
        tileProvider = new ProceduralTileProvider(12345L, 0.02f, 40f);
        System.out.println("TileProvider: " + tileProvider.getName());
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

    private void createTestFog() {
        fogNode = new Node("FogNode");
        rootNode.attachChild(fogNode);

        if (USE_SMOOTH_FOG) {
            createSmoothFog();
        } else {
            createSimpleBoxFog();
        }
    }

    private void createSmoothFog() {
        // Weicher Nebel-Verlauf mit mehreren Zylindern (Ringe)
        float[] innerRadii = {350f, 400f, 450f, 500f, 550f};
        float[] outerRadii = {400f, 450f, 500f, 550f, 600f};
        float[] fogAlphas = {0.2f, 0.3f, 0.4f, 0.35f, 0.25f};
        float fogHeight = 200f;

        int segments = 64; // Viele Segmente für glatten Ring

        for (int layer = 0; layer < innerRadii.length; layer++) {
            float innerRadius = innerRadii[layer];
            float outerRadius = outerRadii[layer];
            float alpha = fogAlphas[layer];

            // Erstelle Ring als Mesh aus Quads
            com.jme3.scene.Mesh ringMesh = createRingMesh(innerRadius, outerRadius, fogHeight, segments);
            com.jme3.scene.Geometry fogGeom = new com.jme3.scene.Geometry("FogRing_" + layer, ringMesh);

            com.jme3.material.Material fogMat = new com.jme3.material.Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
            // Basis-Farbe mit Vertex Colors multipliziert für Gradient-Effekt
            fogMat.setColor("Color", new com.jme3.math.ColorRGBA(0.85f, 0.9f, 0.95f, alpha));
            fogMat.setBoolean("VertexColor", true); // Aktiviere Vertex Colors für diffusen Gradient
            fogMat.getAdditionalRenderState().setBlendMode(com.jme3.material.RenderState.BlendMode.Alpha);
            fogMat.getAdditionalRenderState().setDepthWrite(false);
            fogMat.getAdditionalRenderState().setFaceCullMode(com.jme3.material.RenderState.FaceCullMode.Off);
            fogGeom.setMaterial(fogMat);

            fogGeom.setLocalTranslation(0, -50, 0);
            fogGeom.setQueueBucket(com.jme3.renderer.queue.RenderQueue.Bucket.Transparent);

            fogNode.attachChild(fogGeom);
        }

        System.out.println("Weicher Nebel erstellt: " + innerRadii.length + " Ring-Schichten");
    }

    private com.jme3.scene.Mesh createRingMesh(float innerRadius, float outerRadius, float height, int segments) {
        // Erstelle einen Ring (hohler Zylinder) als Mesh mit Vertex Colors für Gradient
        com.jme3.scene.Mesh mesh = new com.jme3.scene.Mesh();

        int vertexCount = segments * 4; // 4 Vertices pro Segment
        Vector3f[] vertices = new Vector3f[vertexCount];
        com.jme3.math.ColorRGBA[] colors = new com.jme3.math.ColorRGBA[vertexCount];
        int[] indices = new int[segments * 12];

        float angleStep = FastMath.TWO_PI / segments;

        for (int i = 0; i < segments; i++) {
            float angle = i * angleStep;

            float cosA = FastMath.cos(angle);
            float sinA = FastMath.sin(angle);

            int baseIndex = i * 4;

            // Vertices für dieses Segment
            vertices[baseIndex + 0] = new Vector3f(cosA * innerRadius, 0, sinA * innerRadius); // Innen unten
            vertices[baseIndex + 1] = new Vector3f(cosA * innerRadius, height, sinA * innerRadius); // Innen oben
            vertices[baseIndex + 2] = new Vector3f(cosA * outerRadius, 0, sinA * outerRadius); // Außen unten
            vertices[baseIndex + 3] = new Vector3f(cosA * outerRadius, height, sinA * outerRadius); // Außen oben

            // Vertex Colors für Gradient: Innen transparent, Mitte opak, Außen transparent
            float midRadius = (innerRadius + outerRadius) / 2f;
            float range = (outerRadius - innerRadius) / 2f;

            // Innen (näher am innerRadius) - transparenter
            float innerAlpha = 0.3f;
            colors[baseIndex + 0] = new com.jme3.math.ColorRGBA(1, 1, 1, innerAlpha);
            colors[baseIndex + 1] = new com.jme3.math.ColorRGBA(1, 1, 1, innerAlpha);

            // Außen (näher am outerRadius) - transparenter
            float outerAlpha = 0.1f;
            colors[baseIndex + 2] = new com.jme3.math.ColorRGBA(1, 1, 1, outerAlpha);
            colors[baseIndex + 3] = new com.jme3.math.ColorRGBA(1, 1, 1, outerAlpha);

            int nextBase = ((i + 1) % segments) * 4;
            int indexBase = i * 12;

            // Äußere Wand (2 Dreiecke)
            indices[indexBase + 0] = baseIndex + 2;
            indices[indexBase + 1] = baseIndex + 3;
            indices[indexBase + 2] = nextBase + 2;
            indices[indexBase + 3] = nextBase + 2;
            indices[indexBase + 4] = baseIndex + 3;
            indices[indexBase + 5] = nextBase + 3;

            // Innere Wand (2 Dreiecke)
            indices[indexBase + 6] = baseIndex + 0;
            indices[indexBase + 7] = nextBase + 0;
            indices[indexBase + 8] = baseIndex + 1;
            indices[indexBase + 9] = nextBase + 0;
            indices[indexBase + 10] = nextBase + 1;
            indices[indexBase + 11] = baseIndex + 1;
        }

        mesh.setBuffer(com.jme3.scene.VertexBuffer.Type.Position, 3, com.jme3.util.BufferUtils.createFloatBuffer(vertices));
        mesh.setBuffer(com.jme3.scene.VertexBuffer.Type.Color, 4, com.jme3.util.BufferUtils.createFloatBuffer(colors));
        mesh.setBuffer(com.jme3.scene.VertexBuffer.Type.Index, 3, com.jme3.util.BufferUtils.createIntBuffer(indices));
        mesh.updateBound();

        return mesh;
    }

    private void createSimpleBoxFog() {
        // Einfacher sichtbarer Nebel-Ring mit deutlichen Boxen
        float fogDistance = 450f;
        int segments = 32;
        float angleStep = FastMath.TWO_PI / segments;

        for (int i = 0; i < segments; i++) {
            float angle = i * angleStep;
            float x = FastMath.cos(angle) * fogDistance;
            float z = FastMath.sin(angle) * fogDistance;

            com.jme3.scene.shape.Box fogBox = new com.jme3.scene.shape.Box(100f, 150f, 100f);
            com.jme3.scene.Geometry fogGeom = new com.jme3.scene.Geometry("Fog_" + i, fogBox);

            com.jme3.material.Material fogMat = new com.jme3.material.Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
            fogMat.setColor("Color", new com.jme3.math.ColorRGBA(0.85f, 0.9f, 0.95f, 0.55f));
            fogMat.getAdditionalRenderState().setBlendMode(com.jme3.material.RenderState.BlendMode.Alpha);
            fogMat.getAdditionalRenderState().setDepthWrite(false);
            fogGeom.setMaterial(fogMat);

            fogGeom.setLocalTranslation(x, 0, z);
            fogGeom.setQueueBucket(com.jme3.renderer.queue.RenderQueue.Bucket.Transparent);

            fogNode.attachChild(fogGeom);
        }

        System.out.println("Einfacher Box-Nebel erstellt: " + segments + " Segmente bei Distanz " + fogDistance);
    }

    @Override
    public void simpleUpdate(float tpf) {
        // Update Layer System
        if (skyLayer != null) {
            skyLayer.update(tpf);
        }
        if (backdropLayer != null) {
            backdropLayer.update(tpf);
        }
        // Nebel folgt der Kamera
        if (fogNode != null) {
            Vector3f camPos = cam.getLocation();
            fogNode.setLocalTranslation(camPos.x, 0, camPos.z);
        }

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
