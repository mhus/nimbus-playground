package com.example.jmonkeyexample04;

/**
 * JMonkey Manager für TileMap-basierte 3D Welt mit fließenden Oberflächen.
 * Standalone Version ohne Spring Boot Dependencies.
 */
public class JMonkeyService04 {

    private static JMonkeyService04 instance;
    private TileMapApp04 jmonkeyApp;
    private TileProviderService04 tileProviderService;

    public JMonkeyService04() {
        instance = this;
        this.tileProviderService = new TileProviderService04();
    }

    /**
     * Statischer Zugriff auf die JMonkeyManager Instanz.
     * @return die Singleton-Instanz
     */
    public static JMonkeyService04 instance() {
        return instance;
    }

    /**
     * Startet die jMonkey Engine Anwendung.
     * Muss im Main Thread aufgerufen werden!
     */
    public void start() {
        jmonkeyApp = new TileMapApp04(tileProviderService);

        // Konfiguriere großes Fenster
        jmonkeyApp.setShowSettings(false);
        jmonkeyApp.setPauseOnLostFocus(false);

        // Setze große Fenster-Einstellungen
        com.jme3.system.AppSettings settings = new com.jme3.system.AppSettings(true);
        settings.setFullscreen(false);
        settings.setVSync(true);
        settings.setResolution(1400, 900);
        settings.setTitle("jMonkey Engine - TileMap 3D Welt (Standalone)");
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
    public TileMapApp04 getApp() {
        return jmonkeyApp;
    }

    /**
     * Gibt den TileProviderService zurück.
     */
    public TileProviderService04 getTileProviderService() {
        return tileProviderService;
    }

}
