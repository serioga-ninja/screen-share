import { Socket } from 'socket.io-client/build/socket';
import { ISocketMessage } from '../../shared/interfaces/all';
import { connectionService, ConnectionService, EConnectionServiceEvents } from './connection.service';
import { socket } from './socket-connection';
import { webCamService, WebCamService } from './web-cam.service';

export enum EAppEvents {
  OfferAccepted = 'offeraccepted',
  UserLeft = 'userleft',
}

export class App extends EventTarget {
  constructor(private _socket: Socket,
              private _webCamService: WebCamService,
              private _connectionService: ConnectionService) {
    super();

    _socket.on('message', async (message: ISocketMessage) => {
      await this.handleSignalingData(message);
    });

    _socket.on('joined', async (clientId: string) => {
      console.log(`User ${clientId} joined`);

      const pc = await _connectionService.createPeerConnectionForSID(clientId);

      await this.addTracksToPeerConnection(pc);

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
        const pc = await this._connectionService.createPeerConnectionForSID(sendByClientId);

        this.dispatchEvent(new CustomEvent(EAppEvents.OfferAccepted, {
          detail: {
            pc: pc,
            sendByClientId
          }
        }));

        await this._connectionService.setRemoteDescription(sendByClientId, payload);
        await this.addTracksToPeerConnection(pc);

        const sdp = await this._connectionService.sendAnswer(sendByClientId);

        await this._connectionService.setAndSendLocalDescription(sendByClientId, sdp);

        this._connectionService.addPendingCandidates(sendByClientId);
        break;
      case 'answer':
        await this._connectionService.setRemoteDescription(
          sendByClientId,
          new RTCSessionDescription(payload)
        );
        break;
      case 'candidate':
        if (this._connectionService.hasPeerWithClient(sendByClientId)) {
          await this._connectionService.addIceCandidate(sendByClientId, payload);
        } else {
          if (!this._connectionService.hasPendingCandidate(sendByClientId)) {
            this._connectionService.resetPendingCandidates(sendByClientId);
          }
          this._connectionService.addToPendingCandidates(sendByClientId, payload.candidate)
        }
        break;
    }
  }

  async addTracksToPeerConnection(pc: RTCPeerConnection) {
    await this._webCamService.start();

    // Push tracks from local stream to peer connection
    this._webCamService.stream?.getTracks().forEach((track) => {
      pc.addTrack(track, this._webCamService.stream);
    });
  }

}
