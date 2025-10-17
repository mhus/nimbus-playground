/**
 * Chunk Renderer - Creates meshes from chunk data using texture atlas
 */

import {
  Mesh,
  VertexData,
  Scene
} from '@babylonjs/core';
import type { ChunkData } from '../world/ChunkManager';
import type { TextureAtlas, BlockFaceUVs, AtlasUV } from './TextureAtlas';
import type { BlockType } from '@voxel-02/core';
import type { ClientRegistry } from '../registry/ClientRegistry';

/**
 * Renders chunks as Babylon.js meshes using texture atlas
 */
export class ChunkRenderer {
  private scene: Scene;
  private chunkSize = 32;
  private atlas: TextureAtlas;
  private registry: ClientRegistry;

  constructor(scene: Scene, atlas: TextureAtlas, registry: ClientRegistry) {
    this.scene = scene;
    this.atlas = atlas;
    this.registry = registry;

    console.log('[ChunkRenderer] Initialized with texture atlas');
  }


  /**
   * Create mesh from chunk data using texture atlas
   */
  createChunkMesh(chunk: ChunkData): Mesh {
    const data = chunk.data;
    const height = chunk.height || 256;

    // Single arrays for all blocks (using atlas means one material)
    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    let vertexIndex = 0;

    // Index formula must match server: x + y * chunkSize + z * chunkSize * height
    for (let x = 0; x < this.chunkSize; x++) {
      for (let z = 0; z < this.chunkSize; z++) {
        for (let y = 0; y < height; y++) {
          const index = x + y * this.chunkSize + z * this.chunkSize * height;
          const blockId = data[index];

          // Skip air blocks (id 0)
          if (blockId === 0) continue;

          // Get block type from registry
          const block = this.registry.getBlockByID(blockId);
          if (!block) {
            console.warn(`[ChunkRenderer] Unknown block ID: ${blockId}`);
            continue;
          }

          // Get UV mapping for this block
          const blockUVs = this.atlas.getBlockUVs(block);

          // World position
          const wx = chunk.chunkX * this.chunkSize + x;
          const wy = y;
          const wz = chunk.chunkZ * this.chunkSize + z;

          // Add cube faces with appropriate UVs
          this.addCubeFaces(
            wx, wy, wz,
            blockUVs,
            positions, indices, normals, uvs,
            vertexIndex
          );

          vertexIndex += 24; // 4 vertices per face * 6 faces
        }
      }
    }

    // Create mesh
    const mesh = new Mesh(`chunk_${chunk.chunkX}_${chunk.chunkZ}`, this.scene);

    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    vertexData.applyToMesh(mesh);

    // Use atlas material
    const material = this.atlas.getMaterial();
    if (material) {
      mesh.material = material;
    }

    console.log(`[ChunkRenderer] Created chunk ${chunk.chunkX},${chunk.chunkZ} with ${vertexIndex / 24} blocks`);

    return mesh;
  }

  /**
   * Add all faces of a cube with texture atlas UVs
   */
  private addCubeFaces(
    x: number, y: number, z: number,
    blockUVs: BlockFaceUVs,
    positions: number[], indices: number[], normals: number[], uvs: number[],
    vertexIndex: number
  ): void {
    const size = 1;

    // Top face
    this.addFace(
      [x, y + size, z], [x + size, y + size, z], [x + size, y + size, z + size], [x, y + size, z + size],
      [0, 1, 0],
      blockUVs.top,
      positions, indices, normals, uvs, vertexIndex
    );
    vertexIndex += 4;

    // Bottom face
    this.addFace(
      [x, y, z + size], [x + size, y, z + size], [x + size, y, z], [x, y, z],
      [0, -1, 0],
      blockUVs.bottom,
      positions, indices, normals, uvs, vertexIndex
    );
    vertexIndex += 4;

    // Front face (North)
    this.addFace(
      [x, y, z + size], [x, y + size, z + size], [x + size, y + size, z + size], [x + size, y, z + size],
      [0, 0, 1],
      blockUVs.north || blockUVs.sides,
      positions, indices, normals, uvs, vertexIndex
    );
    vertexIndex += 4;

    // Back face (South)
    this.addFace(
      [x + size, y, z], [x + size, y + size, z], [x, y + size, z], [x, y, z],
      [0, 0, -1],
      blockUVs.south || blockUVs.sides,
      positions, indices, normals, uvs, vertexIndex
    );
    vertexIndex += 4;

    // Right face (East)
    this.addFace(
      [x + size, y, z + size], [x + size, y + size, z + size], [x + size, y + size, z], [x + size, y, z],
      [1, 0, 0],
      blockUVs.east || blockUVs.sides,
      positions, indices, normals, uvs, vertexIndex
    );
    vertexIndex += 4;

    // Left face (West)
    this.addFace(
      [x, y, z], [x, y + size, z], [x, y + size, z + size], [x, y, z + size],
      [-1, 0, 0],
      blockUVs.west || blockUVs.sides,
      positions, indices, normals, uvs, vertexIndex
    );
  }

  /**
   * Add single face with atlas UV coordinates
   */
  private addFace(
    v1: number[], v2: number[], v3: number[], v4: number[],
    normal: number[],
    atlasUV: AtlasUV,
    positions: number[], indices: number[], normals: number[], uvs: number[],
    vertexIndex: number
  ): void {
    // Positions
    positions.push(...v1, ...v2, ...v3, ...v4);

    // Normals (same for all 4 vertices)
    for (let i = 0; i < 4; i++) {
      normals.push(...normal);
    }

    // UVs (texture coordinates from atlas)
    uvs.push(
      atlasUV.u0, atlasUV.v0,  // Bottom-left
      atlasUV.u1, atlasUV.v0,  // Bottom-right
      atlasUV.u1, atlasUV.v1,  // Top-right
      atlasUV.u0, atlasUV.v1   // Top-left
    );

    // Indices (2 triangles)
    indices.push(
      vertexIndex, vertexIndex + 1, vertexIndex + 2,
      vertexIndex, vertexIndex + 2, vertexIndex + 3
    );
  }
}
