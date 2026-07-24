// ============================================================
// ГЛАВНЫЙ ФАЙЛ (С ПРАВИЛЬНЫМ ASYNC)
// ============================================================

import * as THREE from 'three';
import { initScene, scene, camera, renderer } from './core/scene.js';
import { createWorld } from './core/world.js';
import { loadShip } from './entities/Ship.js';
import { createPlayer, initControls, updatePlayer, setDelta } from './entities/Player/index.js';
import { initSocket } from './network/socket.js';
import { initSync } from './network/sync.js';
import { initChat } from './ui/chat.js';
import { updateHUD } from './ui/hud.js';

console.log('🚀 Запуск Angelos City...');

// ✅ ВСЁ ЗАВОРАЧИВАЕМ В ASYNC IIFE
(async function main() {
  initScene();
  createWorld();
  
  await loadShip(); // ✅ Теперь await работает

  initControls();
  createPlayer();
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
