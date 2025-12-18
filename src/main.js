// ===================================
// ФАЙЛ: src/main.js V2
// ИЗМЕНЕНО:
// - Передача настроек (showStats, invertControls) в режимы
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
      console.warn("AR не запустился, fallback TOUCH", err);
      alert("AR режим не поддерживается на этом устройстве. Переключаюсь на TOUCH.");
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
    invertControls: localStorage.getItem('invertControls') === 'true'
  };
  
  location.reload(); // простой и надежный reset сцены
}

initStartScreen(run);