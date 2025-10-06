package com.example.jme07;

import com.jme3.app.SimpleApplication;
import com.jme3.asset.AssetManager;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.math.FastMath;
import com.jme3.math.Vector3f;
import com.jme3.renderer.Camera;
import com.jme3.scene.Geometry;
import com.jme3.scene.Node;
import com.jme3.scene.shape.Quad;
import com.jme3.texture.Texture;

/**
 * BackdropLayer - Erzeugt eine ferne Landschafts-Kulisse am Horizont
 * Die Kulisse ist ein Ring von Quads, die immer der Kamera folgen
 */
public class BackdropLayer extends Layer {

    private Node backdropNode;

    private static final float BACKDROP_DISTANCE = 800f;  // Distanz der Kulisse (weiter weg als Nebel)
    private static final float BACKDROP_HEIGHT = 400f;    // Höhe der Kulisse
    private static final int BACKDROP_SEGMENTS = 32;       // Anzahl der Segmente im Ring

    public BackdropLayer(AssetManager assetManager, Node rootNode, Camera cam) {
        super("BackdropLayer", assetManager, rootNode, cam);
        this.backdropNode = new Node("BackdropNode");
        rootNode.attachChild(backdropNode);

        createBackdrop();
        System.out.println("BackdropLayer initialisiert - " + BACKDROP_SEGMENTS + " Segmente bei " + BACKDROP_DISTANCE + " Einheiten");
    }

    private void createBackdrop() {
        // Erstelle Berg-Silhouetten mit unregelmäßigen Höhen
        float angleStep = FastMath.TWO_PI / BACKDROP_SEGMENTS;

        for (int i = 0; i < BACKDROP_SEGMENTS; i++) {
            float angle = i * angleStep;
            float x = FastMath.cos(angle) * BACKDROP_DISTANCE;
            float z = FastMath.sin(angle) * BACKDROP_DISTANCE;

            // Variierende Höhe für unterschiedliche "Berge" - unregelmäßiger
            float heightVariation = FastMath.nextRandomFloat();
            // Perlin-ähnliche Variation für natürlichere Höhen
            float neighborVariation = (i > 0) ? (i % 3) * 0.3f : 0;
            float peakHeight = 150f + heightVariation * 250f + neighborVariation * 80f; // 150-480 Einheiten

            // Variierende Breite und Tiefe für natürlichere Formen
            float widthVariation = 0.7f + FastMath.nextRandomFloat() * 0.6f; // 0.7-1.3
            float depthVariation = 0.7f + FastMath.nextRandomFloat() * 0.6f; // 0.7-1.3

            float boxWidth = 120f * widthVariation;
            float boxDepth = 120f * depthVariation;

            // Erstelle Box als Berg mit variabler Größe
            com.jme3.scene.shape.Box box = new com.jme3.scene.shape.Box(boxWidth, peakHeight, boxDepth);
            Geometry geom = new Geometry("backdrop_" + i, box);

            // Material - Berg-Farbe mit Höhenvariation
            Material mat = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");

            // Farbe variiert mit Höhe - höhere Berge sind etwas heller (Schnee-Effekt)
            float heightFactor = heightVariation; // 0-1
            float r = 0.20f + heightFactor * 0.15f; // 0.20-0.35
            float g = 0.22f + heightFactor * 0.15f; // 0.22-0.37
            float b = 0.30f + heightFactor * 0.20f; // 0.30-0.50

            ColorRGBA color = new ColorRGBA(r, g, b, 1.0f);
            mat.setColor("Color", color);

            geom.setMaterial(mat);

            // Positioniere die Box
            // Y-Position: am "Boden" aber mit Höhenvariation für natürliches Aussehen
            float yPos = -60f + heightVariation * 30f;
            geom.setLocalTranslation(x, yPos, z);

            // Kleine zufällige Rotation für mehr Variation
            float rotVariation = (FastMath.nextRandomFloat() - 0.5f) * 0.3f; // -0.15 bis +0.15 rad
            geom.rotate(0, rotVariation, 0);

            // Opaque Bucket für normale Sichtbarkeit
            geom.setQueueBucket(com.jme3.renderer.queue.RenderQueue.Bucket.Opaque);
            geom.setCullHint(com.jme3.scene.Spatial.CullHint.Never);

            backdropNode.attachChild(geom);
        }

        System.out.println("BackdropLayer erstellt: " + BACKDROP_SEGMENTS + " Berg-Silhouetten bei Distanz " + BACKDROP_DISTANCE);
    }

    @Override
    public void update(float tpf) {
        // Kulisse folgt der Kamera (nur X und Z)
        Vector3f camPos = cam.getLocation();
        backdropNode.setLocalTranslation(camPos.x, 0, camPos.z);
    }

    @Override
    public void cleanup() {
        if (backdropNode != null && backdropNode.getParent() != null) {
            backdropNode.removeFromParent();
        }
    }
}
