package com.example.jme07;

import com.jme3.asset.AssetManager;
import com.jme3.math.Vector3f;
import com.jme3.scene.Node;
import java.util.List;

/**
 * Sprite - Abstrakte Basisklasse für Sprites in der Welt
 * Jeder Sprite ist selbst verantwortlich für sein Rendering
 */
public abstract class Sprite {

    protected Vector3f position;     // Weltposition
    protected float scale;           // Skalierung (1.0 = normal)
    protected float rotation;        // Rotation um Y-Achse (in Radiant)
    protected boolean isBig;         // true = wird auch in Far-LOD angezeigt

    public Sprite(Vector3f position, float scale, float rotation, boolean isBig) {
        this.position = position;
        this.scale = scale;
        this.rotation = rotation;
        this.isBig = isBig;
    }

    /**
     * Erstellt die Geometries für diesen Sprite und fügt sie dem Node hinzu
     * @param assetManager AssetManager für Texturen/Materialien
     * @param parentNode Node zu dem die Geometries hinzugefügt werden
     * @return Liste der erstellten Geometries (für Cleanup)
     */
    public abstract List<com.jme3.scene.Geometry> createGeometries(AssetManager assetManager, Node parentNode);

    public Vector3f getPosition() {
        return position;
    }

    public void setPosition(Vector3f position) {
        this.position = position;
    }

    public float getScale() {
        return scale;
    }

    public void setScale(float scale) {
        this.scale = scale;
    }

    public float getRotation() {
        return rotation;
    }

    public void setRotation(float rotation) {
        this.rotation = rotation;
    }

    public boolean isBig() {
        return isBig;
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + "{" +
                "position=" + position +
                ", scale=" + scale +
                ", rotation=" + rotation +
                ", isBig=" + isBig +
                '}';
    }
}
