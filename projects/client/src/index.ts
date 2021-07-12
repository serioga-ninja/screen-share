'use strict';
import { connectionService } from './connection.service';
import { socket } from './socket-connection';
import { webCamService } from './web-cam.service';

/****************************************************************************
 * Initial setup
 ****************************************************************************/
const webcamButton = document.getElementById('webcamButton') as HTMLButtonElement;
const webcamVideo = document.getElementById('webcamVideo') as HTMLVideoElement;
const callButton = document.getElementById('callButton') as HTMLButtonElement;
const callInput = document.getElementById('callInput') as HTMLInputElement;
const answerButton = document.getElementById('answerButton') as HTMLButtonElement;
const remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement;
const hangupButton = document.getElementById('hangupButton') as HTMLButtonElement;

// Create a random room if not already present in the URL.
let isInitiator;
let room = window.location.hash.substring(1);
if (!room) {
  room = window.location.hash = randomToken();
}


/****************************************************************************
 * Signaling server
 ****************************************************************************/

socket.on('ipaddr', function (ipaddr) {
  console.log('Server IP address is: ' + ipaddr);
});

socket.on('created', async function (roomID, clientId) {
  console.log('Created room ', roomID, '- my client ID is', clientId);
});

socket.on('joined', async function () {
  console.log('User joined');
});

socket.on('full', function (room) {
  alert('Room ' + room + ' is full. We will create a new room for you.');
  window.location.hash = '';
  window.location.reload();
});

// socket.on('log', function (array) {
//   console.log.apply(console, array);
// });

socket.on('message', function (message) {
  console.log('Client received message:', message);

  connectionService.handleSignalingData(message);
});

// Joining a room.
socket.emit('create or join', room);

if (location.hostname.match(/localhost|127\.0\.0/)) {
  socket.emit('ipaddr');
}

// Leaving rooms and disconnecting from peers.
socket.on('disconnect', function (reason) {
  console.log(`Disconnected: ${reason}.`);
  // sendBtn.disabled = true;
  // snapAndSendBtn.disabled = true;
});

socket.on('bye', function (room) {
  console.log(`Peer leaving room ${room}.`);
  // sendBtn.disabled = true;
  // snapAndSendBtn.disabled = true;
  // If peer did not create the room, re-enter to be creator.
  if (!isInitiator) {
    // window.location.reload();
  }
});

window.addEventListener('unload', function () {
  console.log(`Unloading window. Notifying peers in ${room}.`);
  socket.emit('bye', room);
});

/****************************************************************************
 * User media (webcam)
 ****************************************************************************/

(async () => {
  const localStream = await webCamService.start();
  const remoteStream = new MediaStream();
  const pc = await connectionService.createPeerConnectionForSID(room);

  // Push tracks from local stream to peer connection
  localStream?.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  await connectionService.sendOffer(room);

  // Pull tracks from remote stream, add to video stream
  pc.ontrack = (event) => {
    console.log('pc ontrack', event);

    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  webcamVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;

  callButton.disabled = false;
  answerButton.disabled = false;
  webcamButton.disabled = true;
})();

function show() {
  Array.prototype.forEach.call(arguments, function (elem) {
    elem.style.display = null;
  });
}

function hide() {
  Array.prototype.forEach.call(arguments, function (elem) {
    elem.style.display = 'none';
  });
}

function randomToken() {
  return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
}

function logError(err) {
  if (!err) return;
  if (typeof err === 'string') {
    console.warn(err);
  } else {
    console.warn(err.toString(), err);
  }
}

/**
 * Send message to signaling server
 */
export function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', { roomId: room, ...message });
}
