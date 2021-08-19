import { ReactiveController, ReactiveControllerHost } from 'lit';
import { App, EAppEvents } from '../app';
import { EConnectionServiceEvents } from '../connection.service';
import { webCamService } from '../web-cam.service';

export class ScreenShareController implements ReactiveController {
  stream?: MediaStream;
  remoteStreams: Map<string, MediaStream> = new Map();

  constructor(private host: ReactiveControllerHost, private app: App) {

    host.addController(this);
  }

  hostConnected() {
    this.app.addEventListener(EAppEvents.OfferAccepted, async (event: any) => {
      const { pc, sendByClientId } = event.detail;

      await webCamService.start();

      this.stream = webCamService.stream;
      this.host.requestUpdate();
    });

    this.app.addEventListener(EConnectionServiceEvents.PeerConnectionTrack, ((event: CustomEvent<{ clientId: string; onTrackEvent: RTCTrackEvent; }>) => {
      console.log('EConnectionServiceEvents.PeerConnectionTrack', event.detail);

      const { onTrackEvent, clientId } = event.detail;

      const remoteStream = new MediaStream();

      this.remoteStreams.set(clientId, remoteStream);

      onTrackEvent.streams[0].getTracks().forEach((track: MediaStreamTrack) => {
        remoteStream.addTrack(track);
      });

      this.host.requestUpdate();
    }) as EventListener);


    this.app.addEventListener(EAppEvents.UserLeft, (event: any) => {
      const { clientId } = event.detail;

      this.remoteStreams.delete(clientId);
      this.host.requestUpdate();
    });
  }
}
