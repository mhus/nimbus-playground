/**
 * Entity Manager
 */

import { v4 as uuid } from 'uuid';
import type { IEntity, EntityData, IEntityObject } from '@voxel-02/core';
import { globalToChunk } from '@voxel-02/core';
import type { World } from '../world/World.js';

/**
 * Manages entities across worlds
 */
export class EntityManager {
  private entities: Map<string, Entity> = new Map();

  /**
   * Create a new entity
   */
  create(type: string, data: EntityData, world: World): Entity {
    const id = uuid();
    const entity = new Entity(id, type, data, world);

    this.entities.set(id, entity);

    console.log(`[EntityManager] Created entity ${id} of type ${type}`);

    return entity;
  }

  /**
   * Recreate an entity with specific ID (e.g., loading from save)
   */
  recreate(id: string, type: string, data: EntityData, world: World): Entity {
    const entity = new Entity(id, type, data, world);

    this.entities.set(id, entity);

    return entity;
  }

  /**
   * Get entity by ID
   */
  get(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  /**
   * Get all entities
   */
  getAll(): Map<string, Entity> {
    return this.entities;
  }

  /**
   * Remove entity
   */
  remove(id: string): void {
    this.entities.delete(id);
    console.log(`[EntityManager] Removed entity ${id}`);
  }

  /**
   * Tick all entities
   */
  tick(deltaTime: number): void {
    for (const entity of this.entities.values()) {
      entity.tick(deltaTime);
    }
  }
}

/**
 * Entity implementation
 */
export class Entity implements IEntity {
  readonly id: string;
  readonly type: string;
  data: EntityData;
  chunkID: [number, number];

  private world: World;
  private tickFunction?: (entity: Entity, deltaTime: number) => void;

  constructor(id: string, type: string, data: EntityData, world: World, tickFunction?: (entity: Entity, deltaTime: number) => void) {
    this.id = id;
    this.type = type;
    this.data = data;
    this.world = world;
    this.tickFunction = tickFunction;

    // Initialize default values
    if (this.data.position === undefined) {
      this.data.position = [0, 0, 0];
    }
    if (this.data.rotation === undefined) {
      this.data.rotation = 0;
    }
    if (this.data.pitch === undefined) {
      this.data.pitch = 0;
    }

    this.chunkID = globalToChunk(this.data.position).id;
  }

  /**
   * Get serializable object
   */
  getObject(): IEntityObject {
    return {
      data: this.data,
      id: this.id,
      world: this.world.getName(),
      chunk: this.chunkID,
      type: this.type,
    };
  }

  /**
   * Move entity to new position
   */
  move(pos: [number, number, number]): void {
    this.data.position = pos;
    this.chunkID = globalToChunk(pos).id;
  }

  /**
   * Rotate entity
   */
  rotate(rotation: number, pitch: number): void {
    this.data.rotation = rotation;
    this.data.pitch = pitch;
  }

  /**
   * Teleport entity (may change world in the future)
   */
  teleport(pos: [number, number, number], world: string): void {
    // For now, ignore world parameter (single world)
    this.data.position = pos;
    this.chunkID = globalToChunk(pos).id;
  }

  /**
   * Remove entity
   */
  remove(): void {
    // Will be handled by EntityManager
  }

  /**
   * Tick entity (called every frame)
   */
  tick(deltaTime: number): void {
    if (this.tickFunction) {
      this.tickFunction(this, deltaTime);
    }
  }

  /**
   * Get entity ID
   */
  getID(): string {
    return this.id;
  }
}
