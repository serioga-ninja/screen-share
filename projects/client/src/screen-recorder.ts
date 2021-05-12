import { desktopCapturer } from 'electron';

export class ScreenRecorder extends EventTarget {
  get recording() {
    return this._recording;
  }

  private source?: Electron.DesktopCapturerSource;
  private stream?: MediaStream;
  private recorder?: MediaRecorder;
  private _recording = false;

  async start(): Promise<MediaStream | undefined> {
    this._recording = true;
    const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] })
    this.source = sources[0];

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: this.source.id,
            minWidth: 1280,
            maxWidth: 1280,
            minHeight: 720,
            maxHeight: 720
          }
        } as any
      });


      this.recorder = new MediaRecorder(this.stream, { mimeType: 'video/webm; codecs=vp9' });
      this.recorder.ondataavailable = (event) => {
        this.dispatchEvent(new CustomEvent('data', {
          detail: {
            data: event.data,
            event: event
          }
        }))
      };

      this.recorder.start(100);
      console.log('this.recording, ', this.recording);
    } catch (e) {
      console.log(e);
    }

    return this.stream;
  }

  stop() {
    this.recorder?.stop();
    this._recording = false;
  }
}
