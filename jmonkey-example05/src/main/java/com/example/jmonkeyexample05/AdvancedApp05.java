package com.example.jmonkeyexample05;

import com.jme3.app.SimpleApplication;
import com.jme3.effect.ParticleEmitter;
import com.jme3.effect.ParticleMesh;
import com.jme3.input.KeyInput;
import com.jme3.input.controls.ActionListener;
import com.jme3.input.controls.KeyTrigger;
import com.jme3.light.AmbientLight;
import com.jme3.light.DirectionalLight;
import com.jme3.material.Material;
import com.jme3.math.ColorRGBA;
import com.jme3.math.Vector3f;
import com.jme3.renderer.queue.RenderQueue;
import com.jme3.scene.Geometry;
import com.jme3.scene.shape.Box;
import com.jme3.scene.shape.Sphere;
import com.jme3.shadow.DirectionalLightShadowRenderer;
import com.jme3.terrain.geomipmap.TerrainLodControl;
import com.jme3.terrain.geomipmap.TerrainQuad;
import com.jme3.texture.Texture;
import com.jme3.scene.Node;
import com.jme3.math.FastMath;

/**
 * Erweiterte jMonkey Engine Anwendung mit Partikeln, Beleuchtung, Terrain und Animationen.
 */
public class AdvancedApp05 extends SimpleApplication implements ActionListener {

    // Steuerung
    private static final String TOGGLE_FLIGHT = "ToggleFlight";
    private static final String JUMP = "Jump";
    private static final String SPAWN_BOX = "SpawnBox";
    private static final String TOGGLE_PARTICLES = "ToggleParticles";
    private static final String TOGGLE_LIGHTING = "ToggleLighting";

    // Walk/Fly Modus
    private boolean isFlightMode = false;
    private Vector3f velocity = new Vector3f(0, 0, 0);
    private final float GRAVITY = -9.81f;
    private final float GROUND_HEIGHT = 2.0f;
    private final float JUMP_FORCE = 8.0f;
    private boolean isOnGround = false;

    // Partikel
    private ParticleEmitter fireEffect;
    private ParticleEmitter waterEffect;
    private boolean particlesEnabled = true;

    // Terrain
    private TerrainQuad terrain;

    // Beleuchtung
    private DirectionalLight sun;
    private AmbientLight ambient;
    private boolean lightingEnabled = true;

    // Animierte Objekte
    private Node rotatingObjects;
    private Node floatingObjects;
    private float time = 0;

    @Override
    public void simpleInitApp() {
        // Input-Mapping
        setupInputMapping();

        // Beleuchtung
        setupLighting();

        // Terrain erstellen
        setupTerrain();

        // Objekte hinzufügen
        addSampleObjects();

        // Partikel-Effekte
        setupParticles();

        // Animierte Objekte
        setupAnimatedObjects();

        // Kamera-Position
        cam.setLocation(new Vector3f(0, 10, 20));
        cam.lookAt(Vector3f.ZERO, Vector3f.UNIT_Y);

        // Starte im Walk-Modus
        setWalkMode();

        System.out.println("Erweiterte jMonkey Engine geladen!");
        System.out.println("Features: Partikel, Beleuchtung, Terrain, Animationen");
        System.out.println("B - Würfel spawnen, P - Partikel ein/aus, L - Beleuchtung ein/aus");
    }

    private void setupInputMapping() {
        inputManager.addMapping(TOGGLE_FLIGHT, new KeyTrigger(KeyInput.KEY_F));
        inputManager.addMapping(JUMP, new KeyTrigger(KeyInput.KEY_SPACE));
        inputManager.addMapping(SPAWN_BOX, new KeyTrigger(KeyInput.KEY_B));
        inputManager.addMapping(TOGGLE_PARTICLES, new KeyTrigger(KeyInput.KEY_P));
        inputManager.addMapping(TOGGLE_LIGHTING, new KeyTrigger(KeyInput.KEY_L));

        inputManager.addListener(this, TOGGLE_FLIGHT, JUMP, SPAWN_BOX, TOGGLE_PARTICLES, TOGGLE_LIGHTING);
    }

    private void setupLighting() {
        // Ambient Light (grundlegende Beleuchtung)
        ambient = new AmbientLight();
        ambient.setColor(ColorRGBA.White.mult(0.3f));
        rootNode.addLight(ambient);

        // Directional Light (Sonne)
        sun = new DirectionalLight();
        sun.setDirection(new Vector3f(-0.5f, -1f, -0.5f).normalizeLocal());
        sun.setColor(ColorRGBA.White.mult(1.0f));
        rootNode.addLight(sun);

        // Schatten-Renderer
        DirectionalLightShadowRenderer shadowRenderer = new DirectionalLightShadowRenderer(assetManager, 2048, 3);
        shadowRenderer.setLight(sun);
        shadowRenderer.setShadowIntensity(0.4f);
        viewPort.addProcessor(shadowRenderer);
    }

    private void setupTerrain() {
        // Einfaches prozedurales Terrain
        int patchSize = 65;
        float[] heightmap = new float[patchSize * patchSize];

        // Generiere komplexere Höhendaten
        for (int i = 0; i < heightmap.length; i++) {
            int x = i % patchSize;
            int z = i / patchSize;

            // Mehrere Sinus-Wellen für interessantere Landschaft
            float height = (float) (
                Math.sin(x * 0.1f) * Math.cos(z * 0.1f) * 5f +
                Math.sin(x * 0.05f) * Math.cos(z * 0.05f) * 2f +
                Math.sin(x * 0.2f) * Math.cos(z * 0.2f) * 1f
            );
            heightmap[i] = height;
        }

        terrain = new TerrainQuad("terrain", patchSize, 129, heightmap);

        // Material für Terrain
        Material terrainMaterial = new Material(assetManager, "Common/MatDefs/Light/Lighting.j3md");
        terrainMaterial.setColor("Diffuse", ColorRGBA.Green);
        terrainMaterial.setColor("Ambient", ColorRGBA.Green.mult(0.3f));
        terrainMaterial.setFloat("Shininess", 10f);

        terrain.setMaterial(terrainMaterial);
        terrain.setLocalTranslation(0, -10, 0);
        terrain.setLocalScale(2f, 0.5f, 2f);

        // LOD Control für bessere Performance
        TerrainLodControl lodControl = new TerrainLodControl(terrain, getCamera());
        terrain.addControl(lodControl);

        // Schatten
        terrain.setShadowMode(RenderQueue.ShadowMode.Receive);

        rootNode.attachChild(terrain);
    }

    private void addSampleObjects() {
        // Einige Würfel hinzufügen
        for (int i = 0; i < 5; i++) {
            createBox(new Vector3f(i * 3 - 6, 5, 0));
        }

        // Einige Kugeln
        for (int i = 0; i < 3; i++) {
            createSphere(new Vector3f(i * 4 - 4, 8, 5));
        }
    }

    private void setupAnimatedObjects() {
        // Node für rotierende Objekte
        rotatingObjects = new Node("RotatingObjects");
        rootNode.attachChild(rotatingObjects);

        // Node für schwebende Objekte
        floatingObjects = new Node("FloatingObjects");
        rootNode.attachChild(floatingObjects);

        // Rotierende Würfel
        for (int i = 0; i < 3; i++) {
            Geometry rotatingBox = createBox(new Vector3f(0, 3, 0));
            rotatingBox.setLocalTranslation(i * 5 - 5, 3, -10);
            rotatingObjects.attachChild(rotatingBox);
        }

        // Schwebende Kugeln
        for (int i = 0; i < 4; i++) {
            Geometry floatingSphere = createSphere(new Vector3f(0, 0, 0));
            floatingSphere.setLocalTranslation(i * 3 - 4.5f, 6, 10);
            floatingObjects.attachChild(floatingSphere);
        }
    }

    private Geometry createBox(Vector3f position) {
        Box box = new Box(1, 1, 1);
        Geometry boxGeo = new Geometry("Box", box);

        Material boxMat = new Material(assetManager, "Common/MatDefs/Light/Lighting.j3md");
        boxMat.setColor("Diffuse", ColorRGBA.randomColor());
        boxMat.setColor("Ambient", ColorRGBA.White.mult(0.2f));
        boxMat.setFloat("Shininess", 20f);
        boxGeo.setMaterial(boxMat);

        // Schatten
        boxGeo.setShadowMode(RenderQueue.ShadowMode.CastAndReceive);
        boxGeo.setLocalTranslation(position);

        rootNode.attachChild(boxGeo);
        return boxGeo;
    }

    private Geometry createSphere(Vector3f position) {
        Sphere sphere = new Sphere(16, 16, 1);
        Geometry sphereGeo = new Geometry("Sphere", sphere);

        Material sphereMat = new Material(assetManager, "Common/MatDefs/Light/Lighting.j3md");
        sphereMat.setColor("Diffuse", ColorRGBA.randomColor());
        sphereMat.setColor("Ambient", ColorRGBA.White.mult(0.2f));
        sphereMat.setFloat("Shininess", 50f);
        sphereGeo.setMaterial(sphereMat);

        sphereGeo.setShadowMode(RenderQueue.ShadowMode.CastAndReceive);
        sphereGeo.setLocalTranslation(position);

        rootNode.attachChild(sphereGeo);
        return sphereGeo;
    }

    private void setupParticles() {
        // Feuer-Effekt
        fireEffect = new ParticleEmitter("Fire", ParticleMesh.Type.Triangle, 30);
        Material fireMat = new Material(assetManager, "Common/MatDefs/Misc/Particle.j3md");
        fireEffect.setMaterial(fireMat);
        fireEffect.setImagesX(1);
        fireEffect.setImagesY(1);
        fireEffect.setEndColor(new ColorRGBA(1f, 0f, 0f, 0f));
        fireEffect.setStartColor(new ColorRGBA(1f, 1f, 0f, 0.8f));
        fireEffect.getParticleInfluencer().setInitialVelocity(new Vector3f(0, 2, 0));
        fireEffect.setStartSize(1.5f);
        fireEffect.setEndSize(0.1f);
        fireEffect.setGravity(0, 0, 0);
        fireEffect.setLowLife(1f);
        fireEffect.setHighLife(3f);
        fireEffect.getParticleInfluencer().setVelocityVariation(0.3f);
        fireEffect.setLocalTranslation(5, 0, 5);

        // Wasser-Effekt
        waterEffect = new ParticleEmitter("Water", ParticleMesh.Type.Triangle, 100);
        Material waterMat = new Material(assetManager, "Common/MatDefs/Misc/Particle.j3md");
        waterEffect.setMaterial(waterMat);
        waterEffect.setEndColor(new ColorRGBA(0f, 0f, 1f, 0f));
        waterEffect.setStartColor(new ColorRGBA(0f, 0.5f, 1f, 1f));
        waterEffect.getParticleInfluencer().setInitialVelocity(new Vector3f(0, 5, 0));
        waterEffect.setStartSize(0.5f);
        waterEffect.setEndSize(0.1f);
        waterEffect.setGravity(0, -9.8f, 0);
        waterEffect.setLowLife(1f);
        waterEffect.setHighLife(2f);
        waterEffect.getParticleInfluencer().setVelocityVariation(1f);
        waterEffect.setLocalTranslation(-5, 3, 0);

        rootNode.attachChild(fireEffect);
        rootNode.attachChild(waterEffect);
    }

    @Override
    public void onAction(String name, boolean isPressed, float tpf) {
        if (name.equals(TOGGLE_FLIGHT) && isPressed) {
            toggleFlightMode();
        } else if (name.equals(JUMP) && isPressed && !isFlightMode) {
            jump();
        } else if (name.equals(SPAWN_BOX) && isPressed) {
            spawnBox();
        } else if (name.equals(TOGGLE_PARTICLES) && isPressed) {
            toggleParticles();
        } else if (name.equals(TOGGLE_LIGHTING) && isPressed) {
            toggleLighting();
        }
    }

    private void toggleFlightMode() {
        isFlightMode = !isFlightMode;

        if (isFlightMode) {
            setFlightMode();
            System.out.println("Fly-Modus aktiviert");
        } else {
            setWalkMode();
            System.out.println("Walk-Modus aktiviert");
        }
    }

    private void setFlightMode() {
        isFlightMode = true;
        velocity.set(0, 0, 0);
        flyCam.setEnabled(true);
    }

    private void setWalkMode() {
        isFlightMode = false;
        flyCam.setEnabled(true); // Für WASD Bewegung
    }

    private void jump() {
        if (isOnGround) {
            velocity.y = JUMP_FORCE;
            isOnGround = false;
            System.out.println("Sprung!");
        }
    }

    private void spawnBox() {
        Vector3f spawnPos = cam.getLocation().add(cam.getDirection().mult(5));
        spawnPos.y += 2; // Etwas höher spawnen
        createBox(spawnPos);
        System.out.println("Würfel gespawnt bei: " + spawnPos);
    }

    private void toggleParticles() {
        particlesEnabled = !particlesEnabled;
        fireEffect.setEnabled(particlesEnabled);
        waterEffect.setEnabled(particlesEnabled);
        System.out.println("Partikel " + (particlesEnabled ? "aktiviert" : "deaktiviert"));
    }

    private void toggleLighting() {
        lightingEnabled = !lightingEnabled;
        if (lightingEnabled) {
            rootNode.addLight(ambient);
            rootNode.addLight(sun);
        } else {
            rootNode.removeLight(ambient);
            rootNode.removeLight(sun);
        }
        System.out.println("Beleuchtung " + (lightingEnabled ? "aktiviert" : "deaktiviert"));
    }

    @Override
    public void simpleUpdate(float tpf) {
        time += tpf;

        // Animiere rotierende Objekte
        if (rotatingObjects != null) {
            rotatingObjects.rotate(0, tpf, 0);
        }

        // Animiere schwebende Objekte
        if (floatingObjects != null) {
            for (int i = 0; i < floatingObjects.getQuantity(); i++) {
                Geometry child = (Geometry) floatingObjects.getChild(i);
                Vector3f pos = child.getLocalTranslation();
                float offset = FastMath.sin(time * 2f + i) * 0.5f;
                child.setLocalTranslation(pos.x, 6 + offset, pos.z);
            }
        }

        // Walk-Modus Physik (vereinfacht für Demo)
        if (!isFlightMode) {
            Vector3f camPos = cam.getLocation();

            // Einfache Boden-Kollision
            if (camPos.y < GROUND_HEIGHT) {
                camPos.y = GROUND_HEIGHT;
                velocity.y = 0;
                isOnGround = true;
            } else if (velocity.y != 0) {
                velocity.y += GRAVITY * tpf;
                camPos.y += velocity.y * tpf;
                isOnGround = false;
            } else {
                isOnGround = true;
            }

            cam.setLocation(camPos);
        }
    }
}
