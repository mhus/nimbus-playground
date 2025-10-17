/**
 * World and chunk models
 */

import type { XYZ, XZ } from '../types.js';

/**
 * Block type definition
 */
export interface BlockType {
  id: number;
  name: string;
  solid: boolean;
  transparent: boolean;
  texture?: string | string[];  // Single texture or array [top, sides, bottom]
  model?: string;
  hardness?: number;
  tool?: string;
}

/**
 * Item type definition
 */
export interface ItemType {
  id: string;
  name: string;
  stackSize: number;
  texture?: string;
  tool?: {
    type: string;
    power: number;
  };
}

/**
 * Chunk data structure
 */
export interface ChunkData {
  /**
   * Chunk position [x, z]
   */
  id: XZ;

  /**
   * Block data (Uint16Array of block IDs)
   * Size: CHUNK_SIZE * CHUNK_SIZE * height
   */
  data: Uint16Array;

  /**
   * Chunk height (number of vertical blocks)
   */
  height: number;

  /**
   * Last modification timestamp
   */
  modified?: number;
}

/**
 * World configuration
 */
export interface WorldConfig {
  name: string;
  seed: number;
  generator: 'flat' | 'normal' | 'custom';
  chunkSize: number;
  worldHeight: number;
}

/**
 * World metadata (saved to disk)
 */
export interface WorldMetadata extends WorldConfig {
  version: number;
  createdAt: number;
  lastPlayed?: number;
}

/**
 * Chunk update event
 */
export interface ChunkUpdate {
  chunkID: XZ;
  blockUpdates: BlockUpdate[];
}

/**
 * Single block update
 */
export interface BlockUpdate {
  position: XYZ;
  oldBlockId: number;
  newBlockId: number;
}
