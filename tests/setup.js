// ===================================
// ФАЙЛ: tests/setup.js
// Jest setup - моки и глобальные настройки
// ===================================

import { jest } from '@jest/globals';
import 'jest-canvas-mock';
import '@testing-library/jest-dom';

// Mock WebXR API
global.navigator.xr = {
  isSessionSupported: jest.fn(async () => true),
  requestSession: jest.fn(async () => ({
    requestReferenceSpace: jest.fn(async () => ({})),
    requestHitTestSource: jest.fn(async () => ({})),
    requestAnimationFrame: jest.fn(cb => setTimeout(cb, 16)),
    end: jest.fn(async () => {})
  }))
};

// Mock WebGL context
HTMLCanvasElement.prototype.getContext = jest.fn((type) => {
  if (type === 'webgl' || type === 'webgl2') {
    return {
      canvas: document.createElement('canvas'),
      drawingBufferWidth: 800,
      drawingBufferHeight: 600,
      getParameter: jest.fn(),
      getExtension: jest.fn(),
      createShader: jest.fn(),
      shaderSource: jest.fn(),
      compileShader: jest.fn(),
      createProgram: jest.fn(),
      attachShader: jest.fn(),
      linkProgram: jest.fn(),
      useProgram: jest.fn(),
      createBuffer: jest.fn(),
      bindBuffer: jest.fn(),
      bufferData: jest.fn(),
      enableVertexAttribArray: jest.fn(),
      vertexAttribPointer: jest.fn(),
      drawArrays: jest.fn(),
      clear: jest.fn(),
      clearColor: jest.fn(),
      viewport: jest.fn()
    };
  }
  return null;
});

// Mock GLTFLoader
global.GLTFLoader = class {
  load(path, onLoad, onProgress, onError) {
    // Симулируем успешную загрузку
    setTimeout(() => {
      onLoad({
        scene: {
          clone: () => ({
            traverse: jest.fn(),
            position: { set: jest.fn() },
            rotation: { set: jest.fn(), y: 0 },
            scale: { setScalar: jest.fn() },
            visible: true
          })
        }
      });
    }, 10);
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock performance.now
global.performance.now = jest.fn(() => Date.now());

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
};
