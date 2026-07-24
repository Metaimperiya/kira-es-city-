import * as THREE from 'three';

export let scene, camera, renderer;

export function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a1a);
  scene.fog = new THREE.FogExp2(0x0a0a1a, 0.008);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 3, 8);
  camera.rotation.order = 'YXZ';

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  document.body.prepend(renderer.domElement);

  const ambient = new THREE.AmbientLight(0x222244, 0.6);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0x88ccff, 1.5);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const backLight = new THREE.DirectionalLight(0xff4488, 0.4);
  backLight.position.set(-5, 5, -10);
  scene.add(backLight);

  const bottomLight = new THREE.PointLight(0x00f3ff, 0.8, 20);
  bottomLight.position.set(0, -2, 0);
  scene.add(bottomLight);
}
