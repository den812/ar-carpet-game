// ===================================
// ФАЙЛ: src/cars/CarModels.js
// ИСПРАВЛЕНО V29: getRandomModel() и getModelByName() возвращают правильные объекты
// ===================================

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class CarModels {
  constructor() {
    this.loader = new GLTFLoader();
    this.models = [];
    this.isLoaded = false;
    
    // Список моделей для загрузки
    this.modelList = [
      { name: 'Buggy.glb', path: './assets/models/Buggy.glb' },
      { name: 'CesiumMilkTruck.glb', path: './assets/models/CesiumMilkTruck.glb' },
      { name: 'Duck.glb', path: './assets/models/Duck.glb' }
    ];
  }

  async loadAll() {
    if (this.isLoaded) {
      console.log('⚠️ Модели уже загружены');
      return;
    }

    console.log('📦 Загрузка моделей машин...');

    const loadPromises = this.modelList.map(item => 
      this.loadModel(item.path, item.name)
    );

    try {
      const results = await Promise.all(loadPromises);
      this.models = results.filter(r => r !== null);
      this.isLoaded = true;
      console.log(`✅ Загружено ${this.models.length} моделей машин`);
    } catch (error) {
      console.error('❌ Ошибка загрузки моделей:', error);
      throw error;
    }
  }

  loadModel(path, name) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          console.log(`✅ Модель загружена: ${name}`);
          const model = gltf.scene.clone();
          resolve({ name, model });
        },
        (progress) => {
          // Прогресс загрузки (опционально)
        },
        (error) => {
          console.error(`❌ Ошибка загрузки ${name}:`, error);
          resolve(null); // Не останавливаем загрузку других моделей
        }
      );
    });
  }

  getRandomModel() {
    if (!this.isLoaded || this.models.length === 0) {
      console.error('❌ Модели не загружены');
      return null;
    }

    const randomIndex = Math.floor(Math.random() * this.models.length);
    const selectedModel = this.models[randomIndex];
    
    // ✅ FIX: Проверяем что модель существует и клонируем правильно
    if (!selectedModel || !selectedModel.model) {
      console.error('❌ Выбранная модель некорректна');
      return null;
    }
    
    // Клонируем модель для повторного использования
    return {
      name: selectedModel.name,
      model: selectedModel.model.clone()
    };
  }

  getModelByName(name) {
    console.log(`🔍 Поиск модели: ${name}`);
    console.log(`📦 Доступные модели:`, this.models.map(m => m.name));
    
    if (!this.isLoaded || this.models.length === 0) {
      console.error('❌ Модели не загружены');
      return null;
    }
    
    const found = this.models.find(m => m.name === name);
    if (!found) {
      console.error(`❌ Модель ${name} не найдена`);
      return null;
    }
    
    // ✅ FIX: Проверяем что модель существует и клонируем правильно
    if (!found.model) {
      console.error(`❌ Модель ${name} не имеет 3D объекта`);
      return null;
    }
    
    console.log(`✅ Модель ${name} найдена`);
    return {
      name: found.name,
      model: found.model.clone()
    };
  }

  dispose() {
    console.log('🗑️ Очистка CarModels...');
    this.models = [];
    this.isLoaded = false;
  }
}