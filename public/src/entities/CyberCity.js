// ============================================================
// ГЛАВНЫЙ ФАЙЛ
// ============================================================

import * as THREE from 'three';
import { initScene, scene, camera, renderer } from './core/scene.js';
import { createWorld } from './core/world.js';
import { createCyberCity } from './entities/CyberCity.js';
import { createPlayer, initControls, updatePlayer, setDelta } from './entities/Player/index.js';
import { initSocket } from './network/socket.js';
import { initSync } from './network/sync.js';
import { initChat } from './ui/chat.js';
import { updateHUD } from './ui/hud.js';

console.log('🚀 Запуск Kira ES City с Кибер-Городом...');

initScene();
createWorld();

const cityGroup = createCyberCity();
scene.add(cityGroup);

camera.position.set(30, 25, 40);
camera.lookAt(0, 0, 0);

initControls();
createPlayer();
initSocket();
initSync();
initChat();
updateHUD(1);

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
