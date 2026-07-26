// ============================================================
// ФИЗИКА И ДВИЖЕНИЕ
// ============================================================

import * as THREE from 'three';
import { PlayerCamera } from './PlayerCamera.js';
import { mainShip } from '../Ship.js';

const downRaycaster = new THREE.Raycaster();
const forwardRaycaster = new THREE.Raycaster();
const stepRaycaster = new THREE.Raycaster();

const downVector = new THREE.Vector3(0, -1, 0);
const moveVector = new THREE.Vector3();
const rayOrigin = new THREE.Vector3();

// Максимальная высота ступеньки/бордюра, на которую запрыгиваем автоматом
const MAX_STEP_HEIGHT = 0.6; 

export const PlayerController = {
  group: null,
  pos: null,
  velocityY: 0,
  isGrounded: true,
  rotation: 0,

  init(group, pos) {
    this.group = group;
    this.pos = pos;
  },

  update(input, delta) {
    let moveX = input.moveX;
    let moveZ = input.moveZ;

    const speed = 11;
    let moved = false;

    if (Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05) {
      const len = Math.hypot(moveX, moveZ);
      const normX = moveX / len;
      const normZ = moveZ / len;

      const yaw = PlayerCamera.euler.y;
      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);

      let dx = (-normZ * sin + normX * cos) * speed * delta;
      let dz = (-normZ * cos - normX * sin) * speed * delta;

      if (mainShip) {
        // --- ПРОВЕРКА ПО ОСИ X ---
        if (dx !== 0) {
          moveVector.set(Math.sign(dx), 0, 0);
          // 1. Проверяем препятствие у ног (высота 0.25)
          rayOrigin.set(this.pos.x, this.pos.y + 0.25, this.pos.z);
          forwardRaycaster.set(rayOrigin, moveVector);
          const hits = forwardRaycaster.intersectObject(mainShip, true);

          if (hits.length > 0 && hits[0].distance < 0.7) {
            if (Math.abs(hits[0].face.normal.y) < 0.5) {
              // 2. Проверяем, свободен ли путь чуть выше (зашагивание на ступеньку)
              rayOrigin.set(this.pos.x, this.pos.y + MAX_STEP_HEIGHT, this.pos.z);
              stepRaycaster.set(rayOrigin, moveVector);
              const stepHits = stepRaycaster.intersectObject(mainShip, true);

              // Если сверху пусто или препятствие дальше — подтягиваем Y вверх
              if (stepHits.length === 0 || stepHits[0].distance >= 0.7) {
                this.pos.y += 0.15; 
              } else {
                dx = 0; // Иначе это высокая стена, блокируем
              }
            }
          }
        }

        // --- ПРОВЕРКА ПО ОСИ Z ---
        if (dz !== 0) {
          moveVector.set(0, 0, Math.sign(dz));
          // 1. Проверяем препятствие у ног (высота 0.25)
          rayOrigin.set(this.pos.x + dx, this.pos.y + 0.25, this.pos.z);
          forwardRaycaster.set(rayOrigin, moveVector);
          const hits = forwardRaycaster.intersectObject(mainShip, true);

          if (hits.length > 0 && hits[0].distance < 0.7) {
            if (Math.abs(hits[0].face.normal.y) < 0.5) {
              // 2. Проверяем, свободен ли путь чуть выше
              rayOrigin.set(this.pos.x + dx, this.pos.y + MAX_STEP_HEIGHT, this.pos.z);
              stepRaycaster.set(rayOrigin, moveVector);
              const stepHits = stepRaycaster.intersectObject(mainShip, true);

              if (stepHits.length === 0 || stepHits[0].distance >= 0.7) {
                this.pos.y += 0.15;
              } else {
                dz = 0; // Иначе высокая стена
              }
            }
          }
        }
      }

      this.pos.x += dx;
      this.pos.z += dz;
      moved = true;

      this.rotation = Math.atan2(dx, dz);
      this.group.rotation.y = this.rotation;
    }

    // --- ПРОВЕРКА ПОЛА И ГРАВИТАЦИЯ ---
    let floorY = 0;
    if (mainShip) {
      rayOrigin.set(this.pos.x, this.pos.y + 3, this.pos.z);
      downRaycaster.set(rayOrigin, downVector);
      const hits = downRaycaster.intersectObject(mainShip, true);

      if (hits.length > 0) {
        const hit = hits[0];
        if (hit.point.y >= -1 && (this.pos.y + 3 - hit.point.y) <= 20) {
          floorY = hit.point.y;
        }
      }
    }

    const jumpForce = 7;
    const gravity = -20;

    if (input.jump && this.isGrounded) {
      this.velocityY = jumpForce;
      this.isGrounded = false;
    }

    if (this.pos.y > floorY + 0.2 && this.isGrounded) {
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.velocityY += gravity * delta;
      this.pos.y += this.velocityY * delta;

      if (this.pos.y <= floorY) {
        this.pos.y = floorY;
        this.velocityY = 0;
        this.isGrounded = true;
      }
    } else {
      // Плавное притягивание к полу (включая подъем по ступенькам вверх)
      this.pos.y = floorY;
    }

    this.group.position.set(this.pos.x, this.pos.y, this.pos.z);

    return moved;
  },

  getRotation() {
    return this.rotation;
  }
};
