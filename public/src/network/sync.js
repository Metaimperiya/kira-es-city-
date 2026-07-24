// ============================================================
// СИНХРОНИЗАЦИЯ УДАЛЁННЫХ ИГРОКОВ (С LERP)
// ============================================================

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

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

  for (let side = -1; side <= 1; side += 2) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), eyeMat);
    eye.position.set(side * 0.2, 1.6, 0.35);
    group.add(eye);

    const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), pupilMat);
    pupil.position.set(side * 0.2, 1.6, 0.45);
    group.add(pupil);
  }

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
          addChatMessage('Сервер', `Игрок ${data.id.slice(0, 4)} зашёл на корабль`, '#ffaa00');
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
  const color = data.color || 0xff4488;
  const mesh = createRemotePlayerMesh(color);
  
  const startX = data.x || 0;
  const startY = data.y || 0;
  const startZ = data.z || 0;

  mesh.position.set(startX, startY, startZ);
  scene.add(mesh);

  remoteMeshes[id] = mesh;
  remotePlayers[id] = {
    ...data,
    targetPosition: new THREE.Vector3(startX, startY, startZ),
    targetRotation: data.rotation || 0
  };
}

export function updateRemotePlayer(id, data) {
  if (remotePlayers[id]) {
    remotePlayers[id].targetPosition.set(data.x || 0, data.y || 0, data.z || 0);
    if (data.rotation !== undefined) {
      remotePlayers[id].targetRotation = data.rotation;
    }
  }
}

export function updateSync(delta) {
  const lerpSpeed = 15;

  for (const id in remoteMeshes) {
    const mesh = remoteMeshes[id];
    const player = remotePlayers[id];

    if (mesh && player) {
      mesh.position.lerp(player.targetPosition, Math.min(delta * lerpSpeed, 1));

      let diff = player.targetRotation - mesh.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      mesh.rotation.y += diff * Math.min(delta * lerpSpeed, 1);
    }
  }
}

export function removeRemotePlayer(id) {
  const mesh = remoteMeshes[id];
  if (mesh) {
    mesh.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });

    scene.remove(mesh);
    delete remoteMeshes[id];
    delete remotePlayers[id];
  }
}

let lastSend = 0;
let lastX = 0, lastY = 0, lastZ = 0, lastRot = 0;
const TICK_RATE = 20;

export function sendPosition(x, y, z, rotation) {
  const now = performance.now();
  if (now - lastSend < 1000 / TICK_RATE) return;

  const distSq = (x - lastX) ** 2 + (y - lastY) ** 2 + (z - lastZ) ** 2;
  const rotDiff = Math.abs((rotation || 0) - lastRot);

  if (distSq < 0.0001 && rotDiff < 0.01) return;

  lastSend = now;
  lastX = x;
  lastY = y;
  lastZ = z;
  lastRot = rotation || 0;

  sendToServer({
    type: 'move',
    x: x,
    y: y,
    z: z,
    rotation: rotation || 0
  });
}
