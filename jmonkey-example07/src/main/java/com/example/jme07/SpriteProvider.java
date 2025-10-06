package com.example.jme07;

import com.jme3.math.Vector2f;
import java.util.List;

/**
 * SpriteProvider - Interface für Sprite-Generierung
 * Gibt Sprites für einen bestimmten Chunk zurück
 */
public interface SpriteProvider {

    /**
     * Gibt alle Sprites für einen Chunk zurück
     *
     * @param chunkX X-Koordinate des Chunks
     * @param chunkZ Z-Koordinate des Chunks
     * @param chunkSize Größe des Chunks
     * @return Liste von Sprites in diesem Chunk
     */
    List<Sprite> getSprites(int chunkX, int chunkZ, int chunkSize, TerrainTile[] tiles);

    /**
     * Gibt den Namen des Providers zurück
     */
    String getName();
}
