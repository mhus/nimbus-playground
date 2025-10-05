package com.example.jme07;

import com.jme3.system.AppSettings;

/**
 * Main-Klasse zum Starten der TerrainApp
 */
public class Example07Main {

    public static void main(String[] args) {
        // Verwende ManualTerrainGridApp mit eigenem Chunk-Management
        ManualTerrainGridApp app = new ManualTerrainGridApp();

        // Konfiguriere App-Settings
        AppSettings settings = new AppSettings(true);
        settings.setTitle("JME07 - Dynamic TerrainGrid Example");
        settings.setResolution(1280, 720);
        settings.setVSync(true);
        settings.setSamples(4); // Anti-Aliasing

        app.setSettings(settings);
        app.setShowSettings(false); // Überspringe Settings-Dialog
        app.start();
    }
}
