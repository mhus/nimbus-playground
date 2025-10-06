package com.example.jme07;

import java.util.Map;

/**
 * AbstractTileManipulator - Basisklasse für TileProvider die einen anderen
 * TileProvider wrappen und dessen Daten manipulieren.
 *
 * Implementiert Decorator-Pattern für TileProvider.
 */
public abstract class AbstractTileManipulator implements TileProvider {

    protected TileProvider baseProvider;

    public AbstractTileManipulator(TileProvider baseProvider) {
        this.baseProvider = baseProvider;
    }

    @Override
    public TerrainTile[] getTileData(int chunkX, int chunkZ, int size) {
        // Hole Basis-Daten vom ursprünglichen Provider
        TerrainTile[] baseTiles = baseProvider.getTileData(chunkX, chunkZ, size);

        // Manipuliere die Tiles (muss von Subklasse implementiert werden)
        return manipulateTiles(baseTiles, chunkX, chunkZ, size);
    }

    /**
     * Manipuliert die Tiles vom Basis-Provider.
     * Muss von Subklassen implementiert werden.
     *
     * @param baseTiles Original-Tiles vom Basis-Provider
     * @param chunkX X-Koordinate des Chunks
     * @param chunkZ Z-Koordinate des Chunks
     * @param size Größe des Chunks
     * @return Manipulierte Tiles
     */
    protected abstract TerrainTile[] manipulateTiles(TerrainTile[] baseTiles, int chunkX, int chunkZ, int size);

    @Override
    public Map<String, TerrainMaterial> getMaterials() {
        // Standard: Gibt Materialien vom Basis-Provider zurück
        // Kann überschrieben werden, um zusätzliche Materialien hinzuzufügen
        return baseProvider.getMaterials();
    }

    @Override
    public String getName() {
        return getClass().getSimpleName() + " -> " + baseProvider.getName();
    }

    /**
     * Gibt den Basis-Provider zurück
     */
    public TileProvider getBaseProvider() {
        return baseProvider;
    }
}
