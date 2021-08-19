export class WebCamService extends EventTarget {
  private _stream: MediaStream = new MediaStream();
  private _recording = false;

  get recording() {
    return this._recording;
  }

  get stream() {
    return this._stream;
  }

  async start(): Promise<MediaStream> {
    if (this._recording && this._stream) return this._stream;

    console.log('Getting user media (video) ...');

    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });

      // this._stream.getVideoTracks().forEach(track => track.enabled = false);
      this._stream.getAudioTracks().forEach(track => track.enabled = false);

      console.log('getUserMedia video stream URL:', this._stream);
      this._recording = true;

      return this._stream;
    } catch (e) {
      console.error(e);

      return new MediaStream();
    }
  }
}

export const webCamService = new WebCamService();
