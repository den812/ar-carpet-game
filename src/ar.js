import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';

// ИСПРАВЛЕНИЕ 1: Импортируем функцию создания дорог
import { createRoadNetwork } from './roads/road_system.js';

// ИСПРАВЛЕНИЕ 2: Импортируем класс управления трафиком (вместо CarModels)
import { TrafficManager } from './traffic/traffic_manager.js';

export const startAR = async () => {
    // Получаем контейнер для AR
    const container = document.querySelector("#ar-container");

    // Инициализация MindAR
    const mindarThree = new MindARThree({
        container: container,
        imageTargetSrc: './assets/carpet.mind', // Файл меток
        maxTrack: 1, // Отслеживаем только 1 маркер
    });

    const { renderer, scene, camera } = mindarThree;

    // --- СВЕТ ---
    // Добавляем освещение, чтобы 3D модели были видны
    const ambientLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7); // Свет сверху-сбоку
    scene.add(dirLight);

    // --- ЯКОРЬ (ANCHOR) ---
    // Создаем группу, которая будет привязана к ковру
    const anchor = mindarThree.addAnchor(0);
    const gameGroup = new THREE.Group();
    anchor.group.add(gameGroup);

    // --- СОЗДАНИЕ МИРА ---
    
    // 1. Создаем дороги и добавляем их в gameGroup
    const roadNetwork = createRoadNetwork(gameGroup);

    // 2. Инициализируем менеджер трафика
    // Передаем ему сцену (или группу) и сеть дорог
    const trafficManager = new TrafficManager(gameGroup, roadNetwork);

    // --- ЗАПУСК AR ---
    try {
        await mindarThree.start();
        console.log("AR Engine started");

        // Спавним машины (например, 5 штук)
        // Вызываем это здесь, чтобы машины появились после старта трекинга
        if (trafficManager && typeof trafficManager.spawnCars === 'function') {
            trafficManager.spawnCars(5); 
        } else {
            console.error("TrafficManager не имеет метода spawnCars!");
        }

    } catch (error) {
        console.error("Failed to start AR:", error);
    }

    // --- ИГРОВОЙ ЦИКЛ (RENDER LOOP) ---
    renderer.setAnimationLoop(() => {
        // Обновляем движение машин
        if (trafficManager) {
            trafficManager.update();
        }

        // Рендерим сцену
        renderer.render(scene, camera);
    });
}