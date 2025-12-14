import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
// Импорт GUI
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';

import { createRoadNetwork } from './roads/road_system.js';
import { TrafficManager } from './traffic/traffic_manager.js';

export const startAR = async () => {
    const container = document.querySelector("#ar-container");

    // 1. Инициализация MindAR
    const mindarThree = new MindARThree({
        container: container,
        imageTargetSrc: './assets/carpet.mind', 
        maxTrack: 1, // Один маркер
    });

    const { renderer, scene, camera } = mindarThree;

    // 2. Свет (важно для AR)
    const ambientLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 3. Якорь (Anchor)
    const anchor = mindarThree.addAnchor(0);
    
    // Создаем группу, которая будет "сидеть" на ковре
    const gameGroup = new THREE.Group();
    anchor.group.add(gameGroup);

    // === ЛОГИКА ИГРЫ ===

    // Создаем дорожную сеть внутри gameGroup
    const roadNetwork = createRoadNetwork(gameGroup);

    // Создаем менеджер трафика
    const trafficManager = new TrafficManager(gameGroup, roadNetwork);

    // === GUI (ПАНЕЛЬ УПРАВЛЕНИЯ) ===
    const gui = new GUI({ title: 'Настройки AR' });
    const params = {
        scaleMultiplier: 1.0, // Множитель (Zoom)
        count: 3,
        reload: () => {
            trafficManager.clearTraffic();
            trafficManager.spawnCars(params.count);
            trafficManager.setGlobalScale(params.scaleMultiplier);
        }
    };

    gui.add(params, 'scaleMultiplier', 0.1, 3.0).name('Zoom Машинок').onChange(val => {
        trafficManager.setGlobalScale(val);
    });
    
    gui.add(params, 'count', 1, 10).name('Кол-во машин').step(1);
    
    gui.add(params, 'reload').name('Сброс / Старт');

    // === ЗАПУСК AR ===
    try {
        await mindarThree.start();
        console.log("AR Engine started");

        // Стартуем логику после запуска AR
        params.reload();

    } catch (error) {
        console.error("Failed to start AR:", error);
    }

    // === ЦИКЛ РЕНДЕРИНГА ===
    renderer.setAnimationLoop(() => {
        // Обновляем машины (движение)
        if (trafficManager) {
            trafficManager.update();
        }

        renderer.render(scene, camera);
    });
};