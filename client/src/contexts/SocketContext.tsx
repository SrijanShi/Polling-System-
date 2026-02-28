import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Singleton socket created ONCE at module level - survives StrictMode remounts
let socketSingleton: Socket | null = null;

function getSocket(): Socket {
  if (!socketSingleton || socketSingleton.disconnected) {
    socketSingleton = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
    });
  }
  return socketSingleton;
}

interface SocketContextType {
  socket: Socket;
  isConnected: boolean;
  error: string | null;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const socket = getSocket();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onConnect = () => {
      console.log('Connected to server:', socket.id);
      setIsConnected(true);
      setError(null);
    };
    const onDisconnect = () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    };
    const onConnectError = (err: Error) => {
      console.error('Connection error:', err.message);
      setError(err.message);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    // If already connected, update state immediately
    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      // Do NOT close socket here - it's a singleton
    };
  }, [socket]);

  const emit = (event: string, data?: any) => {
    if (socket.connected) {
      socket.emit(event, data);
    } else {
      console.warn(`Socket not connected, queueing: ${event}`);
      // Queue the emit once connected
      socket.once('connect', () => socket.emit(event, data));
    }
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    socket.on(event, callback);
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (callback) {
      socket.off(event, callback);
    } else {
      socket.off(event);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, error, emit, on, off }}>
      {children}
    </SocketContext.Provider>
  );
};
