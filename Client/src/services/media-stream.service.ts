import { Subject } from 'rxjs';

export enum MediaStreamServiceEvents {
  ReplaceTrackJSEvent = 'replacerackjs',
  AddTrackJSEvent = 'addtrack',
  VideoStreamUpdated = 'videostreamupdated',
}

export enum EVideoType {
  WebCam,
  Screen
}

export class MediaStreamService extends EventTarget {
  private _stream: MediaStream = new MediaStream();

  private _webCamTrack?: MediaStreamTrack;
  private _audioTrack?: MediaStreamTrack;
  private _screenTrack?: MediaStreamTrack;

  get stream() {
    return this._stream;
  }

  get hasAudio(): boolean {
    return !!this._audioTrack;
  }

  get webCamInProgress(): boolean {
    return this.streamContainsTrack(this._webCamTrack) && this._webCamTrack.enabled;
  }

  get screenShareInProgress(): boolean {
    return this.streamContainsTrack(this._screenTrack) && this._screenTrack.enabled;
  }

  get audioTrack() {
    return this._audioTrack;
  }

  get videoTrack() {
    return this._stream.getVideoTracks()[0];
  }

  turnOffWebCam() {
    this._webCamTrack.enabled = false;
    this._webCamTrack.stop();
  }

  turnOffScreenShare() {
    this._screenTrack.enabled = false;
    this._screenTrack.stop();
  }

  async useScreenVideo(): Promise<void> {
    await this.requestDisplayMedia();

    if (!this._screenTrack) return;

    if (this.webCamInProgress) {
      this.replaceTrack(this._webCamTrack, this._screenTrack);
      this.turnOffWebCam();
    } else {
      this.addTack(this._screenTrack);
    }
  }

  async useWebCamVideo(): Promise<void> {
    await this.requestWebCam();

    if (!this._webCamTrack) return;

    if (this.screenShareInProgress) {
      this.replaceTrack(this._screenTrack, this._webCamTrack);
      this.turnOffScreenShare();
    } else {
      this.addTack(this._webCamTrack);
    }
  }

  async useAudio(): Promise<void> {
    await this.requestAudio();

    if (!this._audioTrack) return;

    this.addTack(this._audioTrack);
  }

  private async requestWebCam(): Promise<void> {
    console.log('Getting web cam stream');

    if (this._webCamTrack) return;

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
        }
      });

      this._webCamTrack = stream.getVideoTracks()[0];
    } catch (e) {
      console.error(e);
    }
  }

  private async requestAudio(): Promise<void> {
    console.log('Getting audio stream');

    if (this._audioTrack) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: { max: 48000, min: 48000 },
          sampleSize: { max: 16, min: 16 },
          latency: { max: 0.01, min: 0.01 },
          channelCount: { max: 2, min: 1 }
        }
      });

      this._audioTrack = stream.getAudioTracks()[0];
    } catch (e) {
      console.error(e);
    }
  }

  private async requestDisplayMedia(): Promise<void> {
    console.log('Getting screen stream');

    try {
      const stream: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia();

      this._screenTrack = stream.getVideoTracks()[0];
    } catch (e) {
      console.error(e);
    }
  }

  private streamContainsTrack(track: MediaStreamTrack): boolean {
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
    this._stream.dispatchEvent(new CustomEvent(MediaStreamServiceEvents.VideoStreamUpdated));
  }

  private addTack(track: MediaStreamTrack): void {
    if (this.streamContainsTrack(track)) return;

    this._stream.addTrack(track);

    this._stream.dispatchEvent(new CustomEvent(MediaStreamServiceEvents.AddTrackJSEvent, {
      detail: {
        track
      }
    }));
  }
}

export const mediaStreamService = new MediaStreamService();
