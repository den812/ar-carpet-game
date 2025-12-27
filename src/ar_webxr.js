// ===================================
// ФАЙЛ: src/ar_webxr.js V15.2 FINAL
// WebXR World Tracking БЕЗ строгой проверки
// ===================================

import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { createRoadNetwork } from './roads/road_system.js';
import { TrafficManager } from './traffic/traffic_manager.js';
import { StatsPanel } from './ui/StatsPanel.js';
import { ControlPanel } from './ui/ControlPanel.js';

export const startAR = async (settings = {}) => {
  const showStats = settings.showStats !== false;
  const showControl = settings.showControl !== false;
  
  console.log('🌍 Запуск WebXR AR V15.2...');
  
  // ===================================
  // DEBUG LOGGER НА ЭКРАНЕ
  // ===================================
  
  const debugLog = document.createElement('div');
  debugLog.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    right: 10px;
    max-height: 200px;
    overflow-y: auto;
    padding: 10px;
    background: rgba(0, 0, 0, 0.9);
    color: #00ff00;
    font-family: monospace;
    font-size: 11px;
    border: 2px solid #00ff00;
    border-radius: 8px;
    z-index: 5000;
    pointer-events: none;
    display: none;
  `;
  document.body.appendChild(debugLog);
  
  // Кнопка скрыть/показать логи
  const toggleLogBtn = document.createElement('button');
  toggleLogBtn.textContent = '🐛';
  toggleLogBtn.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 40px;
    height: 40px;
    background: rgba(0, 255, 0, 0.3);
    color: #00ff00;
    border: 2px solid #00ff00;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    z-index: 5001;
    display: none;
  `;
  document.body.appendChild(toggleLogBtn);
  
  toggleLogBtn.onclick = () => {
    debugLog.style.display = debugLog.style.display === 'none' ? 'block' : 'none';
  };
  
  // Функция для логов на экран
  function logOnScreen(message, isError = false) {
    console.log(message);
    const time = new Date().toLocaleTimeString();
    const color = isError ? '#ff0000' : '#00ff00';
    debugLog.innerHTML += `<div style="color: ${color}">[${time}] ${message}</div>`;
    debugLog.scrollTop = debugLog.scrollHeight;
    debugLog.style.display = 'block';
    toggleLogBtn.style.display = 'block';
  }
  
  logOnScreen('🌍 Запуск WebXR AR V15.2...');
  
  try {
    // ✅ УПРОЩЕННАЯ ПРОВЕРКА: только наличие WebXR API
    if (!navigator.xr) {
      logOnScreen('❌ WebXR API отсутствует', true);
      throw new Error('WebXR не поддерживается в этом браузере');
    }
    
    logOnScreen('✅ WebXR API доступен');
    
    // ===================================
    // ИНИЦИАЛИЗАЦИЯ THREE.JS + WEBXR
    // ===================================
    
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    logOnScreen('✅ Renderer создан');
    
    // Освещение
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 1);
    scene.add(directionalLight);
    
    // ===================================
    // ИГРОВАЯ ГРУППА (КОВЕР)
    // ===================================
    
    const carpetGroup = new THREE.Group();
    carpetGroup.visible = false;
    scene.add(carpetGroup);
    
    // Создаем дороги и машины
    const roadNetwork = createRoadNetwork(carpetGroup, { 
      showRoads: settings.showRoads || false 
    });
    const trafficManager = new TrafficManager(carpetGroup, roadNetwork);
    
    logOnScreen('✅ Ковер и дороги созданы');
    
    // ===================================
    // UI ПАНЕЛИ
    // ===================================
    
    let statsPanel = null;
    if (showStats) {
      statsPanel = new StatsPanel();
      statsPanel.show();
    }
    
    let controlPanel = null;
    if (showControl) {
      controlPanel = new ControlPanel(trafficManager);
      controlPanel.show();
    }
    
    // ===================================
    // RETICLE - ВИЗУАЛЬНЫЙ МАРКЕР
    // ===================================
    
    let isCalibrated = false;
    let reticle = null;
    
    const reticleGeometry = new THREE.RingGeometry(0.1, 0.15, 32).rotateX(-Math.PI / 2);
    const reticleMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    
    logOnScreen('✅ Reticle создан');
    
    // ===================================
    // КАЛИБРОВКА: размер и поворот ковра
    // ===================================
    
    let carpetScale = 1.0; // Масштаб ковра (для подгонки под реальный)
    let carpetRotation = 0; // Поворот ковра (в радианах)
    
    // Кнопки калибровки (появятся после размещения)
    const calibrationPanel = document.createElement('div');
    calibrationPanel.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      padding: 15px;
      border: 2px solid #00ff00;
      border-radius: 10px;
      z-index: 3000;
      font-family: monospace;
      font-size: 14px;
      display: none;
      pointer-events: all;
    `;
    
    calibrationPanel.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; text-align: center;">
        🎯 КАЛИБРОВКА КОВРА
      </div>
      
      <div style="margin-bottom: 10px;">
        <div style="margin-bottom: 5px;">Масштаб: <span id="scale-display">1.00</span>x</div>
        <div style="display: flex; gap: 5px;">
          <button id="scale-minus" style="flex: 1; padding: 8px; background: #cc0000; color: #fff; border: none; border-radius: 5px; font-weight: bold;">-</button>
          <button id="scale-plus" style="flex: 1; padding: 8px; background: #00cc00; color: #000; border: none; border-radius: 5px; font-weight: bold;">+</button>
        </div>
      </div>
      
      <div style="margin-bottom: 10px;">
        <div style="margin-bottom: 5px;">Поворот: <span id="rotation-display">0</span>°</div>
        <div style="display: flex; gap: 5px;">
          <button id="rotate-left" style="flex: 1; padding: 8px; background: #0066cc; color: #fff; border: none; border-radius: 5px; font-weight: bold;">↺ Влево</button>
          <button id="rotate-right" style="flex: 1; padding: 8px; background: #0066cc; color: #fff; border: none; border-radius: 5px; font-weight: bold;">↻ Вправо</button>
        </div>
      </div>
      
      <div style="display: flex; gap: 5px; margin-top: 10px;">
        <button id="calibrate-ok" style="flex: 1; padding: 10px; background: #00ff00; color: #000; border: none; border-radius: 5px; font-weight: bold;">✅ ГОТОВО</button>
        <button id="calibrate-reset" style="padding: 10px 15px; background: #666; color: #fff; border: none; border-radius: 5px;">🔄</button>
      </div>
    `;
    
    document.body.appendChild(calibrationPanel);
    
    // Кнопка размещения
    const placeButton = document.createElement('button');
    placeButton.textContent = '📍 РАЗМЕСТИТЬ КОВЕР';
    placeButton.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      padding: 20px 40px;
      font-size: 18px;
      font-weight: bold;
      background: linear-gradient(135deg, #00ff00 0%, #00cc00 100%);
      color: #000;
      border: 3px solid #00ff00;
      border-radius: 15px;
      cursor: pointer;
      z-index: 3000;
      box-shadow: 0 0 30px rgba(0, 255, 0, 0.8);
      display: none;
      pointer-events: all;
    `;
    document.body.appendChild(placeButton);
    
    // Инструкция
    const instructionText = document.createElement('div');
    instructionText.style.cssText = `
      position: fixed;
      top: 220px;
      left: 50%;
      transform: translateX(-50%);
      padding: 15px 30px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      border: 2px solid #00ff00;
      border-radius: 10px;
      font-size: 16px;
      font-weight: bold;
      z-index: 3000;
      text-align: center;
      display: none;
      pointer-events: none;
    `;
    instructionText.innerHTML = '📱 Двигай телефон медленно<br/>чтобы найти поверхность';
    document.body.appendChild(instructionText);
    
    placeButton.onclick = () => {
      logOnScreen('🔘 Кнопка РАЗМЕСТИТЬ нажата');
      
      if (reticle.visible) {
        logOnScreen('✅ Размещаем ковер');
        
        // Размещаем ковер точно на уровне reticle
        const position = new THREE.Vector3();
        reticle.getWorldPosition(position);
        
        carpetGroup.position.copy(position);
        carpetGroup.position.y += 0.01; // 1см над полом
        carpetGroup.visible = true;
        isCalibrated = true;
        
        reticle.visible = false;
        placeButton.style.display = 'none';
        instructionText.style.display = 'none';
        
        // ✅ НОВОЕ: Показываем панель калибровки вместо запуска машин
        calibrationPanel.style.display = 'block';
        
        logOnScreen('✅ Ковер размещен! Калибруйте размер');
      } else {
        logOnScreen('⚠️ Reticle не виден', true);
        alert('Подвигайте телефон медленно\nдля поиска поверхности');
      }
    };
    
    // ===================================
    // ОБРАБОТЧИКИ КАЛИБРОВКИ
    // ===================================
    
    document.getElementById('scale-minus').onclick = () => {
      carpetScale = Math.max(0.5, carpetScale - 0.05);
      carpetGroup.scale.setScalar(carpetScale);
      document.getElementById('scale-display').textContent = carpetScale.toFixed(2);
      logOnScreen(`Масштаб: ${carpetScale.toFixed(2)}x`);
    };
    
    document.getElementById('scale-plus').onclick = () => {
      carpetScale = Math.min(2.0, carpetScale + 0.05);
      carpetGroup.scale.setScalar(carpetScale);
      document.getElementById('scale-display').textContent = carpetScale.toFixed(2);
      logOnScreen(`Масштаб: ${carpetScale.toFixed(2)}x`);
    };
    
    document.getElementById('rotate-left').onclick = () => {
      carpetRotation -= Math.PI / 60; // ✅ ИСПРАВЛЕНО: -3 градуса (было -15)
      carpetGroup.rotation.y = carpetRotation;
      const degrees = Math.round(carpetRotation * 180 / Math.PI);
      document.getElementById('rotation-display').textContent = degrees;
      logOnScreen(`Поворот: ${degrees}°`);
    };
    
    document.getElementById('rotate-right').onclick = () => {
      carpetRotation += Math.PI / 60; // ✅ ИСПРАВЛЕНО: +3 градуса (было +15)
      carpetGroup.rotation.y = carpetRotation;
      const degrees = Math.round(carpetRotation * 180 / Math.PI);
      document.getElementById('rotation-display').textContent = degrees;
      logOnScreen(`Поворот: ${degrees}°`);
    };
    
    document.getElementById('calibrate-reset').onclick = () => {
      carpetScale = 1.0;
      carpetRotation = 0;
      carpetGroup.scale.setScalar(carpetScale);
      carpetGroup.rotation.y = carpetRotation;
      document.getElementById('scale-display').textContent = '1.00';
      document.getElementById('rotation-display').textContent = '0';
      logOnScreen('🔄 Сброс калибровки');
    };
    
    document.getElementById('calibrate-ok').onclick = () => {
      calibrationPanel.style.display = 'none';
      
      // Запускаем машины ПОСЛЕ калибровки
      trafficManager.spawnCars(7);
      trafficManager.setGlobalScale(1.0);
      
      logOnScreen('✅ Калибровка завершена! Машины запущены');
    };
    
    // ===================================
    // HIT TEST SETUP
    // ===================================
    
    let hitTestSource = null;
    let xrSession = null;
    
    function onSessionStart(session) {
      xrSession = session;
      logOnScreen('🚀 AR сессия начата');
      
      session.addEventListener('end', onSessionEnd);
      
      placeButton.style.display = 'block';
      instructionText.style.display = 'block';
      
      logOnScreen('🔍 Запрос hit-test...');
      
      session.requestReferenceSpace('viewer').then((referenceSpace) => {
        logOnScreen('✅ Reference space OK');
        
        session.requestHitTestSource({ space: referenceSpace }).then((source) => {
          hitTestSource = source;
          logOnScreen('✅ Hit-test работает!');
        }).catch(err => {
          logOnScreen('❌ Hit-test: ' + err.message, true);
          instructionText.innerHTML = '⚠️ Hit-test не работает<br/>Попробуйте переместить камеру';
          
          // Fallback: показываем reticle вручную
          setTimeout(() => {
            reticle.visible = true;
            reticle.position.set(0, 0, -1);
            logOnScreen('⚠️ Используем fallback режим');
          }, 1000);
        });
      }).catch(err => {
        logOnScreen('❌ Reference space: ' + err.message, true);
      });
    }
    
    function onSessionEnd() {
      logOnScreen('🛑 AR сессия завершена');
      xrSession = null;
      hitTestSource = null;
      placeButton.style.display = 'none';
      instructionText.style.display = 'none';
      calibrationPanel.style.display = 'none';
      
      // ✅ ИСПРАВЛЕНО: Возврат на стартовую страницу
      if (renderer && renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      
      // Перезагрузка страницы для возврата на старт
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
    
    // ===================================
    // AR BUTTON
    // ===================================
    
    const arButton = ARButton.createButton(renderer, {
      optionalFeatures: ['hit-test', 'dom-overlay'],
      domOverlay: { root: document.body }
    });
    
    arButton.textContent = '🚀 AR';
    arButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      padding: 0;
      font-size: 24px;
      font-weight: bold;
      background: linear-gradient(135deg, #ff00ff 0%, #cc00cc 100%);
      color: #fff;
      border: 3px solid #ff00ff;
      border-radius: 50%;
      cursor: pointer;
      z-index: 3000;
      box-shadow: 0 0 20px rgba(255, 0, 255, 0.8);
      pointer-events: all;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    document.body.appendChild(arButton);
    
    logOnScreen('✅ AR кнопка создана');
    
    renderer.xr.addEventListener('sessionstart', () => {
      const session = renderer.xr.getSession();
      onSessionStart(session);
    });
    
    renderer.xr.addEventListener('sessionend', onSessionEnd);
    
    // ===================================
    // RENDER LOOP
    // ===================================
    
    let frameCount = 0;
    
    renderer.setAnimationLoop((timestamp, frame) => {
      frameCount++;
      
      if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        
        // HIT TEST: поиск плоскости
        if (hitTestSource && !isCalibrated) {
          try {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            
            if (hitTestResults.length > 0) {
              const hit = hitTestResults[0];
              const pose = hit.getPose(referenceSpace);
              
              if (pose) {
                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
                
                if (frameCount % 60 === 0) {
                  logOnScreen('✅ Поверхность найдена!');
                }
              }
            } else {
              reticle.visible = false;
              
              if (frameCount % 120 === 0) {
                logOnScreen('⚠️ Ищу поверхность...', true);
              }
            }
          } catch (err) {
            if (frameCount % 120 === 0) {
              logOnScreen('❌ Hit-test ошибка', true);
            }
          }
        }
        
        // Обновляем машины
        if (isCalibrated) {
          trafficManager.update();
          
          if (statsPanel) {
            const stats = trafficManager.getStats();
            statsPanel.update({
              mode: 'AR',
              tracking: isCalibrated,
              paused: false,
              cars: stats.activeCars,
              pooled: stats.pooledCars,
              scale: trafficManager.globalScaleMultiplier.toFixed(2)
            });
          }
        }
      }
      
      renderer.render(scene, camera);
    });
    
    // ===================================
    // RESIZE
    // ===================================
    
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    logOnScreen('✅ WebXR AR готов к запуску');
    console.log('✅ WebXR AR полностью инициализирован V15.2');
    
  } catch (error) {
    console.error('❌ Ошибка WebXR AR:', error);
    logOnScreen('❌ Критическая ошибка: ' + error.message, true);
    
    let message = 'AR режим не поддерживается';
    let suggestion = 'Используйте TOUCH режим';
    
    if (error.message.includes('WebXR не поддерживается')) {
      message = '❌ WebXR не поддерживается';
      suggestion = 'Требуется Chrome 90+ или Safari 15+';
    }
    
    alert(`${message}\n\n${suggestion}\n\nПереключитесь на TOUCH режим`);
    throw error;
  }
};