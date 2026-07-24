import { io, Socket } from 'socket.io-client';

let waterQualitySocket: Socket | null = null;

export function getWaterQualitySocket(): Socket {
  if (!waterQualitySocket) {
    waterQualitySocket = io(
      `${import.meta.env.VITE_WS_URL ?? 'http://localhost:3001'}/water-quality`,
      {
        autoConnect: false,
        auth: {
          token: localStorage.getItem('aquafort_token'),
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        transports: ['websocket'],
      }
    );
  }
  return waterQualitySocket;
}

export function connectWaterQualitySocket(): void {
  const sock = getWaterQualitySocket();
  // Update auth token on reconnect
  const token = localStorage.getItem('aquafort_token');
  if (token) {
    sock.auth = { token };
  }
  sock.connect();
}

export function disconnectWaterQualitySocket(): void {
  waterQualitySocket?.disconnect();
  waterQualitySocket = null;
}
