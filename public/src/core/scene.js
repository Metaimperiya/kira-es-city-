// ============================================================
// СЦЕНА - МАКСИМАЛЬНО ЯРКО
// ============================================================

import * as THREE from 'three';

export let scene, camera, renderer;

export function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.FogExp2(0x87CEEB, 0.002);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 3, 8);
  camera.rotation.order = 'YXZ';

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2.0;
  document.body.prepend(renderer.domElement);

  // --- ГЛАВНЫЙ СВЕТ (сверху) ---
  const topLight = new THREE.DirectionalLight(0xffffff, 2.0);
  topLight.position.set(0, 50, 0);
  topLight.castShadow = false;
  scene.add(topLight);

  // --- СОЛНЦЕ (сбоку) ---
  const sunLight = new THREE.DirectionalLight(0xffeedd, 2.5);
  sunLight.position.set(30, 50, 30);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.1;
  sunLight.shadow.camera.far = 300;
  sunLight.shadow.camera.left = -100;
  sunLight.shadow.camera.right = 100;
  sunLight.shadow.camera.top = 100;
  sunLight.shadow.camera.bottom = -100;
  scene.add(sunLight);

  // --- ЗАЛИВОЧНЫЙ СВЕТ (чтоб тени не были чёрными) ---
  const fillLight = new THREE.DirectionalLight(0x88aaff, 1.0);
  fillLight.position.set(-30, 20, -30);
  scene.add(fillLight);

  // --- РАССЕЯННЫЙ СВЕТ (яркий) ---
  const ambientLight = new THREE.AmbientLight(0x88aaff, 2.0);
  scene.add(ambientLight);

  // --- СВЕТ СНИЗУ (подсветка замка) ---
  const bottomLight = new THREE.PointLight(0xffaa44, 3.0, 100);
  bottomLight.position.set(0, -2, 0);
  scene.add(bottomLight);

  // --- ДОПОЛНИТЕЛЬНЫЙ СВЕТ ВНУТРИ ЗАМКА ---
  const insideLight = new THREE.PointLight(0xffdd88, 2.0, 60);
  insideLight.position.set(0, 15, 0);
  scene.add(insideLight);

  console.log('☀️ Свет включён на максимум!');
}
