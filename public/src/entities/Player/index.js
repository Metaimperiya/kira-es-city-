// ============================================================
// ИГРОК (X-RAY GHOST) — ПРИВЯЗАН К ПОВЕРХНОСТИ
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
import { updateClickMovement, cancelClickMovement, isClickMoving, isMobileDevice } from './clickControls.js';

export let playerPos = { x: 0, z: 0, y: 0 };
let playerGroup;
let delta = 0;
export let velocityY = 0;
let elapsedTime = 0;
let walkCycle = 0;
let isMoving = false;

// ============================================================
// ПАРАМЕТРЫ ПРИЗРАКА
// ============================================================
const PARTICLE_COUNT = 18000;
let particleGeo;
let particlePositions;
let particleBasePositions;
let particleColors;

// ============================================================
// ТЕКСТУРЫ
// ============================================================
function makeTexture(char) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.font = 'Bold 44px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 15;
  ctx.fillText(char, 32, 32);
  return new THREE.CanvasTexture(c);
}

const glyphs = '01XYZSYS_ERR⌘⚡☠∆ΞΨΩµ§#@&%*+=-:;<>█▓▒░'.split('');
const textures = glyphs.map(g => makeTexture(g));

// ============================================================
// МАСКА ЛИЦА
// ============================================================
function inFace(x, y, z) {
  if (Math.hypot(x + 14, y - 97, z - 30) < 7) return true;
  if (Math.hypot(x - 14, y - 97, z - 30) < 7) return true;
  if (Math.hypot(x + 10, y - 80, z - 30) < 4) return true;
  if (Math.hypot(x - 10, y - 80, z - 30) < 4) return true;
  if (Math.hypot(x, y - 82, z - 30) < 4) return true;
  if (Math.hypot(x, y - 90, z - 34) < 3) return true;
  return false;
}

// ============================================================
// ГЕНЕРАЦИЯ ПРИЗРАКА
// ============================================================
function generateGhost() {
  particleGeo = new THREE.BufferGeometry();
  particlePositions = new Float32Array(PARTICLE_COUNT * 3);
  particleBasePositions = new Float32Array(PARTICLE_COUNT * 3);
  particleColors = new Float32Array(PARTICLE_COUNT * 3);

  const colSkin = new THREE.Color(0x0055ff);
  const colBone = new THREE.Color(0x00ffff);
  const colBrain = new THREE.Color(0xff0088);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let x = 0, y = 0, z = 0;
    const rnd = Math.random();

    if (rnd < 0.35) {
      const part = Math.random();
      if (part < 0.2) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.acos(2 * Math.random() - 1);
        const r = 25 + Math.random() * 4;
        x = r * Math.sin(v) * Math.cos(u);
        y = 105 + r * Math.sin(v) * Math.sin(u) * 1.1;
        z = r * Math.cos(v);
        if (inFace(x, y, z)) {
          const u2 = Math.random() * Math.PI * 2;
          const v2 = Math.acos(2 * Math.random() - 1);
          const r2 = 27 + Math.random() * 3;
          x = r2 * Math.sin(v2) * Math.cos(u2);
          y = 105 + r2 * Math.sin(v2) * Math.sin(u2) * 1.1;
          z = r2 * Math.cos(v2);
        }
      } else if (part < 0.5) {
        const h = Math.random();
        const w = (1 - h * 0.2) * (26 + Math.random() * 4);
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * w;
        x = Math.cos(a) * r;
        y = 10 + h * 75;
        z = Math.sin(a) * (r * 0.6);
      } else if (part < 0.7) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const p = Math.random();
        x = side * (32 + p * 5 + Math.random() * 4);
        y = 75 - p * 65 + Math.random() * 6;
        z = (Math.random() - 0.5) * 12;
      } else {
        const side = Math.random() > 0.5 ? 1 : -1;
        const p = Math.random();
        const knee = Math.sin(p * Math.PI) * 12;
        x = side * (14 + p * 8 + Math.random() * 4);
        y = 10 - p * 90 + Math.random() * 6;
        z = knee + (Math.random() - 0.5) * 10;
        if (p > 0.78) {
          z += 16 + Math.random() * 6;
          x += side * (3 + Math.random() * 4);
        }
      }
      particleColors[i * 3] = colSkin.r;
      particleColors[i * 3 + 1] = colSkin.g;
      particleColors[i * 3 + 2] = colSkin.b;
    } else {
      const skel = Math.random();
      if (skel < 0.15) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.acos(2 * Math.random() - 1);
        const r = 11 + Math.sin(u * 8) * Math.cos(v * 8) * 2;
        x = r * Math.sin(v) * Math.cos(u) * 0.8;
        y = 114 + r * Math.sin(v) * Math.sin(u) * 0.8;
        z = r * Math.cos(v) * 0.8;
        particleColors[i * 3] = colBrain.r;
        particleColors[i * 3 + 1] = colBrain.g;
        particleColors[i * 3 + 2] = colBrain.b;
      } else if (skel < 0.45) {
        const ribIndex = Math.floor(Math.random() * 7);
        const ribY = 32 + ribIndex * 6.5;
        const side = Math.random() > 0.5 ? 1 : -1;
        const t = Math.random();
        const angle = t * Math.PI;
        const widthX = 18 - ribIndex * 0.8;
        const depthZ = 12 - ribIndex * 0.5;
        x = side * Math.sin(angle) * widthX;
        y = ribY - Math.sin(t * Math.PI) * 2;
        z = -6 + Math.cos(angle) * depthZ;
        particleColors[i * 3] = colBone.r;
        particleColors[i * 3 + 1] = colBone.g;
        particleColors[i * 3 + 2] = colBone.b;
      } else {
        const side = Math.random() > 0.5 ? 1 : -1;
        const p = Math.random();
        x = side * (14 + p * 8 + Math.random() * 3);
        y = 5 - p * 85 + Math.random() * 4;
        z = (Math.random() - 0.5) * 10;
        particleColors[i * 3] = colBone.r;
        particleColors[i * 3 + 1] = colBone.g;
        particleColors[i * 3 + 2] = colBone.b;
      }
    }

    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = y - 10;
    particlePositions[i * 3 + 2] = z;
    particleBasePositions[i * 3] = x;
    particleBasePositions[i * 3 + 1] = y - 10;
    particleBasePositions[i * 3 + 2] = z;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
}

// ============================================================
// ЭКСПОРТЫ
// ============================================================

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

  generateGhost();

  const material = new THREE.PointsMaterial({
    size: 0.12,
    map: textures[0],
    transparent: true,
    opacity: 0.85,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const cloud = new THREE.Points(particleGeo, material);
  cloud.scale.set(0.015, 0.015, 0.015);
  
  // ⬇️ ВЫСОТА НАД ПОВЕРХНОСТЬЮ (НЕ МЕНЯТЬ БЕЗ НЕОБХОДИМОСТИ) ⬇️
  cloud.position.y = 2.5;

  playerGroup.add(cloud);

  const spawn = teleportToShip();
  if (spawn) {
    playerPos.x = spawn.x;
    playerPos.y = spawn.y;
    playerPos.z = spawn.z;
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
  }
}

export function updatePlayer() {
  if (!particleGeo) return;

  const input = PlayerInput.getInput();
  const isMovingNow = Math.abs(input.moveX) > 0.05 || Math.abs(input.moveZ) > 0.05;

  if (isMovingNow) {
    walkCycle += delta * 6;
    isMoving = true;
  } else {
    isMoving = false;
    walkCycle *= 0.95;
  }

  elapsedTime += delta;

  const positions = particleGeo.attributes.position;
  const walkSin = Math.sin(walkCycle);
  const walkCos = Math.cos(walkCycle);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const bx = particleBasePositions[i * 3];
    const by = particleBasePositions[i * 3 + 1];
    const bz = particleBasePositions[i * 3 + 2];

    const breath = Math.sin(elapsedTime * 1.7 + by * 0.04) * 1.2 + Math.sin(elapsedTime * 0.9 + bx * 0.03) * 0.8;
    const breathY = Math.cos(elapsedTime * 1.4 + bx * 0.04) * 1.2 + Math.sin(elapsedTime * 1.1 + bz * 0.03) * 0.8;
    const breathZ = Math.sin(elapsedTime * 1.6 + bz * 0.04) * 1.2 + Math.cos(elapsedTime * 0.8 + by * 0.03) * 0.8;

    let walkX = 0, walkY = 0, walkZ = 0;

    if (isMoving) {
      // НОГИ (y < 15)
      if (by < 15) {
        const legSide = bx > 0 ? 1 : -1;
        walkX = legSide * walkSin * 0.3;
        walkY = Math.abs(walkSin) * 1.0;
        walkZ = walkCos * 0.5 * legSide;
      }
      // РУКИ (y > 60 и |bx| > 20)
      if (by > 60 && Math.abs(bx) > 20) {
        const armSide = bx > 0 ? 1 : -1;
        walkX = -armSide * walkSin * 0.25;
        walkY = Math.sin(walkCycle + armSide * 1.5) * 0.4;
        walkZ = walkCos * 0.3 * armSide;
      }
      // ТОРС
      if (by > 15 && by < 60) {
        walkX = walkSin * 0.2;
        walkZ = walkCos * 0.15;
      }
      // ГОЛОВА
      if (by > 80) {
        walkX = walkSin * 0.1;
        walkY = Math.sin(walkCycle * 0.5) * 0.15;
      }
    }

    positions.setXYZ(i, bx + breath + walkX, by + breathY + walkY, bz + breathZ + walkZ);
  }
  positions.needsUpdate = true;

  // ===== УПРАВЛЕНИЕ =====
  const isMobile = isMobileDevice();

  if (Math.abs(input.moveX) > 0.05 || Math.abs(input.moveZ) > 0.05) {
    cancelClickMovement();
    PlayerController.update(input, delta);
  } else if (isMobile && isClickMoving) {
    updateClickMovement(delta, playerGroup);
  } else {
    PlayerController.update({ moveX: 0, moveZ: 0, jump: input.jump }, delta);
  }

  PlayerCamera.update(playerPos, input);
  checkWaterFall();

  if (PlayerController.moved || isClickMoving) {
    sendPosition(playerPos.x, playerPos.y, playerPos.z, playerGroup?.rotation.y || 0);
  }
}

export function getPlayerPos() {
  return playerPos;
}
