// ===================================
// ФАЙЛ: src/roads/roadNetwork.js V3
// ДОБАВЛЕНО:
// - Двустороннее движение (две полосы)
// - Правостороннее движение
// - Раздельные полосы для каждого направления
// ===================================

export class RoadNetwork {
  constructor() {
    this.nodes = [];
    this.roads = [];
    this.lanes = []; // Новое: полосы движения
  }

  addNode(x, y) {
    const existing = this.nodes.find(n => 
      Math.abs(n.x - x) < 0.01 && Math.abs(n.y - y) < 0.01
    );
    
    if (existing) return existing;
    
    const node = { x, y, connections: [] };
    this.nodes.push(node);
    return node;
  }

  addRoad(startNode, endNode) {
    const start = this.nodes.find(n => 
      Math.abs(n.x - startNode.x) < 0.01 && Math.abs(n.y - startNode.y) < 0.01
    );
    const end = this.nodes.find(n => 
      Math.abs(n.x - endNode.x) < 0.01 && Math.abs(n.y - endNode.y) < 0.01
    );
    
    if (!start || !end) {
      console.error('Узлы не найдены для дороги', startNode, endNode);
      return;
    }
    
    const existing = this.roads.find(r => 
      (r.start === start && r.end === end) || 
      (r.start === end && r.end === start)
    );
    
    if (existing) return existing;
    
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    const road = { start, end, length };
    
    this.roads.push(road);
    
    // ✅ ДВУСТОРОННЕЕ ДВИЖЕНИЕ: создаем ДВЕ полосы
    // Ширина дороги = 0.08, смещение полосы = 0.02 (1/4 ширины)
    const laneOffset = 0.02;
    
    // Вычисляем перпендикулярный вектор для смещения
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const perpAngle = angle + Math.PI / 2;
    const offsetX = Math.cos(perpAngle) * laneOffset;
    const offsetY = Math.sin(perpAngle) * laneOffset;
    
    // ПОЛОСА 1: от start к end (правая сторона)
    const lane1 = {
      start: start,
      end: end,
      direction: { x: end.x - start.x, y: end.y - start.y },
      offset: { x: offsetX, y: offsetY }, // Смещение вправо по ходу движения
      length: length
    };
    
    // ПОЛОСА 2: от end к start (правая сторона в обратном направлении)
    const lane2 = {
      start: end,
      end: start,
      direction: { x: start.x - end.x, y: start.y - end.y },
      offset: { x: -offsetX, y: -offsetY }, // Смещение вправо по ходу движения
      length: length
    };
    
    this.lanes.push(lane1, lane2);
    
    // Добавляем связи (двунаправленные)
    if (!start.connections.includes(end)) {
      start.connections.push(end);
    }
    if (!end.connections.includes(start)) {
      end.connections.push(start);
    }
    
    return road;
  }

  getRandomNode() {
    return this.nodes[Math.floor(Math.random() * this.nodes.length)];
  }

  findPath(start, end, maxDepth = 20) {
    // A* поиск пути
    const openSet = [{ node: start, path: [start], cost: 0 }];
    const closedSet = new Set();
    
    while (openSet.length > 0 && openSet[0].path.length < maxDepth) {
      openSet.sort((a, b) => {
        const aCost = a.cost + this.heuristic(a.node, end);
        const bCost = b.cost + this.heuristic(b.node, end);
        return aCost - bCost;
      });
      
      const current = openSet.shift();
      
      if (current.node === end) {
        return current.path;
      }
      
      closedSet.add(current.node);
      
      for (const neighbor of current.node.connections) {
        if (closedSet.has(neighbor)) continue;
        
        const newCost = current.cost + Math.hypot(
          neighbor.x - current.node.x,
          neighbor.y - current.node.y
        );
        
        const existing = openSet.find(item => item.node === neighbor);
        
        if (!existing) {
          openSet.push({
            node: neighbor,
            path: [...current.path, neighbor],
            cost: newCost
          });
        } else if (newCost < existing.cost) {
          existing.cost = newCost;
          existing.path = [...current.path, neighbor];
        }
      }
    }
    
    console.warn('Путь не найден, используем ближайший узел');
    return [start, this.getClosestNode(end.x, end.y)];
  }

  heuristic(node, goal) {
    return Math.hypot(goal.x - node.x, goal.y - node.y);
  }

  getClosestNode(x, y) {
    let closest = this.nodes[0];
    let minDist = Infinity;
    
    for (const node of this.nodes) {
      const dist = Math.hypot(node.x - x, node.y - y);
      if (dist < minDist) {
        minDist = dist;
        closest = node;
      }
    }
    
    return closest;
  }

  // ✅ НОВЫЙ МЕТОД: получить полосу движения между узлами
  getLane(fromNode, toNode) {
    return this.lanes.find(lane => 
      lane.start === fromNode && lane.end === toNode
    );
  }

  getRoadBetween(node1, node2) {
    return this.roads.find(r => 
      (r.start === node1 && r.end === node2) || 
      (r.start === node2 && r.end === node1)
    );
  }

  getStats() {
    return {
      nodes: this.nodes.length,
      roads: this.roads.length,
      lanes: this.lanes.length,
      avgConnections: this.nodes.reduce((sum, n) => sum + n.connections.length, 0) / this.nodes.length
    };
  }
}