import os from 'os';
import nodeStatic from 'node-static';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { IJoinedToRoom, ISocketMessage } from '../shared/interfaces/all';

const fileServer = new nodeStatic.Server(path.resolve(process.cwd(), '..', 'client', 'dist'));
const app = http.createServer(function (req, res) {
  fileServer.serve(req, res);
}).listen(8080);

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

  socket.on('message', function (message: ISocketMessage) {
    if (message.sendToClientId) {
      io.to(message.sendToClientId).emit('message', message);
    } else {
      io.sockets.in(message.roomId).emit('message', message);
    }
  });

  socket.on('create or join', function (room) {
    log('Received request to create or join room ' + room);

    const clientsInRoom = io.sockets.adapter.rooms.get(room);
    const numClients = clientsInRoom?.size || 0;

    log('Room ' + room + ' now has ' + numClients + ' client(s)');

    if (numClients === 0) {
      socket.join(room);
      log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', socket.id);
    } else {
      log('Client ID ' + socket.id + ' joined room ' + room);

      socket.join(room);

      io.sockets
        .in(room)
        .except(socket.id)
        .emit('joined', socket.id);

      socket.emit('joined to room');
    }

    socket.emit('hello', socket.id);
  });

  socket.on('ipaddr', function () {
    const ifaces = os.networkInterfaces();
    for (let dev in ifaces) {
      ifaces[dev]?.forEach(function (details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

  socket.on('disconnect', function (reason) {
    console.log(`Peer or server disconnected. Reason: ${reason}.`);
    socket.broadcast.emit('bye');
  });

  socket.on('bye', function (room) {
    console.log(`Peer said bye on room ${room}.`);
  });
});
