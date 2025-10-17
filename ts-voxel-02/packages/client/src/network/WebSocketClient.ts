/**
 * WebSocket Client (migrated from tmp/voxelsrv/src/socket.ts)
 */

export type MessageHandler = (data: any) => void;

/**
 * WebSocket client for multiplayer connection
 */
export class WebSocketClient {
  private socket?: WebSocket;
  private listeners: { [type: string]: MessageHandler[] } = {};
  private connected = false;
  public server: string = '';

  constructor() {}

  /**
   * Connect to server
   */
  async connect(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('[WebSocket] Connecting to', serverUrl);
      this.server = serverUrl;
      this.socket = new WebSocket(serverUrl);

      this.socket.binaryType = 'arraybuffer';

      this.socket.onopen = () => {
        console.log('[WebSocket] Connected');
        this.connected = true;
        setTimeout(() => {
          this.emit('connection', {});
          resolve();
        }, 50);
      };

      this.socket.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setTimeout(() => {
          this.emit('PlayerKick', { reason: `Can't connect to ${serverUrl}` });
          reject(error);
        }, 500);
      };

      this.socket.onclose = () => {
        console.log('[WebSocket] Closed');
        this.connected = false;
        setTimeout(() => {
          this.emit('PlayerKick', { reason: 'Connection closed!' });
        }, 500);
      };

      this.socket.onmessage = async (event) => {
        try {
          // For now, use JSON (will upgrade to protobuf later)
          const message = JSON.parse(event.data);
          if (message && message.type) {
            this.emit(message.type, message);
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Send message to server
   */
  async send(type: string, data: any = {}): Promise<void> {
    if (!this.socket || !this.connected) {
      console.warn('[WebSocket] Cannot send - not connected');
      return;
    }

    const message = { type, ...data };
    this.socket.send(JSON.stringify(message));
  }

  /**
   * Register event handler
   */
  on(type: string, handler: MessageHandler): void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(handler);
  }

  /**
   * Emit event to handlers
   */
  private emit(type: string, data: any): void {
    if (this.listeners[type]) {
      this.listeners[type].forEach((handler) => {
        handler(data);
      });
    }
  }

  /**
   * Close connection
   */
  close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
    this.connected = false;
    this.listeners = {};
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}
