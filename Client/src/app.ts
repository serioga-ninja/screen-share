import { Subject } from 'rxjs';
import { ESocketEvents, randomToken } from '../../Shared';
import {
  ConnectionService,
  connectionService,
  EConnectionServiceEvents,
  MediaStreamService,
  mediaStreamService
} from './services';
import { MainScreenLogic } from './services/main-screen-logic';
import socketConnectionService, { SocketConnectionService } from './socket-connection';
import { User } from './user';
import { UsersCollection } from './users-collection';

export enum EAppEvents {
  UserLeft = 'userleft',
}

export class App extends EventTarget {
  readonly users: UsersCollection = new UsersCollection();
  mainScreenLogic: MainScreenLogic;

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

    this.mainScreenLogic = new MainScreenLogic(this.users);
  }

  async init() {
    const userId = await this._socketConnectionService.init(this._roomId);

    const currentUser = new User(mediaStreamService.stream, {
      roomID: this._roomId,
      userID: userId,
      currentUser: true
    });

    this.users.set(userId, currentUser);

    this._connectionService.init(currentUser);

    this._connectionService.addEventListener(EConnectionServiceEvents.PeerConnectionCreated, ((event: CustomEvent<{ pc: RTCPeerConnection, clientId: string; }>) => {
      const { pc, clientId } = event.detail;

      const user = new User(new MediaStream, { roomID: this._roomId, userID: clientId });

      this.users.set(clientId, user);

      user.setPeerConnection(pc);
    }) as EventListener)

    this._socketConnectionService.on(ESocketEvents.Bye, ({ id }) => {
      console.log(`Client ${id} leaving room.`);

      const user = this.users.get(id);

      if (!user) return;

      this.dispatchEvent(new CustomEvent(EAppEvents.UserLeft, {
        detail: {
          user
        }
      }));

      user.pc?.close();

      this.users.delete(id);
    });
  }
}

const app = new App(socketConnectionService, connectionService, mediaStreamService);

export default app;
