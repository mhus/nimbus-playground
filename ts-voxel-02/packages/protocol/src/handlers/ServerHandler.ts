/**
 * Server-side protocol message handlers
 */

export interface ServerProtocolHandler {
  /**
   * Handle login response from client
   */
  onLoginResponse(data: any): void;

  /**
   * Handle player movement
   */
  onActionMove(data: any): void;

  /**
   * Handle player look (rotation)
   */
  onActionLook(data: any): void;

  /**
   * Handle player movement + look
   */
  onActionMoveLook(data: any): void;

  /**
   * Handle block placement
   */
  onActionBlockPlace(data: any): void;

  /**
   * Handle block breaking
   */
  onActionBlockBreak(data: any): void;

  /**
   * Handle chat message from client
   */
  onActionMessage(data: any): void;

  /**
   * Handle inventory click
   */
  onActionInventoryClick(data: any): void;

  /**
   * Handle entity click
   */
  onActionClickEntity(data: any): void;

  /**
   * Handle block click
   */
  onActionClick(data: any): void;
}

/**
 * Base server protocol handler implementation
 */
export class BaseServerProtocolHandler implements ServerProtocolHandler {
  onLoginResponse(data: any): void {
    console.log('[Server] LoginResponse received:', data);
  }

  onActionMove(data: any): void {
    // High-frequency, typically no logging
  }

  onActionLook(data: any): void {
    // High-frequency, typically no logging
  }

  onActionMoveLook(data: any): void {
    // High-frequency, typically no logging
  }

  onActionBlockPlace(data: any): void {
    console.log('[Server] ActionBlockPlace received:', data);
  }

  onActionBlockBreak(data: any): void {
    console.log('[Server] ActionBlockBreak received:', data);
  }

  onActionMessage(data: any): void {
    console.log('[Server] ActionMessage received:', data);
  }

  onActionInventoryClick(data: any): void {
    console.log('[Server] ActionInventoryClick received:', data);
  }

  onActionClickEntity(data: any): void {
    console.log('[Server] ActionClickEntity received:', data);
  }

  onActionClick(data: any): void {
    console.log('[Server] ActionClick received:', data);
  }
}
