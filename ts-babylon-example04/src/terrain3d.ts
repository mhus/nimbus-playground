import { Scene, Vector3, MeshBuilder, StandardMaterial, Texture, Color3, TransformNode, AbstractMesh, Mesh } from '@babylonjs/core';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { TileAtlas } from './atlas';
import { AtlasCoordinates } from './atlas';

// Interfaces aus der Hauptdatei importieren
export interface Level {
    level: number;
    texture?: string;
    gltfFile?: string;
    rotation?: number;
}

export interface Tile {
    levels: Level[];
}

export interface ViewportConfig {
    viewportCenterX: number;
    viewportCenterY: number;
    viewportWidth: number;
    viewportHeight: number;
}

export interface TileProvider {
    getTile(globalX: number, globalY: number): Tile;
    isValidCoordinate(globalX: number, globalY: number): boolean;
    getWorldSize(): number
}

export interface RenderCoordinates {
    globalX: number;
    globalY: number;
    localX: number;
    localY: number;
}

/**
 * 3D Terrain-Renderer für echte 3D-Tiles
 * Ersetzt das alte Canvas-basierte System mit echten 3D-Objekten
 */
export class Terrain3DRenderer {
    private tileProvider: TileProvider;
    private viewport: ViewportConfig;
    private scene: Scene;
    private tileAtlas: TileAtlas;
    private tileSize: number;
    private atlasTexture: Texture | null = null;

    // 3D Tile Management
    private terrainNode: TransformNode;
    private activeTiles: Map<string, {
        meshes: AbstractMesh[];
        position: { globalX: number; globalY: number };
    }> = new Map();

    // Material Cache
    private atlasMaterial: StandardMaterial | null = null;
    private gltfCache: Map<string, AbstractMesh[]> = new Map();
    private debugTileBorders: boolean = true;
    private debugTileIndexes: boolean = true;
    private tilesSize: number = 20;
    private levelSize: number = 0.1;

    constructor(
        tileProvider: TileProvider,
        viewport: ViewportConfig,
        tileAtlas: TileAtlas,
        scene: Scene,
        tileSize: number = 2 // 3D-Einheiten pro Tile
    ) {
        this.tileProvider = tileProvider;
        this.viewport = viewport;
        this.tileAtlas = tileAtlas;
        this.scene = scene;
        this.tileSize = tileSize;

        // Haupt-Node für das gesamte Terrain erstellen
        this.terrainNode = new TransformNode('terrainRoot', scene);
    }

    /**
     * Lädt die Atlas-Textur für 2D-Tiles
     */
    public async loadAtlas(atlasPath: string): Promise<void> {
        this.atlasTexture = new Texture(atlasPath, this.scene);
        this.atlasTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        this.atlasTexture.wrapV = Texture.CLAMP_ADDRESSMODE;

        // Standard-Material für Atlas-Texturen erstellen
        this.atlasMaterial = new StandardMaterial('atlasMaterial', this.scene);
        this.atlasMaterial.diffuseTexture = this.atlasTexture;
        this.atlasMaterial.specularColor = Color3.Black();
    }

    /**
     * Aktualisiert die Viewport-Position und rendert neue Tiles
     */
    public update(coordinates : RenderCoordinates): void {

        // Terrain-Node Position aktualisieren für flüssige Bewegung
        this.terrainNode.position.x = - coordinates.localX;
        this.terrainNode.position.z = coordinates.localY; // Z ist "nach hinten" in Babylon.js

        this.updateTiles(coordinates);
    }

    /**
     * Aktualisiert die sichtbaren Tiles
     */
    private updateTiles(coordinates : RenderCoordinates): void {
        // Bereich der sichtbaren Tiles berechnen

        // Neue Tiles sammeln
        const newTileKeys = new Set<string>();

        for (let tileY = 0; tileY < this.tilesSize; tileY++) {
            for (let tileX = 0; tileX < this.tilesSize; tileX++) {
                if (this.tileProvider.isValidCoordinate(tileX, tileY)) {
                    const key = `${tileX},${tileY}`;
                    newTileKeys.add(key);

                    // Tile erstellen falls noch nicht vorhanden
                    if (!this.activeTiles.has(key)) {
                        this.createTile(tileX, tileY, coordinates.globalX, coordinates.globalY, );
                    }
                }
            }
        }

        // Alte Tiles entfernen die nicht mehr sichtbar sind
        for (const [key] of this.activeTiles) {
            if (!newTileKeys.has(key)) {
                this.removeTile(key);
            }
        }
    }

    /**
     * Erstellt ein 3D-Tile für die gegebenen Koordinaten
     */
    private createTile(tileX: number, tileY: number, globalX : number, globalY : number ): void {
        const tile = this.tileProvider.getTile(globalX + tileX, globalY + tileY);
        const key = `${tileX},${tileY}`;

        // 3D-Position berechnen - Tiles relativ zum Viewport-Zentrum positionieren
        const worldX = (tileX - this.viewport.viewportWidth / 2) * this.tileSize;
        const worldZ = -(tileY - this.viewport.viewportHeight / 2) * this.tileSize; // Negative Z für korrekte Orientierung

        const tileMeshes: AbstractMesh[] = [];

        // Alle Level des Tiles verarbeiten (sortiert nach Level)
        const sortedLevels = [...tile.levels].sort((a, b) => a.level - b.level);

        for (const level of sortedLevels) {
            if (level.gltfFile) {
                // 3D glTF-Objekt laden
                this.create3DTile(level, worldX, worldZ, tileMeshes);
            } else if (level.texture) {
                // 2D-Quad mit Atlas-Textur erstellen
                this.create2DTile(level, worldX, worldZ, tileMeshes);
            }
        }

        if (this.debugTileBorders) {
            // Debug: Tile-Grenzen anzeigen
            const border = MeshBuilder.CreateBox(`border_${tileX}_${tileY}`, {
                width: this.tileSize,
                depth: this.tileSize,
                height: this.levelSize * 20 // Hoch genug, um alle Level zu überdecken
            }, this.scene);
            border.position.x = worldX;
            border.position.y = -(this.levelSize * 5); // Leicht unter dem Boden
            border.position.z = worldZ;
            border.parent = this.terrainNode;

            const borderMaterial = new StandardMaterial(`debugBorderMat_${tileX}_${tileY}`, this.scene);
            borderMaterial.emissiveColor = Color3.Red();
            borderMaterial.diffuseColor = Color3.Red();
            borderMaterial.wireframe = true;
            border.material = borderMaterial;

            tileMeshes.push(border);
        }
        if (this.debugTileIndexes) {

            const texWidth = 1024;
            const texHeight = 512;
            const dynTex = new DynamicTexture("dynTex", { width: texWidth, height: texHeight }, this.scene, false);

            // Anfangstext zeichnen
            const fontPx = 120; // Schriftgröße
            const font = `bold ${fontPx}px Arial`;
            // Hinweis: x = null => horizontales Zentrieren; y = Baseline in Pixeln
            dynTex.drawText((globalX + tileX) + "," + (globalY + tileY), null, texHeight / 2 + fontPx / 3, font, "white", "transparent", true);

            // Material für die Plane
            const mat = new StandardMaterial(`debugTextMat_${tileX}_${tileY}`, this.scene);
            mat.diffuseTexture = dynTex;
            mat.emissiveColor = new Color3(1, 1, 1);  // hält Text hell/unabhängig vom Licht
            mat.backFaceCulling = false;               // beidseitig sichtbar
            // Optional noch stärker von Licht entkoppeln:
            // (mat.disableLighting = true);
            const textPlane = MeshBuilder.CreatePlane("textPlane", { width: this.tileSize / 2, height: this.tileSize / 4 }, this.scene);
            textPlane.position.x = worldX;
            textPlane.position.y = this.levelSize * 20; // Leicht über dem Boden
            textPlane.position.z = worldZ;
            textPlane.parent = this.terrainNode;
            textPlane.material = mat;

            tileMeshes.push(textPlane);
        }

        // Tile in Active-Liste eintragen
        this.activeTiles.set(key, {
            meshes: tileMeshes,
            position: { globalX: tileX, globalY: tileY }
        });
    }

    /**
     * Erstellt ein 2D-Quad für Atlas-Texturen
     */
    private create2DTile(level: Level, worldX: number, worldZ: number, tileMeshes: AbstractMesh[]): void {
        const coords = this.getTileCoordinates(level.texture!);
        if (!coords || !this.atlasMaterial || !this.atlasTexture) return;

        // Quad erstellen
        const quad = MeshBuilder.CreateGround(`tile_${level.texture}_${worldX}_${worldZ}`, {
            width: this.tileSize,
            height: this.tileSize
        }, this.scene);

        // Position setzen (mit Level-Offset für 3D-Effekt)
        quad.position.x = worldX;
        quad.position.y = level.level * this.levelSize; // Höhen-Offset für verschiedene Level
        quad.position.z = worldZ;

        // Parent setzen
        quad.parent = this.terrainNode;

        // Material mit UV-Mapping erstellen
        const material = this.atlasMaterial.clone(`material_${level.texture}_${worldX}_${worldZ}`);

        // UV-Koordinaten für Atlas-Textur berechnen
        const uStart = coords.x / this.tileAtlas.textureWidth;
        const vStart = coords.y / this.tileAtlas.textureHeight;
        const uEnd = (coords.x + coords.width) / this.tileAtlas.textureWidth;
        const vEnd = (coords.y + coords.height) / this.tileAtlas.textureHeight;

        // UV-Mapping anwenden
        const uvs = quad.getVerticesData('uv');
        if (uvs) {
            // Standard UV-Koordinaten [0,1] auf Atlas-Bereich mappen
            uvs[0] = uStart; uvs[1] = vEnd;   // Bottom-left
            uvs[2] = uEnd;   uvs[3] = vEnd;   // Bottom-right
            uvs[4] = uEnd;   uvs[5] = vStart; // Top-right
            uvs[6] = uStart; uvs[7] = vStart; // Top-left

            quad.setVerticesData('uv', uvs);
        }

        quad.material = material;
        tileMeshes.push(quad);
    }

    /**
     * Erstellt ein 3D-Tile für glTF-Dateien
     */
    private async create3DTile(level: Level, worldX: number, worldZ: number, tileMeshes: AbstractMesh[]): Promise<void> {
        if (!level.gltfFile) return;

        try {
            const cacheKey = `${level.gltfFile}_${level.rotation || 0}`;

            // Prüfe Cache
            let meshes = this.gltfCache.get(cacheKey);

            if (!meshes) {
                // glTF laden
                const result = await SceneLoader.ImportMeshAsync("", "/assets/", level.gltfFile, this.scene);
                meshes = result.meshes.filter(mesh => mesh.name !== '__root__'); // Root-Node ausschließen

                // Original-Meshes für Cache vorbereiten (unsichtbar machen)
                meshes.forEach(mesh => {
                    mesh.setEnabled(false);
                    this.centerAndScaleMesh(mesh);
                });

                this.gltfCache.set(cacheKey, meshes);
            }

            // Instanzen der gecachten Meshes erstellen
            for (const originalMesh of meshes) {
                // Prüfe ob es ein Mesh ist (nicht nur AbstractMesh)
                if (originalMesh instanceof Mesh) {
                    const instance = originalMesh.createInstance(`${originalMesh.name}_${worldX}_${worldZ}`);

                    // Position setzen
                    instance.position.x = worldX;
                    instance.position.y = level.level * 0.1;
                    instance.position.z = worldZ;

                    // Rotation anwenden falls definiert
                    if (level.rotation) {
                        instance.rotation.y = (level.rotation * Math.PI) / 180;
                    }

                    // Parent setzen
                    instance.parent = this.terrainNode;

                    tileMeshes.push(instance);
                } else {
                    // Fallback: Clone für andere Mesh-Typen
                    const clone = originalMesh.clone(`${originalMesh.name}_${worldX}_${worldZ}`, null);
                    if (clone) {
                        clone.setEnabled(true);

                        // Position setzen
                        clone.position.x = worldX;
                        clone.position.y = level.level * 0.1;
                        clone.position.z = worldZ;

                        // Rotation anwenden falls definiert
                        if (level.rotation) {
                            clone.rotation.y = (level.rotation * Math.PI) / 180;
                        }

                        // Parent setzen
                        clone.parent = this.terrainNode;

                        tileMeshes.push(clone);
                    }
                }
            }

        } catch (error) {
            console.error(`Fehler beim Laden von glTF-Datei ${level.gltfFile}:`, error);
        }
    }

    /**
     * Zentriert und skaliert ein Mesh für optimale Darstellung
     */
    private centerAndScaleMesh(mesh: AbstractMesh): void {
        if (!mesh.getBoundingInfo) return;

        const boundingInfo = mesh.getBoundingInfo();
        const min = boundingInfo.minimum;
        const max = boundingInfo.maximum;

        // Zentrum berechnen
        const center = Vector3.Center(min, max);

        // Größe berechnen
        const size = max.subtract(min);
        const maxSize = Math.max(size.x, size.y, size.z);

        // Skalierungsfaktor berechnen (Mesh soll in Tile-Größe passen)
        const scaleFactor = maxSize > 0 ? this.tileSize * 0.8 / maxSize : 1;

        // Mesh zentrieren und skalieren
        mesh.position = center.negate();
        mesh.scaling = new Vector3(scaleFactor, scaleFactor, scaleFactor);
    }

    /**
     * Entfernt ein Tile und gibt Ressourcen frei
     */
    private removeTile(key: string): void {
        const tileData = this.activeTiles.get(key);
        if (!tileData) return;

        // Alle Meshes des Tiles entfernen
        tileData.meshes.forEach(mesh => {
            if (mesh.material && mesh.material !== this.atlasMaterial) {
                mesh.material.dispose();
            }
            mesh.dispose();
        });

        this.activeTiles.delete(key);
    }

    /**
     * Holt Tile-Koordinaten aus dem Atlas
     */
    private getTileCoordinates(textureName: string): AtlasCoordinates | null {
        return this.tileAtlas.textures[textureName] || null;
    }

    /**
     * Forciert eine Aktualisierung aller Tiles
     */
    public forceRedraw(coordinates : RenderCoordinates): void {
        this.updateTiles(coordinates);
    }

    /**
     * Cleanup-Methode
     */
    public dispose(): void {
        // Alle aktiven Tiles entfernen
        for (const key of this.activeTiles.keys()) {
            this.removeTile(key);
        }

        // Cache leeren
        for (const meshes of this.gltfCache.values()) {
            meshes.forEach(mesh => mesh.dispose());
        }
        this.gltfCache.clear();

        // Materialien und Texturen entfernen
        if (this.atlasMaterial) this.atlasMaterial.dispose();
        if (this.atlasTexture) this.atlasTexture.dispose();

        // Terrain-Node entfernen
        this.terrainNode.dispose();
    }

    /**
     * Aktiviert/Deaktiviert die Underground-Debug-Ansicht
     */
    public setUndergroundView(enabled: boolean): void {
        // Alle Terrain-Meshes durchgehen und Sichtbarkeit anpassen
        for (const [key, tileData] of this.activeTiles) {
            tileData.meshes.forEach(mesh => {
                if (enabled) {
                    // Underground-Modus: Mache Meshes transparent oder unsichtbar
                    if (mesh.material) {
                        (mesh.material as any).alpha = 0.3; // Halbtransparent
                    }
                    // Oder komplett unsichtbar machen:
                    // mesh.setEnabled(false);
                } else {
                    // Normal-Modus: Stelle volle Sichtbarkeit wieder her
                    if (mesh.material) {
                        (mesh.material as any).alpha = 1.0; // Vollständig sichtbar
                    }
                    // mesh.setEnabled(true);
                }
            });
        }

        console.log(`Underground-Debug-Ansicht: ${enabled ? 'AKTIVIERT' : 'DEAKTIVIERT'}`);
    }
}
