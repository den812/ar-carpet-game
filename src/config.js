// ===================================
// ФАЙЛ: src/config.js
// ИСПРАВЛЕНЫ масштабы моделей согласно требованиям:
// - Buggy: 0.3x (было 0.8)
// - Milk Truck: 8.5x (было 1.0)
// - Duck: 10x (было 1.2)
// ===================================

export const CONFIG = {
  carScales: {
    defaultScale: 0.002, // Базовый масштаб
    models: {
      "Buggy.glb": 0.3,      // ✅ ИСПРАВЛЕНО: 0.3x (было 0.8)
      "Duck.glb": 10.0,       // ✅ ИСПРАВЛЕНО: 10x (было 1.2)
      "CesiumMilkTruck.glb": 8.5  // ✅ ИСПРАВЛЕНО: 8.5x (было 1.0)
    }
  },
  carpet: { 
    width: 2.0, 
    height: 2.5, 
    y: 0 
  },
  camera: { 
    fov: 50, 
    near: 0.01, 
    far: 100, 
    position: { x: 0, y: 1.5, z: 1.8 }
  },
  cars: { 
    count: 7, 
    baseSpeed: 0.0005, 
    speedVariation: 0.0003, 
    heightAboveCarpet: 0.0 // На уровне ковра
  },
  lighting: { 
    ambient: { 
      color: 0xffffff, 
      intensity: 0.8 
    }, 
    directional: { 
      color: 0xffffff, 
      intensity: 0.6, 
      position: { x: 5, y: 10, z: 5 }
    }
  },
  ui: { 
    showScaleControl: true, 
    showCarCounter: true, 
    scaleControlRange: { 
      min: 0.005, 
      max: 0.10, 
      step: 0.001 
    }
  },
  controls: { 
    mouse: { 
      enabled: true, 
      rotateSpeed: 0.005, 
      zoomSpeed: 0.1, 
      minDistance: 0.5, 
      maxDistance: 5.0, 
      minHeight: 0.5, 
      maxHeight: 3.0 
    },
    touch: { 
      enabled: true, 
      sensitivity: 0.005 
    },
    gyro: { 
      enabled: true, 
      sensitivity: 1.0 
    }
  },
  roads: { 
    laneOffset: 0.02 // Смещение полосы от центра дороги
  },
  sounds: { 
    enabled: false, 
    volume: 0.5 
  },
  debug: { 
    showRoadLines: false, 
    showIntersections: false, 
    logCarUpdates: false 
  }
};

export function updateConfig(path, value) {
  const keys = path.split('.');
  let obj = CONFIG;
  for (let i = 0; i < keys.length - 1; i++) { 
    obj = obj[keys[i]]; 
  }
  obj[keys[keys.length - 1]] = value;
  console.log(`⚙️ Config updated: ${path} = ${value}`);
}

export const getCarScale = (modelName) => {
  const base = CONFIG.carScales.defaultScale;
  const multiplier = CONFIG.carScales.models[modelName] || 1.0;
  return base * multiplier;
};

export const getCarConfig = () => CONFIG.cars;
export const getCameraConfig = () => CONFIG.camera;
export const getCarpetConfig = () => CONFIG.carpet;
export const getControlsConfig = () => CONFIG.controls;