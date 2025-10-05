package com.example.jmonkeyexample06;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

/**
 * Service für die Bereitstellung von Tile-Daten mit verschiedenen Terrainbereichen.
 * Generiert ein großes, persistentes Terrain mit unterschiedlichen Biomen.
 * Standalone Version ohne Spring Boot Dependencies.
 */
public class TileProviderService06 {

    private final Map<String, Tile[][]> loadedChunks = new HashMap<>();
    private final Random random = new Random(12345); // Feste Seed für konsistente Welt
    private final int WORLD_SIZE = 200; // Weltgröße in Chunks (200x200 Chunks)
    private final double NOISE_SCALE = 0.1; // Skalierung für Perlin-ähnliches Rauschen

    /**
     * Enum für verschiedene Tile-Typen mit unterschiedlichen Farben.
     */
    public enum TileType {
        WATER(0.2f, 0.4f, 0.8f, "Wasser - Tiefe Bereiche"),
        SAND(0.9f, 0.8f, 0.6f, "Sand - Strände und Wüsten"),
        GRASS(0.3f, 0.7f, 0.2f, "Gras - Ebenen und Hügel"),
        STONE(0.5f, 0.5f, 0.5f, "Stein - Berge und Felsen"),
        SNOW(0.9f, 0.9f, 0.9f, "Schnee - Hohe Berge"),
        FOREST(0.1f, 0.4f, 0.1f, "Wald - Dichte Vegetation"),
        DESERT(0.8f, 0.6f, 0.3f, "Wüste - Trockene Gebiete"),
        SWAMP(0.4f, 0.5f, 0.2f, "Sumpf - Feuchte Niederungen");

        private final float r, g, b;
        private final String description;

        TileType(float r, float g, float b, String description) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.description = description;
        }

        public float getR() { return r; }
        public float getG() { return g; }
        public float getB() { return b; }
        public String getDescription() { return description; }
    }

    /**
     * Klasse für einen einzelnen Tile mit Höhendaten an den Eckpunkten.
     */
    public static class Tile {
        private final int x, y;
        private final TileType type;
        private final float heightSW, heightSE, heightNE, heightNW;

        public Tile(int x, int y, TileType type, float heightSW, float heightSE, float heightNE, float heightNW) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.heightSW = heightSW;
            this.heightSE = heightSE;
            this.heightNE = heightNE;
            this.heightNW = heightNW;
        }

        public int getX() { return x; }
        public int getY() { return y; }
        public TileType getType() { return type; }
        public float getHeightSW() { return heightSW; }
        public float getHeightSE() { return heightSE; }
        public float getHeightNE() { return heightNE; }
        public float getHeightNW() { return heightNW; }

        public float getAverageHeight() {
            return (heightSW + heightSE + heightNE + heightNW) / 4.0f;
        }
    }

    /**
     * Lädt einen Chunk und generiert ihn falls nötig.
     */
    public Tile[][] loadChunk(int chunkX, int chunkY, int chunkSize) {
        String chunkKey = chunkX + "," + chunkY;

        // Prüfe ob der Chunk bereits geladen ist
        if (loadedChunks.containsKey(chunkKey)) {
            return loadedChunks.get(chunkKey);
        }

        // Generiere neuen Chunk
        Tile[][] chunk = generateChunk(chunkX, chunkY, chunkSize);
        loadedChunks.put(chunkKey, chunk);

        return chunk;
    }

    /**
     * Gibt einen bereits geladenen Chunk zurück, ohne ihn neu zu generieren.
     */
    public Tile[][] getChunk(int chunkX, int chunkY) {
        String chunkKey = chunkX + "," + chunkY;
        return loadedChunks.get(chunkKey);
    }

    // ...existing methods from TileProviderService04...

    private Tile[][] generateChunk(int chunkX, int chunkY, int chunkSize) {
        Tile[][] chunk = new Tile[chunkSize][chunkSize];

        for (int x = 0; x < chunkSize; x++) {
            for (int y = 0; y < chunkSize; y++) {
                int worldX = chunkX * chunkSize + x;
                int worldY = chunkY * chunkSize + y;

                chunk[x][y] = generateTile(worldX, worldY);
            }
        }

        return chunk;
    }

    private Tile generateTile(int worldX, int worldY) {
        // Berechne Entfernung vom Zentrum für radiale Bereiche
        double centerX = WORLD_SIZE * 8; // Zentrum der Welt
        double centerY = WORLD_SIZE * 8;
        double distanceFromCenter = Math.sqrt(Math.pow(worldX - centerX, 2) + Math.pow(worldY - centerY, 2));

        // Generiere Höhenwerte mit Perlin-ähnlichem Rauschen
        float baseHeight = generateHeight(worldX, worldY);
        float heightSW = baseHeight + generateHeight(worldX, worldY, 0.25f);
        float heightSE = baseHeight + generateHeight(worldX + 1, worldY, 0.25f);
        float heightNE = baseHeight + generateHeight(worldX + 1, worldY + 1, 0.25f);
        float heightNW = baseHeight + generateHeight(worldX, worldY + 1, 0.25f);

        // Bestimme Tile-Typ basierend auf Höhe und Position
        TileType type = determineTileType(worldX, worldY, baseHeight, distanceFromCenter);

        return new Tile(worldX, worldY, type, heightSW, heightSE, heightNE, heightNW);
    }

    private float generateHeight(double x, double y) {
        return generateHeight(x, y, 1.0f);
    }

    private float generateHeight(double x, double y, float amplitude) {
        // Einfaches Multi-Oktaven Rauschen
        double value = 0;
        double frequency = NOISE_SCALE;
        double currentAmplitude = amplitude;

        for (int i = 0; i < 4; i++) {
            value += noise(x * frequency, y * frequency) * currentAmplitude;
            frequency *= 2;
            currentAmplitude *= 0.5;
        }

        return (float) value;
    }

    private double noise(double x, double y) {
        // Hash-basiertes Rauschen
        int xi = (int) Math.floor(x);
        int yi = (int) Math.floor(y);

        double xf = x - xi;
        double yf = y - yi;

        // Interpoliere zwischen den vier Eckpunkten
        double n00 = dotGridGradient(xi, yi, x, y);
        double n10 = dotGridGradient(xi + 1, yi, x, y);
        double n01 = dotGridGradient(xi, yi + 1, x, y);
        double n11 = dotGridGradient(xi + 1, yi + 1, x, y);

        double ix0 = interpolate(n00, n10, xf);
        double ix1 = interpolate(n01, n11, xf);

        return interpolate(ix0, ix1, yf);
    }

    private double dotGridGradient(int ix, int iy, double x, double y) {
        // Pseudo-zufälliger Gradient
        Random r = new Random(ix * 374761393L + iy * 668265263L + 12345L);
        double gradX = r.nextGaussian();
        double gradY = r.nextGaussian();

        double dx = x - ix;
        double dy = y - iy;

        return dx * gradX + dy * gradY;
    }

    private double interpolate(double a, double b, double t) {
        // Smoothstep interpolation
        t = t * t * (3.0 - 2.0 * t);
        return a + t * (b - a);
    }

    private TileType determineTileType(int worldX, int worldY, float height, double distanceFromCenter) {
        // Wasser in niedrigen Bereichen
        if (height < -2.0f) {
            return TileType.WATER;
        }

        // Sand an Stränden (nahe Wasser)
        if (height < -1.0f) {
            return TileType.SAND;
        }

        // Verschiedene Biome basierend auf Position und Höhe
        double biomeFactor = Math.sin(worldX * 0.01) * Math.cos(worldY * 0.01);

        if (height > 8.0f) {
            return TileType.SNOW; // Hohe Berge
        } else if (height > 5.0f) {
            return TileType.STONE; // Berge
        } else if (biomeFactor > 0.3) {
            return TileType.FOREST; // Waldgebiete
        } else if (biomeFactor < -0.3 && distanceFromCenter > 50) {
            return TileType.DESERT; // Wüstengebiete weit vom Zentrum
        } else if (height < 0.5f && biomeFactor > 0) {
            return TileType.SWAMP; // Sumpfgebiete in niedrigen Bereichen
        } else {
            return TileType.GRASS; // Standard Grasland
        }
    }

    public boolean isChunkInBounds(int chunkX, int chunkY) {
        return chunkX >= -WORLD_SIZE/2 && chunkX <= WORLD_SIZE/2 &&
               chunkY >= -WORLD_SIZE/2 && chunkY <= WORLD_SIZE/2;
    }

    public String getTileInfo(TileType type) {
        return type.name() + ": " + type.getDescription();
    }

    public void unloadChunk(int chunkX, int chunkY) {
        String chunkKey = chunkX + "," + chunkY;
        loadedChunks.remove(chunkKey);
    }

    public int getLoadedChunkCount() {
        return loadedChunks.size();
    }
}
