package com.example.jme07;

/**
 * TerrainTile - Repräsentiert einen einzelnen Punkt im Terrain
 * mit Höhe, Material-ID und optionalen zusätzlichen Parametern
 */
public class TerrainTile {

    private float height;
    private int materialId;
    private float wetness;      // Feuchtigkeit (0-1)
    private float temperature;  // Temperatur (-1 bis 1)

    public TerrainTile(float height, int materialId) {
        this.height = height;
        this.materialId = materialId;
        this.wetness = 0.5f;
        this.temperature = 0f;
    }

    public TerrainTile(float height, int materialId, float wetness, float temperature) {
        this.height = height;
        this.materialId = materialId;
        this.wetness = wetness;
        this.temperature = temperature;
    }

    public float getHeight() {
        return height;
    }

    public void setHeight(float height) {
        this.height = height;
    }

    public int getMaterialId() {
        return materialId;
    }

    public void setMaterialId(int materialId) {
        this.materialId = materialId;
    }

    public float getWetness() {
        return wetness;
    }

    public void setWetness(float wetness) {
        this.wetness = wetness;
    }

    public float getTemperature() {
        return temperature;
    }

    public void setTemperature(float temperature) {
        this.temperature = temperature;
    }

    @Override
    public String toString() {
        return "TerrainTile{" +
                "height=" + height +
                ", materialId=" + materialId +
                ", wetness=" + wetness +
                ", temperature=" + temperature +
                '}';
    }
}
