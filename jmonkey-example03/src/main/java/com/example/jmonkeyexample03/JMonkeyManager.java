package com.example.jmonkeyexample03;

import com.jme3.app.SimpleApplication;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.math.Vector3f;
import com.jme3.scene.Geometry;
import com.jme3.scene.Mesh;
import com.jme3.scene.Node;
import com.jme3.scene.VertexBuffer;
import com.jme3.util.BufferUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.nio.FloatBuffer;
import java.nio.IntBuffer;

/**
 * JMonkey Manager für TileMap-basierte 3D Welt mit fließenden Oberflächen.
 *
 * Diese Klasse verwaltet die jMonkey Engine Anwendung und lädt
 * dynamisch Tiles vom TileProviderService mit Eckpunkt-basierten Höhen.
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
     * jMonkey Engine Anwendungsklasse für TileMap-Darstellung mit fließenden Oberflächen.
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
            cam.setLocation(new Vector3f(-15, 10, 8)); // Weiter zurück für bessere Übersicht
            cam.lookAt(new Vector3f(8, 2, 8), Vector3f.UNIT_Y); // Blick nach rechts/vorne

            // Aktiviere Fly-Kamera für Navigation
            flyCam.setEnabled(true);
            flyCam.setMoveSpeed(8f); // Etwas schnellere Bewegung

            System.out.println("jMonkey Engine TileMap mit fließenden Oberflächen geladen!");
            System.out.println("Tile-Legende:");
            for (TileProviderService.TileType type : TileProviderService.TileType.values()) {
                System.out.println("  " + tileProviderService.getTileInfo(type));
            }
            System.out.println("Navigation: WASD + Maus für Kamera-Bewegung");
            System.out.println("Features: Fließende Oberflächen basierend auf Eckpunkt-Höhen");
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
         * Lädt einen einzelnen Chunk und erstellt die 3D-Geometrie mit fließenden Oberflächen.
         */
        private void loadChunk(int chunkX, int chunkY) {
            TileProviderService.Tile[][] chunk = tileProviderService.loadChunk(chunkX, chunkY, CHUNK_SIZE);

            Node chunkNode = new Node("Chunk_" + chunkX + "_" + chunkY);
            tileMapNode.attachChild(chunkNode);

            for (int x = 0; x < CHUNK_SIZE; x++) {
                for (int y = 0; y < CHUNK_SIZE; y++) {
                    TileProviderService.Tile tile = chunk[x][y];
                    createFlowingSurfaceGeometry(tile, chunkNode);
                }
            }
        }

        /**
         * Erstellt die 3D-Geometrie für ein einzelnes Tile mit fließender Oberfläche.
         */
        private void createFlowingSurfaceGeometry(TileProviderService.Tile tile, Node parentNode) {
            float tileSize = 1.0f;

            // Erstelle ein custom Mesh für die fließende Oberfläche
            Mesh tileMesh = createTileMesh(tile, tileSize);

            Geometry tileGeom = new Geometry("FlowingTile_" + tile.getX() + "_" + tile.getY(), tileMesh);

            // Material basierend auf Tile-Typ erstellen
            Material tileMaterial = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
            TileProviderService.TileType type = tile.getType();
            ColorRGBA color = new ColorRGBA(type.getR(), type.getG(), type.getB(), 1.0f);
            tileMaterial.setColor("Color", color);
            tileGeom.setMaterial(tileMaterial);

            // Positioniere das Tile in der Welt
            Vector3f position = new Vector3f(
                tile.getX() * tileSize,
                0, // Basis-Position, Höhen sind im Mesh definiert
                tile.getY() * tileSize
            );
            tileGeom.setLocalTranslation(position);

            // Füge das Tile zum Chunk-Node hinzu
            parentNode.attachChild(tileGeom);
        }

        /**
         * Erstellt ein custom Mesh für ein Tile mit fließender Oberfläche basierend auf Eckpunkt-Höhen.
         */
        private Mesh createTileMesh(TileProviderService.Tile tile, float tileSize) {
            Mesh mesh = new Mesh();

            // Definiere die 8 Vertices (4 oben, 4 unten) für das Tile
            float[] vertices = new float[] {
                // Boden-Vertices (Y = 0)
                0,         0,         0,         // 0: SW unten
                tileSize,  0,         0,         // 1: SE unten
                tileSize,  0,         tileSize,  // 2: NE unten
                0,         0,         tileSize,  // 3: NW unten

                // Oberflächen-Vertices (mit Eckpunkt-Höhen)
                0,         tile.getHeightSW(), 0,         // 4: SW oben
                tileSize,  tile.getHeightSE(), 0,         // 5: SE oben
                tileSize,  tile.getHeightNE(), tileSize,  // 6: NE oben
                0,         tile.getHeightNW(), tileSize   // 7: NW oben
            };

            // Definiere die Dreiecke (Faces) für das Mesh
            int[] indices = new int[] {
                // Oberfläche (2 Dreiecke)
                4, 5, 6,    // Dreieck 1: SW-SE-NE
                4, 6, 7,    // Dreieck 2: SW-NE-NW

                // Seiten (je 2 Dreiecke pro Seite)
                // Süd-Seite
                0, 1, 5,    0, 5, 4,
                // Ost-Seite
                1, 2, 6,    1, 6, 5,
                // Nord-Seite
                2, 3, 7,    2, 7, 6,
                // West-Seite
                3, 0, 4,    3, 4, 7,

                // Boden
                0, 2, 1,    0, 3, 2
            };

            // Setze Vertex-Daten
            FloatBuffer vertexBuffer = BufferUtils.createFloatBuffer(vertices);
            mesh.setBuffer(VertexBuffer.Type.Position, 3, vertexBuffer);

            // Setze Index-Daten
            IntBuffer indexBuffer = BufferUtils.createIntBuffer(indices);
            mesh.setBuffer(VertexBuffer.Type.Index, 3, indexBuffer);

            // Berechne Normalen für korrekte Beleuchtung
            mesh.updateBound();
            mesh.updateCounts();

            return mesh;
        }

        @Override
        public void simpleUpdate(float tpf) {
            // Hier könnte später dynamisches Laden/Entladen von Chunks implementiert werden
            // basierend auf Spieler-Position
        }
    }
}
