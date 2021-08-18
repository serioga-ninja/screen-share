export class WebCamService extends EventTarget {
  private _stream: MediaStream;
  private _recording = false;

  get recording() {
    return this._recording;
  }

  get stream() {
    return this._stream;
  }

  async start(): Promise<MediaStream> {
    if (this._stream) return this._stream;

    console.log('Getting user media (video) ...');

    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true
      });

      console.log('getUserMedia video stream URL:', this._stream);

      return this._stream;
    } catch (e) {
      console.error(e);

      return new MediaStream();
    }
  }
}

export const webCamService = new WebCamService();
