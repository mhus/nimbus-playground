package com.example.jmonkeyexample03;

import org.springframework.stereotype.Service;
import java.util.Random;

/**
 * Service für das dynamische Laden und Bereitstellen von Tile-Daten.
 *
 * Dieser Service generiert eine Tile-Map basierend auf Koordinaten
 * und kann später erweitert werden, um Daten aus Dateien oder Datenbanken zu laden.
 */
@Service
public class TileProviderService {

    private final Random random = new Random(42); // Fester Seed für reproduzierbare Maps

    /**
     * Enum für verschiedene Tile-Typen
     */
    public enum TileType {
        GRASS(0, "Gras", 0.2f, 0.8f, 0.2f),      // Grün
        STONE(1, "Stein", 0.5f, 0.5f, 0.5f),     // Grau
        WATER(2, "Wasser", 0.2f, 0.2f, 0.8f),    // Blau
        SAND(3, "Sand", 0.9f, 0.8f, 0.4f),       // Gelblich
        DIRT(4, "Erde", 0.4f, 0.2f, 0.1f);       // Braun

        private final int id;
        private final String name;
        private final float r, g, b;

        TileType(int id, String name, float r, float g, float b) {
            this.id = id;
            this.name = name;
            this.r = r;
            this.g = g;
            this.b = b;
        }

        public int getId() { return id; }
        public String getName() { return name; }
        public float getR() { return r; }
        public float getG() { return g; }
        public float getB() { return b; }
    }

    /**
     * Klasse für ein einzelnes Tile
     */
    public static class Tile {
        private final int x, y;
        private final TileType type;
        private final float height;

        public Tile(int x, int y, TileType type, float height) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.height = height;
        }

        public int getX() { return x; }
        public int getY() { return y; }
        public TileType getType() { return type; }
        public float getHeight() { return height; }
    }

    /**
     * Generiert ein Tile für die gegebenen Koordinaten.
     *
     * @param x X-Koordinate
     * @param y Y-Koordinate
     * @return Ein Tile-Objekt
     */
    public Tile getTile(int x, int y) {
        // Einfache Noise-basierte Generierung
        double noise = generateNoise(x, y);

        TileType type;
        float height = 0.0f;

        if (noise < -0.3) {
            type = TileType.WATER;
            height = -0.2f;
        } else if (noise < -0.1) {
            type = TileType.SAND;
            height = 0.1f;
        } else if (noise < 0.3) {
            type = TileType.GRASS;
            height = 0.2f;
        } else if (noise < 0.6) {
            type = TileType.DIRT;
            height = 0.3f;
        } else {
            type = TileType.STONE;
            height = 0.5f + (float)(noise - 0.6) * 2.0f; // Berge
        }

        return new Tile(x, y, type, height);
    }

    /**
     * Lädt einen Chunk von Tiles (z.B. 16x16 Bereich).
     *
     * @param chunkX Chunk X-Koordinate
     * @param chunkY Chunk Y-Koordinate
     * @param chunkSize Größe des Chunks
     * @return Array von Tiles
     */
    public Tile[][] loadChunk(int chunkX, int chunkY, int chunkSize) {
        Tile[][] chunk = new Tile[chunkSize][chunkSize];

        for (int x = 0; x < chunkSize; x++) {
            for (int y = 0; y < chunkSize; y++) {
                int worldX = chunkX * chunkSize + x;
                int worldY = chunkY * chunkSize + y;
                chunk[x][y] = getTile(worldX, worldY);
            }
        }

        return chunk;
    }

    /**
     * Einfache Noise-Funktion für Terrain-Generierung.
     */
    private double generateNoise(int x, int y) {
        // Kombination aus mehreren Oktaven für interessanteres Terrain
        double noise = 0.0;
        double amplitude = 1.0;
        double frequency = 0.01;

        for (int i = 0; i < 4; i++) {
            noise += amplitude * (random.nextGaussian() * 0.1 +
                    Math.sin(x * frequency) * Math.cos(y * frequency));
            amplitude *= 0.5;
            frequency *= 2.0;
        }

        return Math.max(-1.0, Math.min(1.0, noise));
    }

    /**
     * Gibt Informationen über ein Tile-Typ zurück.
     */
    public String getTileInfo(TileType type) {
        return String.format("Tile: %s (ID: %d, RGB: %.1f,%.1f,%.1f)",
                type.getName(), type.getId(), type.getR(), type.getG(), type.getB());
    }
}
