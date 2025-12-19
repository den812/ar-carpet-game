// ===================================
// ФАЙЛ: src/ui/StartScreen.js V3
// ДОБАВЛЕНО:
// - Опция показа дорог для отладки
// ===================================

export function initStartScreen(cb) {
  const el = document.getElementById("start");
  
  // Читаем сохраненные настройки
  const showStats = localStorage.getItem('showStats') !== 'false'; // по умолчанию true
  const invertControls = localStorage.getItem('invertControls') === 'true'; // по умолчанию false
  const showRoads = localStorage.getItem('showRoads') === 'true'; // по умолчанию false (скрыты)
  
  // Чекбоксы настроек
  const statsCheckbox = el.querySelector('#stats-toggle');
  const invertCheckbox = el.querySelector('#invert-toggle');
  const roadsCheckbox = el.querySelector('#roads-toggle');
  
  if (statsCheckbox) {
    statsCheckbox.checked = showStats;
    statsCheckbox.onchange = () => {
      localStorage.setItem('showStats', statsCheckbox.checked);
    };
  }
  
  if (invertCheckbox) {
    invertCheckbox.checked = invertControls;
    invertCheckbox.onchange = () => {
      localStorage.setItem('invertControls', invertCheckbox.checked);
    };
  }
  
  if (roadsCheckbox) {
    roadsCheckbox.checked = showRoads;
    roadsCheckbox.onchange = () => {
      localStorage.setItem('showRoads', roadsCheckbox.checked);
    };
  }
  
  // Кнопки выбора режима
  el.querySelectorAll("button[data-mode]").forEach(b => {
    b.onclick = () => {
      el.style.display = "none";
      cb(b.dataset.mode, {
        showStats: statsCheckbox ? statsCheckbox.checked : showStats,
        invertControls: invertCheckbox ? invertCheckbox.checked : invertControls,
        showRoads: roadsCheckbox ? roadsCheckbox.checked : showRoads
      });
    };
  });
}