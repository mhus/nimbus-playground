import type { WebSocket } from 'ws';
import chalk from 'chalk';
import { World, type GeneratorType } from './world/World.js';
import type { Player } from './player.js';
import { PlayerManager } from './player.js';
import type { ClientMessage, ServerMessage } from '@voxel/protocol';
import { MessageType } from '@voxel/protocol';
import { join } from 'path';

export class GameServer {
  private world: World;
  private playerManager: PlayerManager;
  private initialized = false;

  constructor() {
    this.playerManager = new PlayerManager();

    // Random generator selection: flat or normal
    const generatorType: GeneratorType = Math.random() > 0.5 ? 'normal' : 'flat';
    const seed = Date.now();
    const worldPath = join(process.cwd(), 'tmp', 'world');

    this.world = new World(
      { seed, chunkSize: 32, worldHeight: 256 },
      generatorType,
      worldPath
    );
  }

  async init(): Promise<void> {
    await this.world.init();
    this.initialized = true;
    console.log(chalk.blue('🌍 World ready'));
  }

  async shutdown(): Promise<void> {
    console.log(chalk.yellow('Shutting down server...'));
    await this.world.shutdown();
    console.log(chalk.green('Server shutdown complete'));
  }

  handleConnection(ws: WebSocket): void {
    if (!this.initialized) {
      console.error(chalk.red('Server not initialized yet'));
      ws.close();
      return;
    }

    let player: Player | null = null;

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as ClientMessage;
        this.handleMessage(ws, message, player);

        if (message.type === MessageType.JOIN) {
          player = this.playerManager.getPlayerBySocket(ws);
        }
      } catch (error) {
        console.error(chalk.red('Error parsing message:'), error);
      }
    });

    ws.on('close', () => {
      if (player) {
        console.log(chalk.yellow(`Player ${player.name} disconnected`));
        this.playerManager.removePlayer(player.id);

        // Broadcast player left
        this.broadcast({
          type: MessageType.PLAYER_LEFT,
          playerId: player.id,
        });
      }
    });

    ws.on('error', (error) => {
      console.error(chalk.red('WebSocket Error:'), error);
    });
  }

  private handleMessage(ws: WebSocket, message: ClientMessage, player: Player | null): void {
    switch (message.type) {
      case MessageType.JOIN:
        this.handleJoin(ws, message);
        break;
      case MessageType.MOVE:
        if (player) {
          player.position = message.position;
          player.rotation = message.rotation;

          // Broadcast to other players
          this.broadcast({
            type: MessageType.PLAYER_MOVED,
            playerId: player.id,
            position: message.position,
            rotation: message.rotation,
          }, player.id);
        }
        break;
      case MessageType.BLOCK_BREAK:
        this.world.setBlock(
          Math.floor(message.position.x),
          Math.floor(message.position.y),
          Math.floor(message.position.z),
          0
        );
        this.broadcast({
          type: MessageType.BLOCK_UPDATE,
          position: message.position,
          blockType: 0,
        });
        break;
      case MessageType.BLOCK_PLACE:
        this.world.setBlock(
          Math.floor(message.position.x),
          Math.floor(message.position.y),
          Math.floor(message.position.z),
          message.blockType
        );
        this.broadcast({
          type: MessageType.BLOCK_UPDATE,
          position: message.position,
          blockType: message.blockType,
        });
        break;
      case MessageType.CHAT:
        if (player) {
          this.broadcast({
            type: MessageType.CHAT_MESSAGE,
            playerId: player.id,
            playerName: player.name,
            message: message.message,
          });
        }
        break;
    }
  }

  private handleJoin(ws: WebSocket, message: { type: MessageType.JOIN; playerName: string }): void {
    const player = this.playerManager.createPlayer(ws, message.playerName);

    console.log(chalk.green(`Player ${player.name} (${player.id}) joined`));

    // Send world data to new player
    this.sendMessage(ws, {
      type: MessageType.WORLD_DATA,
      playerId: player.id,
      spawnPosition: { x: 0, y: 64, z: 0 },
      blocks: this.world.getBlockTypes(),
    });

    // Send chunk data around spawn
    const spawnChunkX = 0;
    const spawnChunkZ = 0;
    const renderDistance = 4;

    console.log(chalk.blue(`Sending ${(renderDistance * 2 + 1) ** 2} chunks to player...`));

    let sentChunks = 0;
    for (let cx = -renderDistance; cx <= renderDistance; cx++) {
      for (let cz = -renderDistance; cz <= renderDistance; cz++) {
        const chunkData = this.world.getChunk(spawnChunkX + cx, 0, spawnChunkZ + cz);
        if (chunkData) {
          // Count non-air blocks
          let blockCount = 0;
          for (let i = 0; i < chunkData.length; i++) {
            if (chunkData[i] !== 0) blockCount++;
          }

          this.sendMessage(ws, {
            type: MessageType.CHUNK_DATA,
            position: { x: spawnChunkX + cx, y: 0, z: spawnChunkZ + cz },
            data: Array.from(chunkData), // Convert Uint8Array to regular array for JSON
          });
          sentChunks++;

          if (sentChunks === 1) {
            console.log(chalk.gray(`  First chunk (${spawnChunkX + cx},${spawnChunkZ + cz}): ${blockCount} non-air blocks`));
          }
        }
      }
    }

    console.log(chalk.green(`  Sent ${sentChunks} chunks to player`));

    // Broadcast new player to others
    this.broadcast({
      type: MessageType.PLAYER_JOINED,
      playerId: player.id,
      playerName: player.name,
      position: player.position,
    }, player.id);

    // Send existing players to new player
    for (const existingPlayer of this.playerManager.getAllPlayers()) {
      if (existingPlayer.id !== player.id) {
        this.sendMessage(ws, {
          type: MessageType.PLAYER_JOINED,
          playerId: existingPlayer.id,
          playerName: existingPlayer.name,
          position: existingPlayer.position,
        });
      }
    }
  }

  private sendMessage(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcast(message: ServerMessage, excludePlayerId?: string): void {
    for (const player of this.playerManager.getAllPlayers()) {
      if (player.id !== excludePlayerId) {
        this.sendMessage(player.socket, message);
      }
    }
  }
}
