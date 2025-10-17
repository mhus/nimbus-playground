/**
 * Registry system for blocks, items, and commands
 */

import * as fs from 'fs';
import * as path from 'path';
import type { BlockType, ItemType, BlockShape, ToolType } from '@voxel-02/core';

export interface BlockDefinition {
  id?: number;
  name: string;
  displayName?: string;
  shape: BlockShape;
  texture: string | string[];
  solid: boolean;
  transparent: boolean;
  hardness: number;
  miningtime: number;
  tool: ToolType;
  unbreakable?: boolean;
}

export interface ItemDefinition extends ItemType {
  type: 'Item' | 'ItemBlock' | 'ItemTool' | 'ItemArmor';
  block?: string;  // For ItemBlock
  flat?: boolean;  // For ItemBlock
  toolType?: string;  // For ItemTool
  durability?: number;  // For ItemTool/ItemArmor
  power?: number;  // For ItemTool
  reduction?: number;  // For ItemArmor
}

export interface Command {
  command: string;
  description: string;
  handler: (args: string[], context: any) => void | Promise<void>;
}

/**
 * Main registry for blocks, items, and commands
 */
export class Registry {
  private blocks: Map<string, BlockDefinition> = new Map();
  private items: Map<string, ItemDefinition> = new Map();
  private commands: Map<string, Command> = new Map();

  // Block ID <-> Name mappings
  private blockPalette: Map<string, number> = new Map();
  private blockIDMap: Map<number, string> = new Map();

  private freeIDs: number[] = [];
  private lastID = 0;
  private finalized = false;

  private paletteFile = './worlds/blocks.json';

  constructor() {
    // Register air block (ID 0)
    this.blocks.set('air', {
      id: 0,
      name: 'air',
      shape: 0 as BlockShape, // BlockShape.CUBE
      texture: '',
      solid: false,
      transparent: true,
      hardness: 0,
      miningtime: 0,
      tool: 'any' as ToolType,
    });
    this.blockPalette.set('air', 0);
    this.blockIDMap.set(0, 'air');
  }

  /**
   * Load block palette from disk
   */
  loadPalette(): void {
    if (this.finalized) return;

    if (fs.existsSync(this.paletteFile)) {
      try {
        const data = fs.readFileSync(this.paletteFile, 'utf-8');
        const palette = JSON.parse(data);

        // Restore palette
        for (const [name, id] of Object.entries(palette)) {
          this.blockPalette.set(name, id as number);
          this.blockIDMap.set(id as number, name);
        }

        // Find free IDs
        const usedIDs = Array.from(this.blockPalette.values()).sort((a, b) => a - b);
        if (usedIDs.length > 0) {
          this.lastID = usedIDs[usedIDs.length - 1];

          for (let i = 1; i < this.lastID; i++) {
            if (!usedIDs.includes(i)) {
              this.freeIDs.push(i);
            }
          }
        }

        console.log(`[Registry] Loaded block palette with ${this.blockPalette.size} blocks`);
      } catch (error) {
        console.error('[Registry] Failed to load block palette:', error);
      }
    }
  }

  /**
   * Save block palette to disk
   */
  private savePalette(): void {
    const paletteObj: Record<string, number> = {};
    for (const [name, id] of this.blockPalette.entries()) {
      paletteObj[name] = id;
    }

    const dir = path.dirname(this.paletteFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.paletteFile, JSON.stringify(paletteObj, null, 2));
    console.log(`[Registry] Saved block palette with ${this.blockPalette.size} blocks`);
  }

  /**
   * Register a new block
   */
  addBlock(block: BlockDefinition): void {
    if (this.finalized) {
      throw new Error('Cannot add block after registry is finalized');
    }

    this.blocks.set(block.name, block);
  }

  /**
   * Register a new item
   */
  addItem(item: ItemDefinition): void {
    if (this.finalized) {
      throw new Error('Cannot add item after registry is finalized');
    }

    this.items.set(item.name, item);
  }

  /**
   * Register a new command
   */
  addCommand(command: Command): void {
    this.commands.set(command.command, command);
  }

  /**
   * Finalize registry (assign block IDs, lock registrations)
   */
  finalize(): void {
    if (this.finalized) return;

    console.log('[Registry] Finalizing registry...');

    // Assign IDs to blocks
    for (const [name, block] of this.blocks.entries()) {
      if (name === 'air') continue;  // Air already has ID 0

      let id: number;

      if (this.blockPalette.has(name)) {
        // Use existing ID
        id = this.blockPalette.get(name)!;
      } else if (this.freeIDs.length > 0) {
        // Reuse free ID
        id = this.freeIDs.shift()!;
        this.blockPalette.set(name, id);
        this.blockIDMap.set(id, name);
      } else {
        // Assign new ID
        this.lastID++;
        id = this.lastID;
        this.blockPalette.set(name, id);
        this.blockIDMap.set(id, name);
      }

      block.id = id;
    }

    this.finalized = true;
    this.savePalette();

    console.log(`[Registry] Finalized ${this.blocks.size} blocks, ${this.items.size} items, ${this.commands.size} commands`);
  }

  /**
   * Get block by name
   */
  getBlock(name: string): BlockDefinition | undefined {
    return this.blocks.get(name);
  }

  /**
   * Get block by ID
   */
  getBlockByID(id: number): BlockDefinition | undefined {
    const name = this.blockIDMap.get(id);
    return name ? this.blocks.get(name) : undefined;
  }

  /**
   * Get block ID by name
   */
  getBlockID(name: string): number | undefined {
    return this.blockPalette.get(name);
  }

  /**
   * Get item by name
   */
  getItem(name: string): ItemDefinition | undefined {
    return this.items.get(name);
  }

  /**
   * Get command by name
   */
  getCommand(name: string): Command | undefined {
    return this.commands.get(name);
  }

  /**
   * Get all blocks as serializable object
   */
  getBlocksObject(): Record<string, any> {
    const obj: Record<string, any> = {};
    for (const [name, block] of this.blocks.entries()) {
      if (name !== 'air') {
        obj[name] = {
          id: block.id,
          name: block.name,
          solid: block.solid,
          transparent: block.transparent,
          texture: block.texture,
          hardness: block.hardness,
          miningtime: block.miningtime,
          tool: block.tool,
        };
      }
    }
    return obj;
  }

  /**
   * Get all items as serializable object
   */
  getItemsObject(): Record<string, any> {
    const obj: Record<string, any> = {};
    for (const [name, item] of this.items.entries()) {
      obj[name] = {
        id: item.id,
        name: item.name,
        stackSize: item.stackSize,
        texture: item.texture,
        type: item.type,
      };
    }
    return obj;
  }

  /**
   * Get all blocks
   */
  getAllBlocks(): Map<string, BlockDefinition> {
    return this.blocks;
  }

  /**
   * Get all items
   */
  getAllItems(): Map<string, ItemDefinition> {
    return this.items;
  }

  /**
   * Get all commands
   */
  getAllCommands(): Map<string, Command> {
    return this.commands;
  }
}
