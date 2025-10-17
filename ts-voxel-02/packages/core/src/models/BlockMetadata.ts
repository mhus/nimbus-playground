/**
 * Block Metadata System
 *
 * Stores additional per-block data like rotation, state, damage, etc.
 * Metadata is stored separately from block IDs for memory efficiency.
 */

/**
 * Block rotation/facing directions
 */
export enum BlockFacing {
  NORTH = 0,   // -Z
  EAST = 1,    // +X
  SOUTH = 2,   // +Z
  WEST = 3,    // -X
  UP = 4,      // +Y
  DOWN = 5,    // -Y
}

/**
 * Rotation axis for blocks
 */
export enum RotationAxis {
  NONE = 0,
  X = 1,
  Y = 2,
  Z = 3,
}

/**
 * Block state flags (can be combined with bitwise OR)
 */
export enum BlockState {
  NONE = 0,
  OPEN = 1 << 0,        // Door/gate is open
  POWERED = 1 << 1,     // Block is powered by redstone
  LIT = 1 << 2,         // Furnace/torch is lit
  TRIGGERED = 1 << 3,   // Dispenser/dropper is triggered
  EXTENDED = 1 << 4,    // Piston is extended
  WATERLOGGED = 1 << 5, // Block contains water
  SNOWY = 1 << 6,       // Block has snow on top
  PERSISTENT = 1 << 7,  // Leaves won't decay
}

/**
 * Core block metadata structure (16 bits)
 *
 * Bit layout:
 * - Bits 0-2:   Facing direction (0-5)
 * - Bits 3-4:   Rotation axis (0-3)
 * - Bits 5-7:   Rotation angle (0-7 = 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
 * - Bits 8-15:  State flags (8 bits for various states)
 */
export interface BlockMetadata {
  /** Facing direction (0-5) */
  facing: BlockFacing;

  /** Rotation axis */
  rotationAxis: RotationAxis;

  /** Rotation angle in 45° steps (0-7) */
  rotationStep: number;

  /** State flags (combined BlockState values) */
  state: number;
}

/**
 * Extended metadata for special blocks (stored separately)
 */
export interface ExtendedBlockMetadata extends BlockMetadata {
  /** Block entity data (inventory, text, etc.) */
  blockEntity?: Record<string, any>;

  /** Custom properties */
  custom?: Record<string, any>;
}

/**
 * Pack metadata into 16-bit integer
 */
export function packMetadata(metadata: BlockMetadata): number {
  const facing = metadata.facing & 0x07;              // 3 bits
  const axis = (metadata.rotationAxis & 0x03) << 3;   // 2 bits
  const rotation = (metadata.rotationStep & 0x07) << 5; // 3 bits
  const state = (metadata.state & 0xFF) << 8;         // 8 bits

  return facing | axis | rotation | state;
}

/**
 * Unpack metadata from 16-bit integer
 */
export function unpackMetadata(packed: number): BlockMetadata {
  return {
    facing: (packed & 0x07) as BlockFacing,
    rotationAxis: ((packed >> 3) & 0x03) as RotationAxis,
    rotationStep: (packed >> 5) & 0x07,
    state: (packed >> 8) & 0xFF,
  };
}

/**
 * Create default metadata (no rotation, no state)
 */
export function createDefaultMetadata(): BlockMetadata {
  return {
    facing: BlockFacing.NORTH,
    rotationAxis: RotationAxis.NONE,
    rotationStep: 0,
    state: BlockState.NONE,
  };
}

/**
 * Create metadata with facing direction
 */
export function createMetadataWithFacing(facing: BlockFacing): BlockMetadata {
  return {
    facing,
    rotationAxis: RotationAxis.Y,
    rotationStep: 0,
    state: BlockState.NONE,
  };
}

/**
 * Create metadata with rotation
 */
export function createMetadataWithRotation(
  axis: RotationAxis,
  angleDegrees: number
): BlockMetadata {
  // Convert angle to step (0-7)
  const step = Math.floor((angleDegrees % 360) / 45);

  return {
    facing: BlockFacing.NORTH,
    rotationAxis: axis,
    rotationStep: step,
    state: BlockState.NONE,
  };
}

/**
 * Get rotation angle in degrees from metadata
 */
export function getRotationAngle(metadata: BlockMetadata): number {
  return metadata.rotationStep * 45;
}

/**
 * Get rotation angle in radians from metadata
 */
export function getRotationAngleRadians(metadata: BlockMetadata): number {
  return (metadata.rotationStep * 45 * Math.PI) / 180;
}

/**
 * Check if block state flag is set
 */
export function hasState(metadata: BlockMetadata, state: BlockState): boolean {
  return (metadata.state & state) !== 0;
}

/**
 * Set block state flag
 */
export function setState(metadata: BlockMetadata, state: BlockState): BlockMetadata {
  return {
    ...metadata,
    state: metadata.state | state,
  };
}

/**
 * Clear block state flag
 */
export function clearState(metadata: BlockMetadata, state: BlockState): BlockMetadata {
  return {
    ...metadata,
    state: metadata.state & ~state,
  };
}

/**
 * Toggle block state flag
 */
export function toggleState(metadata: BlockMetadata, state: BlockState): BlockMetadata {
  return {
    ...metadata,
    state: metadata.state ^ state,
  };
}

/**
 * Rotate block metadata 90° clockwise around Y axis
 */
export function rotateMetadataY(metadata: BlockMetadata): BlockMetadata {
  // Rotate facing
  let newFacing = metadata.facing;
  if (newFacing <= BlockFacing.WEST) {
    newFacing = ((newFacing + 1) % 4) as BlockFacing;
  }

  // Increment rotation step
  const newStep = (metadata.rotationStep + 2) % 8; // 90° = 2 steps

  return {
    ...metadata,
    facing: newFacing,
    rotationStep: newStep,
  };
}

/**
 * Get facing vector from BlockFacing
 */
export function getFacingVector(facing: BlockFacing): [number, number, number] {
  switch (facing) {
    case BlockFacing.NORTH: return [0, 0, -1];
    case BlockFacing.EAST:  return [1, 0, 0];
    case BlockFacing.SOUTH: return [0, 0, 1];
    case BlockFacing.WEST:  return [-1, 0, 0];
    case BlockFacing.UP:    return [0, 1, 0];
    case BlockFacing.DOWN:  return [0, -1, 0];
    default: return [0, 0, 0];
  }
}

/**
 * Get BlockFacing from player look direction
 */
export function getFacingFromDirection(dx: number, dz: number): BlockFacing {
  // Calculate angle from direction vector
  const angle = Math.atan2(dz, dx) * 180 / Math.PI;

  // Convert to facing (0° = East, 90° = South, 180° = West, 270° = North)
  if (angle >= -45 && angle < 45) return BlockFacing.EAST;
  if (angle >= 45 && angle < 135) return BlockFacing.SOUTH;
  if (angle >= 135 || angle < -135) return BlockFacing.WEST;
  return BlockFacing.NORTH;
}

/**
 * Get BlockFacing from player camera direction (includes vertical)
 */
export function getFacingFromCamera(dx: number, dy: number, dz: number): BlockFacing {
  // Check vertical first
  const horizontalLength = Math.sqrt(dx * dx + dz * dz);
  if (Math.abs(dy) > horizontalLength) {
    return dy > 0 ? BlockFacing.UP : BlockFacing.DOWN;
  }

  // Horizontal facing
  return getFacingFromDirection(dx, dz);
}

/**
 * Get opposite facing direction
 */
export function getOppositeFacing(facing: BlockFacing): BlockFacing {
  switch (facing) {
    case BlockFacing.NORTH: return BlockFacing.SOUTH;
    case BlockFacing.SOUTH: return BlockFacing.NORTH;
    case BlockFacing.EAST: return BlockFacing.WEST;
    case BlockFacing.WEST: return BlockFacing.EAST;
    case BlockFacing.UP: return BlockFacing.DOWN;
    case BlockFacing.DOWN: return BlockFacing.UP;
    default: return facing;
  }
}

/**
 * Create metadata for a block placed by player
 * Block will face towards the player
 */
export function createMetadataFromPlayerPlacement(
  playerX: number,
  playerY: number,
  playerZ: number,
  blockX: number,
  blockY: number,
  blockZ: number,
  includeVertical: boolean = false
): BlockMetadata {
  // Calculate direction from block to player
  const dx = playerX - blockX;
  const dy = playerY - blockY;
  const dz = playerZ - blockZ;

  // Get facing (block faces player)
  const facing = includeVertical
    ? getFacingFromCamera(dx, dy, dz)
    : getFacingFromDirection(dx, dz);

  return createMetadataWithFacing(facing);
}

/**
 * Create metadata for directional block (e.g., furnace, piston)
 * Block will face away from player (in player's look direction)
 */
export function createMetadataFromPlayerDirection(
  lookDirX: number,
  lookDirY: number,
  lookDirZ: number,
  includeVertical: boolean = false
): BlockMetadata {
  const facing = includeVertical
    ? getFacingFromCamera(lookDirX, lookDirY, lookDirZ)
    : getFacingFromDirection(lookDirX, lookDirZ);

  return createMetadataWithFacing(facing);
}

/**
 * Check if two metadata objects are equal
 */
export function metadataEquals(a: BlockMetadata, b: BlockMetadata): boolean {
  return (
    a.facing === b.facing &&
    a.rotationAxis === b.rotationAxis &&
    a.rotationStep === b.rotationStep &&
    a.state === b.state
  );
}

/**
 * Clone metadata
 */
export function cloneMetadata(metadata: BlockMetadata): BlockMetadata {
  return {
    facing: metadata.facing,
    rotationAxis: metadata.rotationAxis,
    rotationStep: metadata.rotationStep,
    state: metadata.state,
  };
}

/**
 * Merge metadata (combine state flags)
 */
export function mergeMetadata(base: BlockMetadata, override: Partial<BlockMetadata>): BlockMetadata {
  return {
    facing: override.facing ?? base.facing,
    rotationAxis: override.rotationAxis ?? base.rotationAxis,
    rotationStep: override.rotationStep ?? base.rotationStep,
    state: override.state ?? base.state,
  };
}

/**
 * Check if metadata is default (no rotation, no state)
 */
export function isDefaultMetadata(metadata: BlockMetadata): boolean {
  return (
    metadata.facing === BlockFacing.NORTH &&
    metadata.rotationAxis === RotationAxis.NONE &&
    metadata.rotationStep === 0 &&
    metadata.state === BlockState.NONE
  );
}

/**
 * Create metadata with multiple state flags
 */
export function createMetadataWithStates(...states: BlockState[]): BlockMetadata {
  let combinedState = BlockState.NONE;
  for (const state of states) {
    combinedState |= state;
  }

  return {
    facing: BlockFacing.NORTH,
    rotationAxis: RotationAxis.NONE,
    rotationStep: 0,
    state: combinedState,
  };
}
