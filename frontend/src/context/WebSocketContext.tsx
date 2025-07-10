import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { webSocketService, WebSocketMessage } from '../services/webSocketService';

interface WebSocketContextType {
  isConnected: boolean;
  connectionState: string;
  lastMessage: WebSocketMessage | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (event: string, data: any) => void;
  subscribeToAgentUpdates: (agentId: string) => void;
  unsubscribeFromAgentUpdates: (agentId: string) => void;
  subscribeToTaskUpdates: (taskId: string) => void;
  unsubscribeFromTaskUpdates: (taskId: string) => void;
  subscribeToSystemNotifications: () => void;
  unsubscribeFromSystemNotifications: () => void;
  joinChatRoom: (sessionId: string) => void;
  leaveChatRoom: (sessionId: string) => void;
  sendChatMessage: (sessionId: string, message: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionState('connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionState('disconnected');
    };

    const handleReconnect = () => {
      setIsConnected(true);
      setConnectionState('connected');
    };

    const handleError = (error: any) => {
      console.error('WebSocket error:', error);
      setConnectionState('error');
    };

    const handleMessage = (data: any) => {
      const message: WebSocketMessage = {
        type: 'message',
        data,
        timestamp: new Date().toISOString(),
      };
      setLastMessage(message);
    };

    // Register event handlers
    webSocketService.on('connect', handleConnect);
    webSocketService.on('disconnect', handleDisconnect);
    webSocketService.on('reconnect', handleReconnect);
    webSocketService.on('error', handleError);
    webSocketService.on('message', handleMessage);

    // Specific message handlers
    webSocketService.on('agent_status_update', (data: any) => {
      const message: WebSocketMessage = {
        type: 'agent_status_update',
        data,
        timestamp: new Date().toISOString(),
      };
      setLastMessage(message);
    });

    webSocketService.on('task_progress_update', (data: any) => {
      const message: WebSocketMessage = {
        type: 'task_progress_update',
        data,
        timestamp: new Date().toISOString(),
      };
      setLastMessage(message);
    });

    webSocketService.on('task_completed', (data: any) => {
      const message: WebSocketMessage = {
        type: 'task_completed',
        data,
        timestamp: new Date().toISOString(),
      };
      setLastMessage(message);
    });

    webSocketService.on('system_notification', (data: any) => {
      const message: WebSocketMessage = {
        type: 'system_notification',
        data,
        timestamp: new Date().toISOString(),
      };
      setLastMessage(message);
    });

    webSocketService.on('chat_message', (data: any) => {
      const message: WebSocketMessage = {
        type: 'chat_message',
        data,
        timestamp: new Date().toISOString(),
      };
      setLastMessage(message);
    });

    webSocketService.on('agent_created', (data: any) => {
      const message: WebSocketMessage = {
        type: 'agent_created',
        data,
        timestamp: new Date().toISOString(),
      };
      setLastMessage(message);
    });

    webSocketService.on('agent_updated', (data: any) => {
      const message: WebSocketMessage = {
        type: 'agent_updated',
        data,
        timestamp: new Date().toISOString(),
      };
      setLastMessage(message);
    });

    webSocketService.on('agent_deleted', (data: any) => {
      const message: WebSocketMessage = {
        type: 'agent_deleted',
        data,
        timestamp: new Date().toISOString(),
      };
      setLastMessage(message);
    });

    // Auto-connect on mount
    const token = localStorage.getItem('token');
    if (token) {
      webSocketService.updateToken(token);
    }

    const connect = async () => {
      try {
        await webSocketService.connect();
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      webSocketService.off('connect', handleConnect);
      webSocketService.off('disconnect', handleDisconnect);
      webSocketService.off('reconnect', handleReconnect);
      webSocketService.off('error', handleError);
      webSocketService.off('message', handleMessage);
      webSocketService.disconnect();
    };
  }, []);

  const connect = async () => {
    try {
      await webSocketService.connect();
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const disconnect = () => {
    webSocketService.disconnect();
  };

  const sendMessage = (event: string, data: any) => {
    webSocketService.send(event, data);
  };

  const subscribeToAgentUpdates = (agentId: string) => {
    webSocketService.subscribeToAgentUpdates(agentId);
  };

  const unsubscribeFromAgentUpdates = (agentId: string) => {
    webSocketService.unsubscribeFromAgentUpdates(agentId);
  };

  const subscribeToTaskUpdates = (taskId: string) => {
    webSocketService.subscribeToTaskUpdates(taskId);
  };

  const unsubscribeFromTaskUpdates = (taskId: string) => {
    webSocketService.unsubscribeFromTaskUpdates(taskId);
  };

  const subscribeToSystemNotifications = () => {
    webSocketService.subscribeToSystemNotifications();
  };

  const unsubscribeFromSystemNotifications = () => {
    webSocketService.unsubscribeFromSystemNotifications();
  };

  const joinChatRoom = (sessionId: string) => {
    webSocketService.joinChatRoom(sessionId);
  };

  const leaveChatRoom = (sessionId: string) => {
    webSocketService.leaveChatRoom(sessionId);
  };

  const sendChatMessage = (sessionId: string, message: string) => {
    webSocketService.sendChatMessage(sessionId, message);
  };

  const contextValue: WebSocketContextType = {
    isConnected,
    connectionState,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
    subscribeToAgentUpdates,
    unsubscribeFromAgentUpdates,
    subscribeToTaskUpdates,
    unsubscribeFromTaskUpdates,
    subscribeToSystemNotifications,
    unsubscribeFromSystemNotifications,
    joinChatRoom,
    leaveChatRoom,
    sendChatMessage,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};
