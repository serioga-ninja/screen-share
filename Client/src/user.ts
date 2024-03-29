import { MediaStreamServiceEvents } from './services';
import { UsersCollection } from './users-collection';

export interface IUserOptions {
  roomID: string;
  userID: string;
  currentUser: boolean;
}

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

  get pc() {
    return this._pc;
  }

  private _collection?: UsersCollection;
  private _audioScore = 0;
  private _pc: RTCPeerConnection;

  constructor(private _stream: MediaStream, options: Partial<IUserOptions> = {}) {
    options = {
      ...defaultOptions,
      ...options
    };

    Object.assign(this, options);

    // this.collectAudioScore();
  }

  private collectAudioScore() {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    this._pc = pc;

    pc.addEventListener('track', ({ track, transceiver }) => {
      track.onunmute = () => {
        if (track.kind === 'video' && this.stream.getVideoTracks().length > 0) {
          this.stream.removeTrack(
            this.stream.getVideoTracks()[0]
          );
        } else if (track.kind === 'audio' && this.stream.getAudioTracks().length > 0) {
          this.stream.removeTrack(
            this.stream.getAudioTracks()[0]
          );
        }

        this.stream.addTrack(track);

        track.onended = () => {
          this.stream.removeTrack(track);
        }
      };
    });

    this._collection.set(this.userID, this);
  }
}
