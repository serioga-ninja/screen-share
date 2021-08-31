import { ESocketEvents, randomToken } from '../../Shared';
import { ConnectionService, connectionService, MediaStreamService, mediaStreamService } from './services';
import socketConnectionService, { SocketConnectionService } from './socket-connection';

export enum EAppEvents {
  UserLeft = 'userleft',
}

export class App extends EventTarget {
  private readonly _roomId: string;

  constructor(private _socketConnectionService: SocketConnectionService,
              private _connectionService: ConnectionService,
              private _mediaStreamService: MediaStreamService) {
    super();

    // Create a random room if not already present in the URL.
    this._roomId = window.location.hash.substring(1);
    if (!this._roomId) {
      this._roomId = window.location.hash = randomToken();
    }
  }

  async init() {
    await mediaStreamService.useWebCamVideo();

    this._socketConnectionService.init(this._roomId);
    this._connectionService.init();

    this._socketConnectionService.on(ESocketEvents.Bye, ({ id }) => {
      console.log(`Client ${id} leaving room.`);

      this.dispatchEvent(new CustomEvent(EAppEvents.UserLeft, {
        detail: {
          clientId: id
        }
      }));
    });
  }
}

const app = new App(socketConnectionService, connectionService, mediaStreamService);

export default app;
