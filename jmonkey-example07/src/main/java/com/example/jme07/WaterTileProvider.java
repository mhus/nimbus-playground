package com.example.jme07;

/**
 * WaterTileProvider - Fügt Gewässer (Flüsse und Seen) zum Terrain hinzu.
 *
 * Gewässer werden als transparentes Wasser-Overlay auf dem Terrain dargestellt.
 * Die Wasseroberfläche liegt auf einer definierten Höhe über/unter dem Terrain.
 */
public class WaterTileProvider extends AbstractTileManipulator {

    private static final float WATER_LEVEL = -10f;  // Globale Wasserhöhe (absolute Höhe)
    private static final float RIVER_WIDTH = 8;    // Breite der Flüsse
    private static final int RIVER_SPACING = 28;  // Abstand zwischen Flüssen

    private long seed;

    public WaterTileProvider(TileProvider baseProvider) {
        super(baseProvider);
        this.seed = 98765L; // Seed für Noise-basierte Features
    }

    @Override
    protected TerrainTile[] manipulateTiles(TerrainTile[] baseTiles, int chunkX, int chunkZ, int size) {
        for (int z = 0; z < size; z++) {
            for (int x = 0; x < size; x++) {
                int index = z * size + x;

                // Berechne Weltkoordinaten
                int worldX = chunkX * (size - 1) + x;
                int worldZ = chunkZ * (size - 1) + z;

                TerrainTile baseTile = baseTiles[index];
                float terrainHeight = baseTile.getHeight();

                // Prüfe ob diese Tile Wasser haben soll
                boolean shouldHaveWater = false;
                float waterHeight = WATER_LEVEL;

                // 1. Flüsse (gitterbasiert wie Straßen)
                var onRiver = isOnRiver(worldX, worldZ);
                if (onRiver) {
                    shouldHaveWater = true;
                }

                // 2. Seen (in Senken unter dem Wasserspiegel)
                if (terrainHeight < WATER_LEVEL) {
                    shouldHaveWater = true;
                }

                // Erstelle neuen Tile mit Wasser-Info
                if (shouldHaveWater) {
                    // Wasser verlangsamt Bewegung drastisch
                    float speedMultiplier = 0.3f;

                    // Bestimme Wasser-Typ
                    WaterTile.WaterType waterType = onRiver
                        ? WaterTile.WaterType.RIVER
                        : WaterTile.WaterType.LAKE;

                    // Berechne Tiefe
                    float depth = waterHeight - terrainHeight;

                    WaterTile waterTile = new WaterTile(waterHeight, depth, waterType);

                    baseTiles[index] = new TerrainTile(
                        terrainHeight,
                        baseTile.getMaterialKey(),
                        baseTile.getWetness(),
                        baseTile.getTemperature(),
                        speedMultiplier,
                        waterTile
                    );
                }
            }
        }

        return baseTiles;
    }

    /**
     * Prüft ob Position auf einem Fluss liegt
     */
    private boolean isOnRiver(int worldX, int worldZ) {
        // Flüsse verlaufen wie Straßen in Nord-Süd und Ost-West Richtung
        int modX = Math.abs(worldX) % RIVER_SPACING;
        int modZ = Math.abs(worldZ) % RIVER_SPACING;

        boolean onNorthSouth = modX < RIVER_WIDTH;
        boolean onEastWest = modZ < RIVER_WIDTH;

        return onNorthSouth || onEastWest;
    }

    @Override
    public String getName() {
        return "WaterTileProvider(waterLevel=" + WATER_LEVEL + ", rivers=" + RIVER_SPACING + ") -> " + baseProvider.getName();
    }
}
