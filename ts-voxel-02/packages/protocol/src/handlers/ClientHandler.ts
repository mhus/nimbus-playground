/**
 * Client-side protocol message handlers
 */

export interface ClientProtocolHandler {
  /**
   * Handle login request from server
   */
  onLoginRequest(data: any): void;

  /**
   * Handle login success
   */
  onLoginSuccess(data: any): void;

  /**
   * Handle player teleport
   */
  onPlayerTeleport(data: any): void;

  /**
   * Handle chunk load
   */
  onWorldChunkLoad(data: any): void;

  /**
   * Handle block update
   */
  onWorldBlockUpdate(data: any): void;

  /**
   * Handle entity create
   */
  onEntityCreate(data: any): void;

  /**
   * Handle entity move
   */
  onEntityMove(data: any): void;

  /**
   * Handle entity remove
   */
  onEntityRemove(data: any): void;

  /**
   * Handle chat message
   */
  onChatMessage(data: any): void;

  /**
   * Handle player kick
   */
  onPlayerKick(data: any): void;
}

/**
 * Base client protocol handler implementation
 */
export class BaseClientProtocolHandler implements ClientProtocolHandler {
  onLoginRequest(data: any): void {
    console.log('[Client] LoginRequest received:', data);
  }

  onLoginSuccess(data: any): void {
    console.log('[Client] LoginSuccess received');
  }

  onPlayerTeleport(data: any): void {
    console.log('[Client] PlayerTeleport received:', data);
  }

  onWorldChunkLoad(data: any): void {
    console.log('[Client] WorldChunkLoad received');
  }

  onWorldBlockUpdate(data: any): void {
    console.log('[Client] WorldBlockUpdate received:', data);
  }

  onEntityCreate(data: any): void {
    console.log('[Client] EntityCreate received:', data);
  }

  onEntityMove(data: any): void {
    console.log('[Client] EntityMove received:', data);
  }

  onEntityRemove(data: any): void {
    console.log('[Client] EntityRemove received:', data);
  }

  onChatMessage(data: any): void {
    console.log('[Client] ChatMessage received:', data);
  }

  onPlayerKick(data: any): void {
    console.log('[Client] PlayerKick received:', data);
  }
}
