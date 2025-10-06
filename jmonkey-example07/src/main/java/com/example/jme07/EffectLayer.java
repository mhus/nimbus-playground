package com.example.jme07;

import com.jme3.asset.AssetManager;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.math.FastMath;
import com.jme3.math.Vector3f;
import com.jme3.post.FilterPostProcessor;
import com.jme3.renderer.Camera;
import com.jme3.renderer.ViewPort;
import com.jme3.scene.Geometry;
import com.jme3.scene.Node;
import com.jme3.scene.shape.Quad;

/**
 * EffectLayer - Erzeugt visuelle Effekte wie Nebel
 * Verwendet Geometry-basierte Nebel-Ringe
 */
public class EffectLayer {

    private Node fogNode;
    private AssetManager assetManager;
    private Camera cam;

    // Fog Configuration
    private static final boolean USE_SMOOTH_FOG = true; // true = weicher Nebel-Verlauf, false = deutliche Boxen

    public EffectLayer(AssetManager assetManager, Node rootNode, Camera cam) {
        this.assetManager = assetManager;
        this.cam = cam;

        fogNode = new Node("FogNode");
        rootNode.attachChild(fogNode);

        createTestFog();

        System.out.println("EffectLayer initialisiert - Geometrie-basierter Nebel");
    }

    private void createTestFog() {
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
            Geometry fogGeom = new Geometry("FogRing_" + layer, ringMesh);

            Material fogMat = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
            // Basis-Farbe mit Vertex Colors multipliziert für Gradient-Effekt
            fogMat.setColor("Color", new ColorRGBA(0.85f, 0.9f, 0.95f, alpha));
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
        ColorRGBA[] colors = new ColorRGBA[vertexCount];
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
            float innerAlpha = 0.3f;
            colors[baseIndex + 0] = new ColorRGBA(1, 1, 1, innerAlpha);
            colors[baseIndex + 1] = new ColorRGBA(1, 1, 1, innerAlpha);

            // Außen (näher am outerRadius) - transparenter
            float outerAlpha = 0.1f;
            colors[baseIndex + 2] = new ColorRGBA(1, 1, 1, outerAlpha);
            colors[baseIndex + 3] = new ColorRGBA(1, 1, 1, outerAlpha);

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
            Geometry fogGeom = new Geometry("Fog_" + i, fogBox);

            Material fogMat = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
            fogMat.setColor("Color", new ColorRGBA(0.85f, 0.9f, 0.95f, 0.55f));
            fogMat.getAdditionalRenderState().setBlendMode(com.jme3.material.RenderState.BlendMode.Alpha);
            fogMat.getAdditionalRenderState().setDepthWrite(false);
            fogGeom.setMaterial(fogMat);

            fogGeom.setLocalTranslation(x, 0, z);
            fogGeom.setQueueBucket(com.jme3.renderer.queue.RenderQueue.Bucket.Transparent);

            fogNode.attachChild(fogGeom);
        }

        System.out.println("Einfacher Box-Nebel erstellt: " + segments + " Segmente bei Distanz " + fogDistance);
    }

    /**
     * Update - Nebel folgt der Kamera auf X/Z Ebene
     */
    public void update(float tpf) {
        // Nebel folgt der Kamera (nur X und Z)
        if (fogNode != null && cam != null) {
            Vector3f camPos = cam.getLocation();
            fogNode.setLocalTranslation(camPos.x, 0, camPos.z);
        }
    }

    /**
     * Cleanup
     */
    public void cleanup() {
        if (fogNode != null && fogNode.getParent() != null) {
            fogNode.removeFromParent();
        }
    }
}
