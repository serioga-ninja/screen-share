import { App, EAppEvents } from './app';
import { connectionService, EConnectionServiceEvents } from './connection.service';
import { ISocketMessage } from './core/all';
import { socket } from './socket-connection';
import { webCamService } from './web-cam.service';

const webcamVideo = document.getElementById('webcamVideo') as HTMLVideoElement;
const remoteStreamsBlock = document.getElementById('remote-streams-list') as HTMLDivElement;
const connections = new Map();

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

// Joining a room.
socket.emit('create or join', room);

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

const app = new App(
  socket, webCamService, connectionService
);

app.addEventListener(EAppEvents.OfferAccepted, async (event: any) => {
  const { pc, sendByClientId } = event.detail;

  await webCamService.start();

  if (!webcamVideo.srcObject && webCamService.stream) webcamVideo.srcObject = webCamService.stream;

  connections.set(sendByClientId, pc);
});

app.addEventListener(EConnectionServiceEvents.PeerConnectionTrack, (event: any) => {
  console.log('EConnectionServiceEvents.PeerConnectionTrack', event.detail);

  const { onTrackEvent, clientId } = event.detail;

  const remoteStream = new MediaStream();
  const remoteStreamVideoBLock = document.createElement('video');

  remoteStreamVideoBLock.setAttribute('data-clientid', clientId);
  remoteStreamVideoBLock.setAttribute('autoplay', '');
  remoteStreamVideoBLock.setAttribute('playsinline', '');
  remoteStreamsBlock.append(remoteStreamVideoBLock);

  remoteStreamVideoBLock.srcObject = remoteStream;

  onTrackEvent.streams[0].getTracks().forEach((track: MediaStreamTrack) => {
    remoteStream.addTrack(track);
  });
})


app.addEventListener(EAppEvents.UserLeft, (event: any) => {
  const { clientId } = event.detail;

  document
    .querySelectorAll(`[data-clientid="${clientId}"]`)
    .forEach(elem => {
      elem.remove();
    });
  connections.delete(clientId);
});
