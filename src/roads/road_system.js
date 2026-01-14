// ===================================
// ФАЙЛ: src/roads/road_system.js V24
// ИСПРАВЛЕНО:
// - Добавлена валидация каждого узла при создании
// - Защита от некорректных данных
// - Детальное логирование для отладки
// ===================================

import * as THREE from 'three';
import { RoadNetwork } from './roadNetwork.js';

export function createRoadNetwork(parent, options = {}) {
  console.log('🛣️ Начало создания дорожной сети...');
  
  try {
    const network = new RoadNetwork();

    // ✅ Включаем новую топологию 27 узлов/50+ дорог/100+ полос по умолчанию (можно выключить через options.useTopology27=false)
    const useTopology27 = options.useTopology27 !== false;
    if (useTopology27) {
      createTopology27(network);
      if (options.showRoads) { console.log('🛣️ Topology27 nodes:', network.nodes.length, 'roads:', network.roads.length, 'lanes:', network.lanes.length); }
      return network;
    }


    
    const showRoads = options.showRoads || false;
    const roadWidth = 0.08;
    
    // ВСЕ 228 ТОЧЕК - с валидацией
    const allNodes = [
      { x: -0.88, y: 1.11 }, { x: -0.98, y: 1.11 }, { x: -0.98, y: 1.05 }, { x: -0.98, y: 1.00 },
      { x: -0.91, y: 1.01 }, { x: -0.83, y: 1.01 }, { x: -0.78, y: 0.99 }, { x: -0.74, y: 0.98 },
      { x: -0.69, y: 0.95 }, { x: -0.65, y: 0.95 }, { x: -0.62, y: 0.93 }, { x: -0.60, y: 0.89 },
      { x: -0.57, y: 0.87 }, { x: -0.52, y: 0.85 }, { x: -0.45, y: 0.84 }, { x: -0.41, y: 0.82 },
      { x: -0.35, y: 0.80 }, { x: -0.31, y: 0.77 }, { x: -0.24, y: 0.76 }, { x: -0.26, y: 0.73 },
      { x: -0.28, y: 0.70 }, { x: -0.32, y: 0.67 }, { x: -0.37, y: 0.65 }, { x: -0.40, y: 0.62 },
      { x: -0.40, y: 0.58 }, { x: -0.32, y: 0.63 }, { x: -0.29, y: 0.65 }, { x: -0.25, y: 0.64 },
      { x: -0.21, y: 0.62 }, { x: -0.19, y: 0.57 }, { x: -0.15, y: 0.52 }, { x: -0.11, y: 0.47 },
      { x: -0.04, y: 0.38 }, { x: 0.02, y: 0.28 }, { x: 0.08, y: 0.21 }, { x: 0.07, y: 0.15 },
      { x: -0.04, y: 0.06 }, { x: -0.15, y: 0.01 }, { x: -0.21, y: -0.02 }, { x: -0.28, y: -0.01 },
      { x: -0.35, y: -0.03 }, { x: -0.27, y: -0.06 }, { x: -0.25, y: -0.10 }, { x: -0.22, y: -0.12 },
      { x: -0.13, y: -0.13 }, { x: -0.14, y: -0.23 }, { x: -0.11, y: -0.31 }, { x: -0.08, y: -0.36 },
      { x: -0.04, y: -0.41 }, { x: -0.00, y: -0.43 }, { x: 0.03, y: -0.47 }, { x: 0.06, y: -0.51 },
      { x: 0.11, y: -0.58 }, { x: 0.15, y: -0.67 }, { x: 0.11, y: -0.74 }, { x: -0.00, y: -0.79 },
      { x: -0.06, y: -0.84 }, { x: -0.10, y: -0.88 }, { x: -0.05, y: -0.89 }, { x: -0.00, y: -0.95 },
      { x: -0.02, y: -0.98 }, { x: -0.09, y: -1.03 }, { x: 0.05, y: -0.99 }, { x: 0.15, y: -0.99 },
      { x: 0.27, y: -1.00 }, { x: 0.35, y: -0.96 }, { x: 0.42, y: -0.92 }, { x: 0.47, y: -0.88 },
      { x: 0.56, y: -0.84 }, { x: 0.79, y: -0.84 }, { x: 0.89, y: -0.79 }, { x: 0.97, y: -0.74 },
      { x: 0.96, y: -0.68 }, { x: 0.88, y: -0.75 }, { x: 0.77, y: -0.78 }, { x: 0.68, y: -0.79 },
      { x: 0.56, y: -0.81 }, { x: 0.45, y: -0.83 }, { x: 0.38, y: -0.90 }, { x: 0.26, y: -0.94 },
      { x: 0.13, y: -0.95 }, { x: 0.01, y: -0.92 }, { x: -0.03, y: -0.86 }, { x: 0.06, y: -0.82 },
      { x: 0.32, y: -0.87 }, { x: 0.12, y: -0.79 }, { x: 0.18, y: -0.74 }, { x: 0.24, y: -0.68 },
      { x: 0.22, y: -0.60 }, { x: 0.14, y: -0.51 }, { x: 0.08, y: -0.43 }, { x: 0.06, y: -0.37 },
      { x: 0.21, y: -0.37 }, { x: 0.45, y: -0.35 }, { x: 0.57, y: -0.35 }, { x: 0.74, y: -0.33 },
      { x: 0.88, y: -0.36 }, { x: 0.96, y: -0.41 }, { x: 0.97, y: -0.36 }, { x: 0.87, y: -0.31 },
      { x: 0.69, y: -0.29 }, { x: 0.50, y: -0.31 }, { x: 0.31, y: -0.32 }, { x: 0.14, y: -0.32 },
      { x: 0.00, y: -0.33 }, { x: -0.03, y: -0.29 }, { x: -0.09, y: -0.20 }, { x: -0.10, y: -0.11 },
      { x: 0.02, y: -0.12 }, { x: 0.24, y: -0.13 }, { x: 0.31, y: -0.10 }, { x: 0.38, y: -0.05 },
      { x: 0.45, y: 0.00 }, { x: 0.71, y: -0.14 }, { x: 0.81, y: -0.13 }, { x: 0.90, y: -0.19 },
      { x: 0.98, y: -0.18 }, { x: 0.95, y: -0.08 }, { x: 0.90, y: -0.08 }, { x: 0.71, y: -0.14 },
      { x: 0.45, y: 0.01 }, { x: 0.56, y: 0.05 }, { x: 0.72, y: 0.04 }, { x: 0.87, y: 0.08 },
      { x: 0.93, y: 0.13 }, { x: 0.98, y: 0.20 }, { x: 0.98, y: 0.36 }, { x: 0.98, y: 0.45 },
      { x: 0.88, y: 0.52 }, { x: 0.71, y: 0.56 }, { x: 0.56, y: 0.56 }, { x: 0.34, y: 0.53 },
      { x: 0.14, y: 0.52 }, { x: -0.01, y: 0.52 }, { x: -0.02, y: 0.48 }, { x: 0.13, y: 0.50 },
      { x: 0.29, y: 0.50 }, { x: 0.50, y: 0.52 }, { x: 0.71, y: 0.53 }, { x: 0.80, y: 0.49 },
      { x: 0.88, y: 0.44 }, { x: 0.95, y: 0.35 }, { x: 0.96, y: 0.29 }, { x: 0.90, y: 0.17 },
      { x: 0.80, y: 0.11 }, { x: 0.67, y: 0.08 }, { x: 0.51, y: 0.08 }, { x: 0.45, y: 0.06 },
      { x: 0.38, y: 0.02 }, { x: 0.33, y: -0.03 }, { x: 0.27, y: -0.06 }, { x: 0.11, y: -0.07 },
      { x: -0.00, y: -0.09 }, { x: -0.06, y: -0.06 }, { x: -0.09, y: -0.01 }, { x: -0.01, y: 0.03 },
      { x: 0.02, y: 0.06 }, { x: 0.30, y: 0.00 }, { x: 0.03, y: 0.02 }, { x: 0.05, y: 0.08 },
      { x: 0.13, y: 0.14 }, { x: 0.14, y: 0.18 }, { x: 0.34, y: 0.21 }, { x: 0.18, y: 0.21 },
      { x: 0.11, y: 0.27 }, { x: 0.06, y: 0.35 }, { x: 0.04, y: 0.41 }, { x: -0.02, y: 0.46 },
      { x: -0.08, y: 0.53 }, { x: -0.13, y: 0.62 }, { x: -0.16, y: 0.67 }, { x: -0.19, y: 0.73 },
      { x: -0.10, y: 0.76 }, { x: 0.10, y: 0.75 }, { x: 0.26, y: 0.75 }, { x: 0.29, y: 0.80 },
      { x: 0.38, y: 0.86 }, { x: 0.66, y: 0.68 }, { x: 0.72, y: 0.72 }, { x: 0.86, y: 0.72 },
      { x: 0.99, y: 0.70 }, { x: 0.87, y: 0.78 }, { x: 0.55, y: 0.74 }, { x: 0.50, y: 0.80 },
      { x: 0.44, y: 0.87 }, { x: 0.52, y: 0.89 }, { x: 0.70, y: 0.90 }, { x: 0.81, y: 0.93 },
      { x: 0.89, y: 0.97 }, { x: 0.95, y: 1.04 }, { x: 0.97, y: 1.17 }, { x: 0.90, y: 1.18 },
      { x: 0.89, y: 1.09 }, { x: 0.83, y: 1.00 }, { x: 0.76, y: 0.97 }, { x: 0.59, y: 0.93 },
      { x: 0.38, y: 0.93 }, { x: 0.32, y: 0.88 }, { x: 0.26, y: 0.84 }, { x: 0.21, y: 0.80 },
      { x: 0.07, y: 0.77 }, { x: -0.11, y: 0.78 }, { x: -0.16, y: 0.84 }, { x: -0.11, y: 0.89 },
      { x: 0.01, y: 0.90 }, { x: 0.28, y: 0.87 }, { x: -0.10, y: 0.92 }, { x: 0.05, y: 0.97 },
      { x: 0.11, y: 1.05 }, { x: 0.30, y: 1.09 }, { x: 0.11, y: 1.09 }, { x: 0.06, y: 1.17 },
      { x: -0.03, y: 1.18 }, { x: 0.01, y: 1.10 }, { x: -0.01, y: 1.00 }, { x: -0.16, y: 0.94 },
      { x: -0.18, y: 0.89 }, { x: -0.21, y: 0.86 }, { x: -0.32, y: 0.86 }, { x: -0.45, y: 0.89 },
      { x: -0.52, y: 0.94 }, { x: -0.56, y: 0.99 }, { x: -0.63, y: 1.02 }, { x: -0.66, y: 1.04 },
      { x: -0.72, y: 1.05 }, { x: -0.76, y: 1.05 }, { x: -0.89, y: 1.07 }, { x: -0.90, y: 1.11 }
    ];
    
    console.log(`📍 Добавление ${allNodes.length} узлов...`);
    
    // ✅ Валидация и добавление узлов
    let validNodes = 0;
    let invalidNodes = 0;
    
    for (let i = 0; i < allNodes.length; i++) {
      const node = allNodes[i];
      
      // Проверка валидности координат
      if (typeof node.x !== 'number' || typeof node.y !== 'number' ||
          isNaN(node.x) || isNaN(node.y) ||
          !isFinite(node.x) || !isFinite(node.y)) {
        console.error(`❌ Невалидный узел #${i}:`, node);
        invalidNodes++;
        continue;
      }
      
      const addedNode = network.addNode(node.x, node.y);
      if (addedNode) {
        validNodes++;
      }
    }
    
    console.log(`✅ Добавлено ${validNodes} валидных узлов`);
    if (invalidNodes > 0) {
      console.warn(`⚠️ Пропущено ${invalidNodes} невалидных узлов`);
    }
    
    if (network.nodes.length < 2) {
      throw new Error('Недостаточно узлов для создания дорожной сети');
    }
    
    // ✅ Создание дорог с валидацией
    console.log('🛣️ Создание дорог...');
    let validRoads = 0;
    let invalidRoads = 0;
    
    // ОСНОВНОЙ ПУТЬ
    for (let i = 0; i < network.nodes.length - 1; i++) {
      const s = network.nodes[i];
      const e = network.nodes[i + 1];
      
      if (s && e) {
        const road = network.addRoad(s, e);
        if (road) {
          validRoads++;
        } else {
          invalidRoads++;
        }
      } else {
        invalidRoads++;
      }
    }
    
    // Замыкаем петлю
    if (network.nodes.length > 0) {
      const road = network.addRoad(
        network.nodes[network.nodes.length - 1],
        network.nodes[0]
      );
      if (road) validRoads++;
    }
    
    // СИНИЕ СОЕДИНЕНИЯ
    const blueConnections = [
      [19, 28], [24, 29], [28, 32],
      [36, 44], [40, 108], [44, 45],
      [32, 166], [33, 167], [34, 168], [35, 157],
      [54, 86], [57, 84], [59, 62],
      [73, 94], [94, 113], [113, 124], [124, 128], [128, 133],
      [90, 93], [93, 113], [108, 157], [157, 166],
      [176, 180], [180, 184], [184, 190],
      [82, 85], [85, 90], [166, 177], [177, 186]
    ];
    
    for (const [idx1, idx2] of blueConnections) {
      const s = network.nodes[idx1];
      const e = network.nodes[idx2];
      
      if (s && e) {
        const road = network.addRoad(s, e);
        if (road) {
          validRoads++;
        } else {
          invalidRoads++;
        }
      } else {
        invalidRoads++;
      }
    }
    
    console.log(`✅ Создано ${validRoads} валидных дорог`);
    if (invalidRoads > 0) {
      console.warn(`⚠️ Пропущено ${invalidRoads} невалидных дорог`);
    }
    
    const stats = network.getStats();
    console.log(`📊 Итоговая сеть:`, stats);
    
    if (stats.roads < 10) {
      throw new Error('Слишком мало дорог в сети');
    }
    
    // ============================================
    // ВИЗУАЛИЗАЦИЯ
    // ============================================
    
    if (showRoads && parent) {
      console.log('🎨 Создание визуализации дорог...');
      
      try {
        const roadMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x333333, 
          roughness: 0.9 
        });
        
        const lineMaterial = new THREE.LineDashedMaterial({
          color: 0xffffff, 
          linewidth: 2, 
          dashSize: 0.03, 
          gapSize: 0.02
        });
        
        for (const road of network.roads) {
          if (!road || !road.start || !road.end) continue;
          
          const len = Math.hypot(
            road.end.x - road.start.x, 
            road.end.y - road.start.y
          );
          
          if (len < 0.001) continue; // Пропускаем нулевые сегменты
          
          const geom = new THREE.PlaneGeometry(len, roadWidth);
          const mesh = new THREE.Mesh(geom, roadMaterial);
          
          mesh.position.set(
            (road.start.x + road.end.x) / 2, 
            0.001, 
            (road.start.y + road.end.y) / 2
          );
          
          const angle = Math.atan2(
            road.end.y - road.start.y, 
            road.end.x - road.start.x
          );
          
          mesh.rotation.x = -Math.PI / 2;
          mesh.rotation.z = angle;
          parent.add(mesh);
          
          // Центральная линия
          const pts = [
            new THREE.Vector3(road.start.x, 0.002, road.start.y),
            new THREE.Vector3(road.end.x, 0.002, road.end.y)
          ];
          
          const lineGeom = new THREE.BufferGeometry().setFromPoints(pts);
          const line = new THREE.Line(lineGeom, lineMaterial);
          line.computeLineDistances();
          parent.add(line);
        }
        
        // Развязки
        const roundabouts = [
          { x: -0.32, y: 0.67, r: 0.08 },
          { x: -0.21, y: -0.06, r: 0.08 },
          { x: -0.04, y: -0.88, r: 0.08 }
        ];
        
        for (const rb of roundabouts) {
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(rb.r - roadWidth/2, rb.r + roadWidth/2, 32),
            roadMaterial
          );
          ring.rotation.x = -Math.PI / 2;
          ring.position.set(rb.x, 0.001, rb.y);
          parent.add(ring);
          
          const inner = new THREE.Mesh(
            new THREE.CircleGeometry(rb.r - roadWidth/2, 32),
            new THREE.MeshStandardMaterial({ color: 0x4a7c4e })
          );
          inner.rotation.x = -Math.PI / 2;
          inner.position.set(rb.x, 0.001, rb.y);
          parent.add(inner);
          
          const dot = new THREE.Mesh(
            new THREE.CircleGeometry(0.04, 32),
            new THREE.MeshStandardMaterial({ color: 0xffff00 })
          );
          dot.rotation.x = -Math.PI / 2;
          dot.position.set(rb.x, 0.002, rb.y);
          parent.add(dot);
        }
        
        console.log('✅ Визуализация создана');
      } catch (err) {
        console.warn('⚠️ Ошибка создания визуализации:', err);
        // Продолжаем без визуализации
      }
    }
    
    console.log('✅ Дорожная сеть создана успешно');
    return network;
    
  } catch (err) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА создания дорожной сети:', err);
    console.error('Stack trace:', err.stack);
    throw err;
  }
}

// ===================== Topology 27 =====================
function createTopology27(network) {
  // 27 узлов: 3 ряда × 9 колонок, координаты в диапазоне [-0.9..0.9] × [-0.8, 0.0, 0.8]
  const xs = [-0.9,-0.7,-0.5,-0.3,-0.1,0.1,0.3,0.5,0.7];
  const ys = [-0.8, 0.0, 0.8];
  const grid = [];
  for (let r=0; r<ys.length; r++) {
    const row=[]; grid.push(row);
    for (let c=0; c<xs.length; c++) {
      row.push(network.addNode(xs[c], ys[r]));
    }
  }

  // Горизонтальные дороги (по рядам)
  for (let r=0; r<ys.length; r++) {
    for (let c=0; c<xs.length-1; c++) {
      network.addRoad(grid[r][c], grid[r][c+1]);
    }
  }
  // Вертикальные дороги (между рядами)
  for (let c=0; c<xs.length; c++) {
    network.addRoad(grid[0][c], grid[1][c]);
    network.addRoad(grid[1][c], grid[2][c]);
  }
  // Диагонали для увеличения связности и имитации плавных съездов/круговых
  for (let c=0; c<xs.length-1; c+=2) {
    network.addRoad(grid[0][c], grid[1][c+1]);
    network.addRoad(grid[1][c], grid[2][c+1]);
  }
  for (let c=1; c<xs.length-1; c+=2) {
    network.addRoad(grid[0][c+1], grid[1][c]);
    network.addRoad(grid[1][c+1], grid[2][c]);
  }
  // Угловые циклы (условные круговые развязки) — треугольные циклы в углах
  const corners = [ [0,0], [0,8], [2,0], [2,8] ];
  for (const [r,c] of corners) {
    const a = grid[r][c];
    const b = grid[r][Math.max(0, Math.min(8, c + (c===0?1:-1)))];
    const d = grid[Math.max(0, Math.min(2, r + (r===0?1:-1)))][c];
    network.addRoad(a,b);
    network.addRoad(b,d);
    network.addRoad(d,a);
  }
}
