// ===================================
// ФАЙЛ: src/ar.js V2
// ДОБАВЛЕНО:
// - Поддержка настроек (showStats)
// - Улучшенная обработка ошибок
// ===================================

import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { createRoadNetwork } from './roads/road_system.js';
import { TrafficManager } from './traffic/traffic_manager.js';
import { StatsPanel } from './ui/StatsPanel.js';

export const startAR = async (settings = {}) => {
  const container = document.querySelector("#ar-container");
  const showStats = settings.showStats !== false;

  try {
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
    const roadNetwork = createRoadNetwork(gameGroup);
    const trafficManager = new TrafficManager(gameGroup, roadNetwork);

    // ✅ Панель статистики (опционально)
    let statsPanel = null;
    if (showStats) {
      statsPanel = new StatsPanel();
      statsPanel.show();
    }

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
    throw error; // Пробрасываем ошибку для fallback в main.js
  }
};