package com.example.jmonkeyexample02;

/**
 * JMonkey Manager als Spring Singleton.
 *
 * Diese Klasse verwaltet die jMonkey Engine Anwendung und stellt sicher,
 * dass sie als Spring Bean verfügbar ist. Zusätzlich implementiert sie
 * das Singleton Pattern für direkten Zugriff.
 */
public class JMonkeyManager {

    private static JMonkeyManager instance;
    private SimpleJMonkeyApp jmonkeyApp;

    public JMonkeyManager() {
        instance = this;
    }

    /**
     * Statischer Zugriff auf die JMonkeyManager Instanz.
     *
     * @return die Singleton-Instanz
     */
    static synchronized JMonkeyManager instance() {
        if (instance == null) {
            instance = new JMonkeyManager();
        }
        return instance;
    }

    /**
     * Startet die jMonkey Engine Anwendung.
     * Muss im Main Thread aufgerufen werden!
     */
    public void start() {
        jmonkeyApp = new SimpleJMonkeyApp();
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
    public SimpleJMonkeyApp getApp() {
        return jmonkeyApp;
    }

}
