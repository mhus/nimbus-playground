package com.example.jme07;

/**
 * TerrainMaterial - Definiert ein Material für das Terrain
 * mit Textur-Pfad und Eigenschaften
 *
 * DiffuseMap-Index bestimmt die Reihenfolge im Shader:
 *   0 -> DiffuseMap,   gesteuert durch AlphaMap Kanal R
 *   1 -> DiffuseMap_1, gesteuert durch AlphaMap Kanal G
 *   2 -> DiffuseMap_2, gesteuert durch AlphaMap Kanal B
 *   3 -> DiffuseMap_3, gesteuert durch AlphaMap_1 Kanal R
 */
public class TerrainMaterial {

    private String key;
    private String name;
    private String texturePath;
    private float textureScale;
    private int diffuseMapIndex;    // Index der DiffuseMap (0-11)
    private int alphaMapIndex;      // Welche AlphaMap (0-3)
    private int alphaMapChannel;    // Welcher Kanal: 0=R, 1=G, 2=B

    public TerrainMaterial(String key, String name, String texturePath, float textureScale) {
        this(key, name, texturePath, textureScale, -1, -1, -1);
    }

    public TerrainMaterial(String key, String name, String texturePath, float textureScale,
                          int diffuseMapIndex, int alphaMapIndex, int alphaMapChannel) {
        this.key = key;
        this.name = name;
        this.texturePath = texturePath;
        this.textureScale = textureScale;
        this.diffuseMapIndex = diffuseMapIndex;
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

    public int getDiffuseMapIndex() {
        return diffuseMapIndex;
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
                ", diffuseMapIndex=" + diffuseMapIndex +
                ", alphaMapIndex=" + alphaMapIndex +
                ", alphaMapChannel=" + alphaMapChannel +
                '}';
    }
}
