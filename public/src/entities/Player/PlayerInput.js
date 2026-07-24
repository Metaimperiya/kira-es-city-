import { renderer } from '../../core/scene.js';

export const PlayerInput = {
  keys: {},
  mouseX: 0,
  mouseY: 0,
  mouseLocked: false,
  touchMove: { x: 0, y: 0 },
  touchLook: { x: 0, y: 0 },
  jump: false,

  init() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    });

    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      if (!this.mouseLocked && renderer?.domElement) {
        renderer.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.mouseLocked = document.pointerLockElement === renderer.domElement;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.mouseLocked) return;
      this.mouseX += e.movementX;
      this.mouseY += e.movementY;
    });

    this.initTouch();
  },

  initTouch() {
    const moveZone = document.createElement('div');
    moveZone.style.cssText = 'position:absolute;top:0;left:0;width:50%;height:100%;z-index:40;touch-action:none;';
    document.body.appendChild(moveZone);

    const lookZone = document.createElement('div');
    lookZone.style.cssText = 'position:absolute;top:0;right:0;width:50%;height:100%;z-index:40;touch-action:none;';
    document.body.appendChild(lookZone);

    let moveId = null,
      lookId = null;
    let lastMove = { x: 0, y: 0 };
    let lastLook = { x: 0, y: 0 };

    moveZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      moveId = t.identifier;
      lastMove = { x: t.clientX, y: t.clientY };
      this.touchMove = { x: 0, y: 0 };
    });

    moveZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === moveId) {
          this.touchMove.x = t.clientX - lastMove.x;
          this.touchMove.y = t.clientY - lastMove.y;
          lastMove = { x: t.clientX, y: t.clientY };
        }
      }
    });

    const resetMove = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === moveId) {
          moveId = null;
          this.touchMove = { x: 0, y: 0 };
        }
      }
    };
    moveZone.addEventListener('touchend', resetMove);
    moveZone.addEventListener('touchcancel', () => { moveId = null;
      this.touchMove = { x: 0, y: 0 }; });

    lookZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      lookId = t.identifier;
      lastLook = { x: t.clientX, y: t.clientY };
      this.touchLook = { x: 0, y: 0 };
    });

    lookZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === lookId) {
          this.touchLook.x += t.clientX - lastLook.x;
          this.touchLook.y += t.clientY - lastLook.y;
          lastLook = { x: t.clientX, y: t.clientY };
        }
      }
    });

    const resetLook = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === lookId) {
          lookId = null;
          this.touchLook = { x: 0, y: 0 };
        }
      }
    };
    lookZone.addEventListener('touchend', resetLook);
    lookZone.addEventListener('touchcancel', () => { lookId = null;
      this.touchLook = { x: 0, y: 0 }; });

    const jumpBtn = document.getElementById('jump-btn');
    if (jumpBtn) {
      jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.jump = true;
      });
      jumpBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.jump = false;
      });
    }
  },

  getInput() {
    let moveZ = 0;
    if (this.keys['w'] || this.keys['keyw'] || this.keys['arrowup']) moveZ += 1;
    if (this.keys['s'] || this.keys['keys'] || this.keys['arrowdown']) moveZ -= 1;

    let moveX = 0;
    if (this.keys['d'] || this.keys['keyd'] || this.keys['arrowright']) moveX += 1;
    if (this.keys['a'] || this.keys['keya'] || this.keys['arrowleft']) moveX -= 1;

    const tx = this.touchMove.x * 0.02;
    const tz = -this.touchMove.y * 0.02;

    const result = {
      moveX: moveX + tx,
      moveZ: moveZ + tz,
      mouseX: this.mouseX,
      mouseY: this.mouseY,
      touchLookX: this.touchLook.x,
      touchLookY: this.touchLook.y,
      jump: this.keys['space'] || this.keys['Space'] || this.jump
    };

    this.resetMouse();
    return result;
  },

  resetMouse() {
    this.mouseX = 0;
    this.mouseY = 0;
    this.touchLook = { x: 0, y: 0 };
  }
};
