// ===================================
// ФАЙЛ: src/ui/StatsPanel.js V3
// ИЗМЕНЕНО:
// - Панель внизу экрана
// - Коллапсируется (по умолчанию только FPS)
// - Клик разворачивает/сворачивает
// ===================================

export class StatsPanel {
  constructor() {
    this.panel = null;
    this.isVisible = false;
    this.isExpanded = false;
    this.lastFrame = performance.now();
  }

  show() {
    if (this.panel) return;

    this.panel = document.createElement('div');
    this.panel.id = 'stats-panel';
    this.panel.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.85);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      padding: 10px 15px;
      border-radius: 8px;
      border: 2px solid #00ff00;
      box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
      z-index: 1000;
      min-width: 200px;
      backdrop-filter: blur(5px);
      pointer-events: all;
      cursor: pointer;
      transition: all 0.3s ease;
    `;

    this.panel.innerHTML = `
      <div id="stats-header" style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">📊</span>
        <strong style="color: #00ff00; text-shadow: 0 0 5px #00ff00;">СТАТИСТИКА</strong>
        <span id="expand-icon" style="margin-left: auto; font-size: 12px;">▼</span>
      </div>
      <div id="stats-content" style="display: none; margin-top: 10px; padding-top: 10px; border-top: 1px solid #00ff00;"></div>
    `;

    // Клик для разворачивания/сворачивания
    this.panel.onclick = () => {
      this.toggle();
    };

    document.body.appendChild(this.panel);
    this.isVisible = true;
  }

  hide() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
      this.isVisible = false;
    }
  }

  toggle() {
    if (!this.panel) return;
    
    this.isExpanded = !this.isExpanded;
    const content = this.panel.querySelector('#stats-content');
    const icon = this.panel.querySelector('#expand-icon');
    
    if (this.isExpanded) {
      content.style.display = 'block';
      icon.textContent = '▲';
    } else {
      content.style.display = 'none';
      icon.textContent = '▼';
    }
  }

  update(data) {
    if (!this.panel) return;

    const header = this.panel.querySelector('#stats-header');
    const content = this.panel.querySelector('#stats-content');
    if (!header || !content) return;

    // Всегда показываем FPS в заголовке
    const fps = Math.round(1000 / (performance.now() - this.lastFrame));
    const fpsInHeader = header.querySelector('#fps-display');
    
    if (!fpsInHeader) {
      const fpsSpan = document.createElement('span');
      fpsSpan.id = 'fps-display';
      fpsSpan.style.cssText = 'margin-left: 10px; color: #00ff00; font-weight: bold;';
      header.insertBefore(fpsSpan, header.querySelector('#expand-icon'));
    }
    
    header.querySelector('#fps-display').textContent = `${fps} FPS`;

    // Остальная статистика (показывается при разворачивании)
    const items = [
      { icon: '🎮', label: 'Режим', value: data.mode || 'N/A' },
      { icon: '🚗', label: 'Машины', value: data.cars || 0 },
      { icon: '🅿️', label: 'В пуле', value: data.pooled || 0 },
      { icon: '🔍', label: 'Масштаб', value: `${data.scale || '1.00'}x` },
      { icon: '📏', label: 'Радиус', value: data.cameraRadius || 'N/A' },
      { icon: '⏸️', label: 'Пауза', value: data.paused ? 'ДА' : 'НЕТ' }
    ];

    if (data.mode === 'AR') {
      items.splice(4, 0, { icon: '🎯', label: 'Трекинг', value: data.tracking ? 'ДА' : 'НЕТ' });
    }

    content.innerHTML = items.map(item => `
      <div style="display: flex; justify-content: space-between; margin: 6px 0; padding: 4px 0;">
        <span style="opacity: 0.9;">
          <span style="margin-right: 6px;">${item.icon}</span>
          ${item.label}:
        </span>
        <strong style="color: #00ff00; text-shadow: 0 0 3px #00ff00;">${item.value}</strong>
      </div>
    `).join('');

    this.lastFrame = performance.now();
  }
}