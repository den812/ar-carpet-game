// ===================================
// ФАЙЛ: src/roads/roadNetwork.js V24
// ИСПРАВЛЕНО:
// - Добавлена проверка на Infinity в addNode()
// - Улучшена валидация координат
// ===================================

export class RoadNetwork {
  constructor() {
    this.nodes = [];
    this.roads = [];
    this.lanes = [];
  }

  addNode(x, y) {
    // ✅ Проверка валидности координат (включая Infinity)
    if (typeof x !== 'number' || typeof y !== 'number' || 
        isNaN(x) || isNaN(y) || 
        !isFinite(x) || !isFinite(y)) {
      console.error('❌ Invalid node coordinates:', x, y);
      return null;
    }
    
    const existing = this.nodes.find(n => 
      Math.abs(n.x - x) < 0.01 && Math.abs(n.y - y) < 0.01
    );
    
    if (existing) return existing;
    
    const node = { x, y, connections: [] };
    this.nodes.push(node);
    return node;
  }

  addRoad(startNode, endNode) {
    // ✅ Проверка валидности узлов
    if (!startNode || !endNode) {
      console.error('❌ Invalid road nodes');
      return null;
    }
    
    const start = this.nodes.find(n => 
      Math.abs(n.x - startNode.x) < 0.01 && Math.abs(n.y - startNode.y) < 0.01
    );
    const end = this.nodes.find(n => 
      Math.abs(n.x - endNode.x) < 0.01 && Math.abs(n.y - endNode.y) < 0.01
    );
    
    if (!start || !end) {
      console.error('❌ Узлы не найдены для дороги', startNode, endNode);
      return null;
    }
    
    const existing = this.roads.find(r => 
      (r.start === start && r.end === end) || 
      (r.start === end && r.end === start)
    );
    
    if (existing) return existing;
    
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    const road = { start, end, length };
    
    this.roads.push(road);
    
    const laneOffset = 0.02;
    
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const perpAngle = angle + Math.PI / 2;
    const offsetX = Math.cos(perpAngle) * laneOffset;
    const offsetY = Math.sin(perpAngle) * laneOffset;
    
    const lane1 = {
      start: start,
      end: end,
      direction: { x: end.x - start.x, y: end.y - start.y },
      offset: { x: offsetX, y: offsetY },
      length: length
    };
    
    const lane2 = {
      start: end,
      end: start,
      direction: { x: start.x - end.x, y: start.y - end.y },
      offset: { x: -offsetX, y: -offsetY },
      length: length
    };
    
    this.lanes.push(lane1, lane2);
    
    if (!start.connections.includes(end)) {
      start.connections.push(end);
    }
    if (!end.connections.includes(start)) {
      end.connections.push(start);
    }
    
    return road;
  }

  getRandomNode() {
    if (this.nodes.length === 0) {
      console.error('❌ No nodes in network');
      return null;
    }
    return this.nodes[Math.floor(Math.random() * this.nodes.length)];
  }

  findPath(start, end, maxDepth = 20) {
    // ✅ Валидация входных данных
    if (!start || !end) {
      console.error('❌ Invalid start or end node');
      return [];
    }
    
    if (typeof start.x !== 'number' || typeof start.y !== 'number' ||
        typeof end.x !== 'number' || typeof end.y !== 'number' ||
        !isFinite(start.x) || !isFinite(start.y) ||
        !isFinite(end.x) || !isFinite(end.y)) {
      console.error('❌ Invalid node coordinates in findPath');
      return [];
    }
    
    // Если старт = конец, выбираем другой конец
    if (start === end) {
      const alternatives = this.nodes.filter(n => n !== start);
      if (alternatives.length === 0) {
        console.error('❌ Only one node in network');
        return [];
      }
      end = alternatives[Math.floor(Math.random() * alternatives.length)];
    }
    
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
        // ✅ Валидация найденного пути
        if (current.path.length >= 2 && this.validatePath(current.path)) {
          return current.path;
        }
      }
      
      closedSet.add(current.node);
      
      for (const neighbor of current.node.connections) {
        if (closedSet.has(neighbor)) continue;
        
        // ✅ Проверка валидности соседа
        if (!neighbor || typeof neighbor.x !== 'number' || typeof neighbor.y !== 'number' ||
            !isFinite(neighbor.x) || !isFinite(neighbor.y)) {
          console.warn('⚠️ Invalid neighbor node, skipping');
          continue;
        }
        
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
    
    // Путь не найден - создаем простой путь
    console.warn('⚠️ Путь не найден A*, создаем простой маршрут');
    
    if (start.connections.length > 0) {
      const validNeighbors = start.connections.filter(n => 
        n && typeof n.x === 'number' && typeof n.y === 'number' &&
        isFinite(n.x) && isFinite(n.y)
      );
      
      if (validNeighbors.length > 0) {
        const neighbor = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
        return [start, neighbor];
      }
    }
    
    // Последняя попытка
    const validNodes = this.nodes.filter(n => 
      n !== start && n && typeof n.x === 'number' && typeof n.y === 'number' &&
      isFinite(n.x) && isFinite(n.y)
    );
    
    if (validNodes.length > 0) {
      return [start, validNodes[0]];
    }
    
    console.error('❌ Невозможно создать путь');
    return [];
  }

  // ✅ Улучшенная валидация пути
  validatePath(path) {
    if (!path || path.length < 2) return false;
    
    for (const node of path) {
      if (!node || 
          typeof node.x !== 'number' || 
          typeof node.y !== 'number' ||
          !isFinite(node.x) ||
          !isFinite(node.y)) {
        return false;
      }
    }
    
    return true;
  }

  heuristic(node, goal) {
    return Math.hypot(goal.x - node.x, goal.y - node.y);
  }

  getClosestNode(x, y) {
    if (this.nodes.length === 0) return null;
    
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

  getLane(fromNode, toNode) {
    if (!fromNode || !toNode) return null;
    
    const lane = this.lanes.find(lane => 
      lane.start === fromNode && lane.end === toNode
    );
    
    return lane || null;
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
      avgConnections: this.nodes.length > 0 
        ? (this.nodes.reduce((sum, n) => sum + n.connections.length, 0) / this.nodes.length).toFixed(2)
        : 0
    };
  }
}
