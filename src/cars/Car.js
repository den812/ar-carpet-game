export class Car {
  constructor(mesh, path, startOffset = 0) {
    this.mesh = mesh;
    this.path = path;
    this.t = startOffset; // Начальная позиция на пути (0-1)
    this.speed = 0.0003 + Math.random() * 0.0002; // Случайная скорость
    this.stop = false;
    this.baseY = 0.05; // Высота над ковром
    this.bobAmount = 0; // Покачивание при движении

    // Привязка машинки к userData для кликов
    mesh.userData.car = this;
    mesh.traverse(node => {
      if (node.isMesh) {
        node.userData.car = this;
      }
    });
  }

  toggle() {
    this.stop = !this.stop;
    
    // Визуальная индикация остановки
    if (this.stop) {
      this.mesh.traverse(node => {
        if (node.isMesh && node.material) {
          node.material.emissive = new THREE.Color(0xff0000);
          node.material.emissiveIntensity = 0.3;
        }
      });
    } else {
      this.mesh.traverse(node => {
        if (node.isMesh && node.material) {
          node.material.emissive = new THREE.Color(0x000000);
          node.material.emissiveIntensity = 0;
        }
      });
    }
  }

  update(deltaTime) {
    if (this.stop) {
      // Машинка стоит, но слегка покачивается
      this.bobAmount += 0.1;
      this.mesh.position.y = this.baseY + Math.sin(this.bobAmount) * 0.002;
      return;
    }

    // Движение по пути
    this.t = (this.t + this.speed * deltaTime) % 1;
    
    const currentPoint = this.path.getPointAt(this.t);
    const nextPoint = this.path.getPointAt((this.t + 0.01) % 1);

    // ИСПРАВЛЕНО: правильное позиционирование
    this.mesh.position.copy(currentPoint);
    this.mesh.position.y = this.baseY;

    // Поворот машинки по направлению движения
    this.mesh.lookAt(nextPoint);
    
    // Небольшое покачивание при движении (реалистичность)
    this.bobAmount += 0.2;
    this.mesh.position.y += Math.sin(this.bobAmount) * 0.005;
  }

  // Проверка столкновения с другой машинкой
  isCollidingWith(otherCar, threshold = 0.15) {
    const distance = this.mesh.position.distanceTo(otherCar.mesh.position);
    return distance < threshold;
  }

  // Остановка перед препятствием
  stopForObstacle() {
    this.stop = true;
  }

  // Возобновление движения
  resume() {
    this.stop = false;
  }

  // Получить текущую позицию
  getPosition() {
    return this.mesh.position.clone();
  }

  // Получить направление движения
  getDirection() {
    const nextPoint = this.path.getPointAt((this.t + 0.01) % 1);
    return nextPoint.clone().sub(this.mesh.position).normalize();
  }
}