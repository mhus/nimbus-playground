// Protocol messages for client-server communication
import type { Vec3, ChunkPosition } from '@voxel/core';

export enum MessageType {
  // Client -> Server
  JOIN = 'join',
  MOVE = 'move',
  BLOCK_BREAK = 'block_break',
  BLOCK_PLACE = 'block_place',
  CHAT = 'chat',

  // Server -> Client
  WORLD_DATA = 'world_data',
  CHUNK_DATA = 'chunk_data',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  PLAYER_MOVED = 'player_moved',
  BLOCK_UPDATE = 'block_update',
  CHAT_MESSAGE = 'chat_message',
}

export interface BaseMessage {
  type: MessageType;
  timestamp?: number;
}

// Client -> Server messages
export interface JoinMessage extends BaseMessage {
  type: MessageType.JOIN;
  playerName: string;
}

export interface MoveMessage extends BaseMessage {
  type: MessageType.MOVE;
  position: Vec3;
  rotation: { x: number; y: number };
}

export interface BlockBreakMessage extends BaseMessage {
  type: MessageType.BLOCK_BREAK;
  position: Vec3;
}

export interface BlockPlaceMessage extends BaseMessage {
  type: MessageType.BLOCK_PLACE;
  position: Vec3;
  blockType: number;
}

export interface ChatMessage extends BaseMessage {
  type: MessageType.CHAT;
  message: string;
}

// Server -> Client messages
export interface WorldDataMessage extends BaseMessage {
  type: MessageType.WORLD_DATA;
  playerId: string;
  spawnPosition: Vec3;
  blocks: Array<{ id: number; name: string; solid: boolean; transparent: boolean }>;
}

export interface ChunkDataMessage extends BaseMessage {
  type: MessageType.CHUNK_DATA;
  position: ChunkPosition;
  data: Uint8Array;
}

export interface PlayerJoinedMessage extends BaseMessage {
  type: MessageType.PLAYER_JOINED;
  playerId: string;
  playerName: string;
  position: Vec3;
}

export interface PlayerLeftMessage extends BaseMessage {
  type: MessageType.PLAYER_LEFT;
  playerId: string;
}

export interface PlayerMovedMessage extends BaseMessage {
  type: MessageType.PLAYER_MOVED;
  playerId: string;
  position: Vec3;
  rotation: { x: number; y: number };
}

export interface BlockUpdateMessage extends BaseMessage {
  type: MessageType.BLOCK_UPDATE;
  position: Vec3;
  blockType: number;
}

export interface ChatBroadcastMessage extends BaseMessage {
  type: MessageType.CHAT_MESSAGE;
  playerId: string;
  playerName: string;
  message: string;
}

export type ClientMessage =
  | JoinMessage
  | MoveMessage
  | BlockBreakMessage
  | BlockPlaceMessage
  | ChatMessage;

export type ServerMessage =
  | WorldDataMessage
  | ChunkDataMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PlayerMovedMessage
  | BlockUpdateMessage
  | ChatBroadcastMessage;
