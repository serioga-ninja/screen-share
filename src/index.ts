import { ISocketMessage } from './core/all';
import { mediaStreamService } from './media-stream.service';
import { socket } from './socket-connection';

import './components';

let myId: string;


// Create a random room if not already present in the URL.
let isInitiator;
let room = window.location.hash.substring(1);
if (!room) {
  room = window.location.hash = randomToken();
}

socket.on('hello', function (mySocketId: string) {
  console.log(`Connected to server. Your ID is "${mySocketId}"`);

  myId = mySocketId;
});

if (location.hostname.match(/localhost|127\.0\.0/)) {
  socket.emit('ipaddr');
}

window.addEventListener('unload', function () {
  console.log(`Unloading window. Notifying peers in ${room}.`);
  socket.emit('bye', room);
});

function randomToken() {
  return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
}

/**
 * Send message to signaling server
 */
export function sendMessage(message: Record<string, unknown>, toClientId?: string) {
  const sendingMessage: ISocketMessage = {
    roomId: room,
    payload: message,
    sendByClientId: myId,
    sendToClientId: toClientId
  };

  socket.emit('message', sendingMessage);
}

(async () => {
  await mediaStreamService.addWebCamStream();

  // Joining a room.
  socket.emit('create or join', room);
})();
