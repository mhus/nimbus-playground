package com.example.jme07;

import com.jme3.asset.AssetManager;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.math.Vector3f;
import com.jme3.scene.Geometry;
import com.jme3.scene.Node;
import com.jme3.scene.control.BillboardControl;
import com.jme3.scene.shape.Quad;
import com.jme3.texture.Texture;

import java.util.ArrayList;
import java.util.List;

/**
 * BillboardSprite - Ein Sprite der als Billboard (immer zur Kamera zeigend) gerendert wird
 */
public class BillboardSprite extends Sprite {

    private String texturePath;
    private ColorRGBA fallbackColor;

    // Statischer Material-Cache (shared zwischen allen BillboardSprites)
    private static final java.util.Map<String, Material> materialCache = new java.util.HashMap<>();

    public BillboardSprite(Vector3f position, String texturePath, float height, float rotation, boolean isBig) {
        super(position, height / 0.7f, rotation, isBig);  // scale = height / aspectRatio
        this.texturePath = texturePath;
        this.fallbackColor = new ColorRGBA(0.5f, 0.8f, 0.4f, 1f); // Default grün
    }

    public BillboardSprite(Vector3f position, String texturePath, float height, float rotation, boolean isBig, ColorRGBA fallbackColor) {
        super(position, height / 0.7f, rotation, isBig);
        this.texturePath = texturePath;
        this.fallbackColor = fallbackColor;
    }

    @Override
    public List<Geometry> createGeometries(AssetManager assetManager, Node parentNode) {
        List<Geometry> geometries = new ArrayList<>();

        float height = scale * 0.7f; // scale enthält bereits die gewünschte Größe
        float width = height * 0.7f; // Aspect ratio

        Quad quad = new Quad(width, height);
        Geometry geom = new Geometry("billboard_" + texturePath.hashCode(), quad);

        // Hole oder erstelle Material (gecacht)
        Material mat = getMaterial(assetManager);
        geom.setMaterial(mat);

        // Positioniere Sprite
        geom.setLocalTranslation(position.x - width/2, position.y, position.z);

        // Billboard-Rotation (immer zur Kamera zeigen)
        geom.addControl(new BillboardControl());

        geom.setQueueBucket(com.jme3.renderer.queue.RenderQueue.Bucket.Transparent);
        parentNode.attachChild(geom);
        geometries.add(geom);

        return geometries;
    }

    /**
     * Holt oder erstellt ein Material für diesen Sprite-Typ (gecacht)
     */
    private Material getMaterial(AssetManager assetManager) {
        // Cache-Key basierend auf texturePath
        String cacheKey = texturePath;

        Material mat = materialCache.get(cacheKey);
        if (mat == null) {
            // Erstelle neues Material
            mat = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");

            // Lade Textur (verwende Placeholder wenn nicht vorhanden)
            Texture tex = null;
            try {
                tex = assetManager.loadTexture(texturePath);
            } catch (Exception e) {
                // Placeholder nicht verfügbar
            }

            if (tex != null) {
                mat.setTexture("ColorMap", tex);
            } else {
                mat.setColor("Color", fallbackColor);
            }

            mat.getAdditionalRenderState().setBlendMode(com.jme3.material.RenderState.BlendMode.Alpha);
            mat.getAdditionalRenderState().setFaceCullMode(com.jme3.material.RenderState.FaceCullMode.Off);

            // Cache Material
            materialCache.put(cacheKey, mat);
            System.out.println("BillboardSprite Material gecacht: " + cacheKey);
        }

        return mat;
    }
}
