package com.example.jme07;

/**
 * TerrainTile - Repräsentiert einen einzelnen Punkt im Terrain
 * mit Höhe, Material-Key und optionalen zusätzlichen Parametern
 */
public class TerrainTile {

    private float height;
    private String materialKey;
    private float wetness;      // Feuchtigkeit (0-1)
    private float temperature;  // Temperatur (-1 bis 1)
    private float speedMultiplier; // Laufgeschwindigkeit (1.0 = normal, 1.5 = schneller, 0.9 = langsamer)

    public TerrainTile(float height, String materialKey) {
        this.height = height;
        this.materialKey = materialKey;
        this.wetness = 0.5f;
        this.temperature = 0f;
        this.speedMultiplier = 1.0f;
    }

    public TerrainTile(float height, String materialKey, float wetness, float temperature) {
        this.height = height;
        this.materialKey = materialKey;
        this.wetness = wetness;
        this.temperature = temperature;
        this.speedMultiplier = 1.0f;
    }

    public TerrainTile(float height, String materialKey, float wetness, float temperature, float speedMultiplier) {
        this.height = height;
        this.materialKey = materialKey;
        this.wetness = wetness;
        this.temperature = temperature;
        this.speedMultiplier = speedMultiplier;
    }

    public float getHeight() {
        return height;
    }

    public void setHeight(float height) {
        this.height = height;
    }

    public String getMaterialKey() {
        return materialKey;
    }

    public void setMaterialKey(String materialKey) {
        this.materialKey = materialKey;
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

    public float getSpeedMultiplier() {
        return speedMultiplier;
    }

    public void setSpeedMultiplier(float speedMultiplier) {
        this.speedMultiplier = speedMultiplier;
    }

    @Override
    public String toString() {
        return "TerrainTile{" +
                "height=" + height +
                ", materialKey='" + materialKey + '\'' +
                ", wetness=" + wetness +
                ", temperature=" + temperature +
                ", speedMultiplier=" + speedMultiplier +
                '}';
    }
}
