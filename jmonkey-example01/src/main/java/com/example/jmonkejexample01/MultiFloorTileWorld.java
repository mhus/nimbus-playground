package com.example.jmonkejexample01;

import com.jme3.app.SimpleApplication;
import com.jme3.input.KeyInput;
import com.jme3.input.controls.ActionListener;
import com.jme3.input.controls.KeyTrigger;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.math.Vector3f;
import com.jme3.scene.Geometry;
import com.jme3.scene.Node;
import com.jme3.scene.Spatial;
import com.jme3.scene.shape.Box;

public class MultiFloorTileWorld extends SimpleApplication {

    private Node floor0;  // Erdgeschoss
    private Node floor1;  // Obergeschoss
    private Geometry player;

    private int currentFloor = 0;

    public static void main(String[] args) {
        MultiFloorTileWorld app = new MultiFloorTileWorld();
        app.start();
    }

    @Override
    public void simpleInitApp() {
        flyCam.setMoveSpeed(20); // Kamera schneller bewegen

        // Spieler (einfacher Würfel)
        Box playerBox = new Box(0.3f, 0.3f, 0.3f);
        player = new Geometry("Player", playerBox);
        Material matPlayer = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
        matPlayer.setColor("Color", ColorRGBA.Yellow);
        player.setMaterial(matPlayer);
        player.setLocalTranslation(0, 0.5f, 0);
        rootNode.attachChild(player);

        // Stockwerke erzeugen
        createFloors();

        // Input-Mapping
        initKeys();
    }

    private void createFloors() {
        floor0 = new Node("Floor0");
        floor1 = new Node("Floor1");

        // Boden Etage 0
        for (int x = 0; x < 5; x++) {
            for (int z = 0; z < 5; z++) {
                floor0.attachChild(createTile(x, 0, z, ColorRGBA.Gray));
            }
        }

        // Boden Etage 1 (leicht versetzt in y-Achse)
        for (int x = 0; x < 5; x++) {
            for (int z = 0; z < 5; z++) {
                floor1.attachChild(createTile(x, 1, z, ColorRGBA.LightGray));
            }
        }

        // Treppe auf (2,2) bei Etage 0
        Geometry stair = createTile(2, 0, 2, ColorRGBA.Orange);
        stair.setName("StairUp");
        floor0.attachChild(stair);

        // Treppe auf (2,2) bei Etage 1 (nach unten)
        Geometry stairDown = createTile(2, 1, 2, ColorRGBA.Red);
        stairDown.setName("StairDown");
        floor1.attachChild(stairDown);

        // Anfangszustand: nur Floor0 sichtbar
        rootNode.attachChild(floor0);
        rootNode.attachChild(floor1);
        floor1.setCullHint(Spatial.CullHint.Always);
    }

    private Geometry createTile(int x, int y, int z, ColorRGBA color) {
        Box b = new Box(0.5f, 0.1f, 0.5f);
        Geometry geom = new Geometry("Tile", b);
        Material mat = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
        mat.setColor("Color", color);
        geom.setMaterial(mat);
        geom.setLocalTranslation(x, y * 2, z); // y*2 = Abstand für Stockwerke
        return geom;
    }

    private void initKeys() {
        inputManager.addMapping("Left", new KeyTrigger(KeyInput.KEY_A));
        inputManager.addMapping("Right", new KeyTrigger(KeyInput.KEY_D));
        inputManager.addMapping("Up", new KeyTrigger(KeyInput.KEY_W));
        inputManager.addMapping("Down", new KeyTrigger(KeyInput.KEY_S));
        inputManager.addListener(actionListener, "Left", "Right", "Up", "Down");
    }

    private final ActionListener actionListener = new ActionListener() {
        @Override
        public void onAction(String name, boolean isPressed, float tpf) {
            if (!isPressed) return;

            Vector3f pos = player.getLocalTranslation();
            if (name.equals("Left")) pos.x -= 1;
            if (name.equals("Right")) pos.x += 1;
            if (name.equals("Up")) pos.z -= 1;
            if (name.equals("Down")) pos.z += 1;
            player.setLocalTranslation(pos);

            checkStairs(pos);
        }
    };

    private void checkStairs(Vector3f pos) {
        // Spieler steht bei (2,2) auf aktueller Etage → Treppenwechsel
        if (Math.round(pos.x) == 2 && Math.round(pos.z) == 2) {
            if (currentFloor == 0) {
                switchFloor(1);
                player.setLocalTranslation(2, 2.5f, 2); // auf Stockwerk 1 setzen
            } else {
                switchFloor(0);
                player.setLocalTranslation(2, 0.5f, 2); // auf Stockwerk 0 setzen
            }
        }
    }

    private void switchFloor(int newFloor) {
        if (newFloor == currentFloor) return;

        if (newFloor == 0) {
            floor0.setCullHint(Spatial.CullHint.Inherit);
            floor1.setCullHint(Spatial.CullHint.Always);
        } else {
            floor0.setCullHint(Spatial.CullHint.Always);
            floor1.setCullHint(Spatial.CullHint.Inherit);
        }
        currentFloor = newFloor;
        System.out.println("Switched to floor " + currentFloor);
    }
}