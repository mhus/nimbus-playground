package com.example.jme07;

import com.jme3.app.SimpleApplication;
import com.jme3.light.AmbientLight;
import com.jme3.light.DirectionalLight;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.math.Vector3f;
import com.jme3.terrain.geomipmap.TerrainQuad;
import com.jme3.terrain.heightmap.AbstractHeightMap;
import com.jme3.terrain.heightmap.ImageBasedHeightMap;
import com.jme3.texture.Texture;

/**
 * Vereinfachte Terrain-App mit einem einzelnen TerrainQuad zum Testen.
 */
public class SimpleTerrainApp extends SimpleApplication {

    private TileProvider tileProvider;

    @Override
    public void simpleInitApp() {
        // FPS und Stats
        setDisplayFps(true);
        setDisplayStatView(true);

        // Hintergrund
        viewPort.setBackgroundColor(new ColorRGBA(0.5f, 0.7f, 1.0f, 1.0f));

        // Initialisiere
        initTileProvider();
        initLighting();
        initTerrain();

        // Kamera
        cam.setLocation(new Vector3f(128, 80, 128));
        cam.lookAt(new Vector3f(128, 0, 200), Vector3f.UNIT_Y);

        flyCam.setMoveSpeed(50f);

        System.out.println("\n=== SimpleTerrainApp gestartet ===");
        System.out.println("Steuerung: WASD + Maus");
    }

    private void initTileProvider() {
        tileProvider = new ProceduralTileProvider(12345L, 0.02f, 40f);
        System.out.println("TileProvider: " + tileProvider.getName());
    }

    private void initTerrain() {
        int terrainSize = 257; // Muss 2^n + 1 sein (65, 129, 257, 513, etc.)

        // Hole Höhendaten für Chunk (0,0)
        float[] heightData = tileProvider.getHeightData(0, 0, terrainSize);

        System.out.println("Höhendaten erhalten: " + heightData.length + " Werte");
        System.out.println("Erste Werte: " + heightData[0] + ", " + heightData[1] + ", " + heightData[2]);

        // Erstelle TerrainQuad
        TerrainQuad terrain = new TerrainQuad("terrain", terrainSize, terrainSize, heightData);

        // Material
        Material mat = new Material(assetManager, "Common/MatDefs/Light/Lighting.j3md");

        try {
            Texture grass = assetManager.loadTexture("Textures/Terrain/splat/grass.jpg");
            grass.setWrap(Texture.WrapMode.Repeat);
            mat.setTexture("DiffuseMap", grass);
            mat.setFloat("Shininess", 1f);
            System.out.println("Textur geladen");
        } catch (Exception e) {
            System.out.println("Textur nicht gefunden, verwende Farbe");
            mat.setColor("Diffuse", new ColorRGBA(0.3f, 0.7f, 0.3f, 1.0f));
            mat.setColor("Ambient", new ColorRGBA(0.3f, 0.7f, 0.3f, 1.0f));
        }

        terrain.setMaterial(mat);
        terrain.setLocalTranslation(0, 0, 0);
        terrain.setLocalScale(1f, 1f, 1f);

        rootNode.attachChild(terrain);

        System.out.println("Terrain erstellt und zur Szene hinzugefügt");
        System.out.println("Terrain Position: " + terrain.getLocalTranslation());
        System.out.println("Terrain Größe: " + terrainSize + "x" + terrainSize);
    }

    private void initLighting() {
        // Ambient
        AmbientLight ambient = new AmbientLight();
        ambient.setColor(ColorRGBA.White.mult(0.5f));
        rootNode.addLight(ambient);

        // Sonne
        DirectionalLight sun = new DirectionalLight();
        sun.setDirection(new Vector3f(-0.5f, -0.7f, -0.3f).normalizeLocal());
        sun.setColor(ColorRGBA.White.mult(1.5f));
        rootNode.addLight(sun);
    }

    @Override
    public void simpleUpdate(float tpf) {
        // Nichts zu tun
    }
}
