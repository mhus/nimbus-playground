/**
 * Chunk Renderer - Creates meshes from chunk data using texture atlas
 */

import {
  Mesh,
  VertexData,
  Scene,
  Matrix,
  Vector3
} from '@babylonjs/core';
import type { ChunkData } from '@voxel-02/core';
import type { TextureAtlas, BlockFaceUVs, AtlasUV } from './TextureAtlas';
import type { BlockType } from '@voxel-02/core';
import type { ClientRegistry } from '../registry/ClientRegistry';
import {
  unpackMetadata,
  getRotationAngleRadians,
  type BlockMetadata,
  BlockFacing,
  RotationAxis
} from '@voxel-02/core';

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
   * Create mesh from chunk data using dynamic texture atlas
   */
  async createChunkMesh(chunk: ChunkData): Promise<Mesh> {
    console.log(`[ChunkRenderer] Starting to create chunk mesh ${chunk.chunkX},${chunk.chunkZ}`);

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

          // Get UV mapping for this block (loads texture into atlas if needed)
          const blockUVs = await this.atlas.getBlockUVs(block);

          // Get metadata if available
          const packedMetadata = chunk.metadata?.[index] || 0;
          const metadata = packedMetadata ? unpackMetadata(packedMetadata) : null;

          // World position
          const wx = chunk.chunkX * this.chunkSize + x;
          const wy = y;
          const wz = chunk.chunkZ * this.chunkSize + z;

          // Add cube faces with appropriate UVs and rotation
          this.addCubeFaces(
            wx, wy, wz,
            blockUVs,
            metadata,
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
    } else {
      console.error(`[ChunkRenderer] No material available for chunk ${chunk.chunkX},${chunk.chunkZ}!`);
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
    metadata: BlockMetadata | null,
    positions: number[], indices: number[], normals: number[], uvs: number[],
    vertexIndex: number
  ): void {
    const size = 1;

    // Calculate rotation matrix if metadata exists
    let rotationMatrix: Matrix | null = null;
    if (metadata && metadata.rotationAxis !== RotationAxis.NONE) {
      const angle = getRotationAngleRadians(metadata);
      rotationMatrix = this.getRotationMatrix(metadata.rotationAxis, angle);
    }

    // Block center for rotation
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const centerZ = z + size / 2;

    // Top face
    this.addFace(
      [x, y + size, z], [x + size, y + size, z], [x + size, y + size, z + size], [x, y + size, z + size],
      [0, 1, 0],
      blockUVs.top,
      rotationMatrix, centerX, centerY, centerZ,
      positions, indices, normals, uvs, vertexIndex
    );
    vertexIndex += 4;

    // Bottom face
    this.addFace(
      [x, y, z + size], [x + size, y, z + size], [x + size, y, z], [x, y, z],
      [0, -1, 0],
      blockUVs.bottom,
      rotationMatrix, centerX, centerY, centerZ,
      positions, indices, normals, uvs, vertexIndex
    );
    vertexIndex += 4;

    // Front face (North)
    this.addFace(
      [x, y, z + size], [x, y + size, z + size], [x + size, y + size, z + size], [x + size, y, z + size],
      [0, 0, 1],
      blockUVs.north || blockUVs.sides,
      rotationMatrix, centerX, centerY, centerZ,
      positions, indices, normals, uvs, vertexIndex
    );
    vertexIndex += 4;

    // Back face (South)
    this.addFace(
      [x + size, y, z], [x + size, y + size, z], [x, y + size, z], [x, y, z],
      [0, 0, -1],
      blockUVs.south || blockUVs.sides,
      rotationMatrix, centerX, centerY, centerZ,
      positions, indices, normals, uvs, vertexIndex
    );
    vertexIndex += 4;

    // Right face (East)
    this.addFace(
      [x + size, y, z + size], [x + size, y + size, z + size], [x + size, y + size, z], [x + size, y, z],
      [1, 0, 0],
      blockUVs.east || blockUVs.sides,
      rotationMatrix, centerX, centerY, centerZ,
      positions, indices, normals, uvs, vertexIndex
    );
    vertexIndex += 4;

    // Left face (West)
    this.addFace(
      [x, y, z], [x, y + size, z], [x, y + size, z + size], [x, y, z + size],
      [-1, 0, 0],
      blockUVs.west || blockUVs.sides,
      rotationMatrix, centerX, centerY, centerZ,
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
    rotationMatrix: Matrix | null,
    centerX: number, centerY: number, centerZ: number,
    positions: number[], indices: number[], normals: number[], uvs: number[],
    vertexIndex: number
  ): void {
    // Apply rotation if matrix exists
    const vertices = [v1, v2, v3, v4];
    const rotatedVertices = vertices.map(v => {
      if (rotationMatrix) {
        // Translate to origin, rotate, translate back
        const vec = Vector3.FromArray([
          v[0] - centerX,
          v[1] - centerY,
          v[2] - centerZ
        ]);
        const rotated = Vector3.TransformCoordinates(vec, rotationMatrix);
        return [
          rotated.x + centerX,
          rotated.y + centerY,
          rotated.z + centerZ
        ];
      }
      return v;
    });

    // Positions
    positions.push(...rotatedVertices[0], ...rotatedVertices[1], ...rotatedVertices[2], ...rotatedVertices[3]);

    // Rotate normals if needed
    let finalNormal = normal;
    if (rotationMatrix) {
      const normalVec = Vector3.FromArray(normal);
      const rotatedNormal = Vector3.TransformNormal(normalVec, rotationMatrix);
      finalNormal = [rotatedNormal.x, rotatedNormal.y, rotatedNormal.z];
    }

    // Normals (same for all 4 vertices)
    for (let i = 0; i < 4; i++) {
      normals.push(...finalNormal);
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

  /**
   * Get rotation matrix for given axis and angle
   */
  private getRotationMatrix(axis: RotationAxis, angle: number): Matrix {
    switch (axis) {
      case RotationAxis.X:
        return Matrix.RotationX(angle);
      case RotationAxis.Y:
        return Matrix.RotationY(angle);
      case RotationAxis.Z:
        return Matrix.RotationZ(angle);
      default:
        return Matrix.Identity();
    }
  }
}
