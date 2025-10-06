package com.example.jme07;

import java.util.ArrayList;
import java.util.List;

/**
 * Prozeduraler TileProvider der Höhendaten mit Perlin-ähnlichem Noise generiert.
 * Generiert auch Material-IDs basierend auf Höhe und optionalen Parametern.
 */
public class ProceduralTileProvider implements TileProvider {

    private final long seed;
    private final float scale;
    private final float heightMultiplier;
    private final List<TerrainMaterial> materials;

    public ProceduralTileProvider(long seed, float scale, float heightMultiplier) {
        this.seed = seed;
        this.scale = scale;
        this.heightMultiplier = heightMultiplier;
        this.materials = initMaterials();
    }

    private List<TerrainMaterial> initMaterials() {
        List<TerrainMaterial> mats = new ArrayList<>();

        // Material 0: Sand/Dirt (niedrige Höhen)
        mats.add(new TerrainMaterial(0, "Sand", "Textures/Terrain/splat/dirt.jpg", 1f));

        // Material 1: Gras (mittlere Höhen)
        mats.add(new TerrainMaterial(1, "Grass", "Textures/Terrain/splat/grass.jpg", 1f));

        // Material 2: Stein/Fels (hohe Höhen)
        mats.add(new TerrainMaterial(2, "Rock", "Textures/Terrain/Rock/Rock.PNG", 1f));

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
                int materialId = determineMaterialId(height);

                // Generiere zusätzliche Parameter
                float wetness = (noise(worldX * 0.1f, worldZ * 0.1f) + 1f) / 2f; // 0-1
                float temperature = noise(worldX * 0.05f + 100, worldZ * 0.05f + 100); // -1 bis 1

                tiles[index] = new TerrainTile(height, materialId, wetness, temperature);
            }
        }

        return tiles;
    }

    /**
     * Bestimmt Material-ID basierend auf Höhe
     */
    private int determineMaterialId(float height) {
        final float SAND_HEIGHT = 8f;
        final float GRASS_HEIGHT = 25f;

        if (height < SAND_HEIGHT) {
            return 0; // Sand
        } else if (height < GRASS_HEIGHT) {
            return 1; // Gras
        } else {
            return 2; // Stein
        }
    }

    @Override
    public List<TerrainMaterial> getMaterials() {
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
