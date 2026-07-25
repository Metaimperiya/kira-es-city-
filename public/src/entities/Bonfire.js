// ============================================================
// КОСТЁР (СВЕТ + АНИМАЦИЯ ПЛАМЕНИ)
// ============================================================

import * as THREE from 'three';
import { scene } from '../core/scene.js';

export class Bonfire {
  constructor(x, y, z, intensity = 1.0) {
    this.group = new THREE.Group();
    this.group.position.set(x, y, z);
    
    // --- ОГОНЬ (сфера с анимацией) ---
    const fireGeo = new THREE.SphereGeometry(0.8, 8, 8);
    const fireMat = new THREE.MeshBasicMaterial({ 
      color: 0xff6600,
      transparent: true,
      opacity: 0.9
    });
    this.fire = new THREE.Mesh(fireGeo, fireMat);
    this.fire.position.y = 0.5;
    this.group.add(this.fire);

    // --- ВНУТРЕННЕЕ ЯДРО (ярче) ---
    const coreGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const coreMat = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0.8
    });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.core.position.y = 0.6;
    this.group.add(this.core);

    // --- ОСНОВАНИЕ (камни) ---
    const stoneGeo = new THREE.CylinderGeometry(1.2, 1.5, 0.3, 8);
    const stoneMat = new THREE.MeshPhongMaterial({ 
      color: 0x554433,
      roughness: 0.9,
      emissive: 0x221100,
      emissiveIntensity: 0.1
    });
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.position.y = 0.1;
    this.group.add(stone);

    // --- СВЕТ (динамический) ---
    this.light = new THREE.PointLight(0xff6600, 2.0 * intensity, 15);
    this.light.position.y = 1.5;
    this.group.add(this.light);

    // --- ДЫМ (частицы) ---
    this.particles = [];
    for (let i = 0; i < 10; i++) {
      const size = 0.1 + Math.random() * 0.2;
      const pGeo = new THREE.SphereGeometry(size, 6, 6);
      const pMat = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.3 + Math.random() * 0.3
      });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(
        (Math.random() - 0.5) * 0.5,
        0.8 + Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      p.userData = {
        speed: 0.2 + Math.random() * 0.3,
        offset: Math.random() * 100,
        maxY: 1.5 + Math.random() * 2
      };
      this.group.add(p);
      this.particles.push(p);
    }

    scene.add(this.group);
    this.time = 0;
  }

  update(delta) {
    this.time += delta;

    // --- АНИМАЦИЯ ПЛАМЕНИ (мерцание) ---
    const flicker = 0.7 + Math.sin(this.time * 8) * 0.15 + Math.sin(this.time * 12 + 1) * 0.1;
    this.fire.scale.set(flicker, flicker * (0.8 + Math.sin(this.time * 5) * 0.1), flicker);
    this.fire.position.y = 0.5 + Math.sin(this.time * 6) * 0.1;
    
    // Ядро
    const coreFlicker = 0.8 + Math.sin(this.time * 10 + 2) * 0.15;
    this.core.scale.set(coreFlicker, coreFlicker * (0.9 + Math.sin(this.time * 7) * 0.1), coreFlicker);
    this.core.position.y = 0.6 + Math.sin(this.time * 8) * 0.1;

    // --- ЦВЕТ ПЛАМЕНИ (меняется) ---
    const color = new THREE.Color();
    const hue = 0.08 + Math.sin(this.time * 2) * 0.02;
    color.setHSL(hue, 1, 0.5 + Math.sin(this.time * 3) * 0.1);
    this.fire.material.color.copy(color);
    
    // --- СВЕТ (мерцает) ---
    this.light.intensity = 1.5 + Math.sin(this.time * 7) * 0.5 + Math.sin(this.time * 11 + 3) * 0.3;
    this.light.color.setHSL(0.08 + Math.sin(this.time * 1.5) * 0.02, 1, 0.5);

    // --- ДЫМ (поднимается) ---
    this.particles.forEach((p, i) => {
      p.position.y += p.userData.speed * delta * 0.3;
      p.position.x += Math.sin(this.time * p.userData.speed + p.userData.offset) * delta * 0.1;
      p.position.z += Math.cos(this.time * p.userData.speed * 0.7 + p.userData.offset) * delta * 0.1;
      
      if (p.position.y > p.userData.maxY) {
        p.position.y = 0.8;
        p.position.x = (Math.random() - 0.5) * 0.5;
        p.position.z = (Math.random() - 0.5) * 0.5;
      }
    });
  }
}
