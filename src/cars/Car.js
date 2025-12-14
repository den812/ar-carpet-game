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

    const loader = new GLTFLoader();
    
    loader.load(modelConfig.url, (gltf) => {
      this.mesh = gltf.scene;

      // Применяем масштаб сразу после загрузки
      // Если globalMultiplier уже был изменен, он применится здесь
      this.updateScale();

      // Включаем тени
      this.mesh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
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
    // Пытаемся обновить, если модель уже есть
    this.updateScale();
  }

  updateScale() {
    // ВАЖНО: Проверка, загрузилась ли модель
    if (this.mesh) {
        const finalScale = this.baseScale * this.globalMultiplier;
        this.mesh.scale.set(finalScale, finalScale, finalScale);
    }
  }

  setRoute(routePoints) {
    if (!routePoints || routePoints.length < 2) return;

    // Создаем кривую пути
    const vectorPoints = routePoints.map(p => new THREE.Vector3(
        p.x - 0.5, 
        0.005, // Чуть приподнимаем над дорогой
        p.z - 0.5
    ));
    
    this.path = new THREE.CatmullRomCurve3(vectorPoints);
    this.progress = 0;
    
    // Пытаемся поставить на старт. 
    // Если модель еще не загрузилась, updatePosition просто ничего не сделает (благодаря проверке)
    this.updatePosition(0);
  }

  setPosition(x, y, z) {
    // ВАЖНО: Проверка, загрузилась ли модель
    if (this.mesh) {
      this.mesh.position.set(x - 0.5, y, z - 0.5);
    }
  }

  update() {
    // Если модели нет ИЛИ пути нет -> выходим
    if (!this.mesh || !this.path) return;

    this.progress += this.speed;

    // Зацикливаем движение
    if (this.progress > 1) {
      this.progress = 0;
    }

    this.updatePosition(this.progress);
  }

  updatePosition(t) {
    // ВАЖНО: Самая главная проверка, которая устраняет вашу ошибку
    if (!this.mesh || !this.path) return;

    // 1. Получаем точку на кривой
    const position = this.path.getPointAt(t);
    this.mesh.position.copy(position);

    // 2. Поворачиваем машину по направлению движения
    const tangent = this.path.getTangentAt(t).normalize();
    const angle = Math.atan2(-tangent.z, tangent.x);
    this.mesh.rotation.y = angle + Math.PI / 2;
  }
}