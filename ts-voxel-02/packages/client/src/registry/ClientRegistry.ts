/**
 * Client-side Registry
 *
 * Stores block/item/entity definitions received from server.
 * Client does not assign IDs - it uses what the server sends.
 */

import type { BlockType, ItemType, EntityType } from '@voxel-02/core';

/**
 * Client-side registry for blocks, items, and entities
 */
export class ClientRegistry {
  private blocks: Map<string, BlockType> = new Map();
  private blocksByID: Map<number, BlockType> = new Map();

  private items: Map<string, ItemType> = new Map();
  private itemsByID: Map<number, ItemType> = new Map();

  private entities: Map<string, EntityType> = new Map();
  private entitiesByID: Map<number, EntityType> = new Map();

  private version: string = '';
  private synced: boolean = false;

  /**
   * Load registry from server data
   */
  loadFromServer(
    blocks: BlockType[],
    items: ItemType[],
    entities: EntityType[],
    version: string
  ): void {
    console.log(`[ClientRegistry] Loading registry from server (version ${version})...`);

    // Clear existing data
    this.blocks.clear();
    this.blocksByID.clear();
    this.items.clear();
    this.itemsByID.clear();
    this.entities.clear();
    this.entitiesByID.clear();

    // Load blocks
    for (const block of blocks) {
      this.blocks.set(block.name, block);
      if (block.id !== undefined) {
        this.blocksByID.set(block.id, block);
      }
    }

    // Load items
    for (const item of items) {
      this.items.set(item.name, item);
      if (item.id !== undefined) {
        this.itemsByID.set(item.id, item);
      }
    }

    // Load entities
    for (const entity of entities) {
      this.entities.set(entity.name, entity);
      if (entity.id !== undefined) {
        this.entitiesByID.set(entity.id, entity);
      }
    }

    this.version = version;
    this.synced = true;

    console.log(
      `[ClientRegistry] Loaded ${blocks.length} blocks, ${items.length} items, ${entities.length} entities`
    );
  }

  /**
   * Apply incremental update from server
   */
  applyUpdate(update: {
    addedBlocks?: BlockType[];
    removedBlocks?: string[];
    addedItems?: ItemType[];
    removedItems?: string[];
    addedEntities?: EntityType[];
    removedEntities?: string[];
    version: string;
  }): void {
    console.log(`[ClientRegistry] Applying registry update (version ${update.version})...`);

    // Update blocks
    if (update.addedBlocks) {
      for (const block of update.addedBlocks) {
        this.blocks.set(block.name, block);
        if (block.id !== undefined) {
          this.blocksByID.set(block.id, block);
        }
      }
    }
    if (update.removedBlocks) {
      for (const name of update.removedBlocks) {
        const block = this.blocks.get(name);
        if (block && block.id !== undefined) {
          this.blocksByID.delete(block.id);
        }
        this.blocks.delete(name);
      }
    }

    // Update items
    if (update.addedItems) {
      for (const item of update.addedItems) {
        this.items.set(item.name, item);
        if (item.id !== undefined) {
          this.itemsByID.set(item.id, item);
        }
      }
    }
    if (update.removedItems) {
      for (const name of update.removedItems) {
        const item = this.items.get(name);
        if (item && item.id !== undefined) {
          this.itemsByID.delete(item.id);
        }
        this.items.delete(name);
      }
    }

    // Update entities
    if (update.addedEntities) {
      for (const entity of update.addedEntities) {
        this.entities.set(entity.name, entity);
        if (entity.id !== undefined) {
          this.entitiesByID.set(entity.id, entity);
        }
      }
    }
    if (update.removedEntities) {
      for (const name of update.removedEntities) {
        const entity = this.entities.get(name);
        if (entity && entity.id !== undefined) {
          this.entitiesByID.delete(entity.id);
        }
        this.entities.delete(name);
      }
    }

    this.version = update.version;

    console.log(`[ClientRegistry] Update applied (version ${this.version})`);
  }

  /**
   * Get block by name
   */
  getBlock(name: string): BlockType | undefined {
    return this.blocks.get(name);
  }

  /**
   * Get block by ID
   */
  getBlockByID(id: number): BlockType | undefined {
    return this.blocksByID.get(id);
  }

  /**
   * Get item by name
   */
  getItem(name: string): ItemType | undefined {
    return this.items.get(name);
  }

  /**
   * Get item by ID
   */
  getItemByID(id: number): ItemType | undefined {
    return this.itemsByID.get(id);
  }

  /**
   * Get entity by name
   */
  getEntity(name: string): EntityType | undefined {
    return this.entities.get(name);
  }

  /**
   * Get entity by ID
   */
  getEntityByID(id: number): EntityType | undefined {
    return this.entitiesByID.get(id);
  }

  /**
   * Get all blocks
   */
  getAllBlocks(): BlockType[] {
    return Array.from(this.blocks.values());
  }

  /**
   * Get all items
   */
  getAllItems(): ItemType[] {
    return Array.from(this.items.values());
  }

  /**
   * Get all entities
   */
  getAllEntities(): EntityType[] {
    return Array.from(this.entities.values());
  }

  /**
   * Check if registry is synced with server
   */
  isSynced(): boolean {
    return this.synced;
  }

  /**
   * Get current registry version
   */
  getVersion(): string {
    return this.version;
  }
}
