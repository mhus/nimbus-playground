package com.example.jmonkejexample01;

import com.jme3.app.SimpleApplication;
import com.jme3.collision.CollisionResult;
import com.jme3.collision.CollisionResults;
import com.jme3.input.KeyInput;
import com.jme3.input.MouseInput;
import com.jme3.input.controls.ActionListener;
import com.jme3.input.controls.AnalogListener;
import com.jme3.input.controls.KeyTrigger;
import com.jme3.input.controls.MouseAxisTrigger;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.math.Ray;
import com.jme3.math.Vector3f;
import com.jme3.renderer.RenderManager;
import com.jme3.scene.Geometry;
import com.jme3.scene.Node;
import com.jme3.scene.Spatial;
import com.jme3.scene.shape.Box;
import com.jme3.scene.shape.Quad;
import com.jme3.system.AppSettings;

/**
 * Ein minimales Beispiel für eine Tile-basierte Welt mit mehreren Stockwerken.
 *
 * Features:
 * - Zwei Stockwerke (z=0 und z=1) mit jeweils eigenem Node
 * - Spieler als Würfel mit WASD-Steuerung
 * - Treppe zum Stockwerk-Wechsel
 * - Kollisionserkennung für Wände
 * - Maus-Look-Steuerung
 *
 * Steuerung:
 * - WASD: Bewegung
 * - Maus: Kamera drehen
 * - Treppe bei (2,2) betreten um Stockwerk zu wechseln
 */
public class TileWorldExample extends SimpleApplication implements ActionListener, AnalogListener {

    // Konstanten für die Welt
    private static final int WORLD_SIZE = 10;
    private static final float TILE_SIZE = 2.0f;
    private static final float PLAYER_SPEED = 5.0f;
    private static final float MOUSE_SENSITIVITY = 2.0f;

    // Spieler und Welt-Nodes
    private Geometry player;
    private Node floor0Node;  // Erdgeschoss
    private Node floor1Node;  // Erstes Obergeschoss
    private int currentFloor = 0;  // Aktuelles Stockwerk

    // Bewegungsrichtungen
    private boolean[] moveDirection = new boolean[4]; // W,A,S,D

    // Materialien
    private Material floorMaterial;
    private Material wallMaterial;
    private Material playerMaterial;
    private Material stairMaterial;

    public static void main(String[] args) {
        TileWorldExample app = new TileWorldExample();

        // App-Einstellungen
        AppSettings settings = new AppSettings(true);
        settings.setTitle("Tile World - Multi-Floor Example");
        settings.setResolution(1024, 768);
        app.setSettings(settings);
        app.setShowSettings(false);

        app.start();
    }

    @Override
    public void simpleInitApp() {
        // Kamera-Einstellungen
        flyCam.setMoveSpeed(10f);
        cam.setLocation(new Vector3f(5, 8, 15));
        cam.lookAt(new Vector3f(5, 0, 5), Vector3f.UNIT_Y);

        // Materialien erstellen
        initMaterials();

        // Input-Mapping einrichten
        setupInput();

        // Welt erstellen
        createWorld();

        // Spieler erstellen
        createPlayer();

        // Erstes Stockwerk anzeigen
        switchToFloor(0);
    }

    /**
     * Initialisiert alle Materialien für die verschiedenen Objekte
     */
    private void initMaterials() {
        // Boden-Material (grau)
        floorMaterial = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
        floorMaterial.setColor("Color", ColorRGBA.Gray);

        // Wand-Material (braun)
        wallMaterial = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
        wallMaterial.setColor("Color", ColorRGBA.Brown);

        // Spieler-Material (blau)
        playerMaterial = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
        playerMaterial.setColor("Color", ColorRGBA.Blue);

        // Treppen-Material (gelb)
        stairMaterial = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
        stairMaterial.setColor("Color", ColorRGBA.Yellow);
    }

    /**
     * Richtet die Eingabe-Steuerung ein
     */
    private void setupInput() {
        // Bewegungs-Tasten
        inputManager.addMapping("MoveForward", new KeyTrigger(KeyInput.KEY_W));
        inputManager.addMapping("MoveBackward", new KeyTrigger(KeyInput.KEY_S));
        inputManager.addMapping("MoveLeft", new KeyTrigger(KeyInput.KEY_A));
        inputManager.addMapping("MoveRight", new KeyTrigger(KeyInput.KEY_D));

        // Maus-Bewegung
        inputManager.addMapping("MouseLookLeft", new MouseAxisTrigger(MouseInput.AXIS_X, true));
        inputManager.addMapping("MouseLookRight", new MouseAxisTrigger(MouseInput.AXIS_X, false));
        inputManager.addMapping("MouseLookUp", new MouseAxisTrigger(MouseInput.AXIS_Y, false));
        inputManager.addMapping("MouseLookDown", new MouseAxisTrigger(MouseInput.AXIS_Y, true));

        // Listener registrieren
        inputManager.addListener(this, "MoveForward", "MoveBackward", "MoveLeft", "MoveRight");
        inputManager.addListener(this, "MouseLookLeft", "MouseLookRight", "MouseLookUp", "MouseLookDown");
    }

    /**
     * Erstellt die komplette Welt mit beiden Stockwerken
     */
    private void createWorld() {
        // Stockwerk-Nodes erstellen
        floor0Node = new Node("Floor0");
        floor1Node = new Node("Floor1");
        rootNode.attachChild(floor0Node);
        rootNode.attachChild(floor1Node);

        // Beide Stockwerke erstellen
        createFloor(floor0Node, 0, ColorRGBA.Gray);      // Erdgeschoss
        createFloor(floor1Node, 1, ColorRGBA.LightGray); // Erstes Obergeschoss

        // Treppe im Erdgeschoss erstellen
        createStairs();
    }

    /**
     * Erstellt ein Stockwerk mit Boden und Wänden
     *
     * @param floorNode Der Node für dieses Stockwerk
     * @param level Die Stockwerk-Nummer (0=Erdgeschoss, 1=Obergeschoss, etc.)
     * @param floorColor Die Farbe des Bodens
     */
    private void createFloor(Node floorNode, int level, ColorRGBA floorColor) {
        float floorHeight = level * 3.0f; // 3 Einheiten pro Stockwerk

        // Boden-Material für dieses Stockwerk
        Material currentFloorMaterial = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
        currentFloorMaterial.setColor("Color", floorColor);

        // Bodenfliesen erstellen
        for (int x = 0; x < WORLD_SIZE; x++) {
            for (int y = 0; y < WORLD_SIZE; y++) {
                // Überspringen der Treppe bei (2,2) im Erdgeschoss
                if (level == 0 && x == 2 && y == 2) {
                    continue; // Hier kommt die Treppe hin
                }

                Geometry tile = createTile(x, y, floorHeight, currentFloorMaterial);
                tile.setName("Floor_" + level + "_" + x + "_" + y);
                floorNode.attachChild(tile);
            }
        }

        // Außenwände erstellen
        createWalls(floorNode, level);

        // Beispiel-Innenwände hinzufügen (um Kollision zu demonstrieren)
        if (level == 0) {
            createExampleWalls(floorNode, level);
        }
    }

    /**
     * Erstellt eine einzelne Bodenfliese
     */
    private Geometry createTile(int x, int y, float height, Material material) {
        Quad quad = new Quad(TILE_SIZE, TILE_SIZE);
        Geometry tile = new Geometry("Tile_" + x + "_" + y, quad);
        tile.setMaterial(material);

        // Position setzen (Quad liegt standardmäßig in XY-Ebene, wir rotieren es für XZ)
        tile.setLocalTranslation(x * TILE_SIZE, height, y * TILE_SIZE);
        tile.rotate(-1.57f, 0, 0); // 90° um X-Achse drehen

        return tile;
    }

    /**
     * Erstellt die Außenwände für ein Stockwerk
     */
    private void createWalls(Node floorNode, int level) {
        float floorHeight = level * 3.0f;
        float wallHeight = 2.5f;

        // Nord- und Südwände
        for (int x = 0; x < WORLD_SIZE; x++) {
            // Nordwand (y = WORLD_SIZE)
            Geometry northWall = createWall(x * TILE_SIZE + TILE_SIZE/2,
                                          floorHeight + wallHeight/2,
                                          WORLD_SIZE * TILE_SIZE);
            northWall.setName("NorthWall_" + level + "_" + x);
            floorNode.attachChild(northWall);

            // Südwand (y = 0)
            Geometry southWall = createWall(x * TILE_SIZE + TILE_SIZE/2,
                                          floorHeight + wallHeight/2,
                                          0);
            southWall.setName("SouthWall_" + level + "_" + x);
            floorNode.attachChild(southWall);
        }

        // Ost- und Westwände
        for (int y = 0; y < WORLD_SIZE; y++) {
            // Ostwand (x = WORLD_SIZE)
            Geometry eastWall = createWall(WORLD_SIZE * TILE_SIZE,
                                         floorHeight + wallHeight/2,
                                         y * TILE_SIZE + TILE_SIZE/2);
            eastWall.setName("EastWall_" + level + "_" + y);
            floorNode.attachChild(eastWall);

            // Westwand (x = 0)
            Geometry westWall = createWall(0,
                                         floorHeight + wallHeight/2,
                                         y * TILE_SIZE + TILE_SIZE/2);
            westWall.setName("WestWall_" + level + "_" + y);
            floorNode.attachChild(westWall);
        }
    }

    /**
     * Erstellt beispielhafte Innenwände
     */
    private void createExampleWalls(Node floorNode, int level) {
        float floorHeight = level * 3.0f;
        float wallHeight = 2.5f;

        // Beispiel-Innenwand bei x=5
        for (int y = 1; y < 4; y++) {
            Geometry wall = createWall(5 * TILE_SIZE,
                                     floorHeight + wallHeight/2,
                                     y * TILE_SIZE + TILE_SIZE/2);
            wall.setName("InnerWall_" + level + "_5_" + y);
            floorNode.attachChild(wall);
        }
    }

    /**
     * Erstellt eine einzelne Wand
     */
    private Geometry createWall(float x, float y, float z) {
        Box wall = new Box(0.1f, 1.25f, 1.0f); // Dünne, hohe Box als Wand
        Geometry wallGeom = new Geometry("Wall", wall);
        wallGeom.setMaterial(wallMaterial);
        wallGeom.setLocalTranslation(x, y, z);
        return wallGeom;
    }

    /**
     * Erstellt die Treppe bei Position (2,2) im Erdgeschoss
     */
    private void createStairs() {
        float stairHeight = 0.5f;

        // Mehrere Stufen erstellen
        for (int i = 0; i < 3; i++) {
            Box stair = new Box(TILE_SIZE/2, stairHeight/2 + i * 0.3f, TILE_SIZE/2);
            Geometry stairGeom = new Geometry("Stair_" + i, stair);
            stairGeom.setMaterial(stairMaterial);
            stairGeom.setLocalTranslation(2 * TILE_SIZE + TILE_SIZE/2,
                                        stairHeight/2 + i * 0.3f,
                                        2 * TILE_SIZE + TILE_SIZE/2);
            stairGeom.setName("Stairs");
            floor0Node.attachChild(stairGeom);
        }
    }

    /**
     * Erstellt den Spieler als blauen Würfel
     */
    private void createPlayer() {
        Box playerBox = new Box(0.5f, 0.5f, 0.5f);
        player = new Geometry("Player", playerBox);
        player.setMaterial(playerMaterial);

        // Startposition: Mitte des Erdgeschosses
        player.setLocalTranslation(WORLD_SIZE/2 * TILE_SIZE, 1.0f, WORLD_SIZE/2 * TILE_SIZE);
        rootNode.attachChild(player);
    }

    /**
     * Wechselt zum angegebenen Stockwerk
     *
     * @param floorNumber Das Stockwerk (0=Erdgeschoss, 1=Obergeschoss)
     */
    private void switchToFloor(int floorNumber) {
        // Alle Stockwerke ausblenden
        floor0Node.setCullHint(Spatial.CullHint.Always);
        floor1Node.setCullHint(Spatial.CullHint.Always);

        // Gewünschtes Stockwerk einblenden
        switch (floorNumber) {
            case 0:
                floor0Node.setCullHint(Spatial.CullHint.Inherit);
                currentFloor = 0;
                break;
            case 1:
                floor1Node.setCullHint(Spatial.CullHint.Inherit);
                currentFloor = 1;
                break;
        }

        // Spieler auf die richtige Höhe setzen
        Vector3f playerPos = player.getLocalTranslation();
        playerPos.y = currentFloor * 3.0f + 1.0f;
        player.setLocalTranslation(playerPos);

        System.out.println("Wechsel zu Stockwerk: " + currentFloor);
    }

    /**
     * Prüft, ob eine Position kollidiert
     */
    private boolean checkCollision(Vector3f newPosition) {
        // Ray von der neuen Position nach unten schießen
        Ray ray = new Ray(newPosition, Vector3f.UNIT_Y.negate());
        CollisionResults results = new CollisionResults();

        // Mit dem aktuellen Stockwerk kollidieren
        Node currentFloorNode = (currentFloor == 0) ? floor0Node : floor1Node;
        currentFloorNode.collideWith(ray, results);

        // Prüfen ob wir auf einer Wand stehen würden
        for (CollisionResult result : results) {
            String name = result.getGeometry().getName();
            if (name != null && name.contains("Wall")) {
                return true; // Kollision mit Wand
            }
        }

        // Ray in alle Richtungen für Wand-Kollision
        Vector3f[] directions = {
            Vector3f.UNIT_X, Vector3f.UNIT_X.negate(),
            Vector3f.UNIT_Z, Vector3f.UNIT_Z.negate()
        };

        for (Vector3f direction : directions) {
            ray = new Ray(newPosition, direction);
            results = new CollisionResults();
            currentFloorNode.collideWith(ray, results);

            for (CollisionResult result : results) {
                if (result.getDistance() < 1.0f) { // Zu nah an einer Wand
                    String name = result.getGeometry().getName();
                    if (name != null && name.contains("Wall")) {
                        return true;
                    }
                }
            }
        }

        return false; // Keine Kollision
    }

    /**
     * Prüft, ob der Spieler auf der Treppe steht
     */
    private void checkStairInteraction() {
        Vector3f playerPos = player.getLocalTranslation();

        // Treppe ist bei (2,2) - prüfen ob Spieler in der Nähe ist
        float stairX = 2 * TILE_SIZE + TILE_SIZE/2;
        float stairZ = 2 * TILE_SIZE + TILE_SIZE/2;

        float distance = new Vector3f(playerPos.x - stairX, 0, playerPos.z - stairZ).length();

        if (distance < TILE_SIZE && currentFloor == 0) {
            // Auf Stockwerk 1 wechseln
            switchToFloor(1);
            // Spieler an entsprechende Position auf Stockwerk 1 setzen
            player.setLocalTranslation(stairX, 1 * 3.0f + 1.0f, stairZ);
        } else if (distance < TILE_SIZE && currentFloor == 1) {
            // Zurück zum Erdgeschoss
            switchToFloor(0);
            // Spieler an entsprechende Position auf Stockwerk 0 setzen
            player.setLocalTranslation(stairX, 0 * 3.0f + 1.0f, stairZ);
        }
    }

    @Override
    public void onAction(String name, boolean isPressed, float tpf) {
        // Bewegungs-Eingabe verarbeiten
        switch (name) {
            case "MoveForward":
                moveDirection[0] = isPressed;
                break;
            case "MoveLeft":
                moveDirection[1] = isPressed;
                break;
            case "MoveBackward":
                moveDirection[2] = isPressed;
                break;
            case "MoveRight":
                moveDirection[3] = isPressed;
                break;
        }
    }

    @Override
    public void onAnalog(String name, float value, float tpf) {
        // Maus-Look verarbeiten
        switch (name) {
            case "MouseLookLeft":
                cam.getRotation().fromAngleAxis(value * MOUSE_SENSITIVITY * tpf, Vector3f.UNIT_Y);
                break;
            case "MouseLookRight":
                cam.getRotation().fromAngleAxis(-value * MOUSE_SENSITIVITY * tpf, Vector3f.UNIT_Y);
                break;
            case "MouseLookUp":
                cam.getRotation().fromAngleAxis(-value * MOUSE_SENSITIVITY * tpf, cam.getLeft());
                break;
            case "MouseLookDown":
                cam.getRotation().fromAngleAxis(value * MOUSE_SENSITIVITY * tpf, cam.getLeft());
                break;
        }
    }

    @Override
    public void simpleUpdate(float tpf) {
        // Spieler-Bewegung basierend auf Kamera-Richtung
        Vector3f camDir = cam.getDirection().clone().normalizeLocal();
        Vector3f camLeft = cam.getLeft().clone().normalizeLocal();
        Vector3f walkDirection = new Vector3f();

        if (moveDirection[0]) { // W - Vorwärts
            walkDirection.addLocal(camDir);
        }
        if (moveDirection[2]) { // S - Rückwärts
            walkDirection.addLocal(camDir.negate());
        }
        if (moveDirection[1]) { // A - Links
            walkDirection.addLocal(camLeft);
        }
        if (moveDirection[3]) { // D - Rechts
            walkDirection.addLocal(camLeft.negate());
        }

        // Nur in XZ-Ebene bewegen
        walkDirection.y = 0;
        walkDirection.normalizeLocal().multLocal(PLAYER_SPEED * tpf);

        // Neue Position berechnen
        Vector3f currentPos = player.getLocalTranslation();
        Vector3f newPosition = currentPos.add(walkDirection);

        // Kollisionsprüfung
        if (!checkCollision(newPosition)) {
            player.setLocalTranslation(newPosition);

            // Kamera folgt dem Spieler
            cam.setLocation(newPosition.add(0, 2, 0));
        }

        // Treppe-Interaktion prüfen
        checkStairInteraction();
    }

    @Override
    public void simpleRender(RenderManager rm) {
        // Standard-Rendering
    }
}
