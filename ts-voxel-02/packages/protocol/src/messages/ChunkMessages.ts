/**
 * Chunk Protocol Messages
 *
 * Messages for chunk data transmission between server and client
 */

export enum ChunkMessageType {
  CHUNK_REQUEST = 'chunk_request',
  CHUNK_DATA = 'chunk_data',
  CHUNK_UPDATE = 'chunk_update',
  CHUNK_UNLOAD = 'chunk_unload',
}

/**
 * Request chunk data from server
 */
export interface ChunkRequestMessage {
  type: ChunkMessageType.CHUNK_REQUEST;
  data: {
    chunkX: number;
    chunkZ: number;
  };
}

/**
 * Chunk data from server to client
 * Includes block IDs and optional metadata
 */
export interface ChunkDataMessage {
  type: ChunkMessageType.CHUNK_DATA;
  data: {
    chunkX: number;
    chunkZ: number;
    /** Block IDs (16-bit) */
    data: number[] | Uint16Array;
    /** Chunk height (Y dimension) */
    height: number;
    /** Optional packed metadata (16-bit per block) */
    metadata?: number[] | Uint16Array;
    /** Whether data is compressed */
    compressed?: boolean;
  };
}

/**
 * Update single block in chunk
 */
export interface ChunkUpdateMessage {
  type: ChunkMessageType.CHUNK_UPDATE;
  data: {
    chunkX: number;
    chunkZ: number;
    /** Local block coordinates within chunk */
    x: number;
    y: number;
    z: number;
    /** New block ID */
    blockId: number;
    /** New packed metadata (optional) */
    metadata?: number;
  };
}

/**
 * Unload chunk on client
 */
export interface ChunkUnloadMessage {
  type: ChunkMessageType.CHUNK_UNLOAD;
  data: {
    chunkX: number;
    chunkZ: number;
  };
}

/**
 * Union type for all chunk messages
 */
export type ChunkMessage =
  | ChunkRequestMessage
  | ChunkDataMessage
  | ChunkUpdateMessage
  | ChunkUnloadMessage;

/**
 * Create chunk request message
 */
export function createChunkRequestMessage(chunkX: number, chunkZ: number): ChunkRequestMessage {
  return {
    type: ChunkMessageType.CHUNK_REQUEST,
    data: { chunkX, chunkZ },
  };
}

/**
 * Create chunk data message
 */
export function createChunkDataMessage(
  chunkX: number,
  chunkZ: number,
  data: number[] | Uint16Array,
  height: number,
  metadata?: number[] | Uint16Array,
  compressed: boolean = false
): ChunkDataMessage {
  return {
    type: ChunkMessageType.CHUNK_DATA,
    data: {
      chunkX,
      chunkZ,
      data,
      height,
      metadata,
      compressed,
    },
  };
}

/**
 * Create chunk update message
 */
export function createChunkUpdateMessage(
  chunkX: number,
  chunkZ: number,
  x: number,
  y: number,
  z: number,
  blockId: number,
  metadata?: number
): ChunkUpdateMessage {
  return {
    type: ChunkMessageType.CHUNK_UPDATE,
    data: {
      chunkX,
      chunkZ,
      x,
      y,
      z,
      blockId,
      metadata,
    },
  };
}

/**
 * Create chunk unload message
 */
export function createChunkUnloadMessage(chunkX: number, chunkZ: number): ChunkUnloadMessage {
  return {
    type: ChunkMessageType.CHUNK_UNLOAD,
    data: { chunkX, chunkZ },
  };
}
