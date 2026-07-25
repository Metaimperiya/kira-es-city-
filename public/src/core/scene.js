// ============================================================
// СЦЕНА - ЯРКИЙ ДЕНЬ + СВЕТ СНИЗУ
// ============================================================

import * as THREE from 'three';

export let scene, camera, renderer;

export function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.FogExp2(0x87CEEB, 0.003);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 3, 8);
  camera.rotation.order = 'YXZ';

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  document.body.prepend(renderer.domElement);

  // --- СОЛНЦЕ ---
  const sunLight = new THREE.DirectionalLight(0xffeedd, 2.5);
  sunLight.position.set(50, 100, 50);
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

  // --- ЗАЛИВОЧНЫЙ СВЕТ ---
  const fillLight = new THREE.DirectionalLight(0x4488ff, 0.6);
  fillLight.position.set(-50, 30, -50);
  scene.add(fillLight);

  // --- РАССЕЯННЫЙ СВЕТ (усилен) ---
  const ambientLight = new THREE.AmbientLight(0x88aaff, 1.5);
  scene.add(ambientLight);

  // --- СВЕТ СНИЗУ (для подсветки внутри замка) ---
  const bottomLight = new THREE.PointLight(0xffaa44, 1.5, 100);
  bottomLight.position.set(0, -5, 0);
  scene.add(bottomLight);

  // --- СОЛНЦЕ (визуальный шар) ---
  const sunGeo = new THREE.SphereGeometry(5, 16, 16);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffff88 });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.position.set(80, 120, 80);
  scene.add(sunMesh);

  console.log('☀️ Яркий день включён!');
}
