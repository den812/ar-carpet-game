// ===================================
// ФАЙЛ: src/ui/StartScreen.js V2
// ДОБАВЛЕНО:
// - Переключатель показа статистики
// - Переключатель инверсии осей
// ===================================

export function initStartScreen(cb) {
  const el = document.getElementById("start");
  
  // Читаем сохраненные настройки
  const showStats = localStorage.getItem('showStats') !== 'false'; // по умолчанию true
  const invertControls = localStorage.getItem('invertControls') === 'true'; // по умолчанию false
  
  // Чекбоксы настроек
  const statsCheckbox = el.querySelector('#stats-toggle');
  const invertCheckbox = el.querySelector('#invert-toggle');
  
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
  
  // Кнопки выбора режима
  el.querySelectorAll("button").forEach(b => {
    b.onclick = () => {
      el.style.display = "none";
      cb(b.dataset.mode, {
        showStats: statsCheckbox ? statsCheckbox.checked : showStats,
        invertControls: invertCheckbox ? invertCheckbox.checked : invertControls
      });
    };
  });
}