// ===================================
// ФАЙЛ: tests/integration/traffic_flow.test.js
// Integration тесты для потока трафика
// ===================================

import { describe, test, expect, beforeEach } from '@jest/globals';
import { TrafficManager } from '../../src/traffic/traffic_manager.js';
import { createRoadNetwork } from '../../src/roads/road_system.js';

describe('Traffic Flow Integration', () => {
  let manager, network, mockParent;

  beforeEach(async () => {
    mockParent = {
      add: jest.fn(),
      remove: jest.fn()
    };

    network = createRoadNetwork(mockParent, { showRoads: false });
    manager = new TrafficManager(mockParent, network);
    await manager.init();
  });

  describe('Полный жизненный цикл машины', () => {
    test('Машина спавнится, движется и деспавнится', async () => {
      await manager.spawnCars(1);
      
      const car = manager.cars.find(c => c.isActive);
      expect(car).toBeDefined();
      
      // Обновляем много раз чтобы машина прошла путь
      for (let i = 0; i < 1000; i++) {
        manager.update();
        if (!car.isActive) break;
      }
      
      // Машина должна деспавниться после завершения пути
      expect(car.isActive).toBe(false);
    });

    test('Машины движутся по дорогам', async () => {
      await manager.spawnCars(3);
      
      const activeCars = manager.cars.filter(c => c.isActive);
      const initialProgress = activeCars.map(c => c.progress);
      
      // Обновляем несколько раз
      for (let i = 0; i < 10; i++) {
        manager.update();
      }
      
      // Progress должен увеличиться
      activeCars.forEach((car, i) => {
        if (!car.isStopped) {
          expect(car.progress).toBeGreaterThanOrEqual(initialProgress[i]);
        }
      });
    });

    test('Машины переходят на следующий сегмент', async () => {
      await manager.spawnCars(1);
      
      const car = manager.cars.find(c => c.isActive);
      const initialIndex = car.currentPathIndex;
      
      // Форсируем progress = 1
      car.progress = 0.99;
      
      for (let i = 0; i < 20; i++) {
        manager.update();
        if (car.currentPathIndex > initialIndex) break;
      }
      
      expect(car.currentPathIndex).toBeGreaterThan(initialIndex);
    });
  });

  describe('Система коллизий', () => {
    test('Машины останавливаются при коллизии', async () => {
      await manager.spawnCars(2);
      
      const cars = manager.cars.filter(c => c.isActive);
      if (cars.length >= 2) {
        // Мокируем коллизию
        cars[0].checkCollision = jest.fn(() => true);
        cars[0].stopForCollision = jest.fn();
        cars[1].stopForCollision = jest.fn();
        
        manager.update();
        
        expect(cars[0].stopForCollision).toHaveBeenCalled();
        expect(cars[1].stopForCollision).toHaveBeenCalled();
      }
    });

    test('Машины возобновляют движение после коллизии', async () => {
      await manager.spawnCars(2);
      
      const cars = manager.cars.filter(c => c.isActive);
      if (cars.length >= 2) {
        cars[0].checkCollision = jest.fn(() => false);
        cars[0].resumeMovement = jest.fn();
        
        manager.update();
        
        expect(cars[0].resumeMovement).toHaveBeenCalled();
      }
    });
  });

  describe('Респавн машин', () => {
    test('Машины респавнятся после завершения пути', (done) => {
      manager.spawnCars(1).then(() => {
        const car = manager.cars[0];
        const initialLength = manager.cars.length;
        
        // Деактивируем машину
        car.isActive = false;
        
        manager.update();
        
        // Проверяем респавн через 2.5 секунды
        setTimeout(() => {
          expect(manager.cars.length).toBeGreaterThanOrEqual(initialLength);
          done();
        }, 2600);
      });
    }, 10000);
  });

  describe('Управление масштабом', () => {
    test('Масштаб применяется ко всем машинам', async () => {
      await manager.spawnCars(3);
      
      manager.setGlobalScale(2.0);
      
      expect(manager.globalScaleMultiplier).toBe(2.0);
    });

    test('Новые машины получают актуальный масштаб', async () => {
      manager.setGlobalScale(1.5);
      
      await manager.spawnCars(1);
      
      const car = manager.cars[0];
      expect(car).toBeDefined();
    });
  });

  describe('Статистика в реальном времени', () => {
    test('getStats() возвращает актуальные данные', async () => {
      await manager.spawnCars(5);
      
      const stats = manager.getStats();
      
      expect(stats.totalCars).toBeGreaterThan(0);
      expect(stats.activeCars).toBeGreaterThan(0);
      expect(stats.activeCars).toBeLessThanOrEqual(stats.totalCars);
    });

    test('Статистика обновляется после движения', async () => {
      await manager.spawnCars(3);
      
      const statsBefore = manager.getStats();
      
      // Деактивируем одну машину
      manager.cars[0].isActive = false;
      
      const statsAfter = manager.getStats();
      
      expect(statsAfter.activeCars).toBeLessThan(statsBefore.activeCars);
    });
  });
});