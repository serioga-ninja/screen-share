import { io } from 'socket.io-client';
import { ISocketMessage } from '../../shared/interfaces/all';
import { connectionService } from './connection.service';

export const socket = io('ws://192.168.2.11:8080');


// Leaving rooms and disconnecting from peers.
socket.on('disconnect', function (reason) {
  console.log(`Disconnected: ${reason}.`);
});

socket.on('ipaddr', function (ipaddr) {
  console.log('Server IP address is: ' + ipaddr);
});

socket.on('created', async function (clientId: string) {
  console.log('Created room - my client ID is ', clientId);
});
