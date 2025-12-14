// 🎮 Центральный файл конфигурации игры

export const CONFIG = {
  // 🚗 Масштабы машинок
  carScales: {
    defaultScale: 0.015,  // Базовый множитель для всех машинок
    models: {
      "Buggy.glb": 1.0,           // Относительный к defaultScale
      "Duck.glb": 0.8,             // Утка чуть меньше
      "CesiumMilkTruck.glb": 1.3   // Грузовик крупнее
    }
  },

  // 🎨 Ковер
  carpet: {
    width: 2.0,   // Ширина в метрах
    height: 2.5,  // Длина в метрах
    y: 0          // Высота над землёй
  },

  // 📷 Камера
  camera: {
    fov: 50,
    near: 0.01,
    far: 100,
    position: {
      x: 0,
      y: 1.5,
      z: 1.8
    }
  },

  // 🚦 Машинки
  cars: {
    count: 7,               // Количество машинок
    baseSpeed: 0.0003,      // Базовая скорость
    speedVariation: 0.0002, // Случайное отклонение скорости
    heightAboveCarpet: 0.05 // Высота над ковром
  },

  // 💡 Освещение
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

  // 🎛️ UI
  ui: {
    showScaleControl: true,  // Панель масштаба (для отладки)
    showCarCounter: true,     // Счётчик машинок
    scaleControlRange: {
      min: 0.005,
      max: 0.10,
      step: 0.001
    }
  },

  // 🖱️ Управление
  controls: {
    mouse: {
      enabled: true,
      rotateSpeed: 0.005,     // Скорость вращения
      zoomSpeed: 0.1,         // Скорость зума колесом
      minDistance: 0.5,       // Минимальная дистанция до центра
      maxDistance: 5.0,       // Максимальная дистанция
      minHeight: 0.5,         // Минимальная высота камеры
      maxHeight: 3.0          // Максимальная высота камеры
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

  // 🛣️ Дороги
  roads: {
    laneOffset: 0.03  // Смещение полос
  },

  // 🎵 Звуки (для будущего)
  sounds: {
    enabled: false,
    volume: 0.5
  },

  // 🔧 Отладка
  debug: {
    showRoadLines: false,      // Визуализация дорог
    showIntersections: false,  // Показать перекрёстки
    logCarUpdates: false       // Логи обновлений машинок
  }
};

// 🔄 Функция для обновления конфигурации
export function updateConfig(path, value) {
  const keys = path.split('.');
  let obj = CONFIG;
  
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]];
  }
  
  obj[keys[keys.length - 1]] = value;
  console.log(`⚙️ Config updated: ${path} = ${value}`);
}

// 📊 Экспорт для удобного доступа
export const getCarScale = (modelName) => {
  const base = CONFIG.carScales.defaultScale;
  const multiplier = CONFIG.carScales.models[modelName] || 1.0;
  return base * multiplier;
};

export const getCarConfig = () => CONFIG.cars;
export const getCameraConfig = () => CONFIG.camera;
export const getCarpetConfig = () => CONFIG.carpet;
export const getControlsConfig = () => CONFIG.controls;