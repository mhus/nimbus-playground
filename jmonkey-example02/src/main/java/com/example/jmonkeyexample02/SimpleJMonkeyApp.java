package com.example.jmonkeyexample02;

import com.jme3.app.SimpleApplication;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.math.Vector3f;
import com.jme3.scene.Geometry;
import com.jme3.scene.shape.Box;

/**
 * Interne jMonkey Engine Anwendungsklasse.
 * Erstellt eine einfache "Hello World" Szene mit einem rotierenden Würfel.
 */
class SimpleJMonkeyApp extends SimpleApplication {

    @Override
    public void simpleInitApp() {
        // Erstelle einen blauen Würfel
        Box box = new Box(1, 1, 1);
        Geometry geom = new Geometry("Box", box);

        Material mat = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
        mat.setColor("Color", ColorRGBA.Blue);
        geom.setMaterial(mat);

        // Positioniere den Würfel
        geom.setLocalTranslation(0, 0, 0);

        // Füge den Würfel zur Szene hinzu
        rootNode.attachChild(geom);

        // Kamera zurücksetzen für bessere Sicht
        cam.setLocation(new Vector3f(0, 0, 5));
        cam.lookAt(Vector3f.ZERO, Vector3f.UNIT_Y);

        System.out.println("jMonkey Engine Hello World gestartet!");
    }

    @Override
    public void simpleUpdate(float tpf) {
        // Lass den Würfel rotieren
        if (rootNode.getChild("Box") != null) {
            rootNode.getChild("Box").rotate(0, tpf, 0);
        }
    }
}
