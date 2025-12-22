// ===================================
// ФАЙЛ: src/ui/ControlPanel.js V2
// УЛУЧШЕНО: Контроль каждой модели отдельно
// ===================================

export class ControlPanel {
  constructor(trafficManager) {
    this.trafficManager = trafficManager;
    this.panel = null;
    this.isVisible = false;
    
    // Конфигурация моделей
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
    this.panel.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      padding: 15px;
      border-radius: 10px;
      border: 2px solid #00ff00;
      box-shadow: 0 0 30px rgba(0, 255, 0, 0.4);
      z-index: 1000;
      min-width: 320px;
      max-width: 350px;
      backdrop-filter: blur(10px);
      pointer-events: all;
      max-height: 80vh;
      overflow-y: auto;
    `;

    let modelsHTML = this.models.map((model, idx) => `
      <div style="
        margin-bottom: 20px; 
        padding: 12px; 
        background: rgba(0, 0, 0, 0.5);
        border-radius: 8px;
        border: 1px solid ${model.color};
        box-shadow: 0 0 10px ${model.color}40;
      ">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <strong style="color: ${model.color}; font-size: 15px;">${model.label}</strong>
          <span id="model-count-${idx}" style="
            background: ${model.color}; 
            color: #000; 
            padding: 3px 10px; 
            border-radius: 12px;
            font-weight: bold;
            font-size: 14px;
          ">${model.count}</span>
        </div>
        
        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px; color: #aaa;">
            🔍 Масштаб: <span id="scale-value-${idx}" style="color: ${model.color};">${model.scale.toFixed(1)}x</span>
          </label>
          <input 
            type="range" 
            id="scale-slider-${idx}" 
            min="0.1" 
            max="10.0" 
            step="0.2" 
            value="${model.scale}"
            style="width: 100%; cursor: pointer;"
          />
        </div>
        
        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px; color: #aaa;">
            🚗 Количество: <span id="count-value-${idx}" style="color: ${model.color};">${model.count}</span>
          </label>
          <input 
            type="range" 
            id="count-slider-${idx}" 
            min="0" 
            max="10" 
            step="1" 
            value="${model.count}"
            style="width: 100%; cursor: pointer;"
          />
        </div>
        
        <div style="display: flex; gap: 8px;">
          <button id="add-${idx}" style="
            flex: 1;
            padding: 6px;
            background: ${model.color};
            color: #000;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            font-size: 11px;
          ">+ Добавить</button>
          
          <button id="remove-${idx}" style="
            flex: 1;
            padding: 6px;
            background: #666;
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            font-size: 11px;
          ">- Убрать</button>
        </div>
      </div>
    `).join('');

    this.panel.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 15px; border-bottom: 2px solid #00ff00; padding-bottom: 10px;">
        <span style="font-size: 22px;">🎛️</span>
        <strong style="color: #00ff00; text-shadow: 0 0 8px #00ff00; font-size: 16px;">УПРАВЛЕНИЕ МАШИНАМИ</strong>
      </div>
      
      ${modelsHTML}
      
      <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #00ff00;">
        <button id="reset-all-btn" style="
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #ffaa00 0%, #ff8800 100%);
          color: #000;
          border: 2px solid #ffaa00;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 4px 10px rgba(255, 170, 0, 0.3);
        ">🔄 СБРОСИТЬ ВСЁ</button>
      </div>
      
      <div style="margin-top: 15px; padding: 10px; background: rgba(0, 255, 0, 0.1); border-radius: 5px; border: 1px solid #00ff00;">
        <div style="font-size: 11px; color: #aaa;">
          Всего машин: <span id="total-cars" style="color: #00ff00; font-weight: bold;">7</span>
        </div>
      </div>
    `;

    document.body.appendChild(this.panel);
    this.isVisible = true;

    this.attachEventListeners();
  }

  attachEventListeners() {
    this.models.forEach((model, idx) => {
      // Слайдер масштаба
      const scaleSlider = document.getElementById(`scale-slider-${idx}`);
      const scaleValue = document.getElementById(`scale-value-${idx}`);
      
      scaleSlider.addEventListener('input', (e) => {
        const scale = parseFloat(e.target.value);
        scaleValue.textContent = scale.toFixed(1) + 'x';
        model.scale = scale;
        this.updateModelScale(model.name, scale);
      });

      // Слайдер количества
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

      // Кнопка добавить
      document.getElementById(`add-${idx}`).addEventListener('click', async () => {
        await this.spawnSpecificModel(model.name);
        model.count++;
        countSlider.value = model.count;
        countValue.textContent = model.count;
        countBadge.textContent = model.count;
        this.updateTotalCount();
      });

      // Кнопка убрать
      document.getElementById(`remove-${idx}`).addEventListener('click', () => {
        if (this.removeSpecificModel(model.name)) {
          model.count = Math.max(0, model.count - 1);
          countSlider.value = model.count;
          countValue.textContent = model.count;
          countBadge.textContent = model.count;
          this.updateTotalCount();
        }
      });
    });

    // Кнопка сброса
    document.getElementById('reset-all-btn').addEventListener('click', () => {
      this.resetAll();
    });
  }

  updateModelScale(modelName, scale) {
    // Применяем масштаб ко всем машинам этой модели
    this.trafficManager.cars.forEach(car => {
      if (car.modelName === modelName) {
        const baseScale = 0.002; // ✅ из config.js
        const modelMultiplier = this.getModelMultiplier(modelName);
        car.model.scale.setScalar(baseScale * modelMultiplier * scale);
      }
    });
  }

  getModelMultiplier(modelName) {
    const multipliers = {
      "Buggy.glb": 0.8,
      "Duck.glb": 1.2,
      "CesiumMilkTruck.glb": 1.0
    };
    return multipliers[modelName] || 1.0;
  }

  async spawnSpecificModel(modelName) {
    const modelData = this.trafficManager.carModels.getModelByName(modelName);
    if (!modelData) {
      console.error(`❌ Модель ${modelName} не найдена`);
      return;
    }

    // ✅ Создаем новую машину напрямую, не используя пул
    const car = await this.trafficManager.spawnCarWithModel(modelData);
    if (car) {
      const modelConfig = this.models.find(m => m.name === modelName);
      if (modelConfig) {
        this.updateModelScale(modelName, modelConfig.scale);
      }
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
        this.spawnSpecificModel(modelName); // async но не ждем
      }
    } else if (targetCount < currentCount) {
      for (let i = 0; i < currentCount - targetCount; i++) {
        this.removeSpecificModel(modelName);
      }
    }
  }

  resetAll() {
    // Сбрасываем все модели
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