package com.example.jme07;

/**
 * Interface für dynamische Terrain-Daten-Bereitstellung.
 * Ermöglicht unterschiedliche Implementierungen (prozedural, aus Dateien, etc.)
 */
public interface TileProvider {

    /**
     * Lädt Höhendaten für einen bestimmten Chunk.
     *
     * @param chunkX X-Koordinate des Chunks
     * @param chunkZ Z-Koordinate des Chunks
     * @param size Größe des Chunks (z.B. 65x65)
     * @return Array mit Höhendaten [size * size]
     */
    float[] getHeightData(int chunkX, int chunkZ, int size);

    /**
     * Gibt den Namen des Providers zurück
     */
    String getName();
}
