package com.example.jme07;

import java.util.*;
import java.util.concurrent.*;

/**
 * Background-Thread der Chunks asynchron lädt
 */
public class ChunkLoader {

    private final TileProvider tileProvider;
    private final SpriteProvider spriteProvider;

    // Thread-safe Queue für Load-Requests
    private final BlockingQueue<ChunkLoadRequest> requestQueue = new LinkedBlockingQueue<>();

    // Thread-safe Map für geladene Chunks
    private final ConcurrentHashMap<String, LoadedChunk> loadedChunks = new ConcurrentHashMap<>();

    // Set für Chunks die gerade geladen werden
    private final Set<String> loadingChunks = ConcurrentHashMap.newKeySet();

    private final ExecutorService executor;
    private volatile boolean running = true;

    public ChunkLoader(TileProvider tileProvider, SpriteProvider spriteProvider) {
        this.tileProvider = tileProvider;
        this.spriteProvider = spriteProvider;

        // Single background thread für Chunk-Loading
        this.executor = Executors.newSingleThreadExecutor(r -> {
            Thread t = new Thread(r, "ChunkLoader-Thread");
            t.setDaemon(true);
            return t;
        });

        // Starte Background-Thread
        executor.submit(this::processRequests);
    }

    /**
     * Fordert einen Chunk an (non-blocking)
     */
    public void requestChunk(int chunkX, int chunkZ) {
        String key = makeKey(chunkX, chunkZ);

        // Skip wenn bereits geladen oder gerade am Laden
        if (loadedChunks.containsKey(key) || loadingChunks.contains(key)) {
            return;
        }

        // Markiere als "wird geladen"
        loadingChunks.add(key);

        // Füge Request zur Queue hinzu
        ChunkLoadRequest request = new ChunkLoadRequest(chunkX, chunkZ);
        requestQueue.offer(request);
    }

    /**
     * Holt einen geladenen Chunk (oder null wenn noch nicht fertig)
     */
    public LoadedChunk getLoadedChunk(int chunkX, int chunkZ) {
        String key = makeKey(chunkX, chunkZ);
        return loadedChunks.get(key);
    }

    /**
     * Entfernt einen Chunk aus dem Cache
     */
    public void unloadChunk(int chunkX, int chunkZ) {
        String key = makeKey(chunkX, chunkZ);
        loadedChunks.remove(key);
        loadingChunks.remove(key);
    }

    /**
     * Background-Thread: Verarbeitet Load-Requests
     */
    private void processRequests() {
        System.out.println("ChunkLoader Background-Thread gestartet");

        while (running) {
            try {
                // Warte auf nächsten Request (blocking)
                ChunkLoadRequest request = requestQueue.poll(100, TimeUnit.MILLISECONDS);

                if (request != null) {
                    loadChunk(request);
                }

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                System.err.println("FEHLER beim Chunk-Loading: " + e.getMessage());
                e.printStackTrace();
            }
        }

        System.out.println("ChunkLoader Background-Thread beendet");
    }

    /**
     * Lädt einen Chunk (synchron, läuft im Background-Thread)
     */
    private void loadChunk(ChunkLoadRequest request) {
        int chunkX = request.getChunkX();
        int chunkZ = request.getChunkZ();
        String key = makeKey(chunkX, chunkZ);

        try {
            long startTime = System.currentTimeMillis();

            // Lade Tiles (Array -> Map conversion)
            TerrainTile[] tileArray = tileProvider.getTileData(chunkX, chunkZ, 65); // CHUNK_SIZE = 65
            Map<String, TerrainTile> tiles = new java.util.HashMap<>();

            for (int z = 0; z < 65; z++) {
                for (int x = 0; x < 65; x++) {
                    int worldX = chunkX * 64 + x; // CHUNK_SIZE - 1 = 64
                    int worldZ = chunkZ * 64 + z;
                    String tileKey = worldX + "," + worldZ;
                    tiles.put(tileKey, tileArray[z * 65 + x]);
                }
            }

            // Lade Sprites (alle Sprites, bigOnly=false im Background)
            List<Sprite> sprites = spriteProvider.getSprites(chunkX, chunkZ, 65, tileArray);

            // Erstelle LoadedChunk
            LoadedChunk chunk = new LoadedChunk(chunkX, chunkZ, tiles, sprites);

            // Speichere in Cache
            loadedChunks.put(key, chunk);
            loadingChunks.remove(key);

            long duration = System.currentTimeMillis() - startTime;
            System.out.println("Chunk geladen: " + key + " (" + duration + "ms, " +
                             tiles.size() + " tiles, " + sprites.size() + " sprites)");

        } catch (Exception e) {
            System.err.println("FEHLER beim Laden von Chunk " + key + ": " + e.getMessage());
            loadingChunks.remove(key);
        }
    }

    /**
     * Gibt Anzahl der wartenden Requests zurück
     */
    public int getPendingRequestCount() {
        return requestQueue.size() + loadingChunks.size();
    }

    /**
     * Gibt Anzahl der geladenen Chunks zurück
     */
    public int getLoadedChunkCount() {
        return loadedChunks.size();
    }

    /**
     * Shutdown des ChunkLoaders
     */
    public void shutdown() {
        running = false;
        executor.shutdown();
        try {
            if (!executor.awaitTermination(2, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    private String makeKey(int chunkX, int chunkZ) {
        return chunkX + "," + chunkZ;
    }
}
