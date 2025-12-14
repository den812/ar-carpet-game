import * as THREE from "three";
// Импорт GUI через CDN (так как нет сборщика)
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm'; 
import { getCameraConfig } from "./config.js";

// Импорт логики игры
import { createRoadNetwork } from "./roads/road_system.js";
import { TrafficManager } from "./traffic/traffic_manager.js";

export function startNonAR(mode) {
  // 1. Инициализация сцены
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB); // Небо

  // 2. Настройка камеры
  const camConfig = getCameraConfig();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.8, 1.8); // Позиция повыше
  camera.lookAt(0, 0, 0);

  // 3. Рендерер
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // Включаем тени
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // 4. Освещение
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  scene.add(dirLight);

  // 5. Ковер (Пол)
  const carpetGeometry = new THREE.PlaneGeometry(2, 2.5);
  const carpetMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x999999,
      roughness: 0.8,
      side: THREE.DoubleSide
  });
  
  // Попытка загрузить текстуру
  new THREE.TextureLoader().load("./assets/carpet-scan.jpg", (tex) => {
      carpetMaterial.map = tex;
      carpetMaterial.color.setHex(0xffffff); // Сбрасываем серый цвет при загрузке текстуры
      carpetMaterial.needsUpdate = true;
  });

  const carpet = new THREE.Mesh(carpetGeometry, carpetMaterial);
  carpet.rotation.x = -Math.PI / 2;
  carpet.receiveShadow = true;
  scene.add(carpet);

  // 6. Игровой мир (Группа для дорог и машин)
  const gameWorld = new THREE.Group();
  scene.add(gameWorld);

  // === ЛОГИКА ===
  
  // Создаем дороги
  const roadNetwork = createRoadNetwork(gameWorld);

  // Создаем менеджер трафика
  const trafficManager = new TrafficManager(gameWorld, roadNetwork);

  // === GUI (ПАНЕЛЬ УПРАВЛЕНИЯ) ===
  const gui = new GUI({ title: 'Настройки Non-AR' });
  const params = {
      // Множитель масштаба. 1.0 = как в CarModels.js
      scaleMultiplier: 1.0, 
      count: 5,
      reload: () => {
          trafficManager.clearTraffic();
          trafficManager.spawnCars(params.count);
          // Применяем масштаб сразу после спавна
          trafficManager.setGlobalScale(params.scaleMultiplier);
      }
  };

  gui.add(params, 'scaleMultiplier', 0.1, 3.0).name('Zoom Машинок').onChange(val => {
      trafficManager.setGlobalScale(val);
  });
  gui.add(params, 'count', 1, 20).name('Кол-во машин').step(1);
  gui.add(params, 'reload').name('Пересоздать');

  // Запуск первой партии машин
  params.reload();

  // === УПРАВЛЕНИЕ ===
  
  // Обработка ресайза окна
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Включаем управление камерой
  if (mode === "GYRO") {
    setupGyroControls(camera);
  } else {
    setupOrbitControls(camera, renderer.domElement);
  }

  // === ЦИКЛ РЕНДЕРИНГА ===
  renderer.setAnimationLoop(() => {
    if (trafficManager) trafficManager.update();
    renderer.render(scene, camera);
  });
}

// Управление орбитой (Мышь + Тач)
function setupOrbitControls(camera, canvas) {
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  
  // Сферические координаты камеры
  let theta = 0; // Вращение вокруг Y
  let phi = Math.PI / 3; // Угол наклона (60 градусов)
  let radius = 2.2; // Дистанция

  function updateCamera() {
      const x = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.cos(theta);
      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);
  }
  
  updateCamera();

  const startDrag = (x, y) => {
      isDragging = true;
      previousMousePosition = { x, y };
  };

  const moveDrag = (x, y) => {
      if (!isDragging) return;
      const deltaX = x - previousMousePosition.x;
      const deltaY = y - previousMousePosition.y;

      theta -= deltaX * 0.01;
      phi -= deltaY * 0.01;
      
      // Ограничение наклона (чтобы не уйти под землю и не перевернуться)
      phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, phi));

      updateCamera();
      previousMousePosition = { x, y };
  };

  const endDrag = () => { isDragging = false; };

  // События Мыши
  canvas.addEventListener('mousedown', (e) => startDrag(e.offsetX, e.offsetY));
  window.addEventListener('mousemove', (e) => moveDrag(e.offsetX, e.offsetY)); // window чтобы не терять драг при выходе
  window.addEventListener('mouseup', endDrag);
  
  // События Тача
  canvas.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientX, e.touches[0].clientY), {passive: false});
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});
  canvas.addEventListener('touchend', endDrag);
}

function setupGyroControls(camera) {
    console.log("Gyro controls not fully implemented in this snippet");
}