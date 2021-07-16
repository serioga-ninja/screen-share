export interface ISocketMessage<T = any> {
  sendByClientId: string;
  sendToClientId?: string;
  roomId: string;
  payload: T;
}

export interface IJoinedToRoom {

}
