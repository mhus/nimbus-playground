package com.example.jmonkeyexample05;

/**
 * Hauptklasse für jMonkey Engine Erweiterte Features Anwendung.
 * Standalone Version mit erweiterten 3D-Features.
 */
public class JMonkeyExample05Application {

    public static void main(String[] args) {
        System.out.println("=== jMonkey Engine Erweiterte Features Anwendung ===");
        System.out.println("Starte erweiterte 3D-Engine...");

        try {
            // Erstelle und starte JMonkey Manager
            JMonkeyService05 manager = new JMonkeyService05();

            System.out.println("\nErweiterte Features:");
            System.out.println("- Physik-Simulation");
            System.out.println("- Partikel-Effekte");
            System.out.println("- Beleuchtung und Schatten");
            System.out.println("- Terrain-System");

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
