// ============================================================
// КИБЕРПАНК-ГОРОД (ПЕРЕНЕСЁН ИЗ ДЕМКИ)
// ============================================================

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';

// ============================================================
// 1. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

const lineMaterials = [];
const neonMaterials = [];
const flameMaterials = [];

function registerLineMaterial(mat) {
  mat.resolution.set(window.innerWidth, window.innerHeight);
  mat.depthWrite = false;
  mat.transparent = true;
  mat.userData.baseOpacity = mat.opacity ?? 1;
  mat.userData.baseLinewidth = mat.linewidth ?? 2.5;
  lineMaterials.push(mat);
  return mat;
}

function makeLineMat(color, linewidth = 2.6, opacity = 1.0) {
  return registerLineMaterial(new LineMaterial({
    color,
    linewidth,
    transparent: true,
    opacity,
    worldUnits: false,
    dashed: false,
    alphaToCoverage: true,
    toneMapped: true
  }));
}

function createSolidMaterial(colorHex, metalness = 0.8, roughness = 0.25, opacity = 0.34) {
  return new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness,
    roughness,
    transparent: true,
    opacity,
    polygonOffset: true,
    polygonOffsetFactor: 1.5,
    polygonOffsetUnits: 1.5
  });
}

function createSolidWithEdges(geometry, solidMaterial, edgeMaterial) {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(geometry, solidMaterial);
  group.add(mesh);
  const edges = new THREE.EdgesGeometry(geometry, 15);
  const positions = Array.from(edges.attributes.position.array);
  const g = new LineSegmentsGeometry();
  g.setPositions(positions);
  const lines = new LineSegments2(g, edgeMaterial);
  lines.computeLineDistances();
  group.add(lines);
  return group;
}

function edgesToLineSegments(geometry, material, threshold = 10) {
  const edges = new THREE.EdgesGeometry(geometry, threshold);
  const positions = Array.from(edges.attributes.position.array);
  const g = new LineSegmentsGeometry();
  g.setPositions(positions);
  const lines = new LineSegments2(g, material);
  lines.computeLineDistances();
  return lines;
}

function pointsToLine2(points, material) {
  const flat = [];
  for (const p of points) flat.push(p.x, p.y, p.z);
  const g = new LineGeometry();
  g.setPositions(flat);
  const line = new Line2(g, material);
  line.computeLineDistances();
  return line;
}

function segmentsToLineSegments(segmentsFlatArray, material) {
  const g = new LineSegmentsGeometry();
  g.setPositions(segmentsFlatArray);
  const lines = new LineSegments2(g, material);
  lines.computeLineDistances();
  return lines;
}

function createGlowTexture(size = 256, mode = "cyan") {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.5);
  if (mode === "fire") {
    g.addColorStop(0.0, 'rgba(255,255,255,1.0)');
    g.addColorStop(0.12, 'rgba(255,218,95,0.95)');
    g.addColorStop(0.36, 'rgba(255,88,26,0.62)');
    g.addColorStop(0.72, 'rgba(255,42,133,0.25)');
    g.addColorStop(1.0, 'rgba(0,0,0,0.0)');
  } else {
    g.addColorStop(0.0, 'rgba(255,255,255,1.0)');
    g.addColorStop(0.15, 'rgba(0,240,255,0.92)');
    g.addColorStop(0.45, 'rgba(138,43,226,0.32)');
    g.addColorStop(1.0, 'rgba(0,0,0,0.0)');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeRandom(seed = 123) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeNeonMeshMaterial(colorA, colorB) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      colorA: { value: new THREE.Color(colorA) },
      colorB: { value: new THREE.Color(colorB) }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorld;
      void main() {
        vUv = uv;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 colorA;
      uniform vec3 colorB;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorld;
      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float noise2D(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      void main() {
        float n = noise2D(vWorld.xz * 0.12 + time * 0.02);
        float moon = clamp(dot(normalize(vNormal), normalize(vec3(-0.55, 0.75, -0.36))) * 0.5 + 0.5, 0.0, 1.0);
        vec3 base = mix(colorA, colorB, n);
        base *= 0.16 + moon * 0.58;
        vec2 gridUV = fract(vWorld.xz * 0.25);
        float lineW = 0.028;
        float gridX = 1.0 - smoothstep(0.0, lineW, gridUV.x) * smoothstep(1.0, 1.0 - lineW, gridUV.x);
        float gridY = 1.0 - smoothstep(0.0, lineW, gridUV.y) * smoothstep(1.0, 1.0 - lineW, gridUV.y);
        float grid = max(gridX, gridY);
        float distFade = max(0.0, 1.0 - length(vWorld.xz) / 66.0);
        base += vec3(0.02, 0.10, 0.22) * grid * distFade;
        base += vec3(0.01, 0.01, 0.025);
        gl_FragColor = vec4(base, 1.0);
      }
    `
  });
  neonMaterials.push(mat);
  return mat;
}

function makeFlameMaterial() {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      power: { value: 1.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vLocal;
      void main() {
        vUv = uv;
        vLocal = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float power;
      varying vec2 vUv;
      varying vec3 vLocal;
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      void main() {
        float tail = 1.0 - vUv.y;
        float core = smoothstep(0.55, 0.0, abs(vUv.x - 0.5));
        float n = noise(vec2(vUv.x * 7.0, vUv.y * 14.0 - time * 8.0));
        float flicker = 0.7 + 0.3 * sin(time * 23.0 + n * 6.0);
        float a = core * smoothstep(1.0, 0.08, vUv.y) * (0.45 + n * 0.85) * flicker * power;
        vec3 hot = vec3(1.0, 0.86, 0.32);
        vec3 orange = vec3(1.0, 0.24, 0.04);
        vec3 magenta = vec3(1.0, 0.03, 0.42);
        vec3 color = mix(hot, orange, smoothstep(0.0, 0.5, vUv.y));
        color = mix(color, magenta, smoothstep(0.42, 1.0, vUv.y));
        gl_FragColor = vec4(color * (1.35 + tail * 0.6), a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  flameMaterials.push(mat);
  return mat;
}

// ============================================================
// 2. ФУНКЦИЯ СОЗДАНИЯ КИБЕР-ГОРОДА
// ============================================================

export function createCyberCity() {
  const group = new THREE.Group();

  const random = makeRandom(789);

  // ----- МАТЕРИАЛЫ -----
  const terrainMaterial = makeNeonMeshMaterial('#020713', '#070b20');
  const solidBuildingMaterial = createSolidMaterial(0x050711, 0.72, 0.28, 0.38);
  const neonPurple = makeLineMat('#a855f7', 3.0, 0.95);
  const neonPink = makeLineMat('#ff2a85', 2.8, 1.0);
  const neonCyan = makeLineMat('#00f0ff', 2.6, 1.0);
  const neonAmber = makeLineMat('#ffb84a', 2.0, 0.86);

  // ----- ТЕРРЕЙН -----
  function terrainHeight(x, z) {
    const broad = Math.sin(x * 0.11) * 0.45 + Math.cos(z * 0.08) * 0.35 + Math.sin((x + z) * 0.05) * 0.2;
    function roadCurveX(z) { return Math.sin(z * 0.085) * 3.2 + Math.sin(z * 0.18 + 1.4) * 1.25; }
    const roadFlatten = Math.exp(-Math.pow((x - roadCurveX(z)) / 4.8, 2.0)) * 0.5;
    return broad - roadFlatten;
  }

  const geo = new THREE.PlaneGeometry(120, 120, 64, 64);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, terrainHeight(x, z));
  }
  geo.computeVertexNormals();
  const terrain = new THREE.Mesh(geo, terrainMaterial);
  group.add(terrain);

  // ----- ДОРОГА -----
  function roadCurveX(z) { return Math.sin(z * 0.085) * 3.2 + Math.sin(z * 0.18 + 1.4) * 1.25; }
  function roadDerivative(z) { return Math.cos(z * 0.085) * 0.272 + Math.cos(z * 0.18 + 1.4) * 0.225; }

  const width = 6.0;
  const length = 100;
  const segments = 120;
  const roadPositions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = -length * 0.5 + t * length;
    const cx = roadCurveX(z);
    const dx = roadDerivative(z);
    const nx = 1.0;
    const nz = -dx;
    const inv = 1.0 / Math.sqrt(nx * nx + nz * nz);
    const ox = nx * inv * width * 0.5;
    const oz = nz * inv * width * 0.5;
    const leftX = cx - ox;
    const leftZ = z - oz;
    const rightX = cx + ox;
    const rightZ = z + oz;
    const yL = terrainHeight(leftX, leftZ) + 0.05;
    const yR = terrainHeight(rightX, rightZ) + 0.05;
    roadPositions.push(leftX, yL, leftZ, rightX, yR, rightZ);
    uvs.push(0, t, 1, t);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  roadGeo.setIndex(indices);
  roadGeo.computeVertexNormals();

  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a1a,
    metalness: 0.3,
    roughness: 0.7,
    transparent: true,
    opacity: 0.6
  });
  const road = new THREE.Mesh(roadGeo, roadMat);
  group.add(road);

  const edgeMat = makeLineMat('#00f0ff', 3.6, 1.0);
  const leftPts = [];
  const rightPts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = -length * 0.5 + t * length;
    const cx = roadCurveX(z);
    const dx = roadDerivative(z);
    const nx = 1.0;
    const nz = -dx;
    const inv = 1.0 / Math.sqrt(nx * nx + nz * nz);
    const ox = nx * inv * width * 0.5;
    const oz = nz * inv * width * 0.5;
    const leftX = cx - ox;
    const leftZ = z - oz;
    const rightX = cx + ox;
    const rightZ = z + oz;
    const yL = terrainHeight(leftX, leftZ) + 0.025;
    const yR = terrainHeight(rightX, rightZ) + 0.025;
    leftPts.push(new THREE.Vector3(leftX, yL, leftZ));
    rightPts.push(new THREE.Vector3(rightX, yR, rightZ));
  }
  group.add(pointsToLine2(leftPts, edgeMat));
  group.add(pointsToLine2(rightPts, edgeMat));

  // ----- ЦЕРКОВЬ -----
  const church = createChurchTemplate(solidBuildingMaterial, neonPurple, neonPink, neonCyan, neonAmber);
  const churchX = roadCurveX(-25) + 18.0;
  const churchY = terrainHeight(churchX, -25) - 0.4;
  church.position.set(churchX, churchY, -25);
  church.lookAt(roadCurveX(-25), churchY, -25);
  church.rotation.y += Math.PI * 0.15;
  group.add(church);

  // ----- БАШНЯ -----
  const tower = createClockTowerTemplate(solidBuildingMaterial, neonPurple, neonPink, neonCyan, neonAmber);
  const towerX = roadCurveX(20) - 16.0;
  const towerY = terrainHeight(towerX, 20) - 0.7;
  tower.position.set(towerX, towerY, 20);
  tower.lookAt(roadCurveX(20), towerY, 20);
  tower.rotation.y -= Math.PI * 0.12;
  group.add(tower);

  // ----- ДОМИКИ -----
  const baseBoxGeo = new THREE.BoxGeometry(3.6, 3.0, 3.6);
  const roofConeGeo = new THREE.ConeGeometry(2.8, 1.8, 4);
  roofConeGeo.rotateY(Math.PI / 4);

  const hutMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a1a,
    metalness: 0.7,
    roughness: 0.3,
    transparent: true,
    opacity: 0.4
  });

  const placements = [
    { z: -40, side: -1, offset: 10 },
    { z: -34, side: -1, offset: 9 },
    { z: -10, side: 1, offset: 11 },
    { z: 0, side: -1, offset: 9 },
    { z: 12, side: 1, offset: 10 },
    { z: 22, side: 1, offset: 10 },
    { z: 35, side: -1, offset: 10 }
  ];

  for (const item of placements) {
    const x = roadCurveX(item.z) + item.side * (item.offset + random() * 1.5);
    const y = terrainHeight(x, item.z);
    const scale = 0.9 + random() * 0.3;

    const base = new THREE.Mesh(baseBoxGeo, hutMat);
    base.position.set(x, y + 1.5 * scale, item.z);
    base.scale.setScalar(scale);
    base.castShadow = true;
    group.add(base);

    const roof = new THREE.Mesh(roofConeGeo, hutMat);
    roof.position.set(x, y + 4.0 * scale, item.z);
    roof.scale.setScalar(scale);
    group.add(roof);
  }

  // ----- ДЕРЕВЬЯ -----
  const treeMat = new THREE.MeshStandardMaterial({
    color: 0x0a1a0a,
    metalness: 0.2,
    roughness: 0.8,
    transparent: true,
    opacity: 0.3
  });
  const treeGeo = new THREE.ConeGeometry(1.5, 3.2, 5);
  for (let i = 0; i < 40; i++) {
    const z = -47 + random() * 94;
    const x = -48 + random() * 96;
    if (Math.abs(x - roadCurveX(z)) < 9.0) continue;
    const y = terrainHeight(x, z);
    const tree = new THREE.Mesh(treeGeo, treeMat);
    const scale = 0.7 + random() * 0.6;
    tree.position.set(x, y + 1.5 * scale, z);
    tree.scale.setScalar(scale);
    tree.rotation.y = random() * Math.PI * 2;
    group.add(tree);
  }

  // ----- ФОНАРИ -----
  const poleMat = createSolidMaterial(0x1a0c24, 0.9, 0.1, 0.48);
  const poleOutlineMat = makeLineMat('#a855f7', 1.8, 0.72);
  const glowTexture = createGlowTexture();

  const zs = [-40, -30, -20, -10, 0, 10, 20, 30, 40];
  for (let i = 0; i < zs.length; i++) {
    const z = zs[i];
    const side = i % 2 === 0 ? -1 : 1;
    const x = roadCurveX(z) + side * 4.0;
    const y = terrainHeight(x, z);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 3.5, 6), poleMat);
    pole.position.set(x, y + 1.75, z);
    group.add(pole);

    const glowMat = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const glow = new THREE.Sprite(glowMat);
    glow.position.set(x + side * -1.2, y + 3.0, z);
    glow.scale.set(5.0, 5.0, 1);
    group.add(glow);

    const light = new THREE.PointLight(0x00f0ff, 1.5, 15.0, 2.0);
    light.position.copy(glow.position);
    group.add(light);
  }

  // ----- ДРОНЫ -----
  const droneMat = createSolidMaterial(0x020508, 0.9, 0.18, 0.48);
  const droneEdgeMat = makeLineMat('#ff2a85', 2.6, 1.0);

  for (let i = 0; i < 4; i++) {
    const drone = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.3, 6), droneMat);
    body.position.y = 0.15;
    drone.add(body);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 0.3), droneMat);
    wing.position.set(0, 0.25, -0.2);
    drone.add(wing);

    const glow = new THREE.PointLight(0xff2a85, 2.0, 8.0, 2.0);
    glow.position.set(0, -0.2, 0);
    drone.add(glow);

    const fireLight = new THREE.PointLight(0xff6a22, 2.0, 10.0, 2.0);
    fireLight.position.set(0, 0.3, -1.5);
    drone.add(fireLight);

    const offset = (i / 4) * Math.PI * 2;
    drone.userData = { offset, speed: 0.45 + Math.random() * 0.45, altitude: 3.0 + Math.random() * 1.2, fireLight };
    group.add(drone);
    drone.position.set(0, 10, 0);
  }

  // ============================================================
  // 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ЗДАНИЙ
  // ============================================================

  function createChurchTemplate(solidMat, edgeA, edgeB, edgeC, edgeD) {
    const church = new THREE.Group();
    const f1 = createSolidWithEdges(new THREE.BoxGeometry(8.0, 1.2, 14.0), solidMat, edgeA);
    f1.position.y = 0.6;
    church.add(f1);
    const f2 = createSolidWithEdges(new THREE.BoxGeometry(7.0, 0.8, 13.0), solidMat, edgeB);
    f2.position.y = 1.6;
    church.add(f2);
    const hall = createSolidWithEdges(new THREE.BoxGeometry(5.2, 6.0, 10.0), solidMat, edgeC);
    hall.position.set(0, 5.0, -1.0);
    church.add(hall);
    const apseGeo = new THREE.CylinderGeometry(2.6, 2.6, 6.0, 8, 1, false, 0, Math.PI);
    apseGeo.rotateY(Math.PI / 2);
    const apse = createSolidWithEdges(apseGeo, solidMat, edgeA);
    apse.position.set(0, 5.0, -6.0);
    church.add(apse);
    const tower = createSolidWithEdges(new THREE.BoxGeometry(2.6, 12.0, 2.6), solidMat, edgeC);
    tower.position.set(0, 8.0, 5.3);
    church.add(tower);
    const spireGeo = new THREE.ConeGeometry(1.5, 8.0, 8);
    const spire = createSolidWithEdges(spireGeo, solidMat, edgeB);
    spire.position.set(0, 18.0, 5.3);
    church.add(spire);
    return church;
  }

  function createClockTowerTemplate(solidMat, edgeA, edgeB, edgeC, edgeD) {
    const tower = new THREE.Group();
    const f1 = createSolidWithEdges(new THREE.BoxGeometry(5.2, 1.5, 5.2), solidMat, edgeA);
    f1.position.y = 0.75;
    tower.add(f1);
    const f2 = createSolidWithEdges(new THREE.BoxGeometry(4.2, 1.5, 4.2), solidMat, edgeC);
    f2.position.y = 2.25;
    tower.add(f2);
    const core = createSolidWithEdges(new THREE.BoxGeometry(1.8, 12.0, 1.8), solidMat, edgeA);
    core.position.y = 9.0;
    tower.add(core);
    const deck = createSolidWithEdges(new THREE.BoxGeometry(3.8, 0.4, 3.8), solidMat, edgeB);
    deck.position.y = 15.2;
    tower.add(deck);
    const head = createSolidWithEdges(new THREE.BoxGeometry(3.0, 3.0, 3.0), solidMat, edgeC);
    head.position.y = 17.1;
    tower.add(head);
    const roofGeo = new THREE.ConeGeometry(2.1, 1.0, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = createSolidWithEdges(roofGeo, solidMat, edgeB);
    roof.position.y = 19.1;
    tower.add(roof);
    return tower;
  }

  return group;
}
