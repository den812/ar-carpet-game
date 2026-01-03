// ===================================
// ФАЙЛ: tests/unit/cars/CarModels.test.js
// Unit тесты для CarModels
// ===================================

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { CarModels } from '../../../src/cars/CarModels.js';

describe('CarModels', () => {
  let carModels;

  beforeEach(() => {
    carModels = new CarModels();
  });

  describe('Constructor', () => {
    test('создает экземпляр с правильными свойствами', () => {
      expect(carModels.models).toEqual([]);
      expect(carModels.isLoaded).toBe(false);
      expect(carModels.loader).toBeDefined();
      expect(carModels.modelList).toHaveLength(3);
    });

    test('содержит все модели в списке', () => {
      const names = carModels.modelList.map(m => m.name);
      expect(names).toContain('Buggy.glb');
      expect(names).toContain('CesiumMilkTruck.glb');
      expect(names).toContain('Duck.glb');
    });
  });

  describe('loadAll()', () => {
    test('загружает все модели', async () => {
      await carModels.loadAll();
      
      expect(carModels.isLoaded).toBe(true);
      expect(carModels.models.length).toBeGreaterThan(0);
    });

    test('не загружает повторно если уже загружено', async () => {
      await carModels.loadAll();
      const models1 = carModels.models;
      
      await carModels.loadAll();
      const models2 = carModels.models;
      
      expect(models1).toBe(models2);
    });

    test('загружает модели параллельно', async () => {
      const startTime = Date.now();
      await carModels.loadAll();
      const endTime = Date.now();
      
      // Параллельная загрузка должна быть быстрее последовательной
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('фильтрует null результаты', async () => {
      // Мокируем loadModel чтобы вернуть null для одной модели
      const originalLoadModel = carModels.loadModel.bind(carModels);
      carModels.loadModel = jest.fn((path, name) => {
        if (name === 'Duck.glb') return Promise.resolve(null);
        return originalLoadModel(path, name);
      });

      await carModels.loadAll();
      
      const names = carModels.models.map(m => m.name);
      expect(names).not.toContain('Duck.glb');
    });
  });

  describe('loadModel()', () => {
    test('загружает модель успешно', async () => {
      const result = await carModels.loadModel('./assets/models/Buggy.glb', 'Buggy.glb');
      
      expect(result).not.toBeNull();
      expect(result.name).toBe('Buggy.glb');
      expect(result.model).toBeDefined();
    });

    test('возвращает модель с методом clone', async () => {
      const result = await carModels.loadModel('./assets/models/Buggy.glb', 'Buggy.glb');
      
      expect(result.model.clone).toBeDefined();
      expect(typeof result.model.clone).toBe('function');
    });

    test('возвращает null при ошибке загрузки', async () => {
      // Мокируем loader.load чтобы вызвать onError
      carModels.loader.load = jest.fn((path, onLoad, onProgress, onError) => {
        setTimeout(() => onError(new Error('Load failed')), 10);
      });

      const result = await carModels.loadModel('./invalid/path.glb', 'Invalid.glb');
      
      expect(result).toBeNull();
    });
  });

  describe('getRandomModel()', () => {
    beforeEach(async () => {
      await carModels.loadAll();
    });

    test('возвращает случайную модель', () => {
      const model = carModels.getRandomModel();
      
      expect(model).not.toBeNull();
      expect(model.name).toBeDefined();
      expect(model.model).toBeDefined();
    });

    test('возвращает клон модели', () => {
      const model1 = carModels.getRandomModel();
      const model2 = carModels.getRandomModel();
      
      // Даже если это одна и та же модель, должны быть разные экземпляры
      expect(model1.model).not.toBe(model2.model);
    });

    test('возвращает null если модели не загружены', () => {
      const emptyCarModels = new CarModels();
      const model = emptyCarModels.getRandomModel();
      
      expect(model).toBeNull();
    });

    test('возвращает модели из списка загруженных', () => {
      const model = carModels.getRandomModel();
      const names = carModels.models.map(m => m.name);
      
      expect(names).toContain(model.name);
    });

    test('распределяет модели случайно', () => {
      const selections = new Set();
      
      // Делаем 10 выборок
      for (let i = 0; i < 10; i++) {
        const model = carModels.getRandomModel();
        selections.add(model.name);
      }
      
      // При 3 моделях и 10 выборках должно быть > 1 уникальной
      expect(selections.size).toBeGreaterThan(1);
    });
  });

  describe('getModelByName()', () => {
    beforeEach(async () => {
      await carModels.loadAll();
    });

    test('возвращает модель по имени', () => {
      const model = carModels.getModelByName('Buggy.glb');
      
      expect(model).not.toBeNull();
      expect(model.name).toBe('Buggy.glb');
      expect(model.model).toBeDefined();
    });

    test('возвращает клон модели', () => {
      const model1 = carModels.getModelByName('Buggy.glb');
      const model2 = carModels.getModelByName('Buggy.glb');
      
      expect(model1.model).not.toBe(model2.model);
    });

    test('возвращает null для несуществующей модели', () => {
      const model = carModels.getModelByName('NonExistent.glb');
      
      expect(model).toBeNull();
    });

    test('находит каждую загруженную модель', () => {
      const buggy = carModels.getModelByName('Buggy.glb');
      const truck = carModels.getModelByName('CesiumMilkTruck.glb');
      const duck = carModels.getModelByName('Duck.glb');
      
      expect(buggy).not.toBeNull();
      expect(truck).not.toBeNull();
      expect(duck).not.toBeNull();
    });

    test('логирует поиск модели', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      carModels.getModelByName('Buggy.glb');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Поиск модели')
      );
    });

    test('логирует ошибку для несуществующей модели', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      
      carModels.getModelByName('NonExistent.glb');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('dispose()', () => {
    beforeEach(async () => {
      await carModels.loadAll();
    });

    test('очищает массив моделей', () => {
      carModels.dispose();
      
      expect(carModels.models).toEqual([]);
    });

    test('сбрасывает флаг isLoaded', () => {
      carModels.dispose();
      
      expect(carModels.isLoaded).toBe(false);
    });

    test('позволяет загрузить модели повторно', async () => {
      carModels.dispose();
      await carModels.loadAll();
      
      expect(carModels.isLoaded).toBe(true);
      expect(carModels.models.length).toBeGreaterThan(0);
    });

    test('логирует очистку', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      carModels.dispose();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Очистка')
      );
    });
  });

  describe('Edge cases', () => {
    test('обрабатывает пустой список моделей', () => {
      carModels.modelList = [];
      
      expect(async () => {
        await carModels.loadAll();
      }).not.toThrow();
    });

    test('getRandomModel() с одной моделью', async () => {
      carModels.modelList = [{ name: 'Single.glb', path: './single.glb' }];
      await carModels.loadAll();
      
      const model = carModels.getRandomModel();
      
      expect(model.name).toBe('Single.glb');
    });

    test('getModelByName() с пустым именем', async () => {
      await carModels.loadAll();
      const model = carModels.getModelByName('');
      
      expect(model).toBeNull();
    });

    test('getModelByName() с null', async () => {
      await carModels.loadAll();
      const model = carModels.getModelByName(null);
      
      expect(model).toBeNull();
    });
  });
});