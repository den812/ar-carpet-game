// src/traffic/traffic_manager.js
import { Car } from '../cars/Car.js';

// ВАЖНО: Используем фигурные скобки, так как экспорт именованный
import { CarModels } from '../cars/CarModels.js';

export class TrafficManager {
    constructor(scene, roadNetwork) {
        this.scene = scene;
        this.roadNetwork = roadNetwork;
        this.cars = [];
    }

    spawnCars(count) {
        if (!this.roadNetwork || this.roadNetwork.length === 0) {
            console.warn("Нет дорог для создания машин!");
            return;
        }

        console.log(`Создаем ${count} машин...`);
        for (let i = 0; i < count; i++) {
            // Выбираем случайную модель из списка
            const modelConfig = CarModels[Math.floor(Math.random() * CarModels.length)];
            
            // Создаем машину
            const car = new Car(this.scene, modelConfig);
            
            // --- ЛОГИКА РАЗМЕЩЕНИЯ ---
            // Берем случайную дорогу
            const randomRoad = this.roadNetwork[Math.floor(Math.random() * this.roadNetwork.length)];
            
            // Если у дороги есть координаты начала (примерная логика)
            if (randomRoad) {
                // Если roadNetwork хранит объекты Three.js (Mesh/Group)
                if (randomRoad.position) {
                     car.setPosition(randomRoad.position.x, 0.1, randomRoad.position.z);
                } 
                // Если roadNetwork хранит просто координаты точек
                else if (randomRoad.x !== undefined && randomRoad.z !== undefined) {
                     car.setPosition(randomRoad.x, 0.1, randomRoad.z);
                }
            } else {
                car.setPosition(i * 0.5, 0, 0); // Фоллбэк, если дорог нет
            }

            this.cars.push(car);
        }
    }

    update() {
        this.cars.forEach(car => {
            if (car.update) car.update();
        });
    }
}