package com.example.jmonkeyexample04;

/**
 * Hauptklasse für jMonkey Engine TileMap Anwendung.
 * Standalone Version ohne Spring Boot Framework.
 */
public class JMonkeyExample04Application {

    public static void main(String[] args) {
        System.out.println("=== jMonkey Engine TileMap Standalone Anwendung ===");
        System.out.println("Starte 3D Terrain-Engine...");

        try {
            // Erstelle und starte JMonkey Manager
            JMonkeyService04 manager = new JMonkeyService04();

            // Zeige Terrain-Informationen
            TileProviderService04 tileService = manager.getTileProviderService();
            System.out.println("\nTerrain-System initialisiert:");
            System.out.println("- Weltgröße: 200x200 Chunks");
            System.out.println("- Chunk-Größe: 16x16 Tiles");
            System.out.println("- Dynamisches Loading aktiviert");
            System.out.println("- 8 verschiedene Biome verfügbar");

            System.out.println("\nVerfügbare Biome:");
            for (TileProviderService04.TileType type : TileProviderService04.TileType.values()) {
                System.out.println("  " + tileService.getTileInfo(type));
            }

            System.out.println("\nSteuerung:");
            System.out.println("  WASD - Kamera bewegen");
            System.out.println("  Maus - Kamera drehen");
            System.out.println("  F - Wechsel zwischen Walk- und Fly-Modus (Standard: Walk)");
            System.out.println("  Space - Springen (nur im Walk-Modus)");
            System.out.println("  ESC - Anwendung beenden");

            System.out.println("\nStarte jMonkey Engine...");

            // Starte die Engine (blockiert bis Fenster geschlossen wird)
            manager.start();

        } catch (Exception e) {
            System.err.println("Fehler beim Starten der Anwendung: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
