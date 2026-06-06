import { io } from 'socket.io-client';

const socket = io('https://chatflow-production-fd36.up.railway.app', {
  autoConnect: false,
});

export default socket;