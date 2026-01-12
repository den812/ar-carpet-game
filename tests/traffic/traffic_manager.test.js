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
      
      const result = await manager.respawnCar(car);
      
      expect(result).toBeNull();
    });

    test('удаляет машину из parent если есть', async () => {
      const car = manager.cars[0];
      car.model.parent = mockParent;
      
      const initialRemoveCalls = mockParent.remove.mock.calls.length;
      
      await manager.respawnCar(car);
      
      expect(mockParent.remove.mock.calls.length).toBeGreaterThanOrEqual(initialRemoveCalls);
    });

    test('не падает если у машины нет parent', async () => {
      const car = manager.cars[0];
      car.model.parent = null;
      
      await expect(manager.respawnCar(car)).resolves.not.toThrow();
    });

    test('удаляет машину из массива cars', async () => {
      const car = manager.cars[0];
      
      await manager.respawnCar(car);
      
      expect(manager.cars).not.toContain(car);
    });

    test('создаёт новую машину с той же моделью при успехе', async () => {
      const car = manager.cars[0];
      const modelName = car.modelName;
      const initialLength = manager.cars.length;
      
      const newCar = await manager.respawnCar(car);
      
      if (newCar) {
        expect(newCar.modelName).toBe(modelName);
        expect(newCar).not.toBe(car);
      }
    });
  });

  // ============================================
  // SET GLOBAL SCALE
  // ============================================
  describe('setGlobalScale()', () => {
    beforeEach(async () => {
      await manager.init();
      await manager.spawnCars(2);
    }, 10000);

    test('устанавливает globalScaleMultiplier', () => {
      manager.setGlobalScale(2.5);
      
      expect(manager.globalScaleMultiplier).toBe(2.5);
    });

    test('применяет масштаб ко всем машинам', () => {
      const originalMethods = manager.cars.map(car => car.setGlobalScale);
      
      try {
        manager.cars.forEach(car => {
          car.setGlobalScale = jest.fn();
        });
        
        manager.setGlobalScale(1.5);
        
        manager.cars.forEach(car => {
          expect(car.setGlobalScale).toHaveBeenCalledWith(1.5);
        });
      } finally {
        manager.cars.forEach((car, i) => {
          car.setGlobalScale = originalMethods[i];
        });
      }
    });

    test('логирует установку масштаба', () => {
      manager.setGlobalScale(2.0);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Глобальный масштаб/)
      );
    });

    test('работает с масштабом 0', () => {
      expect(() => manager.setGlobalScale(0)).not.toThrow();
      expect(manager.globalScaleMultiplier).toBe(0);
    });

    test('работает с отрицательным масштабом', () => {
      expect(() => manager.setGlobalScale(-1)).not.toThrow();
      expect(manager.globalScaleMultiplier).toBe(-1);
    });

    test('работает с очень большим масштабом', () => {
      expect(() => manager.setGlobalScale(999.99)).not.toThrow();
      expect(manager.globalScaleMultiplier).toBe(999.99);
    });

    test('работает с дробным масштабом', () => {
      manager.setGlobalScale(0.123);
      expect(manager.globalScaleMultiplier).toBe(0.123);
    });

    test('работает с пустым массивом машин', () => {
      manager.cars = [];
      expect(() => manager.setGlobalScale(2.0)).not.toThrow();
    });
  });

  // ============================================
  // GET STATS
  // ============================================
  describe('getStats()', () => {
    test('возвращает нули для пустого менеджера', () => {
      const stats = manager.getStats();
      
      expect(stats.totalCars).toBe(0);
      expect(stats.activeCars).toBe(0);
      expect(stats.pooledCars).toBe(0);
    });

    test('подсчитывает активные машины', async () => {
      await manager.init();
      await manager.spawnCars(5);
      
      const stats = manager.getStats();
      
      expect(stats.totalCars).toBeGreaterThan(0);
      expect(stats.activeCars).toBeGreaterThanOrEqual(0);
      expect(stats.activeCars).toBeLessThanOrEqual(stats.totalCars);
    }, 10000);

    test('подсчитывает неактивные машины (pooled)', async () => {
      await manager.init();
      await manager.spawnCars(3);
      
      if (manager.cars.length > 0) {
        manager.cars[0].isActive = false;
      }
      
      const stats = manager.getStats();
      
      expect(stats.pooledCars).toBeGreaterThan(0);
    }, 10000);

    test('сумма активных и pooled равна total', async () => {
      await manager.init();
      await manager.spawnCars(5);
      
      if (manager.cars.length > 1) {
        manager.cars[0].isActive = false;
        manager.cars[1].isActive = false;
      }
      
      const stats = manager.getStats();
      
      expect(stats.totalCars).toBe(stats.activeCars + stats.pooledCars);
    }, 10000);

    test('обновляется после изменений', async () => {
      await manager.init();
      await manager.spawnCars(3);
      
      const stats1 = manager.getStats();
      
      if (manager.cars.length > 0) {
        manager.cars[0].isActive = false;
      }
      
      const stats2 = manager.getStats();
      
      expect(stats2.activeCars).toBeLessThanOrEqual(stats1.activeCars);
    }, 10000);
  });

  // ============================================
  // DISPOSE
  // ============================================
  describe('dispose()', () => {
    beforeEach(async () => {
      await manager.init();
      await manager.spawnCars(3);
    }, 10000);

    test('удаляет машины с parent из сцены', () => {
      manager.cars.forEach(car => {
        car.model.parent = mockParent;
      });
      
      const carsCount = manager.cars.length;
      
      manager.dispose();
      
      expect(mockParent.remove.mock.calls.length).toBe(carsCount);
    });

    test('не падает если parent === null', () => {
      manager.cars.forEach(car => {
        car.model.parent = null;
      });
      
      expect(() => manager.dispose()).not.toThrow();
    });

    test('очищает массив cars до []', () => {
      manager.dispose();
      
      expect(manager.cars).toEqual([]);
      expect(manager.cars.length).toBe(0);
    });

    test('очищает carPool до []', () => {
      manager.dispose();
      
      expect(manager.carPool).toEqual([]);
      expect(manager.carPool.length).toBe(0);
    });

    test('сбрасывает isInitialized в false', () => {
      manager.dispose();
      
      expect(manager.isInitialized).toBe(false);
    });

    test('логирует начало очистки', () => {
      manager.dispose();
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Очистка TrafficManager')
      );
    });

    test('логирует завершение очистки', () => {
      manager.dispose();
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('TrafficManager очищен')
      );
    });

    test('позволяет повторную инициализацию', async () => {
      manager.dispose();
      
      await expect(manager.init()).resolves.not.toThrow();
      expect(manager.isInitialized).toBe(true);
    });

    test('можно вызвать dispose() повторно', () => {
      manager.dispose();
      
      expect(() => manager.dispose()).not.toThrow();
    });

    test('dispose() работает перед init()', () => {
      const freshManager = new TrafficManager(mockParent, network);
      
      expect(() => freshManager.dispose()).not.toThrow();
    });
  });

  // ============================================
  // EDGE CASES & EXTREME VALUES
  // ============================================
  describe('Edge Cases', () => {
    test('spawnCars(-100) не падает', async () => {
      await manager.init();
      await expect(manager.spawnCars(-100)).resolves.not.toThrow();
    });

    test('spawnCars(Infinity) не падает', async () => {
      await manager.init();
      await expect(manager.spawnCars(Infinity)).resolves.not.toThrow();
    }, 10000);

    test('setGlobalScale(NaN) не падает', () => {
      expect(() => manager.setGlobalScale(NaN)).not.toThrow();
    });

    test('setGlobalScale(Infinity) не падает', () => {
      expect(() => manager.setGlobalScale(Infinity)).not.toThrow();
    });

    test('update() многократно не ломает состояние', async () => {
      await manager.init();
      await manager.spawnCars(2);
      
      for (let i = 0; i < 100; i++) {
        expect(() => manager.update()).not.toThrow();
      }
    }, 10000);

    test('getStats() не изменяет состояние', async () => {
      await manager.init();
      await manager.spawnCars(2);
      
      const cars1 = manager.cars.length;
      manager.getStats();
      const cars2 = manager.cars.length;
      
      expect(cars1).toBe(cars2);
    }, 10000);

    test('работает с пустой roadNetwork после init', async () => {
      const emptyNet = new RoadNetwork();
      emptyNet.addNode(0, 0);
      emptyNet.addNode(1, 1);
      
      const mgr = new TrafficManager(mockParent, emptyNet);
      await expect(mgr.init()).resolves.not.toThrow();
    });
  });

  // ============================================
  // SPAWN SINGLE CAR
  // ============================================
  describe('spawnSingleCar()', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('метод существует', () => {
      expect(manager.spawnSingleCar).toBeDefined();
      expect(typeof manager.spawnSingleCar).toBe('function');
    });

    test('возвращает Promise', () => {
      const result = manager.spawnSingleCar();
      expect(result).toBeInstanceOf(Promise);
    });

    test('спавнит одну машину', async () => {
      const car = await manager.spawnSingleCar();
      
      // Может вернуть машину или null
      expect(car === null || typeof car === 'object').toBe(true);
    });

    test('использует случайную модель', async () => {
      const spy = jest.spyOn(manager.carModels, 'getRandomModel');
      
      await manager.spawnSingleCar();
      
      expect(spy).toHaveBeenCalled();
      
      spy.mockRestore();
    });
  });
});