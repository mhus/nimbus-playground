package com.example.jme07;

import java.util.List;

/**
 * Interface für dynamische Terrain-Daten-Bereitstellung.
 * Ermöglicht unterschiedliche Implementierungen (prozedural, aus Dateien, etc.)
 */
public interface TileProvider {

    /**
     * Lädt Terrain-Tiles für einen bestimmten Chunk.
     * Jedes Tile enthält Höhe, Material-ID und weitere Parameter.
     *
     * @param chunkX X-Koordinate des Chunks
     * @param chunkZ Z-Koordinate des Chunks
     * @param size Größe des Chunks (z.B. 65x65)
     * @return Array mit TerrainTiles [size * size]
     */
    TerrainTile[] getTileData(int chunkX, int chunkZ, int size);

    /**
     * Lädt Höhendaten für einen bestimmten Chunk.
     * Legacy-Methode für Rückwärtskompatibilität.
     *
     * @param chunkX X-Koordinate des Chunks
     * @param chunkZ Z-Koordinate des Chunks
     * @param size Größe des Chunks (z.B. 65x65)
     * @return Array mit Höhendaten [size * size]
     */
    default float[] getHeightData(int chunkX, int chunkZ, int size) {
        TerrainTile[] tiles = getTileData(chunkX, chunkZ, size);
        float[] heights = new float[tiles.length];
        for (int i = 0; i < tiles.length; i++) {
            heights[i] = tiles[i].getHeight();
        }
        return heights;
    }

    /**
     * Gibt die Liste aller verfügbaren Materialien zurück
     */
    List<TerrainMaterial> getMaterials();

    /**
     * Gibt den Namen des Providers zurück
     */
    String getName();
}
