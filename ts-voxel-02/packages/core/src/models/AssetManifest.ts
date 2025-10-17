/**
 * Asset Manifest System
 *
 * Defines asset metadata and manifest structure for server-side asset delivery
 */

/**
 * Asset types supported by the system
 */
export enum AssetType {
  TEXTURE = 'texture',
  MODEL = 'model',
  AUDIO = 'audio',
  FONT = 'font',
}

/**
 * Asset category for organization
 */
export enum AssetCategory {
  BLOCK = 'block',
  ITEM = 'item',
  ENTITY = 'entity',
  GUI = 'gui',
  PARTICLE = 'particle',
  ENVIRONMENT = 'environment',
  BREAK = 'break',
  UI = 'ui',
  MISC = 'misc',
}

/**
 * Asset metadata
 */
export interface AssetMetadata {
  /** Unique asset identifier (e.g., 'block/stone', 'item/diamond') */
  id: string;

  /** Asset type */
  type: AssetType;

  /** Asset category */
  category: AssetCategory;

  /** File path relative to assets root */
  path: string;

  /** File size in bytes */
  size: number;

  /** MIME type */
  mimeType: string;

  /** MD5 hash for cache validation */
  hash?: string;

  /** Optional metadata */
  metadata?: {
    /** Image dimensions (for textures) */
    width?: number;
    height?: number;

    /** Audio duration in seconds */
    duration?: number;

    /** Model format (gltf, obj, etc.) */
    format?: string;
  };
}

/**
 * Asset manifest containing all available assets
 */
export interface AssetManifest {
  /** Manifest version */
  version: string;

  /** Generation timestamp */
  timestamp: number;

  /** Server base URL for assets */
  baseUrl: string;

  /** List of all assets */
  assets: AssetMetadata[];
}

/**
 * Asset request for client-server communication
 */
export interface AssetRequest {
  /** Asset ID */
  id: string;

  /** Optional: cached hash for conditional fetch */
  cachedHash?: string;
}

/**
 * Create asset metadata
 */
export function createAssetMetadata(
  id: string,
  type: AssetType,
  category: AssetCategory,
  path: string,
  size: number,
  mimeType: string,
  hash?: string,
  metadata?: AssetMetadata['metadata']
): AssetMetadata {
  return {
    id,
    type,
    category,
    path,
    size,
    mimeType,
    hash,
    metadata,
  };
}

/**
 * Create empty asset manifest
 */
export function createEmptyManifest(baseUrl: string): AssetManifest {
  return {
    version: '1.0.0',
    timestamp: Date.now(),
    baseUrl,
    assets: [],
  };
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    // Images
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',

    // Audio
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',

    // Models
    gltf: 'model/gltf+json',
    glb: 'model/gltf-binary',
    obj: 'model/obj',
    fbx: 'application/octet-stream',

    // Fonts
    ttf: 'font/ttf',
    otf: 'font/otf',
    woff: 'font/woff',
    woff2: 'font/woff2',
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Get asset category from path
 */
export function getCategoryFromPath(path: string): AssetCategory {
  const parts = path.split('/');
  const firstDir = parts[0]?.toLowerCase();

  const categoryMap: Record<string, AssetCategory> = {
    block: AssetCategory.BLOCK,
    item: AssetCategory.ITEM,
    entity: AssetCategory.ENTITY,
    gui: AssetCategory.GUI,
    particle: AssetCategory.PARTICLE,
    environment: AssetCategory.ENVIRONMENT,
    break: AssetCategory.BREAK,
    ui: AssetCategory.UI,
  };

  return categoryMap[firstDir] || AssetCategory.MISC;
}

/**
 * Get asset type from file extension
 */
export function getAssetTypeFromPath(path: string): AssetType {
  const ext = path.split('.').pop()?.toLowerCase();

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')) {
    return AssetType.TEXTURE;
  }
  if (['mp3', 'ogg', 'wav', 'm4a'].includes(ext || '')) {
    return AssetType.AUDIO;
  }
  if (['gltf', 'glb', 'obj', 'fbx'].includes(ext || '')) {
    return AssetType.MODEL;
  }
  if (['ttf', 'otf', 'woff', 'woff2'].includes(ext || '')) {
    return AssetType.FONT;
  }

  return AssetType.TEXTURE; // Default
}
