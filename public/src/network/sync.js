import * as THREE from 'three';
import { scene } from '../core/scene.js';
import { sendToServer, onMessage } from './socket.js';
import { addChatMessage } from '../ui/chat.js';
import { refreshHUD } from '../ui/hud.js';

export const remotePlayers = {};
export const remoteMeshes = {};
export let myId = '';

function createRemotePlayerMesh(color = 0xff4488) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhongMaterial({ color, flatShading: true });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.6), bodyMat);
  body.position.y = 0.7;
  body.castShadow = true;
  group.add(body);

  const headMat = new THREE.MeshPhongMaterial({ color: 0xffccaa, flatShading: true });
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), headMat);
  head.position.y = 1.5;
  head.castShadow = true;
  group.add(head);

  return group;
}

export function initSync() {
  onMessage((event) => {
    try {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'init':
          myId = data.myId;
          for (const id in data.players) {
            if (id !== myId) addRemotePlayer(id, data.players[id]);
          }
          refreshHUD();
          break;

        case 'playerJoin':
          addRemotePlayer(data.id, data);
          addChatMessage('Сервер', `Игрок ${data.id.slice(0, 4)} зашёл`, '#ffaa00');
          refreshHUD();
          break;

        case 'playerMove':
          updateRemotePlayer(data.id, data);
          break;

        case 'playerLeave':
          removeRemotePlayer(data.id);
          addChatMessage('Сервер', `Игрок ${data.id.slice(0, 4)} вышел`, '#ff4444');
          refreshHUD();
          break;

        case 'chat':
          addChatMessage(data.name || `Игрок [${data.id.slice(0, 4)}]`, data.text, '#00f3ff');
          break;
      }
    } catch (e) {
      console.error('Ошибка парсинга:', e);
    }
  });
}

export function addRemotePlayer(id, data) {
  if (remoteMeshes[id]) return;
  const mesh = createRemotePlayerMesh(data.color || 0xff4488);
  mesh.position.set(data.x || 0, data.y || 0, data.z || 0);
  scene.add(mesh);
  remoteMeshes[id] = mesh;
  remotePlayers[id] = data;
}

export function updateRemotePlayer(id, data) {
  if (remoteMeshes[id]) {
    remoteMeshes[id].position.set(data.x || 0, data.y || 0, data.z || 0);
    if (data.rotation !== undefined) {
      remoteMeshes[id].rotation.y = data.rotation;
    }
  }
}

export function removeRemotePlayer(id) {
  const mesh = remoteMeshes[id];
  if (mesh) {
    scene.remove(mesh);
    delete remoteMeshes[id];
    delete remotePlayers[id];
  }
}

let lastSend = 0;
const TICK_RATE = 20;

export function sendPosition(x, y, z, rotation) {
  const now = performance.now();
  if (now - lastSend < 1000 / TICK_RATE) return;
  lastSend = now;

  sendToServer({
    type: 'move',
    x: x,
    y: y,
    z: z,
    rotation: rotation || 0
  });
}
