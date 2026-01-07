// ===================================
// ФАЙЛ: tests/mocks/three-addons.js
// Mock для Three.js addons
// ИСПРАВЛЕНО V29: GLTFLoader возвращает правильный клонируемый объект
// ===================================

import { jest } from '@jest/globals';

// Функция для создания мок-модели с возможностью клонирования
function createMockModel() {
  const model = {
    traverse: jest.fn(),
    position: { 
      set: jest.fn(),
      x: 0, 
      y: 0, 
      z: 0 
    },
    rotation: { 
      set: jest.fn(), 
      y: 0 
    },
    scale: { 
      setScalar: jest.fn(),
      x: 1,
      y: 1,
      z: 1
    },
    visible: true,
    children: []
  };
  
  // ✅ FIX: clone() должен создавать новый независимый объект
  model.clone = jest.fn(() => createMockModel());
  
  return model;
}

export class GLTFLoader {
  load(path, onLoad, onProgress, onError) {
    setTimeout(() => {
      onLoad({
        scene: createMockModel()
      });
    }, 10);
  }
}

export const ARButton = {
  createButton: jest.fn((renderer, options) => {
    const button = document.createElement('button');
    button.textContent = 'AR';
    return button;
  })
};