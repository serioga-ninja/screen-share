import express from 'express';
import { createReadStream, createWriteStream, statSync } from 'fs';
import { stat } from 'fs/promises';
import http from 'http';
import * as path from 'path';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
server.keepAliveTimeout = 60000 * 2;
const io = new Server(server);

const fileId = 'test';

app.get('/video/:id', (req, res) => {
  res.set('Content-Type', 'text/html');
  res.send(`
    <video controls muted autoPlay style="width: 100%; height: 100%">
        <source src="http://localhost:3000/stream/${req.params.id}" type="video/webm">
    </video>
  `);
});

app.get('/stream/:id', async (req, res) => {
  const videoPath = `videos/${req.params.id}.webm`;
  const videoStat = await stat(
    path.resolve(__dirname, 'videos', `1620812253337.webm`)
  );
  const fileSize = videoStat.size;
  const videoRange = req.headers.range;
  if (videoRange) {
    const parts = videoRange.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1]
      ? parseInt(parts[1], 10)
      : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/webm',
    };

    res.writeHead(206, head);

    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/webm',
    };

    res.writeHead(200, head);

    createReadStream(videoPath).pipe(res);
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');

  const filePath = path.resolve(__dirname, 'videos', `${fileId}.webm`);
  console.log('filePath', filePath);

  const ws = createWriteStream(
    filePath
  );

  socket.on('video-data', (data) => {
    ws.write(data);
  });

  socket.on('disconnect', (reason) => {
    ws.close();
  });

  socket.emit('hi', {
    filePath: `http://localhost:3000/stream/${fileId}`
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
