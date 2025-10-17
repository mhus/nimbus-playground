/**
 * Dynamic Texture Atlas System
 *
 * Loads individual textures from the asset server and builds a dynamic texture atlas
 * at runtime for efficient rendering.
 */

import { DynamicTexture, StandardMaterial, Color3, Scene, RawTexture } from '@babylonjs/core';
import type { BlockType } from '@voxel-02/core';
import type { ClientAssetManager } from '../assets/ClientAssetManager';

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
  /** Base URL for asset server */
  assetServerUrl: string;

  /** Asset manager instance */
  assetManager?: ClientAssetManager;

  /** Size of individual textures in pixels (default: 16) */
  textureSize?: number;

  /** Maximum atlas size in pixels (default: 2048) */
  maxAtlasSize?: number;
}

/**
 * Dynamic Texture Atlas - Builds runtime atlas from server textures
 */
export class TextureAtlas {
  private scene: Scene;
  private config: AtlasConfig;
  private assetManager?: ClientAssetManager;

  // Atlas configuration
  private textureSize: number;
  private maxAtlasSize: number;
  private texturesPerRow: number;
  private uvSize: number;

  // Dynamic atlas canvas and texture
  private atlasCanvas?: HTMLCanvasElement;
  private atlasContext?: CanvasRenderingContext2D;
  private atlasTexture?: DynamicTexture;
  private material?: StandardMaterial;

  // Texture tracking
  private textureMap: Map<string, { x: number; y: number }> = new Map();
  private nextSlot = 0;
  private textureLoaded: Set<string> = new Set();

  // Cache
  private blockUVCache: Map<string, BlockFaceUVs> = new Map();

  constructor(scene: Scene, config: AtlasConfig) {
    this.scene = scene;
    this.config = config;
    this.assetManager = config.assetManager;

    this.textureSize = config.textureSize || 16;
    this.maxAtlasSize = config.maxAtlasSize || 2048;
    this.texturesPerRow = Math.floor(this.maxAtlasSize / this.textureSize);
    this.uvSize = 1.0 / this.texturesPerRow;

    console.log(`[TextureAtlas] Initialized dynamic atlas: ${this.texturesPerRow}x${this.texturesPerRow} slots (${this.maxAtlasSize}x${this.maxAtlasSize}px)`);
  }

  /**
   * Set asset manager (if not provided in constructor)
   */
  setAssetManager(assetManager: ClientAssetManager): void {
    this.assetManager = assetManager;
  }

  /**
   * Initialize the dynamic texture atlas
   */
  async load(): Promise<void> {
    console.log('[TextureAtlas] Creating dynamic texture atlas...');

    // Create canvas for atlas
    this.atlasCanvas = document.createElement('canvas');
    this.atlasCanvas.width = this.maxAtlasSize;
    this.atlasCanvas.height = this.maxAtlasSize;
    this.atlasContext = this.atlasCanvas.getContext('2d', { willReadFrequently: false })!;

    // Fill with magenta background (missing texture indicator)
    this.atlasContext.fillStyle = '#FF00FF';
    this.atlasContext.fillRect(0, 0, this.maxAtlasSize, this.maxAtlasSize);

    // Create dynamic texture
    this.atlasTexture = new DynamicTexture('dynamicAtlas', this.maxAtlasSize, this.scene, true);

    // Get texture context and draw initial canvas
    const textureContext = this.atlasTexture.getContext();
    textureContext.drawImage(this.atlasCanvas, 0, 0);
    this.atlasTexture.update();

    // Create material
    this.material = new StandardMaterial('atlasMaterial', this.scene);
    this.material.diffuseTexture = this.atlasTexture;
    this.material.specularColor = new Color3(0, 0, 0);
    this.material.backFaceCulling = true;

    console.log('[TextureAtlas] Dynamic atlas created');
  }

  /**
   * Load a texture into the dynamic atlas
   */
  async loadTextureIntoAtlas(texturePath: string): Promise<{ x: number; y: number }> {
    // Check if already loaded
    if (this.textureMap.has(texturePath)) {
      return this.textureMap.get(texturePath)!;
    }

    // Check if we have space
    const maxSlots = this.texturesPerRow * this.texturesPerRow;
    if (this.nextSlot >= maxSlots) {
      console.warn(`[TextureAtlas] Atlas full! Cannot load texture: ${texturePath}`);
      return { x: 0, y: 0 }; // Return first slot (magenta)
    }

    // Calculate slot position
    const slotX = this.nextSlot % this.texturesPerRow;
    const slotY = Math.floor(this.nextSlot / this.texturesPerRow);
    this.nextSlot++;

    console.log(`[TextureAtlas] Loading texture into slot ${slotX},${slotY}: ${texturePath}`);

    try {
      // Load image
      const img = await this.loadImage(`${this.config.assetServerUrl}/${texturePath}`);

      // Draw into atlas canvas
      const pixelX = slotX * this.textureSize;
      const pixelY = slotY * this.textureSize;
      this.atlasContext!.drawImage(img, pixelX, pixelY, this.textureSize, this.textureSize);

      // Update dynamic texture from canvas
      const context = this.atlasTexture!.getContext();
      context.drawImage(this.atlasCanvas!, 0, 0);
      this.atlasTexture!.update();

      // Cache position
      const position = { x: slotX, y: slotY };
      this.textureMap.set(texturePath, position);
      this.textureLoaded.add(texturePath);

      return position;
    } catch (error) {
      console.error(`[TextureAtlas] Failed to load texture ${texturePath}:`, error);
      return { x: 0, y: 0 }; // Return first slot (magenta)
    }
  }

  /**
   * Load image from URL
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  /**
   * Get UV coordinates for a texture in the atlas
   */
  async getTextureUV(textureName: string): Promise<AtlasUV> {
    // Normalize texture path
    const path = this.normalizeTexturePath(textureName);

    // Ensure texture is loaded into atlas
    const pos = await this.loadTextureIntoAtlas(path);

    // Calculate UV coordinates
    const u0 = pos.x * this.uvSize;
    const v0 = pos.y * this.uvSize;
    const u1 = u0 + this.uvSize;
    const v1 = v0 + this.uvSize;

    return { u0, v0, u1, v1 };
  }

  /**
   * Get UV mapping for a block (with face-specific textures)
   * Loads textures into atlas dynamically
   */
  async getBlockUVs(block: BlockType): Promise<BlockFaceUVs> {
    // Check cache
    if (this.blockUVCache.has(block.name)) {
      return this.blockUVCache.get(block.name)!;
    }

    let faceUVs: BlockFaceUVs;

    if (typeof block.texture === 'string') {
      // Single texture for all faces
      const uv = await this.getTextureUV(block.texture);
      faceUVs = {
        top: uv,
        bottom: uv,
        sides: uv,
      };
    } else if (Array.isArray(block.texture)) {
      if (block.texture.length === 1) {
        // Single texture
        const uv = await this.getTextureUV(block.texture[0]);
        faceUVs = {
          top: uv,
          bottom: uv,
          sides: uv,
        };
      } else if (block.texture.length === 2) {
        // Top/bottom, sides
        const topUV = await this.getTextureUV(block.texture[0]);
        const sideUV = await this.getTextureUV(block.texture[1]);
        faceUVs = {
          top: topUV,
          bottom: topUV,
          sides: sideUV,
        };
      } else if (block.texture.length === 3) {
        // Top, bottom, sides
        const topUV = await this.getTextureUV(block.texture[0]);
        const bottomUV = await this.getTextureUV(block.texture[1]);
        const sideUV = await this.getTextureUV(block.texture[2]);
        faceUVs = {
          top: topUV,
          bottom: bottomUV,
          sides: sideUV,
        };
      } else {
        // Top, bottom, north, south, east, west
        const topUV = await this.getTextureUV(block.texture[0]);
        const bottomUV = await this.getTextureUV(block.texture[1]);
        const northUV = await this.getTextureUV(block.texture[2]);
        const southUV = await this.getTextureUV(block.texture[3] || block.texture[2]);
        const eastUV = await this.getTextureUV(block.texture[4] || block.texture[2]);
        const westUV = await this.getTextureUV(block.texture[5] || block.texture[2]);
        faceUVs = {
          top: topUV,
          bottom: bottomUV,
          sides: northUV,
          north: northUV,
          south: southUV,
          east: eastUV,
          west: westUV,
        };
      }
    } else {
      // Default fallback
      const defaultUV = await this.getTextureUV('stone');
      faceUVs = {
        top: defaultUV,
        bottom: defaultUV,
        sides: defaultUV,
      };
    }

    // Cache result
    this.blockUVCache.set(block.name, faceUVs);

    return faceUVs;
  }

  /**
   * Normalize texture path (add .png extension if missing)
   */
  private normalizeTexturePath(path: string): string {
    // If path starts with 'block/', prepend 'textures/'
    if (path.startsWith('block/')) {
      path = `textures/${path}`;
    }
    // If path doesn't start with 'textures/', prepend 'textures/block/'
    else if (!path.startsWith('textures/')) {
      path = `textures/block/${path}`;
    }

    // Add .png extension if missing
    if (!path.endsWith('.png')) {
      path = `${path}.png`;
    }

    return path;
  }

  /**
   * Get the atlas material
   */
  getMaterial(): StandardMaterial | undefined {
    return this.material;
  }

  /**
   * Get the dynamic atlas texture
   */
  getTexture(): DynamicTexture | undefined {
    return this.atlasTexture;
  }

  /**
   * Check if texture system is ready
   */
  isReady(): boolean {
    return this.atlasTexture !== undefined && this.material !== undefined;
  }

  /**
   * Clear caches (call when blocks change)
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

  /**
   * Get atlas statistics
   */
  getStats(): { loadedTextures: number; totalSlots: number; usedSlots: number } {
    const totalSlots = this.texturesPerRow * this.texturesPerRow;
    return {
      loadedTextures: this.textureLoaded.size,
      totalSlots,
      usedSlots: this.nextSlot,
    };
  }
}
