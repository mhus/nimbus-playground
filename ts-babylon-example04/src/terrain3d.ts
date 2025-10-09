import { Scene, Vector3, MeshBuilder, StandardMaterial, Texture, Color3, TransformNode, AbstractMesh, Mesh, Material } from '@babylonjs/core';
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
    private debugTileBorders: boolean = false;
    private debugTileIndexes: boolean = true;
    private tilesSize: number = 20;
    private levelSize: number = 0.1;

    // Fade-Konfiguration
    private fadeRadius: number = 8; // Radius in Tiles wo Fade beginnt
    private fadeWidth: number = 2;  // Breite des Fade-Bereichs in Tiles

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

        // Berechne Entfernung vom Zentrum für Fade-Effekt
        const centerX = this.viewport.viewportWidth / 2;
        const centerY = this.viewport.viewportHeight / 2;
        const distanceFromCenter = Math.sqrt(
            Math.pow(tileX - centerX, 2) + Math.pow(tileY - centerY, 2)
        );

        // Berechne Alpha-Wert basierend auf Entfernung
        const alpha = this.calculateFadeAlpha(distanceFromCenter);

        // Überspringe Tiles die komplett unsichtbar sind
        if (alpha <= 0.01) {
            return;
        }

        const tileMeshes: AbstractMesh[] = [];

        // Alle Level des Tiles verarbeiten (sortiert nach Level)
        const sortedLevels = [...tile.levels].sort((a, b) => a.level - b.level);

        for (const level of sortedLevels) {
            if (level.gltfFile) {
                // 3D glTF-Objekt laden
                this.create3DTile(level, worldX, worldZ, tileMeshes, alpha);
            } else if (level.texture) {
                // 2D-Quad mit Atlas-Textur erstellen
                this.create2DTile(level, worldX, worldZ, tileMeshes, alpha);
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
        if (this.debugTileIndexes && ((globalX + tileX) % 10 == 0) && ((globalY + tileY) % 10 == 0)) {

            const texWidth = 1024;
            const texHeight = 512;
            const dynTex = new DynamicTexture("dynTex", { width: texWidth, height: texHeight }, this.scene, false);

            // Anfangstext zeichnen
            const fontPx = 120; // Schriftgröße
            const font = `bold ${fontPx}px Arial`;
            // Hinweis: x = null => horizontales Zentrieren; y = Baseline in Pixeln
            const type = tile.levels.map(l => l.texture ? l.texture : (l.gltfFile ? "3D" : "leer")).join(",");
            dynTex.drawText((globalX + tileX) + "," + (globalY + tileY) /*+ " " + type */, null, texHeight / 2 + fontPx / 3, font, "white", "transparent", true);

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
    private create2DTile(level: Level, worldX: number, worldZ: number, tileMeshes: AbstractMesh[], alpha: number = 1.0): void {
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

        // Alpha-Wert für Fade-Effekt setzen
        material.alpha = alpha;
        if (alpha < 1.0) {
            material.transparencyMode = Material.MATERIAL_ALPHABLEND;
        }

        // UV-Koordinaten für Atlas-Textur berechnen
        const uStart = coords.x / this.tileAtlas.textureWidth;
        const vStart = 1.0 - (coords.y + coords.height) / this.tileAtlas.textureHeight;
        const uEnd = (coords.x + coords.width) / this.tileAtlas.textureWidth;
        const vEnd = 1.0 - coords.y / this.tileAtlas.textureHeight;

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
    private async create3DTile(level: Level, worldX: number, worldZ: number, tileMeshes: AbstractMesh[], alpha: number = 1.0): Promise<void> {
        if (!level.gltfFile) return;

        try {
            // Kein Cache - glTF jedes Mal frisch laden
            const result = await SceneLoader.LoadAssetContainerAsync("/assets/", level.gltfFile, this.scene);
            const meshes = result.meshes.filter(mesh => mesh.name !== '__root__'); // Root-Node ausschließen

            // Alle Meshes direkt verwenden
            for (const mesh of meshes) {
                // Mesh zentrieren und skalieren BEVOR Position gesetzt wird
                this.centerAndScaleMesh(mesh);

                // Position setzen (nach dem Zentrieren)
                mesh.position.x = worldX + this.tileSize / 2; // Zentriert im Tile
                mesh.position.y = level.level;
                mesh.position.z = worldZ - this.tileSize / 2; // Zentriert im Tile

                // Rotation anwenden falls definiert
                if (level.rotation) {
                    mesh.rotation.y = (level.rotation * Math.PI) / 180;
                }

                // Alpha-Wert für Fade-Effekt setzen
                if (alpha < 1.0 && mesh.material) {
                    (mesh.material as any).alpha = alpha;
                    (mesh.material as any).transparencyMode = Material.MATERIAL_ALPHABLEND;
                }

                // Parent setzen
                mesh.parent = this.terrainNode;

                result.addToScene();
                tileMeshes.push(mesh);
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
        const scaleFactor = maxSize > 0 ? this.tileSize / maxSize : 1;

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
    public forceRedrawAll(coordinates : RenderCoordinates): void {
        for (let tileY = 0; tileY < this.tilesSize; tileY++) {
            for (let tileX = 0; tileX < this.tilesSize; tileX++) {
                this.removeTile(`${tileX},${tileY}`);
            }
        }
        this.updateTiles(coordinates);
    }

    public forceRedrawTile(coordinates : RenderCoordinates, globalX : number, globalY : number): void {
        this.removeTile(`${globalX},${globalY}`);
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

    /**
     * Berechnet den Alpha-Wert für den Fade-Effekt basierend auf der Entfernung
     */
    private calculateFadeAlpha(distance: number): number {
        if (distance < this.fadeRadius) {
            return 1; // Voll sichtbar
        } else if (distance > this.fadeRadius + this.fadeWidth) {
            return 0; // Vollständig unsichtbar
        } else {
            // Linearer Fade-Effekt
            return 1 - (distance - this.fadeRadius) / this.fadeWidth;
        }
    }
}
