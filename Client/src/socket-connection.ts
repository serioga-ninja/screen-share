import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client/build/socket';
import { ESocketEvents } from '../../Shared';


export class SocketConnectionService {
  private _myId: string;
  private _roomId: string;
  private _socket: Socket;

  constructor() {
    this._socket = io();
  }

  init(roomId: string): Promise<string> {
    return new Promise<string>(resolve => {
      this._roomId = roomId;

      // Leaving rooms and disconnecting from peers.
      this._socket.on(ESocketEvents.Disconnect, function (reason) {
        console.log(`Disconnected: ${reason}.`);
      });

      this._socket.on(ESocketEvents.Ipaddr, function (ipaddr) {
        console.log('Server IP address is: ' + ipaddr);
      });

      this._socket.on(ESocketEvents.Hello, (mySocketId: string) => {
        console.log(`Connected to server. Your ID is "${mySocketId}"`);

        this._myId = mySocketId;

        resolve(this._myId);
      });

      if (location.hostname.match(/localhost|127\.0\.0/)) {
        this._socket.emit(ESocketEvents.Ipaddr);
      }

      window.addEventListener(ESocketEvents.Unload, () => {
        console.log(`Unloading window. Notifying peers in ${roomId}.`);

        this._socket.emit(ESocketEvents.Bye, roomId);
      });

      // Joining a room.
      this._socket.emit(ESocketEvents.CreateOrJoin, roomId);
    });
  }

  sendMessage(message: Record<string, unknown>, toClientId?: string) {
    this.emit(ESocketEvents.Message, {
      roomId: this._roomId,
      payload: message,
      sendByClientId: this._myId,
      sendToClientId: toClientId
    })
  }

  emit(ev: ESocketEvents, body?: any) {
    this._socket.emit(ev, body);
  }

  on(ev: ESocketEvents, cb: any) {
    this._socket.on(ev, (...args) => {
      cb(...args);
    });
  }
}

const socketConnectionService = new SocketConnectionService();

export default socketConnectionService;
