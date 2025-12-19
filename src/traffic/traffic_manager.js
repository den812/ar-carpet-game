import { Car } from './car.js';
import { SpatialGrid } from '../utils/spatial_grid.js';

/**
 * TrafficManager - Manages all cars, their routes, and traffic simulation
 */
export class TrafficManager {
  constructor(config = {}) {
    // Configuration
    this.config = {
      maxCars: config.maxCars || 50,
      gridSize: config.gridSize || 100,
      spawnRate: config.spawnRate || 0.3,
      minSpeed: config.minSpeed || 5,
      maxSpeed: config.maxSpeed || 25,
      carLength: config.carLength || 4,
      carWidth: config.carWidth || 2,
      ...config
    };

    // State management
    this.cars = [];
    this.routes = [];
    this.spatialGrid = new SpatialGrid(this.config.gridSize);
    this.globalScale = 1;
    this.isPaused = false;
    this.stats = {
      totalSpawned: 0,
      totalDisposed: 0,
      collisions: 0,
      averageSpeed: 0
    };

    // Spatial indexing for efficient queries
    this.cellSize = this.config.gridSize;
  }

  /**
   * Spawn multiple cars with random routes
   */
  spawnCars(count) {
    for (let i = 0; i < count; i++) {
      this.spawnSingleCar();
    }
  }

  /**
   * Spawn a single car with a random route
   */
  spawnSingleCar() {
    if (this.cars.length >= this.config.maxCars) {
      return null;
    }

    const route = this.generateRandomRoute();
    if (!route || route.length < 2) {
      return null;
    }

    const speed = this.getRandomSpeed();
    const car = new Car({
      position: route[0],
      route: route,
      speed: speed,
      length: this.config.carLength,
      width: this.config.carWidth,
      id: this.generateCarId()
    });

    this.cars.push(car);
    this.stats.totalSpawned++;

    return car;
  }

  /**
   * Set global scale for all traffic elements
   */
  setGlobalScale(scale) {
    this.globalScale = scale;
    this.cars.forEach(car => {
      car.scale = scale;
    });
  }

  /**
   * Clear all traffic - remove all cars
   */
  clearTraffic() {
    this.cars.forEach(car => {
      this.stats.totalDisposed++;
    });
    this.cars = [];
    this.spatialGrid.clear();
  }

  /**
   * Generate a random route for a car
   */
  generateRandomRoute() {
    const routeLength = Math.floor(Math.random() * 8) + 4; // 4-12 waypoints
    const route = [];

    // Starting position
    let currentX = Math.random() * 200 - 100;
    let currentY = Math.random() * 200 - 100;

    for (let i = 0; i < routeLength; i++) {
      route.push({
        x: currentX,
        y: currentY,
        z: 0
      });

      // Generate next waypoint
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 50 + 20; // 20-70 units
      currentX += Math.cos(angle) * distance;
      currentY += Math.sin(angle) * distance;
    }

    return route;
  }

  /**
   * Update spatial grid with current car positions
   */
  updateSpatialGrid() {
    this.spatialGrid.clear();
    this.cars.forEach(car => {
      if (car.position) {
        const cellX = Math.floor(car.position.x / this.cellSize);
        const cellY = Math.floor(car.position.y / this.cellSize);
        this.spatialGrid.insert(car, cellX, cellY);
      }
    });
  }

  /**
   * Get cars near a given position
   */
  getNearbyCars(position, radius = 50) {
    const nearby = [];
    const cellX = Math.floor(position.x / this.cellSize);
    const cellY = Math.floor(position.y / this.cellSize);
    const cellRange = Math.ceil(radius / this.cellSize);

    for (let x = cellX - cellRange; x <= cellX + cellRange; x++) {
      for (let y = cellY - cellRange; y <= cellY + cellRange; y++) {
        const cellCars = this.spatialGrid.get(x, y);
        if (cellCars) {
          cellCars.forEach(car => {
            const distance = this.getDistance(position, car.position);
            if (distance <= radius) {
              nearby.push(car);
            }
          });
        }
      }
    }

    return nearby;
  }

  /**
   * Update a single car's state
   */
  update(car, deltaTime) {
    if (!car || car.disposed) {
      return;
    }

    // Update car position along route
    car.update(deltaTime);

    // Check if car has reached end of route
    if (car.routeProgress >= 1) {
      this.disposeCar(car);
    }
  }

  /**
   * Update all cars
   */
  updateAll(deltaTime) {
    if (this.isPaused) {
      return;
    }

    // Update spatial grid
    this.updateSpatialGrid();

    // Update each car
    const carsToRemove = [];
    this.cars.forEach(car => {
      this.update(car, deltaTime);
      if (car.disposed) {
        carsToRemove.push(car);
      }
    });

    // Remove disposed cars
    carsToRemove.forEach(car => {
      const index = this.cars.indexOf(car);
      if (index > -1) {
        this.cars.splice(index, 1);
      }
    });

    // Randomly spawn new cars
    if (Math.random() < this.config.spawnRate && this.cars.length < this.config.maxCars) {
      this.spawnSingleCar();
    }
  }

  /**
   * Get traffic statistics
   */
  getStats() {
    let totalSpeed = 0;
    this.cars.forEach(car => {
      totalSpeed += car.speed || 0;
    });

    this.stats.averageSpeed = this.cars.length > 0 ? totalSpeed / this.cars.length : 0;
    this.stats.activeCars = this.cars.length;

    return {
      ...this.stats,
      activeCars: this.cars.length
    };
  }

  /**
   * Pause all traffic
   */
  pauseAll() {
    this.isPaused = true;
    this.cars.forEach(car => {
      car.pause?.();
    });
  }

  /**
   * Resume all traffic
   */
  resumeAll() {
    this.isPaused = false;
    this.cars.forEach(car => {
      car.resume?.();
    });
  }

  /**
   * Dispose of a single car
   */
  disposeCar(car) {
    car.dispose?.();
    car.disposed = true;
    this.stats.totalDisposed++;
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    this.clearTraffic();
    this.spatialGrid.clear();
    this.routes = [];
    this.cars = [];
  }

  /**
   * Helper methods
   */

  getRandomSpeed() {
    return Math.random() * (this.config.maxSpeed - this.config.minSpeed) + this.config.minSpeed;
  }

  generateCarId() {
    return `car_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getDistance(pos1, pos2) {
    if (!pos1 || !pos2) return Infinity;
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

export default TrafficManager;
