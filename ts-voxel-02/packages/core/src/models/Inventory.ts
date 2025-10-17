/**
 * Inventory system models
 */

import type { ItemStack } from './Entity.js';

/**
 * Inventory type
 */
export enum InventoryType {
  MAIN = 'main',
  ARMOR = 'armor',
  CHEST = 'chest',
  CRAFTING = 'crafting',
  FURNACE = 'furnace',
  HOOK = 'hook',
}

/**
 * Base inventory interface
 */
export interface IInventory {
  readonly type: InventoryType;
  readonly size: number;
  items: (ItemStack | null)[];

  /**
   * Get item at slot
   */
  getItem(slot: number): ItemStack | null;

  /**
   * Set item at slot
   */
  setItem(slot: number, item: ItemStack | null): void;

  /**
   * Add item to inventory (finds first available slot)
   */
  addItem(item: ItemStack): boolean;

  /**
   * Remove item from slot
   */
  removeItem(slot: number, count?: number): ItemStack | null;

  /**
   * Get serialized inventory object
   */
  serialize(): string;
}

/**
 * Player inventory (hotbar + main inventory)
 */
export interface PlayerInventory extends IInventory {
  readonly type: InventoryType.MAIN;
  readonly size: 36;  // 9 hotbar + 27 main
  selectedSlot: number;  // 0-8 for hotbar
}

/**
 * Armor inventory
 */
export interface ArmorInventoryInterface extends IInventory {
  readonly type: InventoryType.ARMOR;
  readonly size: 4;  // helmet, chestplate, leggings, boots
}

/**
 * Container inventory (chest, etc.)
 */
export interface ContainerInventory extends IInventory {
  name: string;
}
