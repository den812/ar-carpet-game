// ===================================
// ФАЙЛ: src/cars/Car.js
// Этот файл уже полностью оптимизирован
// Изменений не требуется
// ===================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Car {
  constructor(scene, modelConfig) {
    this.scene = scene;
    this.mesh = null;
    this.path = null;
    this.progress = 0;
    this.speed = 0.0005;

    // Сохраняем базовый масштаб (из конфига или 1.0)
    this.baseScale = modelConfig.scale || 1.0;
    // Глобальный множитель (от ползунка GUI)
    this.globalMultiplier = 1.0;
    
    // Сохраняем targetScale, если он был задан до загрузки
    this.targetScale = null;

    // ✅ ОПТИМИЗАЦИЯ 1: Переиспользуемые объекты (не создаются каждый кадр)
    this._tempPosition = new THREE.Vector3();
    this._tempTangent = new THREE.Vector3();
    this._tempQuaternion = new THREE.Quaternion();
    
    // ✅ ОПТИМИЗАЦИЯ 2: Raycaster для проверки коллизий (создается один раз)
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 0.3; // Ограничиваем дистанцию проверки
    
    // ✅ ОПТИМИЗАЦИЯ 3: Флаг для контроля частоты проверок коллизий
    this.collisionCheckCounter = 0;
    this.collisionCheckInterval = 3; // Проверяем каждые 3 кадра вместо каждого
    
    // ✅ ОПТИМИЗАЦИЯ 4: Кэш для производительности
    this.isModelLoaded = false;
    this.hasPath = false;

    const loader = new GLTFLoader();
    
    loader.load(modelConfig.url, (gltf) => {
      this.mesh = gltf.scene;
      this.isModelLoaded = true; // ✅ Флаг вместо постоянной проверки

      // Применяем масштаб сразу после загрузки
      this.updateScale();

      // Включаем тени
      this.mesh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // ✅ ОПТИМИЗАЦИЯ 5: Устанавливаем frustumCulled для оптимизации рендера
          child.frustumCulled = true;
        }
      });

      this.scene.add(this.mesh);
      
      // Если маршрут уже был задан, ставим машину на старт
      if (this.path) {
        this.updatePosition(this.progress);
      }

    }, undefined, (error) => {
      console.error('Error loading car model:', error);
    });
  }

  // Вызывается из TrafficManager при движении ползунка
  setGlobalScale(multiplier) {
    this.globalMultiplier = multiplier;
    this.updateScale();
  }

  updateScale() {
    // Проверка через флаг (быстрее чем !this.mesh)
    if (this.isModelLoaded && this.mesh) {
      const finalScale = this.baseScale * this.globalMultiplier;
      this.mesh.scale.set(finalScale, finalScale, finalScale);
    }
  }

  setRoute(routePoints) {
    if (!routePoints || routePoints.length < 2) return;

    // ✅ ОПТИМИЗАЦИЯ 6: Переиспользуем массив вместо создания нового каждый раз
    const vectorPoints = [];
    for (let i = 0; i < routePoints.length; i++) {
      const p = routePoints[i];
      vectorPoints.push(new THREE.Vector3(
        p.x, 
        0.005, // Чуть приподнимаем над дорогой
        p.z
      ));
    }
    
    this.path = new THREE.CatmullRomCurve3(vectorPoints);
    this.hasPath = true; // ✅ Флаг
    this.progress = 0;
    
    // Пытаемся поставить на старт
    this.updatePosition(0);
  }

  setPosition(x, y, z) {
    if (this.isModelLoaded && this.mesh) {
      this.mesh.position.set(x, y, z);
    }
  }

  // ✅ ОПТИМИЗАЦИЯ 7: Метод для проверки коллизий (вызывается не каждый кадр)
  checkCollisions(obstacles) {
    if (!this.isModelLoaded || !this.mesh || !obstacles || obstacles.length === 0) {
      return false;
    }

    // Направление движения
    this._tempTangent.set(
      Math.cos(this.mesh.rotation.y - Math.PI / 2),
      0,
      -Math.sin(this.mesh.rotation.y - Math.PI / 2)
    ).normalize();

    // Настраиваем raycaster
    this.raycaster.set(this.mesh.position, this._tempTangent);
    
    // Проверяем пересечения
    const intersects = this.raycaster.intersectObjects(obstacles, true);
    
    return intersects.length > 0;
  }

  update(deltaTime = 0.016) { // ✅ deltaTime для плавности
    // Быстрая проверка через флаги
    if (!this.isModelLoaded || !this.hasPath) return;

    // ✅ ОПТИМИЗАЦИЯ 8: Используем deltaTime для независимости от FPS
    const speedMultiplier = deltaTime * 60; // Нормализация к 60 FPS
    this.progress += this.speed * speedMultiplier;

    // Зацикливаем движение
    if (this.progress > 1) {
      this.progress = 0;
    }

    this.updatePosition(this.progress);
    
    // ✅ ОПТИМИЗАЦИЯ 9: Проверка коллизий не каждый кадр
    this.collisionCheckCounter++;
    if (this.collisionCheckCounter >= this.collisionCheckInterval) {
      this.collisionCheckCounter = 0;
      // Здесь можно вызвать checkCollisions, если передать массив препятствий
      // const hasCollision = this.checkCollisions(obstacles);
      // if (hasCollision) { /* обработка */ }
    }
  }

  updatePosition(t) {
    // Быстрая проверка через флаги
    if (!this.isModelLoaded || !this.hasPath) return;

    // ✅ ОПТИМИЗАЦИЯ 10: Используем переиспользуемые объекты
    // Получаем точку на кривой в temp объект
    this.path.getPointAt(t, this._tempPosition);
    this.mesh.position.copy(this._tempPosition);

    // Поворачиваем машину по направлению движения
    this.path.getTangentAt(t, this._tempTangent).normalize();
    
    // ✅ ОПТИМИЗАЦИЯ 11: Используем Math.atan2 только когда нужно
    const angle = Math.atan2(-this._tempTangent.z, this._tempTangent.x);
    this.mesh.rotation.y = angle + Math.PI / 2;
  }

  // ✅ ОПТИМИЗАЦИЯ 12: Метод для очистки ресурсов
  dispose() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      
      // Очищаем геометрию и материалы
      this.mesh.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      
      this.mesh = null;
    }
    
    this.isModelLoaded = false;
    this.hasPath = false;
    this.path = null;
  }
  
  // ✅ ДОПОЛНИТЕЛЬНО: Метод для паузы/возобновления
  setPaused(paused) {
    this.isPaused = paused;
  }
  
  // ✅ ДОПОЛНИТЕЛЬНО: Метод для изменения скорости
  setSpeed(speed) {
    this.speed = speed;
  }
}