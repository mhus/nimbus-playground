package com.example.jme07;

/**
 * Prozeduraler TileProvider der Höhendaten mit Perlin-ähnlichem Noise generiert.
 */
public class ProceduralTileProvider implements TileProvider {

    private final long seed;
    private final float scale;
    private final float heightMultiplier;

    public ProceduralTileProvider(long seed, float scale, float heightMultiplier) {
        this.seed = seed;
        this.scale = scale;
        this.heightMultiplier = heightMultiplier;
    }

    @Override
    public float[] getHeightData(int chunkX, int chunkZ, int size) {
        float[] heightData = new float[size * size];

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

                heightData[index] = height;
            }
        }

        return heightData;
    }

    @Override
    public String getName() {
        return "ProceduralTileProvider(seed=" + seed + ", scale=" + scale + ")";
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
