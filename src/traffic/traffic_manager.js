// ===================================
// ФАЙЛ: src/traffic/traffic_manager.js V23
// ИСПРАВЛЕНО: 
// - Добавлена валидация перед спавном
// - Защита от undefined узлов
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
    
    // ✅ Проверка что дорожная сеть валидна
    if (!this.roadNetwork || !this.roadNetwork.nodes || this.roadNetwork.nodes.length < 2) {
      throw new Error('❌ Invalid road network');
    }
    
    const stats = this.roadNetwork.getStats();
    console.log('📊 Дорожная сеть:', stats);
    
    this.carModels = new CarModels();
    await this.carModels.loadAll();
    
    this.isInitialized = true;
    console.log('✅ TrafficManager инициализирован');
  }

  async spawnCars(count) {
    if (!this.isInitialized) {
      await this.init();
    }
    
    console.log(`🚗 Спавн ${count} машин...`);
    
    const models = ['Buggy.glb', 'CesiumMilkTruck.glb', 'Duck.glb'];
    const distribution = [3, 2, 2];
    
    let spawned = 0;
    for (let i = 0; i < models.length && spawned < count; i++) {
      const modelName = models[i];
      const modelCount = Math.min(distribution[i], count - spawned);
      
      for (let j = 0; j < modelCount; j++) {
        const modelData = this.carModels.getModelByName(modelName);
        if (modelData) {
          const car = await this.spawnCarWithModel(modelData);
          if (car) {
            spawned++;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
    
    console.log(`✅ Успешно заспавнено ${spawned}/${count} машин`);
  }

  async spawnSingleCar() {
    const modelData = this.carModels.getRandomModel();
    return await this.spawnCarWithModel(modelData);
  }

  async spawnCarWithModel(modelData) {
    if (!modelData || !modelData.model) {
      console.error('❌ Невалидные данные модели:', modelData);
      return null;
    }

    console.log(`🚗 Попытка спавна: ${modelData.name}`);

    // ✅ Получаем случайные ВАЛИДНЫЕ узлы
    const startNode = this.roadNetwork.getRandomNode();
    if (!startNode || typeof startNode.x !== 'number' || typeof startNode.y !== 'number') {
      console.error('❌ Invalid start node');
      return null;
    }
    
    let endNode = this.roadNetwork.getRandomNode();
    
    // Убеждаемся что конечный узел валидный и отличается от начального
    let attempts = 0;
    while ((!endNode || endNode === startNode || 
            typeof endNode.x !== 'number' || typeof endNode.y !== 'number') && 
           attempts < 10) {
      endNode = this.roadNetwork.getRandomNode();
      attempts++;
    }
    
    if (!endNode || endNode === startNode || 
        typeof endNode.x !== 'number' || typeof endNode.y !== 'number') {
      console.error('❌ Не удалось найти валидный конечный узел');
      return null;
    }
    
    // ✅ Проверяем что можно построить путь
    const testPath = this.roadNetwork.findPath(startNode, endNode);
    if (!testPath || testPath.length < 2) {
      console.error('❌ Невозможно построить путь между узлами');
      return null;
    }
    
    // Создаем машину
    const car = new Car(modelData.model, this.roadNetwork, modelData.name);
    this.cars.push(car);
    this.parent.add(car.model);
    
    console.log(`🆕 Создана машина: ${modelData.name}`);
    
    // Применяем глобальный масштаб
    car.setGlobalScale(this.globalScaleMultiplier);
    
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
    
    // Проверка коллизий
    for (let i = 0; i < activeCars.length; i++) {
      const car1 = activeCars[i];
      let hasCollision = false;
      
      for (let j = i + 1; j < activeCars.length; j++) {
        const car2 = activeCars[j];
        
        if (car1.checkCollision && car1.checkCollision(car2)) {
          hasCollision = true;
          
          if (car1.stopForCollision) car1.stopForCollision();
          if (car2.stopForCollision) car2.stopForCollision();
        }
      }
      
      if (!hasCollision && car1.resumeMovement) {
        car1.resumeMovement();
      }
    }
    
    // Обновляем все активные машины
    for (const car of activeCars) {
      try {
        car.update();
        
        // Если машина завершила путь, респавним
        if (!car.isActive) {
          setTimeout(() => {
            const modelData = this.carModels.getModelByName(car.modelName);
            if (modelData) {
              this.spawnCarWithModel(modelData);
            }
          }, Math.random() * 2000 + 500);
        }
      } catch (error) {
        console.error('❌ Ошибка обновления машины:', error);
        car.despawn();
      }
    }
  }

  setGlobalScale(scale) {
    this.globalScaleMultiplier = scale;
    
    for (const car of this.cars) {
      car.setGlobalScale(scale);
    }
    
    console.log(`🔍 Глобальный масштаб: ${scale.toFixed(2)}x`);
  }

  getStats() {
    const activeCars = this.cars.filter(c => c.isActive).length;
    
    return {
      totalCars: this.cars.length,
      activeCars: activeCars,
      pooledCars: 0
    };
  }

  dispose() {
    console.log('🗑️ Очистка TrafficManager...');
    
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