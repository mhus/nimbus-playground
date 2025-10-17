/**
 * Core type definitions for the voxel engine
 */

/**
 * 3D Position [x, y, z]
 */
export type XYZ = [number, number, number];

/**
 * 2D Position [x, z] - used for chunk IDs
 */
export type XZ = [number, number];

/**
 * Generic object with string keys
 */
export type AnyObject = { [index: string]: any };

/**
 * 3D Uint16 Array View (for chunk data)
 */
export interface IView3duint16 {
  data: Uint16Array;
  shape: XYZ;
  stride: XYZ;
  offset: number;
  [index: string]: any;
}

/**
 * Vector3 interface (compatible with Babylon.js)
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Rotation (euler angles in radians)
 */
export interface Rotation {
  rotation: number;  // Y-axis rotation
  pitch: number;     // X-axis rotation (up/down)
}
