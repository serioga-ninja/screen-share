import { Socket } from 'socket.io-client/build/socket';
import { connectionService, ConnectionService, EConnectionServiceEvents } from './connection.service';
import { ISocketMessage } from './core/all';
import { socket } from './socket-connection';
import { mediaStreamService, MediaStreamService, MediaStreamServiceEvents } from './media-stream.service';

export enum EAppEvents {
  OfferAccepted = 'offeraccepted',
  UserLeft = 'userleft',
}

export class App extends EventTarget {
  constructor(private _socket: Socket,
              private _webCamService: MediaStreamService,
              private _connectionService: ConnectionService) {
    super();

    _socket.on('message', async (message: ISocketMessage) => {
      await this.handleSignalingData(message);
    });

    _socket.on('joined', async (clientId: string) => {
      console.log(`User ${clientId} joined`);

      const pc = await _connectionService.createPeerConnection(
        clientId,
        {
          ontrack: (event: RTCTrackEvent) => this.onPeerConnectionTrack(clientId, event)
        }
      );

      await connectionService.sendOffer(clientId);

      this.dispatchEvent(new CustomEvent(EAppEvents.OfferAccepted, {
        detail: {
          pc: pc,
          sendByClientId: clientId
        }
      }));
    });


    _socket.on('bye', ({ id }) => {
      console.log(`Client ${id} leaving room.`);

      this.dispatchEvent(new CustomEvent(EAppEvents.UserLeft, {
        detail: {
          clientId: id
        }
      }));
    });
  }

  private async handleSignalingData(message: ISocketMessage) {
    const { sendByClientId, payload } = message;

    console.log(`Received ${payload.type} from ${sendByClientId}`);

    switch (payload.type) {
      case 'offer':
        await this._webCamService.useWebCamVideo();

        const pc = await this._connectionService.createPeerConnection(
          sendByClientId,
          {
            ontrack: (event: RTCTrackEvent) => this.onPeerConnectionTrack(sendByClientId, event)
          }
        );

        await this._connectionService.setRemoteDescription(sendByClientId, payload);

        const sdp = await this._connectionService.sendAnswer(sendByClientId);

        await this._connectionService.setAndSendLocalDescription(sendByClientId, sdp);

        await this._connectionService.addPendingCandidates(sendByClientId);

        this.dispatchEvent(new CustomEvent(EAppEvents.OfferAccepted, {
          detail: {
            pc: pc,
            sendByClientId
          }
        }));
        break;
      case 'answer':
        await this._connectionService.setRemoteDescription(
          sendByClientId,
          new RTCSessionDescription(payload)
        );
        break;
      case 'candidate':
        if (this._connectionService.hasPeerWithClient(sendByClientId)) {
          await this._connectionService.addIceCandidate(sendByClientId, payload.candidate);
        } else {
          if (!this._connectionService.hasPendingCandidate(sendByClientId)) {
            this._connectionService.resetPendingCandidates(sendByClientId);
          }
          this._connectionService.addToPendingCandidates(sendByClientId, payload.candidate)
        }
        break;
    }
  }

  private onPeerConnectionTrack(clientId: string, event: RTCTrackEvent) {
    console.log(`*** Peer connection ${clientId} received new track`);

    this.dispatchEvent(new CustomEvent(EConnectionServiceEvents.PeerConnectionTrack, {
      detail: {
        clientId,
        onTrackEvent: event
      }
    }));
  }

}
