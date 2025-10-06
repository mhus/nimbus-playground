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
    private final float heightOffset;  // Offset um Höhen positiv zu machen
    private final Map<String, TerrainMaterial> materials;

    public ProceduralTileProvider(long seed, float scale, float heightMultiplier) {
        this.seed = seed;
        this.scale = scale;
        this.heightMultiplier = heightMultiplier;
        this.heightOffset = heightMultiplier + 10f;  // Offset = heightMultiplier + 10 für positive Werte
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

                // Normalisiere und skaliere, dann füge Offset hinzu für positive Werte
                height = (height / maxValue) * heightMultiplier + heightOffset;

                // Bestimme Material basierend auf Höhe (ohne Offset für Material-Bestimmung)
                float relativeHeight = height - heightOffset;
                String materialKey = determineMaterialKey(relativeHeight);

                // Generiere zusätzliche Parameter
                float wetness = (noise(worldX * 0.1f, worldZ * 0.1f) + 1f) / 2f; // 0-1
                float temperature = noise(worldX * 0.05f + 100, worldZ * 0.05f + 100); // -1 bis 1
                float speedMultiplier = getSpeedMultiplierForMaterial(materialKey);

                tiles[index] = new TerrainTile(height, materialKey, wetness, temperature, speedMultiplier);
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

    /**
     * Bestimmt den Speed-Multiplier für ein Material
     */
    private float getSpeedMultiplierForMaterial(String materialKey) {
        switch (materialKey) {
            case "sand":
                return 1.0f; // Normal
            case "grass":
                return 0.9f; // Langsamer auf Gras
            case "rock":
                return 1.0f; // Normal
            default:
                return 1.0f;
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
     * Hash-basierte Noise-Funktion für konsistente Werte bei beliebigen Koordinaten.
     * Vermeidet Drift-Probleme der vorherigen Sinus-basierten Implementierung.
     */
    private float noise(float x, float z) {
        // Diskretisiere Koordinaten auf Grid
        int ix = (int) Math.floor(x);
        int iz = (int) Math.floor(z);

        // Fraktionale Teile für Interpolation
        float fx = x - ix;
        float fz = z - iz;

        // Smooth interpolation (Fade-Funktion)
        fx = fx * fx * (3.0f - 2.0f * fx);
        fz = fz * fz * (3.0f - 2.0f * fz);

        // Hole Hash-Werte für die 4 Eckpunkte
        float h00 = hash(ix, iz);
        float h10 = hash(ix + 1, iz);
        float h01 = hash(ix, iz + 1);
        float h11 = hash(ix + 1, iz + 1);

        // Bilineare Interpolation
        float h0 = h00 * (1.0f - fx) + h10 * fx;
        float h1 = h01 * (1.0f - fx) + h11 * fx;

        return h0 * (1.0f - fz) + h1 * fz;
    }

    /**
     * Hash-Funktion für Integer-Koordinaten
     * Gibt konsistente Pseudo-Zufallswerte im Bereich [-1, 1] zurück
     */
    private float hash(int x, int z) {
        // Kombiniere mit seed
        int n = x + z * 57 + (int)(seed & 0xFFFFFF);

        // Integer-Hash (basierend auf bit-mixing)
        n = (n << 13) ^ n;
        n = (n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff;

        // Normalisiere zu [-1, 1]
        return 1.0f - (n / 1073741824.0f);
    }
}
