/**
 * Entity Type System
 *
 * Central entity type definitions for mobs, NPCs, and other entities.
 */

/**
 * Entity category
 */
export enum EntityCategory {
  /** Player entity */
  PLAYER = 'player',

  /** Passive mob (animals) */
  PASSIVE = 'passive',

  /** Hostile mob (monsters) */
  HOSTILE = 'hostile',

  /** Neutral mob (attacks when provoked) */
  NEUTRAL = 'neutral',

  /** NPC (villager, merchant) */
  NPC = 'npc',

  /** Projectile (arrow, fireball) */
  PROJECTILE = 'projectile',

  /** Item entity (dropped items) */
  ITEM = 'item',

  /** Vehicle (minecart, boat) */
  VEHICLE = 'vehicle',

  /** Other/custom */
  OTHER = 'other',
}

/**
 * Entity AI behavior type
 */
export interface EntityAI {
  /** Whether entity can move */
  canMove?: boolean;

  /** Movement speed */
  moveSpeed?: number;

  /** Whether entity can jump */
  canJump?: boolean;

  /** Jump height */
  jumpHeight?: number;

  /** Whether entity can swim */
  canSwim?: boolean;

  /** Whether entity can fly */
  canFly?: boolean;

  /** Wander behavior enabled */
  wanders?: boolean;

  /** Aggression range (for hostile mobs) */
  aggroRange?: number;

  /** Follow range (for passive mobs) */
  followRange?: number;
}

/**
 * Entity stats
 */
export interface EntityStats {
  /** Maximum health */
  maxHealth: number;

  /** Attack damage (for hostile mobs) */
  attackDamage?: number;

  /** Defense/armor value */
  defense?: number;

  /** Knockback resistance (0-1) */
  knockbackResistance?: number;
}

/**
 * Entity size/hitbox
 */
export interface EntitySize {
  /** Width (X and Z axis) */
  width: number;

  /** Height (Y axis) */
  height: number;

  /** Eye height (for camera/vision) */
  eyeHeight?: number;
}

/**
 * Core Entity Type definition
 */
export interface EntityType {
  /** Numeric ID (assigned by registry) */
  id?: number;

  /** Unique string identifier */
  name: string;

  /** Display name */
  displayName?: string;

  /** Entity category */
  category: EntityCategory;

  /** Entity size/hitbox */
  size: EntitySize;

  /** Entity stats */
  stats: EntityStats;

  /** AI behavior */
  ai?: EntityAI;

  /** Model/mesh name or path */
  model?: string;

  /** Texture path */
  texture?: string;

  /** Whether entity has physics/gravity */
  hasPhysics?: boolean;

  /** Whether entity has collision */
  hasCollision?: boolean;

  /** Custom properties */
  [key: string]: any;
}

/**
 * Create a generic entity type
 */
export function createEntityType(
  name: string,
  category: EntityCategory,
  size: EntitySize,
  stats: EntityStats,
  options?: Partial<EntityType>
): EntityType {
  return {
    name,
    category,
    size,
    stats,
    hasPhysics: true,
    hasCollision: true,
    ...options,
  };
}

/**
 * Create a passive mob
 */
export function createPassiveMob(
  name: string,
  size: EntitySize,
  health: number,
  options?: Partial<EntityType>
): EntityType {
  return createEntityType(
    name,
    EntityCategory.PASSIVE,
    size,
    { maxHealth: health },
    {
      ai: {
        canMove: true,
        moveSpeed: 2.0,
        canJump: true,
        wanders: true,
        ...options?.ai,
      },
      ...options,
    }
  );
}

/**
 * Create a hostile mob
 */
export function createHostileMob(
  name: string,
  size: EntitySize,
  health: number,
  attackDamage: number,
  options?: Partial<EntityType>
): EntityType {
  return createEntityType(
    name,
    EntityCategory.HOSTILE,
    size,
    {
      maxHealth: health,
      attackDamage,
    },
    {
      ai: {
        canMove: true,
        moveSpeed: 3.0,
        canJump: true,
        aggroRange: 16.0,
        ...options?.ai,
      },
      ...options,
    }
  );
}

/**
 * Create a player entity type
 */
export function createPlayerEntity(): EntityType {
  return createEntityType(
    'player',
    EntityCategory.PLAYER,
    {
      width: 0.6,
      height: 1.8,
      eyeHeight: 1.62,
    },
    {
      maxHealth: 20,
      defense: 0,
    },
    {
      ai: {
        canMove: true,
        moveSpeed: 4.3,
        canJump: true,
        jumpHeight: 1.25,
        canSwim: true,
      },
    }
  );
}
