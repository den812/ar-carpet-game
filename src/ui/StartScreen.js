export function initStartScreen(cb) {
  const el = document.getElementById("start");
  el.querySelectorAll("button").forEach(b => {
    b.onclick = () => {
      el.style.display = "none";
      cb(b.dataset.mode);
    };
  });
}
