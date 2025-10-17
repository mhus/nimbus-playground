/**
 * Default Block Definitions
 *
 * Migrated from tmp/voxelsrv-server/src/default/blocks.ts
 * These are the standard Minecraft-like blocks available in the game.
 */

import {
  BlockType,
  BlockShape,
  createCubeBlock,
  createPlantBlock,
  createTransparentBlock,
  createFluidBlock,
} from './BlockType.js';

/**
 * All default blocks
 */
export const DEFAULT_BLOCKS: BlockType[] = [
  // Basic terrain blocks
  createCubeBlock('stone', 'block/stone', { hardness: 1.5, tool: 'pickaxe' }),
  createCubeBlock('dirt', 'block/dirt', { hardness: 0.5, tool: 'shovel' }),
  createCubeBlock('grass', ['block/grass_top', 'block/dirt', 'block/grass_side'], { hardness: 0.6, tool: 'shovel' }),
  createCubeBlock('grass_snow', ['block/snow', 'block/dirt', 'block/grass_snow'], { hardness: 0.6, tool: 'shovel' }),
  createCubeBlock('cobblestone', 'block/cobblestone', { hardness: 2.0, tool: 'pickaxe' }),
  createCubeBlock('log', ['block/log_top', 'block/log'], { hardness: 2.0, tool: 'axe' }),
  createCubeBlock('sand', 'block/sand', { hardness: 0.5, tool: 'shovel' }),

  // Foliage
  createTransparentBlock('leaves', 'block/leaves', { hardness: 0.2, tool: 'any' }),

  // Fluids
  createFluidBlock('water', 'block/water', 'water'),

  // Plants & decorations
  createPlantBlock('red_flower', 'block/red_flower', { hardness: 0, tool: 'any' }),
  createPlantBlock('grass_plant', 'block/grass_plant', { hardness: 0, tool: 'any' }),
  createPlantBlock('yellow_flower', 'block/yellow_flower', { hardness: 0, tool: 'any' }),

  // Building blocks
  createCubeBlock('bricks', 'block/bricks', { hardness: 2.0, tool: 'pickaxe' }),
  createCubeBlock('planks', 'block/planks', { hardness: 2.0, tool: 'axe' }),
  createTransparentBlock('glass', 'block/glass', { hardness: 0.3, tool: 'any' }),
  createCubeBlock('bookshelf', ['block/planks', 'block/bookshelf'], { hardness: 1.5, tool: 'axe' }),

  // Special blocks
  {
    name: 'barrier',
    shape: BlockShape.CUBE,
    texture: [],
    options: { material: 'barrier', transparent: true },
    hardness: 0,
    miningtime: 0,
    tool: 'none',
    unbreakable: true,
  },

  // More terrain
  createCubeBlock('snow', 'block/snow', { hardness: 0.1, tool: 'shovel' }),
  createCubeBlock('coal_ore', 'block/coal_ore', { hardness: 3.0, tool: 'pickaxe' }),
  createCubeBlock('iron_ore', 'block/iron_ore', { hardness: 3.0, tool: 'pickaxe' }),

  // Cactus (special shape)
  {
    name: 'cactus',
    shape: BlockShape.CACTUS,
    texture: ['block/cactus_top', 'block/cactus_side', 'block/cactus_bottom'],
    transparent: true,
    options: { opaque: false },
    hardness: 0.4,
    tool: 'any',
  },

  createPlantBlock('deadbush', 'block/dead_bush', { hardness: 0, tool: 'any' }),
  createCubeBlock('gravel', 'block/gravel', { hardness: 0.6, tool: 'shovel' }),
  createCubeBlock('crafting', ['block/crafting_table_top', 'block/oak_planks', 'block/crafting_table_side'], { hardness: 2.5, tool: 'axe' }),
  createCubeBlock('stonebrick', 'block/stonebrick', { hardness: 1.5, tool: 'pickaxe' }),

  // Birch variants
  createCubeBlock('birch_log', ['block/birch_log_top', 'block/birch_log'], { hardness: 2.0, tool: 'axe' }),
  createTransparentBlock('birch_leaves', 'block/birch_leaves', { hardness: 0.2, tool: 'any' }),
  createCubeBlock('birch_planks', 'block/birch_planks', { hardness: 2.0, tool: 'axe' }),

  // Spruce variants
  createCubeBlock('spruce_log', ['block/spruce_log_top', 'block/spruce_log'], { hardness: 2.0, tool: 'axe' }),
  createTransparentBlock('spruce_leaves', 'block/spruce_leaves', { hardness: 0.2, tool: 'any' }),
  createCubeBlock('spruce_planks', 'block/spruce_planks', { hardness: 2.0, tool: 'axe' }),

  // Valuable blocks
  createCubeBlock('iron_block', 'block/iron_block', { hardness: 5.0, tool: 'pickaxe' }),
  createCubeBlock('gold_block', 'block/gold_block', { hardness: 3.0, tool: 'pickaxe' }),

  // Bedrock (unbreakable)
  {
    name: 'bedrock',
    shape: BlockShape.CUBE,
    texture: 'block/bedrock',
    hardness: 0,
    miningtime: 0,
    tool: 'none',
    unbreakable: true,
    solid: true,
  },

  // More ores & blocks
  createCubeBlock('sandstone', 'block/sandstone', { hardness: 0.8, tool: 'pickaxe' }),
  createCubeBlock('diamond_ore', 'block/diamond_ore', { hardness: 3.0, tool: 'pickaxe' }),
  createCubeBlock('diamond_block', 'block/diamond_block', { hardness: 5.0, tool: 'pickaxe' }),
  createCubeBlock('lapis_ore', 'block/lapis_ore', { hardness: 3.0, tool: 'pickaxe' }),
  createCubeBlock('lapis_block', 'block/lapis_block', { hardness: 3.0, tool: 'pickaxe' }),
  createCubeBlock('mossy_cobblestone', 'block/mossy_cobblestone', { hardness: 2.0, tool: 'pickaxe' }),
  createCubeBlock('obsidian', 'block/obsidian', { hardness: 50.0, tool: 'pickaxe' }),
  createCubeBlock('mossy_stonebricks', 'block/mossy_stone_bricks', { hardness: 1.5, tool: 'pickaxe' }),

  // Special blocks
  createCubeBlock('tnt', ['block/tnt_top', 'block/tnt_bottom', 'block/tnt_side'], { hardness: 0, tool: 'any' }),
  createCubeBlock('pumpkin', ['block/pumpkin_top', 'block/pumpkin_side', 'block/pumpkin_side'], { hardness: 1.0, tool: 'axe' }),
  createPlantBlock('oak_sapling', 'block/oak_sapling', { hardness: 0, tool: 'any' }),
  createCubeBlock('ice', 'block/ice', { hardness: 0.5, tool: 'pickaxe', transparent: true }),

  // Alternative grass biomes
  createCubeBlock('grass_yellow', ['block/grass_yellow_top', 'block/dirt', 'block/grass_yellow_side'], { hardness: 0.6, tool: 'shovel' }),
  createPlantBlock('grass_plant_yellow', 'block/grass_plant_yellow', { hardness: 0, tool: 'any' }),
  createTransparentBlock('leaves_yellow', 'block/leaves_yellow', { hardness: 0.2, tool: 'any' }),
];

/**
 * Generate colored wool blocks
 */
const COLORS = [
  'white', 'yellow', 'red', 'purple', 'pink', 'orange', 'magenta',
  'lime', 'light_blue', 'green', 'gray', 'cyan', 'brown', 'blue', 'black',
];

export const COLORED_WOOL_BLOCKS: BlockType[] = COLORS.map(color =>
  createCubeBlock(`${color}_wool`, `block/${color}_wool`, { hardness: 0.8, tool: 'any' })
);

export const COLORED_GLASS_BLOCKS: BlockType[] = COLORS.map(color =>
  createTransparentBlock(`${color}_stained_glass`, `block/${color}_stained_glass`, { hardness: 0.3, tool: 'any' })
);

export const COLORED_CONCRETE_BLOCKS: BlockType[] = COLORS.map(color =>
  createCubeBlock(`${color}_concrete`, `block/${color}_concrete`, { hardness: 1.8, tool: 'pickaxe' })
);

/**
 * All blocks combined
 */
export const ALL_DEFAULT_BLOCKS: BlockType[] = [
  ...DEFAULT_BLOCKS,
  ...COLORED_WOOL_BLOCKS,
  ...COLORED_GLASS_BLOCKS,
  ...COLORED_CONCRETE_BLOCKS,
];

/**
 * Get block by name
 */
export function getDefaultBlock(name: string): BlockType | undefined {
  return ALL_DEFAULT_BLOCKS.find(block => block.name === name);
}

/**
 * Get all block names
 */
export function getAllBlockNames(): string[] {
  return ALL_DEFAULT_BLOCKS.map(block => block.name);
}
