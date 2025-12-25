// ===================================
// ФАЙЛ: src/nonAr.js
// Без изменений - работает корректно
// ===================================

import * as THREE from "three";
import { createRoadNetwork } from "./roads/road_system.js";
import { TrafficManager } from "./traffic/traffic_manager.js";
import { StatsPanel } from "./ui/StatsPanel.js";
import { ControlPanel } from "./ui/ControlPanel.js";

export function startNonAR(mode, settings = {}) {
  console.log(`🎮 Запуск режима: ${mode}`);

  const showStats = settings.showStats !== false;
  const showControl = settings.showControl !== false; // ✅ НОВОЕ
  const invertControls = settings.invertControls === true;
  const showRoads = settings.showRoads === true;
  
  const invertMultiplier = invertControls ? -1 : 1;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);

  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
  let radius = 2.5;
  let theta = 0.5;
  let phi = 1.1;

  function updateCamera() {
    camera.position.set(
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(0, 0, 0);
  }
  updateCamera();

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);
  renderer.domElement.style.cursor = 'grab';

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dl = new THREE.DirectionalLight(0xffffff, 1.2);
  dl.position.set(5, 10, 5);
  scene.add(dl);

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(
    './assets/carpet-scan.jpg',
    (texture) => {
      console.log('✅ Текстура ковра загружена');
      
      const carpetGeometry = new THREE.PlaneGeometry(2.0, 2.5);
      const carpetMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide
      });
      
      const carpet = new THREE.Mesh(carpetGeometry, carpetMaterial);
      carpet.rotation.x = -Math.PI / 2;
      carpet.position.y = 0;
      carpet.receiveShadow = true;
      
      scene.add(carpet);
    },
    undefined,
    (error) => {
      console.error('❌ Ошибка загрузки текстуры ковра:', error);
      
      const carpetGeometry = new THREE.PlaneGeometry(2.0, 2.5);
      const carpetMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        side: THREE.DoubleSide
      });
      
      const carpet = new THREE.Mesh(carpetGeometry, carpetMaterial);
      carpet.rotation.x = -Math.PI / 2;
      carpet.position.y = 0;
      carpet.receiveShadow = true;
      scene.add(carpet);
    }
  );

  const world = new THREE.Group();
  scene.add(world);

  const roadNetwork = createRoadNetwork(world, { showRoads: showRoads });
  const trafficManager = new TrafficManager(world, roadNetwork);

  let statsPanel = null;
  if (showStats) {
    statsPanel = new StatsPanel();
    statsPanel.show();
  }

  // ✅ Панель управления машинками (опционально)
  let controlPanel = null;
  if (showControl) {
    controlPanel = new ControlPanel(trafficManager);
    controlPanel.show();
  }

  trafficManager.spawnCars(7);
  trafficManager.setGlobalScale(1.0);

  let dragging = false;
  let prev = { x: 0, y: 0 };

  renderer.domElement.addEventListener('mousedown', e => {
    dragging = true;
    prev = { x: e.clientX, y: e.clientY };
    renderer.domElement.style.cursor = 'grabbing';
  });

  window.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      renderer.domElement.style.cursor = 'grab';
    }
  });

  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    
    const deltaX = e.clientX - prev.x;
    const deltaY = e.clientY - prev.y;
    
    theta -= deltaX * 0.005 * invertMultiplier;
    phi += deltaY * 0.005 * invertMultiplier;
    phi = Math.max(0.2, Math.min(Math.PI - 0.2, phi));
    
    prev = { x: e.clientX, y: e.clientY };
    updateCamera();
  });

  renderer.domElement.addEventListener('wheel', e => {
    e.preventDefault();
    
    const delta = e.deltaY * 0.002;
    radius += delta;
    radius = Math.max(1.0, Math.min(6.0, radius));
    
    updateCamera();
  }, { passive: false });

  let isSingleTouch = false;
  let isPinching = false;
  let lastTouchX = 0;
  let lastTouchY = 0;
  let lastTouchDist = null;

  renderer.domElement.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isSingleTouch = true;
      isPinching = false;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      lastTouchDist = null;
    } else if (e.touches.length === 2) {
      isSingleTouch = false;
      isPinching = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.hypot(dx, dy);
    }
  }, { passive: true });

  renderer.domElement.addEventListener('touchmove', e => {
    if (isSingleTouch && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - lastTouchX;
      const deltaY = e.touches[0].clientY - lastTouchY;

      theta -= deltaX * 0.005 * invertMultiplier;
      phi += deltaY * 0.005 * invertMultiplier;
      phi = Math.max(0.2, Math.min(Math.PI - 0.2, phi));

      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      updateCamera();
    } else if (isPinching && e.touches.length === 2 && lastTouchDist !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);

      const delta = (currentDist - lastTouchDist) * 0.01;
      radius = Math.max(1.0, Math.min(6.0, radius - delta));

      lastTouchDist = currentDist;
      updateCamera();
    }
  }, { passive: true });

  renderer.domElement.addEventListener('touchend', e => {
    if (e.touches.length === 0) {
      isSingleTouch = false;
      isPinching = false;
      lastTouchDist = null;
    } else if (e.touches.length === 1) {
      isSingleTouch = true;
      isPinching = false;
      lastTouchDist = null;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    }
  }, { passive: true });

  if (mode === "GYRO") {
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      
      const permBtn = document.createElement('button');
      permBtn.textContent = '📱 Разрешить гироскоп';
      permBtn.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 3000;
        padding: 20px 30px;
        font-size: 18px;
        font-weight: bold;
        background: linear-gradient(135deg, #00ff00 0%, #00cc00 100%);
        color: #000;
        border: 3px solid #00ff00;
        border-radius: 12px;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0, 255, 0, 0.6);
      `;
      
      permBtn.onclick = async () => {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            console.log('✅ GYRO разрешение получено');
            permBtn.remove();
            setupGyro();
          } else {
            alert('Разрешение на гироскоп отклонено');
            permBtn.remove();
          }
        } catch (err) {
          alert('Ошибка запроса разрешения: ' + err.message);
          permBtn.remove();
        }
      };
      
      document.body.appendChild(permBtn);
    } else {
      setupGyro();
    }

    function setupGyro() {
      let gyroActive = false;
      let eventCount = 0;
      
      const handler = (e) => {
        eventCount++;
        
        if (e.beta !== null && e.gamma !== null) {
          if (!gyroActive) {
            console.log('✅ GYRO активирован!');
            gyroActive = true;
          }
          
          const beta = THREE.MathUtils.degToRad(e.beta);
          const gamma = THREE.MathUtils.degToRad(e.gamma);

          theta = gamma * 2;
          phi = Math.PI / 2 - beta;
          phi = Math.max(0.2, Math.min(Math.PI - 0.2, phi));

          updateCamera();
        }
      };
      
      window.addEventListener('deviceorientation', handler, true);
      
      setTimeout(() => {
        if (eventCount === 0) {
          alert(
            'Гироскоп не работает.\n\n' +
            'Попробуйте:\n' +
            '1. Включить датчики движения в Chrome\n' +
            '2. Открыть сайт через HTTPS\n' +
            '3. Использовать другой браузер'
          );
        }
      }, 3000);
    }
  }

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  renderer.setAnimationLoop(() => {
    trafficManager.update();
    
    if (statsPanel) {
      const stats = trafficManager.getStats();
      statsPanel.update({
        mode: mode,
        tracking: false,
        paused: false,
        cars: stats.activeCars,
        pooled: stats.pooledCars,
        scale: trafficManager.globalScaleMultiplier.toFixed(2),
        cameraRadius: radius.toFixed(2)
      });
    }
    
    renderer.render(scene, camera);
  });

  console.log(`✅ Режим ${mode} запущен успешно`);
}