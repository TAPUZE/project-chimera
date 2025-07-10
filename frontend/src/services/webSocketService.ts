import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface WebSocketConfig {
  url: string;
  token?: string;
  reconnection?: boolean;
  reconnectionDelay?: number;
  reconnectionAttempts?: number;
}

class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      ...config,
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const socketConfig: any = {
        transports: ['websocket'],
        upgrade: false,
        reconnection: this.config.reconnection,
        reconnectionDelay: this.config.reconnectionDelay,
        reconnectionAttempts: this.config.reconnectionAttempts,
      };

      if (this.config.token) {
        socketConfig.auth = {
          token: this.config.token,
        };
      }

      this.socket = io(this.config.url, socketConfig);

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        this.emit('disconnect', null);
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      });

      // Handle reconnection events
      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
        this.emit('reconnect', attemptNumber);
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('WebSocket reconnection error:', error);
        this.emit('reconnect_error', error);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('WebSocket reconnection failed');
        this.emit('reconnect_failed', null);
      });

      // Handle incoming messages
      this.socket.onAny((event, ...args: any[]) => {
        this.emit(event, args[0]);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in WebSocket event handler for ${event}:`, error);
      }
    });
  }

  on(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
  }

  off(event: string, handler?: Function): void {
    if (!handler) {
      this.eventHandlers.delete(event);
      return;
    }

    const handlers = this.eventHandlers.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.eventHandlers.set(event, handlers);
    }
  }

  send(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  // Specialized methods for different message types
  subscribeToAgentUpdates(agentId: string): void {
    this.send('subscribe_agent_updates', { agent_id: agentId });
  }

  unsubscribeFromAgentUpdates(agentId: string): void {
    this.send('unsubscribe_agent_updates', { agent_id: agentId });
  }

  subscribeToTaskUpdates(taskId: string): void {
    this.send('subscribe_task_updates', { task_id: taskId });
  }

  unsubscribeFromTaskUpdates(taskId: string): void {
    this.send('unsubscribe_task_updates', { task_id: taskId });
  }

  subscribeToSystemNotifications(): void {
    this.send('subscribe_system_notifications', {});
  }

  unsubscribeFromSystemNotifications(): void {
    this.send('unsubscribe_system_notifications', {});
  }

  joinChatRoom(sessionId: string): void {
    this.send('join_chat_room', { session_id: sessionId });
  }

  leaveChatRoom(sessionId: string): void {
    this.send('leave_chat_room', { session_id: sessionId });
  }

  sendChatMessage(sessionId: string, message: string): void {
    this.send('chat_message', { session_id: sessionId, message });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionState(): string {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }

  updateToken(token: string): void {
    this.config.token = token;
    if (this.socket) {
      this.socket.auth = { token };
    }
  }
}

// Create a singleton instance
const wsConfig: WebSocketConfig = {
  url: (window as any).ENV?.REACT_APP_WS_URL || 'ws://localhost:8000',
};

export const webSocketService = new WebSocketService(wsConfig);
export default webSocketService;
