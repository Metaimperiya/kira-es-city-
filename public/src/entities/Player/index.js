// ============================================================
// ИГРОК (СБОРКА) - С ПОДДЕРЖКОЙ КЛИК-УПРАВЛЕНИЯ
// ============================================================

import * as THREE from 'three';
import { scene, camera } from '../../core/scene.js';
import { teleportToShip } from '../Ship.js';
import { PlayerInput } from './PlayerInput.js';
import { PlayerController } from './PlayerController.js';
import { PlayerCamera } from './PlayerCamera.js';
import { sendPosition } from '../../network/sync.js';
import { triggerRespawnVFX } from '../../ui/vfx.js';
import { addChatMessage } from '../../ui/chat.js';
import { updateClickMovement, cancelClickMovement, isClickMoving } from './clickControls.js';

export let playerPos = { x: 0, z: 0, y: 0 };
let playerGroup;
let delta = 0;

export let velocityY = 0;

export function setDelta(value) {
  delta = value;
}

export function initControls() {
  PlayerInput.init();
  PlayerCamera.init(camera);
}

export function createPlayer() {
  playerGroup = new THREE.Group();
  scene.add(playerGroup);

  const color = 0x00ff88;
  const bodyMat = new THREE.MeshPhongMaterial({ color, flatShading: true });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.6), bodyMat);
  body.position.y = 0.7;
  body.castShadow = true;
  playerGroup.add(body);

  const headMat = new THREE.MeshPhongMaterial({ color: 0xffccaa, flatShading: true });
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), headMat);
  head.position.y = 1.5;
  head.castShadow = true;
  playerGroup.add(head);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

  for (let side = -1; side <= 1; side += 2) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), eyeMat);
    eye.position.set(side * 0.2, 1.6, 0.35);
    playerGroup.add(eye);

    const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), pupilMat);
    pupil.position.set(side * 0.2, 1.6, 0.45);
    playerGroup.add(pupil);
  }

  const spawn = teleportToShip();
  if (spawn) {
    playerPos.x = spawn.x + (Math.random() - 0.5) * 4;
    playerPos.z = spawn.z + (Math.random() - 0.5) * 4;
    playerPos.y = spawn.y;
  }

  playerGroup.position.set(playerPos.x, playerPos.y, playerPos.z);
  PlayerController.init(playerGroup, playerPos);

  sendPosition(playerPos.x, playerPos.y, playerPos.z, 0);
}

export function getPlayerMesh() {
  return playerGroup;
}

export function checkWaterFall() {
  if (!playerPos) return;

  const WATER_LEVEL = -1.5;

  if (playerPos.y < WATER_LEVEL) {
    triggerRespawnVFX('#00f3ff');

    const spawn = teleportToShip();
    playerPos.x = spawn.x;
    playerPos.y = spawn.y;
    playerPos.z = spawn.z;

    PlayerController.velocityY = 0;
    cancelClickMovement();
    sendPosition(playerPos.x, playerPos.y, playerPos.z, 0);

    addChatMessage('Система', '🌊 Вы упали за борт и были возвращены на корабль!', '#ff007f');

    console.log('🚨 Игрок упал в воду. Телепортация на спавн завершена.');
  }
}

export function updatePlayer() {
  const input = PlayerInput.getInput();
  
  // Если есть движение с клавиатуры — отменяем клик-движение
  if (Math.abs(input.moveX) > 0.05 || Math.abs(input.moveZ) > 0.05) {
    cancelClickMovement();
    PlayerController.update(input, delta);
  } else if (isClickMoving) {
    // Движение по клику
    updateClickMovement(delta, playerGroup);
  } else {
    // Стоим на месте
    PlayerController.update({ moveX: 0, moveZ: 0, jump: input.jump }, delta);
  }

  PlayerCamera.update(playerPos, input);
  checkWaterFall();

  // Отправка позиции, если сдвинулись
  if (PlayerController.moved || isClickMoving) {
    sendPosition(playerPos.x, playerPos.y, playerPos.z, playerGroup?.rotation.y || 0);
  }
}

export function getPlayerPos() {
  return playerPos;
}
