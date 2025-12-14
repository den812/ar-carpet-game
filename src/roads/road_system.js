// Система дорог с разметкой для конкретного ковра
export class RoadSystem {
  constructor() {
    this.roads = [];
    this.intersections = [];
    this.signs = [];
    this.lanes = [];
    
    this.initializeRoadNetwork();
  }

  initializeRoadNetwork() {
    // Разметка дорог вашего ковра (координаты в нормализованных единицах 0-1)
    // Дороги с двумя полосами (туда и обратно)
    
    // Главная горизонтальная дорога (верхняя)
    this.roads.push({
      id: 'h1',
      type: 'main',
      start: { x: 0.1, z: 0.2 },
      end: { x: 0.9, z: 0.2 },
      width: 0.08,
      priority: 1 // Главная дорога
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
      priority: 0 // Второстепенная
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
    // Генерация полос для каждой дороги (туда и обратно)
    this.roads.forEach(road => {
      const laneOffset = road.width / 4; // Смещение полосы от центра
      
      if (road.id.startsWith('h')) {
        // Горизонтальная дорога
        // Полоса слева направо (верхняя полоса)
        this.lanes.push({
          roadId: road.id,
          direction: 'forward',
          start: { x: road.start.x, z: road.start.z - laneOffset },
          end: { x: road.end.x, z: road.end.z - laneOffset }
        });
        // Полоса справа налево (нижняя полоса)
        this.lanes.push({
          roadId: road.id,
          direction: 'backward',
          start: { x: road.end.x, z: road.end.z + laneOffset },
          end: { x: road.start.x, z: road.start.z + laneOffset }
        });
      } else {
        // Вертикальная дорога
        // Полоса сверху вниз (левая полоса)
        this.lanes.push({
          roadId: road.id,
          direction: 'forward',
          start: { x: road.start.x - laneOffset, z: road.start.z },
          end: { x: road.end.x - laneOffset, z: road.end.z }
        });
        // Полоса снизу вверх (правая полоса)
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
    // Определение перекрестков (где дороги пересекаются)
    const horizontalRoads = this.roads.filter(r => r.id.startsWith('h'));
    const verticalRoads = this.roads.filter(r => r.id.startsWith('v'));

    horizontalRoads.forEach(hRoad => {
      verticalRoads.forEach(vRoad => {
        // Проверка пересечения
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
    // Размещение дорожных знаков перед перекрестками
    this.intersections.forEach(intersection => {
      const priorityRoad = this.roads.find(r => r.id === intersection.priority);
      const secondaryRoads = this.roads.filter(
        r => intersection.roads.includes(r.id) && r.id !== intersection.priority
      );

      secondaryRoads.forEach(road => {
        // Знак "Уступи дорогу" на второстепенной дороге
        const approachDistance = 0.05; // Расстояние до перекрестка
        
        if (road.id.startsWith('v')) {
          // Вертикальная дорога - знаки сверху и снизу
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

      // Знак "Главная дорога" на приоритетной дороге
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

  // Получить полосу для движения
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

  // Построить маршрут по полосам
  buildRoute(startPos, endPos) {
    const route = [];
    const visited = new Set();
    
    // Простой алгоритм поиска пути через перекрестки
    const startLane = this.findNearestLane(startPos);
    const endLane = this.findNearestLane(endPos);

    if (!startLane || !endLane) return route;

    // Добавляем точки маршрута
    route.push({ ...startLane.start, type: 'start' });
    
    // Находим путь через перекрестки
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
    
    // Упрощенная логика: движемся по текущей полосе до пересечения
    if (startLane.roadId === endLane.roadId) {
      // Та же дорога - прямо по полосе
      path.push({ ...startLane.end, type: 'lane_end' });
    } else {
      // Разные дороги - через перекресток
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

  // Проверить, нужно ли уступить дорогу на перекрестке
  shouldYieldAtIntersection(carPosition, carLane, intersection) {
    const priorityRoadId = intersection.priority;
    
    // Если машина на второстепенной дороге
    if (carLane.roadId !== priorityRoadId) {
      return true;
    }
    
    return false;
  }

  // Получить все перекрестки на маршруте
  getIntersectionsOnRoute(route) {
    return route.filter(point => point.type === 'intersection');
  }
}