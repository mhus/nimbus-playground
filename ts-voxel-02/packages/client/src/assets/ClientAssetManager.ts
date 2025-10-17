/**
 * Client Asset Manager
 *
 * Manages asset loading from server with caching
 */

import type { AssetManifest, AssetMetadata } from '@voxel-02/core';

export class ClientAssetManager {
  private manifest: AssetManifest | null = null;
  private loadedAssets: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  constructor() {
    console.log('[ClientAssetManager] Initialized');
  }

  /**
   * Load manifest from server
   */
  async loadManifest(manifest: AssetManifest): Promise<void> {
    this.manifest = manifest;
    console.log(`[ClientAssetManager] Loaded manifest with ${manifest.assets.length} assets`);
    console.log(`[ClientAssetManager] Base URL: ${manifest.baseUrl}`);

    // Log asset summary
    this.logAssetSummary();
  }

  /**
   * Log asset summary
   */
  private logAssetSummary(): void {
    if (!this.manifest) return;

    const byType = new Map<string, number>();
    for (const asset of this.manifest.assets) {
      byType.set(asset.type, (byType.get(asset.type) || 0) + 1);
    }

    console.log('[ClientAssetManager] Available assets:');
    byType.forEach((count, type) => {
      console.log(`  ${type}: ${count}`);
    });
  }

  /**
   * Get asset metadata by ID
   */
  getAsset(assetId: string): AssetMetadata | undefined {
    if (!this.manifest) return undefined;
    return this.manifest.assets.find(a => a.id === assetId);
  }

  /**
   * Get asset URL
   */
  getAssetUrl(assetId: string): string | null {
    const asset = this.getAsset(assetId);
    if (!asset || !this.manifest) return null;

    return `${this.manifest.baseUrl}/${asset.path}`;
  }

  /**
   * Load asset (with caching)
   */
  async loadAsset(assetId: string): Promise<any> {
    // Check if already loaded
    if (this.loadedAssets.has(assetId)) {
      return this.loadedAssets.get(assetId);
    }

    // Check if currently loading
    if (this.loadingPromises.has(assetId)) {
      return this.loadingPromises.get(assetId);
    }

    // Start loading
    const loadPromise = this.fetchAsset(assetId);
    this.loadingPromises.set(assetId, loadPromise);

    try {
      const data = await loadPromise;
      this.loadedAssets.set(assetId, data);
      this.loadingPromises.delete(assetId);
      return data;
    } catch (error) {
      this.loadingPromises.delete(assetId);
      throw error;
    }
  }

  /**
   * Fetch asset from server
   */
  private async fetchAsset(assetId: string): Promise<any> {
    const url = this.getAssetUrl(assetId);
    if (!url) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    const asset = this.getAsset(assetId);
    if (!asset) {
      throw new Error(`Asset metadata not found: ${assetId}`);
    }

    console.log(`[ClientAssetManager] Loading asset: ${assetId} from ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch asset ${assetId}: ${response.statusText}`);
    }

    // Return appropriate data based on asset type
    switch (asset.type) {
      case 'texture':
        return response.blob();
      case 'audio':
        return response.arrayBuffer();
      case 'model':
        if (asset.mimeType === 'model/gltf+json') {
          return response.json();
        }
        return response.arrayBuffer();
      default:
        return response.blob();
    }
  }

  /**
   * Preload multiple assets
   */
  async preloadAssets(assetIds: string[]): Promise<void> {
    console.log(`[ClientAssetManager] Preloading ${assetIds.length} assets...`);

    const promises = assetIds.map(id => this.loadAsset(id).catch(error => {
      console.error(`[ClientAssetManager] Failed to preload ${id}:`, error);
    }));

    await Promise.all(promises);

    console.log(`[ClientAssetManager] Preloaded ${assetIds.length} assets`);
  }

  /**
   * Preload all textures
   */
  async preloadTextures(): Promise<void> {
    if (!this.manifest) return;

    const textureAssets = this.manifest.assets
      .filter(a => a.type === 'texture')
      .map(a => a.id);

    await this.preloadAssets(textureAssets);
  }

  /**
   * Get all assets of specific type
   */
  getAssetsByType(type: string): AssetMetadata[] {
    if (!this.manifest) return [];
    return this.manifest.assets.filter(a => a.type === type);
  }

  /**
   * Get all assets of specific category
   */
  getAssetsByCategory(category: string): AssetMetadata[] {
    if (!this.manifest) return [];
    return this.manifest.assets.filter(a => a.category === category);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.loadedAssets.clear();
    this.loadingPromises.clear();
    console.log('[ClientAssetManager] Cache cleared');
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.loadedAssets.size;
  }

  /**
   * Check if manifest is loaded
   */
  hasManifest(): boolean {
    return this.manifest !== null;
  }
}
