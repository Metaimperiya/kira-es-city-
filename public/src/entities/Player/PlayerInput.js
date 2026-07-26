// ============================================================
// ВВОД (КЛАВИАТУРА, МЫШЬ, ТЕЛЕФОН)
// ============================================================
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
      // Регистрируем e.key (в нижнем регистре) и e.code (как есть, так и в нижнем регистре для надежности)
      if (e.key) this.keys[e.key.toLowerCase()] = true;
      if (e.code) {
        this.keys[e.code] = true;
        this.keys[e.code.toLowerCase()] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key) this.keys[e.key.toLowerCase()] = false;
      if (e.code) {
        this.keys[e.code] = false;
        this.keys[e.code.toLowerCase()] = false;
      }
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
    // Зона для поворота камеры (правая сторона экрана)
    const lookZone = document.createElement('div');
    lookZone.style.cssText = 'position:absolute;top:0;right:0;width:50%;height:100%;z-index:40;touch-action:none;';
    document.body.appendChild(lookZone);

    let lookId = null;
    let startLook = { x: 0, y: 0 };
    let lastLook = { x: 0, y: 0 };
    let isDragging = false;
    const SWIPE_THRESHOLD = 8; // Порог в пикселях, чтобы отличить тап (клик) от свайпа

    lookZone.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      lookId = t.identifier;
      startLook = { x: t.clientX, y: t.clientY };
      lastLook = { x: t.clientX, y: t.clientY };
      isDragging = false;
      this.touchLook = { x: 0, y: 0 };
    }, { passive: true });

    lookZone.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === lookId) {
          const dx = t.clientX - startLook.x;
          const dy = t.clientY - startLook.y;

          // Если палец сдвинулся дальше порога — это свайп (вращение камеры)
          if (!isDragging && Math.hypot(dx, dy) > SWIPE_THRESHOLD) {
            isDragging = true;
          }

          if (isDragging) {
            if (e.cancelable) e.preventDefault(); // Блокируем скролл страницы при вращении
            this.touchLook.x += t.clientX - lastLook.x;
            this.touchLook.y += t.clientY - lastLook.y;
            lastLook = { x: t.clientX, y: t.clientY };
          }
        }
      }
    }, { passive: false });

    const resetLook = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === lookId) {
          // Если это был просто короткий клик (не свайп), то e.preventDefault() НЕ вызывался, 
          // и событие спокойно долетит до клика по земле (clickControls.js)
          lookId = null;
          this.touchLook = { x: 0, y: 0 };
        }
      }
    };

    lookZone.addEventListener('touchend', resetLook);
    lookZone.addEventListener('touchcancel', () => { lookId = null; this.touchLook = { x: 0, y: 0 }; });

    // Кнопка прыжка
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
    // Теперь проверяем и букву (w/ц), и код клавиши (KeyW / keyw)
    if (this.keys['w'] || this.keys['ц'] || this.keys['keyw'] || this.keys['arrowup']) moveZ += 1;
    if (this.keys['s'] || this.keys['ы'] || this.keys['keys'] || this.keys['arrowdown']) moveZ -= 1;

    let moveX = 0;
    if (this.keys['d'] || this.keys['в'] || this.keys['keyd'] || this.keys['arrowright']) moveX += 1;
    if (this.keys['a'] || this.keys['ф'] || this.keys['keya'] || this.keys['arrowleft']) moveX -= 1;

    const tx = this.touchMove.x * 0.02;
    const tz = -this.touchMove.y * 0.02;

    const result = {
      moveX: moveX + tx,
      moveZ: moveZ + tz,
      mouseX: this.mouseX,
      mouseY: this.mouseY,
      touchLookX: this.touchLook.x,
      touchLookY: this.touchLook.y,
      jump: this.keys['space'] || this.keys['Space'] || this.keys['spacebar'] || this.jump
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
