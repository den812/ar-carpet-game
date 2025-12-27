// ===================================
// ФАЙЛ: src/traffic/traffic_manager.js
// ИСПРАВЛЕНО: 
// - Правильная логика спавна конкретной модели
// - Улучшена работа с пулом машин
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
    if (!modelData || !modelData.model) {
      console.error('❌ Невалидные данные модели:', modelData);
      return null;
    }

    console.log(`🚗 Спавн машины: ${modelData.name}`);

    // ✅ ИСПРАВЛЕНО: всегда создаем НОВУЮ машину с переданной моделью
    // Не берем из пула, т.к. пул может содержать машины других моделей
    
    const car = new Car(modelData.model, this.roadNetwork, modelData.name);
    this.cars.push(car);
    this.parent.add(car.model);
    
    console.log(`🆕 Создана новая машина: ${modelData.name}`);
    
    // Применяем глобальный масштаб
    car.setGlobalScale(this.globalScaleMultiplier);
    
    // Выбираем случайные узлы для маршрута
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
      // Удаляем машину из сцены
      this.parent.remove(car.model);
      this.cars = this.cars.filter(c => c !== car);
      return null;
    }
    
    // Пытаемся заспавнить машину
    const success = car.spawn(startNode, endNode);
    
    if (!success) {
      console.warn('⚠️ Не удалось заспавнить машину');
      this.parent.remove(car.model);
      this.cars = this.cars.filter(c => c !== car);
      return null;
    }
    
    console.log(`✅ Машина ${modelData.name} успешно заспавнена`);
    return car;
  }

  update() {
    if (!this.isInitialized) return;
    
    const activeCars = this.cars.filter(c => c.isActive);
    
    // ✅ НОВОЕ: Проверка коллизий между машинами
    for (let i = 0; i < activeCars.length; i++) {
      const car1 = activeCars[i];
      let hasCollision = false;
      
      for (let j = i + 1; j < activeCars.length; j++) {
        const car2 = activeCars[j];
        
        if (car1.checkCollision(car2)) {
          hasCollision = true;
          
          // Останавливаем обе машины
          car1.stopForCollision();
          car2.stopForCollision();
        }
      }
      
      // Если нет коллизий, возобновляем движение
      if (!hasCollision) {
        car1.resumeMovement();
      }
    }
    
    // Обновляем все активные машины
    for (const car of activeCars) {
      car.update();
      
      // Если машина завершила путь, спавним новую
      if (!car.isActive) {
        setTimeout(() => {
          const modelData = this.carModels.getModelByName(car.modelName);
          if (modelData) {
            this.spawnCarWithModel(modelData);
          }
        }, Math.random() * 2000 + 500);
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
    
    return {
      totalCars: this.cars.length,
      activeCars: activeCars,
      pooledCars: 0 // Больше не используем пул
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