package com.example.jme07;

/**
 * TerrainMaterial - Definiert ein Material für das Terrain
 * mit Textur-Pfad und Eigenschaften
 */
public class TerrainMaterial {

    private String key;
    private String name;
    private String texturePath;
    private float textureScale;

    public TerrainMaterial(String key, String name, String texturePath, float textureScale) {
        this.key = key;
        this.name = name;
        this.texturePath = texturePath;
        this.textureScale = textureScale;
    }

    public String getKey() {
        return key;
    }

    public String getName() {
        return name;
    }

    public String getTexturePath() {
        return texturePath;
    }

    public float getTextureScale() {
        return textureScale;
    }

    @Override
    public String toString() {
        return "TerrainMaterial{" +
                "key='" + key + '\'' +
                ", name='" + name + '\'' +
                ", texturePath='" + texturePath + '\'' +
                ", textureScale=" + textureScale +
                '}';
    }
}
