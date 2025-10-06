package com.example.jme07;

import java.util.List;
import java.util.Map;

/**
 * Enthält die geladenen Daten eines Chunks (Terrain-Tiles und Sprites)
 */
public class LoadedChunk {
    private final int chunkX;
    private final int chunkZ;
    private final Map<String, TerrainTile> tiles;
    private final List<Sprite> sprites;
    private final long loadTime;

    public LoadedChunk(int chunkX, int chunkZ, Map<String, TerrainTile> tiles, List<Sprite> sprites) {
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.tiles = tiles;
        this.sprites = sprites;
        this.loadTime = System.currentTimeMillis();
    }

    public int getChunkX() {
        return chunkX;
    }

    public int getChunkZ() {
        return chunkZ;
    }

    public Map<String, TerrainTile> getTiles() {
        return tiles;
    }

    public List<Sprite> getSprites() {
        return sprites;
    }

    public long getLoadTime() {
        return loadTime;
    }

    public String getKey() {
        return chunkX + "," + chunkZ;
    }
}
