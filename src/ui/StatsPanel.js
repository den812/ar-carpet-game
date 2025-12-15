// ✅ Универсальная панель статистики для AR и Non-AR режимов
export class StatsPanel {
  constructor() {
    this.visible = false;
    this.createUI();
    this.lastUpdateTime = performance.now();
    this.frameCount = 0;
    this.fps = 0;
  }

  createUI() {
    // Создаем контейнер для статистики
    this.container = document.createElement('div');
    this.container.id = 'stats-panel';
    this.container.style.cssText = `
      position: fixed;
      top: 80px;
      left: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: #00ff00;
      padding: 15px;
      border-radius: 10px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      z-index: 10000;
      display: none;
      min-width: 200px;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(0, 255, 0, 0.3);
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      transition: all 0.3s ease;
    `;

    // Заголовок
    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(0, 255, 0, 0.3);
      color: #00ffff;
    `;
    title.textContent = '📊 СТАТИСТИКА';
    this.container.appendChild(title);

    // Контент статистики
    this.content = document.createElement('div');
    this.content.id = 'stats-content';
    this.container.appendChild(this.content);

    document.body.appendChild(this.container);
  }

  show() {
    this.visible = true;
    this.container.style.display = 'block';
    // Анимация появления
    setTimeout(() => {
      this.container.style.opacity = '1';
    }, 10);
  }

  hide() {
    this.visible = false;
    this.container.style.opacity = '0';
    setTimeout(() => {
      this.container.style.display = 'none';
    }, 300);
  }

  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  // Обновление FPS
  updateFPS() {
    const currentTime = performance.now();
    this.frameCount++;

    // Обновляем FPS каждые 30 кадров
    if (this.frameCount % 30 === 0) {
      const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
      this.fps = Math.round(30 / deltaTime);
      this.lastUpdateTime = currentTime;
    }

    return this.fps;
  }

  // Основной метод обновления данных
  update(data = {}) {
    if (!this.visible) return;

    const fps = this.updateFPS();

    // Формируем HTML с данными
    let html = `
      <div style="line-height: 1.8;">
        <div style="color: #ffff00;">⚡ FPS: <span style="color: ${fps > 50 ? '#00ff00' : fps > 30 ? '#ffaa00' : '#ff0000'}">${fps}</span></div>
    `;

    // AR специфичные данные
    if (data.mode === 'AR') {
      const trackingColor = data.tracking ? '#00ff00' : '#ff0000';
      const trackingIcon = data.tracking ? '🟢' : '🔴';
      const pausedIcon = data.paused ? '⏸️' : '▶️';
      const pausedColor = data.paused ? '#ffaa00' : '#00ff00';

      html += `
        <div style="color: ${trackingColor};">${trackingIcon} Трекинг: ${data.tracking ? 'ВКЛ' : 'ВЫКЛ'}</div>
        <div style="color: ${pausedColor};">${pausedIcon} Пауза: ${data.paused ? 'ДА' : 'НЕТ'}</div>
      `;
    } else {
      html += `
        <div style="color: #00aaff;">🎮 Режим: ${data.mode || 'TOUCH'}</div>
      `;
    }

    // Общие данные о машинах
    html += `
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0, 255, 0, 0.2);">
        <div style="color: #00ccff;">🚗 Машин: ${data.activeCars || 0}</div>
        <div style="color: #00ccff;">💾 В пуле: ${data.pooledCars || 0}</div>
        <div style="color: #00ccff;">🛣️ Маршрутов: ${data.cachedRoutes || 0}</div>
    `;

    // Дополнительные данные если есть
    if (data.spatialCells !== undefined) {
      html += `<div style="color: #00ccff;">🗺️ Ячеек: ${data.spatialCells}</div>`;
    }

    // Memory usage (если доступно)
    if (performance.memory) {
      const usedMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(performance.memory.jsHeapSizeLimit / 1048576);
      const memPercent = Math.round((usedMB / totalMB) * 100);
      const memColor = memPercent > 80 ? '#ff0000' : memPercent > 60 ? '#ffaa00' : '#00ff00';

      html += `
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0, 255, 0, 0.2);">
          <div style="color: ${memColor};">💾 RAM: ${usedMB}/${totalMB} MB (${memPercent}%)</div>
        </div>
      `;
    }

    html += `</div></div>`;

    this.content.innerHTML = html;
  }

  // Очистка
  destroy() {
    if (this.container) {
      this.container.remove();
    }
  }

  // Утилита для форматирования чисел
  static formatNumber(num) {
    return num.toLocaleString('ru-RU');
  }

  // Утилита для форматирования времени
  static formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}ч ${minutes % 60}м`;
    } else if (minutes > 0) {
      return `${minutes}м ${seconds % 60}с`;
    } else {
      return `${seconds}с`;
    }
  }
}