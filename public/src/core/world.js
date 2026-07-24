// ============================================================
// МИР (МОРЕ)
// ============================================================

import * as THREE from 'three';
import { scene } from './scene.js';

export function createWorld() {
  const seaGeo = new THREE.PlaneGeometry(400, 400);
  const seaMat = new THREE.MeshPhongMaterial({
    color: 0x0a3a5a,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });
  const sea = new THREE.Mesh(seaGeo, seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.5;
  sea.receiveShadow = true;
  scene.add(sea);

  console.log('🌊 Море создано');
}
