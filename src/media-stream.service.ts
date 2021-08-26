export enum MediaStreamServiceEvents {
  AddTrackJSEvent = 'addtrackjs',
  RemoveTrackJSEvent = 'removetrackjs',
  ReplaceTrackJSEvent = 'replacerackjs',
}

export enum EVideoType {
  webCam,
  Screen
}

export class MediaStreamService extends EventTarget {
  private _stream: MediaStream = new MediaStream();

  private _webCamTrack?: MediaStreamTrack;
  private _audioTrack?: MediaStreamTrack;
  private _screenTrack?: MediaStreamTrack;

  private _selectedVideoType?: EVideoType;

  get stream() {
    return this._stream;
  }

  toggleVideo() {
    if (this._selectedVideoType === EVideoType.webCam) {
      this.useScreenVideo();
    } else {
      this.useWebCamVideo();
    }
  }

  async requestUserMedia(): Promise<void> {
    console.log('Getting web cam stream');

    if (this._webCamTrack && this._audioTrack) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      this._webCamTrack = stream.getVideoTracks()[0];
      this._audioTrack = stream.getAudioTracks()[0];

      this._webCamTrack.enabled = false;
      this._audioTrack.enabled = false;
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

    if (this._webCamTrack && this.streamContainsTrack(this._webCamTrack)) {
      this.replaceTrack(this._webCamTrack, this._screenTrack);
    } else {
      this.addTrack(this._screenTrack);
    }

    this._selectedVideoType = EVideoType.Screen;
  }

  async useWebCamVideo(): Promise<void> {
    if (this._selectedVideoType === EVideoType.webCam) return;

    if (!this._webCamTrack || !this._audioTrack) await this.requestUserMedia();

    if (!this._webCamTrack) {
      console.error(`Can't load webcam track`);

      return;
    }

    if (this._screenTrack && this.streamContainsTrack(this._screenTrack)) {
      this.replaceTrack(this._screenTrack, this._webCamTrack);
      this._screenTrack.stop();
    } else {
      if (this._audioTrack && this._stream.getAudioTracks().length === 0) this.addTrack(this._audioTrack);

      this.addTrack(this._webCamTrack);
    }

    this._selectedVideoType = EVideoType.webCam;
  }

  streamContainsTrack(track: MediaStreamTrack): boolean {
    return this._stream.getTracks().includes(track);
  }

  private replaceTrack(from: MediaStreamTrack, track: MediaStreamTrack): void {
    this._stream.removeTrack(from);
    this._stream.addTrack(track);
    this._stream.dispatchEvent(new CustomEvent(MediaStreamServiceEvents.ReplaceTrackJSEvent, {
      detail: {
        from: from,
        to: track
      }
    }));
  }

  private addTrack(track: MediaStreamTrack): void {
    this._stream.addTrack(track);
    this._stream.dispatchEvent(new CustomEvent(MediaStreamServiceEvents.AddTrackJSEvent, {
      detail: {
        tracks: [track]
      }
    }));
  }
}

export const mediaStreamService = new MediaStreamService();
