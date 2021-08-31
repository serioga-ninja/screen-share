import { ESocketEvents, ISocketMessage } from '../../../Shared';
import socketConnectionService, { SocketConnectionService } from '../socket-connection';
import { MediaStreamService, mediaStreamService, MediaStreamServiceEvents } from './media-stream.service';

export enum EConnectionServiceEvents {
  PeerConnectionTrack = 'peerconnectiontrack',
  OfferAccepted = 'offeraccepted',
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
  private readonly _pendingCandidates: Record<string, RTCIceCandidateInit[]>;
  private _trackSenders: WeakMap<MediaStreamTrack, RTCRtpSender> = new WeakMap;

  get peers() {
    return this._peers;
  }

  constructor(private _socketConnectionService: SocketConnectionService,
              private _mediaStreamService: MediaStreamService) {
    super();

    this._pendingCandidates = {};
    this._peers = {};
  }

  init() {
    this._socketConnectionService.on(ESocketEvents.Message, async (message: ISocketMessage) => {
      await this.handleSignalingData(message);
    });

    this._socketConnectionService.on(ESocketEvents.Joined, async (clientId: string) => {
      console.log(`User ${clientId} joined`);

      const pc = await this.createPeerConnection(clientId);

      await this.sendOffer(clientId);

      this.dispatchEvent(new CustomEvent(EConnectionServiceEvents.OfferAccepted, {
        detail: {
          pc: pc,
          sendByClientId: clientId
        }
      }));
    });
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

  addToPendingCandidates(clientId: string, candidate: RTCIceCandidateInit) {
    this._pendingCandidates[clientId].push(candidate);
  }

  createPeerConnection(clientId: string): RTCPeerConnection {
    if (this._peers[clientId]) return this._peers[clientId];

    console.log(`Creating Peer connection for ${clientId}`);

    const pc = new RTCPeerConnection(defaultPCConfiguration);

    // send any ice candidates to the other peer
    pc.onicecandidate = (e) => this.onICECandidate(e, clientId);
    pc.ontrack = (e) => this.onPeerConnectionTrack(e, clientId);
    // pc.onnegotiationneeded = () => this.handleNegotiationNeededEvent(clientId);
    pc.onicegatheringstatechange = () => this.handleICEGatheringStateChangeEvent(pc);

    this.connectToStream(this._mediaStreamService.stream, pc);

    return this._peers[clientId] = pc;
  }

  setRemoteDescription(clientId: string, payload: any): Promise<void> {
    return this._peers[clientId].setRemoteDescription(
      new RTCSessionDescription(payload)
    );
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

    this._socketConnectionService.sendMessage({ type: sessionDescription.type, sdp: sessionDescription.sdp }, clientId);
  }

  addIceCandidate(clientId: string, candidate: RTCIceCandidateInit) {
    return this.peers[clientId].addIceCandidate(new RTCIceCandidate(candidate));
  }

  async addPendingCandidates(clientId: string) {
    if (clientId in this._pendingCandidates) {
      for await (const candidate of this._pendingCandidates[clientId]) {
        await this._peers[clientId].addIceCandidate(new RTCIceCandidate(candidate))
      }
    }
  }

  private async handleSignalingData(message: ISocketMessage) {
    const { sendByClientId, payload } = message;

    console.log(`Received ${payload.type} from ${sendByClientId}`);

    switch (payload.type) {
      case 'offer':
        const pc = await this.createPeerConnection(sendByClientId);

        await this.setRemoteDescription(sendByClientId, payload);

        const sdp = await this.sendAnswer(sendByClientId);

        await this.setAndSendLocalDescription(sendByClientId, sdp);

        await this.addPendingCandidates(sendByClientId);

        this.dispatchEvent(new CustomEvent(EConnectionServiceEvents.OfferAccepted, {
          detail: {
            pc: pc,
            sendByClientId
          }
        }));
        break;
      case 'answer':
        await this.setRemoteDescription(
          sendByClientId,
          new RTCSessionDescription(payload)
        );
        break;
      case 'candidate':
        if (this.hasPeerWithClient(sendByClientId)) {
          await this.addIceCandidate(sendByClientId, payload.candidate);
        } else {
          if (!this.hasPendingCandidate(sendByClientId)) {
            this.resetPendingCandidates(sendByClientId);
          }
          this.addToPendingCandidates(sendByClientId, payload.candidate)
        }
        break;
    }
  }

  private onICECandidate(event: RTCPeerConnectionIceEvent, clientId: string) {
    if (event.candidate) {
      console.log(`Sending candidate to ${clientId}`);

      this._socketConnectionService.sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate
      }, clientId);
    } else {
      console.log('End of candidates.');
    }
  }

  private connectToStream(stream: MediaStream, pc: RTCPeerConnection): void {
    // Push tracks from local stream to peer connection
    for (const track of stream.getTracks()) {
      const sender = pc.addTrack(track, stream);
      this._trackSenders.set(track, sender);
    }

    stream.addEventListener(MediaStreamServiceEvents.AddTrackJSEvent, ((event: CustomEvent<{ tracks: MediaStreamTrack[]; }>) => {
      const { tracks } = event.detail;

      for (const track of tracks) {
        const sender = pc.addTrack(track, stream);

        this._trackSenders.set(track, sender);
      }
    }) as EventListener);

    stream.addEventListener(MediaStreamServiceEvents.ReplaceTrackJSEvent, ((event: CustomEvent<{ from: MediaStreamTrack; to: MediaStreamTrack; }>) => {
      const { from, to } = event.detail;

      const fromSender = this._trackSenders.get(from);
      if (fromSender) {
        fromSender.replaceTrack(to);
        this._trackSenders.set(to, fromSender);
      }
    }) as EventListener);
  }

  private handleICEGatheringStateChangeEvent(pc: RTCPeerConnection) {
    console.log('*** ICE gathering state changed to: ' + pc.iceGatheringState);
  }

  // Called by the WebRTC layer to let us know when it's time to
  // begin, resume, or restart ICE negotiation.
  private async handleNegotiationNeededEvent(clientId: string) {
    console.log('*** Negotiation needed');

    try {
      console.log('---> Creating offer');
      await this.sendOffer(clientId);
    } catch (err) {
      console.log('*** The following error occurred while handling the negotiationneeded event:');
    }
  }

  private onPeerConnectionTrack(event: RTCTrackEvent, clientId: string) {
    console.log(`*** Peer connection ${clientId} received new track`);

    this.dispatchEvent(new CustomEvent(EConnectionServiceEvents.PeerConnectionTrack, {
      detail: {
        clientId,
        onTrackEvent: event
      }
    }));
  }
}

export const connectionService = new ConnectionService(socketConnectionService, mediaStreamService);
