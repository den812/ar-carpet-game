import * as THREE from "three";
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm'; 
import { getCameraConfig } from "./config.js";
import { createRoadNetwork } from "./roads/road_system.js";
import { TrafficManager } from "./traffic/traffic_manager.js";
import { StatsPanel } from "./ui/StatsPanel.js"; // ✅ ИСПРАВЛЕН путь

export function startNonAR(mode) {
  console.log(`🎮 Запуск в режиме: ${mode}`);

  // Создаем панель статистики
  const statsPanel = new StatsPanel();

  // 1. Инициализация сцены
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);

  // 2. Настройка камеры
  const camConfig = getCameraConfig();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.8, 1.8);
  camera.lookAt(0, 0, 0);

  // 3. Рендерер
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
  
  new THREE.TextureLoader().load("./assets/carpet-scan.jpg", (tex) => {
      carpetMaterial.map = tex;
      carpetMaterial.color.setHex(0xffffff);
      carpetMaterial.needsUpdate = true;
  }, undefined, (err) => {
      console.warn('Не удалось загрузить текстуру ковра:', err);
  });

  const carpet = new THREE.Mesh(carpetGeometry, carpetMaterial);
  carpet.rotation.x = -Math.PI / 2;
  carpet.receiveShadow = true;
  scene.add(carpet);

  // 6. Игровой мир
  const gameWorld = new THREE.Group();
  scene.add(gameWorld);

  // === ЛОГИКА ===
  const roadNetwork = createRoadNetwork(gameWorld);
  const trafficManager = new TrafficManager(gameWorld, roadNetwork);

  // === GUI ===
  const gui = new GUI({ title: `Настройки ${mode}` });
  const params = {
      scaleMultiplier: 1.0,
      count: 5,
      showStats: false,
      reload: () => {
          trafficManager.clearTraffic();
          trafficManager.spawnCars(params.count);
          trafficManager.setGlobalScale(params.scaleMultiplier);
      }
  };

  gui.add(params, 'scaleMultiplier', 0.1, 3.0).name('🔍 Zoom машинок').onChange(val => {
      trafficManager.setGlobalScale(val);
  });
  
  gui.add(params, 'count', 1, 20).name('🚗 Кол-во машин').step(1);
  gui.add(params, 'reload').name('🔄 Пересоздать');
  
  // Добавляем переключатель статистики
  gui.add(params, 'showStats').name('📊 Статистика').onChange(val => {
      if (val) {
          statsPanel.show();
      } else {
          statsPanel.hide();
      }
  });

  // Запуск первой партии машин
  params.reload();

  // === УПРАВЛЕНИЕ ===
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  if (mode === "GYRO") {
    setupGyroControls(camera);
  } else {
    setupOrbitControls(camera, renderer.domElement);
  }

  // === ЦИКЛ РЕНДЕРИНГА ===
  renderer.setAnimationLoop(() => {
    if (trafficManager) trafficManager.update();
    
    // Обновляем статистику
    if (params.showStats && trafficManager.getStats) {
      const stats = trafficManager.getStats();
      statsPanel.update({
        mode: mode,
        ...stats
      });
    }
    
    renderer.render(scene, camera);
  });

  // Очистка ресурсов
  window.addEventListener('beforeunload', () => {
    if (trafficManager.dispose) trafficManager.dispose();
    gui.destroy();
    statsPanel.destroy();
    renderer.dispose();
  });
}

// Управление орбитой
function setupOrbitControls(camera, canvas) {
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  
  let theta = 0;
  let phi = Math.PI / 3;
  let radius = 2.2;

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
      phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, phi));

      updateCamera();
      previousMousePosition = { x, y };
  };

  const endDrag = () => { isDragging = false; };

  canvas.addEventListener('mousedown', (e) => startDrag(e.offsetX, e.offsetY));
  window.addEventListener('mousemove', (e) => moveDrag(e.offsetX, e.offsetY));
  window.addEventListener('mouseup', endDrag);
  
  canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, {passive: false});
  
  canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, {passive: false});
  
  canvas.addEventListener('touchend', endDrag);
}

function setupGyroControls(camera) {
    console.log("🔄 Gyro controls активированы");
    
    if (!window.DeviceOrientationEvent) {
        console.warn("DeviceOrientation не поддерживается");
        return;
    }

    let alpha = 0, beta = 0, gamma = 0;

    window.addEventListener('deviceorientation', (e) => {
        alpha = e.alpha || 0;
        beta = e.beta || 0;
        gamma = e.gamma || 0;

        const x = Math.sin(gamma * Math.PI / 180) * 2;
        const y = 1.5;
        const z = Math.cos(gamma * Math.PI / 180) * 2;

        camera.position.set(x, y, z);
        camera.lookAt(0, 0, 0);
    });
}