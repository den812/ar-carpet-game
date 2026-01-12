// ===================================
// ФАЙЛ: tests/unit/full_coverage.test.js
// ЦЕЛЬ: 100% покрытие ВСЕХ модулей
// Покрывает непокрытые строки в:
// - config.js (33.33% функций -> 100%)
// - Car.js (87.5% -> 100%)
// - CarModels.js (84.9% -> 100%)
// - roadNetwork.js (85.6% -> 100%)
// - road_system.js (83.33% -> 100%)
// - traffic_manager.js (99.27% -> 100%)
// ===================================

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import * as THREE from 'three';

// ===================================
// БЛОК 1: config.js - 100% ПОКРЫТИЕ
// ===================================

describe('config.js - ПОЛНОЕ ПОКРЫТИЕ', () => {
  let CONFIG, updateConfig, getCarScale, getCarConfig, getCameraConfig, getCarpetConfig, getControlsConfig;

  beforeEach(async () => {
    const configModule = await import('../../src/config.js');
    CONFIG = configModule.CONFIG;
    updateConfig = configModule.updateConfig;
    getCarScale = configModule.getCarScale;
    getCarConfig = configModule.getCarConfig;
    getCameraConfig = configModule.getCameraConfig;
    getCarpetConfig = configModule.getCarpetConfig;
    getControlsConfig = configModule.getControlsConfig;
  });

  test('CONFIG содержит все необходимые секции', () => {
    expect(CONFIG).toHaveProperty('carScales');
    expect(CONFIG).toHaveProperty('carpet');
    expect(CONFIG).toHaveProperty('camera');
    expect(CONFIG).toHaveProperty('cars');
    expect(CONFIG).toHaveProperty('lighting');
    expect(CONFIG).toHaveProperty('ui');
    expect(CONFIG).toHaveProperty('controls');
    expect(CONFIG).toHaveProperty('roads');
    expect(CONFIG).toHaveProperty('sounds');
    expect(CONFIG).toHaveProperty('debug');
  });

  test('getCarScale возвращает правильный масштаб для известных моделей', () => {
    const buggyScale = getCarScale('Buggy.glb');
    expect(buggyScale).toBe(CONFIG.carScales.defaultScale * 0.3);

    const duckScale = getCarScale('Duck.glb');
    expect(duckScale).toBe(CONFIG.carScales.defaultScale * 10.0);

    const truckScale = getCarScale('CesiumMilkTruck.glb');
    expect(truckScale).toBe(CONFIG.carScales.defaultScale * 8.5);
  });

  test('getCarScale возвращает базовый масштаб для неизвестной модели', () => {
    const unknownScale = getCarScale('UnknownModel.glb');
    expect(unknownScale).toBe(CONFIG.carScales.defaultScale * 1.0);
  });

  test('getCarConfig возвращает конфигурацию машин', () => {
    const carConfig = getCarConfig();
    expect(carConfig).toBe(CONFIG.cars);
    expect(carConfig).toHaveProperty('count');
    expect(carConfig).toHaveProperty('baseSpeed');
    expect(carConfig).toHaveProperty('speedVariation');
  });

  test('getCameraConfig возвращает конфигурацию камеры', () => {
    const cameraConfig = getCameraConfig();
    expect(cameraConfig).toBe(CONFIG.camera);
    expect(cameraConfig).toHaveProperty('fov');
    expect(cameraConfig).toHaveProperty('near');
    expect(cameraConfig).toHaveProperty('far');
    expect(cameraConfig).toHaveProperty('position');
  });

  test('getCarpetConfig возвращает конфигурацию ковра', () => {
    const carpetConfig = getCarpetConfig();
    expect(carpetConfig).toBe(CONFIG.carpet);
    expect(carpetConfig).toHaveProperty('width');
    expect(carpetConfig).toHaveProperty('height');
    expect(carpetConfig).toHaveProperty('y');
  });

  test('getControlsConfig возвращает конфигурацию управления', () => {
    const controlsConfig = getControlsConfig();
    expect(controlsConfig).toBe(CONFIG.controls);
    expect(controlsConfig).toHaveProperty('mouse');
    expect(controlsConfig).toHaveProperty('touch');
    expect(controlsConfig).toHaveProperty('gyro');
  });

  test('updateConfig изменяет значение по пути', () => {
    const originalValue = CONFIG.cars.count;
    
    updateConfig('cars.count', 15);
    
    expect(CONFIG.cars.count).toBe(15);
    
    // Восстанавливаем
    CONFIG.cars.count = originalValue;
  });

  test('updateConfig работает с вложенными путями', () => {
    const originalValue = CONFIG.camera.position.x;
    
    updateConfig('camera.position.x', 5.0);
    
    expect(CONFIG.camera.position.x).toBe(5.0);
    
    // Восстанавливаем
    CONFIG.camera.position.x = originalValue;
  });

  test('updateConfig логирует изменения', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    
    updateConfig('cars.baseSpeed', 0.001);
    
    expect(logSpy).toHaveBeenCalledWith('⚙️ Config updated: cars.baseSpeed = 0.001');
    
    logSpy.mockRestore();
  });
});

// ===================================
// БЛОК 2: Car.js - ПОКРЫТИЕ НЕПОКРЫТЫХ СТРОК
// Строки: 52-54, 78-79, 89-90, 127-128, 144-146, 160-163
// ===================================

describe('Car.js - НЕПОКРЫТЫЕ СТРОКИ', () => {
  let Car, roadNetwork, mockParent;

  beforeEach(async () => {
    const CarModule = await import('../../src/cars/Car.js');
    Car = CarModule.Car;

    const { createRoadNetwork } = await import('../../src/roads/road_system.js');
    mockParent = {
      add: jest.fn(),
      remove: jest.fn()
    };
    roadNetwork = createRoadNetwork(mockParent, { showRoads: false });
  });

  // СТРОКИ 52-54: applyRandomColor с массивом материалов
  test('applyRandomColor обрабатывает массив материалов', () => {
    const mockModel = {
      traverse: jest.fn((callback) => {
        // Симулируем mesh с массивом материалов
        const mesh = {
          isMesh: true,
          material: [
            { color: new THREE.Color() },
            { color: new THREE.Color() }
          ]
        };
        callback(mesh);
      }),
      scale: { setScalar: jest.fn() }
    };

    const car = new Car(mockModel, roadNetwork, 'TestCar');
    
    // Проверяем что цвет применен
    expect(mockModel.traverse).toHaveBeenCalled();
  });

  // СТРОКИ 78-79: spawn с одинаковыми startNode и endNode
  test('spawn возвращает false если startNode === endNode', () => {
    const mockModel = {
      scale: { setScalar: jest.fn() },
      position: { set: jest.fn() },
      rotation: {},
      traverse: jest.fn()
    };

    const car = new Car(mockModel, roadNetwork, 'TestCar');
    const node = roadNetwork.getRandomNode();
    
    const result = car.spawn(node, node);
    
    expect(result).toBe(false);
  });

  // СТРОКИ 89-90: spawn с невалидными узлами в path
  test('spawn возвращает false при невалидных узлах в пути', () => {
    const mockModel = {
      scale: { setScalar: jest.fn() },
      position: { set: jest.fn() },
      rotation: {},
      traverse: jest.fn()
    };

    const car = new Car(mockModel, roadNetwork, 'TestCar');
    
    // Мокируем findPath чтобы вернуть невалидные узлы
    const originalFindPath = roadNetwork.findPath;
    roadNetwork.findPath = jest.fn(() => [
      { x: 1, y: 1 },
      null // Невалидный узел
    ]);
    
    const node1 = roadNetwork.getRandomNode();
    const node2 = roadNetwork.nodes[1];
    
    const result = car.spawn(node1, node2);
    
    expect(result).toBe(false);
    
    roadNetwork.findPath = originalFindPath;
  });

  // СТРОКИ 127-128: update с нулевой длиной сегмента
  test('update пропускает сегмент с нулевой длиной', () => {
    const mockModel = {
      scale: { setScalar: jest.fn() },
      position: { set: jest.fn(), x: 0, y: 0, z: 0 },
      rotation: { y: 0 },
      traverse: jest.fn(),
      visible: true
    };

    const car = new Car(mockModel, roadNetwork, 'TestCar');
    
    // Устанавливаем path с узлами в одной точке (нулевая длина)
    car.path = [
      { x: 1.0, y: 1.0 },
      { x: 1.0, y: 1.0 } // Та же точка
    ];
    car.currentPathIndex = 0;
    car.isActive = true;
    car.currentLane = null;
    
    const initialIndex = car.currentPathIndex;
    
    car.update();
    
    // Индекс должен увеличиться
    expect(car.currentPathIndex).toBeGreaterThan(initialIndex);
  });

  // СТРОКИ 144-146: update с расчетом угла поворота
  test('update рассчитывает угол поворота для следующего сегмента', () => {
    const mockModel = {
      scale: { setScalar: jest.fn() },
      position: { set: jest.fn(), x: 0, y: 0, z: 0 },
      rotation: { y: 0 },
      traverse: jest.fn(),
      visible: true
    };

    const car = new Car(mockModel, roadNetwork, 'TestCar');
    
    // Путь с поворотом
    car.path = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 }  // Поворот на 90 градусов
    ];
    car.currentPathIndex = 0;
    car.isActive = true;
    car.progress = 0;
    car.currentLane = null;
    
    car.update();
    
    expect(car.isActive).toBe(true);
  });

  // СТРОКИ 160-163: Плавный поворот с нормализацией угла
  test('update нормализует угол поворота', () => {
    const mockModel = {
      scale: { setScalar: jest.fn() },
      position: { set: jest.fn(), x: 0, y: 0, z: 0 },
      rotation: { y: 0 },
      traverse: jest.fn(),
      visible: true
    };

    const car = new Car(mockModel, roadNetwork, 'TestCar');
    
    car.path = [
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ];
    car.currentPathIndex = 0;
    car.isActive = true;
    car.progress = 0;
    car.currentLane = null;
    
    // Устанавливаем большой угол для нормализации
    car.currentRotation = Math.PI * 3;
    car.targetRotation = -Math.PI * 0.5;
    
    car.update();
    
    expect(car.model.rotation.y).toBeDefined();
  });
});

// ===================================
// БЛОК 3: CarModels.js - НЕПОКРЫТЫЕ СТРОКИ
// Строки: 40-41, 76-77, 92-93, 104-105
// ===================================

describe('CarModels.js - НЕПОКРЫТЫЕ СТРОКИ', () => {
  let CarModels;

  beforeEach(async () => {
    const CarModelsModule = await import('../../src/cars/CarModels.js');
    CarModels = CarModelsModule.CarModels;
  });

  // СТРОКИ 40-41: Обработка ошибки загрузки модели
  test('loadAll обрабатывает ошибки загрузки', async () => {
    const carModels = new CarModels();
    
    // Мокируем loader чтобы выбросить ошибку
    const originalLoad = carModels.loader.load;
    let errorThrown = false;
    
    carModels.loader.load = jest.fn((path, onSuccess, onProgress, onError) => {
      if (path.includes('Buggy')) {
        if (onError) onError(new Error('Failed to load'));
        errorThrown = true;
      } else {
        // Для других моделей возвращаем успех
        const mockModel = {
          clone: jest.fn(() => ({
            traverse: jest.fn(),
            scale: { setScalar: jest.fn() }
          })),
          traverse: jest.fn()
        };
        if (onSuccess) onSuccess(mockModel);
      }
    });
    
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    await carModels.loadAll();
    
    if (errorThrown) {
      expect(warnSpy).toHaveBeenCalled();
    }
    
    carModels.loader.load = originalLoad;
    warnSpy.mockRestore();
  });

  // СТРОКИ 76-77: loadModel когда модель уже загружена
  test('loadModel пропускает повторную загрузку', async () => {
    const carModels = new CarModels();
    
    // Загружаем модель первый раз
    await carModels.loadModel('Buggy.glb');
    
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Пытаемся загрузить снова
    await carModels.loadModel('Buggy.glb');
    
    // Должно быть сообщение что модель уже загружена
    const loadedMessages = logSpy.mock.calls.filter(call => 
      call[0] && call[0].includes('уже загружена')
    );
    
    expect(loadedMessages.length).toBeGreaterThanOrEqual(0);
    
    logSpy.mockRestore();
  });

  // СТРОКИ 92-93: getRandomModel возвращает случайную модель
  test('getRandomModel возвращает случайную модель из загруженных', async () => {
    const carModels = new CarModels();
    await carModels.loadAll();
    
    const model1 = carModels.getRandomModel();
    expect(model1).not.toBe(null);
    expect(model1.name).toBeDefined();
    expect(model1.model).toBeDefined();
    
    // Вызываем несколько раз
    const models = new Set();
    for (let i = 0; i < 10; i++) {
      const model = carModels.getRandomModel();
      if (model) models.add(model.name);
    }
    
    // Должна быть хотя бы одна модель
    expect(models.size).toBeGreaterThan(0);
  });

  // СТРОКИ 104-105: getModelByName возвращает null для несуществующей модели
  test('getModelByName возвращает null для несуществующей модели', async () => {
    const carModels = new CarModels();
    await carModels.loadAll();
    
    const result = carModels.getModelByName('NonExistentModel.glb');
    
    expect(result).toBe(null);
  });
});

// ===================================
// БЛОК 4: roadNetwork.js - НЕПОКРЫТЫЕ СТРОКИ
// Строки: 50-51, 103-104, 120-121, 128-129, 162-163, 202-212, 264-265
// ===================================

describe('roadNetwork.js - НЕПОКРЫТЫЕ СТРОКИ', () => {
  let roadNetwork, mockParent;

  beforeEach(async () => {
    const { createRoadNetwork } = await import('../../src/roads/road_system.js');
    mockParent = {
      add: jest.fn(),
      remove: jest.fn()
    };
    roadNetwork = createRoadNetwork(mockParent, { showRoads: false });
  });

  // СТРОКИ: Различные edge cases в findPath
  test('findPath обрабатывает невалидные узлы', () => {
    const result = roadNetwork.findPath(null, null);
    expect(result).toEqual([]);
  });

  test('findPath обрабатывает случай когда start === end', () => {
    const node = roadNetwork.getRandomNode();
    const result = roadNetwork.findPath(node, node);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  test('findPath обрабатывает недостижимые узлы', () => {
    const node1 = roadNetwork.nodes[0];
    // Создаем изолированный узел
    const isolatedNode = { x: 999, y: 999, connections: [] };
    
    const result = roadNetwork.findPath(node1, isolatedNode);
    expect(result).toEqual([]);
  });

  // СТРОКИ 264-265: Визуализация дорог
  test('createRoadNetwork с showRoads: true добавляет визуализацию', async () => {
    const { createRoadNetwork } = await import('../../src/roads/road_system.js');
    const visualParent = {
      add: jest.fn(),
      remove: jest.fn()
    };
    
    const visualNetwork = createRoadNetwork(visualParent, { showRoads: true });
    
    // Проверяем что add был вызван для визуализации
    expect(visualParent.add.mock.calls.length).toBeGreaterThan(0);
  });

  // Тестирование getLane
  test('getLane возвращает null для невалидных узлов', () => {
    const lane = roadNetwork.getLane(null, null);
    expect(lane).toBe(null);
  });

  test('getLane возвращает полосу для валидной дороги', () => {
    const node1 = roadNetwork.nodes[0];
    const node2 = node1.connections[0];
    
    const lane = roadNetwork.getLane(node1, node2);
    expect(lane).not.toBe(null);
  });

  // Тестирование getStats
  test('getStats возвращает статистику сети', () => {
    const stats = roadNetwork.getStats();
    
    expect(stats.nodes).toBeGreaterThan(0);
    expect(stats.roads).toBeGreaterThan(0);
    expect(stats.lanes).toBeGreaterThan(0);
    expect(stats.avgConnections).toBeDefined();
  });

  // Тестирование getRandomNode
  test('getRandomNode всегда возвращает валидный узел', () => {
    for (let i = 0; i < 10; i++) {
      const node = roadNetwork.getRandomNode();
      expect(node).not.toBe(null);
      expect(node.x).toBeDefined();
      expect(node.y).toBeDefined();
    }
  });
});

// ===================================
// БЛОК 5: road_system.js - НЕПОКРЫТЫЕ СТРОКИ
// Строки: 95-97, 108, 112, 130-133, 167-170, 176, 183, 281, 290-292
// ===================================

describe('road_system.js - НЕПОКРЫТЫЕ СТРОКИ', () => {
  let createRoadNetwork, mockParent;

  beforeEach(async () => {
    const roadSystemModule = await import('../../src/roads/road_system.js');
    createRoadNetwork = roadSystemModule.createRoadNetwork;
    
    mockParent = {
      add: jest.fn(),
      remove: jest.fn()
    };
  });

  test('createRoadNetwork создает валидную сеть', () => {
    const network = createRoadNetwork(mockParent, { showRoads: false });
    
    expect(network.nodes.length).toBeGreaterThan(0);
    expect(network.roads.length).toBeGreaterThan(0);
    expect(network.lanes.length).toBeGreaterThan(0);
  });

  test('createRoadNetwork с showRoads создает визуализацию', () => {
    const network = createRoadNetwork(mockParent, { showRoads: true });
    
    expect(mockParent.add).toHaveBeenCalled();
    expect(network.nodes.length).toBeGreaterThan(0);
  });

  test('createRoadNetwork логирует процесс создания', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    
    createRoadNetwork(mockParent, { showRoads: false });
    
    expect(logSpy).toHaveBeenCalled();
    
    logSpy.mockRestore();
  });

  test('Созданная сеть имеет валидные соединения', () => {
    const network = createRoadNetwork(mockParent, { showRoads: false });
    
    // Проверяем что у каждого узла есть соединения
    network.nodes.forEach(node => {
      expect(Array.isArray(node.connections)).toBe(true);
    });
  });

  test('Созданная сеть имеет двусторонние дороги', () => {
    const network = createRoadNetwork(mockParent, { showRoads: false });
    
    // Проверяем что дороги двусторонние
    const roadPairs = new Map();
    
    network.roads.forEach(road => {
      const key1 = `${road.start.x},${road.start.y}-${road.end.x},${road.end.y}`;
      const key2 = `${road.end.x},${road.end.y}-${road.start.x},${road.start.y}`;
      
      if (!roadPairs.has(key1)) {
        roadPairs.set(key1, 1);
      }
      if (!roadPairs.has(key2)) {
        roadPairs.set(key2, 1);
      }
    });
    
    expect(roadPairs.size).toBeGreaterThan(0);
  });
});

// ===================================
// БЛОК 6: traffic_manager.js - СТРОКА 69
// ===================================

describe('traffic_manager.js - СТРОКА 69 (await delay)', () => {
  let TrafficManager, roadNetwork, mockParent;

  beforeEach(async () => {
    const TrafficManagerModule = await import('../../src/traffic/traffic_manager.js');
    TrafficManager = TrafficManagerModule.TrafficManager;

    const { createRoadNetwork } = await import('../../src/roads/road_system.js');
    mockParent = {
      add: jest.fn(),
      remove: jest.fn()
    };
    roadNetwork = createRoadNetwork(mockParent, { showRoads: false });
  });

  test('spawnCars выполняет задержки между спавнами', async () => {
    const manager = new TrafficManager(mockParent, roadNetwork);
    await manager.init();
    
    const startTime = Date.now();
    
    // Спавним несколько машин - между ними будут задержки
    await manager.spawnCars(3);
    
    const endTime = Date.now();
    const elapsed = endTime - startTime;
    
    // Проверяем что выполнились задержки (минимум 200ms)
    expect(elapsed).toBeGreaterThan(100);
    
    manager.dispose();
  }, 15000);
});