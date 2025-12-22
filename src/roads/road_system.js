// ===================================
// ФАЙЛ: src/roads/road_system.js V3
// ВОССТАНОВЛЕНА правильная дорожная сеть как на ковре
// ===================================

import * as THREE from 'three';
import { RoadNetwork } from './roadNetwork.js';

export function createRoadNetwork(parent, options = {}) {
  const network = new RoadNetwork();
  
  const showRoads = options.showRoads || false;
  
  // ============================================
  // ПАРАМЕТРЫ КОВРА И ДОРОГ
  // ============================================
  const carpetWidth = 2.0;
  const carpetHeight = 2.5;
  const roadWidth = 0.12;
  const laneWidth = roadWidth / 2;
  
  // Смещения от центра ковра
  const halfW = carpetWidth / 2;
  const halfH = carpetHeight / 2;
  
  // ============================================
  // УЗЛЫ ДОРОЖНОЙ СЕТИ (по координатам с ковра)
  // ============================================
  
  // Круговые развязки в углах
  const roundabout1 = { x: -0.7, y: 0.9 };   // Верхний левый
  const roundabout2 = { x: 0.7, y: 0.9 };    // Верхний правый
  const roundabout3 = { x: -0.7, y: -0.9 };  // Нижний левый
  const roundabout4 = { x: 0.7, y: -0.9 };   // Нижний правый
  
  // Центральные перекрестки
  const center1 = { x: -0.4, y: 0.3 };
  const center2 = { x: 0.4, y: 0.3 };
  const center3 = { x: -0.4, y: -0.3 };
  const center4 = { x: 0.4, y: -0.3 };
  
  // Промежуточные узлы на главных дорогах
  const top1 = { x: -0.4, y: 0.9 };
  const top2 = { x: 0, y: 0.9 };
  const top3 = { x: 0.4, y: 0.9 };
  
  const bottom1 = { x: -0.4, y: -0.9 };
  const bottom2 = { x: 0, y: -0.9 };
  const bottom3 = { x: 0.4, y: -0.9 };
  
  const left1 = { x: -0.9, y: 0.5 };
  const left2 = { x: -0.9, y: 0 };
  const left3 = { x: -0.9, y: -0.5 };
  
  const right1 = { x: 0.9, y: 0.5 };
  const right2 = { x: 0.9, y: 0 };
  const right3 = { x: 0.9, y: -0.5 };
  
  // Дополнительные узлы для сложных маршрутов
  const mid1 = { x: -0.2, y: 0.6 };
  const mid2 = { x: 0.2, y: 0.6 };
  const mid3 = { x: -0.2, y: 0 };
  const mid4 = { x: 0.2, y: 0 };
  const mid5 = { x: -0.2, y: -0.6 };
  const mid6 = { x: 0.2, y: -0.6 };
  
  // ============================================
  // ДОБАВЛЯЕМ УЗЛЫ В СЕТЬ
  // ============================================
  
  const nodes = [
    roundabout1, roundabout2, roundabout3, roundabout4,
    center1, center2, center3, center4,
    top1, top2, top3,
    bottom1, bottom2, bottom3,
    left1, left2, left3,
    right1, right2, right3,
    mid1, mid2, mid3, mid4, mid5, mid6
  ];
  
  nodes.forEach(node => network.addNode(node.x, node.y));
  
  // ============================================
  // СОЕДИНЯЕМ УЗЛЫ ДОРОГАМИ
  // ============================================
  
  // Периметр (верхний край)
  network.addRoad(roundabout1, top1);
  network.addRoad(top1, top2);
  network.addRoad(top2, top3);
  network.addRoad(top3, roundabout2);
  
  // Периметр (правый край)
  network.addRoad(roundabout2, right1);
  network.addRoad(right1, right2);
  network.addRoad(right2, right3);
  network.addRoad(right3, roundabout4);
  
  // Периметр (нижний край)
  network.addRoad(roundabout4, bottom3);
  network.addRoad(bottom3, bottom2);
  network.addRoad(bottom2, bottom1);
  network.addRoad(bottom1, roundabout3);
  
  // Периметр (левый край)
  network.addRoad(roundabout3, left3);
  network.addRoad(left3, left2);
  network.addRoad(left2, left1);
  network.addRoad(left1, roundabout1);
  
  // Внутренние вертикальные дороги
  network.addRoad(top1, center1);
  network.addRoad(center1, center3);
  network.addRoad(center3, bottom1);
  
  network.addRoad(top3, center2);
  network.addRoad(center2, center4);
  network.addRoad(center4, bottom3);
  
  network.addRoad(top2, mid2);
  network.addRoad(mid2, mid4);
  network.addRoad(mid4, mid6);
  network.addRoad(mid6, bottom2);
  
  // Внутренние горизонтальные дороги
  network.addRoad(left1, center1);
  network.addRoad(center1, mid1);
  network.addRoad(mid1, mid2);
  network.addRoad(mid2, center2);
  network.addRoad(center2, right1);
  
  network.addRoad(left2, mid3);
  network.addRoad(mid3, mid4);
  network.addRoad(mid4, right2);
  
  network.addRoad(left3, center3);
  network.addRoad(center3, mid5);
  network.addRoad(mid5, mid6);
  network.addRoad(mid6, center4);
  network.addRoad(center4, right3);
  
  // Диагональные соединения
  network.addRoad(roundabout1, center1);
  network.addRoad(roundabout2, center2);
  network.addRoad(roundabout3, center3);
  network.addRoad(roundabout4, center4);
  
  network.addRoad(center1, mid4);
  network.addRoad(center2, mid3);
  network.addRoad(center3, mid2);
  network.addRoad(center4, mid5);
  
  console.log(`✅ Дорожная сеть создана:`);
  console.log(`   - Узлов: ${network.nodes.length}`);
  console.log(`   - Дорог: ${network.roads.length}`);
  console.log(`   - Полос движения: ${network.lanes.length}`);
  console.log(`   - Правостороннее движение: ДА`);
  console.log(`   - Двустороннее движение: ДА`);
  
  // ✅ Проверяем связность узлов
  const unconnected = network.nodes.filter(n => n.connections.length === 0);
  if (unconnected.length > 0) {
    console.warn(`⚠️ Найдено ${unconnected.length} несвязанных узлов!`);
  } else {
    console.log(`✅ Все узлы связаны`);
  }
  
  // ============================================
  // ВИЗУАЛИЗАЦИЯ ДОРОГ (опционально)
  // ============================================
  
  if (!showRoads) {
    console.log('⚠️ Визуализация дорог отключена (машины будут ездить по невидимым дорогам)');
    return network;
  }
  
  console.log('🛣️ Визуализация дорог ВКЛЮЧЕНА (режим отладки)');
  
  const centerLineMaterial = new THREE.LineDashedMaterial({
    color: 0xffff00,
    linewidth: 3,
    dashSize: 0.03,
    gapSize: 0.02
  });
  
  const edgeLineMaterial = new THREE.LineDashedMaterial({
    color: 0xffffff,
    linewidth: 2,
    dashSize: 0.02,
    gapSize: 0.02
  });
  
  network.roads.forEach(road => {
    const start = road.start;
    const end = road.end;
    
    const roadLength = Math.hypot(end.x - start.x, end.y - start.y);
    const roadGeometry = new THREE.PlaneGeometry(roadLength, roadWidth);
    const roadMesh = new THREE.Mesh(
      roadGeometry,
      new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        roughness: 0.9,
        emissive: 0x111111,
        emissiveIntensity: 0.2
      })
    );
    
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
    
    // Краевые линии
    const perpAngle = angle + Math.PI / 2;
    const edgeOffset = roadWidth / 2;
    const offsetX = Math.cos(perpAngle) * edgeOffset;
    const offsetY = Math.sin(perpAngle) * edgeOffset;
    
    const leftPoints = [
      new THREE.Vector3(start.x + offsetX, 0.002, start.y + offsetY),
      new THREE.Vector3(end.x + offsetX, 0.002, end.y + offsetY)
    ];
    const leftGeometry = new THREE.BufferGeometry().setFromPoints(leftPoints);
    const leftLine = new THREE.Line(leftGeometry, edgeLineMaterial);
    leftLine.computeLineDistances();
    parent.add(leftLine);
    
    const rightPoints = [
      new THREE.Vector3(start.x - offsetX, 0.002, start.y - offsetY),
      new THREE.Vector3(end.x - offsetX, 0.002, end.y - offsetY)
    ];
    const rightGeometry = new THREE.BufferGeometry().setFromPoints(rightPoints);
    const rightLine = new THREE.Line(rightGeometry, edgeLineMaterial);
    rightLine.computeLineDistances();
    parent.add(rightLine);
  });
  
  // Круговые развязки
  const roundabouts = [roundabout1, roundabout2, roundabout3, roundabout4];
  
  roundabouts.forEach(pos => {
    const radius = 0.15;
    
    const outerGeometry = new THREE.RingGeometry(radius - roadWidth/2, radius + roadWidth/2, 32);
    const outerMesh = new THREE.Mesh(
      outerGeometry,
      new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        roughness: 0.9,
        emissive: 0x111111,
        emissiveIntensity: 0.2,
        side: THREE.DoubleSide
      })
    );
    outerMesh.rotation.x = -Math.PI / 2;
    outerMesh.position.set(pos.x, 0.001, pos.y);
    parent.add(outerMesh);
    
    const innerGeometry = new THREE.CircleGeometry(radius - roadWidth/2, 32);
    const innerMesh = new THREE.Mesh(
      innerGeometry,
      new THREE.MeshStandardMaterial({ 
        color: 0x4a7c4e,
        roughness: 0.8
      })
    );
    innerMesh.rotation.x = -Math.PI / 2;
    innerMesh.position.set(pos.x, 0.001, pos.y);
    parent.add(innerMesh);
    
    const circlePoints = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      circlePoints.push(new THREE.Vector3(
        pos.x + Math.cos(angle) * radius,
        0.002,
        pos.y + Math.sin(angle) * radius
      ));
    }
    const circleGeometry = new THREE.BufferGeometry().setFromPoints(circlePoints);
    const circleLine = new THREE.Line(circleGeometry, centerLineMaterial);
    circleLine.computeLineDistances();
    parent.add(circleLine);
  });
  
  console.log('✅ Дорожная сеть визуализирована');
  
  return network;
}