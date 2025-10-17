/**
 * Default Texture Atlas Configuration
 *
 * Defines the layout of the texture atlas for Minecraft-style blocks
 */

import type { AtlasConfig } from './TextureAtlas';

/**
 * Create default atlas configuration
 * Atlas size: 16x16 textures (256 total slots)
 * Texture size: 16x16 pixels per texture
 * Total atlas: 256x256 pixels
 */
export function createDefaultAtlasConfig(): AtlasConfig {
  const textureMap = new Map<string, { x: number; y: number }>();

  // Define texture positions in atlas (row, column)
  const textures: Array<[string, number, number]> = [
    // Row 0: Basic terrain
    ['block/stone', 0, 0],
    ['block/dirt', 1, 0],
    ['block/grass_top', 2, 0],
    ['block/grass_side', 3, 0],
    ['block/cobblestone', 4, 0],
    ['block/planks', 5, 0],
    ['block/sand', 6, 0],
    ['block/gravel', 7, 0],

    // Row 1: Wood & Trees
    ['block/log', 0, 1],
    ['block/log_top', 1, 1],
    ['block/leaves', 2, 1],
    ['block/oak_planks', 3, 1],
    ['block/birch_log', 4, 1],
    ['block/birch_log_top', 5, 1],
    ['block/birch_leaves', 6, 1],
    ['block/birch_planks', 7, 1],

    // Row 2: More wood variants
    ['block/spruce_log', 0, 2],
    ['block/spruce_log_top', 1, 2],
    ['block/spruce_leaves', 2, 2],
    ['block/spruce_planks', 3, 2],
    ['block/oak_sapling', 4, 2],

    // Row 3: Ores & Minerals
    ['block/coal_ore', 0, 3],
    ['block/iron_ore', 1, 3],
    ['block/diamond_ore', 2, 3],
    ['block/lapis_ore', 3, 3],
    ['block/iron_block', 4, 3],
    ['block/gold_block', 5, 3],
    ['block/diamond_block', 6, 3],
    ['block/lapis_block', 7, 3],

    // Row 4: Building blocks
    ['block/bricks', 0, 4],
    ['block/stonebrick', 1, 4],
    ['block/mossy_cobblestone', 2, 4],
    ['block/mossy_stone_bricks', 3, 4],
    ['block/obsidian', 4, 4],
    ['block/bedrock', 5, 4],
    ['block/glass', 6, 4],
    ['block/bookshelf', 7, 4],

    // Row 5: Special blocks
    ['block/crafting_table_top', 0, 5],
    ['block/crafting_table_side', 1, 5],
    ['block/tnt_top', 2, 5],
    ['block/tnt_side', 3, 5],
    ['block/tnt_bottom', 4, 5],
    ['block/pumpkin_top', 5, 5],
    ['block/pumpkin_side', 6, 5],
    ['block/sandstone', 7, 5],

    // Row 6: Plants & Decorations
    ['block/red_flower', 0, 6],
    ['block/yellow_flower', 1, 6],
    ['block/grass_plant', 2, 6],
    ['block/dead_bush', 3, 6],
    ['block/cactus_top', 4, 6],
    ['block/cactus_side', 5, 6],
    ['block/cactus_bottom', 6, 6],

    // Row 7: Snow & Ice
    ['block/snow', 0, 7],
    ['block/grass_snow', 1, 7],
    ['block/ice', 2, 7],

    // Row 8: Wool colors (first 8)
    ['block/white_wool', 0, 8],
    ['block/orange_wool', 1, 8],
    ['block/magenta_wool', 2, 8],
    ['block/light_blue_wool', 3, 8],
    ['block/yellow_wool', 4, 8],
    ['block/lime_wool', 5, 8],
    ['block/pink_wool', 6, 8],
    ['block/gray_wool', 7, 8],

    // Row 9: Wool colors (next 7)
    ['block/light_gray_wool', 0, 9],
    ['block/cyan_wool', 1, 9],
    ['block/purple_wool', 2, 9],
    ['block/blue_wool', 3, 9],
    ['block/brown_wool', 4, 9],
    ['block/green_wool', 5, 9],
    ['block/red_wool', 6, 9],
    ['block/black_wool', 7, 9],

    // Row 10: Stained glass (first 8)
    ['block/white_stained_glass', 0, 10],
    ['block/orange_stained_glass', 1, 10],
    ['block/magenta_stained_glass', 2, 10],
    ['block/light_blue_stained_glass', 3, 10],
    ['block/yellow_stained_glass', 4, 10],
    ['block/lime_stained_glass', 5, 10],
    ['block/pink_stained_glass', 6, 10],
    ['block/gray_stained_glass', 7, 10],

    // Row 11: Stained glass (next 7)
    ['block/light_gray_stained_glass', 0, 11],
    ['block/cyan_stained_glass', 1, 11],
    ['block/purple_stained_glass', 2, 11],
    ['block/blue_stained_glass', 3, 11],
    ['block/brown_stained_glass', 4, 11],
    ['block/green_stained_glass', 5, 11],
    ['block/red_stained_glass', 6, 11],
    ['block/black_stained_glass', 7, 11],

    // Row 12: Concrete (first 8)
    ['block/white_concrete', 0, 12],
    ['block/orange_concrete', 1, 12],
    ['block/magenta_concrete', 2, 12],
    ['block/light_blue_concrete', 3, 12],
    ['block/yellow_concrete', 4, 12],
    ['block/lime_concrete', 5, 12],
    ['block/pink_concrete', 6, 12],
    ['block/gray_concrete', 7, 12],

    // Row 13: Concrete (next 7)
    ['block/light_gray_concrete', 0, 13],
    ['block/cyan_concrete', 1, 13],
    ['block/purple_concrete', 2, 13],
    ['block/blue_concrete', 3, 13],
    ['block/brown_concrete', 4, 13],
    ['block/green_concrete', 5, 13],
    ['block/red_concrete', 6, 13],
    ['block/black_concrete', 7, 13],

    // Row 14: Alternative terrain
    ['block/grass_yellow_top', 0, 14],
    ['block/grass_yellow_side', 1, 14],
    ['block/grass_plant_yellow', 2, 14],
    ['block/leaves_yellow', 3, 14],
    ['block/water', 4, 14],

    // Row 15: Special/placeholder
    ['missing', 0, 15], // Missing texture placeholder (magenta/black)
  ];

  // Populate texture map
  for (const [name, x, y] of textures) {
    textureMap.set(name, { x, y });
  }

  return {
    texturePath: '/textures/atlas.png',
    textureSize: 16,
    atlasWidth: 256,
    atlasHeight: 256,
    textureMap,
  };
}

/**
 * Get list of all texture names in atlas
 */
export function getAtlasTextureNames(): string[] {
  const config = createDefaultAtlasConfig();
  return Array.from(config.textureMap.keys());
}
