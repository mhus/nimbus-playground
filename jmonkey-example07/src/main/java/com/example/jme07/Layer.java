package com.example.jme07;

import com.jme3.asset.AssetManager;
import com.jme3.renderer.Camera;
import com.jme3.scene.Node;

/**
 * Abstrakte Basis-Klasse für alle Rendering-Layer.
 * Jeder Layer kann sich selbst updaten und cleanupen.
 */
public abstract class Layer {

    protected AssetManager assetManager;
    protected Node rootNode;
    protected Camera cam;
    protected String name;

    /**
     * Konstruktor für Layer
     * @param name Name des Layers
     * @param assetManager Asset Manager
     * @param rootNode Root Node der Szene
     * @param cam Kamera
     */
    public Layer(String name, AssetManager assetManager, Node rootNode, Camera cam) {
        this.name = name;
        this.assetManager = assetManager;
        this.rootNode = rootNode;
        this.cam = cam;
    }

    /**
     * Wird jeden Frame aufgerufen
     * @param tpf Time per frame
     */
    public abstract void update(float tpf);

    /**
     * Cleanup beim Beenden
     */
    public abstract void cleanup();

    /**
     * Gibt den Namen des Layers zurück
     */
    public String getName() {
        return name;
    }

    @Override
    public String toString() {
        return "Layer[" + name + "]";
    }
}
