export enum MediaStreamServiceEvents {
  AddTrackJSEvent = 'addtrackjs'
}

export class MediaStreamService extends EventTarget {
  private _stream: MediaStream = new MediaStream();
  private _webStream?: MediaStream;
  private _displayStream?: MediaStream;

  get stream() {
    return this._stream;
  }

  async addWebCamStream(): Promise<MediaStream> {
    console.log('Getting web cam stream');

    if (this._webStream) return this._stream;

    try {
      this._webStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      this._webStream.getTracks().forEach(track => {
        if (track.kind === 'audio') track.enabled = false;

        this._stream.addTrack(track);
      });

      this.dispatchEvent(new CustomEvent(MediaStreamServiceEvents.AddTrackJSEvent, {
        detail: {
          tracks: this._webStream.getTracks()
        }
      }));

      this._stream.dispatchEvent(new Event(MediaStreamServiceEvents.AddTrackJSEvent));
    } catch (e) {
      console.error(e);
    }

    return this._stream;
  }

  async addScreenShareStream(): Promise<MediaStream> {
    console.log('Getting screen stream');

    if (this._displayStream) return this._stream;

    try {
      this._displayStream = await (navigator.mediaDevices as any).getDisplayMedia();

      this._displayStream.getTracks().forEach(track => {
        this._stream.addTrack(track);
      });

      this.dispatchEvent(new CustomEvent(MediaStreamServiceEvents.AddTrackJSEvent, {
        detail: {
          tracks: this._displayStream.getTracks()
        }
      }));
    } catch (e) {
      console.error(e);
    }

    return this._stream;

  }
}

export const mediaStreamService = new MediaStreamService();
