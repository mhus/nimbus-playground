package com.example.jmonkeyexample06;

/**
 * JMonkey Manager für Hybrid World mit TileProvider und erweiterten Rendering-Features.
 * Kombiniert TileProviderService mit atmosphärischen Effekten.
 */
public class JMonkeyService06 {

    private static JMonkeyService06 instance;
    private HybridWorldApp06 jmonkeyApp;
    private TileProviderService06 tileProviderService;

    public JMonkeyService06() {
        instance = this;
        this.tileProviderService = new TileProviderService06();
    }

    /**
     * Statischer Zugriff auf die JMonkeyManager Instanz.
     * @return die Singleton-Instanz
     */
    public static JMonkeyService06 instance() {
        return instance;
    }

    /**
     * Startet die jMonkey Engine Anwendung.
     * Muss im Main Thread aufgerufen werden!
     */
    public void start() {
        jmonkeyApp = new HybridWorldApp06(tileProviderService);

        // Konfiguriere großes Fenster
        jmonkeyApp.setShowSettings(false);
        jmonkeyApp.setPauseOnLostFocus(false);

        // Setze große Fenster-Einstellungen
        com.jme3.system.AppSettings settings = new com.jme3.system.AppSettings(true);
        settings.setFullscreen(false);
        settings.setVSync(true);
        settings.setResolution(1600, 1000);
        settings.setTitle("jMonkey Engine - Hybrid World mit TileProvider (Example 06)");
        settings.setResizable(true);

        jmonkeyApp.setSettings(settings);
        jmonkeyApp.start();
    }

    /**
     * Stoppt die jMonkey Engine Anwendung.
     */
    public void stop() {
        if (jmonkeyApp != null) {
            jmonkeyApp.stop();
        }
    }

    /**
     * Gibt die jMonkey App Instanz zurück.
     */
    public HybridWorldApp06 getApp() {
        return jmonkeyApp;
    }

    /**
     * Gibt den TileProviderService zurück.
     */
    public TileProviderService06 getTileProviderService() {
        return tileProviderService;
    }
}
