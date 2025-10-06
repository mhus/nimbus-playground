package com.example.jme07;

/**
 * Repräsentiert eine Anfrage zum Laden eines Chunks
 */
public class ChunkLoadRequest {
    private final int chunkX;
    private final int chunkZ;
    private final long requestTime;

    public ChunkLoadRequest(int chunkX, int chunkZ) {
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.requestTime = System.currentTimeMillis();
    }

    public int getChunkX() {
        return chunkX;
    }

    public int getChunkZ() {
        return chunkZ;
    }

    public long getRequestTime() {
        return requestTime;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ChunkLoadRequest that = (ChunkLoadRequest) o;
        return chunkX == that.chunkX && chunkZ == that.chunkZ;
    }

    @Override
    public int hashCode() {
        return 31 * chunkX + chunkZ;
    }

    @Override
    public String toString() {
        return "ChunkLoadRequest{" + chunkX + "," + chunkZ + "}";
    }
}
