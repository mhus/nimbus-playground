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

import java.util.ArrayList;
import java.util.List;

/**
 * Manuelles dynamisches Terrain-Loading ohne TerrainGrid.
 * Wir verwalten die Chunks selbst basierend auf der Kamera-Position.
 */
public class ManualTerrainGridApp extends SimpleApplication {

    // Movement modes
    private boolean isWalkMode = true; // Default: Walk Mode
    private static final float GRAVITY = -30f;
    private float verticalVelocity = 0f;

    // Layer System - Liste aller Layer
    private List<Layer> layers = new ArrayList<>();
    private TerrainLayer terrainLayer; // Spezielle Referenz für Terrain-Kollision

    // Fog Configuration
    private static final boolean USE_SMOOTH_FOG = true; // true = weicher Nebel-Verlauf, false = deutliche Boxen
    private Node fogNode;

    @Override
    public void simpleInitApp() {
        setDisplayFps(true);
        setDisplayStatView(true);

        initKeys();
        initLayers();

        // Kamera
        cam.setLocation(new Vector3f(64, 80, 64));
        cam.lookAt(new Vector3f(128, 0, 128), Vector3f.UNIT_Y);
        flyCam.setMoveSpeed(50f);

        System.out.println("\n=== ManualTerrainGridApp gestartet ===");
        System.out.println("Modus: WALK MODE (Drücke 'F' zum Umschalten)");
    }

    private void initLayers() {
        // Layer-System: Terrain -> Sky -> Backdrop -> Fog
        // Reihenfolge wichtig für korrektes Rendering

        System.out.println("\n=== Initialisiere Layer-System ===");

        // 0. Terrain Layer - Dynamisches Terrain mit Chunk-Loading
        terrainLayer = new TerrainLayer(assetManager, rootNode, cam);
        layers.add(terrainLayer);

        // 1. Sky Layer - Himmel im Hintergrund mit Sonnen-Glow
        layers.add(new SkyLayer(assetManager, rootNode, cam, viewPort));

        // 2. Backdrop Layer - Ferne Berge/Landschaft
        layers.add(new BackdropLayer(assetManager, rootNode, cam));

        // 3. Fog - Nebel am Horizont (noch nicht als Layer-Klasse)
        createTestFog();

        System.out.println("=== " + layers.size() + " Layer initialisiert ===\n");
        for (Layer layer : layers) {
            System.out.println("  - " + layer.getName());
        }
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
        // Update alle Layer
        for (Layer layer : layers) {
            layer.update(tpf);
        }

        // Nebel folgt der Kamera (noch nicht als Layer)
        if (fogNode != null) {
            Vector3f camPos = cam.getLocation();
            fogNode.setLocalTranslation(camPos.x, 0, camPos.z);
        }

        // Walk-Modus Physik (wie in example04)
        Vector3f camPos = cam.getLocation();
        if (isWalkMode) {
            float terrainHeight = terrainLayer.getTerrainHeight(camPos.x, camPos.z);
            float groundHeight = terrainHeight + terrainLayer.getGroundOffset();

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
            float terrainHeight = terrainLayer.getTerrainHeight(camPos.x, camPos.z);
            float groundHeight = terrainHeight + terrainLayer.getGroundOffset();

            if (camPos.y < groundHeight) {
                camPos.y = groundHeight;
                cam.setLocation(camPos);
            }
        }
    }
}
