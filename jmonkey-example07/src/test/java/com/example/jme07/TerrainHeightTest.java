package com.example.jme07;

/**
 * Unit-Test für Terrain-Höhenberechnung (ohne JUnit)
 */
public class TerrainHeightTest {

    public static void main(String[] args) {
        TerrainHeightTest test = new TerrainHeightTest();
        test.testProceduralTileProviderHeights();
        test.testDistantChunks();  // NEU: Teste weit entfernte Chunks
        test.testHeightAtWorldCoordinates();
        test.testChunkBoundaries();
        System.out.println("\n=== ALL TESTS PASSED ===");
    }

    public void testProceduralTileProviderHeights() {
        // Erstelle ProceduralTileProvider
        ProceduralTileProvider provider = new ProceduralTileProvider(12345L, 0.02f, 40f);

        int chunkSize = 65;
        int chunkX = 0;
        int chunkZ = 0;

        // Hole Tile-Daten
        TerrainTile[] tiles = provider.getTileData(chunkX, chunkZ, chunkSize);

        System.out.println("=== Tile Heights for Chunk (0, 0) ===");

        // Teste einige Positionen
        for (int z = 0; z < 5; z++) {
            for (int x = 0; x < 5; x++) {
                int index = z * chunkSize + x;
                float height = tiles[index].getHeight();
                System.out.printf("Tile[%d,%d] (index=%d): height=%.2f, material=%s%n",
                    x, z, index, height, tiles[index].getMaterialKey());

                // Höhe sollte im vernünftigen Bereich sein (kann auch negativ sein)
                if (!(height >= -100 && height <= 100)) {
                    throw new AssertionError("Height at (" + x + "," + z + ") is " + height + ", should be -100 to 100");
                }
            }
        }
    }

    public void testDistantChunks() {
        System.out.println("\n=== Testing Distant Chunks ===");
        ProceduralTileProvider provider = new ProceduralTileProvider(12345L, 0.02f, 40f);
        int chunkSize = 65;

        // Teste verschiedene Chunk-Positionen
        int[][] chunkPositions = {
            {0, 0},       // Startpunkt
            {5, 5},       // Mittelweit
            {10, 10},     // Weit
            {20, 20},     // Sehr weit
            {-5, -5},     // Negativ
            {-10, -10},   // Weit negativ
        };

        for (int[] pos : chunkPositions) {
            int chunkX = pos[0];
            int chunkZ = pos[1];

            TerrainTile[] tiles = provider.getTileData(chunkX, chunkZ, chunkSize);

            // Teste ein paar Tiles in diesem Chunk
            System.out.printf("\nChunk (%d, %d):%n", chunkX, chunkZ);
            for (int i = 0; i < Math.min(5, tiles.length); i++) {
                float height = tiles[i].getHeight();
                int localX = i % chunkSize;
                int localZ = i / chunkSize;
                int worldX = chunkX * (chunkSize - 1) + localX;
                int worldZ = chunkZ * (chunkSize - 1) + localZ;

                System.out.printf("  World(%d,%d) -> height=%.2f, material=%s%n",
                    worldX, worldZ, height, tiles[i].getMaterialKey());

                if (!(height >= -100 && height <= 200)) {
                    throw new AssertionError("Height at chunk (" + chunkX + "," + chunkZ +
                        ") tile " + i + " is " + height + ", should be -100 to 200");
                }
            }

            // Teste auch das Zentrum des Chunks
            int centerIndex = (chunkSize / 2) * chunkSize + (chunkSize / 2);
            float centerHeight = tiles[centerIndex].getHeight();
            int centerWorldX = chunkX * (chunkSize - 1) + (chunkSize / 2);
            int centerWorldZ = chunkZ * (chunkSize - 1) + (chunkSize / 2);
            System.out.printf("  Center World(%d,%d) -> height=%.2f%n",
                centerWorldX, centerWorldZ, centerHeight);
        }
    }

    public void testSpriteHeightCalculation() {
        // Erstelle Provider
        ProceduralTileProvider tileProvider = new ProceduralTileProvider(12345L, 0.02f, 40f);
        ProceduralSpriteProvider spriteProvider = new ProceduralSpriteProvider(12345L, tileProvider, 65);

        int chunkX = 0;
        int chunkZ = 0;
        int chunkSize = 65;

        // Hole Tile-Daten
        TerrainTile[] tiles = tileProvider.getTileData(chunkX, chunkZ, chunkSize);

        // Generiere Sprites
        var sprites = spriteProvider.getSprites(chunkX, chunkZ, chunkSize, tiles);

        System.out.println("\n=== Sprite Positions ===");
        System.out.println("Generated " + sprites.size() + " sprites");

        for (int i = 0; i < Math.min(10, sprites.size()); i++) {
            Sprite sprite = sprites.get(i);
            float spriteX = sprite.getPosition().x;
            float spriteY = sprite.getPosition().y;
            float spriteZ = sprite.getPosition().z;

            System.out.printf("Sprite %d: pos=(%.2f, %.2f, %.2f), scale=%.2f, isBig=%s%n",
                i, spriteX, spriteY, spriteZ, sprite.getScale(), sprite.isBig());

            // Berechne welches Tile das ist
            int localX = (int) (spriteX - chunkX * (chunkSize - 1));
            int localZ = (int) (spriteZ - chunkZ * (chunkSize - 1));

            if (localX >= 0 && localX < chunkSize && localZ >= 0 && localZ < chunkSize) {
                int index = localZ * chunkSize + localX;
                float tileHeight = tiles[index].getHeight();

                System.out.printf("  -> Tile[%d,%d]: height=%.2f, material=%s%n",
                    localX, localZ, tileHeight, tiles[index].getMaterialKey());

                // Sprite Y-Position sollte gleich Tile-Höhe sein
                float diff = Math.abs(tileHeight - spriteY);
                if (diff > 0.01f) {
                    throw new AssertionError("Sprite " + i + " at (" + spriteX + "," + spriteZ + ") has Y=" + spriteY +
                        " but tile height is " + tileHeight + " (diff=" + diff + ")");
                }
            }
        }
    }

    public void testHeightAtWorldCoordinates() {
        // Teste die Logik von getTerrainHeightAt ohne JME
        ProceduralTileProvider provider = new ProceduralTileProvider(12345L, 0.02f, 40f);

        int chunkSize = 65;

        System.out.println("\n=== World Coordinate Height Tests ===");

        // Teste verschiedene Weltkoordinaten
        float[][] testPositions = {
            {0f, 0f},      // Chunk (0,0) - Tile (0,0)
            {10f, 10f},    // Chunk (0,0) - Tile (10,10)
            {64f, 64f},    // Chunk (1,1) - Tile (0,0)
            {128f, 128f},  // Chunk (2,2) - Tile (0,0)
            {-64f, -64f},  // Chunk (-1,-1) - Tile (0,0)
        };

        for (float[] pos : testPositions) {
            float worldX = pos[0];
            float worldZ = pos[1];

            // Berechne Chunk (wie in getTerrainHeightAt)
            int chunkX = (int) Math.floor(worldX / (chunkSize - 1));
            int chunkZ = (int) Math.floor(worldZ / (chunkSize - 1));

            // Lokale Koordinaten
            float localX = worldX - (chunkX * (chunkSize - 1));
            float localZ = worldZ - (chunkZ * (chunkSize - 1));

            // Array-Index
            int ix = (int) Math.floor(localX);
            int iz = (int) Math.floor(localZ);

            // Clamp
            if (ix < 0) ix = 0;
            if (ix >= chunkSize) ix = chunkSize - 1;
            if (iz < 0) iz = 0;
            if (iz >= chunkSize) iz = chunkSize - 1;

            int index = iz * chunkSize + ix;

            // Hole Tile-Daten
            TerrainTile[] tiles = provider.getTileData(chunkX, chunkZ, chunkSize);
            float height = tiles[index].getHeight();

            System.out.printf("World(%.0f,%.0f) -> Chunk(%d,%d) Local(%.1f,%.1f) -> Tile[%d,%d] (index=%d) -> height=%.2f%n",
                worldX, worldZ, chunkX, chunkZ, localX, localZ, ix, iz, index, height);

            // Höhe sollte vernünftig sein (kann auch negativ sein)
            if (!(height >= -100 && height <= 100)) {
                throw new AssertionError("Height at world (" + worldX + "," + worldZ + ") is " + height);
            }
        }
    }

    public void testChunkBoundaries() {
        // Teste Positionen an Chunk-Grenzen
        ProceduralTileProvider provider = new ProceduralTileProvider(12345L, 0.02f, 40f);
        int chunkSize = 65;

        System.out.println("\n=== Chunk Boundary Tests ===");

        // Teste Position genau an der Grenze zwischen Chunk 0 und Chunk 1
        float boundaryX = 64f; // (chunkSize - 1)
        float[] testZ = {0f, 32f, 64f};

        for (float z : testZ) {
            // Chunk 0
            {
                int chunkX = 0;
                int chunkZ = (int) Math.floor(z / (chunkSize - 1));
                float localX = boundaryX - (chunkX * (chunkSize - 1));
                float localZ = z - (chunkZ * (chunkSize - 1));

                int ix = (int) Math.floor(localX);
                int iz = (int) Math.floor(localZ);

                if (ix >= 0 && ix < chunkSize && iz >= 0 && iz < chunkSize) {
                    TerrainTile[] tiles = provider.getTileData(chunkX, chunkZ, chunkSize);
                    int index = iz * chunkSize + ix;
                    float height = tiles[index].getHeight();

                    System.out.printf("Boundary X=%.0f Z=%.0f Chunk(%d,%d): Local(%.1f,%.1f) Tile[%d,%d] height=%.2f%n",
                        boundaryX, z, chunkX, chunkZ, localX, localZ, ix, iz, height);
                }
            }
        }
    }
}
