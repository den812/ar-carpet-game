// ===================================
// ФАЙЛ: src/cars/Car.js V3
// ДОБАВЛЕНО:
// - Движение по правой полосе
// - Учет смещения полосы
// - Правостороннее движение
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
    
    this.heightAboveRoad = 0.05;
    
    this.path = [];
    this.currentPathIndex = 0;
    this.progress = 0;
    
    // ✅ НОВОЕ: текущая полоса движения
    this.currentLane = null;
    
    this.targetRotation = 0;
    this.rotationSpeed = 0.1;
    
    this.isActive = false;
    
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
      console.error('Invalid spawn nodes');
      return false;
    }
    
    this.path = this.roadNetwork.findPath(startNode, endNode);
    
    if (this.path.length < 2) {
      console.error('Path too short');
      return false;
    }
    
    this.currentPathIndex = 0;
    this.progress = 0;
    this.isActive = true;
    
    // ✅ Получаем полосу для первого сегмента
    this.currentLane = this.roadNetwork.getLane(this.path[0], this.path[1]);
    
    // Устанавливаем начальную позицию (на правой полосе)
    const start = this.path[0];
    let startX = start.x;
    let startY = start.y;
    
    if (this.currentLane) {
      startX += this.currentLane.offset.x;
      startY += this.currentLane.offset.y;
    }
    
    this.model.position.set(startX, this.heightAboveRoad, startY);
    
    // Устанавливаем начальную ориентацию
    if (this.path.length > 1) {
      const next = this.path[1];
      this.targetRotation = Math.atan2(next.y - start.y, next.x - start.x);
      this.model.rotation.y = -this.targetRotation + Math.PI / 2;
    }
    
    this.model.visible = true;
    return true;
  }

  update() {
    if (!this.isActive || this.path.length < 2) return;
    
    const current = this.path[this.currentPathIndex];
    const next = this.path[this.currentPathIndex + 1];
    
    if (!next) {
      this.despawn();
      return;
    }
    
    // ✅ Обновляем текущую полосу
    if (!this.currentLane || this.currentLane.start !== current || this.currentLane.end !== next) {
      this.currentLane = this.roadNetwork.getLane(current, next);
    }
    
    // Вычисляем базовые координаты (центр дороги)
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    const segmentLength = Math.hypot(dx, dy);
    
    // Вычисляем угол поворота на следующем сегменте
    let turnAngle = 0;
    if (this.currentPathIndex + 2 < this.path.length) {
      const afterNext = this.path[this.currentPathIndex + 2];
      const currentAngle = Math.atan2(dy, dx);
      const nextAngle = Math.atan2(afterNext.y - next.y, afterNext.x - next.x);
      turnAngle = Math.abs(nextAngle - currentAngle);
      if (turnAngle > Math.PI) turnAngle = 2 * Math.PI - turnAngle;
    }
    
    // Адаптивная скорость
    const distanceToTurn = (1 - this.progress) * segmentLength;
    const turnFactor = turnAngle > 0.5 ? 0.6 : 1.0;
    const distanceFactor = distanceToTurn < 0.2 ? 0.7 : 1.0;
    
    this.currentSpeed = this.baseSpeed * turnFactor * distanceFactor;
    
    // Обновляем прогресс
    this.progress += this.currentSpeed / segmentLength;
    
    if (this.progress >= 1) {
      this.currentPathIndex++;
      this.progress = 0;
      
      if (this.currentPathIndex >= this.path.length - 1) {
        this.despawn();
        return;
      }
    }
    
    // ✅ Интерполяция позиции С УЧЕТОМ СМЕЩЕНИЯ ПОЛОСЫ
    const smoothProgress = this.smoothstep(this.progress);
    
    // Базовая позиция (центр дороги)
    let x = current.x + dx * smoothProgress;
    let y = current.y + dy * smoothProgress;
    
    // Добавляем смещение полосы
    if (this.currentLane) {
      x += this.currentLane.offset.x;
      y += this.currentLane.offset.y;
    }
    
    this.model.position.set(x, this.heightAboveRoad, y);
    
    // Плавный поворот
    this.targetRotation = Math.atan2(dy, dx);
    let rotDiff = this.targetRotation - (this.model.rotation.y - Math.PI / 2);
    
    while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
    while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;
    
    this.model.rotation.y += rotDiff * this.rotationSpeed;
  }

  smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  despawn() {
    this.isActive = false;
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

  isAvailable() {
    return !this.isActive;
  }
}