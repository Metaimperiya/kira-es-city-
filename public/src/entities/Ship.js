// ============================================================
// ЗАМОК + КОСТРЫ
// ============================================================

import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { scene } from '../core/scene.js';
import { playerPos } from './Player/index.js';
import { sendPosition } from '../network/sync.js';
import { Bonfire } from './Bonfire.js';

export let mainShip = null;
export let bonfires = [];

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

  const TARGET_SIZE = 200;
  const maxDim = Math.max(size.x, size.z);
  const scale = TARGET_SIZE / (maxDim || 1);
  shipContainer.scale.set(scale, scale, scale);

  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });

  shipContainer.position.set(0, 6, 0);

  scene.add(shipContainer);
  mainShip = shipContainer;

  // --- КОСТРЫ (ставь свои координаты) ---
  const firePositions = [
    { x: -4.66, z: 4.81 },
    { x: 5.29, z: 3.15 },
    { x: 2.67, z: -9.27 }
  ];

  firePositions.forEach((pos) => {
    const fire = new Bonfire(pos.x, 6, pos.z);
    bonfires.push(fire);
    console.log(`🔥 Костёр на X=${pos.x}, Z=${pos.z}`);
  });

  shipContainer.updateMatrixWorld(true);

  const localVec = new THREE.Vector3(SPAWN_LOCAL.x, SPAWN_LOCAL.y, SPAWN_LOCAL.z);
  const worldVec = shipContainer.localToWorld(localVec);

  shipSpawnPoint = {
    x: worldVec.x,
    y: worldVec.y,
    z: worldVec.z
  };

  console.log(`✅ Замок загружен!`);

  if (playerPos) {
    playerPos.x = shipSpawnPoint.x;
    playerPos.y = shipSpawnPoint.y;
    playerPos.z = shipSpawnPoint.z;
    sendPosition(playerPos.x, playerPos.y, playerPos.z, 0);
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyP' && mainShip && playerPos) {
    mainShip.updateMatrixWorld(true);
    const localVec = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
    const worldVec = mainShip.worldToLocal(localVec);
    console.log(`📍 x: ${worldVec.x.toFixed(2)}, y: ${worldVec.y.toFixed(2)}, z: ${worldVec.z.toFixed(2)}`);
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
