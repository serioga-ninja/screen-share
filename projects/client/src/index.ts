'use strict';
import { ISocketMessage } from '../../shared/interfaces/all';
import { connectionService, EConnectionServiceEvents } from './connection.service';
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


socket.on('joined', async function (clientId: string) {
  console.log(`User ${clientId} joined`);

  const pc = await connectionService.createPeerConnectionForSID(clientId);

  await webCamService.start();

  // Push tracks from local stream to peer connection
  webCamService.stream?.getTracks().forEach((track) => {
    pc.addTrack(track, webCamService.stream);
  });

  await connectionService.sendOffer(clientId);

  // Pull tracks from remote stream, add to video stream
  pc.ontrack = (event) => {
    const remoteStream = new MediaStream();
    const remoteStreamVideoBLock = document.createElement('video');

    remoteStreamVideoBLock.setAttribute('autoplay', '');
    remoteStreamVideoBLock.setAttribute('playsinline', '');
    remoteStreamsBlock.append(remoteStreamVideoBLock);

    remoteStreamVideoBLock.srcObject = remoteStream;

    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  if (!webcamVideo.srcObject) webcamVideo.srcObject = webCamService.stream;

  connections.set(clientId, pc);
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
