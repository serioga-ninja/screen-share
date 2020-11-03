import { desktopCapturer } from 'electron';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

const Index = () => {
  return <div>Hello React!</div>;
};

ReactDOM.render(<Index/>, document.getElementById('app'));

function handleStream(stream: MediaStream) {
  const video = document.querySelector('video')
  if (!video) return;

  video.srcObject = stream
  video.onloadedmetadata = (e) => video.play()
}

function handleError(e: any) {
  console.log(e)
}

desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
  for (const source of sources) {
    if (source.name === 'Entire Screen') {
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
        })
        handleStream(stream)
      } catch (e) {
        handleError(e)
      }
      return
    }
  }
})
