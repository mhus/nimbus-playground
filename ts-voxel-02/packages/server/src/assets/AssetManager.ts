/**
 * Server Asset Manager
 *
 * Manages asset discovery, manifest generation, and serving
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  type AssetManifest,
  type AssetMetadata,
  createEmptyManifest,
  createAssetMetadata,
  getAssetTypeFromPath,
  getCategoryFromPath,
  getMimeType,
} from '@voxel-02/core';

export class AssetManager {
  private assetsDir: string;
  private manifest: AssetManifest | null = null;
  private baseUrl: string;

  constructor(assetsDir: string, baseUrl: string) {
    this.assetsDir = path.resolve(assetsDir);
    this.baseUrl = baseUrl;

    console.log(`[AssetManager] Assets directory: ${this.assetsDir}`);
    console.log(`[AssetManager] Base URL: ${this.baseUrl}`);
  }

  /**
   * Initialize asset manager and scan assets
   */
  async initialize(): Promise<void> {
    console.log('[AssetManager] Scanning assets...');

    if (!fs.existsSync(this.assetsDir)) {
      console.warn(`[AssetManager] Assets directory not found: ${this.assetsDir}`);
      this.manifest = createEmptyManifest(this.baseUrl);
      return;
    }

    this.manifest = await this.generateManifest();

    console.log(`[AssetManager] Found ${this.manifest.assets.length} assets`);
    this.logAssetSummary();
  }

  /**
   * Generate asset manifest by scanning filesystem
   */
  private async generateManifest(): Promise<AssetManifest> {
    const manifest = createEmptyManifest(this.baseUrl);

    await this.scanDirectory('', manifest.assets);

    return manifest;
  }

  /**
   * Recursively scan directory for assets
   */
  private async scanDirectory(relativePath: string, assets: AssetMetadata[]): Promise<void> {
    const fullPath = path.join(this.assetsDir, relativePath);

    const entries = fs.readdirSync(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryRelativePath = path.join(relativePath, entry.name);
      const entryFullPath = path.join(fullPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively scan subdirectory
        await this.scanDirectory(entryRelativePath, assets);
      } else if (entry.isFile()) {
        // Process file
        const asset = await this.processAssetFile(entryRelativePath, entryFullPath);
        if (asset) {
          assets.push(asset);
        }
      }
    }
  }

  /**
   * Process single asset file
   */
  private async processAssetFile(relativePath: string, fullPath: string): Promise<AssetMetadata | null> {
    try {
      const stats = fs.statSync(fullPath);

      // Skip very large files (> 10MB) with a warning
      if (stats.size > 10 * 1024 * 1024) {
        console.warn(`[AssetManager] Skipping large file: ${relativePath} (${stats.size} bytes)`);
        return null;
      }

      // Generate asset ID from relative path (without extension for textures)
      const assetId = this.generateAssetId(relativePath);
      const assetType = getAssetTypeFromPath(relativePath);
      const category = getCategoryFromPath(relativePath);
      const mimeType = getMimeType(relativePath);

      // Calculate hash for cache validation
      const hash = await this.calculateFileHash(fullPath);

      // Get image dimensions for textures
      let metadata: AssetMetadata['metadata'] | undefined;
      if (assetType === 'texture' && relativePath.endsWith('.png')) {
        metadata = await this.getImageMetadata(fullPath);
      }

      return createAssetMetadata(
        assetId,
        assetType,
        category,
        relativePath,
        stats.size,
        mimeType,
        hash,
        metadata
      );
    } catch (error) {
      console.error(`[AssetManager] Error processing asset ${relativePath}:`, error);
      return null;
    }
  }

  /**
   * Generate asset ID from file path
   */
  private generateAssetId(filePath: string): string {
    // Remove extension and normalize separators
    const withoutExt = filePath.replace(/\.[^/.]+$/, '');
    return withoutExt.replace(/\\/g, '/');
  }

  /**
   * Calculate MD5 hash of file
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Get image metadata (dimensions)
   */
  private async getImageMetadata(filePath: string): Promise<{ width: number; height: number } | undefined> {
    try {
      // Simple PNG dimension reading (without external dependencies)
      const buffer = fs.readFileSync(filePath);

      // PNG signature check
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        // Read IHDR chunk (starts at byte 16)
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
      }
    } catch (error) {
      // Ignore errors, metadata is optional
    }

    return undefined;
  }

  /**
   * Log asset summary
   */
  private logAssetSummary(): void {
    if (!this.manifest) return;

    const byType = new Map<string, number>();
    const byCategory = new Map<string, number>();

    for (const asset of this.manifest.assets) {
      byType.set(asset.type, (byType.get(asset.type) || 0) + 1);
      byCategory.set(asset.category, (byCategory.get(asset.category) || 0) + 1);
    }

    console.log('[AssetManager] Asset Summary:');
    console.log('  By Type:');
    byType.forEach((count, type) => {
      console.log(`    ${type}: ${count}`);
    });
    console.log('  By Category:');
    byCategory.forEach((count, category) => {
      console.log(`    ${category}: ${count}`);
    });
  }

  /**
   * Get asset manifest
   */
  getManifest(): AssetManifest {
    if (!this.manifest) {
      return createEmptyManifest(this.baseUrl);
    }
    return this.manifest;
  }

  /**
   * Get asset by ID
   */
  getAsset(assetId: string): AssetMetadata | undefined {
    if (!this.manifest) return undefined;
    return this.manifest.assets.find(a => a.id === assetId);
  }

  /**
   * Get asset file path
   */
  getAssetPath(assetId: string): string | null {
    const asset = this.getAsset(assetId);
    if (!asset) return null;

    return path.join(this.assetsDir, asset.path);
  }

  /**
   * Check if asset exists
   */
  hasAsset(assetId: string): boolean {
    return this.getAsset(assetId) !== undefined;
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
   * Refresh manifest (re-scan assets)
   */
  async refresh(): Promise<void> {
    console.log('[AssetManager] Refreshing asset manifest...');
    await this.initialize();
  }
}
