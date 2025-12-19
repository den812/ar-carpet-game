import * as THREE from 'three';

export class Car {
  constructor(id, model, roadNetwork, trafficManager) {
    this.id = id;
    this.model = model;
    this.roadNetwork = roadNetwork;
    this.trafficManager = trafficManager;
    
    // Route and navigation
    this.route = null;
    this.currentRouteIndex = 0;
    this.targetPosition = null;
    this.position = model ? model.position.clone() : new THREE.Vector3();
    
    // Movement properties
    this.velocity = new THREE.Vector3();
    this.speed = 0;
    this.maxSpeed = 0.5;
    this.acceleration = 0.02;
    this.deceleration = 0.03;
    this.isMoving = false;
    
    // Rotation and heading
    this.heading = 0;
    this.targetHeading = 0;
    this.rotationSpeed = 0.1;
    
    // Car dimensions
    this.width = 1.5;
    this.length = 3;
    this.boundingBox = new THREE.Box3();
    
    // State management
    this.active = true;
    this.spawned = false;
  }

  /**
   * Set the route for the car to follow
   * @param {Array<THREE.Vector3>} waypoints - Array of waypoints forming the route
   */
  setRoute(waypoints) {
    if (!waypoints || waypoints.length === 0) {
      console.warn(`Car ${this.id}: Invalid route provided`);
      return false;
    }

    this.route = waypoints.map(wp => wp.clone());
    this.currentRouteIndex = 0;
    this.targetPosition = this.route[0].clone();
    this.isMoving = true;

    console.log(`Car ${this.id}: Route set with ${waypoints.length} waypoints`);
    return true;
  }

  /**
   * Set the position of the car
   * @param {THREE.Vector3} position - The new position
   */
  setPosition(position) {
    if (!position || !(position instanceof THREE.Vector3)) {
      console.warn(`Car ${this.id}: Invalid position provided`);
      return false;
    }

    this.position.copy(position);
    
    if (this.model) {
      this.model.position.copy(position);
    }

    return true;
  }

  /**
   * Update the car's position, rotation, and movement
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  update(deltaTime) {
    if (!this.active || !this.route || this.route.length === 0) {
      return;
    }

    // Update movement
    this.updateMovement(deltaTime);

    // Update rotation to face direction of movement
    this.updateRotation(deltaTime);

    // Sync model position if it exists
    if (this.model) {
      this.model.position.copy(this.position);
      this.model.rotation.z = this.heading;
    }

    // Update bounding box for collision detection
    this.updateBoundingBox();

    // Check if reached target waypoint
    this.checkWaypointReached();
  }

  /**
   * Update the car's movement along the route
   * @private
   */
  updateMovement(deltaTime) {
    if (!this.targetPosition) {
      this.isMoving = false;
      return;
    }

    // Calculate direction to target
    const direction = new THREE.Vector3().subVectors(this.targetPosition, this.position);
    const distance = direction.length();

    if (distance > 0) {
      direction.normalize();

      // Check for obstacles/other cars ahead
      const canMove = this.checkClearPath(direction);

      if (canMove) {
        // Accelerate or maintain speed
        if (this.speed < this.maxSpeed) {
          this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
        }
      } else {
        // Decelerate if obstacle ahead
        this.speed = Math.max(this.speed - this.deceleration, 0);
      }

      // Update velocity
      this.velocity.copy(direction).multiplyScalar(this.speed);

      // Update position
      this.position.add(this.velocity);

      // Update target heading to face movement direction
      this.targetHeading = Math.atan2(direction.y, direction.x);
    } else {
      // Decelerate when near target
      this.speed = Math.max(this.speed - this.deceleration, 0);
    }
  }

  /**
   * Update the car's rotation
   * @private
   */
  updateRotation(deltaTime) {
    const angleDiff = this.targetHeading - this.heading;
    
    // Shortest path rotation
    let shortestAngle = angleDiff;
    if (angleDiff > Math.PI) {
      shortestAngle = angleDiff - 2 * Math.PI;
    } else if (angleDiff < -Math.PI) {
      shortestAngle = angleDiff + 2 * Math.PI;
    }

    this.heading += shortestAngle * this.rotationSpeed * deltaTime * 60;
  }

  /**
   * Check if the path ahead is clear of obstacles
   * @private
   */
  checkClearPath(direction) {
    if (!this.roadNetwork) {
      return true;
    }

    const lookAhead = this.length * 2;
    const checkPoint = new THREE.Vector3()
      .copy(this.position)
      .addScaledVector(direction, lookAhead);

    // Check for collisions with other cars
    if (this.trafficManager) {
      const otherCars = this.trafficManager.getCarsInArea(checkPoint, this.width * 2);
      if (otherCars.length > 0) {
        return false;
      }
    }

    // Check if point is on valid road
    return this.roadNetwork.isPointOnRoad(checkPoint);
  }

  /**
   * Check if the car has reached the current waypoint
   * @private
   */
  checkWaypointReached() {
    if (!this.targetPosition) return;

    const distanceToTarget = this.position.distanceTo(this.targetPosition);
    const waypointThreshold = 0.5;

    if (distanceToTarget < waypointThreshold) {
      this.currentRouteIndex++;

      if (this.currentRouteIndex < this.route.length) {
        this.targetPosition = this.route[this.currentRouteIndex].clone();
      } else {
        // Reached end of route
        this.isMoving = false;
        this.targetPosition = null;
        this.speed = 0;
        
        // Notify traffic manager that this car has completed its route
        if (this.trafficManager) {
          this.trafficManager.onCarRouteComplete(this.id);
        }
      }
    }
  }

  /**
   * Update the car's bounding box for collision detection
   * @private
   */
  updateBoundingBox() {
    const halfWidth = this.width / 2;
    const halfLength = this.length / 2;

    const cos = Math.cos(this.heading);
    const sin = Math.sin(this.heading);

    const corners = [
      [-halfLength, -halfWidth],
      [halfLength, -halfWidth],
      [halfLength, halfWidth],
      [-halfLength, halfWidth]
    ].map(([x, y]) => {
      return new THREE.Vector3(
        this.position.x + x * cos - y * sin,
        this.position.y + x * sin + y * cos,
        this.position.z
      );
    });

    this.boundingBox.setFromPoints(corners);
  }

  /**
   * Get the car's current position
   * @returns {THREE.Vector3} The position
   */
  getPosition() {
    return this.position.clone();
  }

  /**
   * Get the car's current heading in radians
   * @returns {number} The heading angle
   */
  getHeading() {
    return this.heading;
  }

  /**
   * Get the car's current speed
   * @returns {number} The speed value
   */
  getSpeed() {
    return this.speed;
  }

  /**
   * Get the car's bounding box
   * @returns {THREE.Box3} The bounding box
   */
  getBoundingBox() {
    return this.boundingBox;
  }

  /**
   * Check if this car is active and moving
   * @returns {boolean} Active status
   */
  isActive() {
    return this.active && this.spawned;
  }

  /**
   * Mark car as spawned in the scene
   */
  markAsSpawned() {
    this.spawned = true;
  }

  /**
   * Mark car as despawned from the scene
   */
  markAsDespawned() {
    this.spawned = false;
  }

  /**
   * Deactivate the car
   */
  deactivate() {
    this.active = false;
    this.isMoving = false;
    this.speed = 0;
  }

  /**
   * Dispose of the car's resources
   */
  dispose() {
    this.active = false;
    this.route = null;
    this.targetPosition = null;
    
    if (this.model) {
      if (this.model.geometry) {
        this.model.geometry.dispose();
      }
      if (this.model.material) {
        if (Array.isArray(this.model.material)) {
          this.model.material.forEach(mat => mat.dispose());
        } else {
          this.model.material.dispose();
        }
      }
    }
  }
}
