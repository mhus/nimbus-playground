import type { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { ChunkPosition, Vec3 } from '@voxel/core';
import { CHUNK_SIZE, chunkPositionToKey } from '@voxel/core';

interface ChunkMesh {
  mesh: Mesh;
  data: Uint8Array;
}

export class WorldRenderer {
  private scene: Scene;
  private chunks = new Map<string, ChunkMesh>();
  private materials: StandardMaterial[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
    this.initMaterials();
  }

  private initMaterials(): void {
    // Air (0) - no material needed
    this.materials[0] = this.createMaterial('air', new Color3(0, 0, 0));

    // Stone (1)
    this.materials[1] = this.createMaterial('stone', new Color3(0.5, 0.5, 0.5));

    // Dirt (2)
    this.materials[2] = this.createMaterial('dirt', new Color3(0.6, 0.4, 0.2));

    // Grass (3)
    this.materials[3] = this.createMaterial('grass', new Color3(0.2, 0.8, 0.2));
  }

  private createMaterial(name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.1, 0.1, 0.1);
    return material;
  }

  addChunk(position: ChunkPosition, data: Uint8Array): void {
    const key = chunkPositionToKey(position.x, position.y, position.z);

    // Remove existing chunk if present
    if (this.chunks.has(key)) {
      this.removeChunk(position);
    }

    // Create mesh for chunk
    const mesh = this.createChunkMesh(position, data);
    this.chunks.set(key, { mesh, data });
  }

  private createChunkMesh(position: ChunkPosition, data: Uint8Array): Mesh {
    const mesh = new Mesh(`chunk_${position.x}_${position.y}_${position.z}`, this.scene);

    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];

    let vertexIndex = 0;

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const blockType = data[x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE];

          if (blockType === 0) continue; // Skip air blocks

          const worldX = position.x * CHUNK_SIZE + x;
          const worldY = position.y * CHUNK_SIZE + y;
          const worldZ = position.z * CHUNK_SIZE + z;

          const color = this.getBlockColor(blockType);

          // Check each face and add if exposed
          const faces = [
            { dir: [0, 0, 1], check: [x, y, z + 1] },  // Front
            { dir: [0, 0, -1], check: [x, y, z - 1] }, // Back
            { dir: [1, 0, 0], check: [x + 1, y, z] },  // Right
            { dir: [-1, 0, 0], check: [x - 1, y, z] }, // Left
            { dir: [0, 1, 0], check: [x, y + 1, z] },  // Top
            { dir: [0, -1, 0], check: [x, y - 1, z] }, // Bottom
          ];

          for (const face of faces) {
            const [cx, cy, cz] = face.check;
            if (this.isBlockTransparent(data, cx, cy, cz)) {
              this.addFace(positions, indices, normals, colors, worldX, worldY, worldZ, face.dir, color, vertexIndex);
              vertexIndex += 4;
            }
          }
        }
      }
    }

    if (positions.length > 0) {
      const vertexData = new VertexData();
      vertexData.positions = positions;
      vertexData.indices = indices;
      vertexData.normals = normals;
      vertexData.colors = colors;
      vertexData.applyToMesh(mesh);
    }

    return mesh;
  }

  private isBlockTransparent(data: Uint8Array, x: number, y: number, z: number): boolean {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) {
      return true; // Outside chunk bounds, consider transparent
    }

    const blockType = data[x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE];
    return blockType === 0;
  }

  private getBlockColor(blockType: number): Color3 {
    return this.materials[blockType]?.diffuseColor || new Color3(1, 0, 1);
  }

  private addFace(
    positions: number[],
    indices: number[],
    normals: number[],
    colors: number[],
    x: number,
    y: number,
    z: number,
    dir: number[],
    color: Color3,
    startIndex: number
  ): void {
    const [nx, ny, nz] = dir;

    // Define vertices based on direction
    let vertices: number[][];
    if (ny === 1) {
      // Top face
      vertices = [
        [x, y + 1, z],
        [x + 1, y + 1, z],
        [x + 1, y + 1, z + 1],
        [x, y + 1, z + 1],
      ];
    } else if (ny === -1) {
      // Bottom face
      vertices = [
        [x, y, z],
        [x, y, z + 1],
        [x + 1, y, z + 1],
        [x + 1, y, z],
      ];
    } else if (nz === 1) {
      // Front face
      vertices = [
        [x, y, z + 1],
        [x, y + 1, z + 1],
        [x + 1, y + 1, z + 1],
        [x + 1, y, z + 1],
      ];
    } else if (nz === -1) {
      // Back face
      vertices = [
        [x, y, z],
        [x + 1, y, z],
        [x + 1, y + 1, z],
        [x, y + 1, z],
      ];
    } else if (nx === 1) {
      // Right face
      vertices = [
        [x + 1, y, z],
        [x + 1, y, z + 1],
        [x + 1, y + 1, z + 1],
        [x + 1, y + 1, z],
      ];
    } else {
      // Left face
      vertices = [
        [x, y, z],
        [x, y + 1, z],
        [x, y + 1, z + 1],
        [x, y, z + 1],
      ];
    }

    // Add vertices
    for (const v of vertices) {
      positions.push(v[0], v[1], v[2]);
      normals.push(nx, ny, nz);
      colors.push(color.r, color.g, color.b, 1);
    }

    // Add indices (two triangles per face)
    indices.push(
      startIndex, startIndex + 1, startIndex + 2,
      startIndex, startIndex + 2, startIndex + 3
    );
  }

  removeChunk(position: ChunkPosition): void {
    const key = chunkPositionToKey(position.x, position.y, position.z);
    const chunk = this.chunks.get(key);

    if (chunk) {
      chunk.mesh.dispose();
      this.chunks.delete(key);
    }
  }

  updateBlock(position: Vec3, blockType: number): void {
    // Find which chunk contains this block
    const chunkX = Math.floor(position.x / CHUNK_SIZE);
    const chunkY = Math.floor(position.y / CHUNK_SIZE);
    const chunkZ = Math.floor(position.z / CHUNK_SIZE);

    const key = chunkPositionToKey(chunkX, chunkY, chunkZ);
    const chunk = this.chunks.get(key);

    if (chunk) {
      // Update chunk data
      const localX = Math.floor(position.x) - chunkX * CHUNK_SIZE;
      const localY = Math.floor(position.y) - chunkY * CHUNK_SIZE;
      const localZ = Math.floor(position.z) - chunkZ * CHUNK_SIZE;

      const index = localX + localY * CHUNK_SIZE + localZ * CHUNK_SIZE * CHUNK_SIZE;
      chunk.data[index] = blockType;

      // Rebuild chunk mesh
      chunk.mesh.dispose();
      const newMesh = this.createChunkMesh({ x: chunkX, y: chunkY, z: chunkZ }, chunk.data);
      chunk.mesh = newMesh;
    }
  }

  getChunkCount(): number {
    return this.chunks.size;
  }
}
