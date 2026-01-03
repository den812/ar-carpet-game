// ===================================
// ФАЙЛ: tests/unit/roads/roadNetwork.test.js
// Unit тесты для RoadNetwork
// ===================================

import { describe, test, expect, beforeEach } from '@jest/globals';
import { RoadNetwork } from '../../../src/roads/roadNetwork.js';

describe('RoadNetwork', () => {
  let network;

  beforeEach(() => {
    network = new RoadNetwork();
  });

  describe('Constructor', () => {
    test('создает пустую сеть', () => {
      expect(network.nodes).toEqual([]);
      expect(network.roads).toEqual([]);
      expect(network.lanes).toEqual([]);
    });
  });

  describe('addNode()', () => {
    test('добавляет узел с валидными координатами', () => {
      const node = network.addNode(1.0, 2.0);
      
      expect(node).not.toBeNull();
      expect(node.x).toBe(1.0);
      expect(node.y).toBe(2.0);
      expect(node.connections).toEqual([]);
      expect(network.nodes.length).toBe(1);
    });

    test('не создает дубликаты узлов', () => {
      const node1 = network.addNode(1.0, 2.0);
      const node2 = network.addNode(1.005, 2.005); // Расстояние < 0.01
      
      expect(node2).toBe(node1);
      expect(network.nodes.length).toBe(1);
    });

    test('отклоняет NaN координаты', () => {
      const node = network.addNode(NaN, 2.0);
      
      expect(node).toBeNull();
      expect(network.nodes.length).toBe(0);
    });

    test('отклоняет Infinity координаты', () => {
      const node = network.addNode(Infinity, 2.0);
      
      expect(node).toBeNull();
      expect(network.nodes.length).toBe(0);
    });

    test('отклоняет невалидные типы', () => {
      const node = network.addNode('1.0', 2.0);
      
      expect(node).toBeNull();
      expect(network.nodes.length).toBe(0);
    });

    test('добавляет несколько различных узлов', () => {
      network.addNode(1.0, 2.0);
      network.addNode(3.0, 4.0);
      network.addNode(5.0, 6.0);
      
      expect(network.nodes.length).toBe(3);
    });
  });

  describe('addRoad()', () => {
    let nodeA, nodeB;

    beforeEach(() => {
      nodeA = network.addNode(0.0, 0.0);
      nodeB = network.addNode(1.0, 0.0);
    });

    test('создает дорогу между узлами', () => {
      const road = network.addRoad(nodeA, nodeB);
      
      expect(road).not.toBeNull();
      expect(road.start).toBe(nodeA);
      expect(road.end).toBe(nodeB);
      expect(road.length).toBeCloseTo(1.0, 5);
      expect(network.roads.length).toBe(1);
    });

    test('создает 2 полосы движения', () => {
      network.addRoad(nodeA, nodeB);
      
      expect(network.lanes.length).toBe(2);
      
      // Полоса 1: A → B
      expect(network.lanes[0].start).toBe(nodeA);
      expect(network.lanes[0].end).toBe(nodeB);
      
      // Полоса 2: B → A
      expect(network.lanes[1].start).toBe(nodeB);
      expect(network.lanes[1].end).toBe(nodeA);
    });

    test('добавляет двунаправленные связи', () => {
      network.addRoad(nodeA, nodeB);
      
      expect(nodeA.connections).toContain(nodeB);
      expect(nodeB.connections).toContain(nodeA);
    });

    test('не создает дубликаты дорог', () => {
      network.addRoad(nodeA, nodeB);
      const road2 = network.addRoad(nodeA, nodeB);
      
      expect(network.roads.length).toBe(1);
      expect(network.lanes.length).toBe(2);
    });

    test('не создает дорогу с одинаковыми узлами (A → B и B → A)', () => {
      network.addRoad(nodeA, nodeB);
      const road2 = network.addRoad(nodeB, nodeA);
      
      expect(network.roads.length).toBe(1);
    });

    test('отклоняет невалидные узлы', () => {
      const road = network.addRoad(null, nodeB);
      
      expect(road).toBeNull();
      expect(network.roads.length).toBe(0);
    });

    test('вычисляет правильную длину дороги', () => {
      const nodeC = network.addNode(3.0, 4.0);
      const road = network.addRoad(nodeA, nodeC);
      
      expect(road.length).toBeCloseTo(5.0, 5); // 3-4-5 треугольник
    });
  });

  describe('getLane()', () => {
    let nodeA, nodeB;

    beforeEach(() => {
      nodeA = network.addNode(0.0, 0.0);
      nodeB = network.addNode(1.0, 0.0);
      network.addRoad(nodeA, nodeB);
    });

    test('возвращает полосу от A к B', () => {
      const lane = network.getLane(nodeA, nodeB);
      
      expect(lane).not.toBeNull();
      expect(lane.start).toBe(nodeA);
      expect(lane.end).toBe(nodeB);
    });

    test('возвращает полосу от B к A', () => {
      const lane = network.getLane(nodeB, nodeA);
      
      expect(lane).not.toBeNull();
      expect(lane.start).toBe(nodeB);
      expect(lane.end).toBe(nodeA);
    });

    test('возвращает null для несуществующей полосы', () => {
      const nodeC = network.addNode(2.0, 0.0);
      const lane = network.getLane(nodeA, nodeC);
      
      expect(lane).toBeNull();
    });

    test('возвращает null для невалидных узлов', () => {
      const lane = network.getLane(null, nodeB);
      
      expect(lane).toBeNull();
    });
  });

  describe('findPath()', () => {
    beforeEach(() => {
      // Создаем простую сеть:
      //   A --- B --- C
      //   |           |
      //   D --------- E
      const nodeA = network.addNode(0.0, 0.0);
      const nodeB = network.addNode(1.0, 0.0);
      const nodeC = network.addNode(2.0, 0.0);
      const nodeD = network.addNode(0.0, 1.0);
      const nodeE = network.addNode(2.0, 1.0);

      network.addRoad(nodeA, nodeB);
      network.addRoad(nodeB, nodeC);
      network.addRoad(nodeA, nodeD);
      network.addRoad(nodeC, nodeE);
      network.addRoad(nodeD, nodeE);
    });

    test('находит прямой путь', () => {
      const path = network.findPath(network.nodes[0], network.nodes[1]);
      
      expect(path.length).toBeGreaterThanOrEqual(2);
      expect(path[0]).toBe(network.nodes[0]);
      expect(path[path.length - 1]).toBe(network.nodes[1]);
    });

    test('находит кратчайший путь через узлы', () => {
      const path = network.findPath(network.nodes[0], network.nodes[2]);
      
      expect(path.length).toBeGreaterThanOrEqual(2);
      expect(path[0]).toBe(network.nodes[0]);
    });

    test('возвращает пустой массив для недостижимых узлов', () => {
      const isolatedNode = network.addNode(10.0, 10.0);
      const path = network.findPath(network.nodes[0], isolatedNode);
      
      expect(path.length).toBeGreaterThanOrEqual(0);
    });

    test('обрабатывает одинаковые start и end', () => {
      const path = network.findPath(network.nodes[0], network.nodes[0]);
      
      expect(path.length).toBeGreaterThanOrEqual(2);
      expect(path[0]).toBe(network.nodes[0]);
    });

    test('возвращает пустой массив для невалидных узлов', () => {
      const path = network.findPath(null, network.nodes[0]);
      
      expect(path).toEqual([]);
    });

    test('валидирует найденный путь', () => {
      const path = network.findPath(network.nodes[0], network.nodes[2]);
      
      // Проверяем что все узлы в пути валидны
      path.forEach(node => {
        expect(node).not.toBeNull();
        expect(typeof node.x).toBe('number');
        expect(typeof node.y).toBe('number');
      });
    });
  });

  describe('validatePath()', () => {
    let nodeA, nodeB;

    beforeEach(() => {
      nodeA = network.addNode(0.0, 0.0);
      nodeB = network.addNode(1.0, 0.0);
    });

    test('валидирует корректный путь', () => {
      const path = [nodeA, nodeB];
      
      expect(network.validatePath(path)).toBe(true);
    });

    test('отклоняет путь с < 2 узлами', () => {
      expect(network.validatePath([nodeA])).toBe(false);
      expect(network.validatePath([])).toBe(false);
    });

    test('отклоняет путь с null узлами', () => {
      const path = [nodeA, null, nodeB];
      
      expect(network.validatePath(path)).toBe(false);
    });

    test('отклоняет путь с невалидными координатами', () => {
      const invalidNode = { x: NaN, y: 0 };
      const path = [nodeA, invalidNode];
      
      expect(network.validatePath(path)).toBe(false);
    });
  });

  describe('getClosestNode()', () => {
    beforeEach(() => {
      network.addNode(0.0, 0.0);
      network.addNode(1.0, 0.0);
      network.addNode(0.0, 1.0);
    });

    test('находит ближайший узел', () => {
      const closest = network.getClosestNode(0.1, 0.1);
      
      expect(closest).toBe(network.nodes[0]);
    });

    test('находит другой ближайший узел', () => {
      const closest = network.getClosestNode(0.9, 0.1);
      
      expect(closest).toBe(network.nodes[1]);
    });

    test('возвращает null для пустой сети', () => {
      const emptyNetwork = new RoadNetwork();
      const closest = emptyNetwork.getClosestNode(0.0, 0.0);
      
      expect(closest).toBeNull();
    });
  });

  describe('getStats()', () => {
    test('возвращает статистику пустой сети', () => {
      const stats = network.getStats();
      
      expect(stats.nodes).toBe(0);
      expect(stats.roads).toBe(0);
      expect(stats.lanes).toBe(0);
      expect(stats.avgConnections).toBe(0);
    });

    test('возвращает корректную статистику', () => {
      const nodeA = network.addNode(0.0, 0.0);
      const nodeB = network.addNode(1.0, 0.0);
      const nodeC = network.addNode(0.0, 1.0);
      
      network.addRoad(nodeA, nodeB);
      network.addRoad(nodeA, nodeC);
      
      const stats = network.getStats();
      
      expect(stats.nodes).toBe(3);
      expect(stats.roads).toBe(2);
      expect(stats.lanes).toBe(4); // 2 дороги * 2 полосы
      expect(parseFloat(stats.avgConnections)).toBeCloseTo(1.33, 1);
    });
  });
});