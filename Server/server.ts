import os from 'os';
import nodeStatic from 'node-static';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { ESocketEvents } from '../Shared';
import { ISocketMessage } from '../Shared/core/all';
import 'dotenv';

const fileServer = new nodeStatic.Server(path.resolve(process.cwd(), 'dist', 'public'));
const port = process.env.PORT || 8080;

const app = http.createServer(function (req, res) {
  fileServer.serve(req, res);
}).listen(port, () => {
  console.log('HTTPS server ready on ' + port);
});


const io = new Server(app, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.sockets.on('connection', function (socket) {

  // convenience function to log server messages on the client
  function log(...args: string[]) {
    const array = ['Message from server:'];
    array.push.apply(array, args);
    socket.emit('log', array);
  }

  socket.on(ESocketEvents.Message, function (message: ISocketMessage) {
    if (message.sendToClientId) {
      io.to(message.sendToClientId).emit('message', message);
    } else {
      io.sockets.in(message.roomId).emit('message', message);
    }
  });

  socket.on(ESocketEvents.CreateOrJoin, function (room) {
    console.log('Received request to create or join room ' + room);

    const clientsInRoom = io.sockets.adapter.rooms.get(room);
    const numClients = (clientsInRoom?.size || 0) + 1;

    console.log('Client ID ' + socket.id + ' joined room ' + room);

    socket.join(room);

    console.log('Room ' + room + ' now has ' + numClients + ' client(s)');

    io.sockets
      .in(room)
      .except(socket.id)
      .emit(ESocketEvents.Joined, socket.id);

    socket.emit(ESocketEvents.Hello, socket.id);
  });

  socket.on(ESocketEvents.Ipaddr, function () {
    const ifaces = os.networkInterfaces();

    for (let dev in ifaces) {
      ifaces[dev]?.forEach(function (details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit(ESocketEvents.Ipaddr, details.address);
        }
      });
    }
  });

  socket.on(ESocketEvents.Disconnect, function (reason) {
    console.log(`Peer or server disconnected. Reason: ${reason}.`);
    socket.broadcast.emit('bye', { id: socket.id });
  });

  socket.on(ESocketEvents.Bye, function (room) {
    console.log(`Peer said bye on room ${room}.`);
  });
});
