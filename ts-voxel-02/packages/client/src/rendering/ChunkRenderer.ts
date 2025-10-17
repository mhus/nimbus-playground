/**
 * Chunk Renderer - Creates meshes from chunk data
 */

import {
  Mesh,
  VertexData,
  StandardMaterial,
  Texture,
  Color3,
  Scene
} from '@babylonjs/core';
import type { ChunkData } from '../world/ChunkManager';

/**
 * Renders chunks as Babylon.js meshes
 */
export class ChunkRenderer {
  private scene: Scene;
  private chunkSize = 32;
  private material?: StandardMaterial;

  constructor(scene: Scene) {
    this.scene = scene;
    this.createMaterial();
  }

  /**
   * Create material for chunks
   */
  private createMaterial(): void {
    this.material = new StandardMaterial('chunkMaterial', this.scene);

    // Try to load stone texture, fallback to color
    try {
      const texture = new Texture('/textures/stone.png', this.scene);
      this.material.diffuseTexture = texture;
    } catch (error) {
      console.warn('[ChunkRenderer] Failed to load texture, using color');
      this.material.diffuseColor = new Color3(0.5, 0.5, 0.5);
    }
  }

  /**
   * Create mesh from chunk data (simple voxel rendering)
   */
  createChunkMesh(chunk: ChunkData): Mesh {
    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    let vertexIndex = 0;
    const data = chunk.data;
    const height = chunk.height || 256;

    // Simple rendering: one cube per non-air block
    // Index formula must match server: x + y * chunkSize + z * chunkSize * height
    for (let x = 0; x < this.chunkSize; x++) {
      for (let z = 0; z < this.chunkSize; z++) {
        for (let y = 0; y < height; y++) {
          const index = x + y * this.chunkSize + z * this.chunkSize * height;
          const blockId = data[index];

          // Skip air blocks (id 0)
          if (blockId === 0) continue;

          // World position
          const wx = chunk.chunkX * this.chunkSize + x;
          const wy = y;
          const wz = chunk.chunkZ * this.chunkSize + z;

          // Add cube at this position
          this.addCubeFaces(
            wx, wy, wz,
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

    if (this.material) {
      mesh.material = this.material;
    }

    return mesh;
  }

  /**
   * Add all faces of a cube
   */
  private addCubeFaces(
    x: number, y: number, z: number,
    positions: number[], indices: number[], normals: number[], uvs: number[],
    vertexIndex: number
  ): void {
    const size = 1;

    // Top face
    this.addFace(
      [x, y + size, z], [x + size, y + size, z], [x + size, y + size, z + size], [x, y + size, z + size],
      [0, 1, 0],
      positions, indices, normals, uvs, vertexIndex
    );
    vertexIndex += 4;

    // Bottom face
    this.addFace(
      [x, y, z + size], [x + size, y, z + size], [x + size, y, z], [x, y, z],
      [0, -1, 0],
      positions, indices, normals, uvs, vertexIndex
    );
    vertexIndex += 4;

    // Front face
    this.addFace(
      [x, y, z + size], [x, y + size, z + size], [x + size, y + size, z + size], [x + size, y, z + size],
      [0, 0, 1],
      positions, indices, normals, uvs, vertexIndex
    );
    vertexIndex += 4;

    // Back face
    this.addFace(
      [x + size, y, z], [x + size, y + size, z], [x, y + size, z], [x, y, z],
      [0, 0, -1],
      positions, indices, normals, uvs, vertexIndex
    );
    vertexIndex += 4;

    // Right face
    this.addFace(
      [x + size, y, z + size], [x + size, y + size, z + size], [x + size, y + size, z], [x + size, y, z],
      [1, 0, 0],
      positions, indices, normals, uvs, vertexIndex
    );
    vertexIndex += 4;

    // Left face
    this.addFace(
      [x, y, z], [x, y + size, z], [x, y + size, z + size], [x, y, z + size],
      [-1, 0, 0],
      positions, indices, normals, uvs, vertexIndex
    );
  }

  /**
   * Add single face
   */
  private addFace(
    v1: number[], v2: number[], v3: number[], v4: number[],
    normal: number[],
    positions: number[], indices: number[], normals: number[], uvs: number[],
    vertexIndex: number
  ): void {
    // Positions
    positions.push(...v1, ...v2, ...v3, ...v4);

    // Normals (same for all 4 vertices)
    for (let i = 0; i < 4; i++) {
      normals.push(...normal);
    }

    // UVs (texture coordinates)
    uvs.push(
      0, 0,
      1, 0,
      1, 1,
      0, 1
    );

    // Indices (2 triangles)
    indices.push(
      vertexIndex, vertexIndex + 1, vertexIndex + 2,
      vertexIndex, vertexIndex + 2, vertexIndex + 3
    );
  }
}
