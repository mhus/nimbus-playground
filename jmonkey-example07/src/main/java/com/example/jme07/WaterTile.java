package com.example.jme07;

/**
 * WaterTile - Repräsentiert Wasser-Informationen für eine Terrain-Tile
 */
public class WaterTile {

    private float waterHeight;  // Absolute Höhe der Wasseroberfläche
    private float depth;        // Tiefe des Wassers (waterHeight - terrainHeight)
    private WaterType type;     // Art des Gewässers

    public enum WaterType {
        RIVER,    // Fließendes Wasser (Fluss)
        LAKE,     // Stehendes Wasser (See)
        OCEAN     // Ozean/Meer
    }

    public WaterTile(float waterHeight, WaterType type) {
        this.waterHeight = waterHeight;
        this.type = type;
        this.depth = 0f; // Wird später berechnet
    }

    public WaterTile(float waterHeight, float depth, WaterType type) {
        this.waterHeight = waterHeight;
        this.depth = depth;
        this.type = type;
    }

    public float getWaterHeight() {
        return waterHeight;
    }

    public void setWaterHeight(float waterHeight) {
        this.waterHeight = waterHeight;
    }

    public float getDepth() {
        return depth;
    }

    public void setDepth(float depth) {
        this.depth = depth;
    }

    public WaterType getType() {
        return type;
    }

    public void setType(WaterType type) {
        this.type = type;
    }

    @Override
    public String toString() {
        return "WaterTile{" +
                "waterHeight=" + waterHeight +
                ", depth=" + depth +
                ", type=" + type +
                '}';
    }
}
