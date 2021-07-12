export class WebCamService extends EventTarget {
  private _stream: MediaStream | undefined;
  private _recording = false;

  get recording() {
    return this._recording;
  }

  async start(): Promise<MediaStream | undefined> {
    console.log('Getting user media (video) ...');

    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true
      });

      console.log('getUserMedia video stream URL:', this._stream);

      return this._stream;
    } catch (e) {
      alert('getUserMedia() error: ' + e.name);
    }
  }
}

export const webCamService = new WebCamService();
