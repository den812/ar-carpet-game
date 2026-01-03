// ===================================
// ФАЙЛ: src/ui/OnScreenLogger.js
// Система вывода логов на экран
// ===================================

export class OnScreenLogger {
  constructor() {
    this.maxLogs = 20;
    this.logs = [];
    this.container = null;
    this.isVisible = false;
    this.autoScroll = true;
    
    this.init();
    this.interceptConsole();
  }

  init() {
    console.log('🔧 OnScreenLogger.init() начало...');
    
    // Создаем контейнер для логов
    this.container = document.createElement('div');
    this.container.id = 'on-screen-logger';
    this.container.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      max-height: 40vh;
      background: rgba(0, 0, 0, 0.95);
      color: #0f0;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      padding: 10px;
      overflow-y: auto;
      z-index: 9999;
      border-top: 2px solid #0f0;
      display: none;
      pointer-events: auto;
    `;

    // Заголовок
    const header = document.createElement('div');
    header.style.cssText = `
      position: sticky;
      top: 0;
      background: rgba(0, 0, 0, 0.95);
      padding: 5px 0;
      margin-bottom: 5px;
      border-bottom: 1px solid #0f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const title = document.createElement('span');
    title.textContent = '📋 LOGS';
    title.style.fontWeight = 'bold';

    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 5px;';

    // Кнопка очистки
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '🗑️';
    clearBtn.style.cssText = `
      background: rgba(255, 0, 0, 0.3);
      color: #f00;
      border: 1px solid #f00;
      padding: 2px 8px;
      cursor: pointer;
      border-radius: 3px;
      font-size: 14px;
    `;
    clearBtn.onclick = () => this.clear();

    // Кнопка закрытия
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '❌';
    closeBtn.style.cssText = `
      background: rgba(255, 255, 0, 0.3);
      color: #ff0;
      border: 1px solid #ff0;
      padding: 2px 8px;
      cursor: pointer;
      border-radius: 3px;
      font-size: 14px;
    `;
    closeBtn.onclick = () => this.hide();

    controls.appendChild(clearBtn);
    controls.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(controls);

    // Область логов
    this.logArea = document.createElement('div');
    this.logArea.id = 'log-area';

    this.container.appendChild(header);
    this.container.appendChild(this.logArea);
    document.body.appendChild(this.container);
    console.log('✅ OnScreenLogger контейнер добавлен в DOM');

    // Кнопка открытия (плавающая)
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.textContent = '📋';
    this.toggleBtn.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      z-index: 9998;
      padding: 10px 15px;
      font-size: 20px;
      background: rgba(0, 255, 0, 0.8);
      color: #000;
      border: 2px solid #0f0;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0, 255, 0, 0.5);
    `;
    this.toggleBtn.onclick = () => {
      console.log('🔘 Кнопка логгера нажата, текущий статус:', this.isVisible);
      this.toggle();
    };
    document.body.appendChild(this.toggleBtn);
    console.log('✅ OnScreenLogger кнопка добавлена в DOM');
    
    console.log('✅ OnScreenLogger.init() завершен');
  }

  interceptConsole() {
    // Сохраняем оригинальные методы
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    // Перехватываем console.log
    console.log = (...args) => {
      originalLog.apply(console, args);
      this.addLog('LOG', args);
    };

    // Перехватываем console.warn
    console.warn = (...args) => {
      originalWarn.apply(console, args);
      this.addLog('WARN', args);
    };

    // Перехватываем console.error
    console.error = (...args) => {
      originalError.apply(console, args);
      this.addLog('ERROR', args);
    };

    // Перехватываем console.info
    console.info = (...args) => {
      originalInfo.apply(console, args);
      this.addLog('INFO', args);
    };

    // Перехватываем необработанные ошибки
    window.addEventListener('error', (e) => {
      this.addLog('ERROR', [`${e.message} at ${e.filename}:${e.lineno}`]);
    });

    // Перехватываем необработанные promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      this.addLog('ERROR', [`Unhandled Promise: ${e.reason}`]);
    });
  }

  addLog(type, args) {
    const timestamp = new Date().toLocaleTimeString();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    this.logs.push({ type, timestamp, message });

    // Ограничиваем количество логов
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.render();
  }

  render() {
    if (!this.logArea) return;

    this.logArea.innerHTML = '';

    this.logs.forEach(log => {
      const logEntry = document.createElement('div');
      logEntry.style.cssText = `
        margin: 3px 0;
        padding: 5px;
        border-left: 3px solid ${this.getLogColor(log.type)};
        background: rgba(0, 0, 0, 0.5);
        word-wrap: break-word;
        white-space: pre-wrap;
      `;

      const header = document.createElement('div');
      header.style.cssText = `
        color: ${this.getLogColor(log.type)};
        font-weight: bold;
        margin-bottom: 2px;
      `;
      header.textContent = `[${log.timestamp}] ${log.type}`;

      const content = document.createElement('div');
      content.style.cssText = `
        color: #ccc;
        font-size: 10px;
      `;
      content.textContent = log.message;

      logEntry.appendChild(header);
      logEntry.appendChild(content);
      this.logArea.appendChild(logEntry);
    });

    // Автоскролл вниз
    if (this.autoScroll && this.isVisible) {
      this.container.scrollTop = this.container.scrollHeight;
    }
  }

  getLogColor(type) {
    switch (type) {
      case 'ERROR': return '#f00';
      case 'WARN': return '#ff0';
      case 'INFO': return '#0af';
      case 'LOG':
      default: return '#0f0';
    }
  }

  show() {
    console.log('🔓 OnScreenLogger.show() вызван');
    console.log('📦 container:', this.container);
    console.log('🔘 toggleBtn:', this.toggleBtn);
    
    if (!this.container) {
      console.error('❌ Контейнер логгера не найден!');
      return;
    }
    
    this.isVisible = true;
    this.container.style.display = 'block';
    
    if (this.toggleBtn) {
      this.toggleBtn.textContent = '📋✓';
      this.toggleBtn.style.background = 'rgba(0, 255, 0, 1)';
    }
    
    console.log('✅ Логгер должен быть виден. display:', this.container.style.display);
    console.log('✅ isVisible:', this.isVisible);
  }

  hide() {
    this.isVisible = false;
    this.container.style.display = 'none';
    this.toggleBtn.textContent = '📋';
    this.toggleBtn.style.background = 'rgba(0, 255, 0, 0.8)';
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  clear() {
    this.logs = [];
    this.render();
  }

  // Метод для программного добавления логов
  log(message, type = 'LOG') {
    this.addLog(type, [message]);
  }
}