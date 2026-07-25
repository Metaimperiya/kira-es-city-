// ============================================================
// ЗАМОК (OBJ + MTL) - БОЛЬШОЙ И ПОДНЯТЫЙ
// ============================================================

import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { scene } from '../core/scene.js';
import { playerPos } from './Player/index.js';
import { sendPosition } from '../network/sync.js';

export let mainShip = null;

export const SPAWN_LOCAL = { x: 0.04, y: 12.50, z: 2.64 };
export let shipSpawnPoint = { x: 0, y: 5, z: 0 };

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
          (error) => {
            console.error('❌ Ошибка загрузки OBJ:', error);
            resolve();
          }
        );
      },
      undefined,
      (error) => {
        console.error('❌ Ошибка загрузки MTL:', error);
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
  
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  object.position.x = -center.x;
  object.position.z = -center.z;
  object.position.y = -box.min.y;

  shipContainer.add(object);

  // 🚀 МАСШТАБ УВЕЛИЧЕН С 220 ДО 400
  const TARGET_SIZE = 400;
  const maxDim = Math.max(size.x, size.z);
  const scale = TARGET_SIZE / (maxDim || 1);
  shipContainer.scale.set(scale, scale, scale);

  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // 🚀 ПОДНЯТ НА 30 МЕТРОВ (чтобы точно был над водой)
  shipContainer.position.set(0, 30, 0);

  scene.add(shipContainer);
  mainShip = shipContainer;

  shipContainer.updateMatrixWorld(true);

  const localVec = new THREE.Vector3(SPAWN_LOCAL.x, SPAWN_LOCAL.y, SPAWN_LOCAL.z);
  const worldVec = shipContainer.localToWorld(localVec);

  shipSpawnPoint = {
    x: worldVec.x,
    y: worldVec.y,
    z: worldVec.z
  };

  console.log(`✅ Замок загружен! Масштаб: ${TARGET_SIZE}, Спавн: Y=${shipSpawnPoint.y.toFixed(2)}`);

  if (playerPos) {
    playerPos.x = shipSpawnPoint.x;
    playerPos.y = shipSpawnPoint.y;
    playerPos.z = shipSpawnPoint.z;
    sendPosition(playerPos.x, playerPos.y, playerPos.z, 0);
  }
}

// СКАНЕР КООРДИНАТ ПО КЛАВИШЕ P
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
