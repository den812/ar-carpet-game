// ===================================
// ФАЙЛ: src/nonAr.js V31
// ДОБАВЛЕНО:
// - Bump mapping для текстуры ковра (яркие цвета)
// - Normal map для объёма дорог
// - Улучшенное освещение
// ===================================

import * as THREE from "three";
import { createRoadNetwork } from "./roads/road_system.js";
import { TrafficManager } from "./traffic/traffic_manager.js";
import { StatsPanel } from "./ui/StatsPanel.js";
import { ControlPanel } from "./ui/ControlPanel.js";

export function startNonAR(mode, settings = {}) {
  console.log(`🎮 Запуск ${mode} режима...`);

  try {
    const showStats = settings.showStats !== false;
    const showControl = settings.showControl !== false;
    const invertControls = settings.invertControls === true;
    const showRoads = settings.showRoads === true;
    
    const inv = invertControls ? -1 : 1;

    // ✅ Создание сцены
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
    let radius = 2.5, theta = 0.5, phi = 1.1;

    function updateCam() {
      camera.position.set(
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(0, 0, 0);
    }
    updateCam();

    // ✅ Renderer с улучшенными настройками
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); // Оптимизация
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    renderer.domElement.style.cursor = 'grab';

    // ✅ УЛУЧШЕННОЕ ОСВЕЩЕНИЕ для bump mapping
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    
    const dl = new THREE.DirectionalLight(0xffffff, 1.0);
    dl.position.set(5, 10, 5);
    dl.castShadow = true;
    dl.shadow.mapSize.width = 2048;
    dl.shadow.mapSize.height = 2048;
    scene.add(dl);
    
    // Дополнительный свет для объема
    const dl2 = new THREE.DirectionalLight(0xffeedd, 0.3);
    dl2.position.set(-5, 5, -5);
    scene.add(dl2);

    // ✅ ЗАГРУЗКА ТЕКСТУРЫ КОВРА С BUMP MAPPING
    const textureLoader = new THREE.TextureLoader();
    
    textureLoader.load(
      './assets/carpet-scan.jpg',
      texture => {
        console.log('✅ Текстура ковра загружена');
        
        // Настройки текстуры для яркости
        texture.encoding = THREE.sRGBEncoding;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        
        // 🎨 BUMP MAPPING: используем ту же текстуру как bump map
        const bumpMap = texture.clone();
        bumpMap.needsUpdate = true;
        
        const carpet = new THREE.Mesh(
          new THREE.PlaneGeometry(2.0, 2.5),
          new THREE.MeshStandardMaterial({ 
            map: texture,
            bumpMap: bumpMap,           // ✅ BUMP MAP для рельефа
            bumpScale: 0.005,            // Небольшой рельеф
            roughness: 0.8,              // Текстура ткани
            metalness: 0.0,              // Не металл
            side: THREE.DoubleSide,
            // Увеличиваем яркость цветов
            emissive: 0x222222,          // Немного свечения
            emissiveIntensity: 0.1
          })
        );
        carpet.rotation.x = -Math.PI / 2;
        carpet.receiveShadow = true;
        scene.add(carpet);
        
        console.log('🎨 Bump mapping применен к ковру');
      },
      undefined,
      err => {
        console.warn('⚠️ Ошибка загрузки текстуры, используем серый цвет');
        const carpet = new THREE.Mesh(
          new THREE.PlaneGeometry(2.0, 2.5),
          new THREE.MeshStandardMaterial({ 
            color: 0x888888, 
            side: THREE.DoubleSide,
            roughness: 0.8
          })
        );
        carpet.rotation.x = -Math.PI / 2;
        carpet.receiveShadow = true;
        scene.add(carpet);
      }
    );

    const world = new THREE.Group();
    scene.add(world);

    // ✅ Создание дорожной сети
    let roadNetwork, trafficManager;
    try {
      roadNetwork = createRoadNetwork(world, { showRoads });
      trafficManager = new TrafficManager(world, roadNetwork);
      console.log('✅ Дорожная сеть создана');
    } catch (err) {
      console.error('❌ Ошибка создания дорожной сети:', err);
      alert('Ошибка инициализации игры:\n' + err.message);
      throw err;
    }

    // ✅ UI панели
    let statsPanel = null;
    let controlPanel = null;
    
    try {
      if (showStats) {
        statsPanel = new StatsPanel();
        statsPanel.show();
      }

      if (showControl) {
        controlPanel = new ControlPanel(trafficManager);
        controlPanel.show();
      }
    } catch (err) {
      console.warn('⚠️ Ошибка создания UI:', err);
    }

    // ✅ Запуск машин
    trafficManager.init()
      .then(() => {
        console.log('✅ TrafficManager инициализирован');
        return trafficManager.spawnCars(7);
      })
      .then(() => {
        console.log('✅ Машины заспавнены');
        trafficManager.setGlobalScale(1.0);
      })
      .catch(err => {
        console.error('❌ Ошибка инициализации машин:', err);
        alert('Ошибка запуска машин:\n' + err.message);
      });

    // ============================================
    // УПРАВЛЕНИЕ МЫШЬЮ
    // ============================================
    let drag = false, prev = { x: 0, y: 0 };

    renderer.domElement.onmousedown = e => {
      drag = true;
      prev = { x: e.clientX, y: e.clientY };
      renderer.domElement.style.cursor = 'grabbing';
    };

    window.onmouseup = () => {
      if (drag) {
        drag = false;
        renderer.domElement.style.cursor = 'grab';
      }
    };

    window.onmousemove = e => {
      if (!drag) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      theta -= dx * 0.005 * inv;
      phi += dy * 0.005 * inv;
      phi = Math.max(0.2, Math.min(Math.PI - 0.2, phi));
      prev = { x: e.clientX, y: e.clientY };
      updateCam();
    };

    renderer.domElement.onwheel = e => {
      e.preventDefault();
      radius += e.deltaY * 0.002;
      radius = Math.max(1.0, Math.min(6.0, radius));
      updateCam();
    };

    // ============================================
    // УПРАВЛЕНИЕ ТАЧЕМ
    // ============================================
    let single = false, pinch = false, lastX = 0, lastY = 0, lastDist = null;

    renderer.domElement.ontouchstart = e => {
      if (e.touches.length === 1) {
        single = true;
        pinch = false;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        lastDist = null;
      } else if (e.touches.length === 2) {
        single = false;
        pinch = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastDist = Math.hypot(dx, dy);
      }
    };

    renderer.domElement.ontouchmove = e => {
      if (single && e.touches.length === 1) {
        const dx = e.touches[0].clientX - lastX;
        const dy = e.touches[0].clientY - lastY;
        theta -= dx * 0.005 * inv;
        phi += dy * 0.005 * inv;
        phi = Math.max(0.2, Math.min(Math.PI - 0.2, phi));
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        updateCam();
      } else if (pinch && e.touches.length === 2 && lastDist) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const delta = (dist - lastDist) * 0.01;
        radius = Math.max(1.0, Math.min(6.0, radius - delta));
        lastDist = dist;
        updateCam();
      }
    };

    renderer.domElement.ontouchend = e => {
      if (e.touches.length === 0) {
        single = false;
        pinch = false;
        lastDist = null;
      } else if (e.touches.length === 1) {
        single = true;
        pinch = false;
        lastDist = null;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    };

    // ============================================
    // УПРАВЛЕНИЕ ГИРОСКОПОМ (только для GYRO режима)
    // ============================================
    if (mode === "GYRO") {
      console.log('🔄 Инициализация GYRO режима...');
      
      if (typeof DeviceOrientationEvent !== 'undefined' && 
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        
        const btn = document.createElement('button');
        btn.textContent = '📱 Разрешить гироскоп';
        btn.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:3000;padding:20px 30px;font-size:18px;font-weight:bold;background:linear-gradient(135deg,#0f0,#0c0);color:#000;border:3px solid #0f0;border-radius:12px;cursor:pointer;box-shadow:0 4px 15px rgba(0,255,0,0.6);`;
        
        btn.onclick = async () => {
          try {
            const perm = await DeviceOrientationEvent.requestPermission();
            if (perm === 'granted') {
              btn.remove();
              setupGyro();
              console.log('✅ Разрешение на гироскоп получено');
            }
          } catch (err) {
            console.error('❌ Ошибка запроса разрешения гироскопа:', err);
            alert('Не удалось получить доступ к гироскопу');
          }
        };
        
        document.body.appendChild(btn);
      } else {
        setupGyro();
      }

      function setupGyro() {
        window.addEventListener('deviceorientation', e => {
          if (e.beta !== null && e.gamma !== null) {
            const beta = THREE.MathUtils.degToRad(e.beta);
            const gamma = THREE.MathUtils.degToRad(e.gamma);
            theta = gamma * 2;
            phi = Math.PI / 2 - beta;
            phi = Math.max(0.2, Math.min(Math.PI - 0.2, phi));
            updateCam();
          }
        });
        console.log('✅ Гироскоп инициализирован');
      }
    }

    // ============================================
    // RESIZE
    // ============================================
    window.onresize = () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    };

    // ============================================
    // RENDER LOOP
    // ============================================
    renderer.setAnimationLoop(() => {
      try {
        // Обновляем машины
        trafficManager.update();
        
        // Обновляем статистику
        if (statsPanel && statsPanel.isVisible) {
          const stats = trafficManager.getStats();
          statsPanel.update({
            mode: mode,
            tracking: false,
            paused: false,
            cars: stats.activeCars || 0,
            pooled: stats.pooledCars || 0,
            scale: trafficManager.globalScaleMultiplier.toFixed(2),
            cameraRadius: radius.toFixed(2)
          });
        }
        
        // Рендерим сцену
        renderer.render(scene, camera);
      } catch (err) {
        console.error('❌ Ошибка в render loop:', err);
      }
    });

    console.log(`✅ ${mode} режим успешно запущен`);
    
  } catch (err) {
    console.error(`❌ Критическая ошибка в ${mode} режиме:`, err);
    alert(`Критическая ошибка:\n${err.message}\n\nПерезагрузите страницу.`);
    throw err;
  }
}