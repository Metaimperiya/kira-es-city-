import * as THREE from 'three';
import { scene } from '../../core/scene.js';

let playerGroup;
let particleGeo;
let particlePositions;
let particleBasePositions;
let particleCount = 18000; // Оптимальный баланс визуализации и FPS
let currentDelta = 0;
let elapsedTime = 0;

// Вспомогательная функция генерирует текстуры символов
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

function inFace(x, y, z) {
  if (Math.hypot(x + 14, y - 97, z - 30) < 7) return true;
  if (Math.hypot(x - 14, y - 97, z - 30) < 7) return true;
  if (Math.hypot(x + 10, y - 80, z - 30) < 4) return true;
  if (Math.hypot(x - 10, y - 80, z - 30) < 4) return true;
  if (Math.hypot(x, y - 82, z - 30) < 4) return true;
  if (Math.hypot(x, y - 90, z - 34) < 3) return true;
  return false;
}

export function setDelta(delta) {
  currentDelta = delta;
}

export function createPlayer() {
  playerGroup = new THREE.Group();

  const glyphs = '01XYZSYS_ERR⌘⚡☠∆ΞΨΩµ§#@&%*+=-:;<>█▓▒░'.split('');
  const textures = glyphs.map(g => makeTexture(g));

  particleGeo = new THREE.BufferGeometry();
  particlePositions = new Float32Array(particleCount * 3);
  particleBasePositions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const colSkin = new THREE.Color(0x0055ff);
  const colBone = new THREE.Color(0x00ffff);

  for (let i = 0; i < particleCount; i++) {
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
      } else {
        const side = Math.random() > 0.5 ? 1 : -1;
        const p = Math.random();
        x = side * (14 + p * 8 + Math.random() * 4);
        y = 10 - p * 90 + Math.random() * 6;
        z = (Math.random() - 0.5) * 10;
      }
      colors[i * 3] = colSkin.r;
      colors[i * 3 + 1] = colSkin.g;
      colors[i * 3 + 2] = colSkin.b;
    } else {
      x = (Math.random() - 0.5) * 10;
      y = Math.random() * 100;
      z = (Math.random() - 0.5) * 10;
      colors[i * 3] = colBone.r;
      colors[i * 3 + 1] = colBone.g;
      colors[i * 3 + 2] = colBone.b;
    }

    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = y - 10;
    particlePositions[i * 3 + 2] = z;

    particleBasePositions[i * 3] = x;
    particleBasePositions[i * 3 + 1] = y - 10;
    particleBasePositions[i * 3 + 2] = z;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.12, // Корректный размер для масштабной сетки сцены
    map: textures[0],
    transparent: true,
    opacity: 0.85,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const cloud = new THREE.Points(particleGeo, material);
  
  // Уменьшаем исходную модель (оригинальные координаты уходят на 100+ единиц вверх)
  cloud.scale.set(0.015, 0.015, 0.015);
  
  playerGroup.add(cloud);
  scene.add(playerGroup);

  return playerGroup;
}

export function updatePlayer() {
  if (!particleGeo) return;

  elapsedTime += currentDelta;

  // Анимация колыхания/дыхания частичек
  const positions = particleGeo.attributes.position;
  for (let i = 0; i < particleCount; i++) {
    const bx = particleBasePositions[i * 3];
    const by = particleBasePositions[i * 3 + 1];
    const bz = particleBasePositions[i * 3 + 2];

    const nx = Math.sin(elapsedTime * 1.7 + by * 0.04) * 1.2 + Math.sin(elapsedTime * 0.9 + bx * 0.03) * 0.8;
    const ny = Math.cos(elapsedTime * 1.4 + bx * 0.04) * 1.2 + Math.sin(elapsedTime * 1.1 + bz * 0.03) * 0.8;
    const nz = Math.sin(elapsedTime * 1.6 + bz * 0.04) * 1.2 + Math.cos(elapsedTime * 0.8 + by * 0.03) * 0.8;

    positions.setXYZ(i, bx + nx, by + ny, bz + nz);
  }
  positions.needsUpdate = true;

  // Здесь остаётся твоя стандартная логика передвижения игрока/камеры...
}

export function initControls() { /* Твой код управления */ }
