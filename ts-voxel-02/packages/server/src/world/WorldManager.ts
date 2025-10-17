/**
 * World Manager - manages multiple worlds
 */

import * as fs from 'fs';
import * as path from 'path';
import type { WorldConfig, WorldMetadata } from '@voxel-02/core';
import { World } from './World.js';
import type { WorldGenerator } from './generators/WorldGenerator.js';

export interface WorldGeneratorConstructor {
  new (seed: number): WorldGenerator;
}

/**
 * Manages multiple worlds
 */
export class WorldManager {
  readonly CHUNK_SIZE = 32;
  readonly CHUNK_HEIGHT = 256;

  private worlds: Map<string, World> = new Map();
  private generators: Map<string, WorldGeneratorConstructor> = new Map();

  private worldsDir = './worlds';

  constructor() {
    // Ensure worlds directory exists
    if (!fs.existsSync(this.worldsDir)) {
      fs.mkdirSync(this.worldsDir, { recursive: true });
    }
  }

  /**
   * Register a world generator
   */
  addGenerator(name: string, generator: WorldGeneratorConstructor): void {
    this.generators.set(name, generator);
    console.log(`[WorldManager] Registered generator: ${name}`);
  }

  /**
   * Create a new world
   */
  async create(config: WorldConfig): Promise<World | null> {
    if (this.worlds.has(config.name)) {
      console.warn(`[WorldManager] World "${config.name}" already loaded`);
      return null;
    }

    if (this.exists(config.name)) {
      console.warn(`[WorldManager] World "${config.name}" already exists on disk`);
      return null;
    }

    const GeneratorClass = this.generators.get(config.generator);
    if (!GeneratorClass) {
      console.error(`[WorldManager] Generator "${config.generator}" not found`);
      return null;
    }

    const metadata: WorldMetadata = {
      ...config,
      version: 2,
      createdAt: Date.now(),
    };

    const world = new World(metadata, new GeneratorClass(config.seed), this.worldsDir);
    await world.init();

    this.worlds.set(config.name, world);
    console.log(`[WorldManager] Created world "${config.name}" with seed ${config.seed}`);

    return world;
  }

  /**
   * Load an existing world
   */
  async load(name: string): Promise<World | null> {
    if (this.worlds.has(name)) {
      console.warn(`[WorldManager] World "${name}" already loaded`);
      return this.worlds.get(name)!;
    }

    if (!this.exists(name)) {
      console.error(`[WorldManager] World "${name}" does not exist`);
      return null;
    }

    try {
      const worldPath = path.join(this.worldsDir, name);
      const metadataPath = path.join(worldPath, 'world.json');
      const data = fs.readFileSync(metadataPath, 'utf-8');
      const metadata: WorldMetadata = JSON.parse(data);

      const GeneratorClass = this.generators.get(metadata.generator);
      if (!GeneratorClass) {
        console.error(`[WorldManager] Generator "${metadata.generator}" not found`);
        return null;
      }

      const world = new World(metadata, new GeneratorClass(metadata.seed), this.worldsDir);
      await world.init();

      this.worlds.set(name, world);
      console.log(`[WorldManager] Loaded world "${name}"`);

      return world;
    } catch (error) {
      console.error(`[WorldManager] Failed to load world "${name}":`, error);
      return null;
    }
  }

  /**
   * Unload a world
   */
  async unload(name: string): Promise<void> {
    const world = this.worlds.get(name);
    if (!world) {
      console.warn(`[WorldManager] World "${name}" is not loaded`);
      return;
    }

    await world.shutdown();
    this.worlds.delete(name);
    console.log(`[WorldManager] Unloaded world "${name}"`);
  }

  /**
   * Get a world by name
   */
  get(name: string): World | undefined {
    return this.worlds.get(name);
  }

  /**
   * Check if a world exists on disk
   */
  exists(name: string): boolean {
    const worldPath = path.join(this.worldsDir, name);
    return fs.existsSync(worldPath) && fs.existsSync(path.join(worldPath, 'world.json'));
  }

  /**
   * Get all loaded worlds
   */
  getAllWorlds(): Map<string, World> {
    return this.worlds;
  }

  /**
   * Shutdown all worlds
   */
  async shutdownAll(): Promise<void> {
    console.log('[WorldManager] Shutting down all worlds...');
    const promises: Promise<void>[] = [];

    for (const [name, world] of this.worlds.entries()) {
      promises.push(world.shutdown());
    }

    await Promise.all(promises);
    this.worlds.clear();
    console.log('[WorldManager] All worlds shut down');
  }
}
