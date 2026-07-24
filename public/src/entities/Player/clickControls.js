// ============================================================
// КЛИК-УПРАВЛЕНИЕ (Point-and-Click как в Avakin Life)
// ============================================================

import * as THREE from 'three';
import { camera, scene } from '../../core/scene.js';
import { playerPos } from './index.js';
import { sendPosition } from '../../network/sync.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

export let targetPosition = null;
let clickMarker = null;
const MOVE_SPEED = 7;

export let isClickMoving = false;

function createClickMarker() {
  const geo = new THREE.RingGeometry(0.2, 0.4, 32);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ 
    color: 0x00f3ff, 
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  clickMarker = new THREE.Mesh(geo, mat);
  clickMarker.visible = false;
  scene.add(clickMarker);
}

export function initClickControls(walkableObjects = []) {
  createClickMarker();

  const handlePointer = (e) => {
    const targetTag = e.target.tagName;
    if (targetTag === 'INPUT' || targetTag === 'BUTTON' || e.target.closest('#chat')) return;

    if (!walkableObjects.length) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(walkableObjects, true);

    if (intersects.length > 0) {
      const hit = intersects[0].point;

      targetPosition = new THREE.Vector3(hit.x, playerPos.y, hit.z);

      clickMarker.position.set(hit.x, hit.y + 0.05, hit.z);
      clickMarker.visible = true;
      isClickMoving = true;
    }
  };

  window.addEventListener('pointerdown', handlePointer);
}

export function updateClickMovement(delta, playerMesh) {
  if (!targetPosition || !playerPos) {
    isClickMoving = false;
    return;
  }

  const currentPos = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
  
  const dist = new THREE.Vector2(playerPos.x - targetPosition.x, playerPos.z - targetPosition.z).length();

  if (dist > 0.15) {
    const dirX = targetPosition.x - playerPos.x;
    const dirZ = targetPosition.z - playerPos.z;
    const angle = Math.atan2(dirX, dirZ);

    if (playerMesh) {
      playerMesh.rotation.y = angle;
    }

    const moveDist = MOVE_SPEED * delta;
    playerPos.x += (dirX / dist) * moveDist;
    playerPos.z += (dirZ / dist) * moveDist;

    sendPosition(playerPos.x, playerPos.y, playerPos.z, angle);
    isClickMoving = true;
  } else {
    targetPosition = null;
    if (clickMarker) clickMarker.visible = false;
    isClickMoving = false;
  }
}

export function cancelClickMovement() {
  targetPosition = null;
  if (clickMarker) clickMarker.visible = false;
  isClickMoving = false;
}
