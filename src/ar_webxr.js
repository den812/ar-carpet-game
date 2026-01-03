// ===================================
// ФАЙЛ: src/ar_webxr.js V26
// ИСПРАВЛЕНО:
// - Reticle исчезает после размещения ковра
// - StatsPanel получает корректные данные
// - Улучшена обработка после размещения
// ===================================

import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { createRoadNetwork } from './roads/road_system.js';
import { TrafficManager } from './traffic/traffic_manager.js';
import { StatsPanel } from './ui/StatsPanel.js';
import { ControlPanel } from './ui/ControlPanel.js';

export const startAR = async (settings = {}) => {
  try {
    console.log('🚀 AR START');
    
    if (!navigator.xr) {
      throw new Error('WebXR не поддерживается этим браузером');
    }
    
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      const err = new Error('Требуется HTTPS');
      err.userMessage = 'AR режим не работает:\nТребуется HTTPS (сейчас HTTP)\n\nПереключаюсь на TOUCH режим.';
      throw err;
    }
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(1, 2, 1);
    scene.add(light);
    
    const group = new THREE.Group();
    group.visible = false;
    scene.add(group);
    
    let network, traffic;
    try {
      network = createRoadNetwork(group, { showRoads: settings.showRoads });
      traffic = new TrafficManager(group, network);
      await traffic.init();
      console.log('✅ Дорожная сеть и TrafficManager инициализированы');
    } catch (err) {
      console.error('❌ Ошибка создания дорожной сети:', err);
      throw new Error('Не удалось инициализировать игру');
    }
    
    // ✅ UI панели с сохранением ссылок
    let statsPanel = null;
    let controlPanel = null;
    
    try {
      if (settings.showStats !== false) {
        statsPanel = new StatsPanel();
        statsPanel.show();
        console.log('✅ StatsPanel создан');
      }
      if (settings.showControl !== false) {
        controlPanel = new ControlPanel(traffic);
        controlPanel.show();
        console.log('✅ ControlPanel создан');
      }
    } catch (err) {
      console.warn('⚠️ Ошибка создания UI:', err);
    }
    
    // Reticle для размещения ковра
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    
    let placed = false;
    let hitSrc = null;
    let hitReq = false;
    
    // Кнопка размещения
    const btn = document.createElement('button');
    btn.textContent = '📍 РАЗМЕСТИТЬ КОВЕР';
    btn.style.cssText = 'position:fixed;bottom:20%;left:50%;transform:translateX(-50%);padding:15px 30px;font-size:20px;background:#0f0;color:#000;border:3px solid #0f0;border-radius:12px;cursor:pointer;z-index:9999;display:none;';
    document.body.appendChild(btn);
    
    btn.onclick = () => {
      if (!reticle.visible) return;
      
      try {
        const p = new THREE.Vector3();
        reticle.getWorldPosition(p);
        group.position.copy(p);
        group.position.y += 0.01;
        group.visible = true;
        placed = true;
        
        // ✅ ИСПРАВЛЕНО: Скрываем reticle и кнопку
        reticle.visible = false;
        btn.style.display = 'none';
        
        console.log('✅ Ковер размещен, запуск машин...');
        
        traffic.spawnCars(7).then(() => {
          console.log('✅ Машины заспавнены');
        }).catch(err => {
          console.error('❌ Ошибка спавна машин:', err);
        });
        
        traffic.setGlobalScale(1.0);
      } catch (err) {
        console.error('❌ Ошибка размещения ковра:', err);
        alert('Ошибка размещения. Попробуйте снова.');
      }
    };
    
    // AR кнопка
    const arBtn = ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.body }
    });
    arBtn.style.cssText = 'position:fixed;bottom:5%;right:5%;padding:15px;background:#f0f;color:#fff;border:none;border-radius:50%;font-size:20px;z-index:9999;';
    arBtn.textContent = '🚀 AR';
    document.body.appendChild(arBtn);
    
    renderer.xr.addEventListener('sessionstart', () => {
      console.log('✅ AR сессия запущена');
      btn.style.display = 'block';
      arBtn.style.display = 'none';
    });
    
    renderer.xr.addEventListener('sessionend', () => {
      console.log('🛑 AR сессия завершена');
      location.reload();
    });
    
    // Основной render loop
    renderer.setAnimationLoop((t, frame) => {
      try {
        if (frame) {
          const ref = renderer.xr.getReferenceSpace();
          const ses = renderer.xr.getSession();
          
          // Hit-test только ДО размещения ковра
          if (!hitReq && ses && !placed) {
            ses.requestReferenceSpace('viewer').then(s => {
              ses.requestHitTestSource({ space: s }).then(h => {
                hitSrc = h;
                console.log('✅ Hit-test source создан');
              }).catch(err => {
                console.warn('⚠️ Hit-test недоступен:', err);
              });
            }).catch(err => {
              console.warn('⚠️ Viewer space недоступен:', err);
            });
            hitReq = true;
          }
          
          // ✅ ИСПРАВЛЕНО: Hit-test только до размещения
          if (hitSrc && !placed) {
            try {
              const hits = frame.getHitTestResults(hitSrc);
              if (hits.length > 0) {
                const pose = hits[0].getPose(ref);
                if (pose) {
                  reticle.visible = true;
                  reticle.matrix.fromArray(pose.transform.matrix);
                }
              } else {
                reticle.visible = false;
              }
            } catch (e) {
              // Игнорируем ошибки hit-test
            }
          } else if (placed && reticle.visible) {
            // ✅ Дополнительная защита: принудительно скрываем reticle
            reticle.visible = false;
          }
          
          // Обновляем машины после размещения
          if (placed) {
            try {
              traffic.update();
              
              // ✅ ИСПРАВЛЕНО: Обновляем StatsPanel
              if (statsPanel && statsPanel.isVisible) {
                const stats = traffic.getStats();
                statsPanel.update({
                  mode: 'AR',
                  tracking: true,
                  paused: false,
                  cars: stats.activeCars || 0,
                  pooled: stats.pooledCars || 0,
                  scale: traffic.globalScaleMultiplier.toFixed(2),
                  cameraRadius: 'N/A'
                });
              }
            } catch (err) {
              console.error('❌ Ошибка обновления:', err);
            }
          }
        }
        
        renderer.render(scene, camera);
      } catch (err) {
        console.error('❌ Ошибка в render loop:', err);
      }
    });
    
    // Resize handler
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    console.log('✅ AR инициализирован');
    
  } catch (err) {
    console.error('❌ AR ERROR:', err);
    
    let message = 'AR режим не работает:\n\n';
    
    if (err.userMessage) {
      message = err.userMessage;
    } else if (err.message.includes('WebXR')) {
      message += '• Браузер не поддерживает WebXR\n';
      message += '• Используйте Chrome/Edge на Android\n';
      message += '• Или Safari на iOS 15+\n\n';
      message += 'Переключаюсь на TOUCH режим.';
    } else if (err.message.includes('HTTPS')) {
      message += '• Требуется HTTPS (сейчас HTTP)\n\n';
      message += 'Переключаюсь на TOUCH режим.';
    } else {
      message += err.message + '\n\n';
      message += 'Переключаюсь на TOUCH режим.';
    }
    
    alert(message);
    throw err;
  }
};