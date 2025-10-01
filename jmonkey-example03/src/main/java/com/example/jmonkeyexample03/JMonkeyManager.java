package com.example.jmonkeyexample03;

import com.jme3.app.SimpleApplication;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.math.Vector3f;
import com.jme3.scene.Geometry;
import com.jme3.scene.Node;
import com.jme3.scene.shape.Box;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * JMonkey Manager für TileMap-basierte 3D Welt.
 *
 * Diese Klasse verwaltet die jMonkey Engine Anwendung und lädt
 * dynamisch Tiles vom TileProviderService.
 */
@Component
public class JMonkeyManager {

    private static JMonkeyManager instance;
    private TileMapApp jmonkeyApp;

    @Autowired
    private TileProviderService tileProviderService;

    public JMonkeyManager() {
        instance = this;
    }

    /**
     * Statischer Zugriff auf die JMonkeyManager Instanz.
     * @return die Singleton-Instanz
     */
    public static JMonkeyManager instance() {
        return instance;
    }

    /**
     * Startet die jMonkey Engine Anwendung.
     * Muss im Main Thread aufgerufen werden!
     */
    public void start() {
        jmonkeyApp = new TileMapApp(tileProviderService);
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
    public TileMapApp getApp() {
        return jmonkeyApp;
    }

    /**
     * jMonkey Engine Anwendungsklasse für TileMap-Darstellung.
     */
    private static class TileMapApp extends SimpleApplication {

        private final TileProviderService tileProviderService;
        private Node tileMapNode;
        private final int CHUNK_SIZE = 16;
        private final int VIEW_DISTANCE = 2; // Anzahl der Chunks in jede Richtung

        public TileMapApp(TileProviderService tileProviderService) {
            this.tileProviderService = tileProviderService;
        }

        @Override
        public void simpleInitApp() {
            // Erstelle einen Node für die TileMap
            tileMapNode = new Node("TileMap");
            rootNode.attachChild(tileMapNode);

            // Lade die initiale TileMap (mehrere Chunks um den Ursprung)
            loadTileMap();

            // Setze Kamera-Position für Side-Scrolling Ansicht von der Seite
            cam.setLocation(new Vector3f(-10, 8, 8)); // Von der Seite schauen
            cam.lookAt(new Vector3f(8, 4, 8), Vector3f.UNIT_Y); // Blick nach rechts/vorne

            // Aktiviere Fly-Kamera für Navigation
            flyCam.setEnabled(true);
            flyCam.setMoveSpeed(5f); // Langsamere Bewegung für bessere Kontrolle

            System.out.println("jMonkey Engine TileMap geladen (Side-View)!");
            System.out.println("Tile-Legende:");
            for (TileProviderService.TileType type : TileProviderService.TileType.values()) {
                System.out.println("  " + tileProviderService.getTileInfo(type));
            }
            System.out.println("Navigation: WASD + Maus für Kamera-Bewegung");
        }

        /**
         * Lädt die TileMap basierend auf dem TileProviderService.
         */
        private void loadTileMap() {
            // Lade mehrere Chunks für eine größere Welt
            for (int chunkX = -VIEW_DISTANCE; chunkX <= VIEW_DISTANCE; chunkX++) {
                for (int chunkY = -VIEW_DISTANCE; chunkY <= VIEW_DISTANCE; chunkY++) {
                    loadChunk(chunkX, chunkY);
                }
            }
        }

        /**
         * Lädt einen einzelnen Chunk und erstellt die 3D-Geometrie.
         */
        private void loadChunk(int chunkX, int chunkY) {
            TileProviderService.Tile[][] chunk = tileProviderService.loadChunk(chunkX, chunkY, CHUNK_SIZE);

            Node chunkNode = new Node("Chunk_" + chunkX + "_" + chunkY);
            tileMapNode.attachChild(chunkNode);

            for (int x = 0; x < CHUNK_SIZE; x++) {
                for (int y = 0; y < CHUNK_SIZE; y++) {
                    TileProviderService.Tile tile = chunk[x][y];
                    createTileGeometry(tile, chunkNode);
                }
            }
        }

        /**
         * Erstellt die 3D-Geometrie für ein einzelnes Tile.
         */
        private void createTileGeometry(TileProviderService.Tile tile, Node parentNode) {
            // Erstelle eine Box für das Tile mit verbesserter Höhen-Darstellung
            float tileSize = 1.0f;
            float baseHeight = 0.2f; // Mindesthöhe für alle Tiles
            float tileHeight = baseHeight + Math.max(0.0f, tile.getHeight() * 3.0f); // Verstärke Höhenunterschiede

            Box tileBox = new Box(tileSize / 2, tileHeight / 2, tileSize / 2);
            Geometry tileGeom = new Geometry("Tile_" + tile.getX() + "_" + tile.getY(), tileBox);

            // Material basierend auf Tile-Typ erstellen
            Material tileMaterial = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
            TileProviderService.TileType type = tile.getType();
            ColorRGBA color = new ColorRGBA(type.getR(), type.getG(), type.getB(), 1.0f);
            tileMaterial.setColor("Color", color);
            tileGeom.setMaterial(tileMaterial);

            // Positioniere das Tile in der Welt - Basis am Boden (Y=0)
            Vector3f position = new Vector3f(
                tile.getX() * tileSize,
                tileHeight / 2, // Tile steht auf dem Boden, Zentrum bei halber Höhe
                tile.getY() * tileSize
            );
            tileGeom.setLocalTranslation(position);

            // Füge das Tile zum Chunk-Node hinzu
            parentNode.attachChild(tileGeom);
        }

        @Override
        public void simpleUpdate(float tpf) {
            // Hier könnte später dynamisches Laden/Entladen von Chunks implementiert werden
            // basierend auf Spieler-Position
        }
    }
}
