package com.example.jme07;

/**
 * TerrainMaterial - Definiert ein Material für das Terrain
 * mit Textur-Pfad und Eigenschaften
 */
public class TerrainMaterial {

    private int id;
    private String name;
    private String texturePath;
    private float textureScale;

    public TerrainMaterial(int id, String name, String texturePath, float textureScale) {
        this.id = id;
        this.name = name;
        this.texturePath = texturePath;
        this.textureScale = textureScale;
    }

    public int getId() {
        return id;
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
                "id=" + id +
                ", name='" + name + '\'' +
                ", texturePath='" + texturePath + '\'' +
                ", textureScale=" + textureScale +
                '}';
    }
}
