package com.example.jme07;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Prozeduraler TileProvider der Höhendaten mit Perlin-ähnlichem Noise generiert.
 * Generiert auch Material-IDs basierend auf Höhe und optionalen Parametern.
 */
public class ProceduralTileProvider implements TileProvider {

    private final long seed;
    private final float scale;
    private final float heightMultiplier;
    private final Map<String, TerrainMaterial> materials;

    public ProceduralTileProvider(long seed, float scale, float heightMultiplier) {
        this.seed = seed;
        this.scale = scale;
        this.heightMultiplier = heightMultiplier;
        this.materials = initMaterials();
    }

    private Map<String, TerrainMaterial> initMaterials() {
        Map<String, TerrainMaterial> mats = new LinkedHashMap<>();

        // Material "sand": AlphaMap 0 Kanal R - hell (grass Textur)
        mats.put("sand", new TerrainMaterial("sand", "Sand", "Textures/Terrain/splat/grass.jpg", 1f, true, 0, 0));

        // Material "grass": AlphaMap 0 Kanal G - dunkel (Rock Textur)
        mats.put("grass", new TerrainMaterial("grass", "Grass", "Textures/Terrain/Rock/Rock.PNG", 1f, true, 0, 1));

        // Material "rock": AlphaMap 0 Kanal B - Rock
        mats.put("rock", new TerrainMaterial("rock", "Rock", "Textures/Terrain/Rock/Rock.PNG", 1f, true, 0, 2));

        System.out.println("ProceduralTileProvider: Initialized " + mats.size() + " materials");
        return mats;
    }

    @Override
    public TerrainTile[] getTileData(int chunkX, int chunkZ, int size) {
        TerrainTile[] tiles = new TerrainTile[size * size];

        // Berechne Offset für diesen Chunk in Weltkoordinaten
        int worldOffsetX = chunkX * (size - 1);
        int worldOffsetZ = chunkZ * (size - 1);

        for (int z = 0; z < size; z++) {
            for (int x = 0; x < size; x++) {
                int index = z * size + x;

                // Weltkoordinaten für diesen Punkt
                float worldX = (worldOffsetX + x) * scale;
                float worldZ = (worldOffsetZ + z) * scale;

                // Generiere Höhe mit mehreren Oktaven
                float height = 0;
                float amplitude = 1.0f;
                float frequency = 1.0f;
                float maxValue = 0;

                // 4 Oktaven für detaillierteres Terrain
                for (int octave = 0; octave < 4; octave++) {
                    height += noise(worldX * frequency, worldZ * frequency) * amplitude;
                    maxValue += amplitude;
                    amplitude *= 0.5f;
                    frequency *= 2.0f;
                }

                // Normalisiere und skaliere
                height = (height / maxValue) * heightMultiplier;

                // Bestimme Material basierend auf Höhe
                String materialKey = determineMaterialKey(height);

                // Generiere zusätzliche Parameter
                float wetness = (noise(worldX * 0.1f, worldZ * 0.1f) + 1f) / 2f; // 0-1
                float temperature = noise(worldX * 0.05f + 100, worldZ * 0.05f + 100); // -1 bis 1

                tiles[index] = new TerrainTile(height, materialKey, wetness, temperature);
            }
        }

        return tiles;
    }

    /**
     * Bestimmt Material-Key basierend auf Höhe
     */
    private String determineMaterialKey(float height) {
        final float SAND_HEIGHT = 8f;
        final float GRASS_HEIGHT = 25f;

        if (height < SAND_HEIGHT) {
            return "sand";
        } else if (height < GRASS_HEIGHT) {
            return "grass";
        } else {
            return "rock";
        }
    }

    @Override
    public Map<String, TerrainMaterial> getMaterials() {
        return materials;
    }

    @Override
    public String getName() {
        return "ProceduralTileProvider(seed=" + seed + ", scale=" + scale + ", materials=" + materials.size() + ")";
    }

    /**
     * Einfache Noise-Funktion basierend auf Sinuswellen.
     * Für Produktionsumgebungen sollte eine echte Perlin/Simplex Noise-Implementierung verwendet werden.
     */
    private float noise(float x, float z) {
        // Kombiniere mehrere Sinuswellen für pseudo-zufälliges Pattern
        float n = (float) (
            Math.sin(x * 0.75 + seed) * Math.cos(z * 0.75 - seed) +
            Math.sin(x * 1.2 - z * 0.8 + seed) * 0.5 +
            Math.cos(x * 0.3 + z * 1.1 - seed) * 0.3
        );

        // Normalisiere zu [-1, 1]
        return Math.max(-1.0f, Math.min(1.0f, n));
    }
}
