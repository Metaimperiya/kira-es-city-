// ============================================================
// КОСТЁР (СВЕТ + АНИМАЦИЯ ПЛАМЕНИ)
// ============================================================

import * as THREE from 'three';
import { scene } from '../core/scene.js';

export class Bonfire {
  constructor(x, y, z) {
    this.group = new THREE.Group();
    this.group.position.set(x, y, z);
    
    // --- ОГОНЬ ---
    const fireGeo = new THREE.SphereGeometry(0.8, 8, 8);
    const fireMat = new THREE.MeshBasicMaterial({ 
      color: 0xff6600,
      transparent: true,
      opacity: 0.9
    });
    this.fire = new THREE.Mesh(fireGeo, fireMat);
    this.fire.position.y = 0.5;
    this.group.add(this.fire);

    // --- ЯДРО ---
    const coreGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.core.position.y = 0.6;
    this.group.add(this.core);

    // --- ОСНОВАНИЕ ---
    const stoneGeo = new THREE.CylinderGeometry(1.2, 1.5, 0.3, 8);
    const stoneMat = new THREE.MeshPhongMaterial({ color: 0x554433 });
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.position.y = 0.1;
    this.group.add(stone);

    // --- СВЕТ ---
    this.light = new THREE.PointLight(0xff6600, 3.0, 20);
    this.light.position.y = 1.5;
    this.group.add(this.light);

    scene.add(this.group);
    this.time = 0;
  }

  update(delta) {
    this.time += delta;

    // Мерцание
    const flicker = 0.7 + Math.sin(this.time * 8) * 0.15;
    this.fire.scale.set(flicker, flicker, flicker);
    this.fire.position.y = 0.5 + Math.sin(this.time * 6) * 0.1;
    
    this.core.scale.set(
      0.8 + Math.sin(this.time * 10) * 0.15,
      0.8 + Math.sin(this.time * 10) * 0.15,
      0.8 + Math.sin(this.time * 10) * 0.15
    );

    this.light.intensity = 2.0 + Math.sin(this.time * 7) * 0.8;
    this.light.color.setHSL(0.08 + Math.sin(this.time * 1.5) * 0.02, 1, 0.5);
  }
}
