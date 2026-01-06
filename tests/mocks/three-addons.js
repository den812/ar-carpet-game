// ===================================
// ФАЙЛ: tests/mocks/three-addons.js
// Mock для Three.js addons
// ===================================

import { jest } from '@jest/globals';

export class GLTFLoader {
  load(path, onLoad, onProgress, onError) {
    setTimeout(() => {
      const mockModel = {
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
      
      // ВАЖНО: clone должна возвращать новый объект с теми же методами
      mockModel.clone = jest.fn(() => ({
        ...mockModel,
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
        children: [],
        clone: jest.fn()
      }));
      
      onLoad({
        scene: mockModel
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
