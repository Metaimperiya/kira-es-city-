// ============================================================
// ГЛАВНЫЙ ФАЙЛ
// ============================================================

import * as THREE from 'three';
import { initScene, scene, camera, renderer } from './core/scene.js';
import { createWorld } from './core/world.js';
import { loadShip, mainShip } from './entities/Ship.js';
import { createPlayer, initControls, updatePlayer, setDelta } from './entities/Player/index.js';
import { initClickControls } from './entities/Player/clickControls.js';
import { initSocket } from './network/socket.js';
import { initSync, updateSync } from './network/sync.js';
import { initChat } from './ui/chat.js';
import { updateHUD } from './ui/hud.js';

console.log('🚀 Запуск Angelos City...');

(async function main() {
  initScene();
  createWorld();

  try {
    await loadShip();
    console.log('🚢 Корабль успешно загружен');
  } catch (error) {
    console.error('⚠️ Не удалось загрузить модель корабля:', error);
  }

  initControls();
  createPlayer();
  
  // 🎯 ИНИЦИАЛИЗАЦИЯ КЛИК-УПРАВЛЕНИЯ
  if (mainShip) {
    initClickControls([mainShip]);
    console.log('🖱️ Клик-управление активировано');
  }

  initSocket();
  initSync();
  initChat();
  updateHUD(1);

  console.log('✅ Все системы инициализированы');

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    setDelta(delta);
    updatePlayer();
    updateSync(delta);
    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  console.log('🚢 Angelos City загружен и готов к работе!');
})();
