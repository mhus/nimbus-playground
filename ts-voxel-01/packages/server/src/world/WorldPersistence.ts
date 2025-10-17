import { readFile, writeFile, mkdir, readdir, access } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { deflate, inflate } from 'pako';

export interface WorldMetadata {
  name: string;
  seed: number;
  generator: 'flat' | 'normal';
  version: number;
  createdAt: number;
  chunkSize: number;
  worldSize: number;
}

export interface ChunkMetadata {
  version: number;
  stage: number; // 0 = base, 1 = features
}

export interface SavedChunk {
  data: Uint8Array;
  metadata: ChunkMetadata;
}

export class WorldPersistence {
  private worldPath: string;
  private chunksPath: string;

  constructor(worldPath: string) {
    this.worldPath = worldPath;
    this.chunksPath = join(worldPath, 'chunks');
  }

  async init(): Promise<void> {
    if (!existsSync(this.worldPath)) {
      await mkdir(this.worldPath, { recursive: true });
    }
    if (!existsSync(this.chunksPath)) {
      await mkdir(this.chunksPath, { recursive: true });
    }
  }

  async worldExists(): Promise<boolean> {
    try {
      await access(join(this.worldPath, 'world.json'));
      return true;
    } catch {
      return false;
    }
  }

  async saveWorldMetadata(metadata: WorldMetadata): Promise<void> {
    const data = JSON.stringify(metadata, null, 2);
    await writeFile(join(this.worldPath, 'world.json'), data, 'utf-8');
  }

  async loadWorldMetadata(): Promise<WorldMetadata | null> {
    try {
      const data = await readFile(join(this.worldPath, 'world.json'), 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading world metadata:', error);
      return null;
    }
  }

  async saveChunk(x: number, z: number, data: Uint8Array, metadata: ChunkMetadata): Promise<void> {
    const chunkKey = `${x},${z}`;
    const chunkPath = join(this.chunksPath, `${chunkKey}.chk`);

    // Create chunk save format
    const saveData = {
      version: metadata.version,
      stage: metadata.stage,
      data: Array.from(data), // Convert to array for JSON
    };

    // Compress
    const json = JSON.stringify(saveData);
    const compressed = deflate(new TextEncoder().encode(json));

    await writeFile(chunkPath, compressed);
  }

  async loadChunk(x: number, z: number): Promise<SavedChunk | null> {
    try {
      const chunkKey = `${x},${z}`;
      const chunkPath = join(this.chunksPath, `${chunkKey}.chk`);

      const compressed = await readFile(chunkPath);
      const decompressed = inflate(compressed);
      const json = new TextDecoder().decode(decompressed);
      const saveData = JSON.parse(json);

      return {
        data: new Uint8Array(saveData.data),
        metadata: {
          version: saveData.version,
          stage: saveData.stage,
        },
      };
    } catch (error) {
      return null;
    }
  }

  async chunkExists(x: number, z: number): Promise<boolean> {
    try {
      const chunkKey = `${x},${z}`;
      const chunkPath = join(this.chunksPath, `${chunkKey}.chk`);
      await access(chunkPath);
      return true;
    } catch {
      return false;
    }
  }

  async listChunks(): Promise<Array<{ x: number; z: number }>> {
    try {
      const files = await readdir(this.chunksPath);
      return files
        .filter((f) => f.endsWith('.chk'))
        .map((f) => {
          const [x, z] = f.replace('.chk', '').split(',').map(Number);
          return { x, z };
        });
    } catch {
      return [];
    }
  }
}
