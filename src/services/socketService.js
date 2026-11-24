import { io } from 'socket.io-client';
import { getAccessToken } from './apiClient';

const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

const getRawAuthToken = () => {
  const token = getAccessToken();
  return token ? String(token).replace(/^Bearer\s+/i, '').trim() : '';
};

let socket = null;
const subscribedPondIds = new Set();
const eventListeners = new Map();

const ensureSocket = () => {
  if (socket) {
    return socket;
  }

  const rawToken = getRawAuthToken();
  socket = io(`${SOCKET_URL}/`, {
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    auth: { token: rawToken },
  });

  socket.on('connect', () => {
    subscribedPondIds.forEach((pondId) => {
      socket.emit('join:pond', { pondId });
    });
  });

  socket.io.on('reconnect_attempt', () => {
    const nextToken = getRawAuthToken();
    socket.auth = { token: nextToken };
  });

  eventListeners.forEach((handlers, eventName) => {
    handlers.forEach((handler) => {
      socket.on(eventName, handler);
    });
  });

  return socket;
};

const subscribeEvents = (eventNames, handler) => {
  if (typeof handler !== 'function') {
    return () => {};
  }

  eventNames.forEach((eventName) => {
    if (!eventListeners.has(eventName)) {
      eventListeners.set(eventName, new Set());
    }
    const handlers = eventListeners.get(eventName);
    if (!handlers.has(handler)) {
      handlers.add(handler);
      if (socket) {
        socket.on(eventName, handler);
      }
    }
  });

  return () => {
    eventNames.forEach((eventName) => {
      const handlers = eventListeners.get(eventName);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          eventListeners.delete(eventName);
        }
      }
      if (socket) {
        socket.off(eventName, handler);
      }
    });
  };
};

/**
 * Service WebSocket thời gian thực kết nối EventsGateway (/ namespace)
 */
export const socketService = {
  connect() {
    const activeSocket = ensureSocket();
    const rawToken = getRawAuthToken();
    activeSocket.auth = { token: rawToken };
    if (!activeSocket.connected) {
      activeSocket.connect();
    }
    return activeSocket;
  },

  disconnect() {
    subscribedPondIds.clear();
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
  },

  syncPondSubscriptions(pondIds = []) {
    const nextPondSet = new Set(
      (Array.isArray(pondIds) ? pondIds : []).filter(Boolean)
    );

    Array.from(subscribedPondIds).forEach((pondId) => {
      if (!nextPondSet.has(pondId)) {
        subscribedPondIds.delete(pondId);
        if (socket?.connected) {
          socket.emit('leave:pond', { pondId });
        }
      }
    });

    nextPondSet.forEach((pondId) => {
      if (!subscribedPondIds.has(pondId)) {
        subscribedPondIds.add(pondId);
        if (socket?.connected) {
          socket.emit('join:pond', { pondId });
        }
      }
    });
  },

  onTelemetry(handler) {
    return subscribeEvents(['telemetry:update', 'telemetry:new'], handler);
  },

  onFeederStatus(handler) {
    return subscribeEvents(['feeder:status', 'feeding:progress'], handler);
  },

  onFeedingCompleted(handler) {
    return subscribeEvents(['feeding:completed'], handler);
  },

  onAlertNew(handler) {
    return subscribeEvents(['alert:new'], handler);
  },

  onDeviceStatus(handler) {
    return subscribeEvents(['device:status'], handler);
  },
};

export default socketService;
