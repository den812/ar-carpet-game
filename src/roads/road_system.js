// ===================================
// ФАЙЛ: src/roads/road_system.js
// ИСПРАВЛЕНО:
// - Интеграция с roadNetwork.js
// - Правильная визуализация дорог
// - Совместимость с TrafficManager
// ===================================

import * as THREE from 'three';
import { roads as roadCurves, intersections as roadIntersections } from './roadNetwork.js';

// === КЛАСС ЛОГИКИ ДОРОГ ===
class RoadSystem {
  constructor() {
    this.roads = [];
    this.intersections = [];
    this.signs = [];
    this.lanes = [];
    
    this.initializeRoadNetwork();
  }

  initializeRoadNetwork() {
    // ✅ Используем координаты из roadNetwork.js
    // Преобразуем CatmullRom кривые в формат RoadSystem
    
    // Главные горизонтальные дороги
    this.roads.push({
      id: 'h1',
      type: 'main',
      start: { x: -0.9, z: -0.6 },
      end: { x: 0.9, z: -0.6 },
      width: 0.08,
      priority: 1,
      curve: roadCurves.h1
    });

    this.roads.push({
      id: 'h2',
      type: 'main',
      start: { x: -0.9, z: 0.6 },
      end: { x: 0.9, z: 0.6 },
      width: 0.08,
      priority: 1,
      curve: roadCurves.h2
    });

    // Вертикальные дороги
    this.roads.push({
      id: 'v1',
      type: 'secondary',
      start: { x: -0.5, z: -1.0 },
      end: { x: -0.5, z: 1.0 },
      width: 0.08,
      priority: 0,
      curve: roadCurves.v1
    });

    this.roads.push({
      id: 'v2',
      type: 'secondary',
      start: { x: 0, z: -1.0 },
      end: { x: 0, z: 1.0 },
      width: 0.08,
      priority: 0,
      curve: roadCurves.v2
    });

    this.roads.push({
      id: 'v3',
      type: 'secondary',
      start: { x: 0.5, z: -1.0 },
      end: { x: 0.5, z: 1.0 },
      width: 0.08,
      priority: 0,
      curve: roadCurves.v3
    });

    this.generateLanes();
    this.generateIntersections();
    this.placeTrafficSigns();
  }

  generateLanes() {
    // ✅ Генерируем полосы движения (по 2 на каждую дорогу)
    this.roads.forEach(road => {
      const laneOffset = road.width / 4;
      
      if (road.id.startsWith('h')) {
        // Горизонтальные дороги
        this.lanes.push({
          roadId: road.id,
          direction: 'forward',
          start: { x: road.start.x, z: road.start.z - laneOffset },
          end: { x: road.end.x, z: road.end.z - laneOffset },
          curve: roadCurves[road.id] || null
        });
        this.lanes.push({
          roadId: road.id,
          direction: 'backward',
          start: { x: road.end.x, z: road.end.z + laneOffset },
          end: { x: road.start.x, z: road.start.z + laneOffset },
          curve: roadCurves[road.id + '_back'] || null
        });
      } else {
        // Вертикальные дороги
        this.lanes.push({
          roadId: road.id,
          direction: 'forward',
          start: { x: road.start.x - laneOffset, z: road.start.z },
          end: { x: road.end.x - laneOffset, z: road.end.z },
          curve: roadCurves[road.id] || null
        });
        this.lanes.push({
          roadId: road.id,
          direction: 'backward',
          start: { x: road.end.x + laneOffset, z: road.end.z },
          end: { x: road.start.x + laneOffset, z: road.start.z },
          curve: roadCurves[road.id + '_back'] || null
        });
      }
    });
  }

  generateIntersections() {
    // ✅ Используем предопределенные перекрестки из roadNetwork.js
    this.intersections = roadIntersections.map(int => ({
      id: int.id,
      position: { x: int.position.x, z: int.position.z },
      roads: int.roads,
      priority: int.priority,
      type: 'priority'
    }));
  }

  placeTrafficSigns() {
    // ✅ Размещаем дорожные знаки на перекрестках
    this.intersections.forEach(intersection => {
      const priorityRoad = this.roads.find(r => r.id === intersection.priority);
      const secondaryRoads = this.roads.filter(
        r => intersection.roads.includes(r.id) && r.id !== intersection.priority
      );

      secondaryRoads.forEach(road => {
        const approachDistance = 0.05;
        if (road.id.startsWith('v')) {
          // Вертикальные дороги
          this.signs.push({
            type: 'yield',
            position: {
              x: road.start.x,
              z: intersection.position.z - approachDistance
            },
            facingDirection: 'down'
          });
          this.signs.push({
            type: 'yield',
            position: {
              x: road.start.x,
              z: intersection.position.z + approachDistance
            },
            facingDirection: 'up'
          });
        }
      });

      if (priorityRoad && priorityRoad.id.startsWith('h')) {
        this.signs.push({
          type: 'priority',
          position: {
            x: intersection.position.x - 0.05,
            z: priorityRoad.start.z
          },
          facingDirection: 'right'
        });
      }
    });
  }

  getLaneForRoute(startPos, endPos) {
    let bestLane = null;
    let minDistance = Infinity;

    this.lanes.forEach(lane => {
      const distStart = this.distance2D(startPos, lane.start);
      const distEnd = this.distance2D(endPos, lane.end);
      const totalDist = distStart + distEnd;

      if (totalDist < minDistance) {
        minDistance = totalDist;
        bestLane = lane;
      }
    });
    return bestLane;
  }

  buildRoute(startPos, endPos) {
    const route = [];
    const visited = new Set();
    
    const startLane = this.findNearestLane(startPos);
    const endLane = this.findNearestLane(endPos);

    if (!startLane || !endLane) return route;

    route.push({ ...startLane.start, type: 'start' });
    const path = this.findPathThroughIntersections(startLane, endLane, visited);
    route.push(...path);
    route.push({ ...endLane.end, type: 'end' });

    return route;
  }

  findNearestLane(pos) {
    let nearest = null;
    let minDist = Infinity;
    this.lanes.forEach(lane => {
      const dist = Math.min(
        this.distance2D(pos, lane.start),
        this.distance2D(pos, lane.end)
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = lane;
      }
    });
    return nearest;
  }

  findPathThroughIntersections(startLane, endLane, visited) {
    const path = [];
    if (startLane.roadId === endLane.roadId) {
      path.push({ ...startLane.end, type: 'lane_end' });
    } else {
      const intersection = this.findConnectingIntersection(startLane, endLane);
      if (intersection) {
        path.push({
          x: intersection.position.x,
          z: intersection.position.z,
          type: 'intersection',
          intersectionId: intersection.id,
          priority: intersection.priority
        });
      }
    }
    return path;
  }

  findConnectingIntersection(lane1, lane2) {
    return this.intersections.find(int => 
      int.roads.includes(lane1.roadId) && int.roads.includes(lane2.roadId)
    );
  }

  distance2D(p1, p2) {
    const dx = p1.x - p2.x;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  shouldYieldAtIntersection(carPosition, carLane, intersection) {
    const priorityRoadId = intersection.priority;
    if (carLane.roadId !== priorityRoadId) {
      return true;
    }
    return false;
  }

  getIntersectionsOnRoute(route) {
    return route.filter(point => point.type === 'intersection');
  }
}

// === ЭКСПОРТ ===

export { RoadSystem };

// ✅ Функция создания визуализации дорог
export function createRoadNetwork(scene) {
    const roadSystem = new RoadSystem();

    // Материал для асфальта
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x444444,
        roughness: 0.8
    });

    console.log("🛣️  Generating road visuals for", roadSystem.roads.length, "roads");

    // Рисуем каждую дорогу
    roadSystem.roads.forEach(road => {
        const dx = road.end.x - road.start.x;
        const dz = road.end.z - road.start.z;
        const length = Math.sqrt(dx * dx + dz * dz);

        const geometry = new THREE.PlaneGeometry(length, road.width);
        const mesh = new THREE.Mesh(geometry, material);

        const centerX = (road.start.x + road.end.x) / 2;
        const centerZ = (road.start.z + road.end.z) / 2;

        mesh.position.set(centerX, 0.005, centerZ);

        const angle = Math.atan2(dz, dx);
        mesh.rotation.x = -Math.PI / 2;
        mesh.rotation.z = -angle;

        mesh.receiveShadow = true;
        road.mesh = mesh;

        scene.add(mesh);
    });

    // ✅ Возвращаем массив дорог с прикрепленной системой
    const roadsArray = roadSystem.roads;
    roadsArray.system = roadSystem;

    console.log("✅ Road network created:", roadsArray.length, "roads,", roadSystem.lanes.length, "lanes");

    return roadsArray;
}