import { Car } from '../cars/Car.js';
import { CarModels } from '../cars/CarModels.js';

export class TrafficManager {
    constructor(scene, roadNetwork) {
        this.scene = scene;
        this.roadSystem = roadNetwork.system || (Array.isArray(roadNetwork) ? null : roadNetwork);
        if (!this.roadSystem && roadNetwork.lanes) this.roadSystem = roadNetwork;

        this.cars = [];
        // Начальное значение ползунка (множитель)
        // Ставим 1.0, так как теперь базовые размеры прописаны в CarModels
        this.globalScaleMultiplier = 1.0; 
    }

    spawnCars(count) {
        if (!this.roadSystem) console.warn("No RoadSystem found");

        for (let i = 0; i < count; i++) {
            const modelConfig = CarModels[Math.floor(Math.random() * CarModels.length)];
            const car = new Car(this.scene, modelConfig);
            
            // Сразу применяем текущий глобальный множитель
            car.setGlobalScale(this.globalScaleMultiplier);

            if (this.roadSystem) {
                const route = this.generateRandomRoute();
                if (route) {
                    car.setRoute(route);
                    car.progress = Math.random();
                } else {
                    car.setPosition(0, 0, 0);
                }
            } else {
                car.setPosition((i - count/2) * 0.2, 0, 0);
            }
            this.cars.push(car);
        }
    }

    // Этот метод вызывается из GUI (ползунок)
    setGlobalScale(val) {
        this.globalScaleMultiplier = val;
        this.cars.forEach(car => {
            // Передаем значение в метод машины
            car.setGlobalScale(val);
        });
    }

    clearTraffic() {
        this.cars.forEach(car => {
            if (car.mesh) {
                this.scene.remove(car.mesh);
                if (car.mesh.geometry) car.mesh.geometry.dispose();
            }
        });
        this.cars = [];
    }

    generateRandomRoute() {
        if (!this.roadSystem || !this.roadSystem.lanes) return null;
        const lanes = this.roadSystem.lanes;
        const start = lanes[Math.floor(Math.random() * lanes.length)];
        const end = lanes[Math.floor(Math.random() * lanes.length)];
        if (typeof this.roadSystem.buildRoute === 'function') {
            return this.roadSystem.buildRoute(start.start, end.end);
        }
        return null;
    }

    update() {
        this.cars.forEach(car => {
            if (car && car.update) car.update();
        });
    }
}