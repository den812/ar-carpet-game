export function initModeUI(cb) {
  const ui = document.getElementById("mode-ui");
  ui.hidden = false;
  ui.querySelectorAll("button").forEach(b => {
    b.onclick = () => cb(b.dataset.mode);
  });
}
