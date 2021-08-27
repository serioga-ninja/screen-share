import 'webrtc-adapter';

import './components';
import { mediaStreamService } from './media-stream.service';
import { initializeSockets } from './socket-connection';

// Create a random room if not already present in the URL.
let room = window.location.hash.substring(1);
if (!room) {
  room = window.location.hash = randomToken();
}

function randomToken() {
  return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
}

(async () => {
  await mediaStreamService.useWebCamVideo();

  initializeSockets(room);
})();
