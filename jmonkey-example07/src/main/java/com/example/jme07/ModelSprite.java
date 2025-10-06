package com.example.jme07;

import com.jme3.asset.AssetManager;
import com.jme3.math.FastMath;
import com.jme3.math.Quaternion;
import com.jme3.math.Vector3f;
import com.jme3.scene.Geometry;
import com.jme3.scene.Node;
import com.jme3.scene.Spatial;

import java.util.ArrayList;
import java.util.List;

/**
 * ModelSprite - Ein Sprite der als 3D-Modell (.j3o) gerendert wird
 */
public class ModelSprite extends Sprite {

    private String modelPath;

    public ModelSprite(Vector3f position, String modelPath, float height, float rotation, boolean isBig) {
        super(position, height, rotation, isBig);
        this.modelPath = modelPath;
    }

    @Override
    public List<Geometry> createGeometries(AssetManager assetManager, Node parentNode) {
        List<Geometry> geometries = new ArrayList<>();

        try {
            // Lade 3D-Modell
            Spatial model = assetManager.loadModel(modelPath);

            if (model == null) {
                System.err.println("FEHLER: Modell nicht gefunden: " + modelPath);
                return geometries;
            }

            // Erstelle Node für dieses Modell
            Node modelNode = new Node("model_" + modelPath.hashCode());
            modelNode.attachChild(model);

            // Positioniere Modell
            modelNode.setLocalTranslation(position);

            // Skaliere Modell (scale enthält bereits die gewünschte Höhe)
            modelNode.setLocalScale(scale);

            // Rotiere Modell um Y-Achse
            Quaternion rot = new Quaternion();
            rot.fromAngleAxis(rotation, Vector3f.UNIT_Y);
            modelNode.setLocalRotation(rot);

            parentNode.attachChild(modelNode);

            // Sammle alle Geometries für Cleanup
            collectGeometries(modelNode, geometries);

        } catch (Exception e) {
            System.err.println("FEHLER beim Laden von Modell " + modelPath + ": " + e.getMessage());
        }

        return geometries;
    }

    /**
     * Sammelt rekursiv alle Geometries aus einem Node
     */
    private void collectGeometries(Spatial spatial, List<Geometry> geometries) {
        if (spatial instanceof Geometry) {
            geometries.add((Geometry) spatial);
        } else if (spatial instanceof Node) {
            Node node = (Node) spatial;
            for (Spatial child : node.getChildren()) {
                collectGeometries(child, geometries);
            }
        }
    }
}
