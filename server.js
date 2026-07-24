const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

const players = {};

function heartbeat() {
  this.isAlive = true;
}

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      if (ws.id && players[ws.id]) {
        console.log(`💀 Удалён зависший игрок: ${ws.id}`);
        delete players[ws.id];
        broadcast({ type: 'playerLeave', id: ws.id });
      }
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(interval));

wss.on('connection', (ws) => {
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  ws.id = id;
  ws.isAlive = true;

  ws.on('pong', heartbeat);

  players[id] = {
    x: Number(((Math.random() - 0.5) * 10).toFixed(2)),
    y: 8,
    z: Number(((Math.random() - 0.5) * 10).toFixed(2)),
    rotation: 0,
    color: Math.floor(Math.random() * 0xffffff),
    name: 'Игрок_' + id.slice(-4)
  };

  console.log(`🟢 Игрок ${id} подключился (Всего: ${Object.keys(players).length})`);

  ws.send(JSON.stringify({
    type: 'init',
    players: players,
    myId: id
  }));

  broadcast({
    type: 'playerJoin',
    id: id,
    ...players[id]
  }, ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'move' && players[id]) {
        const x = typeof data.x === 'number' ? data.x : players[id].x;
        const y = typeof data.y === 'number' ? data.y : players[id].y;
        const z = typeof data.z === 'number' ? data.z : players[id].z;
        const rotation = typeof data.rotation === 'number' ? data.rotation : players[id].rotation;

        players[id].x = x;
        players[id].y = y;
        players[id].z = z;
        players[id].rotation = rotation;

        broadcast({
          type: 'playerMove',
          id: id,
          x, y, z, rotation
        }, ws);
      }

      if (data.type === 'chat') {
        const text = String(data.text || '').trim().slice(0, 200);
        if (!text) return;

        broadcast({
          type: 'chat',
          id: id,
          text: text,
          name: players[id]?.name || `Игрок_${id.slice(-4)}`
        });
      }
    } catch (e) {
      console.error('Ошибка обработки сообщения от игрока', id, e);
    }
  });

  ws.on('close', () => {
    console.log(`🔴 Игрок ${id} отключился`);
    delete players[id];
    broadcast({ type: 'playerLeave', id: id });
  });
});

function broadcast(data, excludeWs = null) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
