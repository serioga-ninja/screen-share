import { Socket } from 'socket.io-client';
import { sendMessage } from './index';
import { socket } from './socket-connection';

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

  constructor(private _socket: Socket) {
    super();

    this.pendingCandidates = {};
    this.peers = {};
  }

  createPeerConnection(): RTCPeerConnection {
    console.log('Creating Peer connection');
    const pc = new RTCPeerConnection(defaultPCConfiguration);

    // send any ice candidates to the other peer
    pc.onicecandidate = this.onICECandidate.bind(this);
    // pc.addStream(localStream);

    this.dispatchEvent(new CustomEvent(EConnectionServiceEvents.PeerConnectionCreated, {
      detail: {
        pc: pc
      }
    }));

    return pc;
  }

  async createPeerConnectionForSID(roomId: string): Promise<RTCPeerConnection> {
    this.peers[roomId] = this.createPeerConnection();

    return this.peers[roomId];
  }

  async sendOffer(roomId: string) {
    console.log('Send offer');

    const sdp = await this.peers[roomId].createOffer();

    await this.setAndSendLocalDescription(roomId, sdp);
  }

  async handleSignalingData(message) {
    const roomId = message.roomId;

    delete message.roomId;

    console.log('handleSignalingData', message);
    switch (message.type) {
      case 'offer':
        await this.peers[roomId].setRemoteDescription(
          new RTCSessionDescription(message)
        );

        await this.sendAnswer(roomId);

        this.addPendingCandidates(roomId);
        break;
      case 'answer':
        await this.peers[roomId].setRemoteDescription(new RTCSessionDescription(message));
        break;
      case 'candidate':
        if (roomId in this.peers) {
          await this.peers[roomId].addIceCandidate(new RTCIceCandidate(message.candidate));
        } else {
          if (!(roomId in this.pendingCandidates)) {
            this.pendingCandidates[roomId] = [];
          }
          this.pendingCandidates[roomId].push(message.candidate)
        }
        break;
    }
  }

  private async sendAnswer(roomId: string) {
    console.log('Send answer');

    const sdp = await this.peers[roomId].createAnswer();
    await this.setAndSendLocalDescription(roomId, sdp);
  };

  private async setAndSendLocalDescription(roomId: string, sessionDescription: RTCSessionDescriptionInit) {
    await this.peers[roomId].setLocalDescription(sessionDescription);
    console.log('Local description set', sessionDescription);
    sendMessage({ roomId, type: sessionDescription.type, sdp: sessionDescription.sdp });
  }

  addPendingCandidates(roomId: string) {
    if (roomId in this.pendingCandidates) {
      this.pendingCandidates[roomId].forEach(candidate => {
        this.peers[roomId].addIceCandidate(new RTCIceCandidate(candidate))
      });
    }
  }

  private onICECandidate(event: RTCPeerConnectionIceEvent) {
    console.log('icecandidate event:', event);

    if (event.candidate) {
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate
      });
    } else {
      console.log('End of candidates.');
    }
  }
}

export const connectionService = new ConnectionService(socket);
