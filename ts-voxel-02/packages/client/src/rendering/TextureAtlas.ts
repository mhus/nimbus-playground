/**
 * Texture Atlas System
 *
 * Manages a single texture atlas containing all block textures
 * for efficient rendering with a single material.
 */

import { Texture, StandardMaterial, Color3, Scene } from '@babylonjs/core';
import type { BlockType } from '@voxel-02/core';

/**
 * UV coordinates for a texture in the atlas
 */
export interface AtlasUV {
  u0: number;  // Left
  v0: number;  // Top
  u1: number;  // Right
  v1: number;  // Bottom
}

/**
 * Face-specific UV mapping for blocks with different textures per face
 */
export interface BlockFaceUVs {
  top: AtlasUV;
  bottom: AtlasUV;
  sides: AtlasUV;
  north?: AtlasUV;  // Optional individual face UVs
  south?: AtlasUV;
  east?: AtlasUV;
  west?: AtlasUV;
}

/**
 * Configuration for the texture atlas
 */
export interface AtlasConfig {
  /** Path to atlas texture */
  texturePath: string;

  /** Size of individual textures in pixels */
  textureSize: number;

  /** Total width of atlas in pixels */
  atlasWidth: number;

  /** Total height of atlas in pixels */
  atlasHeight: number;

  /** Mapping of texture names to atlas positions */
  textureMap: Map<string, { x: number; y: number }>;
}

/**
 * Texture Atlas Manager
 */
export class TextureAtlas {
  private scene: Scene;
  private config: AtlasConfig;
  private texture?: Texture;
  private material?: StandardMaterial;

  // Cache for block UV mappings
  private blockUVCache: Map<string, BlockFaceUVs> = new Map();

  // Textures per row/column in atlas
  private texturesPerRow: number;
  private texturesPerColumn: number;

  // UV size for a single texture
  private uvSize: number;

  constructor(scene: Scene, config: AtlasConfig) {
    this.scene = scene;
    this.config = config;

    this.texturesPerRow = config.atlasWidth / config.textureSize;
    this.texturesPerColumn = config.atlasHeight / config.textureSize;
    this.uvSize = 1.0 / this.texturesPerRow;

    console.log(`[TextureAtlas] Initialized: ${this.texturesPerRow}x${this.texturesPerColumn} textures`);
  }

  /**
   * Load the atlas texture and create material
   */
  async load(): Promise<void> {
    console.log(`[TextureAtlas] Loading atlas from ${this.config.texturePath}...`);

    this.texture = new Texture(this.config.texturePath, this.scene);

    // Create shared material for all blocks
    this.material = new StandardMaterial('atlasMaterial', this.scene);
    this.material.diffuseTexture = this.texture;
    this.material.specularColor = new Color3(0, 0, 0);
    this.material.backFaceCulling = true;

    // Wait for texture to load
    await new Promise<void>((resolve) => {
      if (this.texture!.isReady()) {
        resolve();
      } else {
        this.texture!.onLoadObservable.addOnce(() => resolve());
      }
    });

    console.log('[TextureAtlas] Atlas loaded successfully');
  }

  /**
   * Get UV coordinates for a texture name
   */
  getTextureUV(textureName: string): AtlasUV | null {
    const pos = this.config.textureMap.get(textureName);
    if (!pos) {
      console.warn(`[TextureAtlas] Texture not found: ${textureName}`);
      return null;
    }

    // Calculate UV coordinates
    const u0 = pos.x * this.uvSize;
    const v0 = pos.y * this.uvSize;
    const u1 = u0 + this.uvSize;
    const v1 = v0 + this.uvSize;

    return { u0, v0, u1, v1 };
  }

  /**
   * Get UV mapping for a block (with face-specific textures)
   */
  getBlockUVs(block: BlockType): BlockFaceUVs {
    // Check cache
    if (this.blockUVCache.has(block.name)) {
      return this.blockUVCache.get(block.name)!;
    }

    let faceUVs: BlockFaceUVs;

    if (typeof block.texture === 'string') {
      // Single texture for all faces
      const uv = this.getTextureUV(block.texture) || this.getDefaultUV();
      faceUVs = {
        top: uv,
        bottom: uv,
        sides: uv,
      };
    } else if (Array.isArray(block.texture)) {
      if (block.texture.length === 1) {
        // Single texture
        const uv = this.getTextureUV(block.texture[0]) || this.getDefaultUV();
        faceUVs = {
          top: uv,
          bottom: uv,
          sides: uv,
        };
      } else if (block.texture.length === 2) {
        // Top/bottom, sides
        const topUV = this.getTextureUV(block.texture[0]) || this.getDefaultUV();
        const sideUV = this.getTextureUV(block.texture[1]) || this.getDefaultUV();
        faceUVs = {
          top: topUV,
          bottom: topUV,
          sides: sideUV,
        };
      } else if (block.texture.length === 3) {
        // Top, bottom, sides
        const topUV = this.getTextureUV(block.texture[0]) || this.getDefaultUV();
        const bottomUV = this.getTextureUV(block.texture[1]) || this.getDefaultUV();
        const sideUV = this.getTextureUV(block.texture[2]) || this.getDefaultUV();
        faceUVs = {
          top: topUV,
          bottom: bottomUV,
          sides: sideUV,
        };
      } else {
        // Top, bottom, north, south, east, west
        faceUVs = {
          top: this.getTextureUV(block.texture[0]) || this.getDefaultUV(),
          bottom: this.getTextureUV(block.texture[1]) || this.getDefaultUV(),
          sides: this.getTextureUV(block.texture[2]) || this.getDefaultUV(),
          north: this.getTextureUV(block.texture[2]) || this.getDefaultUV(),
          south: this.getTextureUV(block.texture[3] || block.texture[2]) || this.getDefaultUV(),
          east: this.getTextureUV(block.texture[4] || block.texture[2]) || this.getDefaultUV(),
          west: this.getTextureUV(block.texture[5] || block.texture[2]) || this.getDefaultUV(),
        };
      }
    } else {
      // Default fallback
      faceUVs = {
        top: this.getDefaultUV(),
        bottom: this.getDefaultUV(),
        sides: this.getDefaultUV(),
      };
    }

    // Cache result
    this.blockUVCache.set(block.name, faceUVs);

    return faceUVs;
  }

  /**
   * Get default UV (missing texture placeholder)
   */
  private getDefaultUV(): AtlasUV {
    // Return UV for "missing" texture (usually magenta/black checkerboard)
    return this.getTextureUV('missing') || { u0: 0, v0: 0, u1: this.uvSize, v1: this.uvSize };
  }

  /**
   * Get the shared material for all blocks
   */
  getMaterial(): StandardMaterial | undefined {
    return this.material;
  }

  /**
   * Get texture atlas instance
   */
  getTexture(): Texture | undefined {
    return this.texture;
  }

  /**
   * Check if atlas is loaded
   */
  isReady(): boolean {
    return this.texture?.isReady() === true;
  }

  /**
   * Clear UV cache (call when blocks change)
   */
  clearCache(): void {
    this.blockUVCache.clear();
    console.log('[TextureAtlas] UV cache cleared');
  }

  /**
   * Get atlas configuration
   */
  getConfig(): AtlasConfig {
    return this.config;
  }
}
