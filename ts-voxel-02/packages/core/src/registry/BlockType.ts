/**
 * Block Type System
 *
 * Central block type definitions used by server, client, and generators.
 */

/**
 * Block rendering shape/model type
 */
export enum BlockShape {
  /** Standard cube block (6 faces) */
  CUBE = 0,

  /** Cross model (plants, flowers) - 2 intersecting planes */
  CROSS = 1,

  /** Cactus model (smaller cube with special collision) */
  CACTUS = 2,

  /** Custom model (reserved) */
  CUSTOM = 3,

  /** Glass/transparent cube */
  GLASS = 4,
}

/**
 * Material type for special block behaviors
 */
export type BlockMaterial =
  | 'solid'      // Default solid block
  | 'water'      // Fluid water
  | 'lava'       // Fluid lava
  | 'barrier'    // Invisible barrier
  | 'gas';       // Air-like materials

/**
 * Tool types that can mine blocks
 */
export type ToolType =
  | 'any'        // Can be mined with any tool
  | 'none'       // Cannot be mined
  | 'pickaxe'
  | 'axe'
  | 'shovel'
  | 'hoe'
  | string[];    // Array of acceptable tools

/**
 * Block options - additional properties
 */
export interface BlockOptions {
  /** Whether the block is solid (has collision) */
  solid?: boolean;

  /** Whether the block is opaque (blocks light, culls faces) */
  opaque?: boolean;

  /** Whether the block is transparent (like glass) */
  transparent?: boolean;

  /** Block material type */
  material?: BlockMaterial;

  /** Whether the block is a fluid */
  fluid?: boolean;

  /** Fluid density (for physics) */
  fluidDensity?: number;

  /** Fluid viscosity (for physics) */
  viscosity?: number;

  /** Custom properties */
  [key: string]: any;
}

/**
 * Core Block Type definition
 */
export interface BlockType {
  /** Numeric ID (assigned by registry) */
  id?: number;

  /** Unique string identifier (e.g., 'stone', 'grass', 'water') */
  name: string;

  /** Display name (optional, defaults to name) */
  displayName?: string;

  /** Block shape/model type */
  shape: BlockShape;

  /**
   * Texture paths
   * - Single string: all faces use same texture
   * - Array [top, bottom, sides]: different textures per face group
   * - Array [top, bottom, north, south, east, west]: individual faces
   */
  texture: string | string[];

  /** Additional block options */
  options?: BlockOptions;

  /** Block hardness (affects mining time) */
  hardness?: number;

  /** Base mining time in milliseconds */
  miningtime?: number;

  /** Required tool type(s) to mine */
  tool?: ToolType;

  /** Whether block is unbreakable */
  unbreakable?: boolean;

  /** Whether block is solid (shorthand for options.solid) */
  solid?: boolean;

  /** Whether block is transparent (shorthand for options.transparent) */
  transparent?: boolean;
}

/**
 * Create a standard block type with defaults
 */
export function createBlockType(
  name: string,
  shape: BlockShape,
  texture: string | string[],
  options?: Partial<BlockType>
): BlockType {
  return {
    name,
    shape,
    texture,
    hardness: 0,
    miningtime: 0,
    tool: 'any',
    unbreakable: false,
    solid: options?.options?.solid !== false,  // Default true
    transparent: options?.options?.transparent || false,
    ...options,
  };
}

/**
 * Create a solid cube block (most common)
 */
export function createCubeBlock(
  name: string,
  texture: string | string[],
  options?: Partial<BlockType>
): BlockType {
  return createBlockType(name, BlockShape.CUBE, texture, options);
}

/**
 * Create a plant/cross block
 */
export function createPlantBlock(
  name: string,
  texture: string,
  options?: Partial<BlockType>
): BlockType {
  return createBlockType(name, BlockShape.CROSS, texture, {
    ...options,
    options: {
      solid: false,
      opaque: false,
      ...options?.options,
    },
  });
}

/**
 * Create a transparent block (like glass)
 */
export function createTransparentBlock(
  name: string,
  texture: string,
  options?: Partial<BlockType>
): BlockType {
  return createBlockType(name, BlockShape.GLASS, texture, {
    ...options,
    transparent: true,
    options: {
      opaque: false,
      ...options?.options,
    },
  });
}

/**
 * Create a fluid block
 */
export function createFluidBlock(
  name: string,
  texture: string,
  material: 'water' | 'lava',
  options?: Partial<BlockType>
): BlockType {
  return createBlockType(name, BlockShape.CUBE, texture, {
    ...options,
    options: {
      material,
      fluid: true,
      fluidDensity: 30.0,
      viscosity: 200.5,
      ...options?.options,
    },
  });
}
