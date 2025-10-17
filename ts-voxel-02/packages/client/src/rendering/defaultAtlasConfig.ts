/**
 * Default Texture Atlas Configuration
 *
 * Configuration for loading individual textures from the asset server
 */

import type { AtlasConfig } from './TextureAtlas';
import type { ClientAssetManager } from '../assets/ClientAssetManager';

/**
 * Create default atlas configuration for asset server
 */
export function createDefaultAtlasConfig(assetServerUrl?: string, assetManager?: ClientAssetManager): AtlasConfig {
  // Default to localhost:3001 if not provided
  const url = assetServerUrl || 'http://localhost:3001/assets';

  return {
    assetServerUrl: url,
    assetManager,
  };
}
