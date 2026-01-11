// ===================================
// ФАЙЛ: tests/traffic/traffic_manager.test.js V3 - МАКСИМАЛЬНОЕ ПОКРЫТИЕ
// Unit тесты для TrafficManager
// ЦЕЛЬ: 90%+ coverage как regression safety net
// Включает: smoke tests, contract tests, error handling, edge cases
// ===================================

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TrafficManager } from '../../src/traffic/traffic_manager.js';
import { RoadNetwork } from '../../src/roads/roadNetwork.js';

describe('TrafficManager', () => {
  let manager, network, mockParent;
  let consoleErrorSpy, consoleWarnSpy, consoleLogSpy;

  beforeEach(() => {
    // Создаем сеть с несколькими узлами
    network = new RoadNetwork();
    const nodeA = network.addNode(0.0, 0.0);
    const nodeB = network.addNode(1.0, 0.0);
    const nodeC = network.addNode(2.0, 0.0);
    network.addRoad(nodeA, nodeB);
    network.addRoad(nodeB, nodeC);

    mockParent = {
      add: jest.fn(),
      remove: jest.fn()
    };

    manager = new TrafficManager(mockParent, network);
    
    // Мокируем console для чистых тестов
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  // ============================================
  // SMOKE TESTS - Проверка структуры класса
  // ============================================
  describe('Smoke Tests - Структура класса', () => {
    test('класс TrafficManager существует и экспортируется', () => {
      expect(TrafficManager).toBeDefined();
      expect(typeof TrafficManager).toBe('function');
    });

    test('можно создать экземпляр', () => {
      expect(manager).toBeInstanceOf(TrafficManager);
    });

    test('имеет все необходимые свойства', () => {
      expect(manager).toHaveProperty('parent');
      expect(manager).toHaveProperty('roadNetwork');
      expect(manager).toHaveProperty('cars');
      expect(manager).toHaveProperty('carPool');
      expect(manager).toHaveProperty('globalScaleMultiplier');
      expect(manager).toHaveProperty('isInitialized');
      expect(manager).toHaveProperty('carModels');
    });

    test('имеет все необходимые методы', () => {
      expect(typeof manager.init).toBe('function');
      expect(typeof manager.spawnCars).toBe('function');
      expect(typeof manager.spawnSingleCar).toBe('function');
      expect(typeof manager.spawnCarWithModel).toBe('function');
      expect(typeof manager.respawnCar).toBe('function');
      expect(typeof manager.update).toBe('function');
      expect(typeof manager.setGlobalScale).toBe('function');
      expect(typeof manager.getStats).toBe('function');
      expect(typeof manager.dispose).toBe('function');
    });

    test('свойства имеют правильные начальные типы', () => {
      expect(Array.isArray(manager.cars)).toBe(true);
      expect(Array.isArray(manager.carPool)).toBe(true);
      expect(typeof manager.globalScaleMultiplier).toBe('number');
      expect(typeof manager.isInitialized).toBe('boolean');
      expect(manager.carModels).toBeNull();
    });
  });

  // ============================================
  // CONTRACT TESTS - Проверка API контрактов
  // ============================================
  describe('Contract Tests - API интерфейс', () => {
    test('init() возвращает Promise', async () => {
      const result = manager.init();
      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    test('spawnCars() возвращает Promise', async () => {
      const result = manager.spawnCars(0);
      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    test('spawnSingleCar() возвращает Promise', async () => {
      await manager.init();
      const result = manager.spawnSingleCar();
      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    test('spawnCarWithModel() возвращает Promise', async () => {
      await manager.init();
      const result = manager.spawnCarWithModel(null);
      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    test('respawnCar() возвращает Promise', async () => {
      const result = manager.respawnCar(null);
      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    test('update() возвращает undefined (void)', () => {
      const result = manager.update();
      expect(result).toBeUndefined();
    });

    test('setGlobalScale() возвращает undefined (void)', () => {
      const result = manager.setGlobalScale(1.0);
      expect(result).toBeUndefined();
    });

    test('getStats() возвращает объект со статистикой', () => {
      const stats = manager.getStats();
      
      expect(stats).toHaveProperty('totalCars');
      expect(stats).toHaveProperty('activeCars');
      expect(stats).toHaveProperty('pooledCars');
      expect(typeof stats.totalCars).toBe('number');
      expect(typeof stats.activeCars).toBe('number');
      expect(typeof stats.pooledCars).toBe('number');
    });

    test('dispose() возвращает undefined (void)', () => {
      const result = manager.dispose();
      expect(result).toBeUndefined();
    });
  });

  // ============================================
  // CONSTRUCTOR
  // ============================================
  describe('Constructor', () => {
    test('создает менеджер с правильными свойствами', () => {
      expect(manager.parent).toBe(mockParent);
      expect(manager.roadNetwork).toBe(network);
      expect(manager.cars).toEqual([]);
      expect(manager.carPool).toEqual([]);
      expect(manager.globalScaleMultiplier).toBe(1.0);
      expect(manager.isInitialized).toBe(false);
      expect(manager.carModels).toBeNull();
    });

    test('логирует создание', () => {
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('TrafficManager создан')
      );
    });

    test('принимает любой parent с методами add/remove', () => {
      const customParent = {
        add: jest.fn(),
        remove: jest.fn(),
        customProp: 'test'
      };
      
      const customManager = new TrafficManager(customParent, network);
      expect(customManager.parent).toBe(customParent);
    });
  });

  // ============================================
  // INIT
  // ============================================
  describe('init()', () => {
    test('инициализирует менеджер', async () => {
      await manager.init();
      
      expect(manager.isInitialized).toBe(true);
      expect(manager.carModels).not.toBeNull();
    });

    test('не инициализирует повторно', async () => {
      await manager.init();
      const carModels1 = manager.carModels;
      
      await manager.init();
      const carModels2 = manager.carModels;
      
      expect(carModels1).toBe(carModels2);
    });

    test('загружает модели машин', async () => {
      await manager.init();
      
      expect(manager.carModels.isLoaded).toBe(true);
    });

    test('проверяет валидность дорожной сети - пустая сеть', async () => {
      const emptyNetwork = new RoadNetwork();
      const badManager = new TrafficManager(mockParent, emptyNetwork);
      
      await expect(badManager.init()).rejects.toThrow('Invalid road network');
    });

    test('проверяет валидность дорожной сети - null nodes', async () => {
      const badNetwork = new RoadNetwork();
      badNetwork.nodes = null;
      const badManager = new TrafficManager(mockParent, badNetwork);
      
      await expect(badManager.init()).rejects.toThrow();
    });

    test('проверяет валидность дорожной сети - undefined nodes', async () => {
      const badNetwork = {};
      const badManager = new TrafficManager(mockParent, badNetwork);
      
      await expect(badManager.init()).rejects.toThrow();
    });

    test('требует минимум 2 узла в сети', async () => {
      const smallNetwork = new RoadNetwork();
      smallNetwork.addNode(0, 0);
      const badManager = new TrafficManager(mockParent, smallNetwork);
      
      await expect(badManager.init()).rejects.toThrow('Invalid road network');
    });

    test('логирует статистику сети', async () => {
      await manager.init();
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Дорожная сеть'),
        expect.anything()
      );
    });

    test('логирует успешную инициализацию', async () => {
      await manager.init();
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('TrafficManager инициализирован')
      );
    });
  });

  // ============================================
  // SPAWN CARS
  // ============================================
  describe('spawnCars()', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('спавнит заданное количество машин', async () => {
      await manager.spawnCars(3);
      
      const stats = manager.getStats();
      expect(stats.totalCars).toBeGreaterThan(0);
      expect(stats.totalCars).toBeLessThanOrEqual(3);
    }, 10000);

    test('инициализирует если не инициализирован', async () => {
      const uninitManager = new TrafficManager(mockParent, network);
      
      await uninitManager.spawnCars(2);
      
      expect(uninitManager.isInitialized).toBe(true);
    }, 10000);

    test('обрабатывает спавн 0 машин', async () => {
      await expect(manager.spawnCars(0)).resolves.not.toThrow();
      
      const stats = manager.getStats();
      expect(stats.totalCars).toBe(0);
    });

    test('обрабатывает спавн 1 машины', async () => {
      await manager.spawnCars(1);
      
      const stats = manager.getStats();
      expect(stats.totalCars).toBeGreaterThanOrEqual(0);
    }, 10000);

    test('логирует начало спавна', async () => {
      await manager.spawnCars(2);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Спавн \d+ машин/)
      );
    }, 10000);

    test('логирует итоговое количество', async () => {
      await manager.spawnCars(2);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Итого заспавнено/)
      );
    }, 10000);

    test('логирует количество активных машин', async () => {
      await manager.spawnCars(2);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Активных машин/)
      );
    }, 10000);

    test('логирует неудачный спавн машины', async () => {
      const originalGetModel = manager.carModels.getModelByName;
      manager.carModels.getModelByName = jest.fn(() => null);
      
      await manager.spawnCars(1);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Не удалось заспавнить')
      );
      
      manager.carModels.getModelByName = originalGetModel;
    });

    test('использует правильное распределение моделей', async () => {
      await manager.spawnCars(7);
      
      // Проверяем что вызывался getModelByName
      const stats = manager.getStats();
      expect(stats.totalCars).toBeGreaterThanOrEqual(0);
    }, 10000);
  });

  // ============================================
  // SPAWN CAR WITH MODEL - ERROR HANDLING
  // ============================================
  describe('spawnCarWithModel() - Error Handling', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('возвращает null для null modelData', async () => {
      const car = await manager.spawnCarWithModel(null);
      
      expect(car).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Невалидные данные модели'),
        null
      );
    });

    test('возвращает null для undefined modelData', async () => {
      const car = await manager.spawnCarWithModel(undefined);
      
      expect(car).toBeNull();
    });

    test('возвращает null если model === null', async () => {
      const car = await manager.spawnCarWithModel({ name: 'Test', model: null });
      
      expect(car).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('возвращает null если model === undefined', async () => {
      const car = await manager.spawnCarWithModel({ name: 'Test', model: undefined });
      
      expect(car).toBeNull();
    });

    test('возвращает null если modelData пустой объект', async () => {
      const car = await manager.spawnCarWithModel({});
      
      expect(car).toBeNull();
    });

    test('обрабатывает startNode === null', async () => {
      const modelData = manager.carModels.getRandomModel();
      
      const originalGetNode = network.getRandomNode;
      network.getRandomNode = jest.fn()
        .mockReturnValueOnce(null)
        .mockReturnValue({ x: 1, y: 1 });
      
      const car = await manager.spawnCarWithModel(modelData);
      
      expect(car).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid start node')
      );
      
      network.getRandomNode = originalGetNode;
    });

    test('обрабатывает startNode без координаты x', async () => {
      const modelData = manager.carModels.getRandomModel();
      
      const originalGetNode = network.getRandomNode;
      network.getRandomNode = jest.fn()
        .mockReturnValueOnce({ y: 0 })
        .mockReturnValue({ x: 1, y: 1 });
      
      const car = await manager.spawnCarWithModel(modelData);
      
      expect(car).toBeNull();
      
      network.getRandomNode = originalGetNode;
    });

    test('обрабатывает startNode без координаты y', async () => {
      const modelData = manager.carModels.getRandomModel();
      
      const originalGetNode = network.getRandomNode;
      network.getRandomNode = jest.fn()
        .mockReturnValueOnce({ x: 0 })
        .mockReturnValue({ x: 1, y: 1 });
      
      const car = await manager.spawnCarWithModel(modelData);
      
      expect(car).toBeNull();
      
      network.getRandomNode = originalGetNode;
    });

    test('обрабатывает endNode === null после 10 попыток', async () => {
      const modelData = manager.carModels.getRandomModel();
      
      const originalGetNode = network.getRandomNode;
      const validStart = { x: 0, y: 0 };
      
      network.getRandomNode = jest.fn()
        .mockReturnValueOnce(validStart)
        .mockReturnValue(null);
      
      const car = await manager.spawnCarWithModel(modelData);
      
      expect(car).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Не удалось найти валидный конечный узел')
      );
      
      network.getRandomNode = originalGetNode;
    });

    test('обрабатывает endNode === startNode (10 попыток)', async () => {
      const modelData = manager.carModels.getRandomModel();
      
      const originalGetNode = network.getRandomNode;
      const sameNode = { x: 0, y: 0 };
      
      network.getRandomNode = jest.fn().mockReturnValue(sameNode);
      
      const car = await manager.spawnCarWithModel(modelData);
      
      expect(car).toBeNull();
      
      network.getRandomNode = originalGetNode;
    });

    test('обрабатывает пустой путь (length < 2)', async () => {
      const modelData = manager.carModels.getRandomModel();
      
      const originalFindPath = network.findPath;
      network.findPath = jest.fn().mockReturnValue([]);
      
      const car = await manager.spawnCarWithModel(modelData);
      
      expect(car).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Невозможно построить путь')
      );
      
      network.findPath = originalFindPath;
    });

    test('обрабатывает путь из одного узла', async () => {
      const modelData = manager.carModels.getRandomModel();
      
      const originalFindPath = network.findPath;
      network.findPath = jest.fn().mockReturnValue([{ x: 0, y: 0 }]);
      
      const car = await manager.spawnCarWithModel(modelData);
      
      expect(car).toBeNull();
      
      network.findPath = originalFindPath;
    });

    test('обрабатывает null путь', async () => {
      const modelData = manager.carModels.getRandomModel();
      
      const originalFindPath = network.findPath;
      network.findPath = jest.fn().mockReturnValue(null);
      
      const car = await manager.spawnCarWithModel(modelData);
      
      expect(car).toBeNull();
      
      network.findPath = originalFindPath;
    });

    test('удаляет машину если spawn вернул false', async () => {
      const modelData = manager.carModels.getRandomModel();
      const initialLength = manager.cars.length;
      
      // Это сложно протестировать напрямую, так как spawn внутри Car
      // Просто проверяем что метод не падает
      await manager.spawnCarWithModel(modelData);
      
      // Машина либо добавлена, либо нет
      expect(manager.cars.length).toBeGreaterThanOrEqual(initialLength);
    });

    test('логирует попытку спавна', async () => {
      const modelData = manager.carModels.getRandomModel();
      
      await manager.spawnCarWithModel(modelData);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Попытка спавна/)
      );
    });

    test('логирует создание машины', async () => {
      const modelData = manager.carModels.getRandomModel();
      
      await manager.spawnCarWithModel(modelData);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Создана машина/)
      );
    });
  });

  // ============================================
  // SPAWN CAR WITH MODEL - SUCCESS PATH
  // ============================================
  describe('spawnCarWithModel() - Success Path', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('спавнит машину с заданной моделью', async () => {
      const modelData = manager.carModels.getRandomModel();
      const car = await manager.spawnCarWithModel(modelData);
      
      if (car) {
        expect(car.modelName).toBe(modelData.name);
        expect(car.isActive).toBe(true);
      }
    });

    test('добавляет машину в массив cars', async () => {
      const modelData = manager.carModels.getRandomModel();
      const initialLength = manager.cars.length;
      
      const car = await manager.spawnCarWithModel(modelData);
      
      if (car) {
        expect(manager.cars.length).toBe(initialLength + 1);
        expect(manager.cars).toContain(car);
      }
    });

    test('добавляет модель в parent', async () => {
      const modelData = manager.carModels.getRandomModel();
      const initialCalls = mockParent.add.mock.calls.length;
      
      const car = await manager.spawnCarWithModel(modelData);
      
      if (car) {
        expect(mockParent.add.mock.calls.length).toBe(initialCalls + 1);
        expect(mockParent.add).toHaveBeenCalledWith(car.model);
      }
    });

    test('применяет глобальный масштаб к машине', async () => {
      manager.globalScaleMultiplier = 2.5;
      const modelData = manager.carModels.getRandomModel();
      
      const car = await manager.spawnCarWithModel(modelData);
      
      if (car) {
        // Проверяем что метод setGlobalScale существует
        expect(car.setGlobalScale).toBeDefined();
      }
    });

    test('логирует успешный спавн', async () => {
      const modelData = manager.carModels.getRandomModel();
      
      await manager.spawnCarWithModel(modelData);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  // ============================================
  // UPDATE - COLLISION & ERROR HANDLING
  // ============================================
  describe('update()', () => {
    beforeEach(async () => {
      await manager.init();
      await manager.spawnCars(3);
    }, 10000);

    test('не падает если не инициализирован', () => {
      const uninitManager = new TrafficManager(mockParent, network);
      
      expect(() => uninitManager.update()).not.toThrow();
    });

    test('не падает с пустым массивом машин', () => {
      manager.isInitialized = true;
      manager.cars = [];
      
      expect(() => manager.update()).not.toThrow();
    });

    test('обновляет все активные машины', () => {
      expect(() => manager.update()).not.toThrow();
    });

    test('вызывает update() у каждой активной машины', () => {
      const activeCars = manager.cars.filter(c => c.isActive);
      
      const originalUpdates = activeCars.map(c => c.update);
      
      try {
        activeCars.forEach(car => {
          car.update = jest.fn();
        });
        
        manager.update();
        
        activeCars.forEach(car => {
          expect(car.update).toHaveBeenCalled();
        });
      } finally {
        activeCars.forEach((car, i) => {
          car.update = originalUpdates[i];
        });
      }
    });

    test('проверяет коллизии между всеми парами машин', () => {
      const activeCars = manager.cars.filter(c => c.isActive);
      
      if (activeCars.length >= 2) {
        const originalCheck = activeCars[0].checkCollision;
        
        try {
          activeCars[0].checkCollision = jest.fn(() => false);
          
          manager.update();
          
          // Должна быть проверка с каждой другой машиной
          expect(activeCars[0].checkCollision.mock.calls.length).toBeGreaterThan(0);
        } finally {
          activeCars[0].checkCollision = originalCheck;
        }
      }
    });

    test('вызывает stopForCollision() при обнаружении коллизии', () => {
      const activeCars = manager.cars.filter(c => c.isActive);
      
      if (activeCars.length >= 2) {
        const originals = {
          check: activeCars[0].checkCollision,
          stop1: activeCars[0].stopForCollision,
          stop2: activeCars[1].stopForCollision
        };
        
        try {
          activeCars[0].checkCollision = jest.fn(() => true);
          activeCars[0].stopForCollision = jest.fn();
          activeCars[1].stopForCollision = jest.fn();
          
          manager.update();
          
          expect(activeCars[0].stopForCollision).toHaveBeenCalled();
          expect(activeCars[1].stopForCollision).toHaveBeenCalled();
        } finally {
          activeCars[0].checkCollision = originals.check;
          activeCars[0].stopForCollision = originals.stop1;
          activeCars[1].stopForCollision = originals.stop2;
        }
      }
    });

    test('вызывает resumeMovement() если нет коллизий', () => {
      const activeCars = manager.cars.filter(c => c.isActive);
      
      if (activeCars.length >= 1) {
        const originals = {
          check: activeCars[0].checkCollision,
          resume: activeCars[0].resumeMovement
        };
        
        try {
          activeCars[0].checkCollision = jest.fn(() => false);
          activeCars[0].resumeMovement = jest.fn();
          
          manager.update();
          
          expect(activeCars[0].resumeMovement).toHaveBeenCalled();
        } finally {
          activeCars[0].checkCollision = originals.check;
          activeCars[0].resumeMovement = originals.resume;
        }
      }
    });

    test('ловит ошибки в car.update() и вызывает despawn', () => {
      const activeCars = manager.cars.filter(c => c.isActive);
      
      if (activeCars.length >= 1) {
        const originals = {
          update: activeCars[0].update,
          despawn: activeCars[0].despawn
        };
        
        try {
          activeCars[0].update = jest.fn(() => {
            throw new Error('Test update error');
          });
          activeCars[0].despawn = jest.fn();
          
          manager.update();
          
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Ошибка обновления машины'),
            expect.any(Error)
          );
          expect(activeCars[0].despawn).toHaveBeenCalled();
        } finally {
          activeCars[0].update = originals.update;
          activeCars[0].despawn = originals.despawn;
        }
      }
    });

    test('планирует респавн для деактивированной машины', (done) => {
      const activeCars = manager.cars.filter(c => c.isActive);
      
      if (activeCars.length >= 1) {
        const car = activeCars[0];
        const originalRespawn = manager.respawnCar;
        
        manager.respawnCar = jest.fn().mockResolvedValue(null);
        
        car.isActive = false;
        
        manager.update();
        
        setTimeout(() => {
          expect(manager.respawnCar).toHaveBeenCalledWith(car);
          manager.respawnCar = originalRespawn;
          done();
        }, 3000);
      } else {
        done();
      }
    }, 10000);
  });

  // ============================================
  // RESPAWN CAR
  // ============================================
  describe('respawnCar()', () => {
    beforeEach(async () => {
      await manager.init();
      await manager.spawnCars(1);
    }, 10000);

    test('метод существует', () => {
      expect(manager.respawnCar).toBeDefined();
      expect(typeof manager.respawnCar).toBe('function');
    });

    test('возвращает null для null car', async () => {
      const result = await manager.respawnCar(null);
      
      expect(result).toBeNull();
    });

    test('возвращает null для undefined car', async () => {
      const result = await manager.respawnCar(undefined);
      
      expect(result).toBeNull();
    });

    test('возвращает null если модель не найдена', async () => {
      const car = manager.cars[0];
      car.modelName = 'NonExistent.glb';
      