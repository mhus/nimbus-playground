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
 * EffectLayer - Erzeugt Nebel nur am Horizont (nicht über dem Himmel)
 * Verwendet Geometry-basierte Nebel-Ringe statt Post-Processing Filter
 */
public class EffectLayer {

    private Node fogNode;
    private ViewPort viewPort;
    private Camera cam;

    private static final float FOG_DISTANCE = 1000f;  // Distanz des Nebel-Rings
    private static final float FOG_HEIGHT = 50f;     // Höhe des Nebels
    private static final int FOG_SEGMENTS = 0;       // Anzahl der Segmente

    public EffectLayer(AssetManager assetManager, ViewPort viewPort) {
        this.viewPort = viewPort;
        // Kein Filter mehr - wir erstellen Geometrie
        System.out.println("EffectLayer initialisiert - Geometrie-basierter Horizont-Nebel");
    }

    /**
     * Initialisiert den Nebel mit Geometrie (wird von außen aufgerufen)
     */
    public void initFogGeometry(AssetManager assetManager, Node rootNode, Camera cam) {
        this.cam = cam;
        fogNode = new Node("FogNode");
        rootNode.attachChild(fogNode);

        createHorizonFog(assetManager);
    }

    private void createHorizonFog(AssetManager assetManager) {
        // Erstelle mehrere Ringe mit verschiedenen Höhen für dichteren Nebel
        float[] heightLevels = {-50f, 0f, 50f, 100f};
        float[] alphaLevels = {0.4f, 0.5f, 0.6f, 0.5f};

        for (int layer = 0; layer < heightLevels.length; layer++) {
            float angleStep = FastMath.TWO_PI / FOG_SEGMENTS;

            for (int i = 0; i < FOG_SEGMENTS; i++) {
                float angle = i * angleStep;
                float nextAngle = (i + 1) * angleStep;

                // Berechne Positionen für dieses Segment
                float x1 = FastMath.cos(angle) * FOG_DISTANCE;
                float z1 = FastMath.sin(angle) * FOG_DISTANCE;
                float x2 = FastMath.cos(nextAngle) * FOG_DISTANCE;
                float z2 = FastMath.sin(nextAngle) * FOG_DISTANCE;

                // Berechne Breite des Segments
                float width = FastMath.sqrt((x2 - x1) * (x2 - x1) + (z2 - z1) * (z2 - z1));

                // Erstelle Quad für Nebel-Segment
                Quad quad = new Quad(width, FOG_HEIGHT);
                Geometry geom = new Geometry("fog_layer" + layer + "_seg" + i, quad);

                // Material mit semi-transparenter Nebelfarbe
                Material mat = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
                ColorRGBA fogColor = new ColorRGBA(0.85f, 0.9f, 0.98f, alphaLevels[layer]);
                mat.setColor("Color", fogColor);
                mat.getAdditionalRenderState().setBlendMode(com.jme3.material.RenderState.BlendMode.Alpha);
                mat.getAdditionalRenderState().setDepthWrite(false);
                mat.getAdditionalRenderState().setDepthTest(false);

                geom.setMaterial(mat);

                // Positioniere und rotiere das Quad
                Vector3f center = new Vector3f((x1 + x2) / 2, heightLevels[layer], (z1 + z2) / 2);
                geom.setLocalTranslation(center);

                // Rotiere so dass es zur Mitte zeigt
                Vector3f direction = new Vector3f(center.x, 0, center.z).normalizeLocal();
                float rotation = FastMath.atan2(direction.x, direction.z);
                geom.rotate(0, rotation + FastMath.HALF_PI, 0);

                // Transparent bucket
                geom.setQueueBucket(com.jme3.renderer.queue.RenderQueue.Bucket.Transparent);
                geom.setCullHint(com.jme3.scene.Spatial.CullHint.Never);

                fogNode.attachChild(geom);
            }
        }

        System.out.println("Horizont-Nebel erstellt: " + heightLevels.length + " Schichten mit je " + FOG_SEGMENTS + " Segmenten");
        System.out.println("Nebel-Position: Distance=" + FOG_DISTANCE + ", Height=" + FOG_HEIGHT);
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
