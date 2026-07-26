import * as THREE from 'three';

export let scene, camera, renderer;
export let player, leftArm, rightArm, leftLeg, rightLeg;

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

  // Свет
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

  // Создаем персонажа и запускаем цикл
  createPlayer();
  animate();
}

// Процедурный персонаж со связками суставов
function createPlayer() {
  player = new THREE.Group();
  scene.add(player);

  const mat = new THREE.MeshStandardMaterial({ color: 0x00f3ff, roughness: 0.3 });

  // Тело
  const bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.4);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.y = 1.2;
  body.castShadow = true;
  player.add(body);

  // Голова
  const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const head = new THREE.Mesh(headGeo, mat);
  head.position.y = 2.1;
  head.castShadow = true;
  player.add(head);

  // Руки (контейнеры для вращения от плеча)
  const armGeo = new THREE.BoxGeometry(0.25, 0.9, 0.25);

  leftArm = new THREE.Group();
  leftArm.position.set(-0.55, 1.7, 0);
  const leftArmMesh = new THREE.Mesh(armGeo, mat);
  leftArmMesh.position.y = -0.45; // Смещение геометрии вниз относительно точки вращения
  leftArm.add(leftArmMesh);
  player.add(leftArm);

  rightArm = new THREE.Group();
  rightArm.position.set(0.55, 1.7, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, mat);
  rightArmMesh.position.y = -0.45;
  rightArm.add(rightArmMesh);
  player.add(rightArm);

  // Ноги (контейнеры для вращения от бедра)
  const legGeo = new THREE.BoxGeometry(0.3, 1.0, 0.3);

  leftLeg = new THREE.Group();
  leftLeg.position.set(-0.25, 0.6, 0);
  const leftLegMesh = new THREE.Mesh(legGeo, mat);
  leftLegMesh.position.y = -0.5;
  leftLeg.add(leftLegMesh);
  player.add(leftLeg);

  rightLeg = new THREE.Group();
  rightLeg.position.set(0.25, 0.6, 0);
  const rightLegMesh = new THREE.Mesh(legGeo, mat);
  rightLegMesh.position.y = -0.5;
  rightLeg.add(rightLegMesh);
  player.add(rightLeg);
}

// Главный цикл анимации
let clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime() * 8; // Скорость махов

  // Анимация махов рук и ног (синусоида)
  if (leftArm && rightArm && leftLeg && rightLeg) {
    leftArm.rotation.x = Math.sin(time) * 0.6;
    rightArm.rotation.x = -Math.sin(time) * 0.6;
    
    leftLeg.rotation.x = -Math.sin(time) * 0.6;
    rightLeg.rotation.x = Math.sin(time) * 0.6;
  }

  renderer.render(scene, camera);
}
