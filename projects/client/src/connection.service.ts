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
  private readonly _peers: Record<string, RTCPeerConnection>;
  private readonly _pendingCandidates: Record<string, any[]>;

  get peers() {
    return this._peers;
  }

  constructor(private _socket: Socket, private _webCamService: WebCamService) {
    super();

    this._pendingCandidates = {};
    this._peers = {};
  }

  hasPeerWithClient(clientId: string): boolean {
    return clientId in this._peers;
  }

  hasPendingCandidate(clientId: string): boolean {
    return clientId in this._pendingCandidates;
  }

  resetPendingCandidates(clientId: string) {
    this._pendingCandidates[clientId] = [];
  }

  addToPendingCandidates(clientId: string, candidate) {
    this._pendingCandidates[clientId].push(candidate);
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

  setRemoteDescription(clientId: string, payload): Promise<void> {
    return this._peers[clientId].setRemoteDescription(
      new RTCSessionDescription(payload)
    );
  }

  async createPeerConnectionForSID(clientId: string): Promise<RTCPeerConnection> {
    this._peers[clientId] = this.createPeerConnection(clientId);

    return this._peers[clientId];
  }

  async sendOffer(clientId: string) {
    console.log(`Sending offer to ${clientId}`);

    const sdp = await this._peers[clientId].createOffer();

    await this.setAndSendLocalDescription(clientId, sdp);
  }

  async sendAnswer(clientId: string) {
    return this._peers[clientId].createAnswer();
  };

  async setAndSendLocalDescription(clientId: string, sessionDescription: RTCSessionDescriptionInit) {
    await this._peers[clientId].setLocalDescription(sessionDescription);

    console.log(`Sending ${sessionDescription.type} to ${clientId}`, sessionDescription);

    sendMessage({ type: sessionDescription.type, sdp: sessionDescription.sdp }, clientId);
  }

  addIceCandidate(clientId: string, payload) {
    return this.peers[clientId].addIceCandidate(new RTCIceCandidate(payload.candidate));
  }

  addPendingCandidates(clientId: string) {
    if (clientId in this._pendingCandidates) {
      this._pendingCandidates[clientId].forEach(candidate => {
        this._peers[clientId].addIceCandidate(new RTCIceCandidate(candidate))
      });
    }
  }

  private onICECandidate(event: RTCPeerConnectionIceEvent, clientId: string) {
    if (event.candidate) {
      console.log(`Sending candidate to ${clientId}`, event.candidate);

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
