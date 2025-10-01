package com.example.jmonkeyexample03;

import org.springframework.stereotype.Service;
import java.util.Random;

/**
 * Service für das dynamische Laden und Bereitstellen von Tile-Daten mit fließenden Oberflächen.
 *
 * Dieser Service generiert eine Tile-Map basierend auf Koordinaten
 * und definiert Höhen für Tile-Ecken um fließende Oberflächen zu erstellen.
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
     * Klasse für einen Eckpunkt mit Höheninformation
     */
    public static class HeightPoint {
        private final int x, y;
        private final float height;

        public HeightPoint(int x, int y, float height) {
            this.x = x;
            this.y = y;
            this.height = height;
        }

        public int getX() { return x; }
        public int getY() { return y; }
        public float getHeight() { return height; }
    }

    /**
     * Klasse für ein einzelnes Tile mit Eckpunkt-Höhen für fließende Oberflächen
     */
    public static class Tile {
        private final int x, y;
        private final TileType type;
        private final HeightPoint[] corners; // 4 Ecken: [0]=SW, [1]=SE, [2]=NE, [3]=NW

        public Tile(int x, int y, TileType type, HeightPoint[] corners) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.corners = corners;
        }

        public int getX() { return x; }
        public int getY() { return y; }
        public TileType getType() { return type; }
        public HeightPoint[] getCorners() { return corners; }

        // Convenience Methoden für die 4 Ecken
        public float getHeightSW() { return corners[0].getHeight(); } // South-West
        public float getHeightSE() { return corners[1].getHeight(); } // South-East
        public float getHeightNE() { return corners[2].getHeight(); } // North-East
        public float getHeightNW() { return corners[3].getHeight(); } // North-West

        // Durchschnittshöhe für Tile-Typ Bestimmung
        public float getAverageHeight() {
            return (getHeightSW() + getHeightSE() + getHeightNE() + getHeightNW()) / 4.0f;
        }
    }

    /**
     * Generiert ein Tile für die gegebenen Koordinaten mit Eckpunkt-Höhen.
     *
     * @param x X-Koordinate
     * @param y Y-Koordinate
     * @return Ein Tile-Objekt mit 4 Eckpunkt-Höhen
     */
    public Tile getTile(int x, int y) {
        // Generiere Höhen für die 4 Ecken des Tiles
        HeightPoint[] corners = new HeightPoint[4];
        corners[0] = new HeightPoint(x, y, getHeightAt(x, y));           // SW
        corners[1] = new HeightPoint(x + 1, y, getHeightAt(x + 1, y));   // SE
        corners[2] = new HeightPoint(x + 1, y + 1, getHeightAt(x + 1, y + 1)); // NE
        corners[3] = new HeightPoint(x, y + 1, getHeightAt(x, y + 1));   // NW

        // Bestimme Tile-Typ basierend auf Durchschnittshöhe
        float averageHeight = (corners[0].getHeight() + corners[1].getHeight() +
                              corners[2].getHeight() + corners[3].getHeight()) / 4.0f;

        TileType type = determineTileType(averageHeight);

        return new Tile(x, y, type, corners);
    }

    /**
     * Berechnet die Höhe an einem spezifischen Punkt (x, y).
     * Diese Methode stellt sicher, dass benachbarte Tiles gleiche Höhen an gemeinsamen Eckpunkten haben.
     */
    public float getHeightAt(int x, int y) {
        // Verwende Noise-Funktion basierend auf den Koordinaten
        double noise = generateNoise(x, y);

        // Konvertiere Noise zu Höhenwerten
        float height = (float) (noise * 2.0); // Bereich: -2.0 bis +2.0

        return height;
    }

    /**
     * Bestimmt den Tile-Typ basierend auf der Höhe
     */
    private TileType determineTileType(double height) {
        if (height < -0.5) {
            return TileType.WATER;
        } else if (height < 0.0) {
            return TileType.SAND;
        } else if (height < 0.8) {
            return TileType.GRASS;
        } else if (height < 1.5) {
            return TileType.DIRT;
        } else {
            return TileType.STONE;
        }
    }

    /**
     * Lädt einen Chunk von Tiles (z.B. 16x16 Bereich) mit fließenden Oberflächen.
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
        double frequency = 0.02; // Niedrigere Frequenz für sanftere Übergänge

        for (int i = 0; i < 4; i++) {
            // Verwende deterministische Noise basierend auf Koordinaten
            double localNoise = Math.sin(x * frequency + i) * Math.cos(y * frequency + i * 0.7);
            noise += amplitude * localNoise;
            amplitude *= 0.6; // Weniger aggressive Reduktion für sanftere Kurven
            frequency *= 1.8;
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
