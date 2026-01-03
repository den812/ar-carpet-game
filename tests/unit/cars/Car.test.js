// ===================================
// ФАЙЛ: tests/unit/cars/Car.test.js
// Unit тесты для Car
// ===================================

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { Car } from '../../../src/cars/Car.js';
import { RoadNetwork } from '../../../src/roads/roadNetwork.js';

describe('Car', () => {
  let car, mockModel, network, nodeA, nodeB, nodeC;

  beforeEach(() => {
    // Создаем mock модель
    mockModel = {
      position: { set: jest.fn(), x: 0, y: 0, z: 0 },
      rotation: { y: 0 },
      scale: { setScalar: jest.fn() },
      visible: true,
      traverse: jest.fn()
    };

    // Создаем простую сеть
    network = new RoadNetwork();
    nodeA = network.addNode(0.0, 0.0);
    nodeB = network.addNode(1.0, 0.0);
    nodeC = network.addNode(2.0, 0.0);
    network.addRoad(nodeA, nodeB);
    network.addRoad(nodeB, nodeC);

    car = new Car(mockModel, network, 'TestCar.glb');
  });

  describe('Constructor', () => {
    test('создает машину с правильными свойствами', () => {
      expect(car.model).toBe(mockModel);
      expect(car.roadNetwork).toBe(network);
      expect(car.modelName).toBe('TestCar.glb');
      expect(car.isActive).toBe(false);
      expect(car.isStopped).toBe(false);
      expect(car.path).toEqual([]);
      expect(car.currentPathIndex).toBe(0);
      expect(car.progress).toBe(0);
    });

    test('устанавливает базовую скорость с вариацией', () => {
      expect(car.baseSpeed).toBeGreaterThan(0);
      expect(car.baseSpeed).toBeLessThan(0.001);
    });

    test('применяет масштаб модели', () => {
      expect(mockModel.scale.setScalar).toHaveBeenCalled();
    });

    test('применяет случайный цвет', () => {
      expect(mockModel.traverse).toHaveBeenCalled();
    });
  });

  describe('spawn()', () => {
    test('успешно спавнит машину с валидными узлами', () => {
      const success = car.spawn(nodeA, nodeC);
      
      expect(success).toBe(true);
      expect(car.isActive).toBe(true);
      expect(car.path.length).toBeGreaterThanOrEqual(2);
      expect(car.path[0]).toBe(nodeA);
      expect(mockModel.visible).toBe(true);
    });

    test('отклоняет спавн с невалидными узлами', () => {
      const success = car.spawn(null, nodeB);
      
      expect(success).toBe(false);
      expect(car.isActive).toBe(false);
    });

    test('отклоняет спавн с одинаковыми узлами', () => {
      const success = car.spawn(nodeA, nodeA);
      
      expect(success).toBe(false);
      expect(car.isActive).toBe(false);
    });

    test('устанавливает начальную позицию', () => {
      car.spawn(nodeA, nodeC);
      
      expect(mockModel.position.set).toHaveBeenCalled();
    });

    test('устанавливает начальную ориентацию', () => {
      car.spawn(nodeA, nodeC);
      
      expect(car.currentRotation).toBeDefined();
      expect(car.targetRotation).toBeDefined();
    });

    test('получает полосу движения', () => {
      car.spawn(nodeA, nodeB);
      
      expect(car.currentLane).not.toBeNull();
      expect(car.currentLane.start).toBe(nodeA);
      expect(car.currentLane.end).toBe(nodeB);
    });
  });

  describe('update()', () => {
    beforeEach(() => {
      car.spawn(nodeA, nodeC);
    });

    test('обновляет позицию машины', () => {
      const initialProgress = car.progress;
      car.update();
      
      expect(car.progress).toBeGreaterThan(initialProgress);
    });

    test('не обновляет если машина неактивна', () => {
      car.isActive = false;
      const initialProgress = car.progress;
      car.update();
      
      expect(car.progress).toBe(initialProgress);
    });

    test('не обновляет если машина остановлена', () => {
      car.isStopped = true;
      const initialProgress = car.progress;
      car.update();
      
      expect(car.progress).toBe(initialProgress);
    });

    test('переходит на следующий сегмент при progress >= 1', () => {
      car.progress = 0.99;
      const initialIndex = car.currentPathIndex;
      
      // Обновляем несколько раз чтобы progress достиг 1
      for (let i = 0; i < 10; i++) {
        car.update();
      }
      
      expect(car.currentPathIndex).toBeGreaterThan(initialIndex);
    });

    test('деспавнится при завершении пути', () => {
      car.currentPathIndex = car.path.length - 2;
      car.progress = 0.99;
      
      // Обновляем до конца пути
      for (let i = 0; i < 20; i++) {
        if (!car.isActive) break;
        car.update();
      }
      
      expect(car.isActive).toBe(false);
    });

    test('обрабатывает undefined узлы', () => {
      car.path = [nodeA, undefined, nodeB];
      car.currentPathIndex = 0;
      
      expect(() => car.update()).not.toThrow();
    });

    test('плавно интерполирует поворот', () => {
      const initialRotation = car.currentRotation;
      car.targetRotation = initialRotation + Math.PI / 4;
      
      car.update();
      
      // Поворот должен приближаться к целевому
      const rotDiff1 = Math.abs(car.targetRotation - car.currentRotation);
      
      car.update();
      
      const rotDiff2 = Math.abs(car.targetRotation - car.currentRotation);
      
      expect(rotDiff2).toBeLessThan(rotDiff1);
    });
  });

  describe('despawn()', () => {
    beforeEach(() => {
      car.spawn(nodeA, nodeC);
    });

    test('деактивирует машину', () => {
      car.despawn();
      
      expect(car.isActive).toBe(false);
      expect(car.isStopped).toBe(false);
    });

    test('скрывает модель', () => {
      car.despawn();
      
      expect(mockModel.visible).toBe(false);
    });

    test('очищает путь', () => {
      car.despawn();
      
      expect(car.path).toEqual([]);
      expect(car.currentPathIndex).toBe(0);
      expect(car.progress).toBe(0);
    });

    test('очищает полосу', () => {
      car.despawn();
      
      expect(car.currentLane).toBeNull();
    });
  });

  describe('checkCollision()', () => {
    let otherCar, otherModel;

    beforeEach(() => {
      otherModel = {
        position: { x: 0, y: 0, z: 0, distanceTo: jest.fn() },
        rotation: { y: 0 },
        scale: { setScalar: jest.fn() },
        visible: true,
        traverse: jest.fn()
      };
      otherCar = new Car(otherModel, network, 'OtherCar.glb');
      
      car.spawn(nodeA, nodeC);
      otherCar.spawn(nodeA, nodeC);
    });

    test('детектит коллизию при близком расстоянии', () => {
      mockModel.position.distanceTo = jest.fn(() => 0.1); // < 0.15
      
      const hasCollision = car.checkCollision(otherCar);
      
      expect(hasCollision).toBe(true);
    });

    test('не детектит коллизию при большом расстоянии', () => {
      mockModel.position.distanceTo = jest.fn(() => 0.2); // > 0.15
      
      const hasCollision = car.checkCollision(otherCar);
      
      expect(hasCollision).toBe(false);
    });

    test('возвращает false если одна машина неактивна', () => {
      car.isActive = false;
      mockModel.position.distanceTo = jest.fn(() => 0.1);
      
      const hasCollision = car.checkCollision(otherCar);
      
      expect(hasCollision).toBe(false);
    });
  });

  describe('stopForCollision() / resumeMovement()', () => {
    beforeEach(() => {
      car.spawn(nodeA, nodeC);
    });

    test('stopForCollision() останавливает машину', () => {
      car.stopForCollision();
      
      expect(car.isStopped).toBe(true);
    });

    test('resumeMovement() возобновляет движение', () => {
      car.stopForCollision();
      car.resumeMovement();
      
      expect(car.isStopped).toBe(false);
    });

    test('остановленная машина не обновляет progress', () => {
      car.stopForCollision();
      const initialProgress = car.progress;
      
      car.update();
      
      expect(car.progress).toBe(initialProgress);
    });
  });

  describe('setGlobalScale()', () => {
    test('применяет глобальный масштаб', () => {
      car.setGlobalScale(2.0);
      
      expect(mockModel.scale.setScalar).toHaveBeenCalledWith(
        expect.any(Number)
      );
    });

    test('масштаб учитывает базовый масштаб модели', () => {
      const calls1 = mockModel.scale.setScalar.mock.calls.length;
      
      car.setGlobalScale(1.5);
      
      expect(mockModel.scale.setScalar).toHaveBeenCalledTimes(calls1 + 1);
    });
  });

  describe('smoothstep()', () => {
    test('возвращает 0 для t=0', () => {
      expect(car.smoothstep(0)).toBe(0);
    });

    test('возвращает 1 для t=1', () => {
      expect(car.smoothstep(1)).toBe(1);
    });

    test('возвращает ~0.5 для t=0.5', () => {
      expect(car.smoothstep(0.5)).toBeCloseTo(0.5, 1);
    });

    test('плавная интерполяция', () => {
      const v1 = car.smoothstep(0.3);
      const v2 = car.smoothstep(0.5);
      const v3 = car.smoothstep(0.7);
      
      expect(v2).toBeGreaterThan(v1);
      expect(v3).toBeGreaterThan(v2);
    });
  });

  describe('applyRandomColor()', () => {
    test('вызывает traverse на модели', () => {
      expect(mockModel.traverse).toHaveBeenCalled();
    });

    test('применяет цвет к материалам', () => {
      const mockMesh = {
        isMesh: true,
        material: {
          color: { copy: jest.fn() }
        }
      };

      const traverseCallback = mockModel.traverse.mock.calls[0][0];
      traverseCallback(mockMesh);

      expect(mockMesh.material.color.copy).toHaveBeenCalled();
    });
  });

  describe('isAvailable()', () => {
    test('возвращает true если машина неактивна', () => {
      expect(car.isAvailable()).toBe(true);
    });

    test('возвращает false если машина активна', () => {
      car.spawn(nodeA, nodeC);
      
      expect(car.isAvailable()).toBe(false);
    });
  });
});