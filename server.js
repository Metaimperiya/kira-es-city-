const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

const players = {};

wss.on('connection', (ws) => {
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);

  players[id] = {
    x: (Math.random() - 0.5) * 10,
    y: 1.5,
    z: (Math.random() - 0.5) * 10,
    color: Math.floor(Math.random() * 0xffffff),
    name: 'Игрок_' + Math.random().toString(36).substr(2, 4)
  };

  ws.send(JSON.stringify({
    type: 'init',
    players: players,
    myId: id
  }));

  broadcast({
    type: 'playerJoin',
    id: id,
    x: players[id].x,
    y: players[id].y,
    z: players[id].z,
    color: players[id].color,
    name: players[id].name
  }, ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'move' && players[id]) {
        players[id].x = data.x;
        players[id].y = data.y;
        players[id].z = data.z;
        players[id].rotation = data.rotation || 0;

        broadcast({
          type: 'playerMove',
          id: id,
          x: data.x,
          y: data.y,
          z: data.z,
          rotation: data.rotation || 0
        }, ws);
      }
      if (data.type === 'chat') {
        broadcast({
          type: 'chat',
          id: id,
          text: data.text,
          name: players[id]?.name || 'Игрок'
        }, ws);
      }
    } catch (e) {
      console.error('Ошибка:', e);
    }
  });

  ws.on('close', () => {
    delete players[id];
    broadcast({ type: 'playerLeave', id: id });
  });
});

function broadcast(data, exclude) {
  wss.clients.forEach((client) => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Сервер на порту ${PORT}`);
});
