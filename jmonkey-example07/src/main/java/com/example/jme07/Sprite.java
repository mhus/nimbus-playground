package com.example.jme07;

import com.jme3.math.Vector3f;

/**
 * Sprite - Repräsentiert ein Billboard-Objekt in der Welt
 * (z.B. Baum, Gras, Stein)
 */
public class Sprite {

    private Vector3f position;     // Weltposition
    private SpriteType type;       // Typ des Sprites
    private float scale;           // Skalierung (1.0 = normal)
    private float rotation;        // Rotation um Y-Achse (in Radiant)

    public enum SpriteType {
        TREE_SMALL("Textures/Sprites/tree_small.png", 3f),
        TREE_LARGE("Textures/Sprites/tree_large.png", 5f),
        BUSH("Textures/Sprites/bush.png", 1f),
        GRASS("Textures/Sprites/grass.png", 0.5f),
        ROCK("Textures/Sprites/rock.png", 1.5f);

        private final String texturePath;
        private final float defaultHeight;

        SpriteType(String texturePath, float defaultHeight) {
            this.texturePath = texturePath;
            this.defaultHeight = defaultHeight;
        }

        public String getTexturePath() {
            return texturePath;
        }

        public float getDefaultHeight() {
            return defaultHeight;
        }
    }

    public Sprite(Vector3f position, SpriteType type) {
        this.position = position;
        this.type = type;
        this.scale = 1.0f;
        this.rotation = 0f;
    }

    public Sprite(Vector3f position, SpriteType type, float scale, float rotation) {
        this.position = position;
        this.type = type;
        this.scale = scale;
        this.rotation = rotation;
    }

    public Vector3f getPosition() {
        return position;
    }

    public void setPosition(Vector3f position) {
        this.position = position;
    }

    public SpriteType getType() {
        return type;
    }

    public void setType(SpriteType type) {
        this.type = type;
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

    @Override
    public String toString() {
        return "Sprite{" +
                "position=" + position +
                ", type=" + type +
                ", scale=" + scale +
                ", rotation=" + rotation +
                '}';
    }
}
