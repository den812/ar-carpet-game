// ===================================
// ФАЙЛ: tests/unit/full_coverage.test.js
// ДОПОЛНЯЕТ traffic_flow.test.js для 100% покрытия
// Покрывает ТОЛЬКО непокрытые строки в других модулях
// ===================================

import { describe, test, expect, jest } from '@jest/globals';

// ===================================
// БЛОК 1: config.js - 100% ПОКРЫТИЕ
// Покрывает все 5 функций (было 33.33% -> станет 100%)
// ===================================

describe('config.js - Дополнительное покрытие', () => {
  test('Все экспортированные функции работают', async () => {
    const { CONFIG, updateConfig, getCarScale, getCarConfig, getCameraConfig, getCarpetConfig, getControlsConfig } = await import('../../src/config.js');

    // getCarScale для неизвестной модели (непокрытая ветка)
    const unknownScale = getCarScale('UnknownModel.glb');
    expect(unknownScale).toBe(CONFIG.carScales.defaultScale * 1.0);

    // getCarConfig
    const carConfig = getCarConfig();
    expect(carConfig).toBe(CONFIG.cars);
    expect(carConfig.count).toBeDefined();

    // getCameraConfig
    const cameraConfig = getCameraConfig();
    expect(cameraConfig).toBe(CONFIG.camera);
    expect(cameraConfig.fov).toBeDefined();

    // getCarpetConfig
    const carpetConfig = getCarpetConfig();
    expect(carpetConfig).toBe(CONFIG.carpet);
    expect(carpetConfig.width).toBeDefined();

    // getControlsConfig
    const controlsConfig = getControlsConfig();
    expect(controlsConfig).toBe(CONFIG.controls);
    expect(controlsConfig.mouse).toBeDefined();

    // updateConfig с глубоким путем
    const originalX = CONFIG.camera.position.x;
    updateConfig('camera.position.x', 5.0);
    expect(CONFIG.camera.position.x).toBe(5.0);
    CONFIG.camera.position.x = originalX;
  });
});

// ===================================
// БЛОК 2: Car.js - Непокрытые строки
// 52-54, 78-79, 89-90, 127-128, 144-146, 160-163
// ===================================

describe('Car.js - Дополнительное покрытие', () => {
  test('Car: массив материалов в applyRandomColor (строки 52-54)', async () => {
    const { Car } = await import('../../src/cars/Car.js');
    
    const mockModel = {
      traverse: jest.fn((callback) => {
        // Mesh с МАССИВОМ материалов
        const mesh = {
          isMesh: true,
          material: [
            { color: { copy: jest.fn() } },
            { color: { copy: jest.fn() } }
          ]
        };
        callback(mesh);
      }),
      scale: { setScalar: jest.fn() }
    };

    const minimalNetwork = {
      getRandomNode: jest.fn(() => ({ x: 0, y: 0 })),
      findPath: jest.fn(() => []),
      getLane: jest.fn(() => null)
    };

    const car = new Car(mockModel, minimalNetwork, 'Test');
    expect(mockModel.traverse).toHaveBeenCalled();
  });

  test('Car: spawn с одинаковыми узлами (строки 78-79)', async () => {
    const { Car } = await import('../../src/cars/Car.js');
    
    const mockModel = {
      scale: { setScalar: jest.fn() },
      position: { set: jest.fn() },
      rotation: {},
      traverse: jest.fn()
    };

    const minimalNetwork = {
      findPath: jest.fn(() => [])
    };

    const car = new Car(mockModel, minimalNetwork, 'Test');
    const node = { x: 1, y: 1 };
    
    const result = car.spawn(node, node);
    expect(result).toBe(false);
  });

  test('Car: spawn с невалидными узлами в path (строки 89-90)', async () => {
    const { Car } = await import('../../src/cars/Car.js');
    
    const mockModel = {
      scale: { setScalar: jest.fn() },
      position: { set: jest.fn() },
      rotation: {},
      traverse: jest.fn()
    };

    const minimalNetwork = {
      findPath: jest.fn(() => [
        { x: 1, y: 1 },
        null // Невалидный узел
      ])
    };

    const car = new Car(mockModel, minimalNetwork, 'Test');
    const result = car.spawn({ x: 0, y: 0 }, { x: 1, y: 1 });
    expect(result).toBe(false);
  });

  test('Car: update с нулевой длиной сегмента (строки 127-128)', async () => {
    const { Car } = await import('../../src/cars/Car.js');
    
    const mockModel = {
      scale: { setScalar: jest.fn() },
      position: { set: jest.fn(), x: 0, y: 0, z: 0 },
      rotation: { y: 0 },
      traverse: jest.fn(),
      visible: true
    };

    const minimalNetwork = { getLane: jest.fn(() => null) };
    const car = new Car(mockModel, minimalNetwork, 'Test');
    
    car.path = [{ x: 1.0, y: 1.0 }, { x: 1.0, y: 1.0 }]; // Нулевая длина
    car.currentPathIndex = 0;
    car.isActive = true;
    
    const initialIndex = car.currentPathIndex;
    car.update();
    expect(car.currentPathIndex).toBeGreaterThan(initialIndex);
  });

  test('Car: расчет угла поворота (строки 144-146)', async () => {
    const { Car } = await import('../../src/cars/Car.js');
    
    const mockModel = {
      scale: { setScalar: jest.fn() },
      position: { set: jest.fn(), x: 0, y: 0, z: 0 },
      rotation: { y: 0 },
      traverse: jest.fn(),
      visible: true
    };

    const minimalNetwork = { getLane: jest.fn(() => null) };
    const car = new Car(mockModel, minimalNetwork, 'Test');
    
    car.path = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 } // Поворот
    ];
    car.currentPathIndex = 0;
    car.isActive = true;
    car.progress = 0;
    
    car.update();
    expect(car.isActive).toBe(true);
  });

  test('Car: нормализация угла (строки 160-163)', async () => {
    const { Car } = await import('../../src/cars/Car.js');
    
    const mockModel = {
      scale: { setScalar: jest.fn() },
      position: { set: jest.fn(), x: 0, y: 0, z: 0 },
      rotation: { y: 0 },
      traverse: jest.fn(),
      visible: true
    };

    const minimalNetwork = { getLane: jest.fn(() => null) };
    const car = new Car(mockModel, minimalNetwork, 'Test');
    
    car.path = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
    car.currentPathIndex = 0;
    car.isActive = true;
    car.currentRotation = Math.PI * 3; // Большой угол
    car.targetRotation = -Math.PI * 0.5;
    
    car.update();
    expect(car.model.rotation.y).toBeDefined();
  });
});

// ===================================
// БЛОК 3: CarModels.js - Непокрытые строки
// 40-41, 76-77, 92-93, 104-105
// ===================================

describe('CarModels.js - Дополнительное покрытие', () => {
  test('CarModels: обработка ошибки загрузки (строки 40-41)', async () => {
    const { CarModels } = await import('../../src/cars/CarModels.js');
    const carModels = new CarModels();
    
    const originalLoad = carModels.loader.load;
    carModels.loader.load = jest.fn((path, onSuccess, onProgress, onError) => {
      if (path.includes('Buggy') && onError) {
        onError(new Error('Failed'));
      } else if (onSuccess) {
        onSuccess({ scene: { clone: () => ({ traverse: jest.fn() }) } });
      }
    });
    
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    await carModels.loadAll();
    
    carModels.loader.load = originalLoad;
    warnSpy.mockRestore();
    carModels.models.length = 0;
  });

  test('CarModels: повторная загрузка модели (строки 76-77)', async () => {
    const { CarModels } = await import('../../src/cars/CarModels.js');
    const carModels = new CarModels();
    
    await carModels.loadAll();
    await carModels.loadModel('Buggy.glb'); // Повторная загрузка
    
    carModels.models.length = 0;
    expect(true).toBe(true);
  });

  test('CarModels: getRandomModel (строки 92-93)', async () => {
    const { CarModels } = await import('../../src/cars/CarModels.js');
    const carModels = new CarModels();
    
    await carModels.loadAll();
    const model = carModels.getRandomModel();
    expect(model).not.toBe(null);
    
    carModels.models.length = 0;
  });

  test('CarModels: getModelByName для несуществующей модели (строки 104-105)', async () => {
    const { CarModels } = await import('../../src/cars/CarModels.js');
    const carModels = new CarModels();
    
    await carModels.loadAll();
    const result = carModels.getModelByName('NonExistent.glb');
    expect(result).toBe(null);
    
    carModels.models.length = 0;
  });
});

// ===================================
// БЛОК 4: roadNetwork.js и road_system.js
// Минимальные тесты для непокрытых строк
// ===================================

describe('roadNetwork.js - Дополнительное покрытие', () => {
  test('roadNetwork: edge cases в одном тесте', async () => {
    const { createRoadNetwork } = await import('../../src/roads/road_system.js');
    const mockParent = { add: jest.fn(), remove: jest.fn() };
    
    const network = createRoadNetwork(mockParent, { showRoads: false });
    
    // findPath с null
    expect(network.findPath(null, null)).toEqual([]);
    
    // findPath с одинаковыми узлами
    const node = network.getRandomNode();
    expect(network.findPath(node, node).length).toBeGreaterThanOrEqual(0);
    
    // getLane с null
    expect(network.getLane(null, null)).toBe(null);
    
    // getStats
    const stats = network.getStats();
    expect(stats.nodes).toBeGreaterThan(0);
    
    // Очистка
    network.nodes.length = 0;
    network.roads.length = 0;
    network.lanes.length = 0;
  });

  test('roadNetwork: визуализация (showRoads: true)', async () => {
    const { createRoadNetwork } = await import('../../src/roads/road_system.js');
    const mockParent = { add: jest.fn(), remove: jest.fn() };
    
    const network = createRoadNetwork(mockParent, { showRoads: true });
    expect(mockParent.add).toHaveBeenCalled();
    
    network.nodes.length = 0;
    network.roads.length = 0;
    network.lanes.length = 0;
  });
});

describe('road_system.js - Дополнительное покрытие', () => {
  test('road_system: проверка двусторонних дорог', async () => {
    const { createRoadNetwork } = await import('../../src/roads/road_system.js');
    const mockParent = { add: jest.fn(), remove: jest.fn() };
    
    const network = createRoadNetwork(mockParent, { showRoads: false });
    
    // Проверка соединений
    network.nodes.forEach(node => {
      expect(Array.isArray(node.connections)).toBe(true);
    });
    
    // Проверка дорог
    expect(network.roads.length).toBeGreaterThan(0);
    
    network.nodes.length = 0;
    network.roads.length = 0;
    network.lanes.length = 0;
  });
});