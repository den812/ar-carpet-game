// ===================================
// ФАЙЛ: src/ui/StartScreen.js
// Без изменений - работает корректно
// ===================================

export function initStartScreen(cb) {
  const el = document.getElementById("start");
  
  // Читаем сохраненные настройки
  const showStats = localStorage.getItem('showStats') !== 'false';
  const showControl = localStorage.getItem('showControl') !== 'false'; // ✅ НОВОЕ
  const invertControls = localStorage.getItem('invertControls') === 'true';
  const showRoads = localStorage.getItem('showRoads') === 'true';
  
  // Чекбоксы настроек
  const statsCheckbox = el.querySelector('#stats-toggle');
  const controlCheckbox = el.querySelector('#control-toggle'); // ✅ НОВОЕ
  const invertCheckbox = el.querySelector('#invert-toggle');
  const roadsCheckbox = el.querySelector('#roads-toggle');
  
  if (statsCheckbox) {
    statsCheckbox.checked = showStats;
    statsCheckbox.onchange = () => {
      localStorage.setItem('showStats', statsCheckbox.checked);
    };
  }
  
  // ✅ НОВОЕ: Чекбокс панели управления
  if (controlCheckbox) {
    controlCheckbox.checked = showControl;
    controlCheckbox.onchange = () => {
      localStorage.setItem('showControl', controlCheckbox.checked);
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
        showControl: controlCheckbox ? controlCheckbox.checked : showControl, // ✅ НОВОЕ
        invertControls: invertCheckbox ? invertCheckbox.checked : invertControls,
        showRoads: roadsCheckbox ? roadsCheckbox.checked : showRoads
      });
    };
  });
}