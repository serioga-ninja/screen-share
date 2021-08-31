import { Subject } from 'rxjs';

export enum MediaStreamServiceEvents {
  ReplaceTrackJSEvent = 'replacerackjs',
}

export enum EVideoType {
  WebCam,
  Screen
}

export class MediaStreamService extends EventTarget {
  readonly stream$: Subject<MediaStream> = new Subject<MediaStream>();

  private _stream: MediaStream = new MediaStream();

  private _webCamTrack?: MediaStreamTrack;
  private _audioTrack?: MediaStreamTrack;
  private _screenTrack?: MediaStreamTrack;

  private _selectedVideoType?: EVideoType;

  get stream() {
    return this._stream;
  }

  constructor() {
    super();

    this.stream$.next(this._stream);
  }

  async toggleVideo() {
    if (this._selectedVideoType === EVideoType.WebCam) {
      await this.useScreenVideo();
    } else {
      await this.useWebCamVideo();
    }
  }

  async requestUserMedia(): Promise<void> {
    console.log('Getting web cam stream');

    if (this._webCamTrack && this._audioTrack) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: {
            min: 320,
            max: 1280
          },
          height: {
            min: 240,
            max: 720
          },
          frameRate: {
            ideal: 60,
            min: 10
          }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: { max: 48000, min: 48000 },
          sampleSize: { max: 16, min: 16 },
          latency: { max: 0.01, min: 0.01 },
          channelCount: { max: 2, min: 1 }
        }
      });

      this._webCamTrack = stream.getVideoTracks()[0];
      this._audioTrack = stream.getAudioTracks()[0];

      this._webCamTrack.enabled = false;
      this._audioTrack.enabled = false;

      this._stream.addTrack(this._audioTrack);
    } catch (e) {
      console.error(e);
    }
  }

  async requestDisplayMedia(): Promise<void> {
    console.log('Getting screen stream');

    try {
      const stream: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia();

      this._screenTrack = stream.getVideoTracks()[0];
    } catch (e) {
      console.error(e);
    }
  }

  async useScreenVideo(): Promise<void> {
    if (this._selectedVideoType === EVideoType.Screen) return;

    await this.requestDisplayMedia();

    if (!this._screenTrack) {
      console.error(`Can't load screen media track`);

      return;
    }

    this.replaceTrack(this._webCamTrack, this._screenTrack);

    this._selectedVideoType = EVideoType.Screen;
  }

  async useWebCamVideo(): Promise<void> {
    if (this._selectedVideoType === EVideoType.WebCam) return;

    if (!this._webCamTrack || !this._audioTrack) await this.requestUserMedia();

    if (!this._webCamTrack) {
      console.error(`Can't load webcam track`);

      return;
    }

    this.replaceTrack(this._screenTrack, this._webCamTrack);
    this._screenTrack?.stop();

    this._selectedVideoType = EVideoType.WebCam;
  }

  streamContainsTrack(track: MediaStreamTrack): boolean {
    return this._stream.getTracks().includes(track);
  }

  private replaceTrack(from: MediaStreamTrack, track: MediaStreamTrack): void {
    if (from) {
      this._stream.removeTrack(from);
    }
    this._stream.addTrack(track);
    this._stream.dispatchEvent(new CustomEvent(MediaStreamServiceEvents.ReplaceTrackJSEvent, {
      detail: {
        from: from,
        to: track
      }
    }));
  }
}

export const mediaStreamService = new MediaStreamService();
