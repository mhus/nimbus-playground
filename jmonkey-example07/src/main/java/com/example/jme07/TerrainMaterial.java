package com.example.jme07;

/**
 * TerrainMaterial - Definiert ein Material für das Terrain
 * mit Textur-Pfad und Eigenschaften
 *
 * needsDiffuseMap bestimmt ob eine DiffuseMap benötigt wird.
 * Der DiffuseMap-Index wird dynamisch beim Laden vergeben.
 *
 * AlphaMap-Index und Channel bestimmen die Position in den AlphaMaps:
 *   AlphaMap 0, Kanal R (0) -> DiffuseMap
 *   AlphaMap 0, Kanal G (1) -> DiffuseMap_1
 *   AlphaMap 0, Kanal B (2) -> DiffuseMap_2
 *   AlphaMap 1, Kanal R (0) -> DiffuseMap_4
 *   etc.
 */
public class TerrainMaterial {

    private String key;
    private String name;
    private String texturePath;
    private float textureScale;
    private boolean needsDiffuseMap;  // Wird eine DiffuseMap benötigt?
    private int alphaMapIndex;        // Welche AlphaMap (0-3)
    private int alphaMapChannel;      // Welcher Kanal: 0=R, 1=G, 2=B

    public TerrainMaterial(String key, String name, String texturePath, float textureScale) {
        this(key, name, texturePath, textureScale, true, 0, 0);
    }

    public TerrainMaterial(String key, String name, String texturePath, float textureScale,
                          boolean needsDiffuseMap, int alphaMapIndex, int alphaMapChannel) {
        this.key = key;
        this.name = name;
        this.texturePath = texturePath;
        this.textureScale = textureScale;
        this.needsDiffuseMap = needsDiffuseMap;
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

    public boolean needsDiffuseMap() {
        return needsDiffuseMap;
    }

    public int getAlphaMapIndex() {
        return alphaMapIndex;
    }

    public int getAlphaMapChannel() {
        return alphaMapChannel;
    }

    /**
     * Berechnet den DiffuseMap-Index dynamisch basierend auf AlphaMap-Index und Channel.
     * WICHTIG: Der Shader überspringt DiffuseMap_3!
     *
     * AlphaMap 0, Kanal 0 (R) -> DiffuseMap   (Index 0)
     * AlphaMap 0, Kanal 1 (G) -> DiffuseMap_1 (Index 1)
     * AlphaMap 0, Kanal 2 (B) -> DiffuseMap_2 (Index 2)
     * AlphaMap 1, Kanal 0 (R) -> DiffuseMap_4 (Index 4) <- überspringt 3!
     * AlphaMap 1, Kanal 1 (G) -> DiffuseMap_5 (Index 5)
     * etc.
     */
    public int calculateDiffuseMapIndex() {
        if (alphaMapIndex == 0) {
            // Erste AlphaMap: direkte Zuordnung 0,1,2
            return alphaMapChannel;
        } else {
            // Ab AlphaMap 1: überspringe Index 3
            return 4 + (alphaMapIndex - 1) * 3 + alphaMapChannel;
        }
    }

    @Override
    public String toString() {
        return "TerrainMaterial{" +
                "key='" + key + '\'' +
                ", name='" + name + '\'' +
                ", texturePath='" + texturePath + '\'' +
                ", textureScale=" + textureScale +
                ", needsDiffuseMap=" + needsDiffuseMap +
                ", alphaMapIndex=" + alphaMapIndex +
                ", alphaMapChannel=" + alphaMapChannel +
                ", calculatedDiffuseIdx=" + calculateDiffuseMapIndex() +
                '}';
    }
}
