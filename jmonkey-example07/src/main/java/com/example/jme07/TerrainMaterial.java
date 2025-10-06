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
    private int alphaMapIndex;      // Welche AlphaMap (0-3)
    private int alphaMapChannel;    // Welcher Kanal: 0=R, 1=G, 2=B

    public TerrainMaterial(String key, String name, String texturePath, float textureScale) {
        this(key, name, texturePath, textureScale, -1, -1);
    }

    public TerrainMaterial(String key, String name, String texturePath, float textureScale,
                          int alphaMapIndex, int alphaMapChannel) {
        this.key = key;
        this.name = name;
        this.texturePath = texturePath;
        this.textureScale = textureScale;
        this.alphaMapIndex = alphaMapIndex;
        this.alphaMapChannel = alphaMapChannel;
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

    public int getAlphaMapIndex() {
        return alphaMapIndex;
    }

    public int getAlphaMapChannel() {
        return alphaMapChannel;
    }

    @Override
    public String toString() {
        return "TerrainMaterial{" +
                "key='" + key + '\'' +
                ", name='" + name + '\'' +
                ", texturePath='" + texturePath + '\'' +
                ", textureScale=" + textureScale +
                ", alphaMapIndex=" + alphaMapIndex +
                ", alphaMapChannel=" + alphaMapChannel +
                '}';
    }
}
