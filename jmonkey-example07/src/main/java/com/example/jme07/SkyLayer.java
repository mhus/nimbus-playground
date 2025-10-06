package com.example.jme07;

import com.jme3.asset.AssetManager;
import com.jme3.light.AmbientLight;
import com.jme3.light.DirectionalLight;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.math.Vector3f;
import com.jme3.post.FilterPostProcessor;
import com.jme3.post.filters.BloomFilter;
import com.jme3.renderer.Camera;
import com.jme3.renderer.ViewPort;
import com.jme3.scene.Geometry;
import com.jme3.scene.Node;
import com.jme3.scene.Spatial;
import com.jme3.scene.shape.Sphere;
import com.jme3.util.SkyFactory;

/**
 * SkyLayer - Erzeugt einen dynamischen Himmel mit Beleuchtung
 * Verwendet eine Sky-Sphere die der Kamera folgt
 */
public class SkyLayer extends Layer {

    private Spatial sky;
    private Geometry sunGeometry;
    private DirectionalLight sun;
    private AmbientLight ambient;
    private ViewPort viewPort;
    private FilterPostProcessor fpp;
    private BloomFilter bloomFilter;

    private static final float SKY_RADIUS = 1000f;
    private static final float SUN_SIZE = 120f;
    private static final float SUN_DISTANCE = 850f;

    public SkyLayer(AssetManager assetManager, Node rootNode, Camera cam, ViewPort viewPort) {
        super("SkyLayer", assetManager, rootNode, cam);
        this.viewPort = viewPort;

        createLighting();
        createSky();
        createSun();
        createSunGlow();
        System.out.println("SkyLayer initialisiert - Radius: " + SKY_RADIUS);
    }

    private void createLighting() {
        // Ambient Light - Grundbeleuchtung
        ambient = new AmbientLight();
        ambient.setColor(ColorRGBA.White.mult(0.5f));
        rootNode.addLight(ambient);

        // Directional Light - Sonne
        sun = new DirectionalLight();
        sun.setDirection(new Vector3f(-0.5f, -0.7f, -0.3f).normalizeLocal());
        sun.setColor(ColorRGBA.White.mult(1.5f));
        rootNode.addLight(sun);

        System.out.println("Sun direction: " + sun.getDirection());
    }

    private void createSky() {
        // Einfacher Farbverlaufs-Himmel
        // WICHTIG: Die Sphere muss von INNEN sichtbar sein (invertierte Normalen)

        // Erstelle eine große Sphere für den Himmel mit invertierten Normalen
        Sphere sphere = new Sphere(32, 32, SKY_RADIUS, false, true);
        Geometry skyGeom = new Geometry("Sky", sphere);

        // Material mit Gradient-Farbe (Himmelblau)
        Material skyMat = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");
        skyMat.setColor("Color", new ColorRGBA(0.5f, 0.7f, 1.0f, 1.0f));
        skyMat.getAdditionalRenderState().setFaceCullMode(com.jme3.material.RenderState.FaceCullMode.Off);
        skyGeom.setMaterial(skyMat);

        // Setze auf Sky-Bucket für korrektes Rendering (wird zuerst gerendert)
        skyGeom.setQueueBucket(com.jme3.renderer.queue.RenderQueue.Bucket.Sky);
        skyGeom.setCullHint(Spatial.CullHint.Never);

        sky = skyGeom;
        rootNode.attachChild(sky);
    }

    private void createSun() {
        // Erstelle einen Node für Sonne + Glow
        Node sunNode = new Node("SunNode");

        // Erstelle mehrere Glow-Schichten mit abnehmender Helligkeit und zunehmender Größe
        // für einen weichen, verlaufenden Effekt

        float[] glowSizes = {1.0f, 1.3f, 1.6f, 2.0f, 2.5f, 3.2f, 4.0f};
        float[] glowAlphas = {1.0f, 0.7f, 0.5f, 0.35f, 0.22f, 0.12f, 0.06f};

        for (int i = 0; i < glowSizes.length; i++) {
            Sphere glowSphere = new Sphere(32, 32, SUN_SIZE * glowSizes[i]);
            Geometry glowGeom = new Geometry("SunGlow" + i, glowSphere);

            Material glowMat = new Material(assetManager, "Common/MatDefs/Misc/Unshaded.j3md");

            // Farbe wird mit jeder Schicht etwas dunkler und röter
            float colorIntensity = 1.0f - (i * 0.08f);
            ColorRGBA color;
            if (i == 0) {
                // Innerer Kern - sehr hell
                color = new ColorRGBA(10.0f, 9.5f, 7.0f, 1.0f);
            } else {
                // Äußere Schichten - warmes Gelb-Orange
                color = new ColorRGBA(
                    1.0f * colorIntensity,
                    0.9f * colorIntensity,
                    0.5f * colorIntensity,
                    glowAlphas[i]
                );
            }

            glowMat.setColor("Color", color);
            glowMat.getAdditionalRenderState().setBlendMode(com.jme3.material.RenderState.BlendMode.Alpha);
            glowMat.getAdditionalRenderState().setDepthTest(false);
            glowMat.getAdditionalRenderState().setDepthWrite(false);

            glowGeom.setMaterial(glowMat);
            sunNode.attachChild(glowGeom);

            if (i == 0) {
                sunGeometry = glowGeom; // Für spätere Updates
            }
        }

        // Positioniere die Sonne entsprechend der Lichtrichtung
        Vector3f sunDirection = sun.getDirection().negate().normalizeLocal();
        Vector3f sunPosition = cam.getLocation().add(sunDirection.mult(SUN_DISTANCE));
        sunNode.setLocalTranslation(sunPosition);

        System.out.println("=== SUN DEBUG ===");
        System.out.println("Sun position: " + sunPosition);
        System.out.println("Sun direction: " + sunDirection);
        System.out.println("Camera position: " + cam.getLocation());

        // Setze auf Transparent-Bucket
        sunNode.setQueueBucket(com.jme3.renderer.queue.RenderQueue.Bucket.Transparent);
        sunNode.setCullHint(Spatial.CullHint.Never);

        rootNode.attachChild(sunNode);

        System.out.println("Sun with " + glowSizes.length + " glow layers attached to root node");
    }

    private void createSunGlow() {
        // Bloom Filter für den Leucht-Effekt der Sonne
        fpp = new FilterPostProcessor(assetManager);
        bloomFilter = new BloomFilter(BloomFilter.GlowMode.Objects);

        // Konfiguriere den Bloom-Effekt
        bloomFilter.setBloomIntensity(2.5f);  // Stärke des Glow-Effekts
        bloomFilter.setExposurePower(1.3f);    // Helligkeit
        bloomFilter.setBlurScale(2.5f);        // Wie weit der Glow sich ausbreitet

        fpp.addFilter(bloomFilter);
        viewPort.addProcessor(fpp);

        System.out.println("Sun glow effect (Bloom) initialized");
    }

    /**
     * Alternative: Sky mit Textur erstellen
     * Benötigt entsprechende Skybox-Texturen im Assets-Ordner
     */
    public void createTexturedSky(String texturePath) {
        if (sky != null) {
            sky.removeFromParent();
        }

        // Erstelle einen Skybox aus 6 Texturen
        sky = SkyFactory.createSky(
            assetManager,
            assetManager.loadTexture(texturePath + "/west.jpg"),
            assetManager.loadTexture(texturePath + "/east.jpg"),
            assetManager.loadTexture(texturePath + "/north.jpg"),
            assetManager.loadTexture(texturePath + "/south.jpg"),
            assetManager.loadTexture(texturePath + "/top.jpg"),
            assetManager.loadTexture(texturePath + "/bottom.jpg")
        );

        rootNode.attachChild(sky);
    }

    @Override
    public void update(float tpf) {
        Vector3f camPos = cam.getLocation();

        // Himmel folgt der Kamera Position
        if (sky != null) {
            sky.setLocalTranslation(camPos);
        }

        // Sonne-Node folgt der Kamera, behält aber ihre relative Position
        if (sunGeometry != null && sunGeometry.getParent() != null) {
            Node sunNode = sunGeometry.getParent();
            Vector3f sunDirection = sun.getDirection().negate().normalizeLocal();
            Vector3f sunPosition = camPos.add(sunDirection.mult(SUN_DISTANCE));
            sunNode.setLocalTranslation(sunPosition);
        }
    }

    /**
     * Ändert die Himmelsfarbe (z.B. für Tag/Nacht-Zyklus)
     */
    public void setSkyColor(ColorRGBA color) {
        if (sky instanceof Geometry) {
            Geometry geom = (Geometry) sky;
            Material mat = geom.getMaterial();
            mat.setColor("Color", color);
        }
    }

    @Override
    public void cleanup() {
        if (sky != null && sky.getParent() != null) {
            sky.removeFromParent();
        }
        if (sunGeometry != null && sunGeometry.getParent() != null) {
            sunGeometry.removeFromParent();
        }
    }

    /**
     * Gibt die Sonnen-Geometrie zurück
     */
    public Geometry getSunGeometry() {
        return sunGeometry;
    }

    /**
     * Setzt die Sonnenposition (Richtung vom Zentrum aus)
     */
    public void setSunDirection(Vector3f direction) {
        if (sun != null) {
            sun.setDirection(direction.normalize());
        }
        // Update sun position in next update cycle
    }
}
