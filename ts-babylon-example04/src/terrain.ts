import { Level, Tile } from './terrain3d';


// Biom-Information für Terrain-Generierung
export interface BiomeInfo {
    baseTexture: string;           // Basis-Textur des Bioms
    vegetationTexture: string | null; // Vegetation/Detail-Textur (optional)
    vegetationThreshold: number;   // Schwellenwert für Vegetation (0-1)
    name: string;                  // Name des Bioms für Vergleiche
}

// Terrain-Daten-Interface für JSON-Serialisierung
export interface TerrainData {
    version: string;
    worldSize: number;
    metadata: {
        name: string;
        description: string;
        created: string;
        author?: string;
    };
    tiles: {
        [key: string]: {
            levels: Level[];
        };
    };
    features: {
        lakes: Array<{ x: number; y: number; radius: number; name?: string }>;
        rivers: Array<{
            from: { x: number; y: number };
            to: { x: number; y: number };
            width: number;
            curved?: boolean;
            name?: string;
        }>;
        deserts: Array<{ x: number; y: number; width: number; height: number; name?: string }>;
    };
}


// TileProvider-Klasse für das große Terrain
export class TileProvider {
    private tileCache: Map<string, Tile>; // Cache für bereits generierte Tiles
    private isGenerated: boolean = false; // Flag ob Terrain bereits generiert wurde
    private worldSize: number = 200; // Dynamische Weltgröße (Standard-Fallback)

    constructor() {
        this.tileCache = new Map();
    }

    /**
     * Generiert das gesamte Terrain beim Start und lädt es in den Cache
     * Diese Methode sollte einmal beim Start aufgerufen werden
     * Versucht zuerst JSON zu laden, falls verfügbar
     */
    public async generateAllTerrain(jsonPath?: string): Promise<void> {
        if (this.isGenerated) {
            console.log('Terrain bereits generiert');
            return;
        }

        // Versuche zuerst JSON zu laden
        if (jsonPath) {
            try {
                await this.loadTerrainFromJson(jsonPath);
                console.log('JSON-Terrain erfolgreich geladen');
                this.manipulateTerrain();
                this.isGenerated = true;
                return;
            } catch (error) {
                console.warn('JSON-Terrain konnte nicht geladen werden, verwende prozedurales Terrain:', error);
            }
        }

    }

    /**
     * Holt ein Tile für die gegebenen globalen Koordinaten aus dem Cache
     * Das Terrain muss vorher mit generateAllTerrain() generiert worden sein
     */
    public getTile(globalX: number, globalY: number): Tile {
        if (!this.isGenerated) {
            throw new Error('Terrain wurde noch nicht generiert! Rufen Sie zuerst generateAllTerrain() auf.');
        }

        const key = `${globalX},${globalY}`;
        const tile = this.tileCache.get(key);

        if (!tile) {
            // Fallback: Ungültige Koordinaten oder Fehler
            console.warn(`Tile nicht gefunden für Koordinaten (${globalX}, ${globalY})`);
            return this.createEmptyTile();
        }

        return tile;
    }

    /**
     * Prüft ob Koordinaten im gültigen Bereich sind
     */
    public isValidCoordinate(globalX: number, globalY: number): boolean {
        return globalX >= 0 && globalX < this.worldSize &&
            globalY >= 0 && globalY < this.worldSize;
    }

    public manipulateTerrain() {
        this.tileCache.set("100,100", { levels: [{ level: 0, texture: 'water' }] });
        this.tileCache.set("99,99", { levels: [{ level: 0, gltfFile: "road/roadTile_050.gltf", rotation: 180 }] });
    }

    /**
     * Lädt Terrain-Daten aus einer JSON-Datei
     */
    public async loadTerrainFromJson(jsonPath: string): Promise<void> {
        try {
            console.log(`Lade Terrain aus JSON: ${jsonPath}`);
            const response = await fetch(jsonPath);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            var terrainData = await response.json();

            if (terrainData) {
                // Weltgröße aus den Terrain-Daten setzen
                this.worldSize = terrainData.worldSize;

                console.log(`Terrain geladen: "${terrainData.metadata.name}"`);
                console.log(`Beschreibung: ${terrainData.metadata.description}`);
                console.log(`Weltgröße: ${terrainData.worldSize}x${terrainData.worldSize}`);
                console.log(`Features: ${terrainData.features.lakes.length} Seen, ${terrainData.features.rivers.length} Flüsse, ${terrainData.features.deserts.length} Wüsten`);
            }

            if (terrainData != null) {
                // JSON-Terrain-Daten in den Cache schreiben
                console.log('Schreibe JSON-Terrain-Daten in den Cache...');
                const startTime = performance.now();

                // Explizite Tiles aus JSON in den Cache laden
                for (const [key, tileData] of Object.entries(terrainData.tiles)) {
                    const typedTileData = tileData as { levels: Level[] };
                    this.tileCache.set(key, { levels: typedTileData.levels });
                }
            }

        } catch (error) {
            console.error('Fehler beim Laden der Terrain-JSON:', error);
            throw error;
        }
    }

    /**
     * Erstellt ein leeres Tile als Fallback
     */
    private createEmptyTile(): Tile {
        return {
            levels: [{ level: 0, texture: 'dirt' }]
        };
    }

    public getWorldSize(): number {
        return this.worldSize;
    }
}
