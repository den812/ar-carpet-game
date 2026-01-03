// ===================================
// ФАЙЛ: src/main.js V24 - CHROME ANDROID FIX
// ИСПРАВЛЕНО:
// - Специальная обработка для Chrome Android
// - Ранняя валидация перед запуском
// - Детальная диагностика ошибок
// ===================================

import { startAR } from "./ar_webxr.js";
import { startNonAR } from "./nonAr.js";
import { initStartScreen } from "./ui/StartScreen.js";
import { initModeUI } from "./ui/ModeUI.js";
import { OnScreenLogger } from "./ui/OnScreenLogger.js";

// ✅ Инициализируем логгер на экране
const logger = new OnScreenLogger();
console.log('✅ On-screen logger инициализирован');

let currentMode = null;

// ✅ Функция детальной диагностики
function diagnoseEnvironment() {
  const info = {
    userAgent: navigator.userAgent,
    isChrome: /Chrome/.test(navigator.userAgent) && /Android/.test(navigator.userAgent),
    isSamsung: /SamsungBrowser/.test(navigator.userAgent),
    isEdge: /Edg/.test(navigator.userAgent),
    hasWebXR: 'xr' in navigator,
    isHTTPS: location.protocol === 'https:' || location.hostname === 'localhost',
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio
  };
  
  console.log('📊 Диагностика окружения:', info);
  return info;
}

// ✅ Проверка готовности системы
async function checkSystemReady() {
  console.log('🔍 Проверка готовности системы...');
  
  try {
    // Проверяем что Three.js загружен
    const THREE = await import('three');
    if (!THREE) {
      throw new Error('Three.js не загружен');
    }
    console.log('✅ Three.js загружен');
    
    // Проверяем что все модули доступны
    const modules = [
      './roads/road_system.js',
      './traffic/traffic_manager.js',
      './cars/Car.js',
      './cars/CarModels.js'
    ];
    
    for (const mod of modules) {
      try {
        await import(mod);
        console.log(`✅ ${mod} доступен`);
      } catch (err) {
        console.error(`❌ ${mod} не загружен:`, err);
        throw new Error(`Не удалось загрузить ${mod}`);
      }
    }
    
    console.log('✅ Все модули загружены');
    return true;
  } catch (err) {
    console.error('❌ Ошибка проверки системы:', err);
    throw err;
  }
}

async function run(mode, settings = {}) {
  console.log(`🚀 Запуск режима: ${mode}`);
  console.log('📋 Настройки:', settings);
  
  // ✅ Управление логгером по настройке
  if (settings.showLogger === true) {
    console.log('✅ Настройка showLogger = true, открываю логгер...');
    logger.show();
    console.log('✅ Логгер должен быть виден');
  } else {
    console.log('📋 Логгер выключен (showLogger:', settings.showLogger, ')');
    console.log('💡 Можете открыть логгер кнопкой 📋 справа внизу');
  }
  
  // Диагностика окружения
  const envInfo = diagnoseEnvironment();
  
  // ✅ Специальная обработка для Chrome Android
  if (envInfo.isChrome && mode === "AR") {
    console.log('📱 Обнаружен Chrome Android, применяем специальные настройки...');
    
    // Проверяем готовность системы ПЕРЕД запуском
    try {
      await checkSystemReady();
    } catch (err) {
      console.error('❌ Система не готова:', err);
      alert(`Ошибка инициализации:\n${err.message}\n\nИспользуйте TOUCH режим`);
      currentMode = "TOUCH";
      localStorage.setItem("mode", "TOUCH");
      startNonAR("TOUCH", settings);
      initModeUI(changeMode);
      return;
    }
    
    // Даем браузеру время на инициализацию
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  currentMode = mode;
  localStorage.setItem("mode", mode);

  if (mode === "AR") {
    try {
      await startAR(settings);
      console.log('✅ AR режим запущен');
    } catch (err) {
      console.error("❌ AR не запустился:", err);
      
      // Формируем детальное сообщение об ошибке
      let message = "AR не работает:\n";
      
      if (err.message && err.message.includes('Cannot read properties of undefined')) {
        message += "Ошибка чтения данных.\n";
        message += "Возможно проблема с дорожной сетью.\n\n";
      } else if (err.userMessage) {
        message = err.userMessage;
      } else if (!envInfo.hasWebXR) {
        message += "• Браузер не поддерживает WebXR\n\n";
      } else if (!envInfo.isHTTPS) {
        message += "• Требуется HTTPS (сейчас HTTP)\n\n";
      } else {
        message += `• ${err.message}\n\n`;
      }
      
      message += "Переключаюсь на TOUCH режим.";
      
      alert(message);
      
      // Переключаемся на TOUCH
      currentMode = "TOUCH";
      localStorage.setItem("mode", "TOUCH");
      
      // Даем время на очистку
      await new Promise(resolve => setTimeout(resolve, 300));
      
      try {
        startNonAR("TOUCH", settings);
      } catch (touchErr) {
        console.error("❌ TOUCH режим тоже не запустился:", touchErr);
        alert(`Критическая ошибка:\n${touchErr.message}\n\nПерезагрузите страницу`);
      }
    }
  } else {
    // TOUCH или GYRO режим
    try {
      // Проверяем готовность системы
      await checkSystemReady();
      
      // Даем время на инициализацию
      await new Promise(resolve => setTimeout(resolve, 200));
      
      startNonAR(mode, settings);
      console.log(`✅ ${mode} режим запущен`);
    } catch (err) {
      console.error(`❌ ${mode} режим не запустился:`, err);
      alert(`Ошибка запуска:\n${err.message}\n\nПерезагрузите страницу`);
    }
  }

  // Инициализируем переключатель режимов
  try {
    initModeUI(changeMode);
  } catch (err) {
    console.warn('⚠️ Ошибка инициализации переключателя режимов:', err);
  }
}

function changeMode(mode) {
  if (mode === currentMode) return;
  
  const settings = {
    showStats: localStorage.getItem('showStats') !== 'false',
    showControl: localStorage.getItem('showControl') !== 'false',
    invertControls: localStorage.getItem('invertControls') === 'true',
    showRoads: localStorage.getItem('showRoads') === 'true'
  };
  
  // Перезагрузка страницы для полной очистки
  location.reload();
}

// ✅ Ждем полной загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM загружен');
    initStartScreen(run);
  });
} else {
  console.log('✅ DOM уже загружен');
  initStartScreen(run);
}