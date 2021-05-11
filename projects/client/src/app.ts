import { desktopCapturer } from 'electron';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect_error', (err) => {
  console.log(`connect_error due to ${err.message}`);
});

socket.on('hi', () => {
  console.log('a user connected');

  desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
    const source = sources[0];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id,
            minWidth: 1280,
            maxWidth: 1280,
            minHeight: 720,
            maxHeight: 720
          }
        } as any
      });


      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
      mediaRecorder.ondataavailable = (event) => {
        console.log('data-available');
        console.log(event.data);
        socket.emit('video-data', event.data);
      };
      mediaRecorder.start(1000);
    } catch (e) {
      console.log(e);
    }

    return;
  });
});

socket.on('disconnect', () => {
  console.log('user disconnected');
});
