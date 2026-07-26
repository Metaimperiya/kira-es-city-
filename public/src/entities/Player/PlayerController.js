// ============================================================
// ФИЗИКА, ДВИЖЕНИЕ И КОЛЛИЗИИ
// ============================================================

import * as THREE from 'three';
import { PlayerCamera } from './PlayerCamera.js';

const MAX_STEP_HEIGHT = 0.7;

export const PlayerController = {
  group: null,
  pos: null,
  velocityY: 0,
  isGrounded: true,
  rotation: 0,
  colliders: [],

  init(group, pos) {
    this.group = group;
    this.pos = pos;
    this.colliders = [];
  },

  addCollider(mesh) {
    if (mesh && mesh.isMesh) {
      this.colliders.push(mesh);
    }
  },

  checkCollision(posX, posZ, mesh) {
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    
    const bbox = mesh.geometry.boundingBox;
    if (!bbox) return false;
    
    const scale = mesh.scale;
    const halfW = (bbox.max.x - bbox.min.x) * scale.x / 2;
    const halfD = (bbox.max.z - bbox.min.z) * scale.z / 2;
    const playerRadius = 0.5;

    return posX > worldPos.x - halfW - playerRadius &&
           posX < worldPos.x + halfW + playerRadius &&
           posZ > worldPos.z - halfD - playerRadius &&
           posZ < worldPos.z + halfD + playerRadius;
  },

  update(input, delta) {
    let moveX = input.moveX || 0;
    let moveZ = input.moveZ || 0;

    const speed = 11;
    let moved = false;

    if (Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05) {
      const len = Math.hypot(moveX, moveZ);
      moveX /= len;
      moveZ /= len;

      const yaw = PlayerCamera.euler?.y || 0;
      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);

      let dx = (-moveZ * sin + moveX * cos) * speed * delta;
      let dz = (-moveZ * cos - moveX * sin) * speed * delta;

      let blockedX = false;
      for (const collider of this.colliders) {
        if (this.checkCollision(this.pos.x + dx, this.pos.z, collider)) {
          blockedX = true;
          break;
        }
      }
      if (!blockedX) {
        this.pos.x += dx;
        moved = true;
      }

      let blockedZ = false;
      for (const collider of this.colliders) {
        if (this.checkCollision(this.pos.x, this.pos.z + dz, collider)) {
          blockedZ = true;
          break;
        }
      }
      if (!blockedZ) {
        this.pos.z += dz;
        moved = true;
      }

      if (moved) {
        this.rotation = Math.atan2(moveX, moveZ);
        this.group.rotation.y = this.rotation;
      }
    }

    const floorY = 0;
    const jumpForce = 7;
    const gravity = -20;

    if (input.jump && this.isGrounded) {
      this.velocityY = jumpForce;
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
      this.pos.y = floorY;
    }

    this.group.position.set(this.pos.x, this.pos.y, this.pos.z);
    return moved;
  },

  getRotation() {
    return this.rotation;
  }
};
