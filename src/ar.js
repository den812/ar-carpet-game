import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';

import { createRoadNetwork } from './roads/road_system.js';
import { TrafficManager } from './traffic/traffic_manager.js';
import { StatsPanel } from './ui/StatsPanel.js'; // ✅ ИСПРАВЛЕН путь

export const startAR = async () => {
    const container = document.querySelector("#ar-container");

    // Создаем UI элементы
    const trackingUI = createTrackingUI();
    const statsPanel = new StatsPanel();
    
    console.log('🚀 Инициализация AR режима...');

    // 1. Инициализация MindAR
    const mindarThree = new MindARThree({
        container: container,
        imageTargetSrc: './assets/carpet.mind', 
        maxTrack: 1,
        filterMinCF: 0.0001,
        filterBeta: 0.001,
    });

    const { renderer, scene, camera } = mindarThree;

    // 2. Свет
    const ambientLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 3. Якорь (Anchor)
    const anchor = mindarThree.addAnchor(0);
    
    const gameGroup = new THREE.Group();
    anchor.group.add(gameGroup);

    // === ЛОГИКА ИГРЫ ===
    const roadNetwork = createRoadNetwork(gameGroup);
    const trafficManager = new TrafficManager(gameGroup, roadNetwork);

    // Состояние игры
    const gameState = {
        isTracking: false,
        isPaused: true,
        trackingLostTime: 0,
        warningThreshold: 2000,
        gameStarted: false,
    };

    // Обработчики трекинга
    anchor.onTargetFound = () => {
        console.log('🎯 Ковер найден!');
        gameState.isTracking = true;
        gameState.trackingLostTime = 0;
        
        trackingUI.show('found');
        
        if (gameState.isPaused && gameState.gameStarted) {
            resumeGame();
        }
        
        playTrackingSound('found');
    };

    anchor.onTargetLost = () => {
        console.log('❌ Ковер потерян');
        gameState.isTracking = false;
        gameState.trackingLostTime = Date.now();
        
        trackingUI.show('lost');
        pauseGame();
        playTrackingSound('lost');
    };

    function pauseGame() {
        if (!gameState.isPaused && trafficManager) {
            gameState.isPaused = true;
            if (trafficManager.pauseAll) trafficManager.pauseAll();
            console.log('⏸️ Игра на паузе');
        }
    }

    function resumeGame() {
        if (gameState.isPaused && trafficManager) {
            gameState.isPaused = false;
            if (trafficManager.resumeAll) trafficManager.resumeAll();
            console.log('▶️ Игра запущена');
        }
    }

    // === GUI ===
    const gui = new GUI({ title: 'Настройки AR' });
    const params = {
        scaleMultiplier: 1.0,
        count: 3,
        showStats: false,
        reload: () => {
            trafficManager.clearTraffic();
            trafficManager.spawnCars(params.count);
            trafficManager.setGlobalScale(params.scaleMultiplier);
            gameState.gameStarted = true;
            
            if (gameState.isTracking) {
                resumeGame();
            }
        }
    };

    gui.add(params, 'scaleMultiplier', 0.1, 3.0).name('🔍 Zoom машинок').onChange(val => {
        trafficManager.setGlobalScale(val);
    });
    
    gui.add(params, 'count', 1, 10).name('🚗 Кол-во машин').step(1);
    gui.add(params, 'reload').name('🔄 Запустить игру');
    
    gui.add(params, 'showStats').name('📊 Статистика').onChange(val => {
        if (val) {
            statsPanel.show();
        } else {
            statsPanel.hide();
        }
    });

    // === ЗАПУСК AR ===
    try {
        console.log('⏳ Запуск AR движка...');
        await mindarThree.start();
        console.log('✅ AR движок запущен');

        trackingUI.show('instruction');

    } catch (error) {
        console.error('❌ Ошибка запуска AR:', error);
        trackingUI.show('error', error.message);
    }

    // === ЦИКЛ РЕНДЕРИНГА ===
    renderer.setAnimationLoop(() => {
        // Проверяем долгую потерю трекинга
        if (!gameState.isTracking && gameState.trackingLostTime > 0) {
            const lostDuration = Date.now() - gameState.trackingLostTime;
            
            if (lostDuration > gameState.warningThreshold) {
                trackingUI.show('warning', lostDuration);
            }
        }

        // Обновляем машины
        if (trafficManager && !gameState.isPaused) {
            trafficManager.update();
        }

        // Обновляем статистику
        if (params.showStats && trafficManager.getStats) {
            const stats = trafficManager.getStats();
            statsPanel.update({
                mode: 'AR',
                tracking: gameState.isTracking,
                paused: gameState.isPaused,
                ...stats
            });
        }

        renderer.render(scene, camera);
    });

    // Очистка
    window.addEventListener('beforeunload', () => {
        if (trafficManager.dispose) trafficManager.dispose();
        mindarThree.stop();
        gui.destroy();
        trackingUI.destroy();
        statsPanel.destroy();
    });
};

// UI для трекинга
function createTrackingUI() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px 30px;
        border-radius: 15px;
        font-family: Arial, sans-serif;
        font-size: 18px;
        z-index: 10000;
        display: none;
        box-shadow: 0 8px 20px rgba(0,0,0,0.5);
        backdrop-filter: blur(15px);
        max-width: 90%;
        text-align: center;
    `;
    document.body.appendChild(notification);

    let hideTimeout;

    return {
        show(type, message = '') {
            clearTimeout(hideTimeout);
            
            const config = {
                found: {
                    icon: '✅',
                    text: 'Ковёр найден! Игра запущена',
                    bg: 'rgba(0, 200, 0, 0.95)',
                    duration: 3000
                },
                lost: {
                    icon: '⚠️',
                    text: 'Ковёр потерян<br><small>Наведите камеру на ковёр</small>',
                    bg: 'rgba(255, 150, 0, 0.95)',
                    duration: 0
                },
                warning: {
                    icon: '🔍',
                    text: `Ковёр не виден ${Math.round(parseInt(message) / 1000)} сек<br><small>Наведите камеру!</small>`,
                    bg: 'rgba(255, 50, 50, 0.95)',
                    duration: 0
                },
                instruction: {
                    icon: '📱',
                    text: '<strong>Наведите камеру на ковёр</strong><br><small>Затем нажмите "🔄 Запустить игру"</small>',
                    bg: 'rgba(50, 150, 255, 0.95)',
                    duration: 0
                },
                error: {
                    icon: '❌',
                    text: `Ошибка: ${message}`,
                    bg: 'rgba(200, 0, 0, 0.95)',
                    duration: 5000
                }
            };

            const cfg = config[type];
            notification.innerHTML = `<div style="font-size: 32px; margin-bottom: 10px;">${cfg.icon}</div>${cfg.text}`;
            notification.style.background = cfg.bg;
            notification.style.display = 'block';

            if (cfg.duration > 0) {
                hideTimeout = setTimeout(() => {
                    notification.style.display = 'none';
                }, cfg.duration);
            }
        },

        hide() {
            notification.style.display = 'none';
        },

        destroy() {
            notification.remove();
        }
    };
}

// Звуковые эффекты
function playTrackingSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = type === 'found' ? 800 : 400;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
        console.log('Sound not available');
    }
}