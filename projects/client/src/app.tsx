import { shell } from 'electron';
import { io } from 'socket.io-client';
import * as ReactDOM from 'react-dom';
import React from 'react';
import { ScreenRecorder } from './screen-recorder';

const socket = io('http://localhost:3000');

socket.on('connect_error', (err) => {
  console.log(`connect_error due to ${err.message}`);
});

socket.on('hi', ({ filePath }) => {
  ReactDOM.render(
    <App filePath={filePath}/>,
    document.getElementById('app')
  );
});

socket.on('disconnect', () => {
  console.log('user disconnected');
});

const screenRecorder = new ScreenRecorder();

screenRecorder.addEventListener('data', (event: CustomEvent) => {
  socket.emit('video-data', event.detail.data);
});


const start = async () => {
  const stream = await screenRecorder.start();

  if (!stream) return;

  const video = document.getElementById('preview') as HTMLVideoElement;
  if (!video) return;

  video.srcObject = stream
  video.onloadedmetadata = () => video.play();
}

const stop = () => {
  screenRecorder.stop();

  const video = document.getElementById('preview') as HTMLVideoElement;
  if (!video) return;

  const stream = video.srcObject as any;
  const tracks = stream.getTracks();

  tracks.forEach((track: MediaStreamTrack) => {
    track.stop();
  });

  video.srcObject = null;
}

class App extends React.Component<{ filePath: string; }, { recording: boolean; }> {
  private timerID: any;

  constructor(props: { filePath: string; }) {
    super(props);

    this.state = { recording: screenRecorder.recording };
  }

  componentDidMount() {
    this.timerID = setInterval(
      () => this.tick(),
      100
    );
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  tick() {
    this.setState({
      recording: screenRecorder.recording
    });
  }

  render() {

    return <div>
      <div className="preview">
        <video id="preview" autoPlay></video>
      </div>
      <div className="buttons">
        {screenRecorder.recording
          ? <button onClick={stop}>Stop</button>
          : <button onClick={start}>Start</button>
        }
      </div>
      <div>
        <button type="button" onClick={() => {
          openURL(this.props.filePath)
        }}> {this.props.filePath}</button>
      </div>
    </div>;
  }
}

const
  openURL = (url: string) => {
    shell.openExternal(url);
  }
