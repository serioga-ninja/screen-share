import { UsersCollection } from './users-collection';

export interface IUserOptions {
  roomID: string;
  userID: string;
  currentUser: boolean;
}

const MIN_MAIN_SCREEN_TIME_MS = 10000;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)(); // define audio context


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

  get audioScore() {
    return this._audioScore;
  }

  private _collection?: UsersCollection;
  private _audioScore = 0;

  constructor(private _stream: MediaStream, options: Partial<IUserOptions> = {}) {
    options = {
      ...defaultOptions,
      ...options
    };

    Object.assign(this, options);

    this.collectAudioScore();
  }

  private collectAudioScore() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = context.createAnalyser();

    const source = context.createMediaStreamSource(this._stream);
    source.connect(analyser);

    analyser.fftSize = 2048;

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);

    setInterval(() => {
      analyser.getByteTimeDomainData(frequencyData);

      this._audioScore = frequencyData.reduce((res, num) => res + num, 0);
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
