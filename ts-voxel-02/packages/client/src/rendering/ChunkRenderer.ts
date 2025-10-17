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
  private materials: Map<number, StandardMaterial> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;
    this.createMaterials();
  }

  /**
   * Create materials for different block types
   */
  private createMaterials(): void {
    // Block ID 1: Stone
    const stoneMat = new StandardMaterial('stoneMaterial', this.scene);
    stoneMat.diffuseTexture = new Texture('/textures/block/stone.png', this.scene);
    stoneMat.specularColor = new Color3(0, 0, 0); // No specular
    this.materials.set(1, stoneMat);

    // Block ID 2: Dirt
    const dirtMat = new StandardMaterial('dirtMaterial', this.scene);
    dirtMat.diffuseTexture = new Texture('/textures/block/dirt.png', this.scene);
    dirtMat.specularColor = new Color3(0, 0, 0);
    this.materials.set(2, dirtMat);

    // Block ID 3: Grass (for now, just use grass texture on all sides)
    const grassMat = new StandardMaterial('grassMaterial', this.scene);
    grassMat.diffuseTexture = new Texture('/textures/block/grass.png', this.scene);
    grassMat.specularColor = new Color3(0, 0, 0);
    this.materials.set(3, grassMat);

    console.log('[ChunkRenderer] Created materials for 3 block types');
  }

  /**
   * Get material for block ID
   */
  private getMaterial(blockId: number): StandardMaterial | undefined {
    return this.materials.get(blockId);
  }

  /**
   * Create mesh from chunk data (simple voxel rendering)
   */
  createChunkMesh(chunk: ChunkData): Mesh {
    const data = chunk.data;
    const height = chunk.height || 256;

    // Group blocks by type
    const blocksByType: Map<number, Array<{x: number, y: number, z: number}>> = new Map();

    // Index formula must match server: x + y * chunkSize + z * chunkSize * height
    for (let x = 0; x < this.chunkSize; x++) {
      for (let z = 0; z < this.chunkSize; z++) {
        for (let y = 0; y < height; y++) {
          const index = x + y * this.chunkSize + z * this.chunkSize * height;
          const blockId = data[index];

          // Skip air blocks (id 0)
          if (blockId === 0) continue;

          if (!blocksByType.has(blockId)) {
            blocksByType.set(blockId, []);
          }

          blocksByType.get(blockId)!.push({x, y, z});
        }
      }
    }

    // Create parent mesh
    const parentMesh = new Mesh(`chunk_${chunk.chunkX}_${chunk.chunkZ}`, this.scene);

    // Create sub-mesh for each block type
    for (const [blockId, blocks] of blocksByType.entries()) {
      const positions: number[] = [];
      const indices: number[] = [];
      const normals: number[] = [];
      const uvs: number[] = [];
      let vertexIndex = 0;

      for (const block of blocks) {
        // World position
        const wx = chunk.chunkX * this.chunkSize + block.x;
        const wy = block.y;
        const wz = chunk.chunkZ * this.chunkSize + block.z;

        // Add cube at this position
        this.addCubeFaces(
          wx, wy, wz,
          positions, indices, normals, uvs,
          vertexIndex
        );

        vertexIndex += 24; // 4 vertices per face * 6 faces
      }

      // Create sub-mesh for this block type
      const subMesh = new Mesh(`chunk_${chunk.chunkX}_${chunk.chunkZ}_block${blockId}`, this.scene);
      subMesh.parent = parentMesh;

      const vertexData = new VertexData();
      vertexData.positions = positions;
      vertexData.indices = indices;
      vertexData.normals = normals;
      vertexData.uvs = uvs;

      vertexData.applyToMesh(subMesh);

      // Apply material for this block type
      const material = this.getMaterial(blockId);
      if (material) {
        subMesh.material = material;
      }
    }

    console.log(`[ChunkRenderer] Created chunk ${chunk.chunkX},${chunk.chunkZ} with ${blocksByType.size} block types`);

    return parentMesh;
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
