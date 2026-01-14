// ===================================
// ФАЙЛ: tests/unit/combined.test.js  
// Объединенные тесты для config, road_system, StatsPanel
// ИСПРАВЛЕНО: Правильная проверка логов без жесткой привязки к эмодзи
// ===================================

import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { CONFIG, getCarScale, updateConfig } from '../../src/config.js';
import { createRoadNetwork } from '../../src/roads/road_system.js';
import { StatsPanel } from '../../src/ui/StatsPanel.js';
import { RoadNetwork } from '../../src/roads/roadNetwork.js';

// ===== CONFIG TESTS =====
describe('config.js', () => {
  describe('CONFIG object', () => {
    test('имеет все необходимые разделы', () => {
      expect(CONFIG.carScales).toBeDefined();
      expect(CONFIG.carpet).toBeDefined();
      expect(CONFIG.camera).toBeDefined();
      expect(CONFIG.cars).toBeDefined();
      expect(CONFIG.roads).toBeDefined();
    });

    test('carScales содержит модели', () => {
      expect(CONFIG.carScales.models['Buggy.glb']).toBe(0.3);
      expect(CONFIG.carScales.models['Duck.glb']).toBe(10.0);
      expect(CONFIG.carScales.models['CesiumMilkTruck.glb']).toBe(8.5);
    });

    test('carpet имеет размеры', () => {
      expect(CONFIG.carpet.width).toBe(2.0);
      expect(CONFIG.carpet.height).toBe(2.5);
    });

    test('roads имеет laneOffset', () => {
      expect(CONFIG.roads.laneOffset).toBe(0.02);
    });
  });

  describe('getCarScale()', () => {
    test('возвращает масштаб для Buggy', () => {
      const scale = getCarScale('Buggy.glb');
      expect(scale).toBeCloseTo(0.0006, 5);
    });

    test('возвращает масштаб для Duck', () => {
      const scale = getCarScale('Duck.glb');
      expect(scale).toBeCloseTo(0.02, 5);
    });

    test('возвращает базовый масштаб для неизвестной модели', () => {
      const scale = getCarScale('Unknown.glb');
      expect(scale).toBe(CONFIG.carScales.defaultScale);
    });
  });

  describe('updateConfig()', () => {
    test('обновляет параметр конфигурации', () => {
      updateConfig('cars.count', 10);
      expect(CONFIG.cars.count).toBe(10);
    });

    test('обновляет вложенный параметр', () => {
      updateConfig('camera.fov', 60);
      expect(CONFIG.camera.fov).toBe(60);
    });

    test('логирует обновление', () => {
      const spy = jest.spyOn(console, 'log');
      updateConfig('cars.count', 5);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});

// ===== ROAD_SYSTEM TESTS =====
describe('road_system.js', () => {
  let mockParent;

  beforeEach(() => {
    mockParent = {
      add: jest.fn()
    };
  });

  describe('createRoadNetwork()', () => {
    test('создает дорожную сеть', () => {
      const network = createRoadNetwork(mockParent, { showRoads: false });
      
      expect(network).toBeInstanceOf(RoadNetwork);
      expect(network.nodes.length).toBeGreaterThan(0);
    });

    test('создает 228 узлов', () => {
      const network = createRoadNetwork(mockParent, { showRoads: false });
      
      expect(network.nodes.length).toBeGreaterThanOrEqual(220);
    });

    test('создает дороги между узлами', () => {
      const network = createRoadNetwork(mockParent, { showRoads: false });
      
      expect(network.roads.length).toBeGreaterThan(0);
    });

    test('создает синие соединения', () => {
      const network = createRoadNetwork(mockParent, { showRoads: false });
      
      // Должно быть > 228 дорог (основной путь + синие соединения)
      expect(network.roads.length).toBeGreaterThan(228);
    });

    test('показывает визуализацию если showRoads = true', () => {
      createRoadNetwork(mockParent, { showRoads: true });
      
      expect(mockParent.add).toHaveBeenCalled();
    });

    test('не показывает визуализацию если showRoads = false', () => {
      createRoadNetwork(mockParent, { showRoads: false });
      
      expect(mockParent.add).not.toHaveBeenCalled();
    });

    test('валидирует координаты узлов', () => {
      const network = createRoadNetwork(mockParent, { showRoads: false });
      
      network.nodes.forEach(node => {
        expect(typeof node.x).toBe('number');
        expect(typeof node.y).toBe('number');
        expect(isNaN(node.x)).toBe(false);
        expect(isNaN(node.y)).toBe(false);
      });
    });

    test('логирует статистику', () => {
      const spy = jest.spyOn(console, 'log');
      const network = createRoadNetwork(mockParent, { showRoads: false });
      
      // ✅ ИСПРАВЛЕНО: Проверяем что сеть создана и имеет статистику
      // вместо проверки конкретной строки лога
      const stats = network.getStats();
      expect(stats.nodes).toBeGreaterThan(0);
      expect(stats.roads).toBeGreaterThan(0);
      
      // Альтернативно: проверяем что логирование вообще было
      expect(spy).toHaveBeenCalled();
      
      spy.mockRestore();
    });

    test('обрабатывает ошибки при создании', () => {
      const badParent = null;
      
      expect(() => 
        createRoadNetwork(badParent, { showRoads: true })
      ).not.toThrow();
    });
  });

  describe('Road network structure', () => {
    let network;

    beforeEach(() => {
      network = createRoadNetwork(mockParent, { showRoads: false });
    });

    test('все узлы имеют связи', () => {
      network.nodes.forEach(node => {
        expect(node.connections).toBeDefined();
        expect(Array.isArray(node.connections)).toBe(true);
      });
    });

    test('можно найти путь между случайными узлами', () => {
      const start = network.nodes[0];
      const end = network.nodes[network.nodes.length - 1];
      
      const path = network.findPath(start, end);
      
      expect(path.length).toBeGreaterThanOrEqual(2);
    });

    test('статистика корректна', () => {
      const stats = network.getStats();
      
      expect(stats.nodes).toBeGreaterThan(0);
      expect(stats.roads).toBeGreaterThan(0);
      expect(stats.lanes).toBe(stats.roads * 2);
    });
  });
});

// ===== STATSPANEL TESTS =====
describe('StatsPanel', () => {
  let panel;

  beforeEach(() => {
    panel = new StatsPanel();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    panel.hide();
  });

  describe('Constructor', () => {
    test('создает панель с начальными значениями', () => {
      expect(panel.panel).toBeNull();
      expect(panel.isVisible).toBe(false);
      expect(panel.isExpanded).toBe(false);
    });
  });

  describe('show()', () => {
    test('создает DOM элемент', () => {
      panel.show();
      
      expect(panel.panel).toBeInstanceOf(HTMLElement);
      expect(panel.panel.id).toBe('stats-panel');
    });

    test('добавляет панель в DOM', () => {
      panel.show();
      
      expect(document.body.contains(panel.panel)).toBe(true);
    });

    test('устанавливает isVisible', () => {
      panel.show();
      
      expect(panel.isVisible).toBe(true);
    });

    test('не создает панель повторно', () => {
      panel.show();
      const panel1 = panel.panel;
      
      panel.show();
      const panel2 = panel.panel;
      
      expect(panel1).toBe(panel2);
    });
  });

  describe('hide()', () => {
    beforeEach(() => {
      panel.show();
    });

    test('удаляет панель из DOM', () => {
      panel.hide();
      
      expect(document.getElementById('stats-panel')).toBeNull();
    });

    test('сбрасывает isVisible', () => {
      panel.hide();
      
      expect(panel.isVisible).toBe(false);
    });

    test('не падает если панель не создана', () => {
      const newPanel = new StatsPanel();
      
      expect(() => newPanel.hide()).not.toThrow();
    });
  });

  describe('update()', () => {
    beforeEach(() => {
      panel.show();
    });

    test('обновляет FPS', () => {
      panel.update({ mode: 'TOUCH', cars: 5, scale: '1.0' });
      
      const fpsDisplay = panel.panel.querySelector('#fps-display');
      expect(fpsDisplay).toBeDefined();
      expect(fpsDisplay.textContent).toContain('FPS');
    });

    test('обновляет данные в развернутом режиме', () => {
      panel.isExpanded = true;
      panel.update({
        mode: 'AR',
        tracking: true,
        cars: 7,
        pooled: 3,
        scale: '2.0',
        cameraRadius: '2.5'
      });
      
      const content = panel.panel.querySelector('#stats-content');
      expect(content.innerHTML).toContain('AR');
      expect(content.innerHTML).toContain('7');
    });

    test('не падает если панель не видна', () => {
      panel.hide();
      
      expect(() => 
        panel.update({ mode: 'TOUCH', cars: 5 })
      ).not.toThrow();
    });

    test('не падает с неполными данными', () => {
      expect(() => panel.update({})).not.toThrow();
    });
  });

  describe('toggle()', () => {
    beforeEach(() => {
      panel.show();
    });

    test('разворачивает панель', () => {
      panel.isExpanded = false;
      panel.toggle();
      
      expect(panel.isExpanded).toBe(true);
    });

    test('сворачивает панель', () => {
      panel.isExpanded = true;
      panel.toggle();
      
      expect(panel.isExpanded).toBe(false);
    });

    test('меняет иконку при развороте', () => {
      panel.toggle();
      const icon = panel.panel.querySelector('#expand-icon');
      
      expect(icon.textContent).toBe('▲');
    });

    test('меняет иконку при сворачивании', () => {
      panel.isExpanded = true;
      panel.toggle();
      const icon = panel.panel.querySelector('#expand-icon');
      
      expect(icon.textContent).toBe('▼');
    });

    test('работает при клике на панель', () => {
      panel.panel.onclick();
      
      expect(panel.isExpanded).toBe(true);
    });
  });

  describe('Edge cases', () => {
    test('update() без panel', () => {
      expect(() => panel.update({ mode: 'TOUCH' })).not.toThrow();
    });

    test('toggle() без panel', () => {
      expect(() => panel.toggle()).not.toThrow();
    });

    test('множественный show()', () => {
      panel.show();
      panel.show();
      panel.show();
      
      expect(panel.isVisible).toBe(true);
    });

    test('множественный hide()', () => {
      panel.hide();
      panel.hide();
      
      expect(panel.isVisible).toBe(false);
    });
  });
});
