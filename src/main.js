// ===================================
// ФАЙЛ: src/main.js V3
// ИСПРАВЛЕНО:
// - Лучшие сообщения об ошибках AR
// - Автоматический fallback на TOUCH
// ===================================

import { startAR } from "./ar.js";
import { startNonAR } from "./nonAr.js";
import { initStartScreen } from "./ui/StartScreen.js";
import { initModeUI } from "./ui/ModeUI.js";

let currentMode = null;

function run(mode, settings = {}) {
  currentMode = mode;
  localStorage.setItem("mode", mode);

  if (mode === "AR") {
    startAR(settings).catch(err => {
      console.warn("❌ AR не запустился:", err);
      
      // Показываем понятное сообщение
      const message = err.userMessage || 
        "AR режим не поддерживается.\n\nВозможные причины:\n" +
        "• Требуется HTTPS (сейчас HTTP)\n" +
        "• Нет доступа к камере\n" +
        "• Браузер не поддерживает WebXR\n\n" +
        "Переключаюсь на TOUCH режим.";
      
      alert(message);
      
      // Автоматический fallback на TOUCH
      currentMode = "TOUCH";
      localStorage.setItem("mode", "TOUCH");
      startNonAR("TOUCH", settings);
    });
  } else {
    startNonAR(mode, settings);
  }

  initModeUI(changeMode);
}

function changeMode(mode) {
  if (mode === currentMode) return;
  
  // Читаем текущие настройки
  const settings = {
    showStats: localStorage.getItem('showStats') !== 'false',
    invertControls: localStorage.getItem('invertControls') === 'true',
    showRoads: localStorage.getItem('showRoads') === 'true'
  };
  
  location.reload(); // простой и надежный reset сцены
}

initStartScreen(run);