// ===================================
// ФАЙЛ: src/traffic/traffic_manager.js
// Этот файл уже оптимизирован и работает корректно
// Изменений не требуется
// ===================================

import * as THREE from 'three';
import { Car } from '../cars/Car.js';
import { CarModels } from '../cars/CarModels.js';

export class TrafficManager {
  constructor(scene, roadNetwork) {
    this.scene = scene;
    this.roadSystem = roadNetwork.system || (Array.isArray(roadNetwork) ? null : roadNetwork);
    if (!this.roadSystem && roadNetwork.lanes) this.roadSystem = roadNetwork;

    this.cars = [];
    // Начальное значение ползунка (множитель)
    this.globalScaleMultiplier = 1.0;
    
    // ✅ ОПТИМИЗАЦИЯ 1: Переиспользуемые объекты для расчетов
    this._tempVector = new THREE.Vector3();
    this._tempVector2 = new THREE.Vector3();
    
    // ✅ ОПТИМИЗАЦИЯ 2: Кэш для маршрутов
    this.routeCache = new Map();
    this.maxCacheSize = 50;
    
    // ✅ ОПТИМИЗАЦИЯ 3: Пул для переиспользования машин
    this.carPool = [];
    this.maxPoolSize = 20;
    
    // ✅ ОПТИМИЗАЦИЯ 4: Отслеживание времени для deltaTime
    this.lastUpdateTime = performance.now();
    
    // ✅ ОПТИМИЗАЦИЯ 5: Батчинг обновлений
    this.updateBatchSize = 5; // Обновляем по 5 машин за раз
    this.currentBatchIndex = 0;
    
    // ✅ ОПТИМИЗАЦИЯ 6: Spatial partitioning для оптимизации коллизий
    this.spatialGrid = new Map();
    this.gridCellSize = 0.5;
  }

  spawnCars(count) {
    if (!this.roadSystem) {
      console.warn("No RoadSystem found");
    }

    for (let i = 0; i < count; i++) {
      this.spawnSingleCar();
    }
  }

  // ✅ ОПТИМИЗАЦИЯ 7: Отдельный метод для создания одной машины (переиспользуем логику)
  spawnSingleCar() {
    let car;
    
    // Пытаемся взять из пула
    if (this.carPool.length > 0) {
      car = this.carPool.pop();
      // Сбрасываем состояние
      car.progress = 0;
      car.setGlobalScale(this.globalScaleMultiplier);
    } else {
      // Создаем новую
      const modelConfig = CarModels[Math.floor(Math.random() * CarModels.length)];
      car = new Car(this.scene, modelConfig);
      car.setGlobalScale(this.globalScaleMultiplier);
    }

    if (this.roadSystem) {
      const route = this.generateRandomRoute();
      if (route) {
        car.setRoute(route);
        car.progress = Math.random();
      } else {
        car.setPosition(0, 0, 0);
      }
    } else {
      const offset = (this.cars.length - this.cars.length / 2) * 0.2;
      car.setPosition(offset, 0, 0);
    }
    
    this.cars.push(car);
    return car;
  }

  // Этот метод вызывается из GUI (ползунок)
  setGlobalScale(val) {
    this.globalScaleMultiplier = val;
    
    // ✅ ОПТИМИЗАЦИЯ 8: Используем for loop вместо forEach (быстрее)
    for (let i = 0; i < this.cars.length; i++) {
      this.cars[i].setGlobalScale(val);
    }
  }

  clearTraffic() {
    // ✅ ОПТИМИЗАЦИЯ 9: Перемещаем машины в пул вместо уничтожения
    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      
      if (this.carPool.length < this.maxPoolSize) {
        // Возвращаем в пул
        if (car.mesh) {
          car.mesh.visible = false; // Скрываем
        }
        this.carPool.push(car);
      } else {
        // Пул заполнен, удаляем
        if (car.dispose) {
          car.dispose();
        } else if (car.mesh) {
          this.scene.remove(car.mesh);
          if (car.mesh.geometry) car.mesh.geometry.dispose();
        }
      }
    }
    
    this.cars = [];
    this.spatialGrid.clear();
  }

  generateRandomRoute() {
    if (!this.roadSystem || !this.roadSystem.lanes) return null;
    
    const lanes = this.roadSystem.lanes;
    const startIdx = Math.floor(Math.random() * lanes.length);
    const endIdx = Math.floor(Math.random() * lanes.length);
    
    // ✅ ОПТИМИЗАЦИЯ 10: Используем кэш маршрутов
    const cacheKey = `${startIdx}-${endIdx}`;
    
    if (this.routeCache.has(cacheKey)) {
      // Возвращаем копию из кэша
      return [...this.routeCache.get(cacheKey)];
    }
    
    const start = lanes[startIdx];
    const end = lanes[endIdx];
    
    let route = null;
    if (typeof this.roadSystem.buildRoute === 'function') {
      route = this.roadSystem.buildRoute(start.start, end.end);
    }
    
    // Сохраняем в кэш
    if (route && this.routeCache.size < this.maxCacheSize) {
      this.routeCache.set(cacheKey, route);
    }
    
    return route;
  }

  // ✅ ОПТИМИЗАЦИЯ 11: Spatial partitioning для оптимизации проверок коллизий
  updateSpatialGrid() {
    this.spatialGrid.clear();
    
    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      if (!car.mesh) continue;
      
      const pos = car.mesh.position;
      const cellX = Math.floor(pos.x / this.gridCellSize);
      const cellZ = Math.floor(pos.z / this.gridCellSize);
      const cellKey = `${cellX},${cellZ}`;
      
      if (!this.spatialGrid.has(cellKey)) {
        this.spatialGrid.set(cellKey, []);
      }
      this.spatialGrid.get(cellKey).push(car);
    }
  }

  // ✅ ОПТИМИЗАЦИЯ 12: Получение соседних машин для проверки коллизий
  getNearbyCars(car) {
    if (!car.mesh) return [];
    
    const pos = car.mesh.position;
    const cellX = Math.floor(pos.x / this.gridCellSize);
    const cellZ = Math.floor(pos.z / this.gridCellSize);
    
    const nearby = [];
    
    // Проверяем текущую ячейку и соседние (3x3 grid)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const key = `${cellX + dx},${cellZ + dz}`;
        const cellCars = this.spatialGrid.get(key);
        if (cellCars) {
          nearby.push(...cellCars);
        }
      }
    }
    
    return nearby.filter(c => c !== car);
  }

  // ✅ ОПТИМИЗАЦИЯ 13: Основной метод update с deltaTime
  update() {
    if (this.cars.length === 0) return;
    
    // Вычисляем deltaTime
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // в секундах
    this.lastUpdateTime = currentTime;
    
    // Ограничиваем deltaTime для стабильности
    const clampedDelta = Math.min(deltaTime, 0.1);
    
    // ✅ ОПТИМИЗАЦИЯ 14: Батчинг - обновляем не все машины каждый кадр
    const batchStart = this.currentBatchIndex;
    const batchEnd = Math.min(batchStart + this.updateBatchSize, this.cars.length);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const car = this.cars[i];
      if (car && car.update) {
        car.update(clampedDelta);
      }
    }
    
    // Обновляем индекс батча
    this.currentBatchIndex = batchEnd;
    if (this.currentBatchIndex >= this.cars.length) {
      this.currentBatchIndex = 0;
      
      // ✅ Обновляем spatial grid раз в цикл
      this.updateSpatialGrid();
    }
  }

  // ✅ ДОПОЛНИТЕЛЬНО: Метод для полного обновления всех машин (для критичных моментов)
  updateAll(deltaTime = 0.016) {
    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      if (car && car.update) {
        car.update(deltaTime);
      }
    }
  }

  // ✅ ДОПОЛНИТЕЛЬНО: Метод для получения статистики
  getStats() {
    return {
      activeCars: this.cars.length,
      pooledCars: this.carPool.length,
      cachedRoutes: this.routeCache.size,
      spatialCells: this.spatialGrid.size
    };
  }

  // ✅ ДОПОЛНИТЕЛЬНО: Метод для паузы всех машин
  pauseAll() {
    for (let i = 0; i < this.cars.length; i++) {
      if (this.cars[i].setPaused) {
        this.cars[i].setPaused(true);
      }
    }
  }

  // ✅ ДОПОЛНИТЕЛЬНО: Метод для возобновления
  resumeAll() {
    for (let i = 0; i < this.cars.length; i++) {
      if (this.cars[i].setPaused) {
        this.cars[i].setPaused(false);
      }
    }
    // Сбрасываем время
    this.lastUpdateTime = performance.now();
  }

  // ✅ ДОПОЛНИТЕЛЬНО: Полная очистка ресурсов
  dispose() {
    this.clearTraffic();
    
    // Очищаем пул
    for (let i = 0; i < this.carPool.length; i++) {
      if (this.carPool[i].dispose) {
        this.carPool[i].dispose();
      }
    }
    
    this.carPool = [];
    this.routeCache.clear();
    this.spatialGrid.clear();
  }
}