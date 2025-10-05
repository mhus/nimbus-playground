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

/**
 * BackdropLayer - Erzeugt eine ferne Landschafts-Kulisse am Horizont
 * Die Kulisse ist ein Ring von Quads, die immer der Kamera folgen
 */
public class BackdropLayer {

    private Node backdropNode;
    private Camera cam;
    private AssetManager assetManager;

    private static final float BACKDROP_DISTANCE = 600f;  // Distanz der Kulisse
    private static final float BACKDROP_HEIGHT = 300f;    // Höhe der Kulisse
    private static final int BACKDROP_SEGMENTS = 32;       // Anzahl der Segmente im Ring

    public BackdropLayer(AssetManager assetManager, Node rootNode, Camera cam) {
        this.assetManager = assetManager;
        this.cam = cam;
        this.backdropNode = new Node("BackdropNode");
        rootNode.attachChild(backdropNode);

        createBackdrop();
        System.out.println("BackdropLayer initialisiert - " + BACKDROP_SEGMENTS + " Segmente bei " + BACKDROP_DISTANCE + " Einheiten");
    }

    private void createBackdrop() {
        // Erstelle einen Ring von vertikalen Quads um die Szene
        float angleStep = FastMath.TWO_PI / BACKDROP_SEGMENTS;

        for (int i = 0; i < BACKDROP_SEGMENTS; i++) {
            float angle = i * angleStep;
            float nextAngle = (i + 1) * angleStep;

            // Berechne Positionen für dieses Segment
            float x1 = FastMath.cos(angle) * BACKDROP_DISTANCE;
            float z1 = FastMath.sin(angle) * BACKDROP_DISTANCE;
            float x2 = FastMath.cos(nextAngle) * BACKDROP_DISTANCE;
            float z2 = FastMath.sin(nextAngle) * BACKDROP_DISTANCE;

            // Berechne Breite des Segments
            float width = FastMath.sqrt((x2 - x1) * (x2 - x1) + (z2 - z1) * (z2 - z1));

            // Erstelle Quad für dieses Segment
            Quad quad = new Quad(width, BACKDROP_HEIGHT);
            Geometry geom = new Geometry("backdrop_" + i, quad);

            // Material mit Bergsilhouetten-Farbe - dunkler für bessere Sichtbarkeit
            Material mat = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");

            // Farbe variiert leicht für jeden Abschnitt (verschiedene "Berg"-Höhen)
            float heightVariation = FastMath.nextRandomFloat() * 0.4f;
            ColorRGBA color = new ColorRGBA(
                0.2f + heightVariation * 0.15f,
                0.25f + heightVariation * 0.15f,
                0.4f + heightVariation * 0.2f,
                1.0f  // Vollständig opak für bessere Sichtbarkeit
            );
            mat.setColor("Color", color);

            geom.setMaterial(mat);

            // Positioniere und rotiere das Quad
            Vector3f center = new Vector3f((x1 + x2) / 2, 0, (z1 + z2) / 2);
            geom.setLocalTranslation(center);

            // Rotiere so dass es zur Mitte zeigt
            Vector3f direction = center.normalize();
            float rotation = FastMath.atan2(direction.x, direction.z);
            geom.rotate(0, rotation + FastMath.HALF_PI, 0);

            // Verschiebe nach oben, damit es am Horizont sitzt
            geom.move(0, -20 + heightVariation * 100, 0);

            backdropNode.attachChild(geom);
        }

        // Setze Queue Bucket für richtige Render-Reihenfolge (nach Sky, vor Transparent)
        backdropNode.setQueueBucket(com.jme3.renderer.queue.RenderQueue.Bucket.Transparent);
    }

    /**
     * Update - folgt der Kamera auf X/Z Ebene
     */
    public void update(float tpf) {
        // Kulisse folgt der Kamera (nur X und Z)
        Vector3f camPos = cam.getLocation();
        backdropNode.setLocalTranslation(camPos.x, 0, camPos.z);
    }

    /**
     * Cleanup
     */
    public void cleanup() {
        if (backdropNode != null && backdropNode.getParent() != null) {
            backdropNode.removeFromParent();
        }
    }
}
