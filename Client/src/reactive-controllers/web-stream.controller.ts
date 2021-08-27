import { ReactiveController, ReactiveControllerHost } from 'lit';
import { MediaStreamService, MediaStreamServiceEvents } from '../media-stream.service';

export class WebStreamController implements ReactiveController {

  get stream() {
    return this._stream;
  }

  constructor(private host: ReactiveControllerHost, private _stream: MediaStream) {

    host.addController(this);
  }

  hostConnected() {
    this._stream.addEventListener(MediaStreamServiceEvents.AddTrackJSEvent, () => {
      this.host.requestUpdate()
    });
  }
}
