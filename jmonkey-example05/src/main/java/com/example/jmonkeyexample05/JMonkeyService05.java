package com.example.jmonkeyexample05;

/**
 * JMonkey Manager für erweiterte 3D Features.
 * Standalone Version mit Physik, Partikeln und erweiterten Effekten.
 */
public class JMonkeyService05 {

    private static JMonkeyService05 instance;
    private AdvancedApp05 jmonkeyApp;

    public JMonkeyService05() {
        instance = this;
    }

    /**
     * Statischer Zugriff auf die JMonkeyManager Instanz.
     * @return die Singleton-Instanz
     */
    public static JMonkeyService05 instance() {
        return instance;
    }

    /**
     * Startet die jMonkey Engine Anwendung.
     * Muss im Main Thread aufgerufen werden!
     */
    public void start() {
        jmonkeyApp = new AdvancedApp05();

        // Konfiguriere großes Fenster
        jmonkeyApp.setShowSettings(false);
        jmonkeyApp.setPauseOnLostFocus(false);

        // Setze große Fenster-Einstellungen
        com.jme3.system.AppSettings settings = new com.jme3.system.AppSettings(true);
        settings.setFullscreen(false);
        settings.setVSync(true);
        settings.setResolution(1600, 1000);
        settings.setTitle("jMonkey Engine - Erweiterte Features (Example 05)");
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
    public AdvancedApp05 getApp() {
        return jmonkeyApp;
    }
}
