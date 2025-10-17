/**
 * Chunk Data Structure
 *
 * Defines the structure for chunk data transmission and storage.
 * Chunks are 32x32xH blocks with optional metadata.
 */

/**
 * Chunk data structure for network transmission and storage
 */
export interface ChunkData {
  /** Chunk X coordinate */
  chunkX: number;

  /** Chunk Z coordinate */
  chunkZ: number;

  /** Block IDs (Uint16Array or number array) */
  data: Uint16Array | number[];

  /** Chunk height (Y dimension), defaults to 256 */
  height?: number;

  /** Optional metadata array (packed 16-bit metadata per block) */
  metadata?: Uint16Array | number[];

  /** Whether data is compressed */
  compressed?: boolean;
}

/**
 * Create empty chunk data
 */
export function createEmptyChunkData(
  chunkX: number,
  chunkZ: number,
  chunkSize: number = 32,
  height: number = 256
): ChunkData {
  const totalBlocks = chunkSize * chunkSize * height;

  return {
    chunkX,
    chunkZ,
    data: new Uint16Array(totalBlocks),
    height,
    metadata: new Uint16Array(totalBlocks), // All zeros = default metadata
  };
}

/**
 * Get block index from coordinates
 * Formula: x + y * chunkSize + z * chunkSize * height
 */
export function getBlockIndex(
  x: number,
  y: number,
  z: number,
  chunkSize: number = 32,
  height: number = 256
): number {
  return x + y * chunkSize + z * chunkSize * height;
}

/**
 * Get coordinates from block index
 */
export function getBlockCoordinates(
  index: number,
  chunkSize: number = 32,
  height: number = 256
): { x: number; y: number; z: number } {
  const x = index % chunkSize;
  const y = Math.floor((index % (chunkSize * height)) / chunkSize);
  const z = Math.floor(index / (chunkSize * height));

  return { x, y, z };
}

/**
 * Set block in chunk data
 */
export function setBlock(
  chunk: ChunkData,
  x: number,
  y: number,
  z: number,
  blockId: number,
  metadata: number = 0,
  chunkSize: number = 32
): void {
  const height = chunk.height || 256;
  const index = getBlockIndex(x, y, z, chunkSize, height);

  // Ensure arrays exist
  if (!chunk.data) {
    chunk.data = new Uint16Array(chunkSize * chunkSize * height);
  }
  if (!chunk.metadata && metadata !== 0) {
    chunk.metadata = new Uint16Array(chunkSize * chunkSize * height);
  }

  // Set block ID
  if (Array.isArray(chunk.data)) {
    chunk.data[index] = blockId;
  } else {
    chunk.data[index] = blockId;
  }

  // Set metadata if provided
  if (metadata !== 0 && chunk.metadata) {
    if (Array.isArray(chunk.metadata)) {
      chunk.metadata[index] = metadata;
    } else {
      chunk.metadata[index] = metadata;
    }
  }
}

/**
 * Get block from chunk data
 */
export function getBlock(
  chunk: ChunkData,
  x: number,
  y: number,
  z: number,
  chunkSize: number = 32
): { blockId: number; metadata: number } {
  const height = chunk.height || 256;
  const index = getBlockIndex(x, y, z, chunkSize, height);

  const blockId = chunk.data[index] || 0;
  const metadata = chunk.metadata?.[index] || 0;

  return { blockId, metadata };
}
