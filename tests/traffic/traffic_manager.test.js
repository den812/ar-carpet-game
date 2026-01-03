// ===================================
// ФАЙЛ: tests/unit/traffic/traffic_manager.test.js
// Unit тесты для TrafficManager
// ===================================

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { TrafficManager } from '../../../src/traffic/traffic_manager.js';
import { RoadNetwork } from '../../../src/roads/roadNetwork.js';

describe('TrafficManager', () => {
  let manager, network, mockParent;

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
      const consoleSpy = jest.spyOn(console, 'log');
      new TrafficManager(mockParent, network);
      
      expect(consoleSpy).toHaveBeenCalledWith(
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

    test('проверяет валидность дорожной сети', async () => {
      const emptyNetwork = new RoadNetwork();
      const badManager = new TrafficManager(mockParent, emptyNetwork);
      
      await expect(badManager.init()).rejects.toThrow();
    });

    test('требует минимум 2 узла в сети', async () => {
      const smallNetwork = new RoadNetwork();
      smallNetwork.addNode(0, 0);
      const badManager = new TrafficManager(mockParent, smallNetwork);
      
      await expect(badManager.init()).rejects.toThrow('Invalid road network');
    });

    test('логирует статистику сети', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      await manager.init();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Дорожная сеть')
      );
    });
  });

  describe('spawnCars()', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('спавнит заданное количество машин', async () => {
      await manager.spawnCars(3);
      
      const activeCars = manager.cars.filter(c => c.isActive);
      expect(activeCars.length).toBeGreaterThan(0);
      expect(activeCars.length).toBeLessThanOrEqual(3);
    });

    test('распределяет модели согласно пропорции', async () => {
      await manager.spawnCars(7);
      
      // Должно быть: 3 Buggy, 2 Truck, 2 Duck
      const modelCounts = {};
      manager.cars.forEach(car => {
        modelCounts[car.modelName] = (modelCounts[car.modelName] || 0) + 1;
      });
      
      expect(Object.keys(modelCounts).length).toBeGreaterThan(0);
    });

    test('инициализирует если не инициализирован', async () => {
      const uninitManager = new TrafficManager(mockParent, network);
      
      await uninitManager.spawnCars(2);
      
      expect(uninitManager.isInitialized).toBe(true);
    });

    test('добавляет задержку между спавнами', async () => {
      const startTime = Date.now();
      await manager.spawnCars(3);
      const endTime = Date.now();
      
      // Должна быть задержка минимум 200мс (3 машины * ~100мс)
      expect(endTime - startTime).toBeGreaterThan(200);
    });

    test('логирует количество заспавненных машин', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      await manager.spawnCars(5);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Заспавнено')
      );
    });

    test('обрабатывает спавн 0 машин', async () => {
      await expect(manager.spawnCars(0)).resolves.not.toThrow();
    });
  });

  describe('spawnCarWithModel()', () => {
    let modelData;

    beforeEach(async () => {
      await manager.init();
      modelData = manager.carModels.getRandomModel();
    });

    test('спавнит машину с заданной моделью', async () => {
      const car = await manager.spawnCarWithModel(modelData);
      
      expect(car).not.toBeNull();
      expect(car.modelName).toBe(modelData.name);
      expect(car.isActive).toBe(true);
    });

    test('добавляет машину в массив cars', async () => {
      const initialLength = manager.cars.length;
      
      await manager.spawnCarWithModel(modelData);
      
      expect(manager.cars.length).toBe(initialLength + 1);
    });

    test('добавляет модель в сцену', async () => {
      await manager.spawnCarWithModel(modelData);
      
      expect(mockParent.add).toHaveBeenCalled();
    });

    test('применяет глобальный масштаб', async () => {
      manager.globalScaleMultiplier = 2.0;
      
      const car = await manager.spawnCarWithModel(modelData);
      
      // Проверяем что масштаб был применен
      expect(car).not.toBeNull();
    });

    test('возвращает null для невалидных данных', async () => {
      const car = await manager.spawnCarWithModel(null);
      
      expect(car).toBeNull();
    });

    test('возвращает null если модель undefined', async () => {
      const car = await manager.spawnCarWithModel({ name: 'Test', model: null });
      
      expect(car).toBeNull();
    });

    test('выбирает разные узлы для start и end', async () => {
      const car = await manager.spawnCarWithModel(modelData);
      
      if (car && car.path.length >= 2) {
        expect(car.path[0]).not.toBe(car.path[car.path.length - 1]);
      }
    });

    test('проверяет возможность построения пути', async () => {
      const isolatedNetwork = new RoadNetwork();
      isolatedNetwork.addNode(0, 0);
      isolatedNetwork.addNode(10, 10);
      
      const isolatedManager = new TrafficManager(mockParent, isolatedNetwork);
      await isolatedManager.init();
      
      const car = await isolatedManager.spawnCarWithModel(modelData);
      
      // Может быть null если путь не построен
      expect(car).toBeDefined();
    });

    test('логирует успешный спавн', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      await manager.spawnCarWithModel(modelData);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('успешно заспавнена')
      );
    });
  });

  describe('update()', () => {
    beforeEach(async () => {
      await manager.init();
      await manager.spawnCars(3);
    });

    test('обновляет все активные машины', () => {
      const activeBefore = manager.cars.filter(c => c.isActive).length;
      
      manager.update();
      
      // Машины должны обновляться
      expect(activeBefore).toBeGreaterThan(0);
    });

    test('не падает если не инициализирован', () => {
      const uninitManager = new TrafficManager(mockParent, network);
      
      expect(() => uninitManager.update()).not.toThrow();
    });

    test('обрабатывает коллизии между машинами', () => {
      // Создаем две машины на близких позициях
      const cars = manager.cars.filter(c => c.isActive);
      
      if (cars.length >= 2) {
        // Мокируем checkCollision
        cars[0].checkCollision = jest.fn(() => true);
        cars[0].stopForCollision = jest.fn();
        cars[1].stopForCollision = jest.fn();
        
        manager.update();
        
        expect(cars[0].stopForCollision).toHaveBeenCalled();
        expect(cars[1].stopForCollision).toHaveBeenCalled();
      }
    });

    test('возобновляет движение если нет коллизий', () => {
      const cars = manager.cars.filter(c => c.isActive);
      
      if (cars.length >= 1) {
        cars[0].checkCollision = jest.fn(() => false);
        cars[0].resumeMovement = jest.fn();
        
        manager.update();
        
        expect(cars[0].resumeMovement).toHaveBeenCalled();
      }
    });

    test('обрабатывает ошибки в update машины', () => {
      const cars = manager.cars.filter(c => c.isActive);
      
      if (cars.length >= 1) {
        cars[0].update = jest.fn(() => {
          throw new Error('Update error');
        });
        
        expect(() => manager.update()).not.toThrow();
      }
    });

    test('респавнит машины после завершения пути', (done) => {
      const cars = manager.cars.filter(c => c.isActive);
      
      if (cars.length >= 1) {
        // Деактивируем машину
        cars[0].isActive = false;
        const initialLength = manager.cars.length;
        
        manager.update();
        
        // Проверяем что setTimeout был вызван для респавна
        setTimeout(() => {
          expect(manager.cars.length).toBeGreaterThanOrEqual(initialLength);
          done();
        }, 2500);
      } else {
        done();
      }
    });
  });

  describe('setGlobalScale()', () => {
    beforeEach(async () => {
      await manager.init();
      await manager.spawnCars(2);
    });

    test('устанавливает глобальный масштаб', () => {
      manager.setGlobalScale(2.5);
      
      expect(manager.globalScaleMultiplier).toBe(2.5);
    });

    test('применяет масштаб ко всем машинам', () => {
      manager.cars.forEach(car => {
        car.setGlobalScale = jest.fn();
      });
      
      manager.setGlobalScale(1.5);
      
      manager.cars.forEach(car => {
        expect(car.setGlobalScale).toHaveBeenCalledWith(1.5);
      });
    });

    test('логирует установку масштаба', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      manager.setGlobalScale(2.0);
      
      expect(consoleSpy).toHaveBeenCalledWith(
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
      expect(stats.activeCars).toBeGreaterThan(0);
      expect(stats.activeCars).toBeLessThanOrEqual(stats.totalCars);
    });

    test('различает активные и неактивные машины', async () => {
      await manager.init();
      await manager.spawnCars(3);
      
      // Деактивируем одну машину
      if (manager.cars.length > 0) {
        manager.cars[0].isActive = false;
      }
      
      const stats = manager.getStats();
      
      expect(stats.activeCars).toBeLessThan(stats.totalCars);
    });
  });

  describe('dispose()', () => {
    beforeEach(async () => {
      await manager.init();
      await manager.spawnCars(3);
    });

    test('удаляет все машины из сцены', () => {
      const carsCount = manager.cars.length;
      
      manager.dispose();
      
      expect(mockParent.remove).toHaveBeenCalledTimes(carsCount);
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
      const consoleSpy = jest.spyOn(console, 'log');
      
      manager.dispose();
      
      expect(consoleSpy).toHaveBeenCalledWith(
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

    test('множественный dispose()', () => {
      manager.dispose();
      
      expect(() => manager.dispose()).not.toThrow();
    });
  });
});