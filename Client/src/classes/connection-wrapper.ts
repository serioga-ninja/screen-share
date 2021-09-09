export class ConnectionWrapper {
  public makingOffer = false;
  public ignoreOffer = false;
  public isSettingRemoteAnswerPending  = false;

  constructor(public readonly clientId: string,
              public readonly pc: RTCPeerConnection) {

  }
}
