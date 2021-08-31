import { ReactiveController, ReactiveControllerHost } from 'lit';
import { App, EAppEvents } from '../app';
import { ConnectionService, EConnectionServiceEvents } from '../services/connection.service';
import { mediaStreamService } from '../services/media-stream.service';

export class ScreenShareController implements ReactiveController {
  stream?: MediaStream;
  remoteStreams: Map<string, MediaStream> = new Map();

  constructor(private host: ReactiveControllerHost, private app: App, private connectionService: ConnectionService) {
    this.stream = mediaStreamService.stream;

    host.addController(this);
  }

  hostConnected() {
    this.connectionService.addEventListener(EConnectionServiceEvents.PeerConnectionTrack, ((event: CustomEvent<{ clientId: string; onTrackEvent: RTCTrackEvent; }>) => {
      const { onTrackEvent, clientId } = event.detail;

      let stream = this.remoteStreams.get(clientId);

      if (!stream) {
        stream = new MediaStream();
        this.remoteStreams.set(clientId, stream);

        this.host.requestUpdate();
      }

      onTrackEvent.streams[0].getTracks().forEach((track: MediaStreamTrack) => {
        stream.addTrack(track);
      });
    }) as EventListener);


    this.app.addEventListener(EAppEvents.UserLeft, (event: any) => {
      const { clientId } = event.detail;

      this.remoteStreams.delete(clientId);
      this.host.requestUpdate();
    });
  }
}
