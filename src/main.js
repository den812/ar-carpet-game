import { startAR } from "./ar.js";
import { startNonAR } from "./nonAr.js";
import { initStartScreen } from "./ui/StartScreen.js";
import { initModeUI } from "./ui/ModeUI.js";

let currentMode = null;

function run(mode) {
  currentMode = mode;
  localStorage.setItem("mode", mode);

  if (mode === "AR") {
    startAR().catch(err => {
      console.warn("AR не запустился, fallback TOUCH", err);
      startNonAR("TOUCH");
    });
  } else {
    startNonAR(mode);
  }

  initModeUI(changeMode);
}

function changeMode(mode) {
  if (mode === currentMode) return;
  location.reload(); // простой и надежный reset сцены
}

initStartScreen(run);
