/**
 * Registry Protocol Messages
 *
 * Messages for dynamically transmitting block/item/entity registries
 * from server to client at connection time.
 */

import type { BlockType, ItemType, EntityType } from '@voxel-02/core';

/**
 * Message types for registry synchronization
 */
export enum RegistryMessageType {
  /** Server sends full registry to client */
  REGISTRY_SYNC = 'registry_sync',

  /** Server sends incremental registry update */
  REGISTRY_UPDATE = 'registry_update',

  /** Client acknowledges registry received */
  REGISTRY_ACK = 'registry_ack',
}

/**
 * Full registry sync message (sent on connect)
 */
export interface RegistrySyncMessage {
  type: RegistryMessageType.REGISTRY_SYNC;
  data: {
    blocks: BlockType[];
    items: ItemType[];
    entities: EntityType[];
    version: string;  // Registry version for cache validation
  };
}

/**
 * Incremental registry update (hot-reload support)
 */
export interface RegistryUpdateMessage {
  type: RegistryMessageType.REGISTRY_UPDATE;
  data: {
    addedBlocks?: BlockType[];
    removedBlocks?: string[];  // Block names to remove
    addedItems?: ItemType[];
    removedItems?: string[];
    addedEntities?: EntityType[];
    removedEntities?: string[];
    version: string;
  };
}

/**
 * Client acknowledgement
 */
export interface RegistryAckMessage {
  type: RegistryMessageType.REGISTRY_ACK;
  data: {
    success: boolean;
    version: string;
    blocksCount: number;
    itemsCount: number;
    entitiesCount: number;
  };
}

/**
 * Union type of all registry messages
 */
export type RegistryMessage =
  | RegistrySyncMessage
  | RegistryUpdateMessage
  | RegistryAckMessage;

/**
 * Create a registry sync message
 */
export function createRegistrySyncMessage(
  blocks: BlockType[],
  items: ItemType[],
  entities: EntityType[],
  version: string = '1.0.0'
): RegistrySyncMessage {
  return {
    type: RegistryMessageType.REGISTRY_SYNC,
    data: {
      blocks,
      items,
      entities,
      version,
    },
  };
}

/**
 * Create a registry update message
 */
export function createRegistryUpdateMessage(
  updates: {
    addedBlocks?: BlockType[];
    removedBlocks?: string[];
    addedItems?: ItemType[];
    removedItems?: string[];
    addedEntities?: EntityType[];
    removedEntities?: string[];
  },
  version: string
): RegistryUpdateMessage {
  return {
    type: RegistryMessageType.REGISTRY_UPDATE,
    data: {
      ...updates,
      version,
    },
  };
}

/**
 * Create a registry acknowledgement message
 */
export function createRegistryAckMessage(
  success: boolean,
  version: string,
  counts: {
    blocks: number;
    items: number;
    entities: number;
  }
): RegistryAckMessage {
  return {
    type: RegistryMessageType.REGISTRY_ACK,
    data: {
      success,
      version,
      blocksCount: counts.blocks,
      itemsCount: counts.items,
      entitiesCount: counts.entities,
    },
  };
}
