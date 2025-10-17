/**
 * Entity system models
 */

import type { XYZ, XZ } from '../types.js';

/**
 * Armor inventory data
 */
export interface ArmorInventory {
  helmet?: ItemStack;
  chestplate?: ItemStack;
  leggings?: ItemStack;
  boots?: ItemStack;
}

/**
 * Item stack in inventory
 */
export interface ItemStack {
  id: string;
  count: number;
  data?: any;
}

/**
 * Entity data structure
 */
export interface EntityData {
  position: XYZ;
  rotation: number;
  pitch: number;
  health: number;
  maxHealth: number;
  model: string;
  texture: string;
  name: string;
  nametag: boolean;
  hitbox: XYZ;
  armor?: ArmorInventory;
  helditem?: ItemStack;
  [index: string]: any;
}

/**
 * Serialized entity object (for network transfer)
 */
export interface IEntityObject {
  data: EntityData;
  readonly id: string;
  world: string;
  chunk: XZ;
  readonly type: string;
}

/**
 * Entity interface
 */
export interface IEntity {
  data: EntityData;
  readonly id: string;
  chunkID: XZ;
  readonly type: string;

  /**
   * Get serialized entity object
   */
  getObject(): IEntityObject;

  /**
   * Move entity to new position
   */
  move(pos: XYZ): void;

  /**
   * Rotate entity
   */
  rotate(rotation: number, pitch: number): void;

  /**
   * Teleport entity (may change world)
   */
  teleport(pos: XYZ, world: string): void;

  /**
   * Remove entity from world
   */
  remove(): void;
}

// Note: EntityType is now defined in registry/EntityType.ts
