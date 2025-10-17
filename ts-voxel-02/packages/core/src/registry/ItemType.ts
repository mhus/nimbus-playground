/**
 * Item Type System
 *
 * Central item type definitions used by server, client, and inventory systems.
 */

/**
 * Item category/type
 */
export enum ItemCategory {
  /** Generic item */
  ITEM = 'Item',

  /** Block item (placeable) */
  BLOCK = 'ItemBlock',

  /** Tool (pickaxe, axe, etc.) */
  TOOL = 'ItemTool',

  /** Armor piece */
  ARMOR = 'ItemArmor',

  /** Food/consumable */
  CONSUMABLE = 'ItemConsumable',

  /** Weapon */
  WEAPON = 'ItemWeapon',
}

/**
 * Tool categories
 */
export type ToolCategory =
  | 'pickaxe'
  | 'axe'
  | 'shovel'
  | 'hoe'
  | 'sword';

/**
 * Armor slot types
 */
export type ArmorSlot =
  | 'helmet'
  | 'chestplate'
  | 'leggings'
  | 'boots';

/**
 * Core Item Type definition
 */
export interface ItemType {
  /** Numeric ID (assigned by registry) */
  id?: number;

  /** Unique string identifier */
  name: string;

  /** Display name (optional) */
  displayName?: string;

  /** Item category */
  category?: ItemCategory;

  /** Texture path or array of texture paths */
  texture: string | string[];

  /** Maximum stack size */
  stackSize?: number;

  /** Custom properties */
  [key: string]: any;
}

/**
 * Block item type (items that place blocks)
 */
export interface BlockItemType extends ItemType {
  category: ItemCategory.BLOCK;

  /** Block ID that this item places */
  blockName: string;

  /** Whether to render as flat icon (true) or 3D block model (false) */
  flat: boolean;
}

/**
 * Tool item type
 */
export interface ToolItemType extends ItemType {
  category: ItemCategory.TOOL;

  /** Tool category */
  toolType: ToolCategory;

  /** Tool durability (uses before breaking) */
  durability: number;

  /** Mining power level (determines what can be mined) */
  power: number;

  /** Mining speed multiplier */
  speed: number;
}

/**
 * Armor item type
 */
export interface ArmorItemType extends ItemType {
  category: ItemCategory.ARMOR;

  /** Armor slot */
  armorSlot: ArmorSlot;

  /** Armor durability */
  durability: number;

  /** Damage reduction percentage */
  reduction: number;
}

/**
 * Consumable item type (food, potions, etc.)
 */
export interface ConsumableItemType extends ItemType {
  category: ItemCategory.CONSUMABLE;

  /** Health restored when consumed */
  healAmount?: number;

  /** Hunger restored when consumed */
  hungerAmount?: number;

  /** Status effects applied */
  effects?: any[];
}

/**
 * Create a generic item type
 */
export function createItemType(
  name: string,
  texture: string | string[],
  options?: Partial<ItemType>
): ItemType {
  return {
    name,
    texture,
    category: ItemCategory.ITEM,
    stackSize: 64,
    ...options,
  };
}

/**
 * Create a block item
 */
export function createBlockItem(
  name: string,
  blockName: string,
  texture: string | string[],
  options?: Partial<BlockItemType>
): BlockItemType {
  return {
    name,
    blockName,
    texture,
    category: ItemCategory.BLOCK,
    flat: false,
    stackSize: 64,
    ...options,
  };
}

/**
 * Create a tool item
 */
export function createToolItem(
  name: string,
  toolType: ToolCategory,
  texture: string,
  durability: number,
  power: number,
  speed: number,
  options?: Partial<ToolItemType>
): ToolItemType {
  return {
    name,
    texture,
    category: ItemCategory.TOOL,
    toolType,
    durability,
    power,
    speed,
    stackSize: 1,
    ...options,
  };
}

/**
 * Create an armor item
 */
export function createArmorItem(
  name: string,
  armorSlot: ArmorSlot,
  texture: string,
  durability: number,
  reduction: number,
  options?: Partial<ArmorItemType>
): ArmorItemType {
  return {
    name,
    texture,
    category: ItemCategory.ARMOR,
    armorSlot,
    durability,
    reduction,
    stackSize: 1,
    ...options,
  };
}
