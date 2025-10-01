package com.example.jmonkeyexample03;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Service-Wrapper für JMonkey Engine Integration.
 * Stellt eine einfache API für den Zugriff auf Tile-Daten bereit.
 */
@Service
public class JMonkeyService {

    @Autowired
    private TileProviderService tileProviderService;

    @Autowired
    private JMonkeyManager jmonkeyManager;

    /**
     * Startet die JMonkey Engine Anwendung.
     */
    public void startEngine() {
        System.out.println("Starte JMonkey Engine...");
        jmonkeyManager.start();
    }

    /**
     * Stoppt die JMonkey Engine Anwendung.
     */
    public void stopEngine() {
        System.out.println("Stoppe JMonkey Engine...");
        jmonkeyManager.stop();
    }

    /**
     * Gibt Zugriff auf den TileProviderService.
     */
    public TileProviderService getTileProviderService() {
        return tileProviderService;
    }

    /**
     * Lädt einen Chunk und gibt ein Tile an der angegebenen Position zurück.
     */
    public TileProviderService.Tile getTileAt(int worldX, int worldY) {
        // Berechne Chunk-Koordinaten
        int chunkSize = 16;
        int chunkX = (int) Math.floor((double) worldX / chunkSize);
        int chunkY = (int) Math.floor((double) worldY / chunkSize);

        // Lokale Koordinaten innerhalb des Chunks
        int localX = worldX - (chunkX * chunkSize);
        int localY = worldY - (chunkY * chunkSize);

        // Stelle sicher, dass lokale Koordinaten im gültigen Bereich sind
        if (localX < 0) localX += chunkSize;
        if (localY < 0) localY += chunkSize;

        // Lade den Chunk
        TileProviderService.Tile[][] chunk = tileProviderService.loadChunk(chunkX, chunkY, chunkSize);

        // Gib das Tile zurück
        if (localX >= 0 && localX < chunkSize && localY >= 0 && localY < chunkSize) {
            return chunk[localX][localY];
        }

        return null;
    }

    /**
     * Zeigt Informationen über die geladene Welt an.
     */
    public void printWorldInfo() {
        System.out.println("=== JMonkey Engine Welt-Informationen ===");
        System.out.println("Geladene Chunks: " + tileProviderService.getLoadedChunkCount());
        System.out.println("Tile-Typen:");
        for (TileProviderService.TileType type : TileProviderService.TileType.values()) {
            System.out.println("  " + tileProviderService.getTileInfo(type));
        }

        System.out.println("\nBeispiel-Tiles aus verschiedenen Bereichen:");
        int[] positions = {0, 50, 100, -50, -100};
        for (int x : positions) {
            for (int y : positions) {
                TileProviderService.Tile tile = getTileAt(x, y);
                if (tile != null) {
                    System.out.println("  Position (" + x + ", " + y + "): " +
                                     tile.getType().name() + " (Höhe: " +
                                     String.format("%.1f", tile.getAverageHeight()) + ")");
                }
            }
        }
    }

    /**
     * Prüft ob die Engine läuft.
     */
    public boolean isEngineRunning() {
        return jmonkeyManager.getApp() != null;
    }

    /**
     * Gibt Statistiken über die Welt zurück.
     */
    public String getWorldStats() {
        return "Geladene Chunks: " + tileProviderService.getLoadedChunkCount() +
               ", Engine läuft: " + isEngineRunning();
    }
}
