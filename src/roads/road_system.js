import * as THREE from 'three';

// === ВАШ КЛАСС ЛОГИКИ (БЕЗ ИЗМЕНЕНИЙ, ТОЛЬКО export убран, чтобы экспортировать внизу) ===
class RoadSystem {
  constructor() {
    this.roads = [];
    this.intersections = [];
    this.signs = [];
    this.lanes = [];
    
    this.initializeRoadNetwork();
  }

  initializeRoadNetwork() {
    // Разметка дорог (0-1)
    
    // Главная горизонтальная дорога (верхняя)
    this.roads.push({
      id: 'h1',
      type: 'main',
      start: { x: 0.1, z: 0.2 },
      end: { x: 0.9, z: 0.2 },
      width: 0.08,
      priority: 1
    });

    // Главная горизонтальная дорога (нижняя)
    this.roads.push({
      id: 'h2',
      type: 'main',
      start: { x: 0.1, z: 0.8 },
      end: { x: 0.9, z: 0.8 },
      width: 0.08,
      priority: 1
    });

    // Вертикальная дорога (левая)
    this.roads.push({
      id: 'v1',
      type: 'secondary',
      start: { x: 0.25, z: 0.1 },
      end: { x: 0.25, z: 0.9 },
      width: 0.08,
      priority: 0
    });

    // Вертикальная дорога (центральная)
    this.roads.push({
      id: 'v2',
      type: 'secondary',
      start: { x: 0.5, z: 0.1 },
      end: { x: 0.5, z: 0.9 },
      width: 0.08,
      priority: 0
    });

    // Вертикальная дорога (правая)
    this.roads.push({
      id: 'v3',
      type: 'secondary',
      start: { x: 0.75, z: 0.1 },
      end: { x: 0.75, z: 0.9 },
      width: 0.08,
      priority: 0
    });

    this.generateLanes();
    this.generateIntersections();
    this.placeTrafficSigns();
  }

  generateLanes() {
    this.roads.forEach(road => {
      const laneOffset = road.width / 4; 
      
      if (road.id.startsWith('h')) {
        this.lanes.push({
          roadId: road.id,
          direction: 'forward',
          start: { x: road.start.x, z: road.start.z - laneOffset },
          end: { x: road.end.x, z: road.end.z - laneOffset }
        });
        this.lanes.push({
          roadId: road.id,
          direction: 'backward',
          start: { x: road.end.x, z: road.end.z + laneOffset },
          end: { x: road.start.x, z: road.start.z + laneOffset }
        });
      } else {
        this.lanes.push({
          roadId: road.id,
          direction: 'forward',
          start: { x: road.start.x - laneOffset, z: road.start.z },
          end: { x: road.end.x - laneOffset, z: road.end.z }
        });
        this.lanes.push({
          roadId: road.id,
          direction: 'backward',
          start: { x: road.end.x + laneOffset, z: road.end.z },
          end: { x: road.start.x + laneOffset, z: road.start.z }
        });
      }
    });
  }

  generateIntersections() {
    const horizontalRoads = this.roads.filter(r => r.id.startsWith('h'));
    const verticalRoads = this.roads.filter(r => r.id.startsWith('v'));

    horizontalRoads.forEach(hRoad => {
      verticalRoads.forEach(vRoad => {
        const intersectionX = vRoad.start.x;
        const intersectionZ = hRoad.start.z;

        if (
          intersectionX >= hRoad.start.x && intersectionX <= hRoad.end.x &&
          intersectionZ >= vRoad.start.z && intersectionZ <= vRoad.end.z
        ) {
          this.intersections.push({
            id: `int_${hRoad.id}_${vRoad.id}`,
            position: { x: intersectionX, z: intersectionZ },
            roads: [hRoad.id, vRoad.id],
            priority: hRoad.priority > vRoad.priority ? hRoad.id : vRoad.id,
            type: hRoad.priority === vRoad.priority ? 'equal' : 'priority'
          });
        }
      });
    });
  }

  placeTrafficSigns() {
    this.intersections.forEach(intersection => {
      const priorityRoad = this.roads.find(r => r.id === intersection.priority);
      const secondaryRoads = this.roads.filter(
        r => intersection.roads.includes(r.id) && r.id !== intersection.priority
      );

      secondaryRoads.forEach(road => {
        const approachDistance = 0.05;
        if (road.id.startsWith('v')) {
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

      if (priorityRoad) {
        if (priorityRoad.id.startsWith('h')) {
          this.signs.push({
            type: 'priority',
            position: {
              x: intersection.position.x - 0.05,
              z: priorityRoad.start.z
            },
            facingDirection: 'right'
          });
        }
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

// === ЭКСПОРТ (ИСПРАВЛЕНИЕ ОШИБКИ) ===

// 1. Экспортируем сам класс, если он понадобится в других файлах
export { RoadSystem };

// 2. Экспортируем функцию createRoadNetwork, которую вызывает ar.js
export function createRoadNetwork(scene) {
    // Создаем логику дорог
    const roadSystem = new RoadSystem();

    // Материал для асфальта
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x444444,
        roughness: 0.8
    });

    console.log("Generating road visuals for", roadSystem.roads.length, "roads");

    // Проходим по каждой дороге из логики и рисуем её
    roadSystem.roads.forEach(road => {
        // Вычисляем длину дороги
        const dx = road.end.x - road.start.x;
        const dz = road.end.z - road.start.z;
        const length = Math.sqrt(dx * dx + dz * dz);

        // Создаем геометрию (Плоскость)
        const geometry = new THREE.PlaneGeometry(length, road.width);
        const mesh = new THREE.Mesh(geometry, material);

        // Позиционирование
        // Важно: координаты RoadSystem идут от 0 до 1.
        // MindAR/ThreeJS сцена обычно центрирована в 0,0.
        // Поэтому смещаем на -0.5
        const centerX = (road.start.x + road.end.x) / 2 - 0.5;
        const centerZ = (road.start.z + road.end.z) / 2 - 0.5;

        mesh.position.set(centerX, 0.005, centerZ); // Чуть выше 0, чтобы не мерцало с ковром

        // Поворот
        const angle = Math.atan2(dz, dx);
        mesh.rotation.x = -Math.PI / 2; // Лежит плашмя
        mesh.rotation.z = -angle;       // Поворот по направлению дороги

        mesh.receiveShadow = true;

        // Сохраняем ссылку на меш в логическом объекте (на всякий случай)
        road.mesh = mesh;

        // Добавляем на сцену
        scene.add(mesh);
    });

    // Возвращаем объект системы, но добавляем ему свойство 'length' или итератор,
    // если TrafficManager написан под массив. 
    // Лучше всего вернуть массив дорог (roadSystem.roads), так как TrafficManager,
    // который мы писали ранее, ожидает массив.
    // НО, чтобы сохранить вашу крутую логику перекрестков, лучше вернуть сам объект,
    // а TrafficManager обновить.
    
    // ДЛЯ СОВМЕСТИМОСТИ С ПРЕДЫДУЩИМ ШАГОМ:
    // Мы вернем массив дорог, но "прицепим" к нему ссылку на систему.
    const roadsArray = roadSystem.roads;
    roadsArray.system = roadSystem; // хак, чтобы иметь доступ к логике

    return roadsArray;
}