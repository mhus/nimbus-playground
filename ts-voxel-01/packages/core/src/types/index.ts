// Core types used across client and server
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ChunkPosition {
  x: number;
  y: number;
  z: number;
}

export interface BlockType {
  id: number;
  name: string;
  solid: boolean;
  transparent: boolean;
}

export interface WorldConfig {
  chunkSize: number;
  worldHeight: number;
  seed: number;
}

export const CHUNK_SIZE = 32;
export const WORLD_HEIGHT = 256;
