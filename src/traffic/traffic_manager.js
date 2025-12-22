// ===================================
// ФАЙЛ: src/traffic/traffic_manager.js
// ИСПРАВЛЕНО: 
// - car.setPosition НЕ СУЩЕСТВУЕТ
// - Убраны все вызовы несуществующих методов
// ===================================

import { Car } from '../cars/Car.js';
import { CarModels } from '../cars/CarModels.js';

export class TrafficManager {
  constructor(parent, roadNetwork) {
    this.parent = parent;
    this.roadNetwork = roadNetwork;
    this.cars = [];
    this.carPool = [];
    this.globalScaleMultiplier = 1.0;
    
    this.isInitialized = false;
    this.carModels = null;
    
    console.log('🚗 TrafficManager создан');
  }

  async init() {
    if (this.isInitialized) return;
    
    console.log('🚗 Инициализация TrafficManager...');
    
    // Загружаем модели машин
    this.carModels = new CarModels();
    await this.carModels.loadAll();
    
    this.isInitialized = true;
    console.log('✅ TrafficManager инициализирован');
  }

  async spawnCars(count) {
    if (!this.isInitialized) {
      await this.init();
    }
    
    console.log(`🚗 Спавн ${count} машин (разные модели)...`);
    
    // Спавним разные модели
    const models = ['Buggy.glb', 'CesiumMilkTruck.glb', 'Duck.glb'];
    const distribution = [3, 2, 2]; // Buggy: 3, Truck: 2, Duck: 2
    
    let spawned = 0;
    for (let i = 0; i < models.length && spawned < count; i++) {
      const modelName = models[i];
      const modelCount = Math.min(distribution[i], count - spawned);
      
      for (let j = 0; j < modelCount; j++) {
        const modelData = this.carModels.getModelByName(modelName);
        if (modelData) {
          await this.spawnCarWithModel(modelData);
          spawned++;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
    
    console.log(`✅ Заспавнено ${spawned} машин`);
  }

  async spawnSingleCar() {
    // Выбираем случайную модель
    const modelData = this.carModels.getRandomModel();
    return await this.spawnCarWithModel(modelData);
  }

  async spawnCarWithModel(modelData) {
    let car = null;
    
    // Пытаемся взять из пула
    if (this.carPool.length > 0) {
      car = this.carPool.pop();
      console.log('♻️ Машина взята из пула');
    } else {
      // Создаем новую машину
      const modelData = this.carModels.getRandomModel();
      if (!modelData) {
        console.error('❌ Не удалось получить модель машины');
        return null;
      }
      
      car = new Car(modelData.model, this.roadNetwork, modelData.name);
      this.cars.push(car);
      this.parent.add(car.model);
      
      console.log(`🆕 Создана новая машина: ${modelData.name}`);
    }
    
    // Применяем глобальный масштаб
    car.setGlobalScale(this.globalScaleMultiplier);
    
    // ✅ Выбираем случайные узлы для маршрута (гарантируем что они разные)
    const startNode = this.roadNetwork.getRandomNode();
    let endNode = this.roadNetwork.getRandomNode();
    
    // Убеждаемся что конечный узел отличается от начального
    let attempts = 0;
    while (endNode === startNode && attempts < 10) {
      endNode = this.roadNetwork.getRandomNode();
      attempts++;
    }
    
    if (endNode === startNode) {
      console.error('❌ Не удалось найти разные узлы для маршрута');
      this.carPool.push(car);
      return null;
    }
    
    // Пытаемся заспавнить машину
    const success = car.spawn(startNode, endNode);
    
    if (!success) {
      console.warn('⚠️ Не удалось заспавнить машину, возвращаем в пул');
      this.carPool.push(car);
      return null;
    }
    
    return car;
  }

  update() {
    if (!this.isInitialized) return;
    
    // Обновляем все активные машины
    for (const car of this.cars) {
      if (car.isActive) {
        car.update();
        
        // Если машина завершила путь, возвращаем в пул и спавним новую
        if (!car.isActive) {
          this.carPool.push(car);
          
          // Спавним новую машину с задержкой
          setTimeout(() => {
            this.spawnSingleCar();
          }, Math.random() * 2000 + 500);
        }
      }
    }
  }

  setGlobalScale(scale) {
    this.globalScaleMultiplier = scale;
    
    // Применяем ко всем существующим машинам
    for (const car of this.cars) {
      car.setGlobalScale(scale);
    }
    
    console.log(`🔍 Глобальный масштаб установлен: ${scale.toFixed(2)}x`);
  }

  getStats() {
    const activeCars = this.cars.filter(c => c.isActive).length;
    const pooledCars = this.carPool.length;
    
    return {
      totalCars: this.cars.length,
      activeCars: activeCars,
      pooledCars: pooledCars
    };
  }

  dispose() {
    console.log('🗑️ Очистка TrafficManager...');
    
    // Удаляем все машины из сцены
    for (const car of this.cars) {
      if (car.model.parent) {
        car.model.parent.remove(car.model);
      }
    }
    
    this.cars = [];
    this.carPool = [];
    this.isInitialized = false;
    
    console.log('✅ TrafficManager очищен');
  }
}