import { io } from 'socket.io-client';
export const socket = io();


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
