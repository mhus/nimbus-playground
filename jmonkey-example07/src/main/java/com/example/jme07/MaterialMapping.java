package com.example.jme07;

/**
 * MaterialMapping - Verwaltet die Zuordnung zwischen TerrainMaterial und Shader-Parametern
 *
 * Diese Klasse erweitert TerrainMaterial um die dynamisch zugewiesenen Indizes
 * beim Laden der Materialien in den Shader.
 */
public class MaterialMapping {

    private final TerrainMaterial material;
    private final int assignedDiffuseMapIndex;
    private final String diffuseMapParamName;
    private final String scaleParamName;

    public MaterialMapping(TerrainMaterial material, int assignedDiffuseMapIndex) {
        this.material = material;
        this.assignedDiffuseMapIndex = assignedDiffuseMapIndex;

        // Berechne Shader-Parameter-Namen
        this.diffuseMapParamName = (assignedDiffuseMapIndex == 0)
            ? "DiffuseMap"
            : "DiffuseMap_" + assignedDiffuseMapIndex;
        this.scaleParamName = "DiffuseMap_" + assignedDiffuseMapIndex + "_scale";
    }

    public TerrainMaterial getMaterial() {
        return material;
    }

    public int getAssignedDiffuseMapIndex() {
        return assignedDiffuseMapIndex;
    }

    public String getDiffuseMapParamName() {
        return diffuseMapParamName;
    }

    public String getScaleParamName() {
        return scaleParamName;
    }

    public int getAlphaMapIndex() {
        return material.getAlphaMapIndex();
    }

    public int getAlphaMapChannel() {
        return material.getAlphaMapChannel();
    }

    public String getKey() {
        return material.getKey();
    }

    @Override
    public String toString() {
        return "MaterialMapping{" +
                "key='" + material.getKey() + '\'' +
                ", assignedDiffuseMapIndex=" + assignedDiffuseMapIndex +
                ", diffuseMapParam='" + diffuseMapParamName + '\'' +
                ", alphaMapIndex=" + material.getAlphaMapIndex() +
                ", alphaMapChannel=" + material.getAlphaMapChannel() +
                '}';
    }
}
