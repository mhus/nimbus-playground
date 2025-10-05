package com.example.jmonkeyexample06;

/**
 * Hauptklasse für jMonkey Engine Hybrid World mit TileProvider.
 * Kombiniert TileProviderService04 mit erweiterten Rendering-Features.
 */
public class JMonkeyExample06Application {

    public static void main(String[] args) {
        System.out.println("=== jMonkey Engine Hybrid World mit TileProvider ===");
        System.out.println("Starte hybride 3D-Welt mit dynamischem Terrain...");

        try {
            // Erstelle und starte JMonkey Manager
            JMonkeyService06 manager = new JMonkeyService06();

            // Zeige Terrain-Informationen
            TileProviderService06 tileService = manager.getTileProviderService();
            System.out.println("\nHybride Welt-System initialisiert:");
            System.out.println("- TileProvider-basiertes Terrain");
            System.out.println("- Dynamisches Chunk-Loading");
            System.out.println("- Erweiterte Atmosphären-Effekte");
            System.out.println("- Skybox, Wolken, Nebel und Sonne");
            System.out.println("- 8 verschiedene Biome verfügbar");

            System.out.println("\nVerfügbare Biome:");
            for (TileProviderService06.TileType type : TileProviderService06.TileType.values()) {
                System.out.println("  " + tileService.getTileInfo(type));
            }

            System.out.println("\nSteuerung:");
            System.out.println("  WASD - Kamera bewegen");
            System.out.println("  Maus - Kamera drehen");
            System.out.println("  F - Wechsel zwischen Walk- und Fly-Modus");
            System.out.println("  Space - Springen (im Walk-Modus)");
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
