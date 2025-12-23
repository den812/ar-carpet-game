// ===================================
// ФАЙЛ: src/ui/ControlPanel.js
// ИСПРАВЛЕНО:
// - Панель теперь сворачивается как StatsPanel
// - На мобильных занимает меньше места
// - Добавлена кнопка сворачивания
// ===================================

export class ControlPanel {
  constructor(trafficManager) {
    this.trafficManager = trafficManager;
    this.panel = null;
    this.isVisible = false;
    this.isExpanded = false; // ✅ НОВОЕ: состояние свернуто/развернуто
    
    this.models = [
      { name: 'Buggy.glb', label: '🏎️ Buggy', count: 3, scale: 1.0, color: '#ff6b6b' },
      { name: 'CesiumMilkTruck.glb', label: '🚚 Milk Truck', count: 2, scale: 1.0, color: '#4ecdc4' },
      { name: 'Duck.glb', label: '🦆 Duck', count: 2, scale: 1.0, color: '#ffe66d' }
    ];
  }

  show() {
    if (this.panel) return;

    this.panel = document.createElement('div');
    this.panel.id = 'control-panel';
    
    // ✅ НОВОЕ: Компактный стиль по умолчанию (свернута)
    this.panel.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      padding: 12px;
      border-radius: 10px;
      border: 2px solid #00ff00;
      box-shadow: 0 0 30px rgba(0, 255, 0, 0.4);
      z-index: 1000;
      min-width: 200px;
      max-width: 350px;
      backdrop-filter: blur(10px);
      pointer-events: all;
      max-height: 80vh;
      overflow-y: auto;
      cursor: pointer;
      transition: all 0.3s ease;
    `;

    // ✅ НОВОЕ: Заголовок с кнопкой сворачивания
    let headerHTML = `
      <div id="control-header" style="
        display: flex; 
        align-items: center; 
        gap: 8px; 
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 2px solid #00ff00;
      ">
        <span style="font-size: 20px;">🎛️</span>
        <strong style="color: #00ff00; text-shadow: 0 0 8px #00ff00; font-size: 15px; flex: 1;">
          УПРАВЛЕНИЕ
        </strong>
        <span id="expand-icon-control" style="font-size: 16px; margin-left: auto;">▼</span>
      </div>
    `;

    let modelsHTML = this.models.map((model, idx) => `
      <div class="model-control" data-model-idx="${idx}" style="
        margin-bottom: 15px; 
        padding: 10px; 
        background: rgba(0, 0, 0, 0.5);
        border-radius: 8px;
        border: 1px solid ${model.color};
        box-shadow: 0 0 10px ${model.color}40;
      ">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <strong style="color: ${model.color}; font-size: 14px;">${model.label}</strong>
          <span id="model-count-${idx}" style="
            background: ${model.color}; 
            color: #000; 
            padding: 2px 8px; 
            border-radius: 10px;
            font-weight: bold;
            font-size: 13px;
          ">${model.count}</span>
        </div>
        
        <div style="margin-bottom: 8px;">
          <label style="display: block; margin-bottom: 4px; color: #aaa; font-size: 11px;">
            🔍 Масштаб: <span id="scale-value-${idx}" style="color: ${model.color};">${model.scale.toFixed(1)}x</span>
          </label>
          <input 
            type="range" 
            id="scale-slider-${idx}" 
            min="0.1" 
            max="10.0" 
            step="0.2" 
            value="${model.scale}"
            style="width: 100%; cursor: pointer; height: 20px;"
          />
        </div>
        
        <div style="margin-bottom: 8px;">
          <label style="display: block; margin-bottom: 4px; color: #aaa; font-size: 11px;">
            🚗 Количество: <span id="count-value-${idx}" style="color: ${model.color};">${model.count}</span>
          </label>
          <input 
            type="range" 
            id="count-slider-${idx}" 
            min="0" 
            max="10" 
            step="1" 
            value="${model.count}"
            style="width: 100%; cursor: pointer; height: 20px;"
          />
        </div>
        
        <div style="display: flex; gap: 6px;">
          <button id="add-${idx}" style="
            flex: 1;
            padding: 5px;
            background: ${model.color};
            color: #000;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            font-size: 10px;
          ">+</button>
          
          <button id="remove-${idx}" style="
            flex: 1;
            padding: 5px;
            background: #666;
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            font-size: 10px;
          ">-</button>
        </div>
      </div>
    `).join('');

    let footerHTML = `
      <div id="control-footer" style="margin-top: 12px; padding-top: 12px; border-top: 2px solid #00ff00;">
        <button id="reset-all-btn" style="
          width: 100%;
          padding: 10px;
          background: linear-gradient(135deg, #ffaa00 0%, #ff8800 100%);
          color: #000;
          border: 2px solid #ffaa00;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 4px 10px rgba(255, 170, 0, 0.3);
        ">🔄 СБРОСИТЬ</button>
        
        <div style="margin-top: 10px; padding: 8px; background: rgba(0, 255, 0, 0.1); border-radius: 5px; border: 1px solid #00ff00;">
          <div style="font-size: 10px; color: #aaa;">
            Всего: <span id="total-cars" style="color: #00ff00; font-weight: bold;">7</span>
          </div>
        </div>
      </div>
    `;

    // ✅ НОВОЕ: Контент который сворачивается
    this.panel.innerHTML = `
      ${headerHTML}
      <div id="control-content" style="display: none;">
        ${modelsHTML}
        ${footerHTML}
      </div>
    `;

    document.body.appendChild(this.panel);
    this.isVisible = true;

    // ✅ НОВОЕ: Обработчик клика на заголовок для сворачивания
    const header = this.panel.querySelector('#control-header');
    header.addEventListener('click', (e) => {
      // Не сворачивать если кликнули на контролы внутри
      if (e.target.closest('.model-control') || e.target.closest('button')) return;
      this.toggle();
    });

    this.attachEventListeners();
  }

  // ✅ НОВАЯ ФУНКЦИЯ: Сворачивание/разворачивание
  toggle() {
    if (!this.panel) return;
    
    this.isExpanded = !this.isExpanded;
    const content = this.panel.querySelector('#control-content');
    const icon = this.panel.querySelector('#expand-icon-control');
    
    if (this.isExpanded) {
      content.style.display = 'block';
      icon.textContent = '▲';
      this.panel.style.cursor = 'default';
    } else {
      content.style.display = 'none';
      icon.textContent = '▼';
      this.panel.style.cursor = 'pointer';
    }
  }

  attachEventListeners() {
    this.models.forEach((model, idx) => {
      const scaleSlider = document.getElementById(`scale-slider-${idx}`);
      const scaleValue = document.getElementById(`scale-value-${idx}`);
      
      scaleSlider.addEventListener('input', (e) => {
        const scale = parseFloat(e.target.value);
        scaleValue.textContent = scale.toFixed(1) + 'x';
        model.scale = scale;
        this.updateModelScale(model.name, scale);
      });

      const countSlider = document.getElementById(`count-slider-${idx}`);
      const countValue = document.getElementById(`count-value-${idx}`);
      const countBadge = document.getElementById(`model-count-${idx}`);
      
      countSlider.addEventListener('input', (e) => {
        const count = parseInt(e.target.value);
        countValue.textContent = count;
        countBadge.textContent = count;
      });

      countSlider.addEventListener('change', (e) => {
        const targetCount = parseInt(e.target.value);
        this.setModelCount(model.name, targetCount);
        model.count = targetCount;
        this.updateTotalCount();
      });

      document.getElementById(`add-${idx}`).addEventListener('click', async (e) => {
        e.stopPropagation(); // ✅ Предотвращаем сворачивание
        console.log(`🔘 Кнопка добавить: ${model.name}`);
        await this.spawnSpecificModel(model.name);
        model.count++;
        countSlider.value = model.count;
        countValue.textContent = model.count;
        countBadge.textContent = model.count;
        this.updateTotalCount();
      });

      document.getElementById(`remove-${idx}`).addEventListener('click', (e) => {
        e.stopPropagation(); // ✅ Предотвращаем сворачивание
        if (this.removeSpecificModel(model.name)) {
          model.count = Math.max(0, model.count - 1);
          countSlider.value = model.count;
          countValue.textContent = model.count;
          countBadge.textContent = model.count;
          this.updateTotalCount();
        }
      });
    });

    document.getElementById('reset-all-btn').addEventListener('click', (e) => {
      e.stopPropagation(); // ✅ Предотвращаем сворачивание
      this.resetAll();
    });
  }

  updateModelScale(modelName, scale) {
    this.trafficManager.cars.forEach(car => {
      if (car.modelName === modelName) {
        const baseScale = 0.002;
        const modelMultiplier = this.getModelMultiplier(modelName);
        car.model.scale.setScalar(baseScale * modelMultiplier * scale);
      }
    });
  }

  getModelMultiplier(modelName) {
    const multipliers = {
      "Buggy.glb": 0.3,
      "Duck.glb": 10.0,
      "CesiumMilkTruck.glb": 8.5
    };
    return multipliers[modelName] || 1.0;
  }

  async spawnSpecificModel(modelName) {
    console.log(`🚗 Попытка спавна модели: ${modelName}`);
    
    const modelData = this.trafficManager.carModels.getModelByName(modelName);
    if (!modelData) {
      console.error(`❌ Модель ${modelName} не найдена в carModels`);
      console.log('Доступные модели:', this.trafficManager.carModels.models.map(m => m.name));
      return;
    }

    console.log(`✅ Модель ${modelName} найдена, спавним...`);
    
    const car = await this.trafficManager.spawnCarWithModel(modelData);
    if (car) {
      console.log(`✅ Машина ${modelName} успешно заспавнена`);
      const modelConfig = this.models.find(m => m.name === modelName);
      if (modelConfig) {
        this.updateModelScale(modelName, modelConfig.scale);
      }
    } else {
      console.error(`❌ Не удалось заспавнить ${modelName}`);
    }
  }

  removeSpecificModel(modelName) {
    const car = this.trafficManager.cars.find(c => c.isActive && c.modelName === modelName);
    if (car) {
      car.despawn();
      this.trafficManager.carPool.push(car);
      return true;
    }
    return false;
  }

  setModelCount(modelName, targetCount) {
    const currentCars = this.trafficManager.cars.filter(c => c.isActive && c.modelName === modelName);
    const currentCount = currentCars.length;

    if (targetCount > currentCount) {
      for (let i = 0; i < targetCount - currentCount; i++) {
        this.spawnSpecificModel(modelName);
      }
    } else if (targetCount < currentCount) {
      for (let i = 0; i < currentCount - targetCount; i++) {
        this.removeSpecificModel(modelName);
      }
    }
  }

  resetAll() {
    this.models.forEach((model, idx) => {
      model.scale = 1.0;
      model.count = idx === 0 ? 3 : 2;

      document.getElementById(`scale-slider-${idx}`).value = 1.0;
      document.getElementById(`scale-value-${idx}`).textContent = '1.0x';
      document.getElementById(`count-slider-${idx}`).value = model.count;
      document.getElementById(`count-value-${idx}`).textContent = model.count;
      document.getElementById(`model-count-${idx}`).textContent = model.count;

      this.setModelCount(model.name, model.count);
      this.updateModelScale(model.name, 1.0);
    });

    this.updateTotalCount();
  }

  updateTotalCount() {
    const total = this.models.reduce((sum, model) => sum + model.count, 0);
    const totalEl = document.getElementById('total-cars');
    if (totalEl) {
      totalEl.textContent = total;
    }
  }

  hide() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
      this.isVisible = false;
    }
  }
}