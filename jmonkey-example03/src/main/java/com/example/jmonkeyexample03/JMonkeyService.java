package com.example.jmonkeyexample03;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * JMonkey Service, der den JMonkeyManager und TileProviderService verwendet.
 *
 * Dieser Service stellt eine Abstraktionsschicht zwischen Spring Boot
 * und der jMonkey Engine zur Verfügung und bietet TileMap-spezifische Funktionen.
 */
@Service
public class JMonkeyService {

    private final JMonkeyManager jmonkeyManager;
    private final TileProviderService tileProviderService;

    @Autowired
    public JMonkeyService(JMonkeyManager jmonkeyManager, TileProviderService tileProviderService) {
        this.jmonkeyManager = jmonkeyManager;
        this.tileProviderService = tileProviderService;
    }

    /**
     * Startet die jMonkey Engine über den Manager.
     */
    public void startEngine() {
        jmonkeyManager.start();
    }

    /**
     * Stoppt die jMonkey Engine über den Manager.
     */
    public void stopEngine() {
        jmonkeyManager.stop();
    }

    /**
     * Prüft, ob die Engine läuft.
     */
    public boolean isEngineRunning() {
        return jmonkeyManager.getApp() != null;
    }

    /**
     * Gibt den JMonkeyManager zurück für erweiterte Operationen.
     */
    public JMonkeyManager getManager() {
        return jmonkeyManager;
    }

    /**
     * Gibt den TileProviderService zurück.
     */
    public TileProviderService getTileProviderService() {
        return tileProviderService;
    }

    /**
     * Lädt Tile-Informationen für bestimmte Koordinaten.
     */
    public TileProviderService.Tile getTileAt(int x, int y) {
        return tileProviderService.getTile(x, y);
    }

    /**
     * Gibt Informationen über die geladene TileMap aus.
     */
    public void printTileMapInfo() {
        System.out.println("=== TileMap Information ===");
        System.out.println("Verfügbare Tile-Typen:");
        for (TileProviderService.TileType type : TileProviderService.TileType.values()) {
            System.out.println("  " + tileProviderService.getTileInfo(type));
        }

        // Beispiel-Tiles zeigen
        System.out.println("\nBeispiel-Tiles um Position (0,0):");
        for (int y = -2; y <= 2; y++) {
            for (int x = -2; x <= 2; x++) {
                TileProviderService.Tile tile = tileProviderService.getTile(x, y);
                System.out.printf("(%2d,%2d): %s (H:%.1f) ",
                    x, y, tile.getType().name().substring(0, 1), tile.getHeight());
            }
            System.out.println();
        }
    }
}
