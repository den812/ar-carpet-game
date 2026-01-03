// ===================================
// ФАЙЛ: src/cars/Car.js V23
// ИСПРАВЛЕНО:
// - Добавлены проверки на undefined для current и next
// - Защита от краш-ошибок "Cannot read properties of undefined"
// ===================================

import * as THREE from 'three';
import { getCarScale } from '../config.js';

export class Car {
  constructor(model, roadNetwork, modelName = 'unknown') {
    this.model = model;
    this.roadNetwork = roadNetwork;
    this.modelName = modelName;
    
    const scale = getCarScale(modelName);
    this.model.scale.setScalar(scale);
    
    this.baseSpeed = 0.0003 + Math.random() * 0.0002;
    this.currentSpeed = this.baseSpeed;
    this.maxSpeed = this.baseSpeed * 1.5;
    this.minSpeed = this.baseSpeed * 0.5;
    
    this.heightAboveRoad = 0.0;
    
    this.path = [];
    this.currentPathIndex = 0;
    this.progress = 0;
    
    this.currentLane = null;
    
    this.targetRotation = 0;
    this.currentRotation = 0;
    this.rotationSpeed = 0.15;
    
    this.isActive = false;
    this.isStopped = false;
    
    this.applyRandomColor();
  }

  applyRandomColor() {
    const hue = Math.random();
    const color = new THREE.Color().setHSL(hue, 0.7, 0.5);
    
    this.model.traverse(child => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            if (mat.color) {
              mat.color.copy(color);
            }
          });
        } else if (child.material.color) {
          child.material.color.copy(color);
        }
      }
    });
  }

  spawn(startNode, endNode) {
    if (!startNode || !endNode) {
      console.error('❌ Invalid spawn nodes');
      return false;
    }
    
    if (startNode === endNode) {
      console.error('❌ Start and end nodes are the same');
      return false;
    }
    
    this.path = this.roadNetwork.findPath(startNode, endNode);
    
    if (this.path.length < 2) {
      console.error('❌ Path too short:', this.path.length);
      return false;
    }
    
    this.currentPathIndex = 0;
    this.progress = 0;
    this.isActive = true;
    this.isStopped = false;
    
    this.currentLane = this.roadNetwork.getLane(this.path[0], this.path[1]);
    
    const start = this.path[0];
    let startX = start.x;
    let startY = start.y;
    
    if (this.currentLane) {
      startX += this.currentLane.offset.x;
      startY += this.currentLane.offset.y;
    }
    
    this.model.position.set(startX, this.heightAboveRoad, startY);
    
    if (this.path.length > 1) {
      const next = this.path[1];
      const dx = next.x - start.x;
      const dy = next.y - start.y;
      this.targetRotation = Math.atan2(dy, dx);
      this.currentRotation = this.targetRotation;
      this.model.rotation.y = -this.targetRotation + Math.PI / 2;
    }
    
    this.model.visible = true;
    return true;
  }

  update() {
    if (!this.isActive || this.path.length < 2) return;
    
    // ✅ FIX: Проверка на undefined ПЕРЕД использованием
    const current = this.path[this.currentPathIndex];
    const next = this.path[this.currentPathIndex + 1];
    
    // ✅ FIX: Если current или next undefined - деспавним машину
    if (!current || !next) {
      console.warn('⚠️ Undefined path nodes, despawning car');
      this.despawn();
      return;
    }
    
    // Проверка что узлы имеют координаты
    if (typeof current.x !== 'number' || typeof current.y !== 'number' ||
        typeof next.x !== 'number' || typeof next.y !== 'number') {
      console.error('❌ Invalid node coordinates:', current, next);
      this.despawn();
      return;
    }
    
    // Обновляем текущую полосу
    if (!this.currentLane || this.currentLane.start !== current || this.currentLane.end !== next) {
      this.currentLane = this.roadNetwork.getLane(current, next);
    }
    
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    const segmentLength = Math.hypot(dx, dy);
    
    // Защита от деления на ноль
    if (segmentLength < 0.0001) {
      console.warn('⚠️ Zero segment length, skipping to next segment');
      this.currentPathIndex++;
      this.progress = 0;
      return;
    }
    
    // Вычисляем угол поворота на следующем сегменте
    let turnAngle = 0;
    if (this.currentPathIndex + 2 < this.path.length) {
      const afterNext = this.path[this.currentPathIndex + 2];
      if (afterNext && typeof afterNext.x === 'number' && typeof afterNext.y === 'number') {
        const currentAngle = Math.atan2(dy, dx);
        const nextAngle = Math.atan2(afterNext.y - next.y, afterNext.x - next.x);
        turnAngle = Math.abs(nextAngle - currentAngle);
        if (turnAngle > Math.PI) turnAngle = 2 * Math.PI - turnAngle;
      }
    }
    
    // Адаптивная скорость
    const distanceToTurn = (1 - this.progress) * segmentLength;
    const turnFactor = turnAngle > 0.5 ? 0.6 : 1.0;
    const distanceFactor = distanceToTurn < 0.2 ? 0.7 : 1.0;
    
    // Если машина остановлена (коллизия), не двигаемся
    if (this.isStopped) {
      return;
    }
    
    this.currentSpeed = this.baseSpeed * turnFactor * distanceFactor;
    
    this.progress += this.currentSpeed / segmentLength;
    
    if (this.progress >= 1) {
      this.currentPathIndex++;
      this.progress = 0;
      
      if (this.currentPathIndex >= this.path.length - 1) {
        this.despawn();
        return;
      }
    }
    
    // Интерполяция позиции с учетом смещения полосы
    const smoothProgress = this.smoothstep(this.progress);
    
    let x = current.x + dx * smoothProgress;
    let y = current.y + dy * smoothProgress;
    
    if (this.currentLane) {
      x += this.currentLane.offset.x;
      y += this.currentLane.offset.y;
    }
    
    this.model.position.set(x, this.heightAboveRoad, y);
    
    // Плавный поворот
    this.targetRotation = Math.atan2(dy, dx);
    
    let rotDiff = this.targetRotation - this.currentRotation;
    
    while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
    while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;
    
    this.currentRotation += rotDiff * this.rotationSpeed;
    
    this.model.rotation.y = -this.currentRotation + Math.PI / 2;
  }

  smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  despawn() {
    this.isActive = false;
    this.isStopped = false;
    this.model.visible = false;
    this.path = [];
    this.currentPathIndex = 0;
    this.progress = 0;
    this.currentLane = null;
  }

  setGlobalScale(scale) {
    const baseScale = getCarScale(this.modelName);
    this.model.scale.setScalar(baseScale * scale);
  }

  // ✅ Методы для управления коллизиями
  stopForCollision() {
    this.isStopped = true;
  }

  resumeMovement() {
    this.isStopped = false;
  }

  checkCollision(otherCar) {
    if (!this.isActive || !otherCar.isActive) return false;
    
    const distance = this.model.position.distanceTo(otherCar.model.position);
    const minDistance = 0.15; // Минимальное расстояние между машинами
    
    return distance < minDistance;
  }

  isAvailable() {
    return !this.isActive;
  }
}