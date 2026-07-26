// ============================================================
// ЗАМОК (GLB) - С ВСТРОЕННЫМ СВЕТОМ
// ============================================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { scene } from '../core/scene.js';
import { playerPos } from './Player/index.js';
import { sendPosition } from '../network/sync.js';
import { Bonfire } from './Bonfire.js';

export let mainShip = null;
export let bonfires = [];

export const SPAWN_LOCAL = { x: 0.04, y: 12.50, z: 2.64 };
export let shipSpawnPoint = { x: 0, y: 3, z: 0 };

export function loadShip() {
  return new Promise((resolve) => {
    const loader = new GLTFLoader();
    
    console.log('📥 Загрузка GLB модели...');
    loader.load(
      '/assets/models/monu2.glb',
      (gltf) => {
        console.log('✅ GLB модель загружена!');
        setupShip(gltf.scene);
        resolve();
      },
      undefined,
      (error) => {
        console.error('❌ Ошибка загрузки GLB:', error);
        resolve();
      }
    );
  });
}

function setupShip(model) {
  const shipContainer = new THREE.Group();
  
  // Центрируем модель
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  model.position.x = -center.x;
  model.position.z = -center.z;
  model.position.y = -box.min.y;

  shipContainer.add(model);

  // 💡 ЕЩЁ УМЕНЬШАЕМ ЗАМОК (поставили 110)
  const TARGET_SIZE = 110; 
  const maxDim = Math.max(size.x, size.z) || 1;
  const scale = TARGET_SIZE / maxDim;
  shipContainer.scale.set(scale, scale, scale);

  // Включаем тени
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // 💡 ОПУСКАЕМ НА ВЫСОТУ ПЕРСОНАЖА (поставили 0)
  shipContainer.position.set(0, 0, 0);

  scene.add(shipContainer);
  mainShip = shipContainer;

  // --- КОСТРЫ ---
  const firePositions = [
    { x: -4.66, z: 4.81 },
    { x: 5.29, z: 3.15 },
    { x: 2.67, z: -9.27 }
  ];

  firePositions.forEach((pos) => {
    const fire = new Bonfire(pos.x, 0, pos.z);
    bonfires.push(fire);
  });

  shipContainer.updateMatrixWorld(true);

  const localVec = new THREE.Vector3(SPAWN_LOCAL.x, SPAWN_LOCAL.y, SPAWN_LOCAL.z);
  const worldVec = shipContainer.localToWorld(localVec);

  shipSpawnPoint = {
    x: worldVec.x,
    y: worldVec.y,
    z: worldVec.z
  };

  console.log(`✅ Замок загружен! Спавн: Y=${shipSpawnPoint.y.toFixed(2)}`);

  if (playerPos) {
    playerPos.x = shipSpawnPoint.x;
    playerPos.y = shipSpawnPoint.y;
    playerPos.z = shipSpawnPoint.z;
    sendPosition(playerPos.x, playerPos.y, playerPos.z, 0);
  }
}

window.addEventListener('keydown', (e) => {
  const activeTag = document.activeElement?.tagName;
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

  const key = e.key.toLowerCase();
  if ((e.code === 'KeyP' || key === 'p' || key === 'з') && mainShip && playerPos) {
    mainShip.updateMatrixWorld(true);
    
    const playerWorldVec = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
    const shipLocalVec = mainShip.worldToLocal(playerWorldVec.clone());

    const coordsString = `x: ${shipLocalVec.x.toFixed(2)}, y: ${shipLocalVec.y.toFixed(2)}, z: ${shipLocalVec.z.toFixed(2)}`;
    
    console.log('%c 🎯 ЛОКАЛЬНАЯ ТОЧКА ЗАМКА:', 'background: #111; color: #00f3ff; font-size: 14px; font-weight: bold;');
    console.log(coordsString);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(coordsString);
      console.log('📋 Координаты скопированы в буфер обмена!');
    }
  }
});

export function teleportToShip() {
  if (mainShip) {
    mainShip.updateMatrixWorld(true);
    const localVec = new THREE.Vector3(SPAWN_LOCAL.x, SPAWN_LOCAL.y, SPAWN_LOCAL.z);
    const worldVec = mainShip.localToWorld(localVec);
    return { x: worldVec.x, y: worldVec.y, z: worldVec.z };
  }
  return { ...shipSpawnPoint };
}
