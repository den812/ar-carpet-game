export function initModeUI(cb) {
  const ui = document.getElementById("mode-ui");
  if (!ui) return;

  ui.hidden = false;

  ui.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => cb(btn.dataset.mode);
  });
}
