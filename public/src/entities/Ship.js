import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { scene } from '../core/scene.js';
import { playerPos } from './Player/index.js';
import { sendPosition } from '../network/sync.js';

export let mainShip = null;

// 🎯 ПОДНИМАЕМ НА ВЕРШИНУ МОДЕЛИ (250 блоков → 50 метров)
export const SPAWN_LOCAL = { x: 0, y: 50, z: 0 };

export let shipSpawnPoint = { x: 0, y: 50, z: 0 };

export function loadShip() {
  return new Promise((resolve) => {
    const mtlLoader = new MTLLoader();
    mtlLoader.load(
      '/assets/models/monu2.mtl',
      (materials) => {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);

        objLoader.load(
          '/assets/models/monu2.obj',
          (object) => {
            setupShip(object);
            resolve();
          },
          undefined,
          () => resolve()
        );
      },
      undefined,
      () => {
        const objLoader = new OBJLoader();
        objLoader.load(
          '/assets/models/monu2.obj',
          (object) => {
            setupShip(object);
            resolve();
          },
          undefined,
          () => resolve()
        );
      }
    );
  });
}

function setupShip(object) {
  const shipContainer = new THREE.Group();
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  object.position.x = -center.x;
  object.position.z = -center.z;
  object.position.y = -box.min.y;

  shipContainer.add(object);

  // Масштабируем до 50 метров
  const TARGET_SIZE = 50;
  const maxDim = Math.max(size.x, size.z);
  const scale = TARGET_SIZE / (maxDim || 1);
  shipContainer.scale.set(scale, scale, scale);

  // Реальная высота модели в метрах
  const realHeight = size.y * scale;
  console.log(`📏 Высота модели: ${realHeight.toFixed(2)} метров`);

  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Опускаем модель так, чтобы низ был на Y=0
  const shipHeight = size.y * scale;
  shipContainer.position.set(0, -shipHeight * 0.2, 0);

  scene.add(shipContainer);
  mainShip = shipContainer;

  // 🎯 ТОЧКА СПАВНА НА ВЕРШИНЕ
  const localVec = new THREE.Vector3(SPAWN_LOCAL.x, SPAWN_LOCAL.y, SPAWN_LOCAL.z);
  const worldVec = shipContainer.localToWorld(localVec);
  shipSpawnPoint = { x: worldVec.x, y: worldVec.y, z: worldVec.z };

  console.log(`🎯 Точка спавна: Y=${shipSpawnPoint.y.toFixed(2)}`);

  if (playerPos) {
    playerPos.x = shipSpawnPoint.x;
    playerPos.y = shipSpawnPoint.y;
    playerPos.z = shipSpawnPoint.z;
    sendPosition(playerPos.x, playerPos.y, playerPos.z, 0);
  }
}

// 📍 Сканер точек (клавиша P) - поможет найти правильную высоту
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyP' && mainShip && playerPos) {
    const playerWorldVec = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
    const shipLocalVec = mainShip.worldToLocal(playerWorldVec.clone());
    alert(
      `📍 Локальные координаты:\n` +
      `x: ${shipLocalVec.x.toFixed(2)}\n` +
      `y: ${shipLocalVec.y.toFixed(2)}\n` +
      `z: ${shipLocalVec.z.toFixed(2)}\n\n` +
      `💡 Попробуй изменить SPAWN_LOCAL.y на это значение`
    );
  }
});

export function teleportToShip() {
  if (mainShip) {
    const localVec = new THREE.Vector3(SPAWN_LOCAL.x, SPAWN_LOCAL.y, SPAWN_LOCAL.z);
    const worldVec = mainShip.localToWorld(localVec);
    return { x: worldVec.x, y: worldVec.y, z: worldVec.z };
  }
  return { ...shipSpawnPoint };
}
