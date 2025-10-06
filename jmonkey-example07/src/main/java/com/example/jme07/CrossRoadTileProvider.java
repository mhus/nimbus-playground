package com.example.jme07;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * CrossRoadTileProvider - Fügt ein realistisches Straßennetz zum bestehenden Terrain hinzu.
 *
 * Straßen:
 * - Hauptstraßen: Größerer Abstand, breiter
 * - Nebenstraßen: Kleinerer Abstand, schmaler
 * - Sind etwas tiefer als das ursprüngliche Terrain
 * - Haben eine Straßen-Textur (stone)
 */
public class CrossRoadTileProvider extends AbstractTileManipulator {

    private static final float ROAD_DEPTH = 0.5f;           // Wie viel tiefer die Straße ist

    // Hauptstraßen (Highways)
    private static final int MAIN_ROAD_WIDTH = 7;           // Breite der Hauptstraßen
    private static final int MAIN_ROAD_SPACING = 256;       // Abstand zwischen Hauptstraßen

    // Nebenstraßen (Secondary roads)
    private static final int SECONDARY_ROAD_WIDTH = 4;      // Breite der Nebenstraßen
    private static final int SECONDARY_ROAD_SPACING = 64;   // Abstand zwischen Nebenstraßen

    // Kleine Straßen (Local roads) - nur in manchen Bereichen
    private static final int LOCAL_ROAD_WIDTH = 3;          // Breite der kleinen Straßen
    private static final int LOCAL_ROAD_SPACING = 32;       // Abstand zwischen kleinen Straßen

    private Map<String, TerrainMaterial> extendedMaterials;
    private long seed;

    public CrossRoadTileProvider(TileProvider baseProvider) {
        super(baseProvider);
        this.seed = 54321L; // Seed für Dichte-Variation
    }

    private Map<String, TerrainMaterial> createExtendedMaterials() {
        // Kopiere Materialien vom Basis-Provider
        Map<String, TerrainMaterial> materials = new LinkedHashMap<>(baseProvider.getMaterials());

        System.out.println("CrossRoadTileProvider: Base has " + materials.size() + " materials");

        // Kleine Straßen - AlphaMap 1 Kanal R (DiffuseMap_4)
        materials.put("road_small", new TerrainMaterial(
            "road_small",
            "Small Road",
            "Textures/Terrain/splat/dirt.jpg",
            1f,
            true,  // needsDiffuseMap
            1,     // alphaMapIndex
            0      // alphaMapChannel (R)
        ));

        // Große Straßen - AlphaMap 1 Kanal G (DiffuseMap_5)
        materials.put("road_large", new TerrainMaterial(
            "road_large",
            "Large Road",
            "Textures/Terrain/splat/road.jpg",
            1f,
            true,  // needsDiffuseMap
            1,     // alphaMapIndex
            1      // alphaMapChannel (G)
        ));

        System.out.println("CrossRoadTileProvider: Now has " + materials.size() + " materials total");
        for (String key : materials.keySet()) {
            TerrainMaterial tm = materials.get(key);
            System.out.println("  - " + key + ": DiffuseIdx=" + tm.calculateDiffuseMapIndex() +
                ", AlphaMap=" + tm.getAlphaMapIndex() + ", Channel=" + tm.getAlphaMapChannel());
        }

        return materials;
    }

    @Override
    protected TerrainTile[] manipulateTiles(TerrainTile[] baseTiles, int chunkX, int chunkZ, int size) {
        for (int z = 0; z < size; z++) {
            for (int x = 0; x < size; x++) {
                int index = z * size + x;

                // Berechne Weltkoordinaten
                int worldX = chunkX * (size - 1) + x;
                int worldZ = chunkZ * (size - 1) + z;

                // Bestimme Straßentyp
                String roadType = getRoadType(worldX, worldZ);

                if (roadType != null) {
                    TerrainTile baseTile = baseTiles[index];
                    // Erstelle Straßen-Tile: gleiche Position aber tiefer + Straßen-Material
                    float newHeight = baseTile.getHeight() - ROAD_DEPTH;
                    baseTiles[index] = new TerrainTile(
                        newHeight,
                        roadType,  // "road_small" oder "road_large"
                        baseTile.getWetness(),
                        baseTile.getTemperature()
                    );
                }
            }
        }

        return baseTiles;
    }

    /**
     * Bestimmt den Straßentyp an einer Weltkoordinate
     * @return "road_large" für große Straßen, "road_small" für kleine Straßen, null wenn keine Straße
     */
    private String getRoadType(int worldX, int worldZ) {
        // Hauptstraßen - große Straßen (immer vorhanden)
        if (isOnMainRoad(worldX, worldZ)) {
            return "road_large";
        }

        // Nebenstraßen - große Straßen (immer vorhanden)
        if (isOnSecondaryRoad(worldX, worldZ)) {
            return "road_large";
        }

        // Kleine Straßen - nur in dichten Bereichen
        float density = calculateDensity(worldX, worldZ);
        if (density > 0.5f && isOnLocalRoad(worldX, worldZ)) {
            return "road_small";
        }

        return null;
    }

    /**
     * Prüft ob Position auf einer Hauptstraße liegt
     */
    private boolean isOnMainRoad(int worldX, int worldZ) {
        int modX = Math.abs(worldX) % MAIN_ROAD_SPACING;
        int modZ = Math.abs(worldZ) % MAIN_ROAD_SPACING;

        boolean onNorthSouth = modX < MAIN_ROAD_WIDTH;
        boolean onEastWest = modZ < MAIN_ROAD_WIDTH;

        return onNorthSouth || onEastWest;
    }

    /**
     * Prüft ob Position auf einer Nebenstraße liegt
     */
    private boolean isOnSecondaryRoad(int worldX, int worldZ) {
        int modX = Math.abs(worldX) % SECONDARY_ROAD_SPACING;
        int modZ = Math.abs(worldZ) % SECONDARY_ROAD_SPACING;

        boolean onNorthSouth = modX < SECONDARY_ROAD_WIDTH;
        boolean onEastWest = modZ < SECONDARY_ROAD_WIDTH;

        return onNorthSouth || onEastWest;
    }

    /**
     * Prüft ob Position auf einer kleinen Straße liegt
     */
    private boolean isOnLocalRoad(int worldX, int worldZ) {
        int modX = Math.abs(worldX) % LOCAL_ROAD_SPACING;
        int modZ = Math.abs(worldZ) % LOCAL_ROAD_SPACING;

        boolean onNorthSouth = modX < LOCAL_ROAD_WIDTH;
        boolean onEastWest = modZ < LOCAL_ROAD_WIDTH;

        return onNorthSouth || onEastWest;
    }

    /**
     * Berechnet Straßen-Dichte für eine Region (0-1)
     * Verwendet Noise um Gebiete mit dichteren/spärlicheren Straßen zu erzeugen
     */
    private float calculateDensity(int worldX, int worldZ) {
        // Große Skalierung für weitläufige Regionen
        float regionX = worldX * 0.005f;
        float regionZ = worldZ * 0.005f;

        // Noise-Funktion mit Seed
        float density = noise(regionX, regionZ);

        // Normalisiere von [-1, 1] zu [0, 1]
        return (density + 1f) / 2f;
    }

    /**
     * Einfache Noise-Funktion für Dichte-Variation
     */
    private float noise(float x, float z) {
        float n = (float) (
            Math.sin(x * 0.75 + seed) * Math.cos(z * 0.75 - seed) +
            Math.sin(x * 1.2 - z * 0.8 + seed) * 0.5 +
            Math.cos(x * 0.3 + z * 1.1 - seed) * 0.3
        );

        return Math.max(-1.0f, Math.min(1.0f, n));
    }

    @Override
    public Map<String, TerrainMaterial> getMaterials() {
        if (extendedMaterials == null) {
            this.extendedMaterials = createExtendedMaterials();
        }
        return extendedMaterials;
    }

    @Override
    public String getName() {
        return "CrossRoadTileProvider(main=" + MAIN_ROAD_SPACING + ", secondary=" + SECONDARY_ROAD_SPACING + ", local=" + LOCAL_ROAD_SPACING + ") -> " + baseProvider.getName();
    }
}
