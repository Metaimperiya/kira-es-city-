import * as THREE from 'three';

export const PlayerCamera = {
  camera: null,
  euler: { x: 0.2, y: 0 },
  sensitivity: 0.0025,
  distance: 6,

  init(camera) {
    this.camera = camera;
  },

  update(playerPos, input) {
    this.euler.y -= input.mouseX * this.sensitivity;
    this.euler.x -= input.mouseY * this.sensitivity;

    if (Math.abs(input.touchLookX) > 0.1 || Math.abs(input.touchLookY) > 0.1) {
      this.euler.y -= input.touchLookX * this.sensitivity * 2;
      this.euler.x -= input.touchLookY * this.sensitivity * 2;
    }

    this.euler.x = Math.max(-0.2, Math.min(1.2, this.euler.x));

    const horizDist = this.distance * Math.cos(this.euler.x);
    const vertDist = this.distance * Math.sin(this.euler.x);
    const targetY = playerPos.y + 1.5;
    let targetCamY = targetY + vertDist;
    if (targetCamY < 0.4) targetCamY = 0.4;

    const targetCamPos = new THREE.Vector3(
      playerPos.x + horizDist * Math.sin(this.euler.y),
      targetCamY,
      playerPos.z + horizDist * Math.cos(this.euler.y)
    );

    this.camera.position.lerp(targetCamPos, 0.2);
    this.camera.lookAt(playerPos.x, targetY, playerPos.z);
  }
};
