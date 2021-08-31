import { UsersCollection } from './users-collection';

export interface IUserOptions {
  roomID: string;
  userID: string;
  currentUser: boolean;
}

const MIN_MAIN_SCREEN_TIME_MS = 10000;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)(); // define audio context
const analyser = audioCtx.createAnalyser();
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.85;


const defaultOptions: Partial<IUserOptions> = {
  currentUser: false
} as const;

export class User {
  readonly userID: string;
  readonly roomID: string;
  readonly currentUser: boolean;

  get stream() {
    return this._stream;
  }

  get videoEnabled(): boolean {
    const videoTrack = this._stream.getVideoTracks()[0];

    return videoTrack?.enabled;
  }

  private _collection?: UsersCollection;
  private _dataArray: Uint8Array;

  constructor(private _stream: MediaStream, options: Partial<IUserOptions> = {}) {
    options = {
      ...defaultOptions,
      ...options
    };

    Object.assign(this, options);

    this._dataArray = new Uint8Array(analyser.frequencyBinCount);

    setInterval(() => {

      const source = audioCtx.createMediaStreamSource(_stream);
      source.connect(analyser);
      analyser.fftSize = 2048;
      var bufferLength = analyser.frequencyBinCount; // half the FFT value
      var dataArray = new Uint8Array(bufferLength); // create an array to store the data
      analyser.getByteTimeDomainData(dataArray); // get waveform data and put it into the array created above

      console.log(dataArray.reduce((res, n) => res + n, 0));
    }, 1000);
  }

  setCollection(collection: UsersCollection) {
    this._collection = collection;
  }

  setPeerConnection(pc: RTCPeerConnection) {
    pc.addEventListener('track', (event) => {
      event.streams[0].getTracks().forEach((track: MediaStreamTrack) => {
        this.stream.addTrack(track);
      });
    });

    this._collection.set(this.userID, this);
  }
}
