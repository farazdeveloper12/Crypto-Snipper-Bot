// frontend/src/services/socket.js
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'ws://localhost:5002';

let socket;

export const initializeSocket = () => {
  socket = io(SOCKET_URL, { transports: ['websocket'] });
  
  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
  });
  
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const subscribeToEvent = (event, callback) => {
  const socket = getSocket();
  socket.on(event, callback);
  
  return () => {
    socket.off(event, callback);
  };
};

export default {
  initializeSocket,
  getSocket,
  subscribeToEvent
};