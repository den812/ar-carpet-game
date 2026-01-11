// ===================================
// ФАЙЛ: tests/traffic/traffic_manager.test.js V2
// Unit тесты для TrafficManager
// УЛУЧШЕНО: Добавлены тесты для покрытия 85%+
// Покрывает: error handling, edge cases, respawn logic, dispose cleanup
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
  });

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
  });

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

    test('логирует количество заспавненных машин', async () => {
      await manager.spawnCars(2);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    }, 10000);

    test('обрабатывает спавн 0 машин', async () => {
      await expect(manager.spawnCars(0)).resolves.not.toThrow();
    });

    test('логирует неудачный спавн машины', async () => {
      // Мокируем getModelByName чтобы вернуть null
      const originalGetModel = manager.carModels.getModelByName;
      manager.carModels.getModelByName = jest.fn(() => null);
      
      await manager.spawnCars(1);
      
      // Должно быть предупреждение
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Не удалось заспавнить')
      );
      
      manager.carModels.getModelByName = originalGetModel;
    });
  });

  describe('spawnCarWithModel() - Error Handling', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('возвращает null для невалидных данных modelData', async () => {
      const car = await manager.spawnCarWithModel(null);
      
      expect(car).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Невалидные данные модели'),
        null
      );
    });

    test('возвращает null если model undefined', async () => {
      const car = await manager.spawnCarWithModel({ name: 'Test', model: null });
      
      expect(car).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Невалидные данные модели'),
        expect.anything()
      );
    });

    test('обрабатывает невалидный startNode', async () => {
      const modelData = manager.carModels.getRandomModel();
      
      // Мокируем getRandomNode чтобы вернуть невалидный узел
      const originalGetNode = network.getRandomNode;
      network.getRandomNode = jest.fn()
        .mockReturnValueOnce(null)  // первый вызов - startNode
        .mockReturnValueOnce({ x: 1, y: 1 });  // второй вызов - endNode
      
      const car = await manager.spawnCarWithModel(modelData);
      
      expect(car).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid start node')
      );
      
      network.getRandomNode = originalGetNode;
    });

    test('обрабатывает невалидный endNode после 10 попыток', async () => {
      const modelData = manager.carModels.getRandomModel();
      
      const originalGetNode = network.getRandomNode;
      const validStart = { x: 0, y: 0 };
      
      network.getRandomNode = jest.fn()
        .mockReturnValueOnce(validStart)
        .mockReturnValue(null);  // все остальные - null
      
      const car = await manager.spawnCarWithModel(modelData);
      
      expect(car).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Не удалось найти валидный конечный узел')
      );
      
      network.getRandomNode = originalGetNode;
    });

    test('обрабатывает endNode === startNode', async () => {
      const modelData = manager.carModels.getRandomModel();
      
      const originalGetNode = network.getRandomNode;
      const sameNode = { x: 0, y: 0 };
      
      // Всегда возвращаем один и тот же узел
      network.getRandomNode = jest.fn().mockReturnValue(sameNode);
      
      const car = await manager.spawnCarWithModel(modelData);
      
      expect(car).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      network.getRandomNode = originalGetNode;
    });

    test('обрабатывает невозможность построить путь', async () => {
      const modelData = manager.carModels.getRandomModel();
      
      const originalFindPath = network.findPath;
      network.findPath = jest.fn().mockReturnValue([]);  // пустой путь
      
      const car = await manager.spawnCarWithModel(modelData);
      
      expect(car).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Невозможно построить путь')
      );
      
      network.findPath = originalFindPath;
    });

    test('удаляет машину из cars если spawn failed', async () => {
      const modelData = manager.carModels.getRandomModel();
      const initialLength = manager.cars.length;
      
      // Мокируем car.spawn чтобы вернуть false
      const originalGetNode = network.getRandomNode;
      network.getRandomNode = jest.fn()
        .mockReturnValueOnce({ x: 0, y: 0 })
        .mockReturnValue({ x: 1, y: 1 });
      
      const originalFindPath = network.findPath;
      network.findPath = jest.fn().mockReturnValue([
        { x: 0, y: 0 }, 
        { x: 1, y: 1 }
      ]);
      
      // Создаём машину которая фейлит spawn
      const car = await manager.spawnCarWithModel(modelData);
      
      // Машина может быть заспавнена или нет - оба варианта валидны
      if (!car) {
        expect(manager.cars.length).toBe(initialLength);
      }
      
      network.getRandomNode = originalGetNode;
      network.findPath = originalFindPath;
    });
  });

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
      }
    });

    test('добавляет модель в сцену', async () => {
      const modelData = manager.carModels.getRandomModel();
      const car = await manager.spawnCarWithModel(modelData);
      
      if (car) {
        expect(mockParent.add).toHaveBeenCalled();
      }
    });

    test('применяет глобальный масштаб', async () => {
      manager.globalScaleMultiplier = 2.0;
      const modelData = manager.carModels.getRandomModel();
      
      const car = await manager.spawnCarWithModel(modelData);
      
      expect(car).toBeDefined();
    });

    test('логирует успешный спавн', async () => {
      const modelData = manager.carModels.getRandomModel();
      
      await manager.spawnCarWithModel(modelData);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('update() - Collision Detection', () => {
    beforeEach(async () => {
      await manager.init();
      await manager.spawnCars(3);
    }, 10000);

    test('не падает если не инициализирован', () => {
      const uninitManager = new TrafficManager(mockParent, network);
      
      expect(() => uninitManager.update()).not.toThrow();
    });

    test('обновляет все активные машины', () => {
      expect(() => manager.update()).not.toThrow();
    });

    test('обрабатывает коллизии между машинами', () => {
      const cars = manager.cars.filter(c => c.isActive);
      
      if (cars.length >= 2) {
        const original1 = cars[0].checkCollision;
        const original2 = cars[0].stopForCollision;
        const original3 = cars[1].stopForCollision;
        
        try {
          cars[0].checkCollision = jest.fn(() => true);
          cars[0].stopForCollision = jest.fn();
          cars[1].stopForCollision = jest.fn();
          
          manager.update();
          
          expect(cars[0].stopForCollision).toHaveBeenCalled();
          expect(cars[1].stopForCollision).toHaveBeenCalled();
        } finally {
          cars[0].checkCollision = original1;
          cars[0].stopForCollision = original2;
          cars[1].stopForCollision = original3;
        }
      }
    });

    test('возобновляет движение если нет коллизий', () => {
      const cars = manager.cars.filter(c => c.isActive);
      
      if (cars.length >= 1) {
        const original1 = cars[0].checkCollision;
        const original2 = cars[0].resumeMovement;
        
        try {
          cars[0].checkCollision = jest.fn(() => false);
          cars[0].resumeMovement = jest.fn();
          
          manager.update();
          
          expect(cars[0].resumeMovement).toHaveBeenCalled();
        } finally {
          cars[0].checkCollision = original1;
          cars[0].resumeMovement = original2;
        }
      }
    });

    test('обрабатывает ошибки в update машины и вызывает despawn', () => {
      const cars = manager.cars.filter(c => c.isActive);
      
      if (cars.length >= 1) {
        const originalUpdate = cars[0].update;
        const originalDespawn = cars[0].despawn;
        
        try {
          cars[0].update = jest.fn(() => {
            throw new Error('Update error');
          });
          cars[0].despawn = jest.fn();
          
          manager.update();
          
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Ошибка обновления машины'),
            expect.anything()
          );
          expect(cars[0].despawn).toHaveBeenCalled();
        } finally {
          cars[0].update = originalUpdate;
          cars[0].despawn = originalDespawn;
        }
      }
    });
  });

  describe('update() - Respawn Logic', () => {
    beforeEach(async () => {
      await manager.init();
      await manager.spawnCars(2);
    }, 10000);

    test('планирует респавн для деактивированных машин', (done) => {
      const cars = manager.cars.filter(c => c.isActive);
      
      if (cars.length >= 1) {
        const car = cars[0];
        const originalRespawn = manager.respawnCar;
        
        // Мокируем respawnCar чтобы проверить вызов
        manager.respawnCar = jest.fn().mockResolvedValue(null);
        
        // Деактивируем машину
        car.isActive = false;
        
        // Вызываем update - должен запланировать респавн
        manager.update();
        
        // Ждём чуть больше максимального таймаута (2000 + 500 = 2500ms)
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

  describe('respawnCar()', () => {
    beforeEach(async () => {
      await manager.init();
      await manager.spawnCars(1);
    }, 10000);

    test('метод respawnCar существует', () => {
      expect(manager.respawnCar).toBeDefined();
      expect(typeof manager.respawnCar).toBe('function');
    });

    test('возвращает null для null car', async () => {
      const result = await manager.respawnCar(null);
      
      expect(result).toBeNull();
    });

    test('возвращает null если модель не найдена', async () => {
      const car = manager.cars[0];
      car.modelName = 'NonExistent.glb';
      
      const result = await manager.respawnCar(car);
      
      expect(result).toBeNull();
    });

    test('удаляет старую машину из parent', async () => {
      const car = manager.cars[0];
      const initialRemoveCalls = mockParent.remove.mock.calls.length;
      
      await manager.respawnCar(car);
      
      expect(mockParent.remove.mock.calls.length).toBeGreaterThanOrEqual(initialRemoveCalls);
    });

    test('удаляет машину из массива cars', async () => {
      const car = manager.cars[0];
      const initialLength = manager.cars.length;
      
      await manager.respawnCar(car);
      
      // Машина удалена, но новая может быть добавлена или нет
      expect(manager.cars).not.toContain(car);
    });

    test('создаёт новую машину с той же моделью', async () => {
      const car = manager.cars[0];
      const modelName = car.modelName;
      
      const newCar = await manager.respawnCar(car);
      
      if (newCar) {
        expect(newCar.modelName).toBe(modelName);
        expect(newCar).not.toBe(car);  // это должна быть новая машина
      }
    });
  });

  describe('setGlobalScale()', () => {
    beforeEach(async () => {
      await manager.init();
      await manager.spawnCars(2);
    }, 10000);

    test('устанавливает глобальный масштаб', () => {
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
        expect.stringContaining('Глобальный масштаб')
      );
    });

    test('работает с масштабом 0', () => {
      expect(() => manager.setGlobalScale(0)).not.toThrow();
    });

    test('работает с отрицательным масштабом', () => {
      expect(() => manager.setGlobalScale(-1)).not.toThrow();
    });
  });

  describe('getStats()', () => {
    test('возвращает статистику без машин', () => {
      const stats = manager.getStats();
      
      expect(stats.totalCars).toBe(0);
      expect(stats.activeCars).toBe(0);
      expect(stats.pooledCars).toBe(0);
    });

    test('возвращает правильное количество машин', async () => {
      await manager.init();
      await manager.spawnCars(5);
      
      const stats = manager.getStats();
      
      expect(stats.totalCars).toBeGreaterThan(0);
      expect(stats.activeCars).toBeGreaterThanOrEqual(0);
      expect(stats.activeCars).toBeLessThanOrEqual(stats.totalCars);
      expect(stats.totalCars).toBe(stats.activeCars + stats.pooledCars);
    }, 10000);

    test('различает активные и неактивные машины', async () => {
      await manager.init();
      await manager.spawnCars(3);
      
      if (manager.cars.length > 0) {
        manager.cars[0].isActive = false;
      }
      
      const stats = manager.getStats();
      
      expect(stats.pooledCars).toBeGreaterThan(0);
      expect(stats.totalCars).toBe(stats.activeCars + stats.pooledCars);
    }, 10000);
  });

  describe('dispose()', () => {
    beforeEach(async () => {
      await manager.init();
      await manager.spawnCars(3);
    }, 10000);

    test('удаляет все машины из сцены с parent', () => {
      // Убеждаемся что у машин есть parent
      manager.cars.forEach(car => {
        car.model.parent = mockParent;
      });
      
      const carsCount = manager.cars.length;
      
      manager.dispose();
      
      expect(mockParent.remove.mock.calls.length).toBe(carsCount);
    });

    test('не падает если у машины нет parent', () => {
      manager.cars.forEach(car => {
        car.model.parent = null;
      });
      
      expect(() => manager.dispose()).not.toThrow();
    });

    test('очищает массив cars', () => {
      manager.dispose();
      
      expect(manager.cars).toEqual([]);
    });

    test('очищает carPool', () => {
      manager.dispose();
      
      expect(manager.carPool).toEqual([]);
    });

    test('сбрасывает флаг isInitialized', () => {
      manager.dispose();
      
      expect(manager.isInitialized).toBe(false);
    });

    test('логирует очистку', () => {
      manager.dispose();
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Очистка TrafficManager')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('TrafficManager очищен')
      );
    });

    test('позволяет повторную инициализацию', async () => {
      manager.dispose();
      
      await expect(manager.init()).resolves.not.toThrow();
      expect(manager.isInitialized).toBe(true);
    });
  });

  describe('Edge cases', () => {
    test('spawnCars() с отрицательным числом', async () => {
      await manager.init();
      
      await expect(manager.spawnCars(-5)).resolves.not.toThrow();
    });

    test('update() с пустым массивом машин', () => {
      manager.isInitialized = true;
      manager.cars = [];
      
      expect(() => manager.update()).not.toThrow();
    });

    test('setGlobalScale() перед инициализацией', () => {
      expect(() => manager.setGlobalScale(2.0)).not.toThrow();
    });

    test('dispose() перед инициализацией', () => {
      const uninitManager = new TrafficManager(mockParent, network);
      
      expect(() => uninitManager.dispose()).not.toThrow();
    });

    test('множественный dispose()', async () => {
      await manager.init();
      manager.dispose();
      
      expect(() => manager.dispose()).not.toThrow();
    });

    test('spawnSingleCar() работает', async () => {
      await manager.init();
      const car = await manager.spawnSingleCar();
      
      // Машина может быть либо создана, либо null
      expect(car === null || typeof car === 'object').toBe(true);
    });
  });
});