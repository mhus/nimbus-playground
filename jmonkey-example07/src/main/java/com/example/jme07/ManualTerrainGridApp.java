package com.example.jme07;

import com.jme3.app.SimpleApplication;
import com.jme3.input.KeyInput;
import com.jme3.input.controls.ActionListener;
import com.jme3.input.controls.KeyTrigger;
import com.jme3.math.Vector3f;

import java.util.ArrayList;
import java.util.List;

/**
 * Manuelles dynamisches Terrain-Loading ohne TerrainGrid.
 * Wir verwalten die Chunks selbst basierend auf der Kamera-Position.
 */
public class ManualTerrainGridApp extends SimpleApplication {

    // Movement modes
    private boolean isWalkMode = true; // Default: Walk Mode
    private static final float GRAVITY = -30f;
    private float verticalVelocity = 0f;

    // Layer System - Liste aller Layer
    private List<Layer> layers = new ArrayList<>();
    private TerrainLayer terrainLayer; // Spezielle Referenz für Terrain-Kollision
    private EffectLayer effectLayer; // Effekte wie Nebel

    @Override
    public void simpleInitApp() {
        setDisplayFps(true);
        setDisplayStatView(true);

        initKeys();
        initLayers();

        // Kamera
        cam.setLocation(new Vector3f(64, 80, 64));
        cam.lookAt(new Vector3f(128, 0, 128), Vector3f.UNIT_Y);
        flyCam.setMoveSpeed(50f);

        System.out.println("\n=== ManualTerrainGridApp gestartet ===");
        System.out.println("Modus: WALK MODE (Drücke 'F' zum Umschalten)");
    }

    private void initLayers() {
        // Layer-System: Terrain -> Sky -> Backdrop -> Fog
        // Reihenfolge wichtig für korrektes Rendering

        System.out.println("\n=== Initialisiere Layer-System ===");

        // 0. Terrain Layer - Dynamisches Terrain mit Chunk-Loading
        terrainLayer = new TerrainLayer(assetManager, rootNode, cam);
        layers.add(terrainLayer);

        // 1. Sky Layer - Himmel im Hintergrund mit Sonnen-Glow
        layers.add(new SkyLayer(assetManager, rootNode, cam, viewPort));

        // 2. Backdrop Layer - Ferne Berge/Landschaft
        layers.add(new BackdropLayer(assetManager, rootNode, cam));

        // 3. Effect Layer - Nebel und andere Effekte
        effectLayer = new EffectLayer(assetManager, rootNode, cam);

        System.out.println("=== " + layers.size() + " Layer initialisiert + EffectLayer ===\n");
        for (Layer layer : layers) {
            System.out.println("  - " + layer.getName());
        }
    }


    private void initKeys() {
        // Toggle zwischen Walk und Flight Mode mit 'F'
        inputManager.addMapping("ToggleMode", new KeyTrigger(KeyInput.KEY_F));
        inputManager.addListener(actionListener, "ToggleMode");
    }

    private final ActionListener actionListener = (name, isPressed, tpf) -> {
        if (name.equals("ToggleMode") && isPressed) {
            isWalkMode = !isWalkMode;
            String mode = isWalkMode ? "WALK MODE" : "FLIGHT MODE";
            System.out.println("Modus gewechselt zu: " + mode);

            if (!isWalkMode) {
                // Im Flight Mode: Vertikale Geschwindigkeit zurücksetzen
                verticalVelocity = 0f;
            }
        }
    };


    @Override
    public void simpleUpdate(float tpf) {
        // Update alle Layer
        for (Layer layer : layers) {
            layer.update(tpf);
        }

        // Update EffectLayer (Nebel folgt Kamera)
        if (effectLayer != null) {
            effectLayer.update(tpf);
        }

        // Walk-Modus Physik (wie in example04)
        Vector3f camPos = cam.getLocation();
        float terrainHeight = terrainLayer.getTerrainHeight(camPos.x, camPos.z);
        float groundHeight = terrainHeight + terrainLayer.getGroundOffset();
        if (isWalkMode) {

            // Anwenden der Gravitation wenn über dem Boden
            if (camPos.y > groundHeight) {
                verticalVelocity += GRAVITY * tpf;
            } else {
                // Kamera ist am Boden
                camPos.y = groundHeight;
                verticalVelocity = 0;
            }

            // Anwenden der vertikalen Bewegung
            if (camPos.y > groundHeight) {
                camPos.y += verticalVelocity * tpf;
            }
            if (camPos.y <= groundHeight) {
                camPos.y = groundHeight;
                verticalVelocity = 0;
            }

            cam.setLocation(camPos);
        } else {
            // Im Flight Mode: Stelle sicher, dass wir nicht unter dem Terrain sind

            if (camPos.y < groundHeight) {
                camPos.y = groundHeight;
                cam.setLocation(camPos);
            }
        }
    }
}
