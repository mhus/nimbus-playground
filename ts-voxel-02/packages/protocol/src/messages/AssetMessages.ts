/**
 * Asset Protocol Messages
 *
 * Messages for asset manifest and delivery
 */

import type { AssetManifest, AssetMetadata } from '@voxel-02/core';

export enum AssetMessageType {
  ASSET_MANIFEST = 'asset_manifest',
  ASSET_REQUEST = 'asset_request',
  ASSET_UPDATE = 'asset_update',
}

/**
 * Asset manifest from server to client
 * Sent during connection to inform client of available assets
 */
export interface AssetManifestMessage {
  type: AssetMessageType.ASSET_MANIFEST;
  data: AssetManifest;
}

/**
 * Request specific asset from server (if needed)
 */
export interface AssetRequestMessage {
  type: AssetMessageType.ASSET_REQUEST;
  data: {
    assetId: string;
    cachedHash?: string;
  };
}

/**
 * Notify client of asset updates (hot reload)
 */
export interface AssetUpdateMessage {
  type: AssetMessageType.ASSET_UPDATE;
  data: {
    assets: AssetMetadata[];
  };
}

/**
 * Union type for all asset messages
 */
export type AssetMessage =
  | AssetManifestMessage
  | AssetRequestMessage
  | AssetUpdateMessage;

/**
 * Create asset manifest message
 */
export function createAssetManifestMessage(manifest: AssetManifest): AssetManifestMessage {
  return {
    type: AssetMessageType.ASSET_MANIFEST,
    data: manifest,
  };
}

/**
 * Create asset request message
 */
export function createAssetRequestMessage(assetId: string, cachedHash?: string): AssetRequestMessage {
  return {
    type: AssetMessageType.ASSET_REQUEST,
    data: { assetId, cachedHash },
  };
}

/**
 * Create asset update message
 */
export function createAssetUpdateMessage(assets: AssetMetadata[]): AssetUpdateMessage {
  return {
    type: AssetMessageType.ASSET_UPDATE,
    data: { assets },
  };
}
