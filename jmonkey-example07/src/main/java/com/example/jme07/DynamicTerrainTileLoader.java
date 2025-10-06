package com.example.jme07;

import com.jme3.export.JmeExporter;
import com.jme3.export.JmeImporter;
import com.jme3.material.Material;
import com.jme3.math.Vector3f;
import com.jme3.terrain.geomipmap.TerrainGridTileLoader;
import com.jme3.terrain.geomipmap.TerrainQuad;

import java.io.IOException;

/**
 * TileLoader für TerrainGrid der einen TileProvider verwendet um dynamisch Terrain-Chunks zu laden.
 */
public class DynamicTerrainTileLoader implements TerrainGridTileLoader {

    private final TileProvider tileProvider;
    private final Material terrainMaterial;
    private int patchSize = 65; // Standard: 65 (muss 2^n + 1 sein)

    public DynamicTerrainTileLoader(TileProvider tileProvider, Material terrainMaterial) {
        this.tileProvider = tileProvider;
        this.terrainMaterial = terrainMaterial;
    }

    @Override
    public TerrainQuad getTerrainQuadAt(Vector3f location) {
        System.out.println("=== getTerrainQuadAt aufgerufen ===");
        System.out.println("Location: " + location);
        System.out.println("PatchSize: " + patchSize);

        // Konvertiere Weltkoordinaten zu Chunk-Koordinaten
        // TerrainGrid übergibt die Position des Chunk-Ursprungs, nicht die Mitte
        int chunkX = (int) Math.floor(location.x / patchSize);
        int chunkZ = (int) Math.floor(location.z / patchSize);

        System.out.println("Berechne Chunk-Koordinaten: (" + chunkX + ", " + chunkZ + ")");

        try {
            // Hole Höhendaten vom Provider
            float[] heightData = tileProvider.getHeightData(chunkX, chunkZ, patchSize);

            if (heightData == null || heightData.length != patchSize * patchSize) {
                System.err.println("FEHLER: Ungültige Höhendaten vom Provider erhalten!");
                return null;
            }

            // Erstelle TerrainQuad
            String name = "terrain_" + chunkX + "_" + chunkZ;
            TerrainQuad quad = new TerrainQuad(name, patchSize, patchSize, heightData);

            // Setze Material
            // Original: quad.setMaterial(terrainMaterial.clone());
            quad.setMaterial(terrainMaterial);

            System.out.println("Terrain-Chunk erfolgreich geladen: " + name);
            return quad;

        } catch (Exception e) {
            System.err.println("FEHLER beim Laden von Chunk (" + chunkX + ", " + chunkZ + "): " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    @Override
    public void setPatchSize(int patchSize) {
        System.out.println("=== setPatchSize aufgerufen mit: " + patchSize + " ===");

        if (patchSize < 3) {
            throw new IllegalArgumentException("Patch-Größe muss mindestens 3 sein");
        }

        // Prüfe ob es eine gültige 2^n+1 Größe ist
        int n = patchSize - 1;
        if ((n & (n - 1)) != 0) {
            System.out.println("Warnung: Patch-Größe " + patchSize +
                             " ist nicht optimal (sollte 2^n+1 sein, z.B. 33, 65, 129, 257)");
        }

        this.patchSize = patchSize;
        System.out.println("Patch-Größe gesetzt auf: " + patchSize);
    }

    @Override
    public void setQuadSize(int quadSize) {
        // Für unseren Anwendungsfall ist quadSize = patchSize
        setPatchSize(quadSize);
    }

    @Override
    public void write(JmeExporter ex) throws IOException {
        // Serialisierung für Speichern/Laden
        if (ex != null) {
            ex.getCapsule(this).write(patchSize, "patchSize", 65);
        }
    }

    @Override
    public void read(JmeImporter im) throws IOException {
        // Deserialisierung für Speichern/Laden
        if (im != null) {
            this.patchSize = im.getCapsule(this).readInt("patchSize", 65);
        }
    }
}
