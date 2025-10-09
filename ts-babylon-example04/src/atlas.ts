import {TileCoordinates} from "./terrain3d";

export interface TileAtlas {
    textureWidth: number;
    textureHeight: number;
    tiles: { [key: string]: TileCoordinates };
}

export class GlobalTileAtlas {
    // Tile-Atlas-Konfiguration

    public static readonly TILE_ATLAS: TileAtlas = {
        textureWidth: 512,
        textureHeight: 384,
        tiles: {
            'grass_bushes': {x: 350, y: 0, width: 325, height: 225},
            'grass': {x: 0, y: 275, width: 325, height: 325},
            'dirt': {x: 0, y: 650, width: 128, height: 128},
            'water': {x: 0, y: 975, width: 128, height: 128},
            'dirt_stones': {x: 700, y: 975, width: 128, height: 128},
        }
    };
}