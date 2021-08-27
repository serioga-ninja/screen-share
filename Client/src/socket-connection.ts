import { io } from 'socket.io-client';
import { ISocketMessage } from '../../Shared/core/all';

let myId: string;
let room: string;

export const socket = io();

export function initializeSockets(room: string) {
// Leaving rooms and disconnecting from peers.
  socket.on('disconnect', function (reason) {
    console.log(`Disconnected: ${reason}.`);
  });

  socket.on('ipaddr', function (ipaddr) {
    console.log('Server IP address is: ' + ipaddr);
  });

  socket.on('hello', function (mySocketId: string) {
    console.log(`Connected to server. Your ID is "${mySocketId}"`);

    myId = mySocketId;
  });

  // Joining a room.
  socket.emit('create or join', room);
}

if (location.hostname.match(/localhost|127\.0\.0/)) {
  socket.emit('ipaddr');
}

window.addEventListener('unload', function () {
  console.log(`Unloading window. Notifying peers in ${room}.`);
  socket.emit('bye', room);
});

/**
 * Send message to signaling server
 */
export function sendMessage(message: Record<string, unknown>, toClientId?: string) {
  const sendingMessage: ISocketMessage = {
    roomId: window.location.hash.substring(1),
    payload: message,
    sendByClientId: myId,
    sendToClientId: toClientId
  };

  socket.emit('message', sendingMessage);
}
