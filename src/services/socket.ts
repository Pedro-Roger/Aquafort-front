import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_WS_URL ?? 'http://localhost:3000', {
      autoConnect: false,
      auth: {
        token: localStorage.getItem('aquafort_token'),
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

export function connectSocket(): void {
  getSocket().connect();
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
