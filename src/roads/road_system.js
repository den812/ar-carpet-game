// ===================================
// ФАЙЛ: src/roads/road_system.js
// СТРУКТУРА ПО РЕАЛЬНОМУ КОВРУ
// Органическая форма с круговыми развязками
// ===================================

import * as THREE from 'three';
import { RoadNetwork } from './roadNetwork.js';

export function createRoadNetwork(parent, options = {}) {
  const network = new RoadNetwork();
  
  const showRoads = options.showRoads || false;
  
  const roadWidth = 0.08;
  
  // ============================================
  // УЗЛЫ ДОРОЖНОЙ СЕТИ (по реальному ковру)
  // Органическая структура с изгибами
  // ============================================
  
  // КРУГОВАЯ РАЗВЯЗКА 1 (верхняя левая)
  const roundabout1 = { x: -0.6, y: 0.85 };
  
  // КРУГОВАЯ РАЗВЯЗКА 2 (средняя левая)
  const roundabout2 = { x: -0.65, y: 0.0 };
  
  // КРУГОВАЯ РАЗВЯЗКА 3 (нижняя левая)
  const roundabout3 = { x: -0.6, y: -0.85 };
  
  // ВЕРХНЯЯ ЧАСТЬ (волнистая дорога)
  const t1 = { x: -0.9, y: 1.1 };
  const t2 = { x: -0.6, y: 1.15 };
  const t3 = { x: -0.2, y: 1.1 };
  const t4 = { x: 0.2, y: 1.15 };
  const t5 = { x: 0.6, y: 1.1 };
  const t6 = { x: 0.9, y: 1.15 };
  
  // ПРАВАЯ ЧАСТЬ (волнистая дорога)
  const r1 = { x: 1.0, y: 0.9 };
  const r2 = { x: 0.95, y: 0.5 };
  const r3 = { x: 1.0, y: 0.1 };
  const r4 = { x: 0.95, y: -0.3 };
  const r5 = { x: 1.0, y: -0.7 };
  const r6 = { x: 0.95, y: -1.1 };
  
  // НИЖНЯЯ ЧАСТЬ (волнистая дорога)
  const b1 = { x: 0.6, y: -1.15 };
  const b2 = { x: 0.2, y: -1.1 };
  const b3 = { x: -0.2, y: -1.15 };
  const b4 = { x: -0.6, y: -1.1 };
  const b5 = { x: -0.9, y: -1.15 };
  
  // ЛЕВАЯ ЧАСТЬ (волнистая дорога)
  const l1 = { x: -0.95, y: -1.0 };
  const l2 = { x: -1.0, y: -0.5 };
  const l3 = { x: -0.95, y: 0.0 };
  const l4 = { x: -1.0, y: 0.5 };
  const l5 = { x: -0.95, y: 1.0 };
  
  // ВНУТРЕННИЕ ДОРОГИ (изогнутые)
  // Верхний центральный квартал
  const c1 = { x: -0.3, y: 0.6 };
  const c2 = { x: 0.0, y: 0.65 };
  const c3 = { x: 0.3, y: 0.6 };
  
  // Центральный квартал
  const c4 = { x: -0.3, y: 0.2 };
  const c5 = { x: 0.0, y: 0.15 };
  const c6 = { x: 0.3, y: 0.2 };
  
  const c7 = { x: -0.3, y: -0.2 };
  const c8 = { x: 0.0, y: -0.15 };
  const c9 = { x: 0.3, y: -0.2 };
  
  // Нижний центральный квартал
  const c10 = { x: -0.3, y: -0.6 };
  const c11 = { x: 0.0, y: -0.65 };
  const c12 = { x: 0.3, y: -0.6 };
  
  // Соединительные узлы с круговыми развязками
  const conn1 = { x: -0.45, y: 0.85 };
  const conn2 = { x: -0.75, y: 0.85 };
  const conn3 = { x: -0.6, y: 1.0 };
  const conn4 = { x: -0.6, y: 0.7 };
  
  const conn5 = { x: -0.5, y: 0.0 };
  const conn6 = { x: -0.8, y: 0.0 };
  const conn7 = { x: -0.65, y: 0.3 };
  const conn8 = { x: -0.65, y: -0.3 };
  
  const conn9 = { x: -0.45, y: -0.85 };
  const conn10 = { x: -0.75, y: -0.85 };
  const conn11 = { x: -0.6, y: -0.7 };
  const conn12 = { x: -0.6, y: -1.0 };
  
  // Правые соединения
  const r_conn1 = { x: 0.6, y: 0.6 };
  const r_conn2 = { x: 0.6, y: 0.2 };
  const r_conn3 = { x: 0.6, y: -0.2 };
  const r_conn4 = { x: 0.6, y: -0.6 };
  
  // ============================================
  // ДОБАВЛЯЕМ УЗЛЫ В СЕТЬ
  // ============================================
  
  const allNodes = [
    roundabout1, roundabout2, roundabout3,
    t1, t2, t3, t4, t5, t6,
    r1, r2, r3, r4, r5, r6,
    b1, b2, b3, b4, b5,
    l1, l2, l3, l4, l5,
    c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12,
    conn1, conn2, conn3, conn4,
    conn5, conn6, conn7, conn8,
    conn9, conn10, conn11, conn12,
    r_conn1, r_conn2, r_conn3, r_conn4
  ];
  
  allNodes.forEach(node => network.addNode(node.x, node.y));
  
  // ============================================
  // СОЕДИНЯЕМ УЗЛЫ ДОРОГАМИ
  // ============================================
  
  function connect(nodeList) {
    for (let i = 0; i < nodeList.length - 1; i++) {
      const start = network.nodes.find(n => 
        Math.abs(n.x - nodeList[i].x) < 0.01 && 
        Math.abs(n.y - nodeList[i].y) < 0.01
      );
      const end = network.nodes.find(n => 
        Math.abs(n.x - nodeList[i+1].x) < 0.01 && 
        Math.abs(n.y - nodeList[i+1].y) < 0.01
      );
      if (start && end) network.addRoad(start, end);
    }
  }
  
  // ВНЕШНИЙ ПЕРИМЕТР (по часовой стрелке)
  connect([l5, t1, t2, t3, t4, t5, t6, r1, r2, r3, r4, r5, r6, b1, b2, b3, b4, b5, l1, l2, l3, l4, l5]);
  
  // КРУГОВАЯ РАЗВЯЗКА 1 (верхняя)
  connect([conn2, roundabout1, conn1]);
  connect([conn3, roundabout1, conn4]);
  
  // Соединения с развязкой 1
  connect([t2, conn3]);
  connect([conn4, c1]);
  connect([conn1, c2]);
  connect([conn2, l5]);
  
  // КРУГОВАЯ РАЗВЯЗКА 2 (средняя)
  connect([conn6, roundabout2, conn5]);
  connect([conn7, roundabout2, conn8]);
  
  // Соединения с развязкой 2
  connect([l3, conn6]);
  connect([conn5, c5]);
  connect([conn7, c4]);
  connect([conn8, c7]);
  
  // КРУГОВАЯ РАЗВЯЗКА 3 (нижняя)
  connect([conn10, roundabout3, conn9]);
  connect([conn11, roundabout3, conn12]);
  
  // Соединения с развязкой 3
  connect([l1, conn10]);
  connect([conn9, c10]);
  connect([conn11, c11]);
  connect([conn12, b4]);
  
  // ЦЕНТРАЛЬНЫЕ ГОРИЗОНТАЛЬНЫЕ ДОРОГИ
  connect([c1, c2, c3, r_conn1, r1]);
  connect([c4, c5, c6, r_conn2, r2]);
  connect([c7, c8, c9, r_conn3, r4]);
  connect([c10, c11, c12, r_conn4, r5]);
  
  // ЦЕНТРАЛЬНЫЕ ВЕРТИКАЛЬНЫЕ ДОРОГИ
  connect([c1, c4, c7, c10]);
  connect([c2, c5, c8, c11]);
  connect([c3, c6, c9, c12]);
  
  // ДОПОЛНИТЕЛЬНЫЕ СОЕДИНЕНИЯ
  connect([t3, c2]);
  connect([t4, c3]);
  connect([t5, r_conn1]);
  connect([b2, c11]);
  connect([b3, c10]);
  
  console.log(`✅ Дорожная сеть создана (органическая структура):`);
  console.log(`   - Узлов: ${network.nodes.length}`);
  console.log(`   - Дорог: ${network.roads.length}`);
  console.log(`   - Круговых развязок: 3`);
  
  // ============================================
  // ВИЗУАЛИЗАЦИЯ
  // ============================================
  
  if (!showRoads) {
    return network;
  }
  
  const roadMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2a2a2a,
    roughness: 0.9
  });
  
  const centerLineMaterial = new THREE.LineDashedMaterial({
    color: 0xffff00,
    linewidth: 2,
    dashSize: 0.03,
    gapSize: 0.02
  });
  
  // Рисуем дороги
  network.roads.forEach(road => {
    const start = road.start;
    const end = road.end;
    
    const roadLength = Math.hypot(end.x - start.x, end.y - start.y);
    const roadGeometry = new THREE.PlaneGeometry(roadLength, roadWidth);
    const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    
    roadMesh.position.set(
      (start.x + end.x) / 2,
      0.001,
      (start.y + end.y) / 2
    );
    
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.rotation.z = angle;
    
    parent.add(roadMesh);
    
    // Центральная линия
    const centerPoints = [
      new THREE.Vector3(start.x, 0.002, start.y),
      new THREE.Vector3(end.x, 0.002, end.y)
    ];
    const centerGeometry = new THREE.BufferGeometry().setFromPoints(centerPoints);
    const centerLine = new THREE.Line(centerGeometry, centerLineMaterial);
    centerLine.computeLineDistances();
    parent.add(centerLine);
  });
  
  // Круговые развязки
  [roundabout1, roundabout2, roundabout3].forEach(pos => {
    const radius = 0.12;
    
    const ringGeometry = new THREE.RingGeometry(radius - roadWidth/2, radius + roadWidth/2, 32);
    const ringMesh = new THREE.Mesh(ringGeometry, roadMaterial);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(pos.x, 0.001, pos.y);
    parent.add(ringMesh);
    
    const innerGeometry = new THREE.CircleGeometry(radius - roadWidth/2, 32);
    const innerMesh = new THREE.Mesh(innerGeometry, new THREE.MeshStandardMaterial({ 
      color: 0x4a7c4e 
    }));
    innerMesh.rotation.x = -Math.PI / 2;
    innerMesh.position.set(pos.x, 0.001, pos.y);
    parent.add(innerMesh);
    
    // Жёлтый круг в центре (как на ковре)
    const yellowCircle = new THREE.Mesh(
      new THREE.CircleGeometry(0.04, 32),
      new THREE.MeshStandardMaterial({ color: 0xffff00 })
    );
    yellowCircle.rotation.x = -Math.PI / 2;
    yellowCircle.position.set(pos.x, 0.002, pos.y);
    parent.add(yellowCircle);
  });
  
  console.log('✅ Дорожная сеть визуализирована');
  
  return network;
}