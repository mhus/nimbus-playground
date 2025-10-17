/**
 * World and chunk models
 */

import type { XYZ, XZ } from '../types.js';

// Note: BlockType, ItemType, and ChunkData are now defined in registry/ and models/
// This file only contains world-specific interfaces

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
