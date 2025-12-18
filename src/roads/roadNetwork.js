// ===================================
// ФАЙЛ: src/roads/roadNetwork.js
// Этот файл работает корректно, изменений не требуется
// Используется в road_system.js
// ===================================

import * as THREE from "three";

// ИСПРАВЛЕНО: Координаты под реальный ковер (2м x 2.5м)
// Ковер размещен от -1 до 1 по X, от -1.25 до 1.25 по Z

const LANE_OFFSET = 0.03; // Смещение для двух полос (туда/обратно)

// Главные горизонтальные дороги (с двумя полосами)
export const roads = {
  // Горизонтальная дорога 1 (верхняя) - полоса ВПРАВО
  h1: new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.9, 0, -0.6 - LANE_OFFSET),
    new THREE.Vector3( 0.9, 0, -0.6 - LANE_OFFSET)
  ], false, 'catmullrom', 0),

  // Горизонтальная дорога 1 (верхняя) - полоса ВЛЕВО
  h1_back: new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.9, 0, -0.6 + LANE_OFFSET),
    new THREE.Vector3(-0.9, 0, -0.6 + LANE_OFFSET)
  ], false, 'catmullrom', 0),

  // Горизонтальная дорога 2 (нижняя) - полоса ВПРАВО
  h2: new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.9, 0, 0.6 - LANE_OFFSET),
    new THREE.Vector3( 0.9, 0, 0.6 - LANE_OFFSET)
  ], false, 'catmullrom', 0),

  // Горизонтальная дорога 2 (нижняя) - полоса ВЛЕВО
  h2_back: new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.9, 0, 0.6 + LANE_OFFSET),
    new THREE.Vector3(-0.9, 0, 0.6 + LANE_OFFSET)
  ], false, 'catmullrom', 0),

  // Вертикальная дорога 1 (левая) - полоса ВНИЗ
  v1: new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.5 - LANE_OFFSET, 0, -1.0),
    new THREE.Vector3(-0.5 - LANE_OFFSET, 0,  1.0)
  ], false, 'catmullrom', 0),

  // Вертикальная дорога 1 (левая) - полоса ВВЕРХ
  v1_back: new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.5 + LANE_OFFSET, 0,  1.0),
    new THREE.Vector3(-0.5 + LANE_OFFSET, 0, -1.0)
  ], false, 'catmullrom', 0),

  // Вертикальная дорога 2 (центральная) - полоса ВНИЗ
  v2: new THREE.CatmullRomCurve3([
    new THREE.Vector3(0 - LANE_OFFSET, 0, -1.0),
    new THREE.Vector3(0 - LANE_OFFSET, 0,  1.0)
  ], false, 'catmullrom', 0),

  // Вертикальная дорога 2 (центральная) - полоса ВВЕРХ
  v2_back: new THREE.CatmullRomCurve3([
    new THREE.Vector3(0 + LANE_OFFSET, 0,  1.0),
    new THREE.Vector3(0 + LANE_OFFSET, 0, -1.0)
  ], false, 'catmullrom', 0),

  // Вертикальная дорога 3 (правая) - полоса ВНИЗ
  v3: new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.5 - LANE_OFFSET, 0, -1.0),
    new THREE.Vector3(0.5 - LANE_OFFSET, 0,  1.0)
  ], false, 'catmullrom', 0),

  // Вертикальная дорога 3 (правая) - полоса ВВЕРХ
  v3_back: new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.5 + LANE_OFFSET, 0,  1.0),
    new THREE.Vector3(0.5 + LANE_OFFSET, 0, -1.0)
  ], false, 'catmullrom', 0)
};

// Визуализация дорог для отладки (опционально)
export function createRoadVisuals(scene) {
  const material = new THREE.LineBasicMaterial({ 
    color: 0xffff00,
    linewidth: 2 
  });

  Object.values(roads).forEach(road => {
    const points = road.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    line.position.y = 0.01; // Чуть выше ковра
    scene.add(line);
  });
}

// Перекрестки для системы ПДД (будущая функция)
export const intersections = [
  { 
    id: 'int_1', 
    position: new THREE.Vector3(-0.5, 0, -0.6),
    roads: ['h1', 'h1_back', 'v1', 'v1_back'],
    priority: 'h1' // Горизонтальная дорога - главная
  },
  { 
    id: 'int_2', 
    position: new THREE.Vector3(0, 0, -0.6),
    roads: ['h1', 'h1_back', 'v2', 'v2_back'],
    priority: 'h1'
  },
  { 
    id: 'int_3', 
    position: new THREE.Vector3(0.5, 0, -0.6),
    roads: ['h1', 'h1_back', 'v3', 'v3_back'],
    priority: 'h1'
  },
  { 
    id: 'int_4', 
    position: new THREE.Vector3(-0.5, 0, 0.6),
    roads: ['h2', 'h2_back', 'v1', 'v1_back'],
    priority: 'h2'
  },
  { 
    id: 'int_5', 
    position: new THREE.Vector3(0, 0, 0.6),
    roads: ['h2', 'h2_back', 'v2', 'v2_back'],
    priority: 'h2'
  },
  { 
    id: 'int_6', 
    position: new THREE.Vector3(0.5, 0, 0.6),
    roads: ['h2', 'h2_back', 'v3', 'v3_back'],
    priority: 'h2'
  }
];