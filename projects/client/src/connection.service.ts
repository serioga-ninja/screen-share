import { Socket } from 'socket.io-client';
import { ISocketMessage } from '../../shared/interfaces/all';
import { sendMessage } from './index';
import { socket } from './socket-connection';
import { WebCamService, webCamService } from './web-cam.service';

export enum EConnectionServiceEvents {
  AddStream = 'addstream',
  PeerConnectionCreated = 'peerconnectioncreated',
}

const defaultPCConfiguration = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export class ConnectionService extends EventTarget {
  private readonly peers: Record<string, RTCPeerConnection>;
  private readonly pendingCandidates: Record<string, any[]>;

  constructor(private _socket: Socket, private _webCamService: WebCamService) {
    super();

    this.pendingCandidates = {};
    this.peers = {};
  }

  createPeerConnection(clientId: string): RTCPeerConnection {
    console.log(`Creating Peer connection for ${clientId}`);

    const pc = new RTCPeerConnection(defaultPCConfiguration);

    // send any ice candidates to the other peer
    pc.onicecandidate = (e) => this.onICECandidate(e, clientId);

    this.dispatchEvent(new CustomEvent(EConnectionServiceEvents.PeerConnectionCreated, {
      detail: {
        pc: pc,
        clientId
      }
    }));

    return pc;
  }

  async createPeerConnectionForSID(clientId: string): Promise<RTCPeerConnection> {
    this.peers[clientId] = this.createPeerConnection(clientId);

    return this.peers[clientId];
  }

  async sendOffer(clientId: string) {
    console.log(`Sending offer to ${clientId}`);

    const sdp = await this.peers[clientId].createOffer();

    await this.setAndSendLocalDescription(clientId, sdp);
  }

  async handleSignalingData(message: ISocketMessage) {
    const { sendByClientId, payload } = message;

    console.log(`Received ${payload.type} from ${sendByClientId}`);

    switch (payload.type) {
      case 'offer':
        await this.createPeerConnectionForSID(sendByClientId);

        await this.peers[sendByClientId].setRemoteDescription(
          new RTCSessionDescription(payload)
        );

        await this._webCamService.start();

        // Push tracks from local stream to peer connection
        this._webCamService.stream?.getTracks().forEach((track) => {
          this.peers[sendByClientId].addTrack(track, this._webCamService.stream);
        });

        // TODO: apply media streams to the video elements

        await this.sendAnswer(sendByClientId);

        this.addPendingCandidates(sendByClientId);
        break;
      case 'answer':
        await this.peers[sendByClientId].setRemoteDescription(
          new RTCSessionDescription(payload)
        );
        break;
      case 'candidate':
        if (sendByClientId in this.peers) {
          await this.peers[sendByClientId].addIceCandidate(new RTCIceCandidate(payload.candidate));
        } else {
          if (!(sendByClientId in this.pendingCandidates)) {
            this.pendingCandidates[sendByClientId] = [];
          }
          this.pendingCandidates[sendByClientId].push(payload.candidate)
        }
        break;
    }
  }

  private async sendAnswer(clientId: string) {
    const sdp = await this.peers[clientId].createAnswer();
    await this.setAndSendLocalDescription(clientId, sdp);
  };

  private async setAndSendLocalDescription(clientId: string, sessionDescription: RTCSessionDescriptionInit) {
    await this.peers[clientId].setLocalDescription(sessionDescription);

    console.log(`Sending ${sessionDescription.type} to ${clientId}`, sessionDescription);

    sendMessage({ type: sessionDescription.type, sdp: sessionDescription.sdp }, clientId);
  }

  addPendingCandidates(clientId: string) {
    if (clientId in this.pendingCandidates) {
      this.pendingCandidates[clientId].forEach(candidate => {
        this.peers[clientId].addIceCandidate(new RTCIceCandidate(candidate))
      });
    }
  }

  private onICECandidate(event: RTCPeerConnectionIceEvent, clientId: string) {
    console.log('icecandidate event:', event);

    if (event.candidate) {
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate
      }, clientId);
    } else {
      console.log('End of candidates.');
    }
  }
}

export const connectionService = new ConnectionService(socket, webCamService);
