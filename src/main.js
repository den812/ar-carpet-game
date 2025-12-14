import { startAR } from "./ar.js";
import { startNonAR } from "./nonAr.js";
import { initStartScreen } from "./ui/StartScreen.js";
import { initModeUI } from "./ui/ModeUI.js";

function run(mode) {
  if (mode === "AR") {
    startAR().catch(() => startNonAR("TOUCH"));
  } else {
    startNonAR(mode);
  }
}

initStartScreen(mode => {
  localStorage.setItem("mode", mode);
  run(mode);
  initModeUI(m => {
    localStorage.setItem("mode", m);
    location.reload();
  });
});
