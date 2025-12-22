// ===================================
// ФАЙЛ: src/ar.js V3
// ИСПРАВЛЕНО:
// - Проверка HTTPS перед запуском
// - Лучшая обработка ошибок
// - Информативные сообщения об ошибках
// ===================================

import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { createRoadNetwork } from './roads/road_system.js';
import { TrafficManager } from './traffic/traffic_manager.js';
import { StatsPanel } from './ui/StatsPanel.js';
import { ControlPanel } from './ui/ControlPanel.js';

export const startAR = async (settings = {}) => {
  const container = document.querySelector("#ar-container");
  const showStats = settings.showStats !== false;

  try {
    // ✅ Проверка HTTPS
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      const error = new Error('AR режим требует HTTPS для доступа к камере');
      error.code = 'HTTPS_REQUIRED';
      throw error;
    }

    // ✅ Проверка поддержки камеры
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const error = new Error('Ваш браузер не поддерживает доступ к камере');
      error.code = 'CAMERA_NOT_SUPPORTED';
      throw error;
    }

    // ✅ Запрашиваем разрешение на камеру явно
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      // Останавливаем тестовый стрим
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Доступ к камере получен');
    } catch (cameraError) {
      console.error('❌ Ошибка доступа к камере:', cameraError);
      const error = new Error('Нет доступа к камере. Разрешите доступ в настройках браузера.');
      error.code = 'CAMERA_PERMISSION_DENIED';
      throw error;
    }

    const mindarThree = new MindARThree({
      container,
      imageTargetSrc: './assets/carpet.mind',
      maxTrack: 1
    });

    const { renderer, scene, camera } = mindarThree;

    // Освещение
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));
    const dl = new THREE.DirectionalLight(0xffffff, 1.5);
    dl.position.set(5, 10, 7);
    scene.add(dl);

    // Создаем anchor для AR
    const anchor = mindarThree.addAnchor(0);
    const gameGroup = new THREE.Group();
    anchor.group.add(gameGroup);

    // Создаем дороги и машины
    const roadNetwork = createRoadNetwork(gameGroup, { showRoads: settings.showRoads || false });
    const trafficManager = new TrafficManager(gameGroup, roadNetwork);

    // ✅ Панель статистики (опционально)
    let statsPanel = null;
    if (showStats) {
      statsPanel = new StatsPanel();
      statsPanel.show();
    }

    // ✅ Панель управления машинками (всегда)
    const controlPanel = new ControlPanel(trafficManager);
    controlPanel.show();

    // 🚗 Автоматический спавн машин
    trafficManager.spawnCars(5);
    trafficManager.setGlobalScale(1.0);

    // ✅ PINCH ZOOM
    let lastDist = null;

    container.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastDist = Math.hypot(dx, dy);
      }
    }, { passive: true });

    container.addEventListener('touchmove', e => {
      if (e.touches.length === 2 && lastDist !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        
        const delta = (currentDist - lastDist) * 0.005;
        const currentScale = trafficManager.globalScaleMultiplier || 1.0;
        const newScale = Math.max(0.1, Math.min(3.0, currentScale + delta));
        
        trafficManager.setGlobalScale(newScale);
        lastDist = currentDist;
      }
    }, { passive: true });

    container.addEventListener('touchend', e => {
      if (e.touches.length < 2) {
        lastDist = null;
      }
    }, { passive: true });

    // Запускаем AR
    await mindarThree.start();
    console.log('✅ AR режим запущен успешно');

    // ✅ Переменная для отслеживания статуса трекинга
    let isTracking = false;

    // Отслеживание target found/lost
    anchor.onTargetFound = () => {
      isTracking = true;
      console.log('🎯 Target found');
    };

    anchor.onTargetLost = () => {
      isTracking = false;
      console.log('❌ Target lost');
    };

    // Анимационный цикл
    renderer.setAnimationLoop(() => {
      trafficManager.update();
      
      if (statsPanel) {
        const stats = trafficManager.getStats();
        statsPanel.update({
          mode: 'AR',
          tracking: isTracking,
          paused: false,
          cars: stats.activeCars,
          pooled: stats.pooledCars,
          scale: trafficManager.globalScaleMultiplier.toFixed(2)
        });
      }
      
      renderer.render(scene, camera);
    });

  } catch (error) {
    console.error('❌ Ошибка запуска AR:', error);
    
    // Формируем понятное сообщение об ошибке
    let message = 'AR режим не запустился';
    let suggestion = 'Попробуйте режим TOUCH';
    
    if (error.code === 'HTTPS_REQUIRED') {
      message = '🔒 AR требует HTTPS';
      suggestion = 'Откройте сайт через HTTPS или используйте режим TOUCH';
    } else if (error.code === 'CAMERA_NOT_SUPPORTED') {
      message = '📷 Камера не поддерживается';
      suggestion = 'Используйте современный браузер (Chrome/Safari) или режим TOUCH';
    } else if (error.code === 'CAMERA_PERMISSION_DENIED') {
      message = '⛔ Нет доступа к камере';
      suggestion = 'Разрешите доступ к камере в настройках браузера и перезагрузите страницу';
    } else if (error.message && error.message.includes('target')) {
      message = '🎯 Файл carpet.mind не найден';
      suggestion = 'Проверьте что файл assets/carpet.mind существует';
    }
    
    error.userMessage = `${message}\n\n${suggestion}`;
    throw error;
  }
};