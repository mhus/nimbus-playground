package com.example.jme07;

import com.jme3.math.Vector3f;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * ProceduralSpriteProvider - Generiert Sprites prozedural basierend auf Terrain
 * Verwendet Seed für deterministische Generierung
 */
public class ProceduralSpriteProvider implements SpriteProvider {

    private final long seed;
    private final TileProvider terrainProvider;
    private final int chunkSize;

    // Dichte-Parameter (Sprites pro Chunk)
    private static final int TREE_DENSITY = 5;
    private static final int BUSH_DENSITY = 10;
    private static final int GRASS_DENSITY = 20;
    private static final int ROCK_DENSITY = 3;
    private static final int MODEL_DENSITY = 2;  // 3D Modelle (seltener)

    public ProceduralSpriteProvider(long seed, TileProvider terrainProvider, int chunkSize) {
        this.seed = seed;
        this.terrainProvider = terrainProvider;
        this.chunkSize = chunkSize;
    }

    @Override
    public List<Sprite> getSprites(int chunkX, int chunkZ, int chunkSize, TerrainTile[] tiles) {
        List<Sprite> sprites = new ArrayList<>();

        // Deterministischer Random basierend auf Chunk-Koordinaten
        Random random = new Random(seed + chunkX * 73856093L + chunkZ * 19349663L);

        // Generiere Sprites basierend auf Terrain
        generateTreeSprites(sprites, random, tiles, chunkX, chunkZ, chunkSize);
        generateBushSprites(sprites, random, tiles, chunkX, chunkZ, chunkSize);
        generateRockSprites(sprites, random, tiles, chunkX, chunkZ, chunkSize);
        generateGrassSprites(sprites, random, tiles, chunkX, chunkZ, chunkSize);

        // Generiere 3D Model Sprites (immer, auch bei bigOnly)
        generateModelSprites(sprites, random, tiles, chunkX, chunkZ, chunkSize);

        return sprites;
    }

    private void generateTreeSprites(List<Sprite> sprites, Random random, TerrainTile[] tiles, int chunkX, int chunkZ, int chunkSize) {
        for (int i = 0; i < TREE_DENSITY; i++) {
            // Zufällige Position im Chunk
            int localX = random.nextInt(chunkSize);
            int localZ = random.nextInt(chunkSize);
            int index = localZ * chunkSize + localX;

            if (index >= 0 && index < tiles.length) {
                TerrainTile tile = tiles[index];

                // Bäume nur auf Gras, nicht auf Straßen oder im Wasser
                if (!tile.hasWater() && tile.getMaterialKey().equals("grass")) {
                    float worldX = chunkX * (chunkSize - 1) + localX;
                    float worldZ = chunkZ * (chunkSize - 1) + localZ;
                    float height = tile.getHeight();

                    Vector3f position = new Vector3f(worldX, height, worldZ);
                    sprites.add(SpriteBuilders.createRandomTree(position, random));
                }
            }
        }
    }

    private void generateBushSprites(List<Sprite> sprites, Random random, TerrainTile[] tiles, int chunkX, int chunkZ, int chunkSize) {
        for (int i = 0; i < BUSH_DENSITY; i++) {
            int localX = random.nextInt(chunkSize);
            int localZ = random.nextInt(chunkSize);
            int index = localZ * chunkSize + localX;

            if (index >= 0 && index < tiles.length) {
                TerrainTile tile = tiles[index];

                if (!tile.hasWater() && !tile.getMaterialKey().startsWith("road")) {
                    float worldX = chunkX * (chunkSize - 1) + localX;
                    float worldZ = chunkZ * (chunkSize - 1) + localZ;
                    float height = tile.getHeight();

                    Vector3f position = new Vector3f(worldX, height, worldZ);
                    sprites.add(SpriteBuilders.createRandomBush(position, random));
                }
            }
        }
    }

    private void generateRockSprites(List<Sprite> sprites, Random random, TerrainTile[] tiles, int chunkX, int chunkZ, int chunkSize) {
        for (int i = 0; i < ROCK_DENSITY; i++) {
            int localX = random.nextInt(chunkSize);
            int localZ = random.nextInt(chunkSize);
            int index = localZ * chunkSize + localX;

            if (index >= 0 && index < tiles.length) {
                TerrainTile tile = tiles[index];

                // Steine vor allem auf felsigem Terrain
                if (!tile.hasWater() && (tile.getMaterialKey().equals("rock") || random.nextFloat() < 0.3f)) {
                    float worldX = chunkX * (chunkSize - 1) + localX;
                    float worldZ = chunkZ * (chunkSize - 1) + localZ;
                    float height = tile.getHeight();

                    Vector3f position = new Vector3f(worldX, height, worldZ);
                    sprites.add(SpriteBuilders.createRandomRock(position, random));
                }
            }
        }
    }

    private void generateGrassSprites(List<Sprite> sprites, Random random, TerrainTile[] tiles, int chunkX, int chunkZ, int chunkSize) {
        for (int i = 0; i < GRASS_DENSITY; i++) {
            int localX = random.nextInt(chunkSize);
            int localZ = random.nextInt(chunkSize);
            int index = localZ * chunkSize + localX;

            if (index >= 0 && index < tiles.length) {
                TerrainTile tile = tiles[index];

                // Gras-Sprites überall außer auf Straßen und Wasser
                if (!tile.hasWater() && !tile.getMaterialKey().startsWith("road")) {
                    float worldX = chunkX * (chunkSize - 1) + localX;
                    float worldZ = chunkZ * (chunkSize - 1) + localZ;
                    float height = tile.getHeight();

                    Vector3f position = new Vector3f(worldX, height, worldZ);
                    sprites.add(SpriteBuilders.createRandomGrass(position, random));
                }
            }
        }
    }

    private void generateModelSprites(List<Sprite> sprites, Random random, TerrainTile[] tiles, int chunkX, int chunkZ, int chunkSize) {
        for (int i = 0; i < MODEL_DENSITY; i++) {
            int localX = random.nextInt(chunkSize);
            int localZ = random.nextInt(chunkSize);
            int index = localZ * chunkSize + localX;

            if (index >= 0 && index < tiles.length) {
                TerrainTile tile = tiles[index];

                // Models nur auf Gras, nicht auf Straßen oder im Wasser
                if (!tile.hasWater() && tile.getMaterialKey().equals("grass")) {
                    float worldX = chunkX * (chunkSize - 1) + localX;
                    float worldZ = chunkZ * (chunkSize - 1) + localZ;
                    float height = tile.getHeight();

                    Vector3f position = new Vector3f(worldX, height, worldZ);
                    sprites.add(SpriteBuilders.createRandomModel(position, random));
                }
            }
        }
    }

    @Override
    public String getName() {
        return "ProceduralSpriteProvider(seed=" + seed + ", densities=[trees=" + TREE_DENSITY +
                ", bushes=" + BUSH_DENSITY + ", rocks=" + ROCK_DENSITY + ", grass=" + GRASS_DENSITY +
                ", models=" + MODEL_DENSITY + "])";
    }
}
