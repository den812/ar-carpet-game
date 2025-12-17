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
    this.container = document.createElement('div');
    this.container.id = 'stats-panel';
    this.container.style.cssText = `
      position: fixed; top: 80px; left: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: #00ff00; padding: 15px;
      border-radius: 10px; font-family: monospace;
      font-size: 14px; z-index: 10000; display: none;
    `;
    const title = document.createElement('div');
    title.style.cssText = `font-size: 16px; font-weight: bold; margin-bottom: 10px;`;
    title.textContent = ' СТАТИСТИКА';
    this.container.appendChild(title);
    this.content = document.createElement('div');
    this.container.appendChild(this.content);
    document.body.appendChild(this.container);
  }
  show() { this.visible = true; this.container.style.display = 'block'; }
  hide() { this.visible = false; this.container.style.display = 'none'; }
  updateFPS() {
    const currentTime = performance.now();
    this.frameCount++;
    if (this.frameCount % 30 === 0) {
      const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
      this.fps = Math.round(30 / deltaTime);
      this.lastUpdateTime = currentTime;
    }
    return this.fps;
  }
  update(data = {}) {
    if (!this.visible) return;
    const fps = this.updateFPS();
    let html = `⚡ FPS: ${fps}\n`;
    if (data.mode === 'AR') {
      html += `Трекинг: ${data.tracking ? 'ВКЛ' : 'ВЫКЛ'}\n`;
      html += `Пауза: ${data.paused ? 'ДА' : 'НЕТ'}\n`;
    } else {
      html += `Режим: ${data.mode || 'TOUCH'}\n`;
    }
    this.content.innerHTML = html;
  }
}
