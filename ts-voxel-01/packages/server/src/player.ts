import type { WebSocket } from 'ws';
import type { Vec3 } from '@voxel/core';
import { generateId } from '@voxel/core';

export interface Player {
  id: string;
  name: string;
  socket: WebSocket;
  position: Vec3;
  rotation: { x: number; y: number };
}

export class PlayerManager {
  private players = new Map<string, Player>();
  private socketToPlayerId = new Map<WebSocket, string>();

  createPlayer(socket: WebSocket, name: string): Player {
    const player: Player = {
      id: generateId(),
      name,
      socket,
      position: { x: 0, y: 64, z: 0 },
      rotation: { x: 0, y: 0 },
    };

    this.players.set(player.id, player);
    this.socketToPlayerId.set(socket, player.id);

    return player;
  }

  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      this.socketToPlayerId.delete(player.socket);
      this.players.delete(playerId);
    }
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  getPlayerBySocket(socket: WebSocket): Player | undefined {
    const playerId = this.socketToPlayerId.get(socket);
    return playerId ? this.players.get(playerId) : undefined;
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }
}
