// ============================================================
// СЦЕНА - МАКСИМАЛЬНО ЯРКО
// ============================================================

import * as THREE from 'three';

export let scene, camera, renderer;

export function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.FogExp2(0x87CEEB, 0.001);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 3, 8);
  camera.rotation.order = 'YXZ';

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2.5;
  document.body.prepend(renderer.domElement);

  // --- СОЛНЦЕ ---
  const sunLight = new THREE.DirectionalLight(0xffeedd, 4.0);
  sunLight.position.set(30, 80, 30);
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

  // --- ВТОРОЕ СОЛНЦЕ ---
  const sunLight2 = new THREE.DirectionalLight(0xffffff, 2.0);
  sunLight2.position.set(-30, 60, -30);
  scene.add(sunLight2);

  // --- СВЕТ СВЕРХУ ---
  const topLight = new THREE.DirectionalLight(0xffffff, 2.5);
  topLight.position.set(0, 100, 0);
  scene.add(topLight);

  // --- ЗАЛИВОЧНЫЙ СВЕТ ---
  const fillLight = new THREE.DirectionalLight(0x88aaff, 1.5);
  fillLight.position.set(-50, 30, -50);
  scene.add(fillLight);

  // --- РАССЕЯННЫЙ СВЕТ ---
  const ambientLight = new THREE.AmbientLight(0x88aaff, 2.5);
  scene.add(ambientLight);

  // --- СВЕТ СНИЗУ ---
  const bottomLight = new THREE.PointLight(0xffaa44, 4.0, 100);
  bottomLight.position.set(0, -2, 0);
  scene.add(bottomLight);

  // --- СВЕТ ВНУТРИ ЗАМКА ---
  const insideLight = new THREE.PointLight(0xffdd88, 3.0, 60);
  insideLight.position.set(0, 15, 0);
  scene.add(insideLight);

  // --- ДОПОЛНИТЕЛЬНЫЙ СВЕТ СБОКУ ---
  const sideLight = new THREE.PointLight(0x88ddff, 2.0, 80);
  sideLight.position.set(20, 10, 20);
  scene.add(sideLight);

  // --- ВИЗУАЛЬНОЕ СОЛНЦЕ ---
  const sunGeo = new THREE.SphereGeometry(10, 16, 16);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.position.set(50, 120, 50);
  scene.add(sunMesh);

  console.log('☀️ СВЕТ НА МАКСИМУМ!');
}
