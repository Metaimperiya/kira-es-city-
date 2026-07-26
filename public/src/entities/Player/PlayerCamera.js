// ============================================================
// КАМЕРА ОТ ТРЕТЬЕГО ЛИЦА С ДИНАМИЧЕСКИМ ЗУМОМ (DIABLO-STYLE)
// ============================================================

import * as THREE from 'three';

export const PlayerCamera = {
  camera: null,
  euler: { x: 0.2, y: 0 },
  sensitivity: 0.0025,
  
  // Зум (расстояние)
  distance: 6,
  minDistance: 2,   // Близко (почти от 1-го лица)
  maxDistance: 45,  // Далеко (вид сверху как в Diablo)
  zoomSpeed: 0.01,

  init(camera) {
    this.camera = camera;

    // Считаем прокрутку колёсика мыши
    window.addEventListener('wheel', (e) => {
      // Игнорируем зум, если курсор находится в поле ввода чата/инпута
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      // Меняем дистанцию
      this.distance += e.deltaY * this.zoomSpeed;
      this.distance = THREE.MathUtils.clamp(this.distance, this.minDistance, this.maxDistance);
    }, { passive: true });
  },

  update(playerPos, input) {
    // Вращение мыши/тача
    this.euler.y -= input.mouseX * this.sensitivity;
    this.euler.x -= input.mouseY * this.sensitivity;

    if (Math.abs(input.touchLookX) > 0.1 || Math.abs(input.touchLookY) > 0.1) {
      this.euler.y -= input.touchLookX * this.sensitivity * 2;
      this.euler.x -= input.touchLookY * this.sensitivity * 2;
    }

    // 💡 Чем дальше камера, тем круче угол наклона вниз (до ~85 градусов)
    // Это как раз даёт тот самый изометрический вид сверху, как в RPG
    const maxAngle = THREE.MathUtils.lerp(1.1, 1.48, (this.distance - this.minDistance) / (this.maxDistance - this.minDistance));
    this.euler.x = Math.max(-0.2, Math.min(maxAngle, this.euler.x));

    const horizDist = this.distance * Math.cos(this.euler.x);
    const vertDist = this.distance * Math.sin(this.euler.x);

    const targetY = playerPos.y + 1.5;
    let targetCamY = targetY + vertDist;

    const minCameraHeight = 0.4;
    if (targetCamY < minCameraHeight) {
      targetCamY = minCameraHeight;
    }

    const targetCamPos = new THREE.Vector3(
      playerPos.x + horizDist * Math.sin(this.euler.y),
      targetCamY,
      playerPos.z + horizDist * Math.cos(this.euler.y)
    );

    // Плавный заезд камеры в нужную точку
    this.camera.position.lerp(targetCamPos, 0.2);
    this.camera.lookAt(playerPos.x, targetY, playerPos.z);
  }
};
