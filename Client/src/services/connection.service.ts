import { ESocketEvents, ISocketMessage } from '../../../Shared';
import { ConnectionWrapper } from '../classes';
import socketConnectionService, { SocketConnectionService } from '../socket-connection';
import { User } from '../user';
import { MediaStreamService, mediaStreamService, MediaStreamServiceEvents } from './media-stream.service';

export enum EConnectionServiceEvents {
  PeerConnectionTrack = 'peerconnectiontrack',
  OfferAccepted = 'offeraccepted',
  PeerConnectionCreated = 'onpeeroconnectioncreated',
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
  private readonly _peers: Map<string, ConnectionWrapper> = new Map;
  private readonly _pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map;
  private _trackSenders: WeakMap<MediaStreamTrack, RTCRtpSender> = new WeakMap;
  private _currentUser: User;

  constructor(private _socketConnectionService: SocketConnectionService,
              private _mediaStreamService: MediaStreamService) {
    super();
  }

  init(user: User) {
    this._currentUser = user;

    this._socketConnectionService.on(ESocketEvents.Message, async (message: ISocketMessage) => {
      await this.handleSignalingData(message);
    });

    this._socketConnectionService.on(ESocketEvents.Joined, async (clientId: string) => {
      console.log(`User ${clientId} joined`);

      const pcWrapper = await this.createPeerConnection(clientId);

      await this.sendOffer(clientId);

      this.dispatchEvent(new CustomEvent(EConnectionServiceEvents.OfferAccepted, {
        detail: {
          pc: pcWrapper.pc,
          sendByClientId: clientId
        }
      }));
    });
  }

  createPeerConnection(clientId: string): ConnectionWrapper {
    if (this.getPCWrapper(clientId)) return this.getPCWrapper(clientId);

    console.log(`Creating Peer connection for ${clientId}`);

    const pc = new RTCPeerConnection(defaultPCConfiguration);

    // send any ice candidates to the other peer
    pc.onicecandidate = (e) => this.onICECandidate(e, clientId);
    pc.ontrack = (e) => this.onPeerConnectionTrack(e, clientId);
    pc.onicegatheringstatechange = () => this.handleICEGatheringStateChangeEvent(pc);
    pc.onnegotiationneeded = (ev) => this.onNegotiationNeeded(clientId, ev);
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce();
      }
    };
    pc.onsignalingstatechange = (ev) => {
      console.log(`*** PC for client ${clientId} Signaling state change to ${pc.signalingState}`);
    };

    this.connectToStream(pc);

    this.dispatchEvent(new CustomEvent(EConnectionServiceEvents.PeerConnectionCreated, {
      detail: {
        pc: pc,
        clientId
      }
    }));

    return this.setPC(clientId, pc);
  }

  private async onNegotiationNeeded(clientId: string, ev: Event) {
    const pcWrapper = this.getPCWrapper(clientId);

    console.log('*** Negotiation Needed', ev);

    try {
      pcWrapper.makingOffer = true;
      await this.setAndSendLocalDescription(clientId);
    } catch (err) {
      console.error(err);
    } finally {
      pcWrapper.makingOffer = false;
    }
  }

  private async sendOffer(clientId: string) {
    console.log(`Sending offer to ${clientId}`);

    const sdp = await this.getPC(clientId).createOffer();

    await this.setAndSendLocalDescription(clientId, sdp);
  }

  private async setAndSendLocalDescription(clientId: string, sessionDescription?: RTCSessionDescriptionInit) {
    const pc = this.getPC(clientId);

    await pc.setLocalDescription(sessionDescription);

    console.log(`Sending local description to ${clientId}`, sessionDescription);

    this._socketConnectionService.sendMessage({
      description: pc.localDescription
    }, clientId);
  }

  private async addPendingCandidates(clientId: string) {
    let candidate;
    while (candidate = (this._pendingCandidates[clientId] || []).shift())
      await this.getPC(clientId).addIceCandidate(new RTCIceCandidate(candidate))
  }

  private async handleSignalingData(message: ISocketMessage<{ type: string; description: RTCSessionDescription; candidate: RTCIceCandidate; }>) {
    const { sendByClientId, payload } = message;
    const { description, candidate } = payload;

    console.log(`Received ${description?.type || 'candidate'} from ${sendByClientId}`, payload);

    if (description) {
      const pcWrapper = await this.createPeerConnection(sendByClientId);
      // An offer may come in while we are busy processing SRD(answer).
      // In this case, we will be in "stable" by the time the offer is processed
      // so it is safe to chain it on our Operations Chain now.
      const readyForOffer =
        !pcWrapper.makingOffer &&
        (pcWrapper.pc.signalingState == 'stable' || pcWrapper.isSettingRemoteAnswerPending);
      pcWrapper.ignoreOffer = description.type == 'offer' && !readyForOffer;

      if (pcWrapper.ignoreOffer) {
        return;
      }

      pcWrapper.isSettingRemoteAnswerPending = description.type === 'answer';
      await pcWrapper.pc.setRemoteDescription(description);
      pcWrapper.isSettingRemoteAnswerPending = false;

      if (description.type == 'offer') {
        await this.setAndSendLocalDescription(sendByClientId);
      }
    } else if (candidate) {
      const pcWrapper = await this.createPeerConnection(sendByClientId);
      try {
        await pcWrapper.pc.addIceCandidate(candidate);
      } catch (err) {
        if (!pcWrapper.ignoreOffer) {
          throw err;
        }
      }
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

  private connectToStream(pc: RTCPeerConnection): void {
    const stream = this._currentUser.stream;
    // Push tracks from local stream to peer connection
    for (const track of stream.getTracks()) {
      const sender = pc.addTrack(track, stream);
      this._trackSenders.set(track, sender);
    }

    stream.addEventListener(MediaStreamServiceEvents.RemoveTrackJSEvent, (async (event: CustomEvent<{ track: MediaStreamTrack; }>) => {
      const { track } = event.detail;

      const fromSender = this._trackSenders.get(track);
      if (!fromSender) return;

      pc.removeTrack(fromSender);
    }) as any);

    stream.addEventListener(MediaStreamServiceEvents.AddTrackJSEvent, (async (event: CustomEvent<{ track: MediaStreamTrack; }>) => {
      const { track } = event.detail;

      const fromSender = this._trackSenders.get(track);
      if (fromSender) return;

      const sender = pc.addTrack(track, stream);

      this._trackSenders.set(track, sender);
    }) as any);

    stream.addEventListener(MediaStreamServiceEvents.ReplaceTrackJSEvent, (async (event: CustomEvent<{ from: MediaStreamTrack; to: MediaStreamTrack; }>) => {
      const { from, to } = event.detail;

      const fromSender = this._trackSenders.get(from);
      if (fromSender) {
        await fromSender.replaceTrack(to);

        this._trackSenders.set(to, fromSender);
      } else if (!this._trackSenders.get(to)) {
        const sender = pc.addTrack(to, stream);

        this._trackSenders.set(to, sender);
      } else {
        console.error(`Track ${from} not found`)
      }
    }) as any);
  }

  private handleICEGatheringStateChangeEvent(pc: RTCPeerConnection) {
    console.log('*** ICE gathering state changed to: ' + pc.iceGatheringState);
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

  private setPC(clientID: string, pc: RTCPeerConnection): ConnectionWrapper {
    const pcWrapper = new ConnectionWrapper(clientID, pc);

    this._peers.set(clientID, pcWrapper);

    return pcWrapper;
  }

  private getPC(clientID: string): RTCPeerConnection | undefined {
    return this._peers.get(clientID).pc;
  }

  private getPCWrapper(clientID: string): ConnectionWrapper | undefined {
    return this._peers.get(clientID);
  }
}

export const connectionService = new ConnectionService(socketConnectionService, mediaStreamService);
