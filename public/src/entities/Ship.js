// ============================================================
// КОРАБЛЬ (OBJ + MTL) — ТОЧНО ПО ТВОЕЙ СТРУКТУРЕ
// ============================================================

import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { scene } from '../core/scene.js';
import { playerPos } from './Player/index.js';
import { sendPosition } from '../network/sync.js';

export let mainShip = null;

// 🎯 ТОЧКА СПАВНА (ты сам указал)
export const SPAWN_LOCAL = { x: 0.49, y: 40.31, z: 36.01 };

export let shipSpawnPoint = { x: 0, y: 10, z: 0 };

export function loadShip() {
  return new Promise((resolve) => {
    const mtlLoader = new MTLLoader();
    
    // ✅ ПРАВИЛЬНЫЙ ПУТЬ К MTL
    mtlLoader.load(
      '/assets/models/monu2.mtl',
      (materials) => {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);

        // ✅ ПРАВИЛЬНЫЙ ПУТЬ К OBJ
        objLoader.load(
          '/assets/models/monu2.obj',
          (object) => {
            setupShip(object);
            resolve();
          },
          undefined,
          (error) => {
            console.error('❌ Ошибка загрузки OBJ:', error);
            resolve();
          }
        );
      },
      undefined,
      (error) => {
        console.error('❌ Ошибка загрузки MTL:', error);
        // Пробуем загрузить без материалов
        const objLoader = new OBJLoader();
        objLoader.load(
          '/assets/models/monu2.obj',
          (object) => {
            setupShip(object);
            resolve();
          },
          undefined,
          (error) => {
            console.error('❌ Ошибка загрузки OBJ (без MTL):', error);
            resolve();
          }
        );
      }
    );
  });
}

function setupShip(object) {
  const shipContainer = new THREE.Group();
  
  // Центрируем модель
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  object.position.x = -center.x;
  object.position.z = -center.z;
  object.position.y = -box.min.y;

  shipContainer.add(object);

  // Масштабируем до 220 метров
  const TARGET_SIZE = 220;
  const maxDim = Math.max(size.x, size.z);
  const scale = TARGET_SIZE / (maxDim || 1);
  shipContainer.scale.set(scale, scale, scale);

  // Тени
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Опускаем в воду
  const shipHeight = size.y * scale;
  shipContainer.position.set(0, -shipHeight * 0.24, 0);

  scene.add(shipContainer);
  mainShip = shipContainer;

  // 🎯 ПЕРЕВОДИМ ЛОКАЛЬНЫЕ КООРДИНАТЫ В МИРОВЫЕ
  const localVec = new THREE.Vector3(SPAWN_LOCAL.x, SPAWN_LOCAL.y, SPAWN_LOCAL.z);
  const worldVec = shipContainer.localToWorld(localVec);

  shipSpawnPoint = {
    x: worldVec.x,
    y: worldVec.y,
    z: worldVec.z
  };

  console.log(`✅ Корабль загружен! Спавн: Y=${shipSpawnPoint.y.toFixed(2)}`);

  // Спавним игрока
  if (playerPos) {
    playerPos.x = shipSpawnPoint.x;
    playerPos.y = shipSpawnPoint.y;
    playerPos.z = shipSpawnPoint.z;
    sendPosition(playerPos.x, playerPos.y, playerPos.z, 0);
  }
}

// 📍 СКАНЕР ТОЧЕК (Клавиша P)
window.addEventListener('keydown', (e) => {
  if ((e.code === 'KeyP' || e.key === 'p') && mainShip && playerPos) {
    const playerWorldVec = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
    const shipLocalVec = mainShip.worldToLocal(playerWorldVec.clone());

    const coordsString = `x: ${shipLocalVec.x.toFixed(2)}, y: ${shipLocalVec.y.toFixed(2)}, z: ${shipLocalVec.z.toFixed(2)}`;
    
    console.log('%c 🎯 ЛОКАЛЬНАЯ ТОЧКА:', 'background: #222; color: #bada55; font-size: 16px');
    console.log(coordsString);
    alert(`📍 Координаты:\n${coordsString}`);
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
