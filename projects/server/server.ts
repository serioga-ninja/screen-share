import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('video-data', (data) => {
    console.log('video-data', data);
  });

  socket.emit('hi', '1');
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
