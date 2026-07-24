// ============================================================
// КОРАБЛЬ (OBJ + MTL) - С НОВЫМИ КООРДИНАТАМИ
// ============================================================

import * as THREE from // ============================================================
// КОРАБЛЬ (OBJ + MTL) - ОПУЩЕННЫЙ К ВОДЕ
// ============================================================

import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { scene } from '../core/scene.js';
import { playerPos } from './Player/index.js';
import { sendPosition } from '../network/sync.js';

export let mainShip = null;

// 🎯 КООРДИНАТЫ С ПАЛУБЫ (ТЫ НАЖАЛ P)
// x: -13.35, y: 3.75, z: 8.68
export const SPAWN_LOCAL = { x: -13.35, y: 3.75, z: 8.68 };

export let shipSpawnPoint = { x: 0, y: 2, z: 0 };

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

  const TARGET_SIZE = 220;
  const maxDim = Math.max(size.x, size.z);
  const scale = TARGET_SIZE / (maxDim || 1);
  shipContainer.scale.set(scale, scale, scale);

  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const shipHeight = size.y * scale;
  
  // 🎯 ОПУСКАЕМ МОДЕЛЬ К ВОДЕ
  // Было -shipHeight * 0.08, теперь просто -shipHeight * 0.5
  // Это опустит модель так, чтобы палуба была на уровне ~1-2м над водой
  shipContainer.position.set(0, -shipHeight * 0.5, 0);

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

  console.log(`✅ Корабль загружен! Спавн: X=${shipSpawnPoint.x.toFixed(2)}, Y=${shipSpawnPoint.y.toFixed(2)}, Z=${shipSpawnPoint.z.toFixed(2)}`);
  console.log(`📏 Высота модели: ${shipHeight.toFixed(2)} метров`);

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
    
    console.log('%c 🎯 ЛОКАЛЬНАЯ ТОЧКА КОРАБЛЯ:', 'background: #111; color: #00f3ff; font-size: 14px; font-weight: bold;');
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
}'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { scene } from '../core/scene.js';
import { playerPos } from './Player/index.js';
import { sendPosition } from '../network/sync.js';

export let mainShip = null;

// 🎯 НОВЫЕ КООРДИНАТЫ (ТЫ НАЖАЛ P И ПОЛУЧИЛ)
// x: -13.35, y: 3.75, z: 8.68
export const SPAWN_LOCAL = { x: -13.35, y: 3.75, z: 8.68 };

export let shipSpawnPoint = { x: 0, y: 3, z: 0 };

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

  const TARGET_SIZE = 220;
  const maxDim = Math.max(size.x, size.z);
  const scale = TARGET_SIZE / (maxDim || 1);
  shipContainer.scale.set(scale, scale, scale);

  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const shipHeight = size.y * scale;
  // ЕЩЁ НИЖЕ (было 0.15, стало 0.08)
  shipContainer.position.set(0, -shipHeight * 0.08, 0);

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

  console.log(`✅ Корабль загружен! Спавн: X=${shipSpawnPoint.x.toFixed(2)}, Y=${shipSpawnPoint.y.toFixed(2)}, Z=${shipSpawnPoint.z.toFixed(2)}`);

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
    
    console.log('%c 🎯 ЛОКАЛЬНАЯ ТОЧКА КОРАБЛЯ:', 'background: #111; color: #00f3ff; font-size: 14px; font-weight: bold;');
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
