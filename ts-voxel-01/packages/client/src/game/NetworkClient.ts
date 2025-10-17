import type { Vec3 } from '@voxel/core';
import type { ClientMessage, ServerMessage, ChunkPosition } from '@voxel/protocol';
import { MessageType } from '@voxel/protocol';

type EventCallback = (data: any) => void;

export class NetworkClient {
  private ws?: WebSocket;
  private listeners = new Map<string, EventCallback[]>();
  private connected = false;

  connect(url: string, playerName: string): void {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('Connected to server');
      this.connected = true;

      // Send join message
      this.send({
        type: MessageType.JOIN,
        playerName,
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('Disconnected from server');
      this.connected = false;
    };
  }

  private handleMessage(message: ServerMessage): void {
    switch (message.type) {
      case MessageType.WORLD_DATA:
        this.emit('worldData', message);
        break;
      case MessageType.CHUNK_DATA:
        this.emit('chunkData', message);
        break;
      case MessageType.PLAYER_JOINED:
        this.emit('playerJoined', message);
        break;
      case MessageType.PLAYER_LEFT:
        this.emit('playerLeft', message);
        break;
      case MessageType.PLAYER_MOVED:
        this.emit('playerMoved', message);
        break;
      case MessageType.BLOCK_UPDATE:
        this.emit('blockUpdate', message);
        break;
      case MessageType.CHAT_MESSAGE:
        this.emit('chatMessage', message);
        break;
    }
  }

  send(message: ClientMessage): void {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify(message));
    }
  }

  sendMove(position: Vec3, rotation: { x: number; y: number }): void {
    this.send({
      type: MessageType.MOVE,
      position,
      rotation,
    });
  }

  sendBlockBreak(position: Vec3): void {
    this.send({
      type: MessageType.BLOCK_BREAK,
      position,
    });
  }

  sendBlockPlace(position: Vec3, blockType: number): void {
    this.send({
      type: MessageType.BLOCK_PLACE,
      position,
      blockType,
    });
  }

  sendChat(message: string): void {
    this.send({
      type: MessageType.CHAT,
      message,
    });
  }

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
